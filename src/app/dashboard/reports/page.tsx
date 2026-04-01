'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Image as ImageIcon,
  Type,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { PLATFORM_CONFIG, IMAGE_FORMAT_CONFIG } from '@/types'

interface ReportData {
  period: string
  days: number
  summary: {
    totalGenerations: number
    totalImages: number
    totalCaptions: number
    totalCostCents: number
    totalCostFormatted: string
    avgImagesPerGeneration: number
    avgCostPerGenerationCents: number
  }
  costBreakdown: { type: string; cents: number; formatted: string; percentage: number }[]
  platformMetrics: { platform: string; count: number; percentage: number }[]
  formatMetrics: { format: string; count: number; percentage: number }[]
  dailyMetrics: { date: string; generations: number; images: number; costCents: number }[]
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  const loadReport = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?userId=${user.uid}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch {
      console.error('Error loading report')
    } finally {
      setLoading(false)
    }
  }, [user, period])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Relatórios</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho e custos das suas gerações
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!report ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Sem dados para exibir</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Gerações</span>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{report.summary.totalGenerations}</p>
              <p className="text-xs text-muted-foreground mt-1">nos últimos {report.days} dias</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Imagens</span>
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{report.summary.totalImages}</p>
              <p className="text-xs text-muted-foreground mt-1">Média: {report.summary.avgImagesPerGeneration}/geração</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Legendas</span>
                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Type className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{report.summary.totalCaptions}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Custo Total</span>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{report.summary.totalCostFormatted}</p>
              <p className="text-xs text-muted-foreground mt-1">Média: R$ {(report.summary.avgCostPerGenerationCents / 100).toFixed(2)}/geração</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Platform Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                {report.platformMetrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-3">
                    {report.platformMetrics.map(({ platform, count, percentage }) => {
                      const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
                      return (
                        <div key={platform} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {config?.emoji || '🌐'} {config?.label || platform}
                            </span>
                            <span className="text-muted-foreground">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: config?.color || '#9e9e9e',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Format Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Formato</CardTitle>
              </CardHeader>
              <CardContent>
                {report.formatMetrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  <div className="space-y-3">
                    {report.formatMetrics.map(({ format, count, percentage }) => {
                      const config = IMAGE_FORMAT_CONFIG[format as keyof typeof IMAGE_FORMAT_CONFIG]
                      return (
                        <div key={format} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{config?.label || format}</span>
                            <span className="text-muted-foreground">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          {report.costBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {report.costBreakdown.map(({ type, formatted, percentage }) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <Badge variant="outline" className="capitalize">{type}</Badge>
                      <div className="text-right">
                        <p className="font-medium">{formatted}</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Chart (simplified bars) */}
          {report.dailyMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividade Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-40">
                  {report.dailyMetrics.slice(-30).map(({ date, generations }) => {
                    const maxGen = Math.max(
                      ...report.dailyMetrics.slice(-30).map((m) => m.generations),
                      1
                    )
                    const heightPct = (generations / maxGen) * 100
                    return (
                      <div
                        key={date}
                        className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-default"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                        title={`${date}: ${generations} geração(ões)`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    {report.dailyMetrics[Math.max(0, report.dailyMetrics.length - 30)]?.date}
                  </span>
                  <span>
                    {report.dailyMetrics[report.dailyMetrics.length - 1]?.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
