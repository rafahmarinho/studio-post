'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StreamingGrid } from '@/components/shared/streaming-grid'
import { ResultsGrid } from '@/components/shared/results-grid'
import { PricingPanel } from '@/components/shared/pricing-panel'
import { IdeaModal } from '@/components/shared/idea-modal'
import { ImageModal } from '@/components/shared/image-modal'
import {
  PLATFORM_CONFIG,
  IMAGE_FORMAT_CONFIG,
  PLATFORM_IMAGE_FORMATS,
  TONE_LABELS,
  VISUAL_STYLE_LABELS,
  IMAGE_ELEMENT_LABELS,
  SCENARIO_LABELS,
  MOOD_LABELS,
  LIGHTING_LABELS,
  BACKGROUND_LABELS,
  GENERATION_MODE_LABELS,
} from '@/types'
import type {
  ContentPlatform,
  ImageFormat,
  ToneType,
  VisualStyle,
  ImageElement,
  ScenarioType,
  MoodType,
  LightingType,
  BackgroundType,
  GenerationMode,
  CreativeBriefData,
} from '@/types'
import { toast } from 'sonner'
import { Lightbulb, Upload, X, Wand2 } from 'lucide-react'

const PHASE_LABELS: Record<string, string> = {
  idle: 'Aguardando',
  uploading: 'Enviando arquivos...',
  images: 'Gerando imagens...',
  captions: 'Gerando legendas...',
  saving: 'Salvando...',
  done: 'Concluído!',
}

