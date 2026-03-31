import { NextRequest, NextResponse } from 'next/server'
import {
  TONE_LABELS,
  VISUAL_STYLE_LABELS,
  IMAGE_ELEMENT_LABELS,
  SCENARIO_LABELS,
  MOOD_LABELS,
  LIGHTING_LABELS,
  BACKGROUND_LABELS,
  PLATFORM_CONFIG,
  IMAGE_FORMAT_CONFIG,
  GENERATION_MODE_LABELS,
} from '@/types'

export const maxDuration = 300

const SYSTEM_PROMPT = `Você é um diretor criativo especializado em marketing digital.
O usuário vai descrever uma necessidade de forma livre.
Você deve retornar um JSON completo com todos os campos do briefing preenchidos.

ENUMS DISPONÍVEIS:

platform (escolha 1): ${Object.keys(PLATFORM_CONFIG).join(', ')}
imageFormat (escolha 1): ${Object.keys(IMAGE_FORMAT_CONFIG).join(', ')}
tone (escolha 1): ${Object.entries(TONE_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
visualStyle (escolha 1): ${Object.entries(VISUAL_STYLE_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
imageElements (escolha 1 ou mais): ${Object.entries(IMAGE_ELEMENT_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
scenario (escolha 1): ${Object.entries(SCENARIO_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
mood (escolha 1): ${Object.entries(MOOD_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
lighting (escolha 1): ${Object.entries(LIGHTING_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
background (escolha 1): ${Object.entries(BACKGROUND_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}
generationMode (escolha 1): ${Object.entries(GENERATION_MODE_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}

FORMATO DE SAÍDA (JSON):
{
  "platform": "string",
  "imageFormat": "string",
  "context": "string (brief profissional elaborado, 3-6 frases, NÃO é cópia literal do input)",
  "purpose": "string",
  "intent": "string",
  "tone": "string",
  "toneCustom": null,
  "visualStyle": "string",
  "visualStyleCustom": null,
  "imageElements": ["array de strings"],
  "scenario": "string",
  "scenarioCustom": null,
  "mood": "string",
  "moodCustom": null,
  "lighting": "string",
  "background": "string",
  "multipleElements": false,
  "targetAudience": "string",
  "colors": "string",
  "textOnImage": "string",
  "additionalNotes": "string",
  "totalImages": 5,
  "generationMode": "both"
}

REGRAS:
- O campo "context" NÃO é cópia literal do input. Elabore um brief profissional.
- Sugira quantidade adequada (totalImages) baseada no escopo.
- Use seus conhecimentos de marketing para escolher os melhores valores.
- Para campos com opção "other", preencha o campo custom correspondente.
- Sempre retorne JSON válido.`

export async function POST(request: NextRequest) {
  try {
    const body: { description: string; apiKey?: string } = await request.json()

    if (!body.description || body.description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    const apiKey = body.apiKey || process.env.OPEN_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 500 })
    }

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: body.description },
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `OpenAI error (${response.status}): ${text}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Empty response from OpenAI' }, { status: 500 })
    }

    const idea = JSON.parse(content)
    return NextResponse.json({ idea })
  } catch (error) {
    console.error('Idea error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
