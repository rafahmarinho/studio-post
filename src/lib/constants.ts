import { GenerationMode } from '@/types'

// ==================== CONSTANTES DE PREÇO ====================

export const DAILY_LIMIT_CENTS = 30000 // R$ 300,00
export const REFINE_COST_CENTS = 99 // R$ 0,99
export const FREE_DAILY_IMAGE_LIMIT = 5
export const FREE_DAILY_REFINE_LIMIT = 2

export const BASE_PRICE: Record<GenerationMode, number> = {
  images_only: 300, // R$ 3,00
  captions_only: 100, // R$ 1,00
  both: 350, // R$ 3,50
}

// ==================== FUNÇÕES DE PREÇO ====================

export function getDiscount(quantity: number): number {
  if (quantity < 6) return 0
  const clamped = Math.min(quantity, 30)
  return 0.05 + ((clamped - 6) / 24) * 0.25
}

export function getUnitPrice(mode: GenerationMode, quantity: number): number {
  const base = BASE_PRICE[mode]
  const discount = getDiscount(quantity)
  return Math.round(base * (1 - discount))
}

export function calculateTotalCost(mode: GenerationMode, quantity: number): number {
  return getUnitPrice(mode, quantity) * quantity
}

export function formatCurrency(cents: number): string {
  const value = Math.abs(cents / 100)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cents < 0 ? '-' : ''}R$\u00A0${value}`
}

/** Deterministic date formatter (dd/mm/yyyy) — avoids hydration mismatches from Intl */
export function formatDateBR(date: Date | { seconds: number }): string {
  const d = date instanceof Date ? date : new Date((date as { seconds: number }).seconds * 1000)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// ==================== VARIAÇÕES (IMAGEM) ====================

export const VARIATION_STRATEGIES = [
  'Use vibrant, saturated colors with a bold geometric layout',
  'Apply a minimalist approach with lots of negative space',
  'Use a warm color palette with organic, flowing shapes',
  'Create a dark/moody aesthetic with dramatic lighting',
  'Design with bright pastels and rounded, friendly shapes',
  'Use high contrast black and white with a single accent color',
  'Create a retro/vintage look with muted, desaturated tones',
  'Apply a futuristic, techy look with gradients and glows',
  'Use natural, earthy tones with textured backgrounds',
  'Create a luxury, premium feel with gold/silver accents',
  'Design with bold typography as the main visual element',
  'Use a collage/mixed-media approach with overlapping elements',
  'Create a 3D/isometric style with depth and shadows',
  'Use neon colors on dark background for a club/nightlife vibe',
  'Apply a hand-drawn/sketch aesthetic with imperfect lines',
  'Use a split-layout with contrasting halves',
  'Create a photography-based design with minimal overlays',
  'Design with pop art influences (dots, bold outlines, primary colors)',
  'Use a gradient mesh background with floating elements',
  'Create an infographic-inspired layout with data visualization',
  'Use a magazine/editorial layout with sophisticated typography',
  'Design with watercolor/painted textures and soft edges',
  'Create a brutalist design with raw, unconventional layouts',
  'Use pattern/textile-inspired backgrounds with cultural motifs',
  'Design with cinematic wide-angle composition and film grain',
  'Create a botanical/nature-inspired design with organic patterns',
  'Use geometric patterns inspired by Art Deco style',
  'Design with a children-friendly, playful illustration style',
  'Create a monochromatic design using shades of a single color',
  'Use a glassmorphism/frosted glass effect with soft blurs',
]

// ==================== VARIAÇÕES (COPY) ====================

export const COPY_STRATEGIES = [
  {
    name: 'Storytelling',
    description: 'Crie uma micro-história envolvente que conecte emocionalmente com o público.',
  },
  {
    name: 'Pergunta provocativa',
    description: 'Comece com uma pergunta que desperte curiosidade e engaje o leitor.',
  },
  {
    name: 'Dado impactante',
    description: 'Abra com um fato surpreendente ou estatística relevante.',
  },
  {
    name: 'Benefício direto',
    description: 'Apresente a proposta de valor de forma clara e direta.',
  },
  {
    name: 'Prova social',
    description: 'Use ângulo de testemunho, autoridade ou validação social.',
  },
  {
    name: 'Urgência natural',
    description: 'Crie FOMO sutil sem pressão agressiva.',
  },
]

// ==================== GEMINI MODEL ====================

export const GEMINI_MODEL = 'gemini-2.0-flash-preview-image-generation'

// ==================== AI ADVANCED COSTS ====================

export const UPSCALE_COST_CENTS: Record<string, number> = {
  '2x': 50,  // R$ 0,50
  '4x': 99,  // R$ 0,99
}

export const BG_REMOVAL_COST_CENTS = 50 // R$ 0,50
export const VARIATION_COST_CENTS = 150 // R$ 1,50 per variation set (up to 5)

// ==================== LOGO POSITIONS ====================

export const LOGO_POSITIONS = [
  'canto inferior direito',
  'canto inferior esquerdo',
  'canto superior direito',
  'canto superior esquerdo',
  'centro inferior',
  'centro superior',
]
