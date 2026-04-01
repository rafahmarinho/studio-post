'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_CONFIG } from '@/types'
import { Wand2, Image as ImageIcon, ArrowRight, Sparkles, TrendingUp } from 'lucide-react'

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
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome header */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.1),transparent)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Olá, {user?.displayName || 'Usuário'}!
            </h1>
            <p className="text-white/70 mt-1">
              Pronto para criar? Seu painel está atualizado.
            </p>
          </div>
          <Link href="/dashboard/generate">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg">
              <Wand2 className="h-4 w-4" />
              Novo criativo
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="section-label">Total de Gerações</span>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">{generations.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="section-label">Imagens Geradas</span>
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">{totalImages}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="section-label">Plano</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-sm font-medium">
              {userDoc?.tier === 'own_keys'
                ? 'BYO Keys'
                : userDoc?.tier === 'paid'
                  ? 'Pago'
                  : 'Gratuito'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Recent generations */}
      {recentGenerations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gerações Recentes</h2>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentGenerations.map((g) => {
              const platformInfo = PLATFORM_CONFIG[g.platform]
              return (
                <Card key={g.id} className="overflow-hidden hover-lift group">
                  {g.generatedImageUrls[0] && (
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      <Image
                        src={g.generatedImageUrls[0]}
                        alt="Preview"
                        width={400}
                        height={225}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl gradient-primary/10 flex items-center justify-center mb-4">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma geração ainda</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Comece criando seu primeiro criativo com IA. É rápido, fácil e gratuito.
            </p>
            <Link href="/dashboard/generate">
              <Button className="gap-2 gradient-primary border-0 text-white">
                <Wand2 className="h-4 w-4" />
                Criar agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
