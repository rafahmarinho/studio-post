import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export const maxDuration = 60

const TENANTS_COLLECTION = 'tenants'

// GET — Get tenant by ID or list user's tenants
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('id')

    if (tenantId) {
      const doc = await adminDb.collection(TENANTS_COLLECTION).doc(tenantId).get()
      if (!doc.exists) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }

      const data = doc.data()!
      // Verify user is a member
      const isMember = data.members?.some((m: { userId: string }) => m.userId === userId)
      if (!isMember && data.ownerId !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      return NextResponse.json({ tenant: { id: doc.id, ...data } })
    }

    // List tenants where user is a member
    const snap = await adminDb
      .collection(TENANTS_COLLECTION)
      .where('memberIds', 'array-contains', userId)
      .get()

    const tenants = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Tenants GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST — Create a new tenant
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email') || ''
    const userName = request.headers.get('x-user-name') || ''

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Tenant name is required' }, { status: 400 })
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)

    // Check slug uniqueness
    const existing = await adminDb
      .collection(TENANTS_COLLECTION)
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'A workspace with this name already exists' },
        { status: 409 }
      )
    }

    const doc = {
      name: body.name.substring(0, 100),
      slug,
      ownerId: userId,
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || '#7c3aed',
      plan: body.plan || 'starter',
      settings: {
        allowMemberOwnKeys: body.settings?.allowMemberOwnKeys ?? true,
        defaultTier: body.settings?.defaultTier || 'free',
        dailyLimitCents: body.settings?.dailyLimitCents || 30000,
        watermark: body.settings?.watermark || null,
        customDomain: null,
        webhookUrl: null,
      },
      members: [
        {
          userId,
          email: userEmail,
          displayName: userName,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
      ],
      memberIds: [userId], // Flat array for Firestore queries
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await adminDb.collection(TENANTS_COLLECTION).add(doc)

    return NextResponse.json({ id: docRef.id, ...doc }, { status: 201 })
  } catch (error) {
    console.error('Tenants POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT — Update tenant settings
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const existing = await adminDb.collection(TENANTS_COLLECTION).doc(body.id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const data = existing.data()!
    const member = data.members?.find((m: { userId: string }) => m.userId === userId)
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Only owners/admins can update tenant' }, { status: 403 })
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

    if (body.name) updates.name = body.name.substring(0, 100)
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl
    if (body.primaryColor) updates.primaryColor = body.primaryColor
    if (body.plan && data.ownerId === userId) updates.plan = body.plan
    if (body.settings) {
      updates.settings = {
        ...data.settings,
        ...body.settings,
      }
    }

    await adminDb.collection(TENANTS_COLLECTION).doc(body.id).update(updates)

    return NextResponse.json({ id: body.id, ...updates })
  } catch (error) {
    console.error('Tenants PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH — Manage members (invite, remove, change role)
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.tenantId || !body.action) {
      return NextResponse.json({ error: 'tenantId and action required' }, { status: 400 })
    }

    const tenantRef = adminDb.collection(TENANTS_COLLECTION).doc(body.tenantId)
    const tenantDoc = await tenantRef.get()
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const data = tenantDoc.data()!
    const requester = data.members?.find((m: { userId: string }) => m.userId === userId)
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    switch (body.action) {
      case 'invite': {
        if (!body.email || !body.role) {
          return NextResponse.json({ error: 'email and role required for invite' }, { status: 400 })
        }

        // Check plan limits
        const planLimits = { starter: 3, professional: 10, enterprise: -1 }
        const limit = planLimits[data.plan as keyof typeof planLimits] || 3
        if (limit !== -1 && data.members.length >= limit) {
          return NextResponse.json(
            { error: `Plan limit reached (${limit} members)` },
            { status: 403 }
          )
        }

        const newMember = {
          userId: body.targetUserId || `pending_${crypto.randomUUID()}`,
          email: body.email,
          displayName: body.displayName || body.email,
          role: body.role,
          joinedAt: new Date().toISOString(),
        }

        await tenantRef.update({
          members: FieldValue.arrayUnion(newMember),
          memberIds: FieldValue.arrayUnion(newMember.userId),
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({ success: true, member: newMember })
      }

      case 'remove': {
        if (!body.targetUserId) {
          return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
        }

        if (body.targetUserId === data.ownerId) {
          return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 })
        }

        const memberToRemove = data.members.find(
          (m: { userId: string }) => m.userId === body.targetUserId
        )
        if (!memberToRemove) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        await tenantRef.update({
          members: FieldValue.arrayRemove(memberToRemove),
          memberIds: FieldValue.arrayRemove(body.targetUserId),
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({ success: true })
      }

      case 'change_role': {
        if (!body.targetUserId || !body.role) {
          return NextResponse.json({ error: 'targetUserId and role required' }, { status: 400 })
        }

        if (body.targetUserId === data.ownerId && body.role !== 'owner') {
          return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 })
        }

        const updatedMembers = data.members.map((m: { userId: string; role: string }) =>
          m.userId === body.targetUserId ? { ...m, role: body.role } : m
        )

        await tenantRef.update({
          members: updatedMembers,
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Tenants PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
