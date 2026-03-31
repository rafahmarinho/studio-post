import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import { GEMINI_MODEL, VARIATION_STRATEGIES } from '@/lib/constants'

export const maxDuration = 300

interface VariationsRequest {
  imageUrl: string
  generationId: string
  imageIndex: number
  count: number // 1-5
  strength: number // 0.3-0.9
  aspectRatio: string
  apiKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: VariationsRequest = await request.json()

    if (!body.imageUrl || !body.generationId) {
      return NextResponse.json(
        { error: 'imageUrl and generationId are required' },
        { status: 400 }
      )
    }

    const count = Math.min(Math.max(body.count || 3, 1), 5)
    const strength = Math.min(Math.max(body.strength || 0.5, 0.3), 0.9)

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

    const urls: string[] = []
    const errors: string[] = []

    const strengthLabel = strength <= 0.4 ? 'subtle' : strength <= 0.6 ? 'moderate' : 'significant'

    for (let i = 0; i < count; i++) {
      const strategy = VARIATION_STRATEGIES[(body.imageIndex * 5 + i) % VARIATION_STRATEGIES.length]

      const prompt = `Create a ${strengthLabel} variation of this image.

VARIATION STRATEGY: ${strategy}

RULES:
- Keep the same core subject, message, and purpose
- Apply ${strengthLabel} changes (strength: ${strength})
- Change visual approach: colors, composition, style, or mood
- Maintain the same aspect ratio and quality
- This is variation ${i + 1} of ${count} — make it DISTINCT from other variations
- All text must remain in Portuguese (pt-BR) with correct accents
- Do NOT add watermarks or unwanted elements
${strength <= 0.4 ? '- Only change subtle details like colors, lighting, or minor composition adjustments' : ''}
${strength >= 0.7 ? '- Feel free to significantly reimagine the visual approach while keeping the core subject' : ''}`

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

      try {
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
              imageConfig: { aspectRatio: body.aspectRatio || '1:1' },
            },
          }),
        })

        if (geminiResponse.status === 429) {
          await new Promise((r) => setTimeout(r, 5000))
          // Retry once
          const retry = await fetch(url, {
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
                imageConfig: { aspectRatio: body.aspectRatio || '1:1' },
              },
            }),
          })

          if (!retry.ok) {
            errors.push(`Variation ${i + 1}: Rate limited`)
            continue
          }

          const retryResult = await retry.json()
          const retryPart = retryResult?.candidates?.[0]?.content?.parts?.find(
            (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
          )
          if (retryPart?.inlineData) {
            const savedUrl = await saveVariation(
              body.generationId,
              body.imageIndex,
              i,
              retryPart.inlineData.data,
              retryPart.inlineData.mimeType
            )
            urls.push(savedUrl)
          }
          continue
        }

        if (!geminiResponse.ok) {
          const text = await geminiResponse.text()
          errors.push(`Variation ${i + 1}: ${text.substring(0, 200)}`)
          continue
        }

        const result = await geminiResponse.json()
        const imagePart = result?.candidates?.[0]?.content?.parts?.find(
          (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
        )

        if (!imagePart?.inlineData) {
          errors.push(`Variation ${i + 1}: No image in response`)
          continue
        }

        const savedUrl = await saveVariation(
          body.generationId,
          body.imageIndex,
          i,
          imagePart.inlineData.data,
          imagePart.inlineData.mimeType
        )
        urls.push(savedUrl)
      } catch (err) {
        errors.push(`Variation ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }

      // Rate limit buffer between requests
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, 1500))
      }
    }

    return NextResponse.json({
      urls,
      count: urls.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Variations error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function saveVariation(
  generationId: string,
  imageIndex: number,
  variationIndex: number,
  base64: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg'
  const filePath = `creative/${generationId}/${imageIndex}_var${variationIndex + 1}.${ext}`
  const bucket = adminStorage.bucket()
  const file = bucket.file(filePath)

  const buffer = Buffer.from(base64, 'base64')
  await file.save(buffer, {
    contentType: mimeType,
    public: true,
    metadata: { cacheControl: 'public, max-age=31536000' },
  })

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`
}
