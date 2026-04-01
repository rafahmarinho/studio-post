'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useScrollReveal, useScrollRevealBatch } from '@/hooks/use-scroll-reveal'
import { PlatformIcon } from '@/components/shared/platform-icons'
import type { ContentPlatform } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Zap,
  Image as ImageIcon,
  MessageSquare,
  Layers,
  ArrowRight,
  Palette,
  BarChart3,
  Globe,
  Wand2,
  CheckCircle2,
  Users,
  Monitor,
} from 'lucide-react'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: ImageIcon,
    title: 'Geração em Lote',
    desc: 'Até 30 imagens com variações automáticas de estilo em um único clique.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: MessageSquare,
    title: 'Legendas com IA',
    desc: 'Copy profissional com headline, CTA e hashtags — otimizado por plataforma.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Layers,
    title: 'Carrosséis Inteligentes',
    desc: 'Storytelling visual com consistência: HOOK → CONTEÚDO → CTA em cada pack.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: Wand2,
    title: 'Refinamento Multimodal',
    desc: 'Edite qualquer imagem com linguagem natural. A IA mantém o contexto.',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    icon: Palette,
    title: 'Brand Kits',
    desc: 'Salve paletas, tipografia e tom de voz da marca para gerações consistentes.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Relatórios de Performance',
    desc: 'Acompanhe custos, volume de geração e métricas por plataforma.',
    color: 'from-cyan-500 to-blue-500',
  },
]

const PLATFORMS: { name: string; key: ContentPlatform }[] = [
  { name: 'Instagram', key: 'instagram' },
  { name: 'Facebook', key: 'facebook' },
  { name: 'LinkedIn', key: 'linkedin' },
  { name: 'TikTok', key: 'tiktok' },
  { name: 'YouTube', key: 'youtube' },
  { name: 'Pinterest', key: 'pinterest' },
  { name: 'Blog', key: 'blog' },
  { name: 'E-mail', key: 'email' },
]

