import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase-admin'
import {
  VARIATION_STRATEGIES,
  LOGO_POSITIONS,
  GEMINI_MODEL,
} from '@/lib/constants'
import {
  TONE_LABELS,
  VISUAL_STYLE_LABELS,
  IMAGE_ELEMENT_LABELS,
  SCENARIO_LABELS,
  MOOD_LABELS,
  LIGHTING_LABELS,
  BACKGROUND_LABELS,
  PLATFORM_CONFIG,
} from '@/types'
import type {
  ContentPlatform,
  ToneType,
  VisualStyle,
  ImageElement,
  ScenarioType,
  MoodType,
  LightingType,
  BackgroundType,
} from '@/types'

export const maxDuration = 300

interface GenerateRequest {
  generationId: string
  context: string
  platform: ContentPlatform
  aspectRatio: string
  dimensions: string
  tone: ToneType
  toneCustom?: string
  visualStyle?: VisualStyle
  visualStyleCustom?: string
  imageElements?: ImageElement[]
  scenario?: ScenarioType
  scenarioCustom?: string
  mood?: MoodType
  moodCustom?: string
  lighting?: LightingType
  background?: BackgroundType
  multipleElements?: boolean
  purpose?: string
  intent?: string
  targetAudience?: string
  colors?: string
  textOnImage?: string
  additionalNotes?: string
  logoUrl?: string
  totalImages: number
  variationIndex: number
  isCarousel?: boolean
  carouselGroupIndex?: number
  carouselSlideIndex?: number
  imagesPerCarousel?: number
  apiKey?: string
}