export default function GeneratePage() {
  const { userDoc } = useAuth()
  const {
    generating,
    generationProgress,
    generationPhase,
    currentGeneration,
    streamedImageUrls,
    totalExpectedImages,
    imageVersions,
    generateImages,
    initVersions,
  } = useCreative()

  const [ideaOpen, setIdeaOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // Form state
  const [platform, setPlatform] = useState<ContentPlatform>('instagram')
  const [imageFormat, setImageFormat] = useState<ImageFormat>('feed')
  const [context, setContext] = useState('')
  const [purpose, setPurpose] = useState('')
  const [intent, setIntent] = useState('')
  const [tone, setTone] = useState<ToneType>('professional')
  const [toneCustom, setToneCustom] = useState('')
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('photography')
  const [visualStyleCustom, setVisualStyleCustom] = useState('')
  const [imageElements, setImageElements] = useState<ImageElement[]>([])
  const [scenario, setScenario] = useState<ScenarioType>('realistic')
  const [scenarioCustom, setScenarioCustom] = useState('')
  const [mood, setMood] = useState<MoodType>('vibrant')
  const [moodCustom, setMoodCustom] = useState('')
  const [lighting, setLighting] = useState<LightingType>('natural')
  const [background, setBackground] = useState<BackgroundType>('photographic')
  const [multipleElements, setMultipleElements] = useState(false)
  const [targetAudience, setTargetAudience] = useState('')
  const [colors, setColors] = useState('')
  const [textOnImage, setTextOnImage] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [totalImages, setTotalImages] = useState(5)
  const [carouselCount, setCarouselCount] = useState(1)
  const [imagesPerCarousel, setImagesPerCarousel] = useState(5)
  const [generationMode, setGenerationMode] = useState<GenerationMode>('both')
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const refFileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const availableFormats = PLATFORM_IMAGE_FORMATS[platform] || ['square']

  function handleIdeaFill(idea: Partial<CreativeBriefData>) {
    if (idea.platform) setPlatform(idea.platform)
    if (idea.imageFormat) setImageFormat(idea.imageFormat)
    if (idea.context) setContext(idea.context)
    if (idea.purpose) setPurpose(idea.purpose)
    if (idea.intent) setIntent(idea.intent)
    if (idea.tone) setTone(idea.tone)
    if (idea.toneCustom) setToneCustom(idea.toneCustom)
    if (idea.visualStyle) setVisualStyle(idea.visualStyle)
    if (idea.visualStyleCustom) setVisualStyleCustom(idea.visualStyleCustom)
    if (idea.imageElements) setImageElements(idea.imageElements)
    if (idea.scenario) setScenario(idea.scenario)
    if (idea.scenarioCustom) setScenarioCustom(idea.scenarioCustom)
    if (idea.mood) setMood(idea.mood)
    if (idea.moodCustom) setMoodCustom(idea.moodCustom)
    if (idea.lighting) setLighting(idea.lighting)
    if (idea.background) setBackground(idea.background)
    if (idea.multipleElements !== undefined) setMultipleElements(idea.multipleElements)
    if (idea.targetAudience) setTargetAudience(idea.targetAudience)
    if (idea.colors) setColors(idea.colors)
    if (idea.textOnImage) setTextOnImage(idea.textOnImage)
    if (idea.additionalNotes) setAdditionalNotes(idea.additionalNotes)
    if (idea.totalImages) setTotalImages(idea.totalImages)
    if (idea.generationMode) setGenerationMode(idea.generationMode)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!context.trim()) {
      toast.error('Preencha o contexto do criativo')
      return
    }

    const brief: CreativeBriefData = {
      platform,
      imageFormat,
      context,
      purpose,
      intent,
      tone,
      toneCustom: tone === 'other' ? toneCustom : undefined,
      visualStyle,
      visualStyleCustom: visualStyle === 'other' ? visualStyleCustom : undefined,
      imageElements,
      scenario,
      scenarioCustom: scenario === 'other' ? scenarioCustom : undefined,
      mood,
      moodCustom: mood === 'other' ? moodCustom : undefined,
      lighting,
      background,
      multipleElements,
      targetAudience,
      colors,
      textOnImage,
      additionalNotes,
      totalImages: imageFormat === 'carousel' ? carouselCount * imagesPerCarousel : totalImages,
      carouselCount: imageFormat === 'carousel' ? carouselCount : undefined,
      imagesPerCarousel: imageFormat === 'carousel' ? imagesPerCarousel : undefined,
      generationMode,
      referenceFiles: referenceFiles.length > 0 ? referenceFiles : undefined,
      logoFile: logoFile || undefined,
    }

    try {
      const result = await generateImages(brief)
      if (result) {
        initVersions(result)
        toast.success(`Geração concluída! ${result.generatedImageUrls.length} imagens geradas.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na geração')
    }
  }

  function handleRefFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setReferenceFiles((prev) => [...prev, ...files].slice(0, 5))
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setLogoFile(file)
  }

  const computedTotal =
    imageFormat === 'carousel' ? carouselCount * imagesPerCarousel : totalImages

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerar Criativos</h1>
          <p className="text-muted-foreground">
            Preencha o brief ou use a IA para gerar automaticamente
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setIdeaOpen(true)}>
          <Lightbulb className="h-4 w-4" />
          Preencher com IA
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Generation mode */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Modo de Geração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(GENERATION_MODE_LABELS) as [GenerationMode, string][]).map(
                    ([key, label]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={generationMode === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGenerationMode(key)}
                      >
                        {label}
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Platform & Format */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plataforma & Formato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Plataforma</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(PLATFORM_CONFIG) as [ContentPlatform, typeof PLATFORM_CONFIG[ContentPlatform]][]).map(
                      ([key, cfg]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={platform === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setPlatform(key)
                            const formats = PLATFORM_IMAGE_FORMATS[key]
                            if (formats && !formats.includes(imageFormat)) {
                              setImageFormat(formats[0])
                            }
                          }}
                        >
                          {cfg.emoji} {cfg.label}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <Label>Formato</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFormats.map((fmt) => {
                      const cfg = IMAGE_FORMAT_CONFIG[fmt]
                      return (
                        <Button
                          key={fmt}
                          type="button"
                          variant={imageFormat === fmt ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImageFormat(fmt)}
                        >
                          {cfg.label} ({cfg.aspectRatio})
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {imageFormat === 'carousel' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="carouselCount">Qtd. Carrosseis</Label>
                        <Input
                          id="carouselCount"
                          type="number"
                          min={1}
                          max={10}
                          value={carouselCount}
                          onChange={(e) => setCarouselCount(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imagesPerCarousel">Slides por Carrossel</Label>
                        <Input
                          id="imagesPerCarousel"
                          type="number"
                          min={2}
                          max={10}
                          value={imagesPerCarousel}
                          onChange={(e) => setImagesPerCarousel(Number(e.target.value))}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="totalImages">Quantidade de Imagens</Label>
                      <Input
                        id="totalImages"
                        type="number"
                        min={1}
                        max={30}
                        value={totalImages}
                        onChange={(e) => setTotalImages(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contexto & Objetivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="context">Contexto do criativo *</Label>
                  <Textarea
                    id="context"
                    placeholder="Descreva o que precisa: produto, serviço, campanha, promoção..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Propósito</Label>
                    <Input
                      id="purpose"
                      placeholder="Ex: Lançamento de produto"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intent">Intenção</Label>
                    <Input
                      id="intent"
                      placeholder="Ex: Conversão, engajamento"
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Público-alvo</Label>
                  <Input
                    id="targetAudience"
                    placeholder="Ex: Jovens 18-25 anos, empreendedores"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estilo Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tom</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(TONE_LABELS) as [ToneType, string][]).map(([key, label]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={tone === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTone(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  {tone === 'other' && (
                    <Input
                      className="mt-2"
                      placeholder="Descreva o tom"
                      value={toneCustom}
                      onChange={(e) => setToneCustom(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label>Estilo Visual</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(VISUAL_STYLE_LABELS) as [VisualStyle, string][]).map(
                      ([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={visualStyle === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualStyle(key)}
                        >
                          {label}
                        </Button>
                      )
                    )}
                  </div>
                  {visualStyle === 'other' && (
                    <Input
                      className="mt-2"
                      placeholder="Descreva o estilo"
                      value={visualStyleCustom}
                      onChange={(e) => setVisualStyleCustom(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label>Elementos da Imagem</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(IMAGE_ELEMENT_LABELS) as [ImageElement, string][]).map(
                      ([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={imageElements.includes(key) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setImageElements((prev) =>
                              prev.includes(key)
                                ? prev.filter((e) => e !== key)
                                : [...prev, key]
                            )
                          }
                        >
                          {label}
                        </Button>
                      )
                    )}
                  </div>
                  {imageElements.length > 1 && (
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <Checkbox
                        checked={multipleElements}
                        onCheckedChange={(c) => setMultipleElements(!!c)}
                      />
                      Combinar múltiplos elementos na mesma imagem
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ambiance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ambientação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cenário</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(SCENARIO_LABELS) as [ScenarioType, string][]).map(
                      ([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={scenario === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setScenario(key)}
                        >
                          {label}
                        </Button>
                      )
                    )}
                  </div>
                  {scenario === 'other' && (
                    <Input
                      className="mt-2"
                      placeholder="Descreva o cenário"
                      value={scenarioCustom}
                      onChange={(e) => setScenarioCustom(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label>Mood / Atmosfera</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(MOOD_LABELS) as [MoodType, string][]).map(([key, label]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={mood === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMood(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  {mood === 'other' && (
                    <Input
                      className="mt-2"
                      placeholder="Descreva o mood"
                      value={moodCustom}
                      onChange={(e) => setMoodCustom(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label>Iluminação</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(LIGHTING_LABELS) as [LightingType, string][]).map(
                      ([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={lighting === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLighting(key)}
                        >
                          {label}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <Label>Fundo</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Object.entries(BACKGROUND_LABELS) as [BackgroundType, string][]).map(
                      ([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          variant={background === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setBackground(key)}
                        >
                          {label}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extra */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="colors">Cores</Label>
                    <Input
                      id="colors"
                      placeholder="Ex: azul, branco, dourado"
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textOnImage">Texto na imagem</Label>
                    <Input
                      id="textOnImage"
                      placeholder="Ex: 50% OFF, Promoção"
                      value={textOnImage}
                      onChange={(e) => setTextOnImage(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Observações adicionais</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Qualquer informação extra para a IA..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Imagens de Referência (até 5)</Label>
                    <div className="flex flex-wrap gap-2">
                      {referenceFiles.map((f, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {f.name.slice(0, 20)}
                          <button
                            type="button"
                            onClick={() =>
                              setReferenceFiles((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <input
                      ref={refFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleRefFiles}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => refFileInputRef.current?.click()}
                      disabled={referenceFiles.length >= 5}
                    >
                      <Upload className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    {logoFile ? (
                      <Badge variant="secondary" className="gap-1">
                        {logoFile.name.slice(0, 20)}
                        <button type="button" onClick={() => setLogoFile(null)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {logoFile ? 'Trocar' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Progress */}
            {generating && (
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {PHASE_LABELS[generationPhase] || generationPhase}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(generationProgress)}%
                    </span>
                  </div>
                  <Progress value={generationProgress} />
                  {streamedImageUrls.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {streamedImageUrls.length} de {totalExpectedImages} imagens geradas
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={generating || !context.trim()}
            >
              <Wand2 className="h-5 w-5" />
              {generating ? 'Gerando...' : `Gerar ${computedTotal} Criativos`}
            </Button>
          </form>

          {/* Streaming grid */}
          {generating && streamedImageUrls.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Gerando em tempo real...</h2>
              <StreamingGrid
                streamedImageUrls={streamedImageUrls}
                totalExpectedImages={totalExpectedImages}
                generationProgress={generationProgress}
              />
            </div>
          )}

          {/* Results */}
          {!generating && currentGeneration && (
            <div className="mt-6">
              <Tabs defaultValue="images">
                <TabsList>
                  <TabsTrigger value="images">
                    Imagens ({currentGeneration.generatedImageUrls.length})
                  </TabsTrigger>
                  {currentGeneration.generatedCaptions && (
                    <TabsTrigger value="captions">
                      Legendas ({currentGeneration.generatedCaptions.length})
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="images" className="mt-4">
                  <ResultsGrid
                    imageUrls={currentGeneration.generatedImageUrls}
                    captions={currentGeneration.generatedCaptions}
                    imageVersions={imageVersions}
                    onImageClick={(index) => {
                      setSelectedImageIndex(index)
                    }}
                  />
                </TabsContent>
                {currentGeneration.generatedCaptions && (
                  <TabsContent value="captions" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {currentGeneration.generatedCaptions.map((caption, i) => (
                        <Card key={i}>
                          <CardContent className="p-4 space-y-2">
                            <p className="font-semibold text-sm">{caption.headline}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {caption.body}
                            </p>
                            {caption.cta && (
                              <p className="text-sm font-medium text-primary">{caption.cta}</p>
                            )}
                            {caption.hashtags.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {caption.hashtags.map((h) => `#${h}`).join(' ')}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </div>

        {/* Pricing sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <PricingPanel
              generationMode={generationMode}
              onGenerationModeChange={setGenerationMode}
              totalImages={computedTotal}
              onTotalImagesChange={setTotalImages}
              imageFormat={imageFormat}
              carouselCount={carouselCount}
              onCarouselCountChange={setCarouselCount}
              imagesPerCarousel={imagesPerCarousel}
              onImagesPerCarouselChange={setImagesPerCarousel}
              onGenerate={() => {}}
              generating={generating}
              summaryItems={[
                { label: 'Plano', value: userDoc?.tier === 'own_keys' ? 'BYO Keys' : userDoc?.tier === 'paid' ? 'Pago' : 'Gratuito' },
                { label: 'Imagens', value: String(computedTotal) },
              ]}
            />
          </div>
        </div>
      </div>

      <IdeaModal
        open={ideaOpen}
        onOpenChange={(open) => {
          setIdeaOpen(open)
        }}
        onGenerate={async (description) => {
          const res = await fetch('/api/creative/idea', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description,
              apiKey: userDoc?.tier === 'own_keys' ? userDoc?.apiKeys?.openaiKey : undefined,
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          if (data.idea) handleIdeaFill(data.idea)
        }}
      />

      {selectedImageIndex !== null && currentGeneration && (
        <ImageModal
          open={selectedImageIndex !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedImageIndex(null)
          }}
          imageUrl={
            (imageVersions[selectedImageIndex] || [
              currentGeneration.generatedImageUrls[selectedImageIndex],
            ]).slice(-1)[0]
          }
          imageIndex={selectedImageIndex}
          caption={currentGeneration.generatedCaptions?.[selectedImageIndex]}
          versions={
            imageVersions[selectedImageIndex] || [
              currentGeneration.generatedImageUrls[selectedImageIndex],
            ]
          }
          onRefine={async () => {}}
          refining={false}
        />
      )}
    </div>
  )
}
