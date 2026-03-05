'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Timer, Zap, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { cn, expertiseToColor } from '@/lib/utils'
import { TASK_TYPE_COLORS } from '@/lib/types'
import type { AvailabilityStatus, TeamMemberWithTask } from '@/lib/types'

// ---- Availability config ----
const AVAIL_CONFIG: Record<AvailabilityStatus, { label: string; color: string; dotClass: string }> = {
  available:   { label: 'Available',   color: 'text-emerald-400', dotClass: 'bg-emerald-400' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',    dotClass: 'bg-blue-400'    },
  in_review:   { label: 'In Review',   color: 'text-purple-400',  dotClass: 'bg-purple-400'  },
  flow_state:  { label: 'Flow State',  color: 'text-amber-400',   dotClass: 'bg-amber-400'   },
  away:        { label: 'Away',        color: 'text-zinc-500',    dotClass: 'bg-zinc-500'    },
}

const ALL_STATUSES: AvailabilityStatus[] = ['available', 'in_progress', 'in_review', 'flow_state', 'away']

const FLOW_DURATIONS = [
  { label: '25 min', minutes: 25 },
  { label: '50 min', minutes: 50 },
  { label: '90 min', minutes: 90 },
]

// ---- Countdown ----
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function useCountdown(endsAt: Date | string | null | undefined) {
  const [ms, setMs] = useState<number | null>(null)

  useEffect(() => {
    if (!endsAt) { setMs(null); return }
    const end = new Date(endsAt).getTime()
    const tick = () => setMs(end - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return ms
}

// ---- Avatar ----
function MemberAvatar({ member }: { member: TeamMemberWithTask }) {
  const ringColor = expertiseToColor(member.expertiseRoles[0] ?? 'dev')
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const isFlowing = member.availability === 'flow_state'
  const { dotClass } = AVAIL_CONFIG[member.availability]

  return (
    <div className="relative shrink-0">
      {isFlowing && (
        <motion.div
          className="absolute inset-0 rounded-full z-0"
          animate={{
            boxShadow: [
              '0 0 0 0px rgba(251,191,36,0.7)',
              '0 0 0 12px rgba(251,191,36,0)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
        />
      )}
      <div
        className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold bg-muted text-foreground"
        style={{ boxShadow: `0 0 0 2.5px ${ringColor}` }}
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : initials}
      </div>
      <div
        className={cn(
          'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card z-20',
          dotClass
        )}
      />
    </div>
  )
}

// ---- Availability menu ----
const menuVariants = {
  hidden: { opacity: 0, y: -4, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.13 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } },
}

interface AvailMenuProps {
  memberId: string
  current: AvailabilityStatus
  flowStateEndsAt?: Date | string | null
  onClose: () => void
}

function AvailabilityMenu({ memberId, current, flowStateEndsAt, onClose }: AvailMenuProps) {
  const [step, setStep] = useState<'status' | 'timer'>('status')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { availability: AvailabilityStatus; flowStateEndsAt?: string | null }) =>
      fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onClose()
    },
  })

  if (step === 'timer') {
    return (
      <div className="p-1.5">
        <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Zap className="w-3 h-3" />
          Flow State Duration
        </div>
        {FLOW_DURATIONS.map(({ label, minutes }) => (
          <button
            key={minutes}
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                availability: 'flow_state',
                flowStateEndsAt: new Date(Date.now() + minutes * 60_000).toISOString(),
              })
            }
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            {label}
          </button>
        ))}
        <button
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ availability: 'flow_state', flowStateEndsAt: null })}
          className="flex items-center gap-2.5 w-full px-3 py-2 mt-1 rounded-lg text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors border-t border-border pt-2"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          No limit
        </button>
        <button
          onClick={() => setStep('status')}
          className="flex items-center gap-1 w-full px-3 py-1.5 rounded-lg text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="p-1.5">
      {ALL_STATUSES.map((status) => {
        const cfg = AVAIL_CONFIG[status]
        const isCurrent = current === status
        return (
          <button
            key={status}
            disabled={mutation.isPending}
            onClick={() => {
              if (status === 'flow_state') {
                setStep('timer')
              } else {
                mutation.mutate({ availability: status, flowStateEndsAt: null })
              }
            }}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors',
              isCurrent
                ? 'bg-muted/60 text-foreground'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full shrink-0', cfg.dotClass)} />
            <span className="flex-1 text-left">{cfg.label}</span>
            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-foreground/40" />}
            {status === 'flow_state' && !isCurrent && (
              <Timer className="w-3.5 h-3.5 text-muted-foreground/40" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---- Card ----
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
}

interface MemberCardProps {
  member: TeamMemberWithTask
  index?: number
}

export function MemberCard({ member, index = 0 }: MemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const countdown = useCountdown(
    member.availability === 'flow_state' ? member.flowStateEndsAt : null
  )

  const avConfig = AVAIL_CONFIG[member.availability]

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4"
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-4">
        <MemberAvatar member={member} />
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-base font-semibold text-foreground truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>

      {/* Expertise tags */}
      {member.expertiseRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {member.expertiseRoles.map((tag, i) => {
            const color = expertiseToColor(tag)
            return (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={
                  i === 0
                    ? { backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }
                    : { color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }
                }
              >
                {tag}
              </span>
            )
          })}
        </div>
      )}

      {/* Availability badge + menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2 text-sm font-medium w-full transition-opacity hover:opacity-75',
            avConfig.color
          )}
        >
          <div className={cn('w-2 h-2 rounded-full shrink-0', avConfig.dotClass)} />
          <span>{avConfig.label}</span>
          {member.availability === 'flow_state' && countdown !== null && countdown > 0 && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {formatCountdown(countdown)}
            </span>
          )}
          {member.availability === 'flow_state' && (!member.flowStateEndsAt || countdown !== null && countdown <= 0) && (
            <span className="ml-auto text-xs text-muted-foreground">∞</span>
          )}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="menu"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute bottom-full left-0 mb-2 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <AvailabilityMenu
                memberId={member.id}
                current={member.availability}
                flowStateEndsAt={member.flowStateEndsAt}
                onClose={() => setMenuOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current task */}
      {member.currentTask && (
        <div className="pt-1 border-t border-border">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: TASK_TYPE_COLORS[member.currentTask.type] }}
            />
            <p className="text-xs text-muted-foreground truncate flex-1">{member.currentTask.title}</p>
            <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          </div>
        </div>
      )}
    </motion.div>
  )
}
