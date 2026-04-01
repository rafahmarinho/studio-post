'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { PlatformIcon } from '@/components/shared/platform-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  CalendarClock,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,

  RotateCcw,
  Trash2,
  Send,
} from 'lucide-react'
import { formatDateBR } from '@/lib/constants'
import {
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
  PLATFORM_CONFIG,
  META_ACCOUNT_LABELS,
} from '@/types'
import type { ScheduleStatus, ContentPlatform } from '@/types'

const STATUS_ICONS: Record<ScheduleStatus, typeof Clock> = {
  scheduled: Clock,
  publishing: Send,
  published: CheckCircle2,
  failed: XCircle,
  cancelled: Trash2,
}

export default function SchedulePage() {
  const { user } = useAuth()
  const {
    scheduledPosts,
    loadScheduledPosts,
    schedulePost,
    cancelScheduledPost,
    generations,
    loadHistory,
  } = useCreative()

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ScheduleStatus | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)

  // Form state
  const [formGenId, setFormGenId] = useState('')
  const [formConnectionId, setFormConnectionId] = useState('')
  const [formPlatform, setFormPlatform] = useState<ContentPlatform>('instagram')
  const [formCaption, setFormCaption] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')

  // Meta connections
  const [connections, setConnections] = useState<Array<{
    id: string
    accountType: 'instagram_business' | 'facebook_page'
    accountName: string
  }>>([])

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await Promise.all([
        loadScheduledPosts(user.uid).catch(() => {}),
        loadHistory(user.uid).catch(() => {}),
      ])
      // Load connections — separate try/catch so page works without Meta configured
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/integrations/meta', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setConnections(data.connections || [])
        }
      } catch {
        // Meta not configured — connections stay empty
      }
    } catch {
      // Silently fail on initial load — empty state will be shown
    } finally {
      setLoading(false)
    }
  }, [user, loadScheduledPosts, loadHistory])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filtered = filter === 'all'
    ? scheduledPosts
    : scheduledPosts.filter((p) => p.status === filter)

  function openCreate() {
    setFormGenId('')
    setFormConnectionId(connections[0]?.id || '')
    setFormPlatform('instagram')
    setFormCaption('')
    setFormDate('')
    setFormTime('')
    setDialogOpen(true)
  }

  async function handleCreate() {
    if (!formGenId || !formConnectionId || !formDate || !formTime) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const scheduledAt = new Date(`${formDate}T${formTime}`)
    if (scheduledAt <= new Date()) {
      toast.error('A data deve ser no futuro')
      return
    }

    const gen = generations.find((g) => g.id === formGenId)
    if (!gen) {
      toast.error('Geração não encontrada')
      return
    }

    setSaving(true)
    try {
      await schedulePost({
        generationId: formGenId,
        connectionId: formConnectionId,
        platform: formPlatform,
        imageUrls: gen.generatedImageUrls,
        caption: formCaption || undefined,
        scheduledAt: scheduledAt.toISOString(),
      })
      toast.success('Post agendado com sucesso!')
      setDialogOpen(false)
      if (user) loadScheduledPosts(user.uid)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao agendar')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(postId: string) {
    setCancelling(postId)
    try {
      await cancelScheduledPost(postId)
      toast.success('Agendamento cancelado')
      if (user) loadScheduledPosts(user.uid)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar')
    } finally {
      setCancelling(null)
    }
  }

  async function handleRetry(postId: string) {
    if (!user) return
    setRetrying(postId)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/integrations/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'retry', postId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Reagendado com sucesso')
      loadScheduledPosts(user.uid)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reagendar')
    } finally {
      setRetrying(null)
    }
  }

  const stats = {
    total: scheduledPosts.length,
    scheduled: scheduledPosts.filter((p) => p.status === 'scheduled').length,
    published: scheduledPosts.filter((p) => p.status === 'published').length,
    failed: scheduledPosts.filter((p) => p.status === 'failed').length,
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Agendamento</h1>
          <p className="text-muted-foreground">
            Agende a publicação dos seus criativos
          </p>
        </div>
        <Button onClick={openCreate} disabled={connections.length === 0 || generations.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Agendar Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Agendados', value: stats.scheduled, color: 'text-blue-500' },
          { label: 'Publicados', value: stats.published, color: 'text-emerald-500' },
          { label: 'Falhas', value: stats.failed, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {status === 'all' ? 'Todos' : SCHEDULE_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agendamento</h3>
            <p className="text-sm text-muted-foreground">
              {connections.length === 0
                ? 'Conecte uma conta Meta primeiro em Integrações'
                : 'Clique em "Agendar Post" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const StatusIcon = STATUS_ICONS[post.status]
            const statusColor = SCHEDULE_STATUS_COLORS[post.status]
            const platformConf = PLATFORM_CONFIG[post.platform]

            return (
              <Card key={post.id} className="hover-lift">
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Preview */}
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    {post.imageUrls[0] && (
                      <Image src={post.imageUrls[0]} alt="" width={56} height={56} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        style={{ borderColor: statusColor, color: statusColor }}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {SCHEDULE_STATUS_LABELS[post.status]}
                      </Badge>
                      <Badge variant="secondary">
                        <PlatformIcon platform={post.platform} size={14} colored /> {platformConf?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {post.caption ? post.caption.slice(0, 80) + (post.caption.length > 80 ? '...' : '') : 'Sem legenda'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      📅 {formatDateBR(post.scheduledAt instanceof Date ? post.scheduledAt : new Date(post.scheduledAt))}
                      {post.imageUrls.length > 1 && ` • ${post.imageUrls.length} imagens`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {post.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(post.id)}
                        disabled={retrying === post.id}
                      >
                        {retrying === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {post.status === 'published' && post.externalUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={post.externalUrl} target="_blank" rel="noopener noreferrer">
                          <CheckCircle2 className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {post.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleCancel(post.id)}
                        disabled={cancelling === post.id}
                      >
                        {cancelling === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ====== SCHEDULE DIALOG ====== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agendar Publicação</DialogTitle>
            <DialogDescription>
              Escolha o conteúdo, conta e horário para agendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Geração</Label>
              <Select value={formGenId} onValueChange={setFormGenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma geração" />
                </SelectTrigger>
                <SelectContent>
                  {generations
                    .filter((g) => g.generatedImageUrls.length > 0)
                    .slice(0, 20)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.context.slice(0, 50)} ({g.generatedImageUrls.length} imgs)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={formConnectionId} onValueChange={setFormConnectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {META_ACCOUNT_LABELS[c.accountType]} — {c.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={formPlatform} onValueChange={(v) => setFormPlatform(v as ContentPlatform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">
                    <span className="flex items-center gap-2"><PlatformIcon platform="instagram" size={14} /> Instagram</span>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <span className="flex items-center gap-2"><PlatformIcon platform="facebook" size={14} /> Facebook</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Legenda (opcional)</Label>
              <Textarea
                value={formCaption}
                onChange={(e) => setFormCaption(e.target.value)}
                placeholder="Adicione uma legenda para o post..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Agendando...
                </>
              ) : (
                <>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Agendar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
