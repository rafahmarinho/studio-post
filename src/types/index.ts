// ==================== PLATAFORMAS ====================

export type ContentPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'twitter'
  | 'blog'
  | 'email'
  | 'pinterest'
  | 'other'

export const PLATFORM_CONFIG: Record<
  ContentPlatform,
  { label: string; color: string; emoji: string }
> = {
  instagram: { label: 'Instagram', color: '#E4405F', emoji: '📸' },
  facebook: { label: 'Facebook', color: '#1877F2', emoji: '👍' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', emoji: '💼' },
  tiktok: { label: 'TikTok', color: '#000000', emoji: '🎵' },
  youtube: { label: 'YouTube', color: '#FF0000', emoji: '▶️' },
  twitter: { label: 'X (Twitter)', color: '#1DA1F2', emoji: '🐦' },
  blog: { label: 'Blog', color: '#FF5722', emoji: '📝' },
  email: { label: 'Email Marketing', color: '#4CAF50', emoji: '📧' },
  pinterest: { label: 'Pinterest', color: '#BD081C', emoji: '📌' },
  other: { label: 'Outro', color: '#9E9E9E', emoji: '🌐' },
}

// ==================== FORMATOS DE IMAGEM ====================

export type ImageFormat =
  | 'feed'
  | 'stories'
  | 'carousel'
  | 'landscape'
  | 'square'
  | 'portrait'
  | 'wide'
  | 'other'

export const IMAGE_FORMAT_CONFIG: Record<
  ImageFormat,
  { label: string; aspectRatio: string; dimensions: string }
> = {
  feed: { label: 'Feed', aspectRatio: '1:1', dimensions: '1024×1024' },
  stories: { label: 'Stories', aspectRatio: '9:16', dimensions: '768×1376' },
  carousel: { label: 'Carrossel', aspectRatio: '1:1', dimensions: '1024×1024' },
  landscape: { label: 'Paisagem (16:9)', aspectRatio: '16:9', dimensions: '1376×768' },
  square: { label: 'Quadrado', aspectRatio: '1:1', dimensions: '1024×1024' },
  portrait: { label: 'Retrato (3:4)', aspectRatio: '3:4', dimensions: '896×1200' },
  wide: { label: 'Widescreen (4:3)', aspectRatio: '4:3', dimensions: '1200×896' },
  other: { label: 'Outro (1:1)', aspectRatio: '1:1', dimensions: '1024×1024' },
}

export const PLATFORM_IMAGE_FORMATS: Partial<Record<ContentPlatform, ImageFormat[]>> = {
  instagram: ['feed', 'stories', 'carousel', 'portrait'],
  facebook: ['feed', 'stories', 'landscape', 'wide'],
  linkedin: ['feed', 'landscape', 'wide'],
  tiktok: ['stories', 'portrait'],
  youtube: ['landscape', 'wide'],
  twitter: ['feed', 'landscape'],
  blog: ['landscape', 'wide', 'feed'],
  email: ['feed', 'landscape', 'wide'],
  pinterest: ['portrait', 'stories'],
  other: ['square', 'landscape', 'portrait', 'wide'],
}

// ==================== TOM ====================

export type ToneType =
  | 'friendly'
  | 'funny'
  | 'persuasive'
  | 'professional'
  | 'bold'
  | 'elegant'
  | 'minimalist'
  | 'other'

export const TONE_LABELS: Record<ToneType, string> = {
  friendly: 'Amigável',
  funny: 'Engraçado',
  persuasive: 'Persuasivo',
  professional: 'Profissional',
  bold: 'Ousado',
  elegant: 'Elegante',
  minimalist: 'Minimalista',
  other: 'Outro',
}

// ==================== ESTILO VISUAL ====================

export type VisualStyle =
  | 'photography'
  | 'cartoon'
  | 'illustration'
  | 'flat'
  | '3d'
  | 'watercolor'
  | 'minimalist'
  | 'collage'
  | 'pop_art'
  | 'digital_art'
  | 'pixel_art'
  | 'other'

export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  photography: 'Fotografia Realista',
  cartoon: 'Cartoon / Desenho',
  illustration: 'Ilustração',
  flat: 'Flat Design',
  '3d': '3D Render',
  watercolor: 'Aquarela / Pintado',
  minimalist: 'Minimalista',
  collage: 'Colagem / Mix',
  pop_art: 'Pop Art',
  digital_art: 'Arte Digital',
  pixel_art: 'Pixel Art',
  other: 'Outro',
}

