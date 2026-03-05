'use client'

import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { AlertCircle, Flame, Link2, Signal } from 'lucide-react'
import { cn, expertiseToColor, formatAge } from '@/lib/utils'
import { TASK_TYPE_COLORS, TASK_TYPE_LABELS, TASK_WEIGHT_DOTS } from '@/lib/types'
import { heatVariants } from '@/lib/heat'
import type { TaskWithRank } from '@/lib/types'
import type { TeamMember } from '@/lib/types'

const hotTransition: Transition = {
  repeat: Infinity,
  duration: 2,
  ease: 'easeInOut' as const,
}

interface TaskCardProps {
  task: TaskWithRank & { assignee?: TeamMember }
  index: number
  onClick?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  unassigned: 'Unassigned',
  in_progress: 'In Progress',
  in_review: 'In Review',
  blocked: 'Blocked',
}

const STATUS_COLORS: Record<string, string> = {
  unassigned: 'text-muted-foreground',
  in_progress: 'text-blue-400',
  in_review: 'text-purple-400',
  blocked: 'text-red-400',
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
}

function SignalBars({ score }: { score: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={cn(
            'w-1 rounded-sm transition-colors',
            level <= score ? 'bg-emerald-400' : 'bg-muted'
          )}
          style={{ height: `${level * 3 + 2}px` }}
        />
      ))}
    </div>
  )
}

function WeightDots({ weight }: { weight: string | null | undefined }) {
  if (!weight) return null
  const count = TASK_WEIGHT_DOTS[weight as keyof typeof TASK_WEIGHT_DOTS] ?? 0
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            i < count ? 'bg-muted-foreground' : 'bg-border'
          )}
        />
      ))}
    </div>
  )
}

function AssigneeAvatar({ member }: { member: TeamMember }) {
  const ringColor = expertiseToColor(member.expertiseRoles[0] ?? 'dev')
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const availabilityPulse =
    member.availability === 'flow_state'
      ? 'animate-pulse'
      : ''

  return (
    <div
      className={cn('relative shrink-0', availabilityPulse)}
      title={`${member.name} — ${member.availability.replace('_', ' ')}`}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-muted text-foreground"
        style={{ boxShadow: `0 0 0 2px ${ringColor}` }}
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {/* Availability dot */}
      <div
        className={cn(
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
          member.availability === 'available' && 'bg-emerald-400',
          member.availability === 'in_progress' && 'bg-blue-400',
          member.availability === 'in_review' && 'bg-purple-400',
          member.availability === 'flow_state' && 'bg-amber-400',
          member.availability === 'away' && 'bg-zinc-500'
        )}
      />
    </div>
  )
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const typeColor = TASK_TYPE_COLORS[task.type]
  const isHot = task.heat === 'hot'

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={isHot ? { ...heatVariants.hot, opacity: 1, y: 0 } : 'visible'}
      custom={index}
      {...(isHot ? { transition: hotTransition } : {})}
      whileHover={{ scale: 1.005, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.998 }}
      className={cn(
        'relative rounded-xl border border-border bg-card cursor-pointer overflow-hidden',
        'hover:border-border/80 transition-colors',
        task.heat === 'warm' && 'shadow-[0_0_0_1px_rgba(245,158,11,0.4)]'
      )}
      onClick={onClick}
    >
      {/* Type color left bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: typeColor }}
      />

      <div className="pl-4 pr-3 py-3">
        {/* Top row: rank + type badge + status + heat icon */}
        <div className="flex items-center gap-2 mb-2">
          {/* Global rank */}
          <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
            #{task.globalRank}
          </span>

          {/* Type badge */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            {TASK_TYPE_LABELS[task.type]}
          </span>

          {/* Blocking query indicator */}
          {task.hasBlockingQuery && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
              <AlertCircle className="w-3 h-3" />
              Blocked
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Heat icon */}
            {task.heat !== 'cool' && (
              <Flame
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  task.heat === 'hot' ? 'text-red-400' : 'text-amber-400'
                )}
              />
            )}

            {/* Status */}
            <span className={cn('text-[11px] font-medium', STATUS_COLORS[task.status])}>
              {STATUS_LABELS[task.status] ?? task.status}
            </span>
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-foreground leading-snug mb-2.5 pr-1">
          {task.title}
        </p>

        {/* Bottom row: weight + signal + links + age + assignee */}
        <div className="flex items-center gap-3">
          <WeightDots weight={task.weight} />

          <div className="flex items-center gap-1">
            <Signal className="w-3 h-3 text-muted-foreground/50" />
            <SignalBars score={task.signalScore} />
          </div>

          {task.links.length > 0 && (
            <div className="flex items-center gap-0.5 text-muted-foreground/50">
              <Link2 className="w-3 h-3" />
              <span className="text-[10px]">{task.links.length}</span>
            </div>
          )}

          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {formatAge(task.createdAt)}
          </span>

          {task.assignee && (
            <AssigneeAvatar member={task.assignee} />
          )}
        </div>
      </div>
    </motion.div>
  )
}
