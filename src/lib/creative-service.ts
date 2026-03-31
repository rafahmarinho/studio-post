import { db } from './firebase'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase/firestore'
import type {
  CreativeGeneration,
  CreativeCost,
  CostsSummary,
  BrandKit,
  CreativeTemplate,
  TemplateCategory,
} from '@/types'

const GENERATIONS_COLLECTION = 'creative_generations'
const COSTS_COLLECTION = 'creative_costs'
const BRAND_KITS_COLLECTION = 'brand_kits'
const TEMPLATES_COLLECTION = 'templates'

// ==================== HELPERS ====================

function toDateSafe(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000)
  }
  return new Date()
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  )
}

function convertGeneration(docSnap: DocumentSnapshot): CreativeGeneration {
  const data = docSnap.data()!
  return {
    id: docSnap.id,
    userId: data.userId,
    userName: data.userName,
    clientId: data.clientId,
    clientName: data.clientName,
    platform: data.platform,
    imageFormat: data.imageFormat,
    context: data.context,
    purpose: data.purpose,
    intent: data.intent,
    tone: data.tone,
    toneCustom: data.toneCustom,
    visualStyle: data.visualStyle,
    visualStyleCustom: data.visualStyleCustom,
    imageElements: data.imageElements,
    scenario: data.scenario,
    scenarioCustom: data.scenarioCustom,
    mood: data.mood,
    moodCustom: data.moodCustom,
    lighting: data.lighting,
    background: data.background,
    multipleElements: data.multipleElements,
    targetAudience: data.targetAudience,
    colors: data.colors,
    textOnImage: data.textOnImage,
    additionalNotes: data.additionalNotes,
    referenceImageUrls: data.referenceImageUrls || [],
    logoUrl: data.logoUrl,
    totalImages: data.totalImages,
    carouselCount: data.carouselCount,
    imagesPerCarousel: data.imagesPerCarousel,
    generationMode: data.generationMode,
    generatedImageUrls: data.generatedImageUrls || [],
    generatedCaptions: data.generatedCaptions,
    imageVersions: data.imageVersions || undefined,
    status: data.status,
    costPerImage: data.costPerImage,
    totalCost: data.totalCost,
    assembledPrompt: data.assembledPrompt,
    errorMessage: data.errorMessage,
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  }
}

// ==================== GENERATIONS ====================

export async function createGeneration(
  data: Omit<CreativeGeneration, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, GENERATIONS_COLLECTION), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateGeneration(
  id: string,
  updates: Partial<CreativeGeneration>
): Promise<void> {
  await updateDoc(doc(db, GENERATIONS_COLLECTION, id), {
    ...stripUndefined(updates as unknown as Record<string, unknown>),
    updatedAt: Timestamp.now(),
  })
}

export async function getGenerationById(
  id: string
): Promise<CreativeGeneration | null> {
  const snap = await getDoc(doc(db, GENERATIONS_COLLECTION, id))
  return snap.exists() ? convertGeneration(snap) : null
}

