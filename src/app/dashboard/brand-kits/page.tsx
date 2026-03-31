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
import { Palette, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getBrandKitsByUser,
  createBrandKit,
  updateBrandKit,
  deleteBrandKit,
} from '@/lib/creative-service'
import {
  TONE_LABELS,
  VISUAL_STYLE_LABELS,
  MOOD_LABELS,
} from '@/types'
import type { BrandKit, BrandColor, BrandFont, ToneType, VisualStyle, MoodType } from '@/types'

export default function BrandKitsPage() {
  const { user } = useAuth()
  const [kits, setKits] = useState<BrandKit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKit, setEditingKit] = useState<BrandKit | null>(null)

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTone, setFormTone] = useState<ToneType>('professional')
  const [formVisualStyle, setFormVisualStyle] = useState<VisualStyle>('photography')
  const [formMood, setFormMood] = useState<MoodType | ''>('')
  const [formColors, setFormColors] = useState<BrandColor[]>([
    { name: 'Primária', hex: '#3b82f6', role: 'primary' },
  ])
  const [formFonts, setFormFonts] = useState<BrandFont[]>([{ name: '', role: 'heading' }])
  const [formGuidelines, setFormGuidelines] = useState('')

  const loadKits = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getBrandKitsByUser(user.uid)
      setKits(data)
    } catch {
      toast.error('Erro ao carregar brand kits')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadKits()
  }, [loadKits])

  function openCreate() {
    setEditingKit(null)
    setFormName('')
    setFormDescription('')
    setFormTone('professional')
    setFormVisualStyle('photography')
    setFormMood('')
    setFormColors([{ name: 'Primária', hex: '#3b82f6', role: 'primary' }])
    setFormFonts([{ name: '', role: 'heading' }])
    setFormGuidelines('')
    setDialogOpen(true)
  }

  function openEdit(kit: BrandKit) {
    setEditingKit(kit)
    setFormName(kit.name)
    setFormDescription(kit.description || '')
    setFormTone(kit.tone)
    setFormVisualStyle(kit.visualStyle)
    setFormMood(kit.mood || '')
    setFormColors(kit.colors.length > 0 ? kit.colors : [{ name: 'Primária', hex: '#3b82f6', role: 'primary' }])
    setFormFonts(kit.fonts.length > 0 ? kit.fonts : [{ name: '', role: 'heading' }])
    setFormGuidelines(kit.guidelines || '')
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
        colors: formColors.filter((c) => c.hex),
        fonts: formFonts.filter((f) => f.name),
        tone: formTone,
        visualStyle: formVisualStyle,
        mood: formMood || undefined,
        guidelines: formGuidelines.trim() || undefined,
      }

      if (editingKit) {
        await updateBrandKit(editingKit.id, data)
        toast.success('Brand Kit atualizado!')
      } else {
        await createBrandKit(data as Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>)
        toast.success('Brand Kit criado!')
      }

      setDialogOpen(false)
      loadKits()
    } catch {
      toast.error('Erro ao salvar brand kit')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(kit: BrandKit) {
    if (!confirm(`Excluir "${kit.name}"?`)) return
    try {
      await deleteBrandKit(kit.id)
      toast.success('Brand Kit excluído!')
      loadKits()
    } catch {
      toast.error('Erro ao excluir brand kit')
    }
  }

  function addColor() {
    setFormColors((prev) => [
      ...prev,
      { name: '', hex: '#000000', role: 'accent' },
    ])
  }

  function removeColor(index: number) {
    setFormColors((prev) => prev.filter((_, i) => i !== index))
  }

  function updateColor(index: number, field: keyof BrandColor, value: string) {
    setFormColors((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      )
    )
  }

  function addFont() {
    setFormFonts((prev) => [...prev, { name: '', role: 'body' }])
  }

  function removeFont(index: number) {
    setFormFonts((prev) => prev.filter((_, i) => i !== index))
  }

  function updateFont(index: number, field: keyof BrandFont, value: string) {
    setFormFonts((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      )
    )
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Kits</h1>
          <p className="text-muted-foreground">
            Gerencie identidades visuais para uso rápido na geração de criativos
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Brand Kit
        </Button>
      </div>

      {kits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhum Brand Kit</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie um Brand Kit para padronizar suas gerações
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Brand Kit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <Card key={kit.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{kit.name}</CardTitle>
                    {kit.description && (
                      <CardDescription className="mt-1">{kit.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(kit)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(kit)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Color swatches */}
                <div className="flex gap-1.5 flex-wrap">
                  {kit.colors.map((color, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-md border shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} (${color.hex})`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{TONE_LABELS[kit.tone]}</Badge>
                  <Badge variant="secondary">{VISUAL_STYLE_LABELS[kit.visualStyle]}</Badge>
                  {kit.mood && <Badge variant="outline">{MOOD_LABELS[kit.mood]}</Badge>}
                </div>

                {kit.fonts.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Fontes: {kit.fonts.map((f) => f.name).filter(Boolean).join(', ') || '—'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingKit ? 'Editar Brand Kit' : 'Novo Brand Kit'}
            </DialogTitle>
            <DialogDescription>
              Configure a identidade visual para padronizar suas gerações
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Marca Principal"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Breve descrição da marca..."
                rows={2}
              />
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cores</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addColor}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {formColors.map((color, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(i, 'hex', e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={color.name}
                    onChange={(e) => updateColor(i, 'name', e.target.value)}
                    placeholder="Nome da cor"
                    className="flex-1"
                  />
                  <Select
                    value={color.role}
                    onValueChange={(v) => updateColor(i, 'role', v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primária</SelectItem>
                      <SelectItem value="secondary">Secundária</SelectItem>
                      <SelectItem value="accent">Destaque</SelectItem>
                      <SelectItem value="background">Fundo</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                    </SelectContent>
                  </Select>
                  {formColors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeColor(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Fonts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fontes</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addFont}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {formFonts.map((font, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={font.name}
                    onChange={(e) => updateFont(i, 'name', e.target.value)}
                    placeholder="Nome da fonte (ex: Inter)"
                    className="flex-1"
                  />
                  <Select
                    value={font.role}
                    onValueChange={(v) => updateFont(i, 'role', v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heading">Título</SelectItem>
                      <SelectItem value="body">Corpo</SelectItem>
                      <SelectItem value="accent">Destaque</SelectItem>
                    </SelectContent>
                  </Select>
                  {formFonts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFont(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Tone & Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tom</Label>
                <Select value={formTone} onValueChange={(v) => setFormTone(v as ToneType)}>
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
                <Label>Estilo Visual</Label>
                <Select
                  value={formVisualStyle}
                  onValueChange={(v) => setFormVisualStyle(v as VisualStyle)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VISUAL_STYLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mood (opcional)</Label>
              <Select
                value={formMood || 'none'}
                onValueChange={(v) => setFormMood(v === 'none' ? '' : (v as MoodType))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {Object.entries(MOOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Diretrizes da Marca (opcional)</Label>
              <Textarea
                value={formGuidelines}
                onChange={(e) => setFormGuidelines(e.target.value)}
                placeholder="Instruções adicionais sobre a identidade visual, tom de voz, o que evitar, etc..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingKit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
