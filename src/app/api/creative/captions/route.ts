import { NextRequest, NextResponse } from 'next/server'
import { COPY_STRATEGIES } from '@/lib/constants'
import { TONE_LABELS, PLATFORM_CONFIG } from '@/types'
import type { ContentPlatform, ToneType, GeneratedCaption } from '@/types'

export const maxDuration = 300

interface CaptionsRequest {
  context: string
  platform: ContentPlatform
  purpose?: string
  intent?: string
  tone: ToneType
  toneCustom?: string
  targetAudience?: string
  totalCaptions: number
  isCarousel?: boolean
  imagesPerCarousel?: number
  apiKey?: string
}

function buildCaptionPrompt(body: CaptionsRequest, variationIndex: number): string {
  const strategy = COPY_STRATEGIES[variationIndex % COPY_STRATEGIES.length]
  const platformLabel = PLATFORM_CONFIG[body.platform]?.label || body.platform
  const toneLabel = body.tone === 'other' ? body.toneCustom : TONE_LABELS[body.tone]

  let prompt = `Você é um copywriter profissional especializado em marketing digital para ${platformLabel}.

CONTEXTO:
${body.context}
${body.purpose ? `Objetivo: ${body.purpose}` : ''}
${body.intent ? `Intenção: ${body.intent}` : ''}
Tom de comunicação: ${toneLabel}
${body.targetAudience ? `Público-alvo: ${body.targetAudience}` : ''}

ESTRATÉGIA DE VARIAÇÃO #${variationIndex + 1}: ${strategy.name}
${strategy.description}

Retorne APENAS um JSON válido com esta estrutura:
{
  "headline": "Gancho irresistível (1 linha, máx ~80 caracteres)",
  "body": "Corpo da legenda com storytelling, emojis relevantes e quebras de linha. 2-4 parágrafos curtos.",
  "cta": "Call-to-action claro e direto",
  "hashtags": ["sem_cerquilha", "relevantes", "5_a_10_hashtags"]
}`

  if (body.isCarousel) {
    prompt += `

ATENÇÃO: Esta legenda é para um CARROSSEL de ${body.imagesPerCarousel} slides.
- Incentive o leitor a deslizar: "Deslize para ver...", "Confira os passos →"
- Referencie o conteúdo visual do carrossel
- Use CTA que incentive salvar/compartilhar o carrossel`
  }

  prompt += `

REGRAS:
- Tudo em português (pt-BR)
- Emojis relevantes mas sem exagero (2-4 por legenda)
- Hashtags sem # (o sistema adiciona depois)
- 5 a 10 hashtags relevantes
- Não use clichês genéricos
- Adapte o tom para ${platformLabel}`

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const body: CaptionsRequest = await request.json()

    if (!body.context || !body.totalCaptions) {
      return NextResponse.json(
        { error: 'context and totalCaptions are required' },
        { status: 400 }
      )
    }

    const apiKey = body.apiKey || process.env.OPEN_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No OpenAI API key configured' },
        { status: 500 }
      )
    }

    const captions: GeneratedCaption[] = []
    const errors: string[] = []

    for (let i = 0; i < body.totalCaptions; i++) {
      try {
        const captionPrompt = buildCaptionPrompt(body, i)

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
              { role: 'user', content: captionPrompt },
            ],
            temperature: 0.9,
            max_tokens: 600,
            response_format: { type: 'json_object' },
          }),
        })

        if (response.status === 429) {
          await new Promise((r) => setTimeout(r, 3000))
          errors.push(`Caption ${i + 1}: Rate limited, skipped`)
          continue
        }

        if (!response.ok) {
          const text = await response.text()
          errors.push(`Caption ${i + 1}: ${text}`)
          continue
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (!content) {
          errors.push(`Caption ${i + 1}: Empty response`)
          continue
        }

        const parsed: GeneratedCaption = JSON.parse(content)
        captions.push(parsed)

        if (i < body.totalCaptions - 1) {
          await new Promise((r) => setTimeout(r, 200))
        }
      } catch (err) {
        errors.push(`Caption ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      captions,
      errors,
      totalGenerated: captions.length,
      totalRequested: body.totalCaptions,
    })
  } catch (error) {
    console.error('Captions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
