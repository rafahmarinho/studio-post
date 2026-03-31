import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const maxDuration = 60

const BRAND_KITS_COLLECTION = 'brand_kits'

// GET — List brand kits for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const tenantId = request.headers.get('x-tenant-id')

    let q = adminDb.collection(BRAND_KITS_COLLECTION).where('userId', '==', userId)
    if (tenantId) {
      q = adminDb.collection(BRAND_KITS_COLLECTION).where('tenantId', '==', tenantId)
    }

    const snap = await q.orderBy('updatedAt', 'desc').get()
    const kits = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ brandKits: kits })
  } catch (error) {
    console.error('Brand kits GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST — Create a brand kit
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.colors || !body.tone || !body.visualStyle) {
      return NextResponse.json(
        { error: 'name, colors, tone, and visualStyle are required' },
        { status: 400 }
      )
    }

    // Validate colors array
    if (!Array.isArray(body.colors) || body.colors.length === 0) {
      return NextResponse.json({ error: 'At least one color is required' }, { status: 400 })
    }

    for (const color of body.colors) {
      if (!color.name || !color.hex || !color.role) {
        return NextResponse.json(
          { error: 'Each color must have name, hex, and role' },
          { status: 400 }
        )
      }
      if (!/^#[0-9A-Fa-f]{6}$/.test(color.hex)) {
        return NextResponse.json(
          { error: `Invalid hex color: ${color.hex}` },
          { status: 400 }
        )
      }
    }

    const doc = {
      userId,
      tenantId: body.tenantId || null,
      name: body.name.substring(0, 100),
      description: (body.description || '').substring(0, 500),
      logoUrl: body.logoUrl || null,
      colors: body.colors.slice(0, 10),
      fonts: (body.fonts || []).slice(0, 5),
      tone: body.tone,
      toneCustom: body.toneCustom || null,
      visualStyle: body.visualStyle,
      visualStyleCustom: body.visualStyleCustom || null,
      mood: body.mood || null,
      moodCustom: body.moodCustom || null,
      defaultPlatform: body.defaultPlatform || null,
      defaultFormat: body.defaultFormat || null,
      guidelines: (body.guidelines || '').substring(0, 2000),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await adminDb.collection(BRAND_KITS_COLLECTION).add(doc)

    return NextResponse.json({ id: docRef.id, ...doc }, { status: 201 })
  } catch (error) {
    console.error('Brand kits POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT — Update a brand kit
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Brand kit ID required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await adminDb.collection(BRAND_KITS_COLLECTION).doc(body.id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 })
    }
    if (existing.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

    if (body.name) updates.name = body.name.substring(0, 100)
    if (body.description !== undefined) updates.description = (body.description || '').substring(0, 500)
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl || null
    if (body.colors) updates.colors = body.colors.slice(0, 10)
    if (body.fonts) updates.fonts = body.fonts.slice(0, 5)
    if (body.tone) updates.tone = body.tone
    if (body.toneCustom !== undefined) updates.toneCustom = body.toneCustom
    if (body.visualStyle) updates.visualStyle = body.visualStyle
    if (body.visualStyleCustom !== undefined) updates.visualStyleCustom = body.visualStyleCustom
    if (body.mood !== undefined) updates.mood = body.mood
    if (body.moodCustom !== undefined) updates.moodCustom = body.moodCustom
    if (body.defaultPlatform !== undefined) updates.defaultPlatform = body.defaultPlatform
    if (body.defaultFormat !== undefined) updates.defaultFormat = body.defaultFormat
    if (body.guidelines !== undefined) updates.guidelines = (body.guidelines || '').substring(0, 2000)

    await adminDb.collection(BRAND_KITS_COLLECTION).doc(body.id).update(updates)

    return NextResponse.json({ id: body.id, ...updates })
  } catch (error) {
    console.error('Brand kits PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE — Remove a brand kit
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Brand kit ID required' }, { status: 400 })
    }

    const existing = await adminDb.collection(BRAND_KITS_COLLECTION).doc(id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 })
    }
    if (existing.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await adminDb.collection(BRAND_KITS_COLLECTION).doc(id).delete()

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Brand kits DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
