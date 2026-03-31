/**
 * Local Express server for Electron desktop offline/hybrid mode.
 * Mirrors the Next.js API routes but runs locally with user's own API keys.
 */

import http from 'http'

const PORT = 3099

interface RouteHandler {
  (body: Record<string, unknown>): Promise<{ status: number; data: unknown }>
}

// ==================== ROUTE HANDLERS ====================

const routes: Record<string, RouteHandler> = {
  '/api/creative/generate': handleGenerate,
  '/api/creative/captions': handleCaptions,
  '/api/creative/refine': handleRefine,
  '/api/creative/idea': handleIdea,
  '/api/creative/upscale': handleUpscale,
  '/api/creative/remove-background': handleRemoveBackground,
  '/api/creative/variations': handleVariations,
}

async function handleGenerate(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'API key required for local mode' } }

  const geminiModel = 'gemini-2.0-flash-preview-image-generation'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: body.prompt as string }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: body.aspectRatio as string },
      },
    }),
  })

  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, 5000))
    return { status: 429, data: { error: 'Rate limited, please retry' } }
  }

  if (!response.ok) {
    const text = await response.text()
    return { status: response.status, data: { error: text } }
  }

  const result = await response.json()
  const imagePart = result?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: unknown }) => p.inlineData
  )

  if (!imagePart?.inlineData) {
    return { status: 500, data: { error: 'No image generated' } }
  }

  // In local mode we return base64 directly (no Firebase upload)
  return {
    status: 200,
    data: {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    },
  }
}

async function handleCaptions(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'OpenAI API key required' } }

  const prompt = body.prompt as string
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'Você é um copywriter profissional. Sempre responda em JSON válido.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return { status: response.status, data: { error: text } }
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return { status: 500, data: { error: 'Empty caption response' } }

  return { status: 200, data: { caption: JSON.parse(content) } }
}

async function handleRefine(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'Gemini API key required' } }

  const imageUrl = body.originalImageUrl as string
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return { status: 500, data: { error: 'Failed to fetch original image' } }

  const arrayBuf = await imgRes.arrayBuffer()
  const base64Image = Buffer.from(arrayBuf).toString('base64')
  const mimeType = imgRes.headers.get('content-type') || 'image/png'

  const geminiModel = 'gemini-2.0-flash-preview-image-generation'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: body.refinementPrompt as string },
          { inlineData: { mimeType, data: base64Image } },
        ],
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: body.aspectRatio as string },
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return { status: response.status, data: { error: text } }
  }

  const result = await response.json()
  const imagePart = result?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: unknown }) => p.inlineData
  )

  if (!imagePart?.inlineData) {
    return { status: 500, data: { error: 'No refined image generated' } }
  }

  return {
    status: 200,
    data: {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    },
  }
}

async function handleIdea(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'OpenAI API key required' } }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: body.systemPrompt as string },
        { role: 'user', content: body.description as string },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return { status: response.status, data: { error: text } }
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return { status: 500, data: { error: 'Empty idea response' } }

  return { status: 200, data: { idea: JSON.parse(content) } }
}

async function handleUpscale(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'Gemini API key required' } }

  const imageUrl = body.imageUrl as string
  const scale = body.scale as string
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return { status: 500, data: { error: 'Failed to fetch image' } }

  const arrayBuf = await imgRes.arrayBuffer()
  const base64Image = Buffer.from(arrayBuf).toString('base64')
  const mimeType = imgRes.headers.get('content-type') || 'image/png'

  const prompt = `Upscale this image by ${scale}. Enhance details, sharpen edges, improve quality. Output at ${scale} the original resolution. Preserve all original content exactly.`

  const geminiModel = 'gemini-2.0-flash-preview-image-generation'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return { status: response.status, data: { error: text } }
  }

  const result = await response.json()
  const imagePart = result?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: unknown }) => p.inlineData
  )

  if (!imagePart?.inlineData) {
    return { status: 500, data: { error: 'Upscale failed' } }
  }

  return {
    status: 200,
    data: { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType },
  }
}

async function handleRemoveBackground(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'Gemini API key required' } }

  const imageUrl = body.imageUrl as string
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return { status: 500, data: { error: 'Failed to fetch image' } }

  const arrayBuf = await imgRes.arrayBuffer()
  const base64Image = Buffer.from(arrayBuf).toString('base64')
  const mimeType = imgRes.headers.get('content-type') || 'image/png'

  const prompt = `Remove the background from this image completely. Keep only the main subject/foreground. Output as PNG with transparent background. Do not alter the subject in any way.`

  const geminiModel = 'gemini-2.0-flash-preview-image-generation'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    return { status: response.status, data: { error: text } }
  }

  const result = await response.json()
  const imagePart = result?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: unknown }) => p.inlineData
  )

  if (!imagePart?.inlineData) {
    return { status: 500, data: { error: 'Background removal failed' } }
  }

  return {
    status: 200,
    data: { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType },
  }
}

async function handleVariations(body: Record<string, unknown>) {
  const apiKey = body.apiKey as string
  if (!apiKey) return { status: 400, data: { error: 'Gemini API key required' } }

  const imageUrl = body.imageUrl as string
  const count = Math.min(Number(body.count) || 3, 5)
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return { status: 500, data: { error: 'Failed to fetch image' } }

  const arrayBuf = await imgRes.arrayBuffer()
  const base64Image = Buffer.from(arrayBuf).toString('base64')
  const mimeType = imgRes.headers.get('content-type') || 'image/png'

  const variations: { base64: string; mimeType: string }[] = []

  for (let i = 0; i < count; i++) {
    const prompt = `Create a unique variation of this image. Keep the same subject and composition but change the style/mood/colors. Variation ${i + 1} of ${count}. Make it distinctly different while maintaining the core concept.`

    const geminiModel = 'gemini-2.0-flash-preview-image-generation'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Image } },
            ],
          }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: body.aspectRatio as string || '1:1' },
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const imagePart = result?.candidates?.[0]?.content?.parts?.find(
          (p: { inlineData?: unknown }) => p.inlineData
        )
        if (imagePart?.inlineData) {
          variations.push({
            base64: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
          })
        }
      }
    } catch (err) {
      console.error(`Variation ${i + 1} error:`, err)
    }

    // Rate limit buffer
    if (i < count - 1) await new Promise((r) => setTimeout(r, 1000))
  }

  return { status: 200, data: { variations, count: variations.length } }
}

// ==================== HTTP SERVER ====================

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalSize = 0
    const MAX_BODY_SIZE = 50 * 1024 * 1024 // 50MB

    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length
      if (totalSize > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

let server: http.Server | null = null

export function startLocalServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    server = http.createServer(async (req, res) => {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      const route = req.url?.split('?')[0]
      const handler = route ? routes[route] : undefined

      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Route not found' }))
        return
      }

      try {
        const body = await parseBody(req)
        const result = await handler(body)
        res.writeHead(result.status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result.data))
      } catch (err) {
        console.error('Local server error:', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }))
      }
    })

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Local API server running on http://127.0.0.1:${PORT}`)
      resolve(PORT)
    })

    server.on('error', reject)
  })
}

export function stopLocalServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve())
    } else {
      resolve()
    }
  })
}
