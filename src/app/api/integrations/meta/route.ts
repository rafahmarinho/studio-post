import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export const maxDuration = 60

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

// ==================== HELPERS ====================

function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!'
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv)
  let dec = decipher.update(parts[1], 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}

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

// ==================== GET — List connections ====================

export async function GET(req: NextRequest) {
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await adminDb
    .collection('meta_connections')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()

  const connections = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      accountType: data.accountType,
      accountId: data.accountId,
      accountName: data.accountName,
      accountUsername: data.accountUsername,
      accountAvatar: data.accountAvatar,
      permissions: data.permissions,
      isActive: data.isActive,
      tokenExpiresAt: data.tokenExpiresAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
    }
  })

  return NextResponse.json({ connections })
}

// ==================== POST — Connect or publish ====================

export async function POST(req: NextRequest) {
  const userId = await verifyUser(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  switch (action) {
    case 'exchange_token':
      return handleTokenExchange(userId, body)
    case 'refresh_token':
      return handleTokenRefresh(userId, body)
    case 'publish':
      return handlePublish(userId, body)
    case 'disconnect':
      return handleDisconnect(userId, body)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

// --- Exchange short-lived token for long-lived ---
async function handleTokenExchange(
  userId: string,
  body: { shortLivedToken: string; accountType: string }
) {
  const { shortLivedToken, accountType } = body
  if (!shortLivedToken) {
    return NextResponse.json({ error: 'Missing shortLivedToken' }, { status: 400 })
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Meta API not configured' }, { status: 503 })
  }

  // Exchange for long-lived token (60 days)
  const exchangeUrl = `${META_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`
  const tokenRes = await fetch(exchangeUrl)
  if (!tokenRes.ok) {
    const err = await tokenRes.json()
    return NextResponse.json({ error: 'Token exchange failed', details: err }, { status: 400 })
  }

  const tokenData = await tokenRes.json() as { access_token: string; expires_in: number }
  const longLivedToken = tokenData.access_token
  const expiresIn = tokenData.expires_in || 5184000 // 60 days default

  // Fetch account info
  let accountInfo: { id: string; name: string; username?: string; profile_picture_url?: string }
  if (accountType === 'instagram_business') {
    // Get IG business account via user's pages
    const pagesRes = await fetch(`${META_GRAPH_URL}/me/accounts?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${longLivedToken}`)
    const pagesData = await pagesRes.json() as { data: Array<{ instagram_business_account?: { id: string; name: string; username: string; profile_picture_url: string } }> }
    const igAccount = pagesData.data?.find((p) => p.instagram_business_account)?.instagram_business_account
    if (!igAccount) {
      return NextResponse.json({ error: 'No Instagram Business account found. Make sure your Facebook Page is connected to an Instagram Business account.' }, { status: 400 })
    }
    accountInfo = igAccount
  } else {
    // Get Facebook page info
    const pageRes = await fetch(`${META_GRAPH_URL}/me/accounts?fields=id,name,access_token,picture{url}&access_token=${longLivedToken}`)
    const pageData = await pageRes.json() as { data: Array<{ id: string; name: string; access_token: string; picture?: { data?: { url?: string } } }> }
    const page = pageData.data?.[0]
    if (!page) {
      return NextResponse.json({ error: 'No Facebook Page found.' }, { status: 400 })
    }
    accountInfo = { id: page.id, name: page.name, profile_picture_url: page.picture?.data?.url }
  }

  // Save connection
  const docRef = await adminDb.collection('meta_connections').add({
    userId,
    accountType,
    accountId: accountInfo.id,
    accountName: accountInfo.name,
    accountUsername: accountInfo.username || null,
    accountAvatar: accountInfo.profile_picture_url || null,
    accessToken: encrypt(longLivedToken),
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    permissions: ['publish_content'],
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({
    id: docRef.id,
    accountType,
    accountId: accountInfo.id,
    accountName: accountInfo.name,
    accountUsername: accountInfo.username,
    accountAvatar: accountInfo.profile_picture_url,
  })
}

// --- Refresh an expiring token ---
async function handleTokenRefresh(userId: string, body: { connectionId: string }) {
  const { connectionId } = body
  const docRef = adminDb.collection('meta_connections').doc(connectionId)
  const snap = await docRef.get()

  if (!snap.exists || snap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const currentToken = decrypt(snap.data()!.accessToken)
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'Meta API not configured' }, { status: 503 })
  }

  const refreshUrl = `${META_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(currentToken)}`
  const res = await fetch(refreshUrl)
  if (!res.ok) {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 400 })
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  await docRef.update({
    accessToken: encrypt(data.access_token),
    tokenExpiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ success: true, expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000) })
}

// --- Publish a post ---
async function handlePublish(
  userId: string,
  body: { connectionId: string; imageUrls: string[]; caption?: string; isCarousel?: boolean }
) {
  const { connectionId, imageUrls, caption, isCarousel } = body
  if (!connectionId || !imageUrls?.length) {
    return NextResponse.json({ error: 'Missing connectionId or imageUrls' }, { status: 400 })
  }

  const connSnap = await adminDb.collection('meta_connections').doc(connectionId).get()
  if (!connSnap.exists || connSnap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  const conn = connSnap.data()!
  const accessToken = decrypt(conn.accessToken)
  const accountId = conn.accountId

  // Check token expiry
  if (conn.tokenExpiresAt?.toDate() < new Date()) {
    return NextResponse.json({ error: 'Access token expired. Please reconnect.' }, { status: 401 })
  }

  try {
    if (conn.accountType === 'instagram_business') {
      return await publishToInstagram(accountId, accessToken, imageUrls, caption, isCarousel)
    } else {
      return await publishToFacebook(accountId, accessToken, imageUrls, caption)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Publish failed', details: msg }, { status: 500 })
  }
}

async function publishToInstagram(
  accountId: string,
  token: string,
  imageUrls: string[],
  caption?: string,
  isCarousel?: boolean
) {
  if (isCarousel && imageUrls.length > 1) {
    // Step 1: Create media containers for each image
    const containerIds: string[] = []
    for (const url of imageUrls.slice(0, 10)) {
      const res = await fetch(`${META_GRAPH_URL}/${accountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: token }),
      })
      const data = await res.json() as { id: string }
      containerIds.push(data.id)
    }

    // Step 2: Create carousel container
    const carouselRes = await fetch(`${META_GRAPH_URL}/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: containerIds,
        caption: caption || '',
        access_token: token,
      }),
    })
    const carouselData = await carouselRes.json() as { id: string }

    // Step 3: Publish
    const publishRes = await fetch(`${META_GRAPH_URL}/${accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: carouselData.id, access_token: token }),
    })
    const published = await publishRes.json() as { id: string }

    return NextResponse.json({
      externalPostId: published.id,
      externalUrl: `https://www.instagram.com/p/${published.id}/`,
      platform: 'instagram',
    })
  }

  // Single image publish
  const createRes = await fetch(`${META_GRAPH_URL}/${accountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrls[0], caption: caption || '', access_token: token }),
  })
  const createData = await createRes.json() as { id: string }

  const publishRes = await fetch(`${META_GRAPH_URL}/${accountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: createData.id, access_token: token }),
  })
  const published = await publishRes.json() as { id: string }

  return NextResponse.json({
    externalPostId: published.id,
    externalUrl: `https://www.instagram.com/p/${published.id}/`,
    platform: 'instagram',
  })
}

