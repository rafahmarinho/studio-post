import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export const maxDuration = 60

// GET — Generate performance report
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId')
  const tenantId = searchParams.get('tenantId')
  const period = searchParams.get('period') || '30d'

  if (!userId && !tenantId) {
    return NextResponse.json({ error: 'userId or tenantId required' }, { status: 400 })
  }

  try {
    const days = parsePeriod(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch all generations within the period
    let query = adminDb
      .collection('creative_generations')
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'desc') as FirebaseFirestore.Query

    if (tenantId) {
      // Get tenant member IDs
      const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get()
      if (!tenantDoc.exists) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
      const memberIds: string[] = tenantDoc.data()!.memberIds || []
      if (memberIds.length > 0 && memberIds.length <= 30) {
        query = query.where('userId', 'in', memberIds)
      }
    } else {
      query = query.where('userId', '==', userId)
    }

    const snap = await query.get()

    // Fetch cost records
    let costsQuery = adminDb
      .collection('costs')
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'desc') as FirebaseFirestore.Query

    if (userId) {
      costsQuery = costsQuery.where('userId', '==', userId)
    }

    const costsSnap = await costsQuery.get()

    // Aggregate data
    const generations = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const costs = costsSnap.docs.map((d) => d.data())

    // Build metrics
    const totalGenerations = generations.length
    let totalImages = 0
    let totalCaptions = 0
    const platformCounts: Record<string, number> = {}
    const formatCounts: Record<string, number> = {}
    const dailyMap: Record<string, { generations: number; images: number; cost: number }> = {}

    for (const gen of generations) {
      const g = gen as Record<string, unknown>
      const images = Array.isArray(g.images) ? g.images.length : (g.imageCount as number) || 0
      totalImages += images

      if (g.captions && Array.isArray(g.captions)) {
        totalCaptions += (g.captions as unknown[]).length
      }

      const platform = (g.platform as string) || 'unknown'
      platformCounts[platform] = (platformCounts[platform] || 0) + 1

      const format = (g.aspectRatio as string) || '1:1'
      formatCounts[format] = (formatCounts[format] || 0) + 1

      // Daily aggregation
      const date = g.createdAt && typeof (g.createdAt as { toDate?: () => Date }).toDate === 'function'
        ? ((g.createdAt as { toDate: () => Date }).toDate())
        : new Date()
      const dayKey = date.toISOString().split('T')[0]

      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { generations: 0, images: 0, cost: 0 }
      }
      dailyMap[dayKey].generations++
      dailyMap[dayKey].images += images
    }

    // Cost aggregation
    let totalCostCents = 0
    const costByType: Record<string, number> = {}

    for (const cost of costs) {
      const c = cost as Record<string, unknown>
      const amount = (c.amountCents as number) || 0
      totalCostCents += amount

      const type = (c.type as string) || 'generation'
      costByType[type] = (costByType[type] || 0) + amount

      const date = c.createdAt && typeof (c.createdAt as { toDate?: () => Date }).toDate === 'function'
        ? ((c.createdAt as { toDate: () => Date }).toDate())
        : new Date()
      const dayKey = date.toISOString().split('T')[0]

      if (dailyMap[dayKey]) {
        dailyMap[dayKey].cost += amount
      }
    }

    // Build ordered daily metrics
    const dailyMetrics = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        generations: data.generations,
        images: data.images,
        costCents: data.cost,
      }))

    // Platform metrics
    const platformMetrics = Object.entries(platformCounts)
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: totalGenerations > 0 ? Math.round((count / totalGenerations) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Format metrics
    const formatMetrics = Object.entries(formatCounts)
      .map(([format, count]) => ({
        format,
        count,
        percentage: totalGenerations > 0 ? Math.round((count / totalGenerations) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate averages
    const avgImagesPerGeneration =
      totalGenerations > 0 ? Math.round((totalImages / totalGenerations) * 10) / 10 : 0
    const avgCostPerGeneration =
      totalGenerations > 0 ? Math.round(totalCostCents / totalGenerations) : 0

    const report = {
      period,
      days,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      summary: {
        totalGenerations,
        totalImages,
        totalCaptions,
        totalCostCents,
        totalCostFormatted: `R$ ${(totalCostCents / 100).toFixed(2)}`,
        avgImagesPerGeneration,
        avgCostPerGenerationCents: avgCostPerGeneration,
      },
      costBreakdown: Object.entries(costByType).map(([type, cents]) => ({
        type,
        cents,
        formatted: `R$ ${(cents / 100).toFixed(2)}`,
        percentage: totalCostCents > 0 ? Math.round((cents / totalCostCents) * 100) : 0,
      })),
      platformMetrics,
      formatMetrics,
      dailyMetrics,
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([dwmy])$/)
  if (!match) return 30

  const value = parseInt(match[1])
  switch (match[2]) {
    case 'd': return Math.min(value, 365)
    case 'w': return Math.min(value * 7, 365)
    case 'm': return Math.min(value * 30, 365)
    case 'y': return Math.min(value * 365, 730)
    default: return 30
  }
}
