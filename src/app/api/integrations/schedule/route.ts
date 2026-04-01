import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const maxDuration = 60

async function verifyUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const token = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1])
    return token.uid
  } catch {
    return null
  }
}

// ==================== GET — List scheduled posts ====================

export async function GET(req: NextRequest) {
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let q = adminDb
    .collection('scheduled_posts')
    .where('userId', '==', userId)
    .orderBy('scheduledAt', 'asc')

  if (status) {
    q = adminDb
      .collection('scheduled_posts')
      .where('userId', '==', userId)
      .where('status', '==', status)
      .orderBy('scheduledAt', 'asc')
  }

  const snap = await q.get()
  const posts = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    scheduledAt: d.data().scheduledAt?.toDate(),
    publishedAt: d.data().publishedAt?.toDate(),
    createdAt: d.data().createdAt?.toDate(),
    updatedAt: d.data().updatedAt?.toDate(),
  }))

  return NextResponse.json({ posts })
}

// ==================== POST — Create or update schedule ====================

export async function POST(req: NextRequest) {
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  switch (action) {
    case 'create':
      return handleCreate(userId, body)
    case 'update':
      return handleUpdate(userId, body)
    case 'cancel':
      return handleCancel(userId, body)
    case 'retry':
      return handleRetry(userId, body)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleCreate(
  userId: string,
  body: {
    generationId: string
    connectionId: string
    platform: string
    imageUrls: string[]
    caption?: string
    scheduledAt: string // ISO date
  }
) {
  const { generationId, connectionId, platform, imageUrls, caption, scheduledAt } = body
  if (!generationId || !connectionId || !imageUrls?.length || !scheduledAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const schedDate = new Date(scheduledAt)
  if (schedDate <= new Date()) {
    return NextResponse.json({ error: 'Scheduled date must be in the future' }, { status: 400 })
  }

  // Verify connection belongs to user
  const connSnap = await adminDb.collection('meta_connections').doc(connectionId).get()
  if (!connSnap.exists || connSnap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const docRef = await adminDb.collection('scheduled_posts').add({
    userId,
    generationId,
    connectionId,
    platform,
    imageUrls,
    caption: caption || '',
    scheduledAt: schedDate,
    status: 'scheduled',
    retryCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ id: docRef.id, status: 'scheduled', scheduledAt: schedDate })
}

async function handleUpdate(
  userId: string,
  body: { postId: string; scheduledAt?: string; caption?: string; imageUrls?: string[] }
) {
  const { postId, scheduledAt, caption, imageUrls } = body
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const docRef = adminDb.collection('scheduled_posts').doc(postId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (snap.data()?.status !== 'scheduled') {
    return NextResponse.json({ error: 'Can only update scheduled posts' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
  if (scheduledAt) {
    const d = new Date(scheduledAt)
    if (d <= new Date()) {
      return NextResponse.json({ error: 'Scheduled date must be in the future' }, { status: 400 })
    }
    updates.scheduledAt = d
  }
  if (caption !== undefined) updates.caption = caption
  if (imageUrls) updates.imageUrls = imageUrls

  await docRef.update(updates)
  return NextResponse.json({ success: true })
}

async function handleCancel(userId: string, body: { postId: string }) {
  const { postId } = body
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const docRef = adminDb.collection('scheduled_posts').doc(postId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (snap.data()?.status !== 'scheduled') {
    return NextResponse.json({ error: 'Can only cancel scheduled posts' }, { status: 400 })
  }

  await docRef.update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ success: true })
}

async function handleRetry(userId: string, body: { postId: string }) {
  const { postId } = body
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const docRef = adminDb.collection('scheduled_posts').doc(postId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (snap.data()?.status !== 'failed') {
    return NextResponse.json({ error: 'Can only retry failed posts' }, { status: 400 })
  }

  // Set to scheduled with 1 minute from now
  await docRef.update({
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 60_000),
    retryCount: FieldValue.increment(1),
    errorMessage: null,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ success: true })
}