// ==================== ELEMENTOS DE IMAGEM ====================

export type ImageElement =
  | 'real_people'
  | 'mascot'
  | 'animals'
  | 'products'
  | 'landscapes'
  | 'text_only'
  | 'icons'
  | 'abstract_shapes'
  | 'food'
  | 'vehicles'

export const IMAGE_ELEMENT_LABELS: Record<ImageElement, string> = {
  real_people: '👤 Pessoas Reais',
  mascot: '🧸 Mascote',
  animals: '🐾 Animais',
  products: '📦 Objetos / Produtos',
  landscapes: '🏞️ Paisagens / Cenários',
  text_only: '🔤 Somente Textos',
  icons: '⭐ Ícones / Grafismos',
  abstract_shapes: '🔷 Formas Abstratas',
  food: '🍔 Comida / Bebida',
  vehicles: '🚗 Veículos',
}

// ==================== CENÁRIO ====================

export type ScenarioType =
  | 'realistic'
  | 'fantasy'
  | 'abstract'
  | 'studio'
  | 'outdoor'
  | 'urban'
  | 'corporate'
  | 'festive'
  | 'other'

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  realistic: 'Realista',
  fantasy: 'Ficção / Fantasia',
  abstract: 'Abstrato',
  studio: 'Estúdio (fundo liso)',
  outdoor: 'Ao ar livre / Natureza',
  urban: 'Urbano / Cidade',
  corporate: 'Corporativo / Escritório',
  festive: 'Festivo / Comemorativo',
  other: 'Outro',
}

// ==================== MOOD ====================

export type MoodType =
  | 'vibrant'
  | 'calm'
  | 'dramatic'
  | 'luxury'
  | 'fun'
  | 'tech'
  | 'organic'
  | 'dark'
  | 'retro'
  | 'other'

export const MOOD_LABELS: Record<MoodType, string> = {
  vibrant: 'Vibrante / Animado',
  calm: 'Calmo / Sereno',
  dramatic: 'Dramático / Impactante',
  luxury: 'Luxuoso / Premium',
  fun: 'Divertido / Leve',
  tech: 'Tecnológico / Futurista',
  organic: 'Natural / Orgânico',
  dark: 'Dark / Sombrio',
  retro: 'Retrô / Nostálgico',
  other: 'Outro',
}

// ==================== ILUMINAÇÃO ====================

export type LightingType =
  | 'natural'
  | 'studio'
  | 'neon'
  | 'dramatic'
  | 'soft'
  | 'golden_hour'
  | 'other'

export const LIGHTING_LABELS: Record<LightingType, string> = {
  natural: 'Natural',
  studio: 'Estúdio',
  neon: 'Neon / Colorida',
  dramatic: 'Dramática / Alto contraste',
  soft: 'Suave / Difusa',
  golden_hour: 'Dourada (Golden Hour)',
  other: 'Outro',
}

// ==================== FUNDO ====================

export type BackgroundType =
  | 'solid'
  | 'gradient'
  | 'textured'
  | 'transparent'
  | 'photographic'
  | 'pattern'
  | 'other'

export const BACKGROUND_LABELS: Record<BackgroundType, string> = {
  solid: 'Cor Sólida',
  gradient: 'Gradiente',
  textured: 'Texturizado',
  transparent: 'Transparente / Limpo',
  photographic: 'Fotográfico / Cenário',
  pattern: 'Padrão / Estampa',
  other: 'Outro',
}

// ==================== MODO DE GERAÇÃO ====================

export type GenerationMode = 'images_only' | 'captions_only' | 'both'

export const GENERATION_MODE_LABELS: Record<GenerationMode, string> = {
  images_only: 'Somente Imagens',
  captions_only: 'Somente Legendas',
  both: 'Imagens + Legendas',
}

// ==================== STATUS ====================

export type CreativeStatus = 'pending' | 'generating' | 'completed' | 'failed'

// ==================== LEGENDA ====================

export interface GeneratedCaption {
  headline: string
  body: string
  cta: string
  hashtags: string[]
}

// ==================== MODELOS DE DADOS ====================