async function publishToFacebook(
  pageId: string,
  token: string,
  imageUrls: string[],
  caption?: string
) {
  if (imageUrls.length > 1) {
    // Multi-photo post
    const photoIds: string[] = []
    for (const url of imageUrls) {
      const res = await fetch(`${META_GRAPH_URL}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, published: false, access_token: token }),
      })
      const data = await res.json() as { id: string }
      photoIds.push(data.id)
    }

    const attachments = photoIds.reduce((acc, id, i) => {
      acc[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })
      return acc
    }, {} as Record<string, string>)

    const postRes = await fetch(`${META_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: caption || '', ...attachments, access_token: token }),
    })
    const post = await postRes.json() as { id: string }
    return NextResponse.json({ externalPostId: post.id, platform: 'facebook' })
  }

  // Single photo
  const res = await fetch(`${META_GRAPH_URL}/${pageId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrls[0], message: caption || '', access_token: token }),
  })
  const data = await res.json() as { id: string }
  return NextResponse.json({ externalPostId: data.id, platform: 'facebook' })
}

// --- Disconnect ---
async function handleDisconnect(userId: string, body: { connectionId: string }) {
  const { connectionId } = body
  const docRef = adminDb.collection('meta_connections').doc(connectionId)
  const snap = await docRef.get()
  if (!snap.exists || snap.data()?.userId !== userId) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  await docRef.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ success: true })
}
