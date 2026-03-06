'use client'

import { motion } from 'framer-motion'
import { Users, Lock, Trophy, AlertCircle } from 'lucide-react'
import { cn, expertiseToColor, formatDate } from '@/lib/utils'
import type { MissionSummary } from '@/lib/db/mission'

const cardVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
}

interface MissionCardProps {
  mission: MissionSummary
  index: number
  selected: boolean
  onClick: () => void
}

function getTimelineProgress(deadline: string): { pct: number; overdue: boolean; daysLeft: number } {
  const now = Date.now()
  const end = new Date(deadline).getTime()
  const overdue = now > end
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  // Show up to 30 days on the bar; anything beyond = full bar
  const totalMs = 30 * 24 * 60 * 60 * 1000
  const elapsed = now - (end - totalMs)
  const pct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100))
  return { pct, overdue, daysLeft }
}

export function MissionCard({ mission, index, selected, onClick }: MissionCardProps) {
  const progressPct = mission.itemCount > 0
    ? Math.round((mission.doneCount / mission.itemCount) * 100)
    : 0
  const isComplete = mission.itemCount > 0 && mission.doneCount === mission.itemCount
  const { pct: timelinePct, overdue, daysLeft } = getTimelineProgress(mission.deadline)

  const creatorColor = expertiseToColor(mission.creator.expertiseRoles[0] ?? 'dev')
  const creatorInitials = mission.creator.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.button
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3 transition-all duration-200',
        'hover:border-border/80 hover:bg-zinc-800/60',
        selected
          ? 'border-violet-500/50 bg-zinc-800/80 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]'
          : 'border-border bg-card',
        isComplete && 'border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
      )}
    >
      {/* Top row: title + visibility badge */}
      <div className="flex items-start gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold leading-snug truncate',
            isComplete ? 'text-amber-300' : 'text-foreground'
          )}>
            {isComplete && <Trophy className="inline w-3.5 h-3.5 mr-1 mb-0.5 text-amber-400" />}
            {mission.title}
          </p>
        </div>
        <span className={cn(
          'shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
          mission.visibility === 'team'
            ? 'bg-violet-500/15 text-violet-400'
            : 'bg-zinc-700/60 text-zinc-400'
        )}>
          {mission.visibility === 'team'
            ? <><Users className="w-2.5 h-2.5" /> Team</>
            : <><Lock className="w-2.5 h-2.5" /> Mine</>
          }
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">
            {mission.doneCount}/{mission.itemCount} done
          </span>
          <span className="text-[10px] text-muted-foreground">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isComplete ? 'bg-amber-400' : 'bg-violet-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mb-2.5">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              overdue ? 'bg-red-500' : timelinePct > 80 ? 'bg-orange-400' : 'bg-zinc-600'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${timelinePct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Bottom: creator avatar + deadline */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-muted shrink-0"
          style={{ boxShadow: `0 0 0 1.5px ${creatorColor}` }}
          title={mission.creator.name}
        >
          {mission.creator.avatarUrl ? (
            <img src={mission.creator.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            creatorInitials
          )}
        </div>
        <span className="text-[10px] text-muted-foreground truncate flex-1">
          {mission.creator.name}
        </span>
        <span className={cn(
          'text-[10px] shrink-0 flex items-center gap-1',
          overdue ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-muted-foreground/50'
        )}>
          {overdue
            ? <><AlertCircle className="w-2.5 h-2.5" /> Overdue</>
            : daysLeft === 0
              ? 'Today'
              : daysLeft === 1
                ? 'Tomorrow'
                : formatDate(mission.deadline)
          }
        </span>
      </div>
    </motion.button>
  )
}
