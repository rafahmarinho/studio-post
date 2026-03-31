import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import { GEMINI_MODEL } from '@/lib/constants'

export const maxDuration = 300

interface RefineRequest {
  generationId: string
  imageIndex: number
  version: number
  originalImageUrl: string
  refinementPrompt: string
  aspectRatio: string
  apiKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json()

    if (!body.generationId || !body.originalImageUrl || !body.refinementPrompt) {
      return NextResponse.json(
        { error: 'generationId, originalImageUrl, and refinementPrompt are required' },
        { status: 400 }
      )
    }

    const apiKey = body.apiKey || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 500 })
    }

    const imgResponse = await fetch(body.originalImageUrl)
    if (!imgResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch original image' }, { status: 500 })
    }

    const arrayBuffer = await imgResponse.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const originalMimeType = imgResponse.headers.get('content-type') || 'image/png'

    const prompt = `Aplique APENAS as seguintes alterações na imagem fornecida:
${body.refinementPrompt}

REGRAS OBRIGATÓRIAS:
- Mantenha o estilo, composição e elementos existentes
- Altere SOMENTE o que foi explicitamente solicitado
- Mantenha textos em português com acentuação correta
- Mantenha a qualidade e resolução originais
- Não adicione elementos não solicitados`

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
          imageConfig: { aspectRatio: body.aspectRatio },
        },
      }),
    })

    if (!geminiResponse.ok) {
      const text = await geminiResponse.text()
      return NextResponse.json(
        { error: `Gemini refine error (${geminiResponse.status}): ${text}` },
        { status: 500 }
      )
    }

    const result = await geminiResponse.json()
    const imagePart = result?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    )

    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'No refined image in Gemini response' }, { status: 500 })
    }

    const { mimeType, data: refinedBase64 } = imagePart.inlineData
    const ext = mimeType.includes('png') ? 'png' : 'jpg'
    const filePath = `creative/${body.generationId}/${body.imageIndex}_v${body.version}.${ext}`
    const bucket = adminStorage.bucket()
    const file = bucket.file(filePath)

    const buffer = Buffer.from(refinedBase64, 'base64')
    await file.save(buffer, {
      contentType: mimeType,
      public: true,
      metadata: { cacheControl: 'public, max-age=31536000' },
    })

    const refinedUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
    return NextResponse.json({ url: refinedUrl })
  } catch (error) {
    console.error('Refine error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
