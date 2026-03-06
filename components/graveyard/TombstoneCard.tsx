'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn, expertiseToColor, formatDate, formatAge } from '@/lib/utils'
import { TASK_TYPE_COLORS, TASK_TYPE_LABELS } from '@/lib/types'
import type { CancelledTask } from '@/lib/db/task'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
  exit: { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.25 } },
}

interface TombstoneCardProps {
  task: CancelledTask
  index: number
}

export function TombstoneCard({ task, index }: TombstoneCardProps) {
  const [resurrecting, setResurrecting] = useState(false)
  const queryClient = useQueryClient()

  // Muted version of type color for the desaturated aesthetic
  const typeColor = TASK_TYPE_COLORS[task.type]

  const assigneeInitials = task.assignee?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const assigneeRingColor = task.assignee
    ? expertiseToColor(task.assignee.expertiseRoles[0] ?? 'dev')
    : null

  async function handleResurrect() {
    setResurrecting(true)
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unassigned' }),
      })
      queryClient.invalidateQueries({ queryKey: ['graveyard'] })
      queryClient.invalidateQueries({ queryKey: ['stack'] })
    } catch {
      setResurrecting(false)
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
      className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden group"
    >
      {/* Left bar — desaturated type color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl opacity-30"
        style={{ backgroundColor: typeColor }}
      />

      <div className="pl-4 pr-3 py-3.5">
        {/* Top row */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider opacity-40"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            {TASK_TYPE_LABELS[task.type]}
          </span>

          {task.cancelledAt && (
            <span className="text-[10px] text-zinc-600 ml-auto">
              {formatDate(task.cancelledAt)}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-zinc-400 leading-snug mb-2 line-through decoration-zinc-600">
          {task.title}
        </p>

        {/* Cancel reason */}
        {task.cancelReason && (
          <p className="text-[11px] text-zinc-600 mb-2.5 italic">
            "{task.cancelReason}"
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center gap-2">
          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold bg-zinc-800 text-zinc-400 shrink-0 opacity-50"
                style={{ boxShadow: `0 0 0 1.5px ${assigneeRingColor}60` }}
                title={task.assignee.name}
              >
                {task.assignee.avatarUrl ? (
                  <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  assigneeInitials
                )}
              </div>
              <span className="text-[10px] text-zinc-600">{task.assignee.name}</span>
            </div>
          )}

          {task.createdAt && (
            <span className="text-[10px] text-zinc-700 ml-auto">
              aged {formatAge(task.createdAt)}
            </span>
          )}

          {/* Resurrect button — visible on hover */}
          <button
            onClick={handleResurrect}
            disabled={resurrecting}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
              'opacity-0 group-hover:opacity-100',
              'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {resurrecting ? (
              <span className="w-3 h-3 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            Resurrect
          </button>
        </div>
      </div>
    </motion.div>
  )
}
