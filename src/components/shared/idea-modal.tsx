'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2 } from 'lucide-react'

interface IdeaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (description: string) => Promise<void>
}

export function IdeaModal({ open, onOpenChange, onGenerate }: IdeaModalProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (description.length < 10) return
    setLoading(true)
    try {
      await onGenerate(description)
      setDescription('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Sem ideias? Deixe a IA te ajudar!
          </DialogTitle>
          <DialogDescription>
            Descreva o que você precisa e a IA preencherá todo o formulário
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Ex: Preciso de posts para lançamento de uma loja de roupas sustentáveis, público jovem 18-30, tons terrosos..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 10 caracteres ({description.length}/10)
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={description.length < 10 || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar briefing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
