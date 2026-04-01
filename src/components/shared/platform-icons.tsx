import { Globe, FileText, Mail } from 'lucide-react'
import type { ContentPlatform } from '@/types'

interface PlatformIconProps {
  platform: ContentPlatform | string
  className?: string
  size?: number
  /** Render in the platform's official brand color */
  colored?: boolean
}

/* ── Official brand SVG paths (monochrome, fill=currentColor) ── */

function InstagramIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 1.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm4.75-2.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
    </svg>
  )
}

function FacebookIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
    </svg>
  )
}

function LinkedInIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125ZM6.864 20.452H3.81V9h3.054v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.205 24 24 23.227 24 22.271V1.729C24 .774 23.205 0 22.222 0h.003Z" />
    </svg>
  )
}

function TikTokIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.77 1.52V7a4.84 4.84 0 0 1-1.01-.31Z" />
    </svg>
  )
}

function YouTubeIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  )
}

function XTwitterIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

function PinterestIcon({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0Z" />
    </svg>
  )
}

/**
 * Renders the official brand icon for a given platform.
 * Falls back to lucide icons for non-social platforms (Blog, Email, Other).
 */
export function PlatformIcon({ platform, className, size = 20, colored = false }: PlatformIconProps) {
  const color = colored ? PLATFORM_BRAND_COLORS[platform] ?? undefined : undefined
  const style = color ? { color } : undefined
  const cls = className

  switch (platform) {
    case 'instagram':
      return <span style={style}><InstagramIcon className={cls} size={size} /></span>
    case 'facebook':
      return <span style={style}><FacebookIcon className={cls} size={size} /></span>
    case 'linkedin':
      return <span style={style}><LinkedInIcon className={cls} size={size} /></span>
    case 'tiktok':
      return <span style={style}><TikTokIcon className={cls} size={size} /></span>
    case 'youtube':
      return <span style={style}><YouTubeIcon className={cls} size={size} /></span>
    case 'twitter':
      return <span style={style}><XTwitterIcon className={cls} size={size} /></span>
    case 'pinterest':
      return <span style={style}><PinterestIcon className={cls} size={size} /></span>
    case 'blog':
      return <span style={style}><FileText className={cls} size={size} /></span>
    case 'email':
      return <span style={style}><Mail className={cls} size={size} /></span>
    default:
      return <span style={style}><Globe className={cls} size={size} /></span>
  }
}

/** Map of platform to its brand color (for inline coloring) */
export const PLATFORM_BRAND_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  tiktok: '#010101',
  youtube: '#FF0000',
  twitter: '#000000',
  pinterest: '#BD081C',
  blog: '#FF5722',
  email: '#4CAF50',
  other: '#9E9E9E',
}