export async function getAllGenerations(): Promise<CreativeGeneration[]> {
  const q = query(
    collection(db, GENERATIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(convertGeneration)
}

export async function getGenerationsByUser(
  userId: string
): Promise<CreativeGeneration[]> {
  const q = query(
    collection(db, GENERATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(convertGeneration)
}

export async function deleteGeneration(id: string): Promise<void> {
  await deleteDoc(doc(db, GENERATIONS_COLLECTION, id))
}

// ==================== COSTS ====================

export async function recordCost(
  data: Omit<CreativeCost, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COSTS_COLLECTION), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getDailySpentByUser(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const q = query(
    collection(db, COSTS_COLLECTION),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(today))
  )
  const snap = await getDocs(q)
  return snap.docs.reduce((sum, d) => sum + (d.data().totalCost || 0), 0)
}

export async function getCostsSummary(): Promise<CostsSummary> {
  const snap = await getDocs(
    query(collection(db, COSTS_COLLECTION), orderBy('createdAt', 'desc'))
  )

  let totalCost = 0
  let totalImages = 0
  const byUser: Record<
    string,
    { userId: string; userName: string; totalCost: number; totalImages: number; lastGeneration: Date }
  > = {}

  snap.docs.forEach((d) => {
    const data = d.data()
    totalCost += data.totalCost || 0
    totalImages += data.imageCount || 0

    if (!byUser[data.userId]) {
      byUser[data.userId] = {
        userId: data.userId,
        userName: data.userName,
        totalCost: 0,
        totalImages: 0,
        lastGeneration: new Date(),
      }
    }
    byUser[data.userId].totalCost += data.totalCost || 0
    byUser[data.userId].totalImages += data.imageCount || 0
  })

  return { totalCost, totalImages, byUser: Object.values(byUser) }
}

// ==================== BRAND KITS ====================

function convertBrandKit(docSnap: DocumentSnapshot): BrandKit {
  const data = docSnap.data()!
  return {
    id: docSnap.id,
    userId: data.userId,
    tenantId: data.tenantId,
    name: data.name,
    description: data.description,
    logoUrl: data.logoUrl,
    colors: data.colors || [],
    fonts: data.fonts || [],
    tone: data.tone,
    toneCustom: data.toneCustom,
    visualStyle: data.visualStyle,
    visualStyleCustom: data.visualStyleCustom,
    mood: data.mood,
    moodCustom: data.moodCustom,
    defaultPlatform: data.defaultPlatform,
    defaultFormat: data.defaultFormat,
    guidelines: data.guidelines,
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  }
}

export async function getBrandKitsByUser(userId: string): Promise<BrandKit[]> {
  const q = query(
    collection(db, BRAND_KITS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(convertBrandKit)
}

export async function getBrandKitById(id: string): Promise<BrandKit | null> {
  const snap = await getDoc(doc(db, BRAND_KITS_COLLECTION, id))
  return snap.exists() ? convertBrandKit(snap) : null
}

export async function createBrandKit(
  data: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, BRAND_KITS_COLLECTION), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateBrandKit(
  id: string,
  updates: Partial<BrandKit>
): Promise<void> {
  await updateDoc(doc(db, BRAND_KITS_COLLECTION, id), {
    ...stripUndefined(updates as unknown as Record<string, unknown>),
    updatedAt: Timestamp.now(),
  })
}

export async function deleteBrandKit(id: string): Promise<void> {
  await deleteDoc(doc(db, BRAND_KITS_COLLECTION, id))
}

// ==================== TEMPLATES ====================

function convertTemplate(docSnap: DocumentSnapshot): CreativeTemplate {
  const data = docSnap.data()!
  return {
    id: docSnap.id,
    userId: data.userId,
    tenantId: data.tenantId,
    name: data.name,
    description: data.description,
    category: data.category,
    thumbnail: data.thumbnail,
    isPublic: data.isPublic || false,
    fields: data.fields || {},
    brandKitId: data.brandKitId,
    usageCount: data.usageCount || 0,
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  }
}

export async function getTemplatesByUser(
  userId: string,
  category?: TemplateCategory
): Promise<CreativeTemplate[]> {
  let q = query(
    collection(db, TEMPLATES_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  )

  if (category) {
    q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('updatedAt', 'desc')
    )
  }

  const snap = await getDocs(q)
  return snap.docs.map(convertTemplate)
}

export async function getPublicTemplates(
  category?: TemplateCategory
): Promise<CreativeTemplate[]> {
  let q = query(
    collection(db, TEMPLATES_COLLECTION),
    where('isPublic', '==', true),
    orderBy('usageCount', 'desc')
  )

  if (category) {
    q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('isPublic', '==', true),
      where('category', '==', category),
      orderBy('usageCount', 'desc')
    )
  }

  const snap = await getDocs(q)
  return snap.docs.map(convertTemplate)
}

export async function getTemplateById(id: string): Promise<CreativeTemplate | null> {
  const snap = await getDoc(doc(db, TEMPLATES_COLLECTION, id))
  return snap.exists() ? convertTemplate(snap) : null
}

export async function createTemplate(
  data: Omit<CreativeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): Promise<string> {
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    usageCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateTemplate(
  id: string,
  updates: Partial<CreativeTemplate>
): Promise<void> {
  await updateDoc(doc(db, TEMPLATES_COLLECTION, id), {
    ...stripUndefined(updates as unknown as Record<string, unknown>),
    updatedAt: Timestamp.now(),
  })
}

export async function deleteTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, id))
}
