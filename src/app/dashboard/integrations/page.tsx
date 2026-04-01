'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { PlatformIcon } from '@/components/shared/platform-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  Plug,
  Link2,
  Unlink,
  RefreshCw,
  Download,
  FileImage,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import type { ExportFormat } from '@/types'
import { META_ACCOUNT_LABELS } from '@/types'

interface MetaConnectionDisplay {
  id: string
  accountType: 'instagram_business' | 'facebook_page'
  accountName: string
  accountUsername?: string
  accountAvatar?: string
  isActive: boolean
  tokenExpiresAt: string
  permissions: string[]
}

export default function IntegrationsPage() {
  const { user } = useAuth()
  const { exportImages, publishToMeta, generations, loadHistory } = useCreative()

  const [connections, setConnections] = useState<MetaConnectionDisplay[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [connecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  // Export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exportQuality, setExportQuality] = useState(90)
  const [exporting, setExporting] = useState(false)
  const [exportUrls, setExportUrls] = useState<string[]>([])
  const [exportGenId, setExportGenId] = useState('')

  // Publish dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishConnectionId, setPublishConnectionId] = useState('')
  const [publishImageUrls, setPublishImageUrls] = useState<string[]>([])
  const [publishCaption, setPublishCaption] = useState('')
  const [publishing, setPublishing] = useState(false)

  const loadConnections = useCallback(async () => {
    if (!user) return
    setLoadingConnections(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/integrations/meta', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setConnections(data.connections || [])
    } catch {
      toast.error('Erro ao carregar conexões')
    } finally {
      setLoadingConnections(false)
    }
  }, [user])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  useEffect(() => {
    if (user) loadHistory(user.uid)
  }, [user, loadHistory])

  async function handleConnect() {
    // Meta OAuth flow — redirect
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    if (!appId) {
      toast.error('Meta App ID não configurado')
      return
    }
    const redirectUri = `${window.location.origin}/api/integrations/meta/callback`
    const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish'
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`
    window.location.href = url
  }

  async function handleDisconnect(connectionId: string) {
    if (!user) return
    setDisconnecting(connectionId)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/integrations/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'disconnect', connectionId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setConnections((prev) => prev.filter((c) => c.id !== connectionId))
      toast.success('Conta desconectada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desconectar')
    } finally {
      setDisconnecting(null)
    }
  }

  async function handleRefreshToken(connectionId: string) {
    if (!user) return
    setRefreshing(connectionId)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/integrations/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'refresh_token', connectionId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Token renovado com sucesso')
      loadConnections()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao renovar token')
    } finally {
      setRefreshing(null)
    }
  }

  async function handleExport() {
    if (exportUrls.length === 0) return
    setExporting(true)
    try {
      const result = await exportImages(
        exportUrls,
        exportFormat,
        exportGenId,
        exportFormat === 'png' ? undefined : exportQuality
      )
      if (result?.results) {
        for (const r of result.results) {
          const a = document.createElement('a')
          a.href = r.downloadUrl
          a.download = r.fileName
          a.click()
        }
        toast.success(`${result.results.length} arquivo(s) exportado(s)`)
      }
      setExportDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na exportação')
    } finally {
      setExporting(false)
    }
  }

  async function handlePublish() {
    if (!publishConnectionId || publishImageUrls.length === 0) return
    setPublishing(true)
    try {
      const isCarousel = publishImageUrls.length > 1
      const result = await publishToMeta(publishConnectionId, publishImageUrls, publishCaption || undefined, isCarousel)
      if (result) {
        toast.success('Publicado com sucesso!')
        setPublishDialogOpen(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setPublishing(false)
    }
  }

  function openExportDialog(imageUrls: string[], generationId: string) {
    setExportUrls(imageUrls)
    setExportGenId(generationId)
    setExportFormat('png')
    setExportQuality(90)
    setExportDialogOpen(true)
  }

  function openPublishDialog(imageUrls: string[]) {
    setPublishImageUrls(imageUrls)
    setPublishCaption('')
    setPublishConnectionId(connections[0]?.id || '')
    setPublishDialogOpen(true)
  }

  const FORMAT_INFO: Record<ExportFormat, { label: string; icon: typeof FileImage; desc: string }> = {
    png: { label: 'PNG', icon: FileImage, desc: 'Sem perda, fundo transparente' },
    jpg: { label: 'JPG', icon: FileImage, desc: 'Comprimido, ideal para web' },
    webp: { label: 'WebP', icon: FileImage, desc: 'Moderno, menor tamanho' },
    pdf: { label: 'PDF', icon: FileText, desc: 'Ideal para apresentações' },
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="page-header">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte contas, publique e exporte seus criativos
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Conexões</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
          <TabsTrigger value="publish">Publicar</TabsTrigger>
        </TabsList>

        {/* ====== CONNECTIONS TAB ====== */}
        <TabsContent value="connections" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contas Conectadas</h2>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
              Conectar Meta
            </Button>
          </div>

          {loadingConnections ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Plug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta conectada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte sua conta do Instagram ou Facebook para publicar diretamente
                </p>
                <Button onClick={handleConnect}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar Meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connections.map((conn) => {
                const isExpiring = new Date(conn.tokenExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                return (
                  <Card key={conn.id}>
                    <CardContent className="flex items-center gap-4 py-4">
                      {/* Avatar / Icon */}
                      <div className="h-12 w-12 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                        <PlatformIcon
                          platform={conn.accountType === 'instagram_business' ? 'instagram' : 'facebook'}
                          size={22}
                          className="text-white"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{conn.accountName}</p>
                          <Badge variant={conn.isActive ? 'default' : 'secondary'}>
                            {conn.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                          {isExpiring && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Token expirando
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {META_ACCOUNT_LABELS[conn.accountType]}
                          {conn.accountUsername && ` • @${conn.accountUsername}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshToken(conn.id)}
                          disabled={refreshing === conn.id}
                        >
                          {refreshing === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDisconnect(conn.id)}
                          disabled={disconnecting === conn.id}
                        >
                          {disconnecting === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ====== EXPORT TAB ====== */}
        <TabsContent value="export" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Exportar Criativos</h2>
            <p className="text-sm text-muted-foreground">Selecione uma geração para exportar em múltiplos formatos</p>
          </div>

          {generations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Download className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma geração disponível</h3>
                <p className="text-sm text-muted-foreground">
                  Gere criativos primeiro para poder exportá-los
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generations.slice(0, 12).map((gen) => (
                <Card key={gen.id} className="hover-lift cursor-pointer group" onClick={() => openExportDialog(gen.generatedImageUrls, gen.id)}>
                  <CardContent className="p-3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 relative">
                      {gen.generatedImageUrls[0] && (
                        <Image
                          src={gen.generatedImageUrls[0]}
                          alt={gen.context}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Download className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {gen.generatedImageUrls.length > 1 && (
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          {gen.generatedImageUrls.length} imgs
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{gen.context}</p>
                    <p className="text-xs text-muted-foreground truncate">{gen.platform} • {gen.imageFormat}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ====== PUBLISH TAB ====== */}
        <TabsContent value="publish" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Publicar Direto</h2>
            <p className="text-sm text-muted-foreground">Publique seus criativos diretamente no Instagram ou Facebook</p>
          </div>

          {connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Plug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Conecte uma conta primeiro</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Vá na aba &quot;Conexões&quot; para conectar sua conta Meta
                </p>
              </CardContent>
            </Card>
          ) : generations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileImage className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma geração disponível</h3>
                <p className="text-sm text-muted-foreground">
                  Gere criativos primeiro para publicar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generations.slice(0, 12).map((gen) => (
                <Card key={gen.id} className="hover-lift cursor-pointer group" onClick={() => openPublishDialog(gen.generatedImageUrls)}>
                  <CardContent className="p-3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 relative">
                      {gen.generatedImageUrls[0] && (
                        <Image
                          src={gen.generatedImageUrls[0]}
                          alt={gen.context}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-sm font-medium truncate">{gen.context}</p>
                    <p className="text-xs text-muted-foreground">{gen.generatedImageUrls.length} imagem(ns)</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== EXPORT DIALOG ====== */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Imagens</DialogTitle>
            <DialogDescription>
              Escolha o formato e a qualidade para exportar {exportUrls.length} imagem(ns)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((fmt) => {
                const info = FORMAT_INFO[fmt]
                const Icon = info.icon
                return (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      exportFormat === fmt
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold text-sm">{info.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </button>
                )
              })}
            </div>

            {(exportFormat === 'jpg' || exportFormat === 'webp') && (
              <div className="space-y-2">
                <Label>Qualidade: {exportQuality}%</Label>
                <Slider
                  value={[exportQuality]}
                  onValueChange={(v) => setExportQuality(v[0])}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar {exportUrls.length} imagem(ns)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== PUBLISH DIALOG ====== */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publicar nas Redes</DialogTitle>
            <DialogDescription>
              Publique {publishImageUrls.length} imagem(ns) diretamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={publishConnectionId} onValueChange={setPublishConnectionId}>
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
              <Label>Legenda (opcional)</Label>
              <Input
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="Adicione uma legenda..."
              />
            </div>

            {publishImageUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {publishImageUrls.slice(0, 5).map((url, i) => (
                  <Image
                    key={i}
                    src={url}
                    alt={`Preview ${i + 1}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-md object-cover shrink-0"
                  />
                ))}
                {publishImageUrls.length > 5 && (
                  <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground shrink-0">
                    +{publishImageUrls.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePublish} disabled={publishing || !publishConnectionId}>
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
