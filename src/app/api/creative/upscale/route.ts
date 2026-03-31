import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import { GEMINI_MODEL } from '@/lib/constants'

export const maxDuration = 300

interface UpscaleRequest {
  imageUrl: string
  scale: '2x' | '4x'
  generationId: string
  imageIndex: number
  apiKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: UpscaleRequest = await request.json()

    if (!body.imageUrl || !body.scale || !body.generationId) {
      return NextResponse.json(
        { error: 'imageUrl, scale, and generationId are required' },
        { status: 400 }
      )
    }

    if (!['2x', '4x'].includes(body.scale)) {
      return NextResponse.json({ error: 'scale must be 2x or 4x' }, { status: 400 })
    }

    const apiKey = body.apiKey || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 500 })
    }

    // Fetch original image
    const imgResponse = await fetch(body.imageUrl)
    if (!imgResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch original image' }, { status: 500 })
    }

    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const originalMimeType = imgResponse.headers.get('content-type') || 'image/png'

    const scaleFactor = body.scale === '2x' ? 2 : 4

    const prompt = `Upscale this image by ${scaleFactor}x. 
RULES:
- Enhance fine details and textures
- Sharpen edges intelligently without artifacts
- Improve overall quality and clarity
- Preserve ALL original content, colors, and composition exactly
- Do NOT add, remove, or modify any elements
- Do NOT change the style or mood
- Output at ${scaleFactor}x the original resolution
- Maintain text readability if any text is present
- Remove any compression artifacts from the original`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: originalMimeType, data: base64Image } },
          ],
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      }),
    })

    if (geminiResponse.status === 429) {
      await new Promise((r) => setTimeout(r, 5000))
      return NextResponse.json({ error: 'Rate limited. Please try again.' }, { status: 429 })
    }

    if (!geminiResponse.ok) {
      const text = await geminiResponse.text()
      return NextResponse.json(
        { error: `Gemini upscale error (${geminiResponse.status}): ${text}` },
        { status: 500 }
      )
    }

    const result = await geminiResponse.json()
    const imagePart = result?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    )

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'No upscaled image in response' }, { status: 500 })
    }

    const { mimeType, data: upscaledBase64 } = imagePart.inlineData
    const ext = mimeType.includes('png') ? 'png' : 'jpg'
    const filePath = `creative/${body.generationId}/${body.imageIndex}_upscale_${body.scale}.${ext}`
    const bucket = adminStorage.bucket()
    const file = bucket.file(filePath)

    const buffer = Buffer.from(upscaledBase64, 'base64')
    await file.save(buffer, {
      contentType: mimeType,
      public: true,
      metadata: { cacheControl: 'public, max-age=31536000' },
    })

    const upscaledUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

    return NextResponse.json({
      url: upscaledUrl,
      scale: body.scale,
    })
  } catch (error) {
    console.error('Upscale error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