export interface CreativeGeneration {
  id: string
  userId: string
  userName: string
  clientId?: string
  clientName?: string
  platform: ContentPlatform
  imageFormat: ImageFormat
  context: string
  purpose: string
  intent: string
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
  targetAudience?: string
  colors?: string
  textOnImage?: string
  additionalNotes?: string
  referenceImageUrls: string[]
  logoUrl?: string
  totalImages: number
  carouselCount?: number
  imagesPerCarousel?: number
  generationMode: GenerationMode
  generatedImageUrls: string[]
  generatedCaptions?: GeneratedCaption[]
  imageVersions?: Record<string, string[]>
  status: CreativeStatus
  costPerImage: number
  totalCost: number
  assembledPrompt?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreativeCost {
  id: string
  userId: string
  userName: string
  clientId?: string
  clientName?: string
  generationId: string
  imageCount: number
  costPerImage: number
  totalCost: number
  type: 'generation' | 'refinement'
  createdAt: Date
}

export interface UserDoc {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'admin' | 'user'
  tier: 'own_keys' | 'paid'
  apiKeys?: {
    geminiKey?: string
    openaiKey?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CostsSummary {
  totalCost: number
  totalImages: number
  byUser: {
    userId: string
    userName: string
    totalCost: number
    totalImages: number
    lastGeneration: Date
  }[]
}

// ==================== BRIEF DATA (formulário) ====================

export interface CreativeBriefData {
  platform: ContentPlatform
  imageFormat: ImageFormat
  context: string
  purpose: string
  intent: string
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
  targetAudience?: string
  colors?: string
  textOnImage?: string
  additionalNotes?: string
  referenceFiles?: File[]
  logoFile?: File
  totalImages: number
  carouselCount?: number
  imagesPerCarousel?: number
  generationMode: GenerationMode
}

// ==================== REFINE ====================

export interface RefineParams {
  generationId: string
  imageIndex: number
  version: number
  originalImageUrl: string
  refinementPrompt: string
  aspectRatio: string
}

export interface RefineResult {
  url: string
  version: number
}



// ==================== GENERATION PHASE ====================

export type GenerationPhase = 'idle' | 'uploading' | 'images' | 'captions' | 'saving' | 'done'

// ==================== AI ADVANCED ====================

export type UpscaleScale = '2x' | '4x'

export interface UpscaleRequest {
  imageUrl: string
  scale: UpscaleScale
  generationId: string
  imageIndex: number
}

export interface UpscaleResult {
  url: string
  scale: UpscaleScale
  originalWidth: number
  originalHeight: number
  newWidth: number
  newHeight: number
}

export interface BackgroundRemovalRequest {
  imageUrl: string
  generationId: string
  imageIndex: number
  outputFormat: 'png' | 'webp'
}

export interface BackgroundRemovalResult {
  url: string
  format: string
}

export interface VariationsRequest {
  imageUrl: string
  generationId: string
  imageIndex: number
  count: number // 1–5
  strength: number // 0.3–0.9 (how different from original)
  aspectRatio: string
}

export interface VariationsResult {
  urls: string[]
  count: number
}

// ==================== BRAND KIT ====================

export interface BrandKit {
  id: string
  userId: string
  tenantId?: string
  name: string
  description?: string
  logoUrl?: string
  colors: BrandColor[]
  fonts: BrandFont[]
  tone: ToneType
  toneCustom?: string
  visualStyle: VisualStyle
  visualStyleCustom?: string
  mood?: MoodType
  moodCustom?: string
  defaultPlatform?: ContentPlatform
  defaultFormat?: ImageFormat
  guidelines?: string // free-text brand guidelines
  createdAt: Date
  updatedAt: Date
}

export interface BrandColor {
  name: string
  hex: string
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'text'
}

export interface BrandFont {
  name: string
  role: 'heading' | 'body' | 'accent'
  weight?: string
}

// ==================== TEMPLATES ====================

export interface CreativeTemplate {
  id: string
  userId: string
  tenantId?: string
  name: string
  description?: string
  category: TemplateCategory
  thumbnail?: string
  isPublic: boolean
  fields: Partial<CreativeBriefData>
  brandKitId?: string
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export type TemplateCategory =
  | 'social_media'
  | 'ecommerce'
  | 'event'
  | 'seasonal'
  | 'corporate'
  | 'food'
  | 'fashion'
  | 'tech'
  | 'education'
  | 'custom'

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  social_media: 'Redes Sociais',
  ecommerce: 'E-commerce',
  event: 'Eventos',
  seasonal: 'Sazonal / Datas',
  corporate: 'Corporativo',
  food: 'Gastronomia',
  fashion: 'Moda',
  tech: 'Tecnologia',
  education: 'Educação',
  custom: 'Personalizado',
}

// ==================== ENTERPRISE / MULTI-TENANT ====================

export interface Tenant {
  id: string
  name: string
  slug: string // unique subdomain/path identifier
  ownerId: string
  logoUrl?: string
  primaryColor?: string
  plan: TenantPlan
  settings: TenantSettings
  members: TenantMember[]
  apiKeyHash?: string // hashed public API key
  createdAt: Date
  updatedAt: Date
}

export type TenantPlan = 'starter' | 'professional' | 'enterprise'

export const TENANT_PLAN_LABELS: Record<TenantPlan, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

export const TENANT_PLAN_LIMITS: Record<TenantPlan, { members: number; dailyImages: number; brandKits: number; templates: number; apiAccess: boolean }> = {
  starter: { members: 3, dailyImages: 50, brandKits: 2, templates: 10, apiAccess: false },
  professional: { members: 10, dailyImages: 200, brandKits: 10, templates: 50, apiAccess: true },
  enterprise: { members: -1, dailyImages: -1, brandKits: -1, templates: -1, apiAccess: true }, // -1 = unlimited
}

export interface TenantSettings {
  allowMemberOwnKeys: boolean
  defaultTier: 'own_keys' | 'paid'
  watermark?: string
  customDomain?: string
  webhookUrl?: string
}

export interface TenantMember {
  userId: string
  email: string
  displayName: string
  role: TenantRole
  joinedAt: Date
}

export type TenantRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
}

// ==================== PUBLIC API ====================

export interface ApiKey {
  id: string
  tenantId: string
  name: string
  keyPrefix: string // first 8 chars for display (e.g., "sp_live_abc")
  keyHash: string // bcrypt hash of full key
  permissions: ApiPermission[]
  rateLimit: number // requests per minute
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt: Date
}

export type ApiPermission =
  | 'generate:images'
  | 'generate:captions'
  | 'generate:refine'
  | 'generate:upscale'
  | 'generate:variations'
  | 'generate:remove_bg'
  | 'read:generations'
  | 'read:costs'
  | 'manage:brand_kits'
  | 'manage:templates'

export const API_PERMISSION_LABELS: Record<ApiPermission, string> = {
  'generate:images': 'Gerar Imagens',
  'generate:captions': 'Gerar Legendas',
  'generate:refine': 'Refinar Imagens',
  'generate:upscale': 'Upscaling',
  'generate:variations': 'Variações',
  'generate:remove_bg': 'Remover Fundo',
  'read:generations': 'Ler Gerações',
  'read:costs': 'Ler Custos',
  'manage:brand_kits': 'Gerenciar Brand Kits',
  'manage:templates': 'Gerenciar Templates',
}

// ==================== REPORTS ====================

export interface PerformanceReport {
  period: ReportPeriod
  startDate: Date
  endDate: Date
  metrics: ReportMetrics
  dailyBreakdown: DailyMetrics[]
  topPlatforms: PlatformMetric[]
  topFormats: FormatMetric[]
  costAnalysis: CostAnalysis
}

export type ReportPeriod = '7d' | '30d' | '90d' | 'custom'

export interface ReportMetrics {
  totalGenerations: number
  totalImages: number
  totalCaptions: number
  totalRefinements: number
  totalUpscales: number
  totalVariations: number
  totalBackgroundRemovals: number
  totalCostCents: number
  avgImagesPerGeneration: number
  avgCostPerImage: number
  successRate: number
}

export interface DailyMetrics {
  date: string // YYYY-MM-DD
  generations: number
  images: number
  costCents: number
}

export interface PlatformMetric {
  platform: ContentPlatform
  count: number
  percentage: number
}

export interface FormatMetric {
  format: ImageFormat
  count: number
  percentage: number
}

export interface CostAnalysis {
  totalRevenue: number
  totalApiCost: number
  margin: number
  avgRevenuePerUser: number
}

// ==================== v1.2 — INTEGRATIONS ====================

// --- Meta API (Instagram/Facebook) ---

export type MetaAccountType = 'instagram_business' | 'facebook_page'

export interface MetaConnection {
  id: string
  userId: string
  tenantId?: string
  accountType: MetaAccountType
  accountId: string        // IG business account ID or FB page ID
  accountName: string
  accountUsername?: string  // @handle
  accountAvatar?: string
  accessToken: string      // encrypted long-lived token
  tokenExpiresAt: Date
  permissions: string[]    // e.g. ['publish_content','read_insights']
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export const META_ACCOUNT_LABELS: Record<MetaAccountType, string> = {
  instagram_business: 'Instagram Business',
  facebook_page: 'Página do Facebook',
}

// --- Scheduling ---

export type ScheduleStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'

export interface ScheduledPost {
  id: string
  userId: string
  tenantId?: string
  generationId: string
  connectionId: string     // which MetaConnection to publish to
  platform: ContentPlatform
  imageUrls: string[]      // which images to publish
  caption?: string         // formatted caption text
  scheduledAt: Date        // when to publish (UTC)
  publishedAt?: Date       // actual publish time
  status: ScheduleStatus
  externalPostId?: string  // ID returned by Meta after publishing
  externalUrl?: string     // permalink to the published post
  errorMessage?: string
  retryCount: number
  createdAt: Date
  updatedAt: Date
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled: 'Agendado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Falhou',
  cancelled: 'Cancelado',
}

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  scheduled: '#3B82F6',
  publishing: '#F59E0B',
  published: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
}

// --- Export Formats ---

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'pdf'

export interface ExportRequest {
  imageUrls: string[]
  format: ExportFormat
  quality?: number          // 1-100 for jpg/webp
  generationId: string
}

export interface ExportResult {
  downloadUrl: string
  format: ExportFormat
  fileSize: number          // bytes
  fileName: string
}

// --- Preview Mockup ---

export type MockupDevice = 'iphone_15' | 'android_pixel' | 'ipad' | 'desktop_browser'
export type MockupPlatform = 'instagram_feed' | 'instagram_stories' | 'facebook_feed' | 'facebook_stories' | 'linkedin_feed' | 'twitter_feed'

export interface MockupConfig {
  device: MockupDevice
  platform: MockupPlatform
  imageUrl: string
  caption?: string
  accountName?: string
  accountAvatar?: string
  darkMode?: boolean
}

export const MOCKUP_DEVICE_LABELS: Record<MockupDevice, string> = {
  iphone_15: 'iPhone 15',
  android_pixel: 'Android Pixel',
  ipad: 'iPad',
  desktop_browser: 'Desktop Browser',
}

export const MOCKUP_PLATFORM_LABELS: Record<MockupPlatform, string> = {
  instagram_feed: 'Instagram Feed',
  instagram_stories: 'Instagram Stories',
  facebook_feed: 'Facebook Feed',
  facebook_stories: 'Facebook Stories',
  linkedin_feed: 'LinkedIn Feed',
  twitter_feed: 'X (Twitter) Feed',
}

// ==================== v1.3 — COLLABORATION ====================

// --- Share ---

export type SharePermission = 'view' | 'comment' | 'edit'

export interface SharedGeneration {
  id: string
  generationId: string
  sharedBy: string         // userId who shared
  sharedWith: SharedRecipient[]
  publicLink?: string      // optional public share URL token
  publicLinkEnabled: boolean
  expiresAt?: Date         // optional expiration
  createdAt: Date
}

export interface SharedRecipient {
  userId?: string          // if shared with a registered user
  email: string            // invite email
  permission: SharePermission
  acceptedAt?: Date
}

// --- Comments ---

export interface ImageComment {
  id: string
  generationId: string
  imageIndex: number       // which image
  userId: string
  userName: string
  userAvatar?: string
  content: string
  pinX?: number            // 0-100 % position for pin on image
  pinY?: number
  parentId?: string        // reply to another comment
  resolved: boolean
  createdAt: Date
  updatedAt: Date
}

// --- Approval Workflow ---

export type ApprovalStatus = 'pending_review' | 'changes_requested' | 'approved' | 'rejected'

export interface ApprovalRequest {
  id: string
  generationId: string
  requestedBy: string      // userId
  requestedByName: string
  reviewers: ApprovalReviewer[]
  status: ApprovalStatus
  dueDate?: Date
  message?: string         // cover message from requester
  createdAt: Date
  updatedAt: Date
}

export interface ApprovalReviewer {
  userId: string
  email: string
  displayName: string
  status: ApprovalStatus
  comment?: string
  reviewedAt?: Date
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending_review: 'Aguardando Revisão',
  changes_requested: 'Alterações Solicitadas',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending_review: '#F59E0B',
  changes_requested: '#8B5CF6',
  approved: '#10B981',
  rejected: '#EF4444',
}