function buildPrompt(body: GenerateRequest): string {
  const strategy = VARIATION_STRATEGIES[body.variationIndex % VARIATION_STRATEGIES.length]
  const platformLabel = PLATFORM_CONFIG[body.platform]?.label || body.platform
  const toneLabel = body.tone === 'other' ? body.toneCustom : TONE_LABELS[body.tone]
  const styleLabel = body.visualStyle
    ? body.visualStyle === 'other'
      ? body.visualStyleCustom
      : VISUAL_STYLE_LABELS[body.visualStyle]
    : ''
  const elementsLabel = body.imageElements
    ?.map((e) => IMAGE_ELEMENT_LABELS[e])
    .join(', ')
  const scenarioLabel = body.scenario
    ? body.scenario === 'other'
      ? body.scenarioCustom
      : SCENARIO_LABELS[body.scenario]
    : ''
  const moodLabel = body.mood
    ? body.mood === 'other'
      ? body.moodCustom
      : MOOD_LABELS[body.mood]
    : ''
  const lightingLabel = body.lighting ? LIGHTING_LABELS[body.lighting] : ''
  const bgLabel = body.background ? BACKGROUND_LABELS[body.background] : ''

  let prompt = `Crie uma imagem profissional para ${platformLabel}.
Formato: ${body.aspectRatio} (${body.dimensions}).
Estratégia de variação visual #${body.variationIndex + 1}: "${strategy}"

BRIEFING DO CLIENTE:
${body.context}
${body.purpose ? `Objetivo: ${body.purpose}` : ''}
${body.intent ? `Intenção: ${body.intent}` : ''}

DIRETRIZES VISUAIS:
- Tom de comunicação: ${toneLabel}
${styleLabel ? `- Estilo visual: ${styleLabel}` : ''}
${elementsLabel ? `- Elementos na imagem: ${elementsLabel}` : ''}
${scenarioLabel ? `- Cenário/Ambientação: ${scenarioLabel}` : ''}
${moodLabel ? `- Atmosfera/Mood: ${moodLabel}` : ''}
${lightingLabel ? `- Iluminação: ${lightingLabel}` : ''}
${bgLabel ? `- Fundo: ${bgLabel}` : ''}
${body.multipleElements ? '- Incluir múltiplas instâncias de cada elemento' : ''}
${body.targetAudience ? `- Público-alvo: ${body.targetAudience}` : ''}
${body.colors ? `- Paleta de cores: ${body.colors}` : ''}
${body.textOnImage ? `- Texto obrigatório na imagem: "${body.textOnImage}"` : ''}
${body.additionalNotes ? `- Observações extras: ${body.additionalNotes}` : ''}`

  if (body.isCarousel && body.imagesPerCarousel) {
    const slideIndex = body.carouselSlideIndex ?? 0
    const totalSlides = body.imagesPerCarousel
    let slideRole = 'CONTEÚDO'
    if (slideIndex === 0) slideRole = 'HOOK/CAPA'
    else if (slideIndex === totalSlides - 1) slideRole = 'CTA FINAL'

    prompt += `

REGRAS OBRIGATÓRIAS PARA CARROSSEL:
- Este é o slide ${slideIndex + 1} de ${totalSlides} (Papel: ${slideRole})
- Carrossel grupo #${(body.carouselGroupIndex ?? 0) + 1}
- Mesma paleta de cores, tipografia, margens e grid em TODOS os slides
- NÃO inclua numeração de slides na imagem
${slideIndex === 0 ? '- Slide HOOK: Imagem de impacto máximo com gancho visual forte para parar o scroll' : ''}
${slideIndex === totalSlides - 1 ? '- Slide CTA FINAL: Call-to-action visual claro' : ''}
${slideIndex > 0 && slideIndex < totalSlides - 1 ? '- Slide CONTEÚDO: Desenvolvimento com dados, exemplos ou passos' : ''}
- Mantenha arco narrativo linear (começo → desenvolvimento → conclusão)`
  }

  if (body.logoUrl && Math.random() < 0.6) {
    const pos = LOGO_POSITIONS[body.variationIndex % LOGO_POSITIONS.length]
    prompt += `

LOGO:
- Inclua o logo do cliente posicionado no ${pos}, tamanho discreto mas legível.`
  }

  prompt += `

REGRAS DE TEXTO:
- Todo texto na imagem DEVE estar em português (pt-BR)
- Usar acentuação correta: ç, ã, õ, á, é, í, ó, ú
- Sem erros de ortografia

PROMPT NEGATIVO (NÃO inclua):
- Distorções faciais ou anatômicas
- Marcas d'água ou watermarks
- Texto cortado ou ilegível
- Erros ortográficos
- Bordas ou molduras não solicitadas
- Elementos que bloqueiem o conteúdo principal
- Numeração de slides (em carrosséis)
- Conteúdo ofensivo ou inadequado`

  return prompt
}

async function uploadToStorage(
  generationId: string,
  index: number,
  base64: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg'
  const filePath = `creative/${generationId}/${index}.${ext}`
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

async function callGemini(prompt: string, aspectRatio: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio },
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, 5000))
    const retry = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!retry.ok) {
      const text = await retry.text()
      throw new Error(`Gemini retry failed (${retry.status}): ${text}`)
    }
    return retry.json()
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini error (${response.status}): ${text}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    if (!body.generationId || !body.context) {
      return NextResponse.json(
        { error: 'generationId and context are required' },
        { status: 400 }
      )
    }

    const apiKey = body.apiKey || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Gemini API key configured' },
        { status: 500 }
      )
    }

    const prompt = buildPrompt(body)
    const result = await callGemini(prompt, body.aspectRatio, apiKey)

    const candidate = result?.candidates?.[0]
    const parts = candidate?.content?.parts
    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: 'No image generated by Gemini' },
        { status: 500 }
      )
    }

    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    )
    if (!imagePart?.inlineData) {
      return NextResponse.json(
        { error: 'No image data in Gemini response' },
        { status: 500 }
      )
    }

    const { mimeType, data: base64 } = imagePart.inlineData
    const url = await uploadToStorage(
      body.generationId,
      body.variationIndex,
      base64,
      mimeType
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
