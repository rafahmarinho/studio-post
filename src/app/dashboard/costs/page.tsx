'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDateBR } from '@/lib/constants'
import { DollarSign, Image as ImageIcon, Users, TrendingUp } from 'lucide-react'

export default function CostsPage() {
  const { userDoc } = useAuth()
  const { costsSummary, loading, loadCosts } = useCreative()

  useEffect(() => {
    loadCosts()
  }, [loadCosts])

  if (userDoc?.tier === 'own_keys') {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="page-header mb-4">Custos</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <DollarSign className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Modo BYO Keys</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Você está usando suas próprias chaves de API. Os custos são
              cobrados diretamente pelo provedor da API.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="page-header">Custos</h1>
        <p className="text-muted-foreground">
          Dashboard administrativo de custos da plataforma
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : costsSummary ? (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Custo Total</span>
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{formatCurrency(costsSummary.totalCost)}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Imagens Geradas</span>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{costsSummary.totalImages}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="section-label">Usuários</span>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{costsSummary.byUser.length}</p>
            </div>
          </div>

          {/* Per-user breakdown */}
          {costsSummary.byUser.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Custos por Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Usuário</th>
                        <th className="text-right py-3 px-2 font-medium">Imagens</th>
                        <th className="text-right py-3 px-2 font-medium">Custo</th>
                        <th className="text-right py-3 px-2 font-medium">Última Geração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costsSummary.byUser.map((u) => {
                        const lastGen =
                          u.lastGeneration instanceof Date
                            ? u.lastGeneration
                            : new Date(
                                (u.lastGeneration as unknown as { seconds: number }).seconds * 1000
                              )
                        return (
                          <tr key={u.userId} className="border-b last:border-0">
                            <td className="py-3 px-2">{u.userName}</td>
                            <td className="py-3 px-2 text-right">{u.totalImages}</td>
                            <td className="py-3 px-2 text-right font-medium">
                              {formatCurrency(u.totalCost)}
                            </td>
                            <td className="py-3 px-2 text-right text-muted-foreground">
                              {formatDateBR(lastGen)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum custo registrado</h3>
            <p className="text-sm text-muted-foreground">
              Os custos aparecerão aqui após gerações no plano pago.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
