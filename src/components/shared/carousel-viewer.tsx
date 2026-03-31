'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { GeneratedCaption } from '@/types'
import { CaptionCard } from './caption-card'
import { cn } from '@/lib/utils'

interface CarouselViewerProps {
  imageUrls: string[]
  imagesPerCarousel: number
  captions?: GeneratedCaption[]
  imageVersions: Record<number, string[]>
  onImageClick: (index: number) => void
}

export function CarouselViewer({
  imageUrls,
  imagesPerCarousel,
  captions,
  imageVersions,
  onImageClick,
}: CarouselViewerProps) {
  const carouselCount = Math.ceil(imageUrls.length / imagesPerCarousel)
  const [activeSlides, setActiveSlides] = useState<Record<number, number>>({})

  const getActiveSlide = (groupIndex: number) => activeSlides[groupIndex] ?? 0

  const navigate = (groupIndex: number, direction: 'prev' | 'next') => {
    setActiveSlides((prev) => {
      const current = prev[groupIndex] ?? 0
      const max = imagesPerCarousel - 1
      const next =
        direction === 'next'
          ? Math.min(current + 1, max)
          : Math.max(current - 1, 0)
      return { ...prev, [groupIndex]: next }
    })
  }

  return (
    <div className="space-y-8">
      {Array.from({ length: carouselCount }).map((_, groupIdx) => {
        const startIdx = groupIdx * imagesPerCarousel
        const slides = imageUrls.slice(startIdx, startIdx + imagesPerCarousel)
        const activeSlide = getActiveSlide(groupIdx)
        const globalIdx = startIdx + activeSlide
        const versions = imageVersions[globalIdx] || [slides[activeSlide]]
        const latestUrl = versions[versions.length - 1]
        const caption = captions?.[groupIdx]

        return (
          <div key={groupIdx} className="rounded-lg border bg-card overflow-hidden">
            <div className="p-3 border-b">
              <h3 className="text-sm font-medium">
                Carrossel {groupIdx + 1} de {carouselCount}
              </h3>
            </div>
            <div className="flex flex-col md:flex-row">
              {/* Main viewer */}
              <div className="flex-1 p-4">
                <div className="relative">
                  <div
                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => onImageClick(globalIdx)}
                  >
                    <img
                      src={latestUrl}
                      alt={`Slide ${activeSlide + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {versions.length > 1 && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        v{versions.length}
                      </Badge>
                    )}
                  </div>

                  {/* Navigation arrows */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80"
                    disabled={activeSlide === 0}
                    onClick={() => navigate(groupIdx, 'prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80"
                    disabled={activeSlide === slides.length - 1}
                    onClick={() => navigate(groupIdx, 'next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {slides.map((_, slideIdx) => (
                      <button
                        key={slideIdx}
                        className={cn(
                          'h-2 w-2 rounded-full transition-colors',
                          slideIdx === activeSlide
                            ? 'bg-white'
                            : 'bg-white/50'
                        )}
                        onClick={() =>
                          setActiveSlides((prev) => ({
                            ...prev,
                            [groupIdx]: slideIdx,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {slides.map((url, slideIdx) => {
                    const gIdx = startIdx + slideIdx
                    const v = imageVersions[gIdx] || [url]
                    const thumbUrl = v[v.length - 1]
                    return (
                      <button
                        key={slideIdx}
                        className={cn(
                          'shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-colors',
                          slideIdx === activeSlide
                            ? 'border-primary'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        )}
                        onClick={() =>
                          setActiveSlides((prev) => ({
                            ...prev,
                            [groupIdx]: slideIdx,
                          }))
                        }
                      >
                        <img
                          src={thumbUrl}
                          alt={`Slide ${slideIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Caption */}
              {caption && (
                <div className="md:w-72 border-t md:border-t-0 md:border-l">
                  <div className="p-3 border-b">
                    <h4 className="text-sm font-medium">Legenda</h4>
                  </div>
                  <CaptionCard caption={caption} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
