'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_CONFIG } from '@/types'
import { Wand2, Image as ImageIcon, History, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const { user, userDoc } = useAuth()
  const { generations, loading, loadHistory } = useCreative()

  useEffect(() => {
    if (user) {
      loadHistory(user.uid)
    }
  }, [user, loadHistory])

  const totalImages = generations.reduce(
    (sum, g) => sum + g.generatedImageUrls.length,
    0
  )

  const recentGenerations = generations.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.displayName || 'Usuário'}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Studio Post. Comece a gerar seus criativos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Gerações
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generations.length}</div>
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
            <div className="text-2xl font-bold">{totalImages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plano
            </CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              {userDoc?.tier === 'own_keys'
                ? 'BYO Keys'
                : userDoc?.tier === 'paid'
                  ? 'Pago'
                  : 'Gratuito'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick action */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold">Criar novo criativo</h3>
            <p className="text-sm text-muted-foreground">
              Use IA para gerar imagens e legendas profissionais
            </p>
          </div>
          <Link href="/dashboard/generate">
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Gerar
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent generations */}
      {recentGenerations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gerações Recentes</h2>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentGenerations.map((g) => {
              const platformInfo = PLATFORM_CONFIG[g.platform]
              return (
                <Card key={g.id} className="overflow-hidden">
                  {g.generatedImageUrls[0] && (
                    <div className="aspect-video relative bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.generatedImageUrls[0]}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        {platformInfo.emoji} {platformInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {g.generatedImageUrls.length} img
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {g.context}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {!loading && generations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wand2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma geração ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando seu primeiro criativo com IA
            </p>
            <Link href="/dashboard/generate">
              <Button>Criar agora</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
