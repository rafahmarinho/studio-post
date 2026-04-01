'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  MOCKUP_DEVICE_LABELS,
  MOCKUP_PLATFORM_LABELS,
} from '@/types'
import type { MockupDevice, MockupPlatform } from '@/types'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Share2 } from 'lucide-react'
import Image from 'next/image'

interface PreviewMockupProps {
  imageUrl: string
  caption?: string
  accountName?: string
  accountAvatar?: string
}

const DEVICE_FRAMES: Record<MockupDevice, { width: number; height: number; radius: string; notch: boolean }> = {
  iphone_15: { width: 375, height: 812, radius: '2.5rem', notch: true },
  android_pixel: { width: 393, height: 851, radius: '1.5rem', notch: false },
  ipad: { width: 500, height: 700, radius: '1.25rem', notch: false },
  desktop_browser: { width: 600, height: 400, radius: '0.5rem', notch: false },
}

export function PreviewMockup({ imageUrl, caption, accountName = 'studiopost', accountAvatar }: PreviewMockupProps) {
  const [device, setDevice] = useState<MockupDevice>('iphone_15')
  const [platform, setPlatform] = useState<MockupPlatform>('instagram_feed')
  const [darkMode, setDarkMode] = useState(false)

  const frame = DEVICE_FRAMES[device]
  const bg = darkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200'
  const scale = device === 'desktop_browser' ? 0.7 : device === 'ipad' ? 0.55 : 0.65

  const avatar = accountAvatar || `https://ui-avatars.com/api/?name=${accountName}&background=8b5cf6&color=fff&size=64`

  function renderContent() {
    // Instagram Feed
    if (platform === 'instagram_feed') {
      return (
        <div className={`${bg} h-full flex flex-col`}>
          {/* Header */}
          <div className={`flex items-center gap-3 px-3 py-2.5 border-b ${borderColor}`}>
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
              <Image src={avatar} alt="" width={32} height={32} className="w-full h-full rounded-full object-cover border-2 border-white" />
            </div>
            <span className="text-sm font-semibold flex-1">{accountName}</span>
            <MoreHorizontal className="h-5 w-5" />
          </div>
          {/* Image */}
          <div className="aspect-square w-full">
            <Image src={imageUrl} alt="" width={1024} height={1024} className="w-full h-full object-cover" />
          </div>
          {/* Actions */}
          <div className="flex items-center px-3 py-2.5 gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
            <div className="flex-1" />
            <Bookmark className="h-6 w-6" />
          </div>
          {/* Likes */}
          <div className="px-3 pb-1">
            <span className="text-sm font-semibold">1.234 curtidas</span>
          </div>
          {/* Caption */}
          {caption && (
            <div className="px-3 pb-2">
              <span className="text-sm">
                <span className="font-semibold">{accountName}</span>{' '}
                {caption.length > 100 ? caption.slice(0, 100) + '...' : caption}
              </span>
            </div>
          )}
          {/* Time */}
          <div className="px-3 pb-3">
            <span className={`text-[10px] uppercase ${mutedText}`}>2 horas atrás</span>
          </div>
        </div>
      )
    }

    // Instagram Stories
    if (platform === 'instagram_stories') {
      return (
        <div className="relative h-full bg-black">
          <Image src={imageUrl} alt="" width={768} height={1376} className="w-full h-full object-cover" />
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3">
            <div className="h-0.5 bg-white/30 rounded-full mb-3">
              <div className="h-full w-1/3 bg-white rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 p-0.5">
                <Image src={avatar} alt="" width={32} height={32} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-white text-sm font-semibold">{accountName}</span>
              <span className="text-white/60 text-xs">2h</span>
            </div>
          </div>
          {/* Bottom input */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
            <div className="flex-1 border border-white/40 rounded-full px-4 py-2">
              <span className="text-white/60 text-sm">Enviar mensagem</span>
            </div>
            <Heart className="h-6 w-6 text-white" />
            <Send className="h-6 w-6 text-white" />
          </div>
        </div>
      )
    }

    // Facebook Feed
    if (platform === 'facebook_feed') {
      return (
        <div className={`${bg} h-full flex flex-col`}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Image src={avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1">
              <span className="text-sm font-semibold">{accountName}</span>
              <div className="flex items-center gap-1">
                <span className={`text-xs ${mutedText}`}>2h · 🌐</span>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5" />
          </div>
          {/* Caption */}
          {caption && (
            <div className="px-3 pb-2">
              <span className="text-sm">{caption.length > 120 ? caption.slice(0, 120) + '...' : caption}</span>
            </div>
          )}
          {/* Image */}
          <div className="w-full">
            <Image src={imageUrl} alt="" width={600} height={600} className="w-full object-cover" />
          </div>
          {/* Reactions bar */}
          <div className={`flex items-center justify-between px-3 py-2 border-b ${borderColor}`}>
            <span className={`text-xs ${mutedText}`}>👍❤️ 42</span>
            <span className={`text-xs ${mutedText}`}>5 comentários</span>
          </div>
          {/* Actions */}
          <div className={`flex items-center justify-around py-1.5 border-b ${borderColor}`}>
            <button className={`flex items-center gap-1.5 text-sm ${mutedText} py-1.5 px-3`}>
              <ThumbsUp className="h-4.5 w-4.5" /> Curtir
            </button>
            <button className={`flex items-center gap-1.5 text-sm ${mutedText} py-1.5 px-3`}>
              <MessageCircle className="h-4.5 w-4.5" /> Comentar
            </button>
            <button className={`flex items-center gap-1.5 text-sm ${mutedText} py-1.5 px-3`}>
              <Share2 className="h-4.5 w-4.5" /> Compartilhar
            </button>
          </div>
        </div>
      )
    }

    // Facebook Stories
    if (platform === 'facebook_stories') {
      return (
        <div className="relative h-full bg-black">
          <Image src={imageUrl} alt="" width={768} height={1376} className="w-full h-full object-cover" />
          <div className="absolute top-0 left-0 right-0 p-3">
            <div className="h-0.5 bg-white/30 rounded-full mb-3">
              <div className="h-full w-1/2 bg-white rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Image src={avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
              <span className="text-white text-sm font-semibold">{accountName}</span>
              <span className="text-white/60 text-xs">2h</span>
            </div>
          </div>
        </div>
      )
    }

    // LinkedIn Feed
    if (platform === 'linkedin_feed') {
      return (
        <div className={`${bg} h-full flex flex-col`}>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Image src={avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1">
              <span className="text-sm font-semibold">{accountName}</span>
              <div className={`text-xs ${mutedText}`}>Marketing Digital · 2h</div>
            </div>
            <MoreHorizontal className="h-5 w-5" />
          </div>
          {caption && (
            <div className="px-3 pb-2">
              <span className="text-sm">{caption.length > 100 ? caption.slice(0, 100) + '...' : caption}</span>
            </div>
          )}
          <div className="w-full">
            <Image src={imageUrl} alt="" width={600} height={600} className="w-full object-cover" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 border-b ${borderColor}`}>
            <span className={`text-xs ${mutedText}`}>👍 18 · 3 comentários</span>
          </div>
          <div className={`flex items-center justify-around py-2`}>
            <button className={`flex items-center gap-1.5 text-xs ${mutedText}`}>
              <ThumbsUp className="h-4 w-4" /> Gostei
            </button>
            <button className={`flex items-center gap-1.5 text-xs ${mutedText}`}>
              <MessageCircle className="h-4 w-4" /> Comentar
            </button>
            <button className={`flex items-center gap-1.5 text-xs ${mutedText}`}>
              <Share2 className="h-4 w-4" /> Repost
            </button>
            <button className={`flex items-center gap-1.5 text-xs ${mutedText}`}>
              <Send className="h-4 w-4" /> Enviar
            </button>
          </div>
        </div>
      )
    }

    // Twitter / X Feed
    if (platform === 'twitter_feed') {
      return (
        <div className={`${bg} h-full flex flex-col p-3`}>
          <div className="flex gap-2.5">
            <Image src={avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{accountName}</span>
                <span className={`text-sm ${mutedText}`}>@{accountName} · 2h</span>
              </div>
              {caption && (
                <p className="text-sm mt-1">{caption.length > 140 ? caption.slice(0, 140) + '...' : caption}</p>
              )}
              <div className="mt-2 rounded-2xl overflow-hidden">
                <Image src={imageUrl} alt="" width={600} height={600} className="w-full rounded-2xl object-cover" />
              </div>
              <div className={`flex items-center justify-between mt-2 ${mutedText}`}>
                <button className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4" /> 5</button>
                <button className="flex items-center gap-1 text-xs">🔄 12</button>
                <button className="flex items-center gap-1 text-xs"><Heart className="h-4 w-4" /> 48</button>
                <button className="flex items-center gap-1 text-xs"><Share2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Dispositivo</Label>
          <Select value={device} onValueChange={(v) => setDevice(v as MockupDevice)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(MOCKUP_DEVICE_LABELS) as [MockupDevice, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Plataforma</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as MockupPlatform)}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(MOCKUP_PLATFORM_LABELS) as [MockupPlatform, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`h-9 px-3 rounded-md text-xs font-medium transition-colors ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>

      {/* Device frame */}
      <div className="flex justify-center">
        <div
          className="relative bg-black shadow-2xl overflow-hidden"
          style={{
            width: frame.width * scale,
            height: frame.height * scale,
            borderRadius: frame.radius,
            border: '6px solid #1a1a1a',
          }}
        >
          {/* Notch for iPhone */}
          {frame.notch && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-10" />
          )}

          {/* Content */}
          <div className="w-full h-full overflow-hidden" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: frame.width, height: frame.height }}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Device label */}
      <div className="text-center">
        <Badge variant="secondary">
          {MOCKUP_DEVICE_LABELS[device]} — {MOCKUP_PLATFORM_LABELS[platform]}
        </Badge>
      </div>
    </div>
  )
}
