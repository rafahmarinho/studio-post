import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'

export const maxDuration = 30

const API_KEYS_COLLECTION = 'api_keys'

function generateApiKey(environment: 'live' | 'test'): string {
  const prefix = `sp_${environment}_`
  const random = crypto.randomBytes(32).toString('base64url')
  return `${prefix}${random}`
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// GET — List API keys for a user/tenant (keys are masked)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId')
  const tenantId = searchParams.get('tenantId')

  if (!userId && !tenantId) {
    return NextResponse.json({ error: 'userId or tenantId required' }, { status: 400 })
  }

  try {
    let query = adminDb.collection(API_KEYS_COLLECTION) as FirebaseFirestore.Query

    if (tenantId) {
      query = query.where('tenantId', '==', tenantId)
    } else {
      query = query.where('createdBy', '==', userId)
    }

    const snap = await query.orderBy('createdAt', 'desc').get()

    const keys = snap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        maskedKey: `${data.keyPrefix}...${data.keySuffix}`,
        environment: data.environment,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
        tenantId: data.tenantId,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() || null,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
      }
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error listing API keys:', error)
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 })
  }
}

// POST — Create a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tenantId, name, environment, permissions, rateLimit, expiresInDays } = body

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'userId and tenantId required' }, { status: 400 })
    }

    if (!name || name.length < 2 || name.length > 64) {
      return NextResponse.json({ error: 'name is required (2-64 characters)' }, { status: 400 })
    }

    const env = environment === 'test' ? 'test' : 'live'
    const validPermissions = [
      'generate:images',
      'generate:captions',
      'generate:refine',
      'generate:upscale',
      'generate:remove_bg',
      'generate:variations',
      'read:generations',
      'manage:brand_kits',
    ]

    const perms = Array.isArray(permissions)
      ? permissions.filter((p: string) => validPermissions.includes(p))
      : validPermissions

    // Limit keys per tenant (max 10)
    const existingCount = await adminDb
      .collection(API_KEYS_COLLECTION)
      .where('tenantId', '==', tenantId)
      .count()
      .get()

    if (existingCount.data().count >= 10) {
      return NextResponse.json(
        { error: 'Maximum 10 API keys per tenant' },
        { status: 400 }
      )
    }

    const rawKey = generateApiKey(env)
    const keyHash = hashKey(rawKey)
    const keyPrefix = rawKey.substring(0, 11)
    const keySuffix = rawKey.substring(rawKey.length - 6)

    const keyData: Record<string, unknown> = {
      name,
      keyHash,
      keyPrefix,
      keySuffix,
      environment: env,
      permissions: perms,
      rateLimit: Math.min(Math.max(rateLimit || 60, 10), 600),
      tenantId,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      lastUsedAt: null,
    }

    if (expiresInDays && expiresInDays > 0) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Math.min(expiresInDays, 365))
      keyData.expiresAt = expiresAt
    }

    const docRef = await adminDb.collection(API_KEYS_COLLECTION).add(keyData)

    return NextResponse.json({
      id: docRef.id,
      key: rawKey, // Only returned once on creation!
      name,
      keyPrefix,
      environment: env,
      permissions: perms,
      rateLimit: keyData.rateLimit,
      warning: 'Store this key securely. It will not be shown again.',
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

// PUT — Update API key (name, permissions, rateLimit)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyId, userId, name, permissions, rateLimit } = body

    if (!keyId || !userId) {
      return NextResponse.json({ error: 'keyId and userId required' }, { status: 400 })
    }

    const doc = await adminDb.collection(API_KEYS_COLLECTION).doc(keyId).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    if (doc.data()!.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

    if (name && name.length >= 2 && name.length <= 64) {
      updates.name = name
    }

    if (Array.isArray(permissions)) {
      const validPermissions = [
        'generate:images',
        'generate:captions',
        'generate:refine',
        'generate:upscale',
        'generate:remove_bg',
        'generate:variations',
        'read:generations',
        'manage:brand_kits',
      ]
      updates.permissions = permissions.filter((p: string) => validPermissions.includes(p))
    }

    if (rateLimit) {
      updates.rateLimit = Math.min(Math.max(rateLimit, 10), 600)
    }

    await adminDb.collection(API_KEYS_COLLECTION).doc(keyId).update(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

// DELETE — Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const keyId = searchParams.get('keyId')
    const userId = searchParams.get('userId')

    if (!keyId || !userId) {
      return NextResponse.json({ error: 'keyId and userId required' }, { status: 400 })
    }

    const doc = await adminDb.collection(API_KEYS_COLLECTION).doc(keyId).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    if (doc.data()!.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await adminDb.collection(API_KEYS_COLLECTION).doc(keyId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
