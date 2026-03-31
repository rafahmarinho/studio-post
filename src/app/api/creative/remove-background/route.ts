import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import { GEMINI_MODEL } from '@/lib/constants'

export const maxDuration = 300

interface RemoveBackgroundRequest {
  imageUrl: string
  generationId: string
  imageIndex: number
  outputFormat?: 'png' | 'webp'
  apiKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RemoveBackgroundRequest = await request.json()

    if (!body.imageUrl || !body.generationId) {
      return NextResponse.json(
        { error: 'imageUrl and generationId are required' },
        { status: 400 }
      )
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

    const prompt = `Remove the background from this image completely.

RULES:
- Keep ONLY the main subject/foreground elements
- Make the background fully transparent
- Preserve fine details like hair strands, fur, translucent edges
- Do NOT alter the subject colors, proportions, or details in any way
- Handle semi-transparent areas (glass, shadows) intelligently
- Clean edges without harsh cutoffs
- Output as PNG with alpha transparency
- Do NOT add any new elements or effects`

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
        { error: `Gemini error (${geminiResponse.status}): ${text}` },
        { status: 500 }
      )
    }

    const result = await geminiResponse.json()
    const imagePart = result?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    )

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'No result image in response' }, { status: 500 })
    }

    const { data: resultBase64 } = imagePart.inlineData
    const outputFormat = body.outputFormat || 'png'
    const filePath = `creative/${body.generationId}/${body.imageIndex}_nobg.${outputFormat}`
    const bucket = adminStorage.bucket()
    const file = bucket.file(filePath)

    const buffer = Buffer.from(resultBase64, 'base64')
    await file.save(buffer, {
      contentType: `image/${outputFormat}`,
      public: true,
      metadata: { cacheControl: 'public, max-age=31536000' },
    })

    const resultUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

    return NextResponse.json({
      url: resultUrl,
      format: outputFormat,
    })
  } catch (error) {
    console.error('Remove background error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
