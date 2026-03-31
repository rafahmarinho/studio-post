'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Zap,
  Image as ImageIcon,
  MessageSquare,
  Layers,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Studio Post</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button>Criar conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Powered by Gemini + ChatGPT
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Criativos profissionais{' '}
              <span className="text-primary">em lote</span> com IA
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gere imagens de alta qualidade com Google Gemini e legendas
              otimizadas com ChatGPT. Tudo em um só lugar, com variações
              automáticas e streaming em tempo real.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href={user ? '/dashboard/generate' : '/register'}>
                <Button size="lg" className="gap-2">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={user ? '/dashboard' : '/login'}>
                <Button size="lg" variant="outline">
                  {user ? 'Dashboard' : 'Já tenho conta'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold mb-12">
              Tudo que você precisa
            </h2>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <FeatureCard
                icon={<ImageIcon className="h-8 w-8 text-primary" />}
                title="Geração em lote"
                description="Gere múltiplas imagens com variações automáticas de estilo, cenário e iluminação. Cada imagem é única."
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8 text-primary" />}
                title="Legendas inteligentes"
                description="Legendas otimizadas para cada plataforma com hashtags, CTAs e adaptação de tom e formato."
              />
              <FeatureCard
                icon={<Layers className="h-8 w-8 text-primary" />}
                title="Refinamento multimodal"
                description="Refine imagens com instruções em linguagem natural. A IA entende o contexto visual e aplica ajustes precisos."
              />
            </div>
          </div>
        </section>

        {/* Pricing summary */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Modelos flexíveis</h2>
            <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
              Use suas próprias API keys gratuitamente, ou aproveite nosso plano
              gratuito com 5 imagens/dia.
            </p>
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <PricingCard
                title="BYO Keys"
                price="Grátis"
                description="Use suas próprias chaves de API. Sem limites, sem custos adicionais."
                features={['Sem limites diários', 'Suas API keys', 'Controle total de custos']}
              />
              <PricingCard
                title="Free"
                price="R$ 0"
                description="5 imagens por dia com nossas chaves. Perfeito para testar."
                features={['5 imagens/dia', 'Todas as funcionalidades', 'Sem cartão necessário']}
                highlighted
              />
              <PricingCard
                title="Paid"
                price="Pay-as-you-go"
                description="Compre créditos e gere sem limites fixos."
                features={['Descontos por volume', 'Sem limites diários', 'Dashboard de custos']}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Studio Post. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-left space-y-3">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({
  title,
  price,
  description,
  features,
  highlighted,
}: {
  title: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-6 text-left space-y-4 ${
        highlighted ? 'border-primary ring-2 ring-primary/20' : ''
      }`}
    >
      <h3 className="font-semibold">{title}</h3>
      <div className="text-2xl font-bold">{price}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <ul className="space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
