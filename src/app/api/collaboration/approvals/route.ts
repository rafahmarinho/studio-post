import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const maxDuration = 30

async function verifyUser(req: NextRequest): Promise<{ uid: string; name: string; email: string } | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    const token = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1])
    return { uid: token.uid, name: token.name || token.email || 'User', email: token.email || '' }
  } catch {
    return null
  }
}

// ==================== GET — List approval requests ====================

export async function GET(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'all' // 'sent' | 'received' | 'all'

  const requests: Array<Record<string, unknown>> = []

  if (filter === 'sent' || filter === 'all') {
    const sentSnap = await adminDb
      .collection('approval_requests')
      .where('requestedBy', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get()
    requests.push(
      ...sentSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        direction: 'sent',
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
        dueDate: d.data().dueDate?.toDate(),
      }))
    )
  }

  if (filter === 'received' || filter === 'all') {
    // Find requests where user is a reviewer
    const allSnap = await adminDb
      .collection('approval_requests')
      .orderBy('createdAt', 'desc')
      .get()

    const received = allSnap.docs
      .filter((d) => {
        const reviewers = d.data().reviewers || []
        return reviewers.some((r: { userId: string }) => r.userId === user.uid)
      })
      .map((d) => ({
        id: d.id,
        ...d.data(),
        direction: 'received',
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
        dueDate: d.data().dueDate?.toDate(),
      }))

    // Deduplicate (in case user also sent the request)
    const existingIds = new Set(requests.map((r) => r.id))
    requests.push(...received.filter((r) => !existingIds.has(r.id)))
  }

  // Sort by createdAt desc
  requests.sort((a, b) => {
    const da = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
    const db = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
    return db - da
  })

  return NextResponse.json({ requests })
}

// ==================== POST — Create, review, cancel ====================

export async function POST(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  switch (action) {
    case 'create':
      return handleCreate(user, body)
    case 'review':
      return handleReview(user, body)
    case 'cancel':
      return handleCancel(user, body)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleCreate(
  user: { uid: string; name: string; email: string },
  body: {
    generationId: string
    reviewers: Array<{ userId: string; email: string; displayName: string }>
    message?: string
    dueDays?: number
  }
) {
  const { generationId, reviewers, message, dueDays } = body
  if (!generationId || !reviewers?.length) {
    return NextResponse.json({ error: 'Missing generationId or reviewers' }, { status: 400 })
  }

  // Verify generation exists and belongs to user
  const genSnap = await adminDb.collection('creative_generations').doc(generationId).get()
  if (!genSnap.exists || genSnap.data()?.userId !== user.uid) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  const dueDate = dueDays ? new Date(Date.now() + dueDays * 86400000) : null

  const docRef = await adminDb.collection('approval_requests').add({
    generationId,
    requestedBy: user.uid,
    requestedByName: user.name,
    reviewers: reviewers.map((r) => ({
      userId: r.userId,
      email: r.email,
      displayName: r.displayName,
      status: 'pending_review',
      comment: null,
      reviewedAt: null,
    })),
    status: 'pending_review',
    dueDate,
    message: message?.trim().slice(0, 1000) || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ id: docRef.id, status: 'pending_review' })
}

async function handleReview(
  user: { uid: string; name: string },
  body: {
    requestId: string
    status: 'approved' | 'changes_requested' | 'rejected'
    comment?: string
  }
) {
  const { requestId, status, comment } = body
  if (!requestId || !status) {
    return NextResponse.json({ error: 'Missing requestId or status' }, { status: 400 })
  }

  const validStatuses = ['approved', 'changes_requested', 'rejected']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const docRef = adminDb.collection('approval_requests').doc(requestId)
  const snap = await docRef.get()
  if (!snap.exists) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const data = snap.data()!
  const reviewers = data.reviewers as Array<{
    userId: string
    email: string
    displayName: string
    status: string
    comment?: string
    reviewedAt?: Date
  }>

  const reviewerIndex = reviewers.findIndex((r) => r.userId === user.uid)
  if (reviewerIndex === -1) {
    return NextResponse.json({ error: 'You are not a reviewer for this request' }, { status: 403 })
  }

  // Update individual reviewer status
  reviewers[reviewerIndex] = {
    ...reviewers[reviewerIndex],
    status,
    comment: comment?.trim().slice(0, 1000) || undefined,
    reviewedAt: new Date(),
  }

  // Determine overall status
  const allReviewed = reviewers.every((r) => r.status !== 'pending_review')
  const anyRejected = reviewers.some((r) => r.status === 'rejected')
  const anyChangesRequested = reviewers.some((r) => r.status === 'changes_requested')
  const allApproved = reviewers.every((r) => r.status === 'approved')

  let overallStatus = 'pending_review'
  if (allReviewed) {
    if (anyRejected) overallStatus = 'rejected'
    else if (anyChangesRequested) overallStatus = 'changes_requested'
    else if (allApproved) overallStatus = 'approved'
  } else if (anyRejected) {
    overallStatus = 'rejected'
  } else if (anyChangesRequested) {
    overallStatus = 'changes_requested'
  }

  await docRef.update({
    reviewers,
    status: overallStatus,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ success: true, overallStatus })
}

async function handleCancel(
  user: { uid: string },
  body: { requestId: string }
) {
  const { requestId } = body
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })

  const docRef = adminDb.collection('approval_requests').doc(requestId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.requestedBy !== user.uid) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  await docRef.delete()
  return NextResponse.json({ success: true })
}
