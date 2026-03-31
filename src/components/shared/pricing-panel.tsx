'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Rocket, Info } from 'lucide-react'
import {
  formatCurrency,
  getDiscount,
  getUnitPrice,
  calculateTotalCost,
} from '@/lib/constants'
import type { GenerationMode, ImageFormat } from '@/types'
import { GENERATION_MODE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface PricingPanelProps {
  generationMode: GenerationMode
  onGenerationModeChange: (mode: GenerationMode) => void
  totalImages: number
  onTotalImagesChange: (n: number) => void
  imageFormat: ImageFormat
  carouselCount: number
  onCarouselCountChange: (n: number) => void
  imagesPerCarousel: number
  onImagesPerCarouselChange: (n: number) => void
  onGenerate: () => void
  generating: boolean
  summaryItems: { label: string; value: string }[]
}

export function PricingPanel({
  generationMode,
  onGenerationModeChange,
  totalImages,
  onTotalImagesChange,
  imageFormat,
  carouselCount,
  onCarouselCountChange,
  imagesPerCarousel,
  onImagesPerCarouselChange,
  onGenerate,
  generating,
  summaryItems,
}: PricingPanelProps) {
  const isCarousel = imageFormat === 'carousel'
  const effectiveTotal = isCarousel
    ? carouselCount * imagesPerCarousel
    : totalImages
  const discount = getDiscount(effectiveTotal)
  const unitPrice = getUnitPrice(generationMode, effectiveTotal)
  const total = calculateTotalCost(generationMode, effectiveTotal)

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Configuração</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Generation mode */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Modo de Geração
          </Label>
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(GENERATION_MODE_LABELS) as GenerationMode[]).map(
              (mode) => (
                <Button
                  key={mode}
                  variant={generationMode === mode ? 'default' : 'outline'}
                  size="sm"
                  className="text-[10px] px-2 h-8"
                  onClick={() => onGenerationModeChange(mode)}
                >
                  {mode === 'images_only'
                    ? 'Imagens'
                    : mode === 'captions_only'
                      ? 'Legendas'
                      : 'Ambos'}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Quantity */}
        {isCarousel ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Carrosséis</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={carouselCount}
                onChange={(e) =>
                  onCarouselCountChange(
                    Math.max(1, Math.min(30, parseInt(e.target.value) || 1))
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Slides por carrossel</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={imagesPerCarousel}
                onChange={(e) =>
                  onImagesPerCarouselChange(
                    Math.max(2, Math.min(10, parseInt(e.target.value) || 2))
                  )
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {carouselCount} x {imagesPerCarousel} ={' '}
              <strong>{effectiveTotal} imagens</strong>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Quantidade</Label>
              <span className="text-sm font-bold">{totalImages}</span>
            </div>
            <Slider
              value={[totalImages]}
              onValueChange={([v]) => onTotalImagesChange(v)}
              min={1}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>30</span>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(unitPrice)} x {effectiveTotal}</span>
            <span>{formatCurrency(unitPrice * effectiveTotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto ({Math.round(discount * 100)}%)</span>
              <span>
                -{formatCurrency(Math.round(effectiveTotal * (getUnitPrice(generationMode, 1) - unitPrice)))}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1 border-t">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {discount === 0 && effectiveTotal < 6 && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>A partir de 6 itens você ganha desconto de até 30%</span>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={onGenerate}
          disabled={generating}
          className="w-full"
          size="lg"
        >
          <Rocket className="h-4 w-4" />
          {generating ? 'Gerando...' : 'Gerar Criativos'}
        </Button>

        {/* Summary */}
        {summaryItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Resumo</p>
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex justify-between text-xs"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn('max-w-[60%] text-right truncate')}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
