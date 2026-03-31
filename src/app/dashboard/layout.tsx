'use client'

import { useEffect } from 'react'
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
  X,
  Palette,
  LayoutTemplate,
  Building2,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/generate', label: 'Gerar Criativos', icon: Wand2 },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
  { href: '/dashboard/brand-kits', label: 'Brand Kits', icon: Palette },
  { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/dashboard/costs', label: 'Custos', icon: DollarSign },
  { href: '/dashboard/workspace', label: 'Workspace', icon: Building2 },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold">Studio Post</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 border-b flex items-center px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">Studio Post</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
