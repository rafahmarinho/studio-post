'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { LayoutTemplate, Plus, Pencil, Trash2, Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'
import {
  getTemplatesByUser,
  getPublicTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/lib/creative-service'
import { TEMPLATE_CATEGORY_LABELS, PLATFORM_CONFIG, IMAGE_FORMAT_CONFIG, TONE_LABELS } from '@/types'
import type {
  CreativeTemplate,
  TemplateCategory,
  ContentPlatform,
  ImageFormat,
  ToneType,
  GenerationMode,
} from '@/types'

export default function TemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<CreativeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CreativeTemplate | null>(null)
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all')

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<TemplateCategory>('social_media')
  const [formIsPublic, setFormIsPublic] = useState(false)
  const [formPlatform, setFormPlatform] = useState<ContentPlatform>('instagram')
  const [formFormat, setFormFormat] = useState<ImageFormat>('feed')
  const [formTone, setFormTone] = useState<ToneType>('professional')
  const [formContext, setFormContext] = useState('')
  const [formMode, setFormMode] = useState<GenerationMode>('both')

  const loadTemplates = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const category = filterCategory !== 'all' ? filterCategory : undefined
      const [userTemplates, publicTpls] = await Promise.all([
        getTemplatesByUser(user.uid, category),
        getPublicTemplates(category),
      ])

      const seen = new Set<string>()
      const merged: CreativeTemplate[] = []
      for (const t of [...userTemplates, ...publicTpls]) {
        if (!seen.has(t.id)) {
          seen.add(t.id)
          merged.push(t)
        }
      }
      setTemplates(merged)
    } catch {
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }, [user, filterCategory])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  function openCreate() {
    setEditingTemplate(null)
    setFormName('')
    setFormDescription('')
    setFormCategory('social_media')
    setFormIsPublic(false)
    setFormPlatform('instagram')
    setFormFormat('feed')
    setFormTone('professional')
    setFormContext('')
    setFormMode('both')
    setDialogOpen(true)
  }

  function openEdit(tpl: CreativeTemplate) {
    setEditingTemplate(tpl)
    setFormName(tpl.name)
    setFormDescription(tpl.description || '')
    setFormCategory(tpl.category)
    setFormIsPublic(tpl.isPublic)
    setFormPlatform(tpl.fields.platform || 'instagram')
    setFormFormat(tpl.fields.imageFormat || 'feed')
    setFormTone(tpl.fields.tone || 'professional')
    setFormContext(tpl.fields.context || '')
    setFormMode(tpl.fields.generationMode || 'both')
    setDialogOpen(true)
  }

  function handleDuplicate(tpl: CreativeTemplate) {
    setEditingTemplate(null)
    setFormName(`${tpl.name} (cópia)`)
    setFormDescription(tpl.description || '')
    setFormCategory(tpl.category)
    setFormIsPublic(false)
    setFormPlatform(tpl.fields.platform || 'instagram')
    setFormFormat(tpl.fields.imageFormat || 'feed')
    setFormTone(tpl.fields.tone || 'professional')
    setFormContext(tpl.fields.context || '')
    setFormMode(tpl.fields.generationMode || 'both')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!user || !formName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      const data = {
        userId: user.uid,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        isPublic: formIsPublic,
        fields: {
          platform: formPlatform,
          imageFormat: formFormat,
          tone: formTone,
          context: formContext.trim() || undefined,
          generationMode: formMode,
        },
      }

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data)
        toast.success('Template atualizado!')
      } else {
        await createTemplate(data as Omit<CreativeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>)
        toast.success('Template criado!')
      }

      setDialogOpen(false)
      loadTemplates()
    } catch {
      toast.error('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tpl: CreativeTemplate) {
    if (tpl.userId !== user?.uid) {
      toast.error('Você não pode excluir templates de outros usuários')
      return
    }
    if (!confirm(`Excluir "${tpl.name}"?`)) return
    try {
      await deleteTemplate(tpl.id)
      toast.success('Template excluído!')
      loadTemplates()
    } catch {
      toast.error('Erro ao excluir template')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Templates pré-configurados para gerar criativos rapidamente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v as TemplateCategory | 'all')}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhum Template</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie templates para agilizar suas gerações
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const isOwner = tpl.userId === user?.uid
            return (
              <Card key={tpl.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tpl.name}</CardTitle>
                      {tpl.description && (
                        <CardDescription className="mt-1">{tpl.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(tpl)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {isOwner && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(tpl)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(tpl)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      {TEMPLATE_CATEGORY_LABELS[tpl.category]}
                    </Badge>
                    {tpl.fields.platform && (
                      <Badge variant="outline">
                        {PLATFORM_CONFIG[tpl.fields.platform]?.emoji}{' '}
                        {PLATFORM_CONFIG[tpl.fields.platform]?.label}
                      </Badge>
                    )}
                    {tpl.isPublic && <Badge>Público</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Usos: {tpl.usageCount}</span>
                    {!isOwner && <span>Por outro usuário</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure os campos padrão para esse template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Post Instagram Restaurante"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formCategory}
                  onValueChange={(v) => setFormCategory(v as TemplateCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Breve descrição do template..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select
                  value={formPlatform}
                  onValueChange={(v) => setFormPlatform(v as ContentPlatform)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select
                  value={formFormat}
                  onValueChange={(v) => setFormFormat(v as ImageFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_FORMAT_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tom</Label>
                <Select
                  value={formTone}
                  onValueChange={(v) => setFormTone(v as ToneType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TONE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select
                  value={formMode}
                  onValueChange={(v) => setFormMode(v as GenerationMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Imagens + Legendas</SelectItem>
                    <SelectItem value="images_only">Somente Imagens</SelectItem>
                    <SelectItem value="captions_only">Somente Legendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contexto padrão (opcional)</Label>
              <Textarea
                value={formContext}
                onChange={(e) => setFormContext(e.target.value)}
                placeholder="Descrição padrão para esse tipo de geração..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPublic"
                checked={formIsPublic}
                onCheckedChange={(v) => setFormIsPublic(v === true)}
              />
              <Label htmlFor="isPublic" className="text-sm font-normal cursor-pointer">
                Tornar público (visível para todos os usuários)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
