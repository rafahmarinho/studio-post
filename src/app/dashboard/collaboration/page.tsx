'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Share2,
  MessageSquare,
  CheckSquare,
  Plus,
  Loader2,
  Link2,
  Copy,
  Send,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Pencil,
} from 'lucide-react'
import { formatDateBR } from '@/lib/constants'
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/types'
import type {
  ApprovalRequest,
  ApprovalStatus,
  SharePermission,
  CreativeGeneration,
} from '@/types'

const PERMISSION_LABELS: Record<SharePermission, string> = {
  view: 'Visualizar',
  comment: 'Comentar',
  edit: 'Editar',
}

export default function CollaborationPage() {
  const { user } = useAuth()
  const {
    shares,
    loadShares,
    shareGeneration,
    comments,
    loadComments,
    addComment,
    approvals,
    loadApprovals,
    requestApproval,
    reviewApproval,
    generations,
    loadHistory,
  } = useCreative()

  const [loading, setLoading] = useState(true)

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareGenId, setShareGenId] = useState('')
  const [shareEmails, setShareEmails] = useState('')
  const [sharePermission, setSharePermission] = useState<SharePermission>('view')
  const [sharePublicLink, setSharePublicLink] = useState(true)
  const [shareSaving, setShareSaving] = useState(false)

  // Comment dialog
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [commentGenId, setCommentGenId] = useState('')
  const [commentImageIndex, setCommentImageIndex] = useState(0)
  const [commentContent, setCommentContent] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [selectedGen, setSelectedGen] = useState<CreativeGeneration | null>(null)
  const [pinMode, setPinMode] = useState(false)
  const [pinX, setPinX] = useState<number | undefined>(undefined)
  const [pinY, setPinY] = useState<number | undefined>(undefined)
  const imageRef = useRef<HTMLDivElement>(null)

  // Approval dialog
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [approvalGenId, setApprovalGenId] = useState('')
  const [approvalReviewers, setApprovalReviewers] = useState('')
  const [approvalMessage, setApprovalMessage] = useState('')
  const [approvalSaving, setApprovalSaving] = useState(false)

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRequestId, setReviewRequestId] = useState('')
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'changes_requested' | 'rejected'>('approved')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await Promise.all([
        loadShares(user.uid),
        loadApprovals(user.uid),
        loadHistory(user.uid),
      ])
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [user, loadShares, loadApprovals, loadHistory])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ===================== SHARE =====================

  function openShareDialog() {
    setShareGenId('')
    setShareEmails('')
    setSharePermission('view')
    setSharePublicLink(true)
    setShareDialogOpen(true)
  }

  async function handleShare() {
    if (!shareGenId) {
      toast.error('Selecione uma geração')
      return
    }
    setShareSaving(true)
    try {
      const recipients = shareEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({ email, permission: sharePermission }))

      const result = await shareGeneration({
        generationId: shareGenId,
        recipients: recipients.length > 0 ? recipients : undefined,
        publicLinkEnabled: sharePublicLink,
      })

      if (result?.publicLink) {
        await navigator.clipboard.writeText(`${window.location.origin}/share/${result.publicLink}`)
        toast.success('Compartilhado! Link copiado.')
      } else {
        toast.success('Compartilhado com sucesso!')
      }
      setShareDialogOpen(false)
      if (user) loadShares(user.uid)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao compartilhar')
    } finally {
      setShareSaving(false)
    }
  }

  // ===================== COMMENTS =====================

  function openCommentDialog(gen: CreativeGeneration) {
    setSelectedGen(gen)
    setCommentGenId(gen.id)
    setCommentImageIndex(0)
    setCommentContent('')
    setPinMode(false)
    setPinX(undefined)
    setPinY(undefined)
    loadComments(gen.id)
    setCommentDialogOpen(true)
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!pinMode || !imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPinX(Math.round(x * 10) / 10)
    setPinY(Math.round(y * 10) / 10)
  }

  async function handleAddComment() {
    if (!commentContent.trim()) {
      toast.error('Digite um comentário')
      return
    }
    setCommentSaving(true)
    try {
      await addComment({
        generationId: commentGenId,
        imageIndex: commentImageIndex,
        content: commentContent.trim(),
        pinX,
        pinY,
      })
      setCommentContent('')
      setPinX(undefined)
      setPinY(undefined)
      setPinMode(false)
      toast.success('Comentário adicionado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao comentar')
    } finally {
      setCommentSaving(false)
    }
  }

  const filteredComments = comments.filter((c) => c.imageIndex === commentImageIndex && !c.parentId)

  // ===================== APPROVALS =====================

  function openApprovalDialog() {
    setApprovalGenId('')
    setApprovalReviewers('')
    setApprovalMessage('')
    setApprovalDialogOpen(true)
  }

  async function handleRequestApproval() {
    if (!approvalGenId || !approvalReviewers.trim()) {
      toast.error('Preencha todos os campos')
      return
    }
    setApprovalSaving(true)
    try {
      const reviewers = approvalReviewers
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({ userId: '', email, displayName: email.split('@')[0] }))

      await requestApproval({
        generationId: approvalGenId,
        reviewers,
        message: approvalMessage || undefined,
      })
      toast.success('Aprovação solicitada!')
      setApprovalDialogOpen(false)
      if (user) loadApprovals(user.uid)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao solicitar')
    } finally {
      setApprovalSaving(false)
    }
  }

  function openReviewDialog(approval: ApprovalRequest) {
    setReviewRequestId(approval.id)
    setReviewStatus('approved')
    setReviewComment('')
    setReviewDialogOpen(true)
  }

  async function handleReview() {
    setReviewing(true)
    try {
      await reviewApproval(reviewRequestId, reviewStatus, reviewComment || undefined)
      toast.success('Revisão enviada!')
      setReviewDialogOpen(false)
      if (user) loadApprovals(user.uid)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao revisar')
    } finally {
      setReviewing(false)
    }
  }

  const APPROVAL_STATUS_ICONS: Record<ApprovalStatus, typeof Clock> = {
    pending_review: Clock,
    changes_requested: AlertTriangle,
    approved: CheckCircle2,
    rejected: XCircle,
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="page-header">Colaboração</h1>
        <p className="text-muted-foreground">
          Compartilhe, comente e aprove criativos com sua equipe
        </p>
      </div>

      <Tabs defaultValue="shares" className="space-y-6">
        <TabsList>
          <TabsTrigger value="shares">
            <Share2 className="h-4 w-4 mr-1.5" />
            Compartilhamento
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Comentários
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <CheckSquare className="h-4 w-4 mr-1.5" />
            Aprovações
          </TabsTrigger>
        </TabsList>

        {/* ====== SHARES TAB ====== */}
        <TabsContent value="shares" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Links Compartilhados</h2>
            <Button onClick={openShareDialog} disabled={generations.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : shares.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum compartilhamento</h3>
                <p className="text-sm text-muted-foreground">
                  Compartilhe gerações com sua equipe ou clientes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => {
                const gen = generations.find((g) => g.id === share.generationId)
                return (
                  <Card key={share.id} className="hover-lift">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                        {gen?.generatedImageUrls[0] && (
                          <Image src={gen.generatedImageUrls[0]} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{gen?.context || share.generationId}</p>
                          {share.publicLinkEnabled && (
                            <Badge variant="secondary">
                              <Link2 className="h-3 w-3 mr-1" />
                              Link público
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {share.sharedWith.length} destinatário(s)
                          {share.expiresAt && ` • Expira: ${formatDateBR(new Date(share.expiresAt))}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {share.publicLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/share/${share.publicLink}`)
                              toast.success('Link copiado!')
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ====== COMMENTS TAB ====== */}
        <TabsContent value="comments" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Comentários em Imagens</h2>
            <p className="text-sm text-muted-foreground">Clique em uma geração para ver e adicionar comentários</p>
          </div>

          {generations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma geração</h3>
                <p className="text-sm text-muted-foreground">
                  Gere criativos primeiro para poder comentar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generations.slice(0, 12).map((gen) => (
                <Card
                  key={gen.id}
                  className="hover-lift cursor-pointer group"
                  onClick={() => openCommentDialog(gen)}
                >
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
                        <MessageSquare className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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

        {/* ====== APPROVALS TAB ====== */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workflow de Aprovação</h2>
            <Button onClick={openApprovalDialog} disabled={generations.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Aprovação
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : approvals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma aprovação</h3>
                <p className="text-sm text-muted-foreground">
                  Solicite aprovação de criativos para sua equipe revisar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => {
                const gen = generations.find((g) => g.id === approval.generationId)
                const StatusIcon = APPROVAL_STATUS_ICONS[approval.status]
                const statusColor = APPROVAL_STATUS_COLORS[approval.status]
                const canReview = approval.reviewers.some(
                  (r) => r.email === user?.email && r.status === 'pending_review'
                )

                return (
                  <Card key={approval.id} className="hover-lift">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        {gen?.generatedImageUrls[0] && (
                          <Image src={gen.generatedImageUrls[0]} alt="" width={56} height={56} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            style={{ borderColor: statusColor, color: statusColor }}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {APPROVAL_STATUS_LABELS[approval.status]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            por {approval.requestedByName}
                          </span>
                        </div>
                        <p className="text-sm truncate">{gen?.context || approval.generationId}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {approval.reviewers.length} revisor(es)
                          </p>
                          {approval.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              📅 {formatDateBR(new Date(approval.dueDate))}
                            </p>
                          )}
                          <div className="flex -space-x-1">
                            {approval.reviewers.map((r, i) => (
                              <div
                                key={i}
                                className="h-5 w-5 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold"
                                style={{
                                  backgroundColor: APPROVAL_STATUS_COLORS[r.status],
                                  color: 'white',
                                }}
                                title={`${r.displayName}: ${APPROVAL_STATUS_LABELS[r.status]}`}
                              >
                                {r.displayName.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {canReview && (
                        <Button
                          size="sm"
                          onClick={() => openReviewDialog(approval)}
                        >
                          <CheckSquare className="h-4 w-4 mr-1.5" />
                          Revisar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== SHARE DIALOG ====== */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Geração</DialogTitle>
            <DialogDescription>
              Compartilhe com sua equipe ou gere um link público
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Geração</Label>
              <Select value={shareGenId} onValueChange={setShareGenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma geração" />
                </SelectTrigger>
                <SelectContent>
                  {generations
                    .filter((g) => g.generatedImageUrls.length > 0)
                    .slice(0, 20)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.context.slice(0, 50)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Emails (separados por vírgula)</Label>
              <Input
                value={shareEmails}
                onChange={(e) => setShareEmails(e.target.value)}
                placeholder="email1@exemplo.com, email2@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={sharePermission} onValueChange={(v) => setSharePermission(v as SharePermission)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PERMISSION_LABELS) as [SharePermission, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {k === 'view' && <Eye className="h-3 w-3 inline mr-1" />}
                      {k === 'comment' && <MessageSquare className="h-3 w-3 inline mr-1" />}
                      {k === 'edit' && <Pencil className="h-3 w-3 inline mr-1" />}
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sharePublicLink}
                onChange={(e) => setSharePublicLink(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Gerar link público</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={shareSaving}>
              {shareSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Compartilhando...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== COMMENT DIALOG ====== */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
            <DialogDescription>
              {selectedGen?.context || 'Adicione comentários e marque pontos na imagem'}
            </DialogDescription>
          </DialogHeader>

          {selectedGen && (
            <div className="space-y-4">
              {/* Image selector */}
              {selectedGen.generatedImageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedGen.generatedImageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCommentImageIndex(i)
                        setPinX(undefined)
                        setPinY(undefined)
                      }}
                      className={`h-14 w-14 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                        commentImageIndex === i ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image src={url} alt={`Imagem ${i + 1}`} width={56} height={56} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Image with pin support */}
              <div
                ref={imageRef}
                className={`relative rounded-lg overflow-hidden ${pinMode ? 'cursor-crosshair' : ''}`}
                onClick={handleImageClick}
              >
                <Image
                  src={selectedGen.generatedImageUrls[commentImageIndex]}
                  alt=""
                  width={800}
                  height={800}
                  className="w-full rounded-lg"
                />
                {/* Existing pins */}
                {filteredComments
                  .filter((c) => c.pinX !== undefined && c.pinY !== undefined)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="absolute w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
                      title={c.content}
                    >
                      <MapPin className="h-3 w-3 text-white" />
                    </div>
                  ))}
                {/* Current pin */}
                {pinX !== undefined && pinY !== undefined && (
                  <div
                    className="absolute w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2 animate-pulse"
                    style={{ left: `${pinX}%`, top: `${pinY}%` }}
                  >
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Comment input */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPinMode(!pinMode)
                        if (pinMode) {
                          setPinX(undefined)
                          setPinY(undefined)
                        }
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        pinMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      title="Marcar ponto na imagem"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    {pinX !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Pin: ({pinX.toFixed(0)}%, {pinY?.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Adicione um comentário..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleAddComment}
                  disabled={commentSaving || !commentContent.trim()}
                  size="sm"
                  className="mb-0.5"
                >
                  {commentSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Comments list */}
              {filteredComments.length > 0 && (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {filteredComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateBR(comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt))}
                          </span>
                          {comment.pinX !== undefined && (
                            <MapPin className="h-3 w-3 text-primary" />
                          )}
                          {comment.resolved && (
                            <Badge variant="secondary" className="text-xs">Resolvido</Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====== APPROVAL REQUEST DIALOG ====== */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Aprovação</DialogTitle>
            <DialogDescription>
              Envie para revisores aprovarem o criativo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Geração</Label>
              <Select value={approvalGenId} onValueChange={setApprovalGenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma geração" />
                </SelectTrigger>
                <SelectContent>
                  {generations
                    .filter((g) => g.generatedImageUrls.length > 0)
                    .slice(0, 20)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.context.slice(0, 50)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Revisores (emails separados por vírgula)</Label>
              <Input
                value={approvalReviewers}
                onChange={(e) => setApprovalReviewers(e.target.value)}
                placeholder="revisor1@exemplo.com, revisor2@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem (opcional)</Label>
              <Textarea
                value={approvalMessage}
                onChange={(e) => setApprovalMessage(e.target.value)}
                placeholder="Adicione uma mensagem para os revisores..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestApproval} disabled={approvalSaving}>
              {approvalSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Solicitando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Solicitar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== REVIEW DIALOG ====== */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar Criativo</DialogTitle>
            <DialogDescription>
              Envie sua avaliação sobre este criativo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Decisão</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'approved' as const, label: 'Aprovar', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600' },
                  { value: 'changes_requested' as const, label: 'Alterações', icon: AlertTriangle, color: 'border-violet-500 bg-violet-500/10 text-violet-600' },
                  { value: 'rejected' as const, label: 'Rejeitar', icon: XCircle, color: 'border-red-500 bg-red-500/10 text-red-600' },
                ]).map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setReviewStatus(opt.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        reviewStatus === opt.value ? opt.color : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comentário (opcional)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Adicione um comentário sobre sua decisão..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReview} disabled={reviewing}>
              {reviewing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Revisão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
