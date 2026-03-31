'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import { DollarSign, Image as ImageIcon, Users, TrendingUp } from 'lucide-react'

export default function CostsPage() {
  const { userDoc } = useAuth()
  const { costsSummary, loading, loadCosts } = useCreative()

  useEffect(() => {
    loadCosts()
  }, [loadCosts])

  if (userDoc?.tier === 'own_keys') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Custos</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Modo BYO Keys</h3>
            <p className="text-sm text-muted-foreground">
              Você está usando suas próprias chaves de API. Os custos são
              cobrados diretamente pelo provedor da API.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custos</h1>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Custo Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(costsSummary.totalCost)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Imagens Geradas
                </CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {costsSummary.totalImages}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {costsSummary.byUser.length}
                </div>
              </CardContent>
            </Card>
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
                              {lastGen.toLocaleDateString('pt-BR')}
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
