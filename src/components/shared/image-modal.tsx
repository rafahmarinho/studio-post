'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react'
import type { GeneratedCaption } from '@/types'
import { CaptionCard } from './caption-card'
import { formatCurrency, REFINE_COST_CENTS } from '@/lib/constants'

interface ImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  imageIndex: number
  caption?: GeneratedCaption
  versions: string[]
  onRefine: (prompt: string) => Promise<void>
  refining: boolean
}

export function ImageModal({
  open,
  onOpenChange,
  imageUrl,
  imageIndex,
  caption,
  versions,
  onRefine,
  refining,
}: ImageModalProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [selectedVersion, setSelectedVersion] = useState(
    String(versions.length - 1)
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const currentUrl = versions[parseInt(selectedVersion)] || imageUrl

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4))
  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.25, 0.25))
    if (zoom <= 1.25) setPan({ x: 0, y: 0 })
  }

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom((z) => Math.min(Math.max(z + delta, 0.25), 4))
    },
    []
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) return
    await onRefine(refinementPrompt)
    setRefinementPrompt('')
    setSelectedVersion(String(versions.length))
  }

  const handleDownload = async () => {
    const response = await fetch(currentUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `creative_${imageIndex + 1}_v${parseInt(selectedVersion) + 1}.${blob.type.includes('png') ? 'png' : 'jpg'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">
          Imagem #{imageIndex + 1}
        </DialogTitle>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Imagem #{imageIndex + 1}
              </span>
              {versions.length > 1 && (
                <Select
                  value={selectedVersion}
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        v{i + 1}
                        {i === 0 ? ' (original)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(currentUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Image */}
            <div
              ref={containerRef}
              className="flex-1 overflow-hidden bg-muted/50 flex items-center justify-center cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <Image
                src={currentUrl}
                alt={`Imagem ${imageIndex + 1}`}
                width={1024}
                height={1024}
                className="max-w-full max-h-[60vh] object-contain select-none"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s',
                }}
                draggable={false}
              />
            </div>

            {/* Caption sidebar */}
            {caption && (
              <div className="w-72 border-l overflow-y-auto">
                <div className="p-3 border-b">
                  <h3 className="text-sm font-medium">Legenda</h3>
                </div>
                <CaptionCard caption={caption} />
              </div>
            )}
          </div>

          {/* Refine bar */}
          <div className="p-3 border-t flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500 shrink-0" />
            <Input
              placeholder="Descreva o que deseja mudar nesta imagem..."
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !refining) handleRefine()
              }}
              disabled={refining}
              className="flex-1"
            />
            <Button
              onClick={handleRefine}
              disabled={!refinementPrompt.trim() || refining}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {refining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Refinar
                </>
              )}
            </Button>
            <Badge variant="outline" className="text-xs shrink-0">
              {formatCurrency(REFINE_COST_CENTS)}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
