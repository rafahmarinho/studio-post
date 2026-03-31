import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export const maxDuration = 60

const TEMPLATES_COLLECTION = 'creative_templates'

// GET — List templates
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const publicOnly = searchParams.get('public') === 'true'

    let q: FirebaseFirestore.Query = adminDb.collection(TEMPLATES_COLLECTION)

    if (publicOnly) {
      q = q.where('isPublic', '==', true)
    } else {
      // User's own + public templates
      // Firestore doesn't support OR queries well, so we do two queries
      const userSnap = await adminDb
        .collection(TEMPLATES_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get()

      const publicSnap = await adminDb
        .collection(TEMPLATES_COLLECTION)
        .where('isPublic', '==', true)
        .orderBy('usageCount', 'desc')
        .limit(50)
        .get()

      const seen = new Set<string>()
      const templates: unknown[] = []

      for (const doc of userSnap.docs) {
        seen.add(doc.id)
        templates.push({ id: doc.id, ...doc.data() })
      }

      for (const doc of publicSnap.docs) {
        if (!seen.has(doc.id)) {
          templates.push({ id: doc.id, ...doc.data() })
        }
      }

      return NextResponse.json({ templates })
    }

    if (category) {
      q = q.where('category', '==', category)
    }

    q = q.orderBy('usageCount', 'desc').limit(100)
    const snap = await q.get()
    const templates = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST — Create a template
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.category || !body.fields) {
      return NextResponse.json(
        { error: 'name, category, and fields are required' },
        { status: 400 }
      )
    }

    const doc = {
      userId,
      tenantId: body.tenantId || null,
      name: body.name.substring(0, 100),
      description: (body.description || '').substring(0, 500),
      category: body.category,
      thumbnail: body.thumbnail || null,
      isPublic: body.isPublic === true,
      fields: body.fields,
      brandKitId: body.brandKitId || null,
      usageCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await adminDb.collection(TEMPLATES_COLLECTION).add(doc)

    return NextResponse.json({ id: docRef.id, ...doc }, { status: 201 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT — Update a template
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const existing = await adminDb.collection(TEMPLATES_COLLECTION).doc(body.id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (existing.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

    if (body.name) updates.name = body.name.substring(0, 100)
    if (body.description !== undefined) updates.description = (body.description || '').substring(0, 500)
    if (body.category) updates.category = body.category
    if (body.thumbnail !== undefined) updates.thumbnail = body.thumbnail
    if (body.isPublic !== undefined) updates.isPublic = body.isPublic === true
    if (body.fields) updates.fields = body.fields
    if (body.brandKitId !== undefined) updates.brandKitId = body.brandKitId

    await adminDb.collection(TEMPLATES_COLLECTION).doc(body.id).update(updates)

    return NextResponse.json({ id: body.id, ...updates })
  } catch (error) {
    console.error('Templates PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE — Remove a template
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const existing = await adminDb.collection(TEMPLATES_COLLECTION).doc(id).get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (existing.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await adminDb.collection(TEMPLATES_COLLECTION).doc(id).delete()

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH — Increment usage count (when a template is used)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    await adminDb.collection(TEMPLATES_COLLECTION).doc(body.id).update({
      usageCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
