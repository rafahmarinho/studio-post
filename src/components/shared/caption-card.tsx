'use client'

import { cn } from '@/lib/utils'
import type { GeneratedCaption } from '@/types'

interface CaptionCardProps {
  caption: GeneratedCaption
  compact?: boolean
}

export function CaptionCard({ caption, compact = false }: CaptionCardProps) {
  return (
    <div className={cn('p-4 space-y-2', compact && 'p-3 space-y-1')}>
      <h4 className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
        {caption.headline}
      </h4>
      <p className={cn('text-muted-foreground', compact ? 'text-xs line-clamp-3' : 'text-sm whitespace-pre-line')}>
        {caption.body}
      </p>
      <p className={cn('font-medium text-primary', compact ? 'text-xs' : 'text-sm')}>
        {caption.cta}
      </p>
      <div className="flex flex-wrap gap-1">
        {caption.hashtags.map((tag) => (
          <span
            key={tag}
            className={cn(
              'text-blue-500',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}
