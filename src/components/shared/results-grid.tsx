'use client'

import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import type { GeneratedCaption } from '@/types'
import { CaptionCard } from './caption-card'

interface ResultsGridProps {
  imageUrls: string[]
  captions?: GeneratedCaption[]
  imageVersions: Record<number, string[]>
  onImageClick: (index: number) => void
}

export function ResultsGrid({
  imageUrls,
  captions,
  imageVersions,
  onImageClick,
}: ResultsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {imageUrls.map((url, i) => {
        const versions = imageVersions[i] || [url]
        const latestUrl = versions[versions.length - 1]
        const versionCount = versions.length
        const caption = captions?.[i]

        return (
          <div key={i} className="group rounded-lg border bg-card overflow-hidden">
            <div
              className="relative aspect-square cursor-pointer overflow-hidden"
              onClick={() => onImageClick(i)}
            >
              <Image
                src={latestUrl}
                alt={`Imagem ${i + 1}`}
                width={512}
                height={512}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {versionCount > 1 && (
                <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                  v{versionCount}
                </Badge>
              )}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                #{i + 1}
              </div>
            </div>
            {caption && <CaptionCard caption={caption} compact />}
          </div>
        )
      })}
    </div>
  )
}
