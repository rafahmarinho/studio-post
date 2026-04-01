'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useCreative } from '@/hooks/use-creative'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ImageModal } from '@/components/shared/image-modal'
import { CaptionCard } from '@/components/shared/caption-card'
import { formatDateBR } from '@/lib/constants'
import {
  PLATFORM_CONFIG,
  IMAGE_FORMAT_CONFIG,
  GENERATION_MODE_LABELS,
} from '@/types'
import type { CreativeGeneration } from '@/types'
import {
  ChevronDown,
  ChevronUp,
  Search,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
} from 'lucide-react'

export default function HistoryPage() {
  const { user } = useAuth()
  const { generations, loading, loadHistory } = useCreative()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    generation: CreativeGeneration
    index: number
  } | null>(null)

  useEffect(() => {
    if (user) {
      loadHistory(user.uid)
    }
  }, [user, loadHistory])

  const filtered = generations.filter(
    (g) =>
      g.context.toLowerCase().includes(search.toLowerCase()) ||
      g.platform.toLowerCase().includes(search.toLowerCase()) ||
      g.purpose?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="page-header">Histórico</h1>
        <p className="text-muted-foreground">
          Todas as suas gerações anteriores
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por contexto, plataforma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma geração encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? 'Tente outro termo de busca'
                : 'Suas gerações aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => {
            const isExpanded = expandedId === g.id
            const platformInfo = PLATFORM_CONFIG[g.platform]
            const formatInfo = IMAGE_FORMAT_CONFIG[g.imageFormat]
            const createdAt = g.createdAt instanceof Date
              ? g.createdAt
              : new Date((g.createdAt as unknown as { seconds: number }).seconds * 1000)

            return (
              <Card key={g.id} className="overflow-hidden hover-lift">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : g.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary">
                        {platformInfo.emoji} {platformInfo.label}
                      </Badge>
                      <Badge variant="outline">{formatInfo.label}</Badge>
                      <Badge
                        variant={
                          g.status === 'completed'
                            ? 'default'
                            : g.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {g.status === 'completed'
                          ? 'Concluído'
                          : g.status === 'failed'
                            ? 'Falhou'
                            : 'Gerando'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          {g.generatedImageUrls.length}
                        </span>
                        {g.generatedCaptions && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {g.generatedCaptions.length}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateBR(createdAt)}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {g.context}
                  </p>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t pt-6">
                    {/* Details */}
                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">Modo:</span>{' '}
                        {GENERATION_MODE_LABELS[g.generationMode]}
                      </div>
                      {g.purpose && (
                        <div>
                          <span className="text-muted-foreground">Propósito:</span>{' '}
                          {g.purpose}
                        </div>
                      )}
                      {g.intent && (
                        <div>
                          <span className="text-muted-foreground">Intenção:</span>{' '}
                          {g.intent}
                        </div>
                      )}
                      {g.targetAudience && (
                        <div>
                          <span className="text-muted-foreground">Público:</span>{' '}
                          {g.targetAudience}
                        </div>
                      )}
                    </div>

                    {/* Images */}
                    {g.generatedImageUrls.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">
                          Imagens ({g.generatedImageUrls.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {g.generatedImageUrls.map((url, i) => (
                            <div
                              key={i}
                              className="aspect-square relative rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                              onClick={() =>
                                setSelectedImage({
                                  url,
                                  generation: g,
                                  index: i,
                                })
                              }
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Image ${i + 1}`}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Captions */}
                    {g.generatedCaptions && g.generatedCaptions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">
                          Legendas ({g.generatedCaptions.length})
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {g.generatedCaptions.map((caption, i) => (
                            <CaptionCard key={i} caption={caption} />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {selectedImage && (
        <ImageModal
          open={!!selectedImage}
          onOpenChange={(open) => { if (!open) setSelectedImage(null) }}
          imageUrl={selectedImage.url}
          imageIndex={selectedImage.index}
          versions={[selectedImage.url]}
          onRefine={async () => {}}
          refining={false}
        />
      )}
    </div>
  )
}
