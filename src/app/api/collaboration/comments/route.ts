import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const maxDuration = 30

async function verifyUser(req: NextRequest): Promise<{ uid: string; name: string; avatar?: string } | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const token = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1])
    return { uid: token.uid, name: token.name || token.email || 'User', avatar: token.picture }
  } catch {
    return null
  }
}

// ==================== GET — List comments for a generation ====================

export async function GET(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const generationId = searchParams.get('generationId')
  const imageIndex = searchParams.get('imageIndex')

  if (!generationId) {
    return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
  }

  let q = adminDb
    .collection('image_comments')
    .where('generationId', '==', generationId)
    .orderBy('createdAt', 'asc')

  if (imageIndex !== null && imageIndex !== undefined) {
    q = adminDb
      .collection('image_comments')
      .where('generationId', '==', generationId)
      .where('imageIndex', '==', parseInt(imageIndex))
      .orderBy('createdAt', 'asc')
  }

  const snap = await q.get()
  const comments = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  }))

  return NextResponse.json({ comments })
}

// ==================== POST — Add, edit, resolve, delete comments ====================

export async function POST(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  switch (action) {
    case 'create':
      return handleCreate(user, body)
    case 'edit':
      return handleEdit(user, body)
    case 'resolve':
      return handleResolve(user, body)
    case 'delete':
      return handleDelete(user, body)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleCreate(
  user: { uid: string; name: string; avatar?: string },
  body: {
    generationId: string
    imageIndex: number
    content: string
    pinX?: number
    pinY?: number
    parentId?: string
  }
) {
  const { generationId, imageIndex, content, pinX, pinY, parentId } = body
  if (!generationId || imageIndex === undefined || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Sanitize content (strip HTML, limit length)
  const sanitized = content.trim().slice(0, 2000)

  const docRef = await adminDb.collection('image_comments').add({
    generationId,
    imageIndex,
    userId: user.uid,
    userName: user.name,
    userAvatar: user.avatar || null,
    content: sanitized,
    pinX: typeof pinX === 'number' ? Math.min(100, Math.max(0, pinX)) : null,
    pinY: typeof pinY === 'number' ? Math.min(100, Math.max(0, pinY)) : null,
    parentId: parentId || null,
    resolved: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({
    id: docRef.id,
    userId: user.uid,
    userName: user.name,
    userAvatar: user.avatar,
    content: sanitized,
    pinX,
    pinY,
    parentId,
    resolved: false,
  })
}

async function handleEdit(
  user: { uid: string; name: string },
  body: { commentId: string; content: string }
) {
  const { commentId, content } = body
  if (!commentId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing commentId or content' }, { status: 400 })
  }

  const docRef = adminDb.collection('image_comments').doc(commentId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.userId !== user.uid) {
    return NextResponse.json({ error: 'Comment not found or not yours' }, { status: 404 })
  }

  const sanitized = content.trim().slice(0, 2000)
  await docRef.update({ content: sanitized, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ success: true })
}

async function handleResolve(
  user: { uid: string; name: string },
  body: { commentId: string; resolved: boolean }
) {
  const { commentId, resolved } = body
  if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })

  const docRef = adminDb.collection('image_comments').doc(commentId)
  const snap = await docRef.get()
  if (!snap.exists) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  await docRef.update({ resolved: !!resolved, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ success: true })
}

async function handleDelete(
  user: { uid: string; name: string },
  body: { commentId: string }
) {
  const { commentId } = body
  if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })

  const docRef = adminDb.collection('image_comments').doc(commentId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.userId !== user.uid) {
    return NextResponse.json({ error: 'Comment not found or not yours' }, { status: 404 })
  }

  // Also delete replies
  const replies = await adminDb
    .collection('image_comments')
    .where('parentId', '==', commentId)
    .get()

  const batch = adminDb.batch()
  batch.delete(docRef)
  replies.docs.forEach((r) => batch.delete(r.ref))
  await batch.commit()

  return NextResponse.json({ success: true })
}
