'use client'

import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreamingGridProps {
  streamedImageUrls: string[]
  totalExpectedImages: number
  generationProgress: number
}

export function StreamingGrid({
  streamedImageUrls,
  totalExpectedImages,
  generationProgress,
}: StreamingGridProps) {
  const remaining = totalExpectedImages - streamedImageUrls.length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Gerando imagens... ({streamedImageUrls.length}/{totalExpectedImages})
          </span>
          <span className="text-muted-foreground">
            {Math.round(generationProgress)}%
          </span>
        </div>
        <Progress value={generationProgress} />
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Não recarregue a página durante a geração</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {streamedImageUrls.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
          >
            <Image
              src={url}
              alt={`Imagem ${i + 1}`}
              width={512}
              height={512}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {i + 1}
            </div>
          </div>
        ))}

        {Array.from({ length: remaining }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted flex items-center justify-center',
              i === 0 && 'animate-pulse border-primary/40'
            )}
          >
            <div className="text-center text-muted-foreground text-xs">
              {i === 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Gerando...</span>
                </div>
              ) : (
                <span>{streamedImageUrls.length + i + 1}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
