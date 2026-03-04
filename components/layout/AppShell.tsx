'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Layers,
  Users,
  MessageSquare,
  Target,
  Archive,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/stack',
    label: 'Stack',
    icon: Layers,
    description: 'Master task queue',
  },
  {
    href: '/team',
    label: 'Team',
    icon: Users,
    description: 'Who is doing what',
  },
  {
    href: '/queries',
    label: 'Queries',
    icon: MessageSquare,
    description: 'Blockers & questions',
  },
  {
    href: '/missions',
    label: 'Missions',
    icon: Target,
    description: 'Goal stacks',
  },
  {
    href: '/graveyard',
    label: 'Graveyard',
    icon: Archive,
    description: 'Cancelled tasks',
  },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-foreground">
              Viswork
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/stack'
                ? pathname === '/' || pathname.startsWith('/stack')
                : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User area */}
        <div className="border-t border-border p-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium truncate">You</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  )
}
