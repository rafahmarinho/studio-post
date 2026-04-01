'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Key, User, Shield, Save, ExternalLink, Sparkles, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const { user, userDoc } = useAuth()

  const [geminiKey, setGeminiKey] = useState(userDoc?.apiKeys?.geminiKey || '')
  const [openaiKey, setOpenaiKey] = useState(userDoc?.apiKeys?.openaiKey || '')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)

  async function handleSaveKeys() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'apiKeys.geminiKey': geminiKey || null,
        'apiKeys.openaiKey': openaiKey || null,
        tier: geminiKey || openaiKey ? 'own_keys' : userDoc?.tier === 'own_keys' ? 'paid' : userDoc?.tier,
        updatedAt: new Date(),
      })
      toast.success('Chaves de API salvas!')
    } catch {
      toast.error('Erro ao salvar chaves')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        updatedAt: new Date(),
      })
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const isOwnKeys = userDoc?.tier === 'own_keys'

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="page-header">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil, plano e chaves de API
        </p>
      </div>

      {/* Top row — Profile + Plan side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              Perfil
            </CardTitle>
            <CardDescription>
              Suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar preview */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-white shrink-0">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{user?.displayName || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={user?.email || ''} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2 gradient-primary border-0 text-white">
              <Save className="h-4 w-4" />
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Tier / Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              Plano Atual
            </CardTitle>
            <CardDescription>
              Seu modo de uso da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan card */}
            <div className={`p-4 rounded-xl border-2 ${isOwnKeys ? 'border-primary/30 bg-primary/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isOwnKeys ? (
                    <Key className="h-5 w-5 text-primary" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-orange-500" />
                  )}
                  <span className="font-semibold text-base">
                    {isOwnKeys ? 'BYO Keys' : 'Pay-as-you-go'}
                  </span>
                </div>
                <Badge variant="secondary" className={isOwnKeys ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-600'}>
                  Ativo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isOwnKeys
                  ? 'Você está usando suas próprias chaves de API. Sem custos adicionais — pague apenas diretamente ao Google e OpenAI.'
                  : 'Você paga por lote de criativos gerados. Quanto mais gera, maior o desconto — até 30% em lotes com 30+ itens.'}
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Benefícios do seu plano</p>
              <div className="grid grid-cols-1 gap-2">
                {isOwnKeys ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Geração ilimitada</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Sem custo adicional</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Controle total das suas APIs</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                      <span>Desconto progressivo (até 30%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                      <span>Sem setup — comece agora</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                      <span>Pague apenas pelo que usar</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {isOwnKeys
                ? 'Para voltar ao Pay-as-you-go, remova suas chaves de API abaixo.'
                : 'Para mudar para BYO Keys, adicione suas chaves de API abaixo.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys — full width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-4 w-4 text-primary" />
            </div>
            Chaves de API
          </CardTitle>
          <CardDescription>
            Configure suas chaves para usar o modo BYO Keys — sem custos adicionais na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gemini Key */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label htmlFor="geminiKey" className="text-sm font-semibold">Google Gemini API Key</Label>
                {geminiKey && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                    Configurada
                  </Badge>
                )}
              </div>
              <Input
                id="geminiKey"
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Obtenha em{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  aistudio.google.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Usada para geração de imagens, refinamento, upscaling e variações.
              </p>
            </div>

            {/* OpenAI Key */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label htmlFor="openaiKey" className="text-sm font-semibold">OpenAI API Key</Label>
                {openaiKey && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                    Configurada
                  </Badge>
                )}
              </div>
              <Input
                id="openaiKey"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Obtenha em{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  platform.openai.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Usada para geração de legendas e preenchimento automático com IA.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground max-w-md">
              Suas chaves são armazenadas de forma segura e encriptada. Elas nunca são compartilhadas ou expostas ao público.
            </p>
            <Button onClick={handleSaveKeys} disabled={saving} className="gap-2 gradient-primary border-0 text-white">
              <Save className="h-4 w-4" />
              Salvar Chaves
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
