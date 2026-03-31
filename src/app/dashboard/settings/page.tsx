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
import { Key, User, Shield, Save } from 'lucide-react'

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
        tier: geminiKey || openaiKey ? 'own_keys' : userDoc?.tier === 'own_keys' ? 'free' : userDoc?.tier,
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

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil e chaves de API
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Plano
          </CardTitle>
          <CardDescription>
            Seu plano atual e limites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Plano atual:</span>
            <Badge variant="secondary" className="text-sm">
              {userDoc?.tier === 'own_keys'
                ? 'BYO Keys'
                : userDoc?.tier === 'paid'
                  ? 'Pago'
                  : 'Gratuito'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {userDoc?.tier === 'own_keys'
              ? 'Sem limites — você usa suas próprias chaves de API.'
              : userDoc?.tier === 'paid'
                ? 'Pay-as-you-go com R$ 300,00 de limite diário.'
                : '5 imagens gratuitas por dia.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Para mudar para o modo BYO Keys, basta adicionar suas chaves de API abaixo.
          </p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chaves de API
          </CardTitle>
          <CardDescription>
            Configure suas chaves para usar o modo BYO Keys (sem limites e sem custos adicionais)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="geminiKey">Google Gemini API Key</Label>
            <Input
              id="geminiKey"
              type="password"
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Obtida em{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                aistudio.google.com
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openaiKey">OpenAI API Key</Label>
            <Input
              id="openaiKey"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Obtida em{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>
          <Button onClick={handleSaveKeys} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Chaves
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