export default function LandingPage() {
  const { user } = useAuth()

  // Scroll reveal refs — each section gets its own observer
  const platformsRef = useScrollReveal<HTMLDivElement>('up')
  const featuresHeadRef = useScrollReveal<HTMLDivElement>('up')
  const featuresGridRef = useScrollRevealBatch({ threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
  const howHeadRef = useScrollReveal<HTMLDivElement>('up')
  const howGridRef = useScrollRevealBatch({ threshold: 0.1 })
  const pricingHeadRef = useScrollReveal<HTMLDivElement>('up')
  const pricingGridRef = useScrollRevealBatch({ threshold: 0.1 })
  const ctaRef = useScrollReveal<HTMLDivElement>('scale')

  // Notch navbar scroll detection
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (nav) {
          nav.classList.toggle('scrolled', window.scrollY > 60)
        }
        ticking = false
      })
    }

    onScroll() // set initial state
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Notch Nav ── */}
      <nav ref={navRef} className="notch-nav">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold tracking-tight notch-brand-text">Studio Post</span>
        </Link>

        <div className="notch-links">
          <a href="#features" className="notch-link">Funcionalidades</a>
          <a href="#pricing" className="notch-link">Planos</a>
          <a
            href="https://github.com/rafahmarinho/studio-post"
            target="_blank"
            rel="noopener noreferrer"
            className="notch-link flex items-center gap-1.5"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {user ? (
            <Link href="/dashboard" className="notch-cta gradient-primary">
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="notch-ghost hidden sm:inline-flex">Entrar</Link>
              <Link href="/register" className="notch-cta gradient-primary">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(262_83%_58%_/.12),transparent)]" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-24 md:pt-36 md:pb-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-fade-in-up">
                <Zap className="h-3.5 w-3.5" />
                Open Source — Gemini + ChatGPT
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up stagger-1">
                Criativos profissionais
                <br />
                <span className="gradient-text">em lote com IA</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2">
                Gere dezenas de imagens e legendas otimizadas para redes sociais em minutos.
                Streaming em tempo real. Variações automáticas. Refinamento visual por texto.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up stagger-3">
                <Link href={user ? '/dashboard/generate' : '/register'}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base gradient-primary border-0 text-white shadow-lg glow-primary">
                    <Sparkles className="h-5 w-5" />
                    Começar agora — é grátis
                  </Button>
                </Link>
                <a
                  href="https://github.com/rafahmarinho/studio-post"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base">
                    <GithubIcon className="h-5 w-5" />
                    Ver no GitHub
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-sm text-muted-foreground animate-fade-in-up stagger-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  5 imagens/dia grátis
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Sem cartão de crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Use sua própria API key
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Platforms strip ── */}
        <section id="platforms" className="border-y bg-muted/30">
          <div ref={platformsRef} className="mx-auto max-w-6xl px-4 sm:px-6 py-10 scroll-hidden">
            <p className="section-label text-center mb-6">Otimizado para todas as plataformas</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {PLATFORMS.map((p) => (
                <span key={p.name} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                  <PlatformIcon platform={p.key} size={20} colored />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div ref={featuresHeadRef} className="text-center mb-16 scroll-hidden">
              <p className="section-label mb-3">Funcionalidades</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Tudo que um time de marketing precisa
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Da ideia ao post publicado — sem trocar de ferramenta.
              </p>
            </div>

            <div ref={featuresGridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  data-scroll="up"
                  data-scroll-delay={String(i + 1)}
                  className={`group relative rounded-2xl border bg-card p-6 hover-lift scroll-delay-${i + 1}`}
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${f.color} text-white mb-4 shadow-sm`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-24 border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div ref={howHeadRef} className="text-center mb-16 scroll-hidden">
              <p className="section-label mb-3">Como funciona</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                3 passos, dezenas de criativos
              </h2>
            </div>
            <div ref={howGridRef} className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '01', title: 'Descreva ou peça à IA', desc: 'Preencha o brief em detalhes ou use o botão "Sem ideias?" para que a IA preencha tudo automaticamente.', icon: '💡', scroll: 'left' },
                { step: '02', title: 'Gere em lote', desc: 'Gemini cria as imagens em streaming e ChatGPT gera legendas — tudo em paralelo, em tempo real.', icon: '⚡', scroll: 'up' },
                { step: '03', title: 'Refine e publique', desc: 'Ajuste qualquer imagem com instruções por texto, baixe em alta resolução e publique.', icon: '🚀', scroll: 'right' },
              ].map((item, i) => (
                <div key={item.step} data-scroll={item.scroll} className={`text-center scroll-delay-${i + 1}`}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <span className="gradient-text text-xs font-bold tracking-wider uppercase">Passo {item.step}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-24 border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div ref={pricingHeadRef} className="text-center mb-16 scroll-hidden">
              <p className="section-label mb-3">Planos</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Comece de graça, escale como quiser
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Use suas próprias API keys sem custo adicional. Ou deixe por nossa conta.
              </p>
            </div>

            <div ref={pricingGridRef} className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              {/* BYO */}
              <div data-scroll="up" className="rounded-2xl border bg-card p-7 hover-lift scroll-delay-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">BYO Keys</h3>
                    <p className="text-xs text-muted-foreground">Traga suas chaves</p>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">Grátis</div>
                <p className="text-sm text-muted-foreground mb-6">Para sempre.</p>
                <ul className="space-y-2.5 text-sm mb-6">
                  {['Sem limites diários', 'Suas API keys Gemini + OpenAI', 'Custo direto do provedor', 'Todas as funcionalidades'].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={user ? '/dashboard/settings' : '/register'} className="block">
                  <Button variant="outline" className="w-full">Configurar keys</Button>
                </Link>
              </div>

              {/* Free */}
              <div data-scroll="up" className="rounded-2xl border-2 border-primary/30 bg-card p-7 relative hover-lift glow-primary scroll-delay-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-white text-xs font-semibold px-3 py-1 rounded-full">Popular</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Free</h3>
                    <p className="text-xs text-muted-foreground">Para experimentar</p>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">R$ 0</div>
                <p className="text-sm text-muted-foreground mb-6">Sem cartão de crédito.</p>
                <ul className="space-y-2.5 text-sm mb-6">
                  {['5 imagens por dia', '2 refinamentos por dia', 'Legendas incluídas', 'Histórico completo'].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={user ? '/dashboard/generate' : '/register'} className="block">
                  <Button className="w-full gradient-primary border-0 text-white">Começar grátis</Button>
                </Link>
              </div>

              {/* Paid */}
              <div data-scroll="up" className="rounded-2xl border bg-card p-7 hover-lift scroll-delay-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Pay-as-you-go</h3>
                    <p className="text-xs text-muted-foreground">Para produção</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold">R$ 3,50</span>
                  <span className="text-sm text-muted-foreground">/criativo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Img + legenda. Desconto por volume.</p>
                <ul className="space-y-2.5 text-sm mb-6">
                  {['Até 30% de desconto por lote', 'Sem limites (R$ 300/dia)', 'Refinamento: R$ 0,99', 'Dashboard de custos'].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={user ? '/dashboard/generate' : '/register'} className="block">
                  <Button variant="outline" className="w-full">Criar conta</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Open Source CTA ── */}
        <section className="py-20 border-t">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div ref={ctaRef} className="relative overflow-hidden rounded-3xl gradient-primary p-10 md:p-16 text-white text-center scroll-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,.08),transparent)]" />
              <div className="relative">
                <GithubIcon className="h-10 w-10 mx-auto mb-5 opacity-80" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  100% Open Source. MIT License.
                </h2>
                <p className="text-white/75 max-w-lg mx-auto mb-8 text-lg">
                  Fork, customize e faça deploy na sua infra. Contribuições são bem-vindas.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="https://github.com/rafahmarinho/studio-post"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="secondary" className="gap-2 h-12 px-8 text-base">
                      <GithubIcon className="h-5 w-5" />
                      Star on GitHub
                    </Button>
                  </a>
                  <Link href={user ? '/dashboard' : '/register'}>
                    <Button size="lg" className="gap-2 h-12 px-8 text-base bg-white/15 hover:bg-white/25 text-white border border-white/20">
                      Experimentar agora <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Studio Post</span>
            <span>— Open Source Creative Generator</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <a href="https://github.com/rafahmarinho/studio-post" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
            <span>&copy; 2025 MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
