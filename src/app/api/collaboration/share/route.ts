import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export const maxDuration = 30

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

// ==================== GET — List shares or get by public link ====================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const publicToken = searchParams.get('token')

  // Public link access — no auth required
  if (publicToken) {
    const snap = await adminDb
      .collection('shared_generations')
      .where('publicLink', '==', publicToken)
      .where('publicLinkEnabled', '==', true)
      .limit(1)
      .get()

    if (snap.empty) {
      return NextResponse.json({ error: 'Share link not found or disabled' }, { status: 404 })
    }

    const shareDoc = snap.docs[0]
    const shareData = shareDoc.data()

    // Check expiry
    if (shareData.expiresAt && shareData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Fetch the generation data
    const genSnap = await adminDb
      .collection('creative_generations')
      .doc(shareData.generationId)
      .get()

    if (!genSnap.exists) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    return NextResponse.json({
      share: { id: shareDoc.id, ...shareData },
      generation: { id: genSnap.id, ...genSnap.data() },
    })
  }

  // Authenticated list
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Shares I created
  const myShares = await adminDb
    .collection('shared_generations')
    .where('sharedBy', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()

  const shares = myShares.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
    expiresAt: d.data().expiresAt?.toDate(),
  }))

  return NextResponse.json({ shares })
}

// ==================== POST — Create, update, or revoke shares ====================

export async function POST(req: NextRequest) {
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  switch (action) {
    case 'create':
      return handleCreateShare(userId, body)
    case 'add_recipient':
      return handleAddRecipient(userId, body)
    case 'remove_recipient':
      return handleRemoveRecipient(userId, body)
    case 'toggle_public':
      return handleTogglePublic(userId, body)
    case 'revoke':
      return handleRevoke(userId, body)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleCreateShare(
  userId: string,
  body: {
    generationId: string
    recipients?: Array<{ email: string; permission: string }>
    publicLinkEnabled?: boolean
    expiresInDays?: number
  }
) {
  const { generationId, recipients, publicLinkEnabled, expiresInDays } = body
  if (!generationId) {
    return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
  }

  // Verify the generation belongs to the user
  const genSnap = await adminDb.collection('creative_generations').doc(generationId).get()
  if (!genSnap.exists || genSnap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  const publicLink = publicLinkEnabled ? crypto.randomBytes(24).toString('base64url') : undefined
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : undefined

  const docRef = await adminDb.collection('shared_generations').add({
    generationId,
    sharedBy: userId,
    sharedWith: (recipients || []).map((r) => ({
      email: r.email,
      permission: r.permission || 'view',
      acceptedAt: null,
    })),
    publicLink: publicLink || null,
    publicLinkEnabled: !!publicLinkEnabled,
    expiresAt: expiresAt || null,
    createdAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({
    id: docRef.id,
    publicLink: publicLink ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/${publicLink}` : null,
    expiresAt,
  })
}

async function handleAddRecipient(
  userId: string,
  body: { shareId: string; email: string; permission: string }
) {
  const { shareId, email, permission } = body
  if (!shareId || !email) {
    return NextResponse.json({ error: 'Missing shareId or email' }, { status: 400 })
  }

  const docRef = adminDb.collection('shared_generations').doc(shareId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.sharedBy !== userId) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  await docRef.update({
    sharedWith: FieldValue.arrayUnion({
      email,
      permission: permission || 'view',
      acceptedAt: null,
    }),
  })

  return NextResponse.json({ success: true })
}

async function handleRemoveRecipient(
  userId: string,
  body: { shareId: string; email: string }
) {
  const { shareId, email } = body
  const docRef = adminDb.collection('shared_generations').doc(shareId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.sharedBy !== userId) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  const currentWith = (snap.data()?.sharedWith || []) as Array<{ email: string }>
  const updated = currentWith.filter((r) => r.email !== email)
  await docRef.update({ sharedWith: updated })

  return NextResponse.json({ success: true })
}

async function handleTogglePublic(
  userId: string,
  body: { shareId: string; enabled: boolean }
) {
  const { shareId, enabled } = body
  const docRef = adminDb.collection('shared_generations').doc(shareId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.sharedBy !== userId) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { publicLinkEnabled: enabled }
  if (enabled && !snap.data()?.publicLink) {
    updates.publicLink = crypto.randomBytes(24).toString('base64url')
  }

  await docRef.update(updates)

  return NextResponse.json({
    success: true,
    publicLink: enabled
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/${updates.publicLink || snap.data()?.publicLink}`
      : null,
  })
}

async function handleRevoke(userId: string, body: { shareId: string }) {
  const { shareId } = body
  const docRef = adminDb.collection('shared_generations').doc(shareId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.sharedBy !== userId) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 })
  }

  await docRef.delete()
  return NextResponse.json({ success: true })
}
