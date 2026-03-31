import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'

export const maxDuration = 300

const API_KEYS_COLLECTION = 'api_keys'
const TENANTS_COLLECTION = 'tenants'

// Rate limiting: in-memory store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(keyId: string, limit: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(keyId)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(keyId, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

async function authenticateApiKey(
  request: NextRequest
): Promise<{ tenantId: string; keyId: string; permissions: string[]; rateLimit: number } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer sp_')) return null

  const rawKey = authHeader.substring(7)
  const keyPrefix = rawKey.substring(0, 11) // "sp_live_abc" or "sp_test_abc"

  // Look up by prefix
  const snap = await adminDb
    .collection(API_KEYS_COLLECTION)
    .where('keyPrefix', '==', keyPrefix)
    .limit(1)
    .get()

  if (snap.empty) return null

  const doc = snap.docs[0]
  const data = doc.data()

  // Verify full key hash
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex')
  if (hash !== data.keyHash) return null

  // Check expiration
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) return null

  // Update last used
  await doc.ref.update({ lastUsedAt: new Date() })

  return {
    tenantId: data.tenantId,
    keyId: doc.id,
    permissions: data.permissions || [],
    rateLimit: data.rateLimit || 60,
  }
}

// POST /api/v1 — Public API router
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const auth = await authenticateApiKey(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Use `Authorization: Bearer sp_...`' },
        { status: 401 }
      )
    }

    // Rate limit
    if (!checkRateLimit(auth.keyId, auth.rateLimit)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: 60 },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Verify tenant exists and is active
    const tenantDoc = await adminDb.collection(TENANTS_COLLECTION).doc(auth.tenantId).get()
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const tenantData = tenantDoc.data()!
    if (!['professional', 'enterprise'].includes(tenantData.plan)) {
      return NextResponse.json(
        { error: 'API access requires Professional or Enterprise plan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const action = body.action as string

    if (!action) {
      return NextResponse.json(
        {
          error: 'Missing `action` field',
          availableActions: [
            'generate',
            'captions',
            'refine',
            'upscale',
            'remove_background',
            'variations',
            'list_generations',
            'list_brand_kits',
          ],
        },
        { status: 400 }
      )
    }

    // Permission check
    const permissionMap: Record<string, string> = {
      generate: 'generate:images',
      captions: 'generate:captions',
      refine: 'generate:refine',
      upscale: 'generate:upscale',
      remove_background: 'generate:remove_bg',
      variations: 'generate:variations',
      list_generations: 'read:generations',
      list_brand_kits: 'manage:brand_kits',
    }

    const requiredPermission = permissionMap[action]
    if (!requiredPermission) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    if (!auth.permissions.includes(requiredPermission)) {
      return NextResponse.json(
        { error: `API key lacks permission: ${requiredPermission}` },
        { status: 403 }
      )
    }

    // Route to internal API
    const internalRoutes: Record<string, string> = {
      generate: '/api/creative/generate',
      captions: '/api/creative/captions',
      refine: '/api/creative/refine',
      upscale: '/api/creative/upscale',
      remove_background: '/api/creative/remove-background',
      variations: '/api/creative/variations',
    }

    const internalRoute = internalRoutes[action]

    if (internalRoute) {
      // Forward to internal API route
      const baseUrl = request.nextUrl.origin
      const res = await fetch(`${baseUrl}${internalRoute}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.params || {}),
      })

      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    // Handle read actions directly
    if (action === 'list_generations') {
      const limit = Math.min(body.limit || 20, 100)
      const snap = await adminDb
        .collection('creative_generations')
        .where('userId', 'in', tenantData.memberIds || [])
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()

      const generations = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return NextResponse.json({ generations, count: generations.length })
    }

    if (action === 'list_brand_kits') {
      const snap = await adminDb
        .collection('brand_kits')
        .where('tenantId', '==', auth.tenantId)
        .orderBy('updatedAt', 'desc')
        .get()

      const brandKits = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return NextResponse.json({ brandKits, count: brandKits.length })
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 })
  } catch (error) {
    console.error('Public API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1 — API documentation
export async function GET() {
  return NextResponse.json({
    name: 'Studio Post Public API',
    version: '1.0',
    docs: 'https://docs.studiopost.app/api',
    authentication: 'Bearer token in Authorization header (sp_live_... or sp_test_...)',
    endpoints: {
      'POST /api/v1': {
        description: 'Main API endpoint. Use the `action` field to specify the operation.',
        actions: {
          generate: {
            description: 'Generate a single image',
            requiredPermission: 'generate:images',
            params: {
              generationId: 'string (required)',
              context: 'string (required)',
              platform: 'string',
              aspectRatio: 'string',
              tone: 'string',
              variationIndex: 'number',
            },
          },
          captions: {
            description: 'Generate captions for images',
            requiredPermission: 'generate:captions',
            params: {
              context: 'string (required)',
              platform: 'string',
              tone: 'string',
              totalCaptions: 'number',
            },
          },
          refine: {
            description: 'Refine an existing image',
            requiredPermission: 'generate:refine',
            params: {
              generationId: 'string (required)',
              imageIndex: 'number',
              originalImageUrl: 'string (required)',
              refinementPrompt: 'string (required)',
              aspectRatio: 'string',
            },
          },
          upscale: {
            description: 'Upscale an image (2x or 4x)',
            requiredPermission: 'generate:upscale',
            params: {
              imageUrl: 'string (required)',
              scale: '"2x" | "4x"',
              generationId: 'string (required)',
              imageIndex: 'number',
            },
          },
          remove_background: {
            description: 'Remove image background',
            requiredPermission: 'generate:remove_bg',
            params: {
              imageUrl: 'string (required)',
              generationId: 'string (required)',
              imageIndex: 'number',
            },
          },
          variations: {
            description: 'Generate variations of an image (1-5)',
            requiredPermission: 'generate:variations',
            params: {
              imageUrl: 'string (required)',
              generationId: 'string (required)',
              imageIndex: 'number',
              count: 'number (1-5)',
              strength: 'number (0.3-0.9)',
              aspectRatio: 'string',
            },
          },
          list_generations: {
            description: 'List past generations',
            requiredPermission: 'read:generations',
            params: { limit: 'number (max 100)' },
          },
          list_brand_kits: {
            description: 'List brand kits',
            requiredPermission: 'manage:brand_kits',
          },
        },
      },
    },
  })
}
