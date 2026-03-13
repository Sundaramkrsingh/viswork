'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Layers,
  Users,
  MessageSquare,
  Target,
  Archive,
  LogOut,
} from 'lucide-react'
import { cn, expertiseToColor } from '@/lib/utils'
import { useSSE } from '@/hooks/useSSE'

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
  const { data: session, status } = useSession()
  useSSE()

  // Client-side watchdog: sign out whenever the session is clearly invalid.
  // This covers: expired JWT, user deleted (RefreshAccessTokenError from the jwt callback),
  // and any other case where the session ends up without a user id.
  useEffect(() => {
    if (status === 'unauthenticated') {
      signOut({ callbackUrl: '/login' })
      return
    }
    if (status === 'authenticated' && (!session?.user?.id || session?.error === 'RefreshAccessTokenError')) {
      signOut({ callbackUrl: '/login' })
    }
  }, [status, session])

  const userName = session?.user?.name ?? session?.user?.email ?? 'You'
  const userImage = session?.user?.image
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
        <div className="border-t border-border p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-[11px] font-semibold overflow-hidden">
              {userImage ? (
                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate flex-1">{userName}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign out</span>
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
