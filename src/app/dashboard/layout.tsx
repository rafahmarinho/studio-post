'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  History,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  Palette,
  LayoutTemplate,
  Building2,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Plug,
  CalendarClock,
  Users,
} from 'lucide-react'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/generate', label: 'Gerar Criativos', icon: Wand2 },
      { href: '/dashboard/history', label: 'Histórico', icon: History },
    ],
  },
  {
    label: 'Marca',
    items: [
      { href: '/dashboard/brand-kits', label: 'Brand Kits', icon: Palette },
      { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
    ],
  },
  {
    label: 'Publicação',
    items: [
      { href: '/dashboard/integrations', label: 'Integrações', icon: Plug },
      { href: '/dashboard/schedule', label: 'Agendamento', icon: CalendarClock },
    ],
  },
  {
    label: 'Equipe',
    items: [
      { href: '/dashboard/collaboration', label: 'Colaboração', icon: Users },
      { href: '/dashboard/workspace', label: 'Workspace', icon: Building2 },
    ],
  },
  {
    label: 'Administração',
    items: [
      { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3 },
      { href: '/dashboard/costs', label: 'Custos', icon: DollarSign },
      { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

const COLLAPSE_DELAY = 3000

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-collapse after inactivity
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    collapseTimer.current = setTimeout(() => {
      setCollapsed(true)
      setHovered(false)
    }, COLLAPSE_DELAY)
  }, [])

  // Start auto-collapse timer on mount
  useEffect(() => {
    resetCollapseTimer()
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current)
    }
  }, [resetCollapseTimer])

  const handleSidebarEnter = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setHovered(true)
  }

  const handleSidebarLeave = () => {
    setHovered(false)
    resetCollapseTimer()
  }

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev)
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    // If expanding manually, restart the timer
    if (collapsed) resetCollapseTimer()
  }

  // Effective expanded state: not collapsed OR hovering while collapsed
  const isExpanded = !collapsed || hovered

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center text-white animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: fixed 100vh, auto-collapse with hover expand */}
      <aside
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        className={`
          fixed inset-y-0 left-0 z-50 h-screen
          bg-sidebar border-r border-sidebar-border
          flex flex-col
          transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]
          ${isExpanded ? 'w-60' : 'w-15'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo area */}
        <div className={`flex items-center h-14 border-b border-sidebar-border shrink-0 ${isExpanded ? 'px-4 justify-between' : 'px-0 justify-center'}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center text-white shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <span
              className={`font-bold text-sm text-sidebar-foreground whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Studio Post
            </span>
          </Link>
          {/* Collapse toggle — only visible on desktop when expanded */}
          <button
            onClick={toggleCollapse}
            className={`hidden lg:flex items-center justify-center h-7 w-7 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 ${
              isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Expand button when collapsed — centered icon */}
        {!isExpanded && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center h-8 w-8 mx-auto mt-2 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200"
            title="Expandir sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className={`flex-1 py-2 overflow-y-auto overflow-x-hidden ${isExpanded ? 'px-2.5' : 'px-1.5'}`}>
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.label} className={sIdx > 0 ? 'mt-4' : ''}>
              {/* Section label — visible only when expanded */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? 'opacity-100 h-6 px-3 mb-1'
                    : 'opacity-0 h-0 px-0 mb-0'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {section.label}
                </span>
              </div>
              {/* Divider when collapsed — thin line separator */}
              {!isExpanded && sIdx > 0 && (
                <div className="mx-2 mb-2 border-t border-sidebar-border" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={!isExpanded ? item.label : undefined}
                      className={`
                        flex items-center gap-3 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${isExpanded ? 'px-3 py-2' : 'px-0 py-2 justify-center'}
                        ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
                        }
                      `}
                    >
                      <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      <span
                        className={`whitespace-nowrap transition-all duration-300 ${
                          isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className={`border-t border-sidebar-border shrink-0 ${isExpanded ? 'p-3' : 'p-1.5'}`}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-1">
                <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-white shrink-0">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">{user.displayName || 'Usuário'}</p>
                  <p className="text-xs truncate text-sidebar-foreground/50">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-white">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center h-8 w-8 rounded-md text-sidebar-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${collapsed && !hovered ? 'lg:ml-15' : 'lg:ml-60'}`}>
        {/* Mobile header */}
        <header className="h-14 border-b flex items-center px-4 lg:hidden bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-3">
            <div className="h-7 w-7 gradient-primary rounded-md flex items-center justify-center text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm">Studio Post</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
