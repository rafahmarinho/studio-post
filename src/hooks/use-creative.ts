'use client'

import { useState, useCallback, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import {
  createGeneration,
  updateGeneration,
  getGenerationsByUser,
  getAllGenerations,
  recordCost,
  getDailySpentByUser,
  getCostsSummary,
  getBrandKitsByUser,
  getTemplatesByUser,
  getPublicTemplates,
} from '@/lib/creative-service'
import {
  DAILY_LIMIT_CENTS,
  REFINE_COST_CENTS,
  UPSCALE_COST_CENTS,
  BG_REMOVAL_COST_CENTS,
  VARIATION_COST_CENTS,
  getDiscount,
  getUnitPrice,
  calculateTotalCost,
} from '@/lib/constants'
import { IMAGE_FORMAT_CONFIG } from '@/types'
import type {
  CreativeGeneration,
  CostsSummary,
  CreativeBriefData,
  RefineParams,
  RefineResult,
  DailyLimitResult,
  GenerationPhase,
  UpscaleRequest,
  UpscaleResult,
  BackgroundRemovalRequest,
  BackgroundRemovalResult,
  VariationsRequest,
  VariationsResult,
  BrandKit,
  CreativeTemplate,
  TemplateCategory,
} from '@/types'
import { useAuth } from '@/lib/auth-context'

export function useCreative() {
  const { user, userDoc } = useAuth()

  const [generations, setGenerations] = useState<CreativeGeneration[]>([])
  const [costsSummary, setCostsSummary] = useState<CostsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle')
  const [currentGeneration, setCurrentGeneration] = useState<CreativeGeneration | null>(null)
  const [streamedImageUrls, setStreamedImageUrls] = useState<string[]>([])
  const [totalExpectedImages, setTotalExpectedImages] = useState(0)
  const [imageVersions, setImageVersions] = useState<Record<number, string[]>>({})
  const [refining, setRefining] = useState(false)
  const [upscaling, setUpscaling] = useState(false)
  const [removingBg, setRemovingBg] = useState(false)
  const [generatingVariations, setGeneratingVariations] = useState(false)
  const [brandKits, setBrandKits] = useState<BrandKit[]>([])
  const [templates, setTemplates] = useState<CreativeTemplate[]>([])

  const abortRef = useRef(false)

  // ==================== DAILY LIMIT ====================

  const checkDailyLimit = useCallback(
    async (userId: string, estimatedCostCents: number): Promise<DailyLimitResult> => {
      const spent = await getDailySpentByUser(userId)
      const allowed = spent + estimatedCostCents <= DAILY_LIMIT_CENTS
      return { allowed, spent, remaining: DAILY_LIMIT_CENTS - spent }
    },
    []
  )

  // ==================== UPLOAD HELPERS ====================

  async function uploadFile(
    generationId: string,
    file: File,
    path: string
  ): Promise<string> {
    const fileRef = ref(storage, `creative/${generationId}/${path}`)
    await uploadBytes(fileRef, file)
    return getDownloadURL(fileRef)
  }

  // ==================== GENERATE ====================

  const generateImages = useCallback(
    async (brief: CreativeBriefData): Promise<CreativeGeneration | null> => {
      if (!user || !userDoc) return null

      abortRef.current = false
      setGenerating(true)
      setGenerationProgress(0)
      setStreamedImageUrls([])
      setImageVersions({})

      try {
        // Calculate total images
        const totalImages =
          brief.imageFormat === 'carousel' &&
          brief.carouselCount &&
          brief.imagesPerCarousel
            ? brief.carouselCount * brief.imagesPerCarousel
            : brief.totalImages

        setTotalExpectedImages(totalImages)

        // Calculate cost
        const unitPrice = getUnitPrice(brief.generationMode, totalImages)
        const totalCost = calculateTotalCost(brief.generationMode, totalImages)

        // Check daily limit (skip for own_keys tier)
        if (userDoc.tier === 'paid') {
          const limit = await checkDailyLimit(user.uid, totalCost)
          if (!limit.allowed) {
            throw new Error(
              `Limite diário excedido. Gasto hoje: R$ ${(limit.spent / 100).toFixed(2)}. Restante: R$ ${(limit.remaining / 100).toFixed(2)}`
            )
          }
        }

        // Create generation document
        setGenerationPhase('uploading')

        const formatConfig = IMAGE_FORMAT_CONFIG[brief.imageFormat]

        // Upload reference files
        const referenceImageUrls: string[] = []
        let logoUrl: string | undefined

        const tempId = `temp_${Date.now()}`

        if (brief.logoFile) {
          logoUrl = await uploadFile(tempId, brief.logoFile, `logo.${brief.logoFile.name.split('.').pop()}`)
        }

        if (brief.referenceFiles) {
          for (let i = 0; i < brief.referenceFiles.length; i++) {
            const file = brief.referenceFiles[i]
            const url = await uploadFile(tempId, file, `ref_${i}.${file.name.split('.').pop()}`)
            referenceImageUrls.push(url)
          }
        }

        const generationId = await createGeneration({
          userId: user.uid,
          userName: user.displayName || user.email || '',
          platform: brief.platform,
          imageFormat: brief.imageFormat,
          context: brief.context,
          purpose: brief.purpose,
          intent: brief.intent,
          tone: brief.tone,
          toneCustom: brief.toneCustom,
          visualStyle: brief.visualStyle,
          visualStyleCustom: brief.visualStyleCustom,
          imageElements: brief.imageElements,
          scenario: brief.scenario,
          scenarioCustom: brief.scenarioCustom,
          mood: brief.mood,
          moodCustom: brief.moodCustom,
          lighting: brief.lighting,
          background: brief.background,
          multipleElements: brief.multipleElements,
          targetAudience: brief.targetAudience,
          colors: brief.colors,
          textOnImage: brief.textOnImage,
          additionalNotes: brief.additionalNotes,
          referenceImageUrls,
          logoUrl,
          totalImages,
          carouselCount: brief.carouselCount,
          imagesPerCarousel: brief.imagesPerCarousel,
          generationMode: brief.generationMode,
          generatedImageUrls: [],
          generatedCaptions: [],
          status: 'generating',
          costPerImage: unitPrice,
          totalCost,
        })

        const generatedUrls: string[] = []

        // Generate images
        if (brief.generationMode !== 'captions_only') {
          setGenerationPhase('images')

          for (let i = 0; i < totalImages; i++) {
            if (abortRef.current) break

            const isCarousel = brief.imageFormat === 'carousel'
            const imagesPerCarousel = brief.imagesPerCarousel || 1

            try {
              const res = await fetch('/api/creative/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  generationId,
                  context: brief.context,
                  platform: brief.platform,
                  aspectRatio: formatConfig.aspectRatio,
                  dimensions: formatConfig.dimensions,
                  tone: brief.tone,
                  toneCustom: brief.toneCustom,
                  visualStyle: brief.visualStyle,
                  visualStyleCustom: brief.visualStyleCustom,
                  imageElements: brief.imageElements,
                  scenario: brief.scenario,
                  scenarioCustom: brief.scenarioCustom,
                  mood: brief.mood,
                  moodCustom: brief.moodCustom,
                  lighting: brief.lighting,
                  background: brief.background,
                  multipleElements: brief.multipleElements,
                  purpose: brief.purpose,
                  intent: brief.intent,
                  targetAudience: brief.targetAudience,
                  colors: brief.colors,
                  textOnImage: brief.textOnImage,
                  additionalNotes: brief.additionalNotes,
                  logoUrl,
                  totalImages,
                  variationIndex: i,
                  isCarousel,
                  carouselGroupIndex: isCarousel
                    ? Math.floor(i / imagesPerCarousel)
                    : undefined,
                  carouselSlideIndex: isCarousel
                    ? i % imagesPerCarousel
                    : undefined,
                  imagesPerCarousel: isCarousel ? imagesPerCarousel : undefined,
                  apiKey:
                    userDoc.tier === 'own_keys'
                      ? userDoc.apiKeys?.geminiKey
                      : undefined,
                }),
              })

              const data = await res.json()

              if (data.url) {
                generatedUrls.push(data.url)
                setStreamedImageUrls((prev) => [...prev, data.url])
              }
            } catch (err) {
              console.error(`Image ${i} error:`, err)
            }

            setGenerationProgress(10 + ((i + 1) / totalImages) * 75)

            // Periodically save to Firestore
            if ((i + 1) % 5 === 0 || i === totalImages - 1) {
              await updateGeneration(generationId, {
                generatedImageUrls: generatedUrls,
              })
            }
          }
        }

        // Generate captions
        let captions = undefined
        if (brief.generationMode !== 'images_only') {
          setGenerationPhase('captions')
          setGenerationProgress(85)

          const isCarousel = brief.imageFormat === 'carousel'
          const totalCaptions = isCarousel
            ? brief.carouselCount || 1
            : totalImages

          try {
            const res = await fetch('/api/creative/captions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                context: brief.context,
                platform: brief.platform,
                purpose: brief.purpose,
                intent: brief.intent,
                tone: brief.tone,
                toneCustom: brief.toneCustom,
                targetAudience: brief.targetAudience,
                totalCaptions,
                isCarousel,
                imagesPerCarousel: brief.imagesPerCarousel,
                apiKey:
                  userDoc.tier === 'own_keys'
                    ? userDoc.apiKeys?.openaiKey
                    : undefined,
              }),
            })

            const data = await res.json()
            captions = data.captions
          } catch (err) {
            console.error('Captions error:', err)
          }

          setGenerationProgress(95)
        }

        // Save final results
        setGenerationPhase('saving')

        const finalStatus =
          generatedUrls.length === 0 && brief.generationMode !== 'captions_only'
            ? 'failed'
            : 'completed'

        await updateGeneration(generationId, {
          generatedImageUrls: generatedUrls,
          generatedCaptions: captions,
          status: finalStatus as 'completed' | 'failed',
        })

        // Record cost (skip for own_keys and free tier)
        if (userDoc.tier === 'paid') {
          await recordCost({
            userId: user.uid,
            userName: user.displayName || user.email || '',
            generationId,
            imageCount: generatedUrls.length,
            costPerImage: unitPrice,
            totalCost,
            type: 'generation',
          })
        }

        const result: CreativeGeneration = {
          id: generationId,
          userId: user.uid,
          userName: user.displayName || user.email || '',
          platform: brief.platform,
          imageFormat: brief.imageFormat,
          context: brief.context,
          purpose: brief.purpose,
          intent: brief.intent,
          tone: brief.tone,
          toneCustom: brief.toneCustom,
          visualStyle: brief.visualStyle,
          visualStyleCustom: brief.visualStyleCustom,
          imageElements: brief.imageElements,
          scenario: brief.scenario,
          scenarioCustom: brief.scenarioCustom,
          mood: brief.mood,
          moodCustom: brief.moodCustom,
          lighting: brief.lighting,
          background: brief.background,
          multipleElements: brief.multipleElements,
          targetAudience: brief.targetAudience,
          colors: brief.colors,
          textOnImage: brief.textOnImage,
          additionalNotes: brief.additionalNotes,
          referenceImageUrls,
          logoUrl,
          totalImages,
          carouselCount: brief.carouselCount,
          imagesPerCarousel: brief.imagesPerCarousel,
          generationMode: brief.generationMode,
          generatedImageUrls: generatedUrls,
          generatedCaptions: captions,
          status: finalStatus as 'completed' | 'failed',
          costPerImage: unitPrice,
          totalCost,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setCurrentGeneration(result)
        setGenerationPhase('done')
        setGenerationProgress(100)
        return result
      } catch (error) {
        console.error('Generation error:', error)
        setGenerationPhase('idle')
        throw error
      } finally {
        setGenerating(false)
      }
    },
    [user, userDoc, checkDailyLimit]
  )

  // ==================== REFINE ====================

  const refineImage = useCallback(
    async (params: RefineParams): Promise<RefineResult | null> => {
      if (!user || !userDoc) return null

      setRefining(true)
      try {
        // Check daily limit for paid tier
        if (userDoc.tier === 'paid') {
          const limit = await checkDailyLimit(user.uid, REFINE_COST_CENTS)
          if (!limit.allowed) {
            throw new Error('Limite diário excedido para refinamento')
          }
        }

        const res = await fetch('/api/creative/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            apiKey:
              userDoc.tier === 'own_keys'
                ? userDoc.apiKeys?.geminiKey
                : undefined,
          }),
        })

        const data = await res.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Record refinement cost
        if (userDoc.tier === 'paid') {
          await recordCost({
            userId: user.uid,
            userName: user.displayName || user.email || '',
            generationId: params.generationId,
            imageCount: 1,
            costPerImage: REFINE_COST_CENTS,
            totalCost: REFINE_COST_CENTS,
            type: 'refinement',
          })
        }

        // Update local versions
        setImageVersions((prev) => {
          const versions = { ...prev }
          if (!versions[params.imageIndex]) {
            versions[params.imageIndex] = [params.originalImageUrl]
          }
          versions[params.imageIndex] = [
            ...versions[params.imageIndex],
            data.url,
          ]
          return versions
        })

        // Persist to Firestore
        const updatedVersions = { ...imageVersions }
        if (!updatedVersions[params.imageIndex]) {
          updatedVersions[params.imageIndex] = [params.originalImageUrl]
        }
        updatedVersions[params.imageIndex] = [
          ...updatedVersions[params.imageIndex],
          data.url,
        ]

        await updateGeneration(params.generationId, {
          imageVersions: Object.fromEntries(
            Object.entries(updatedVersions).map(([k, v]) => [k, v])
          ),
        })

        return { url: data.url, version: params.version }
      } catch (error) {
        console.error('Refine error:', error)
        throw error
      } finally {
        setRefining(false)
      }
    },
    [user, userDoc, checkDailyLimit, imageVersions]
  )

  // ==================== INIT VERSIONS ====================

  const initVersions = useCallback((generation: CreativeGeneration) => {
    if (generation.imageVersions) {
      const versions: Record<number, string[]> = {}
      for (const [key, urls] of Object.entries(generation.imageVersions)) {
        versions[parseInt(key)] = urls
      }
      setImageVersions(versions)
    } else {
      const versions: Record<number, string[]> = {}
      generation.generatedImageUrls.forEach((url, i) => {
        versions[i] = [url]
      })
      setImageVersions(versions)
    }
  }, [])

  // ==================== LOAD HISTORY ====================

  const loadHistory = useCallback(
    async (userId?: string) => {
      setLoading(true)
      try {
        const data = userId
          ? await getGenerationsByUser(userId)
          : await getAllGenerations()
        setGenerations(data)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ==================== UPSCALE ====================

  const upscaleImage = useCallback(
    async (params: UpscaleRequest): Promise<UpscaleResult | null> => {
      if (!user || !userDoc) return null

      setUpscaling(true)
      try {
        const costCents = UPSCALE_COST_CENTS[params.scale]

        if (userDoc.tier === 'paid') {
          const limit = await checkDailyLimit(user.uid, costCents)
          if (!limit.allowed) {
            throw new Error('Limite diário excedido para upscaling')
          }
        }

        const res = await fetch('/api/creative/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            apiKey:
              userDoc.tier === 'own_keys'
                ? userDoc.apiKeys?.geminiKey
                : undefined,
          }),
        })

        const data = await res.json()

        if (data.error) throw new Error(data.error)

        if (userDoc.tier === 'paid') {
          await recordCost({
            userId: user.uid,
            userName: user.displayName || user.email || '',
            generationId: params.generationId,
            imageCount: 1,
            costPerImage: costCents,
            totalCost: costCents,
            type: 'generation',
          })
        }

        return data as UpscaleResult
      } catch (error) {
        console.error('Upscale error:', error)
        throw error
      } finally {
        setUpscaling(false)
      }
    },
    [user, userDoc, checkDailyLimit]
  )

  // ==================== REMOVE BACKGROUND ====================

  const removeBackground = useCallback(
    async (params: BackgroundRemovalRequest): Promise<BackgroundRemovalResult | null> => {
      if (!user || !userDoc) return null

      setRemovingBg(true)
      try {
        if (userDoc.tier === 'paid') {
          const limit = await checkDailyLimit(user.uid, BG_REMOVAL_COST_CENTS)
          if (!limit.allowed) {
            throw new Error('Limite diário excedido para remoção de fundo')
          }
        }

        const res = await fetch('/api/creative/remove-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            apiKey:
              userDoc.tier === 'own_keys'
                ? userDoc.apiKeys?.geminiKey
                : undefined,
          }),
        })

        const data = await res.json()

        if (data.error) throw new Error(data.error)

        if (userDoc.tier === 'paid') {
          await recordCost({
            userId: user.uid,
            userName: user.displayName || user.email || '',
            generationId: params.generationId,
            imageCount: 1,
            costPerImage: BG_REMOVAL_COST_CENTS,
            totalCost: BG_REMOVAL_COST_CENTS,
            type: 'generation',
          })
        }

        return data as BackgroundRemovalResult
      } catch (error) {
        console.error('Remove background error:', error)
        throw error
      } finally {
        setRemovingBg(false)
      }
    },
    [user, userDoc, checkDailyLimit]
  )

  // ==================== VARIATIONS ====================

  const generateVariations = useCallback(
    async (params: VariationsRequest): Promise<VariationsResult | null> => {
      if (!user || !userDoc) return null

      setGeneratingVariations(true)
      try {
        if (userDoc.tier === 'paid') {
          const limit = await checkDailyLimit(user.uid, VARIATION_COST_CENTS)
          if (!limit.allowed) {
            throw new Error('Limite diário excedido para variações')
          }
        }

        const res = await fetch('/api/creative/variations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            apiKey:
              userDoc.tier === 'own_keys'
                ? userDoc.apiKeys?.geminiKey
                : undefined,
          }),
        })

        const data = await res.json()

        if (data.error) throw new Error(data.error)

        if (userDoc.tier === 'paid') {
          await recordCost({
            userId: user.uid,
            userName: user.displayName || user.email || '',
            generationId: params.generationId,
            imageCount: data.count || params.count,
            costPerImage: Math.round(VARIATION_COST_CENTS / params.count),
            totalCost: VARIATION_COST_CENTS,
            type: 'generation',
          })
        }

        return data as VariationsResult
      } catch (error) {
        console.error('Variations error:', error)
        throw error
      } finally {
        setGeneratingVariations(false)
      }
    },
    [user, userDoc, checkDailyLimit]
  )

  // ==================== BRAND KITS ====================

  const loadBrandKits = useCallback(
    async (userId: string) => {
      try {
        const data = await getBrandKitsByUser(userId)
        setBrandKits(data)
      } catch (error) {
        console.error('Load brand kits error:', error)
      }
    },
    []
  )

  // ==================== TEMPLATES ====================

  const loadTemplates = useCallback(
    async (userId: string, category?: TemplateCategory) => {
      try {
        const [userTemplates, publicTemplates] = await Promise.all([
          getTemplatesByUser(userId, category),
          getPublicTemplates(category),
        ])

        // Merge (deduplicate by ID)
        const seen = new Set<string>()
        const merged: CreativeTemplate[] = []
        for (const t of [...userTemplates, ...publicTemplates]) {
          if (!seen.has(t.id)) {
            seen.add(t.id)
            merged.push(t)
          }
        }
        setTemplates(merged)
      } catch (error) {
        console.error('Load templates error:', error)
      }
    },
    []
  )

  // ==================== LOAD COSTS ====================

  const loadCosts = useCallback(async () => {
    setLoading(true)
    try {
      const summary = await getCostsSummary()
      setCostsSummary(summary)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    generations,
    costsSummary,
    loading,
    generating,
    generationProgress,
    generationPhase,
    currentGeneration,
    streamedImageUrls,
    totalExpectedImages,
    imageVersions,
    refining,
    upscaling,
    removingBg,
    generatingVariations,
    brandKits,
    templates,
    generateImages,
    refineImage,
    upscaleImage,
    removeBackground,
    generateVariations,
    initVersions,
    checkDailyLimit,
    loadHistory,
    loadCosts,
    loadBrandKits,
    loadTemplates,
    getDiscount,
    getUnitPrice,
    calculateTotalCost,
  }
}
