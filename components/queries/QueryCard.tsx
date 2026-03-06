'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, MessageCircle, CheckCircle2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn, expertiseToColor, formatAge } from '@/lib/utils'
import { TASK_TYPE_COLORS, TASK_TYPE_LABELS } from '@/lib/types'
import type { QueryWithContext } from '@/lib/db/query'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
}

interface QueryCardProps {
  query: QueryWithContext
  index: number
}

export function QueryCard({ query, index }: QueryCardProps) {
  const [resolving, setResolving] = useState(false)
  const queryClient = useQueryClient()
  const typeColor = TASK_TYPE_COLORS[query.task.type]
  const raisedByColor = expertiseToColor(query.raisedBy.expertiseRoles[0] ?? 'dev')
  const initials = query.raisedBy.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleResolve() {
    setResolving(true)
    try {
      await fetch(`/api/queries/${query.id}`, { method: 'PATCH' })
      queryClient.invalidateQueries({ queryKey: ['queries'] })
    } catch {
      setResolving(false)
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
      className={cn(
        'relative rounded-xl border bg-card overflow-hidden',
        query.blocking
          ? 'border-red-500/30 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]'
          : 'border-border'
      )}
    >
      {/* Left accent bar — red for blocking, muted for non-blocking */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl',
          query.blocking ? 'bg-red-500' : 'bg-border'
        )}
      />

      <div className="pl-4 pr-3 py-3.5">
        {/* Top row: blocking badge + task pill + age */}
        <div className="flex items-center gap-2 mb-2.5">
          {query.blocking ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-red-500/15 text-red-400">
              <AlertCircle className="w-3 h-3" />
              Blocking
            </span>
          ) : (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              Query
            </span>
          )}

          {/* Task type pill */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 truncate max-w-[120px]"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
            title={query.task.title}
          >
            {TASK_TYPE_LABELS[query.task.type]} · {query.task.title.length > 20
              ? query.task.title.slice(0, 20) + '…'
              : query.task.title}
          </span>

          <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">
            {formatAge(query.createdAt)} ago
          </span>
        </div>

        {/* Query text */}
        <p className="text-sm text-foreground leading-snug mb-3">
          {query.text}
        </p>

        {/* Bottom row: raiser avatar + resolve button */}
        <div className="flex items-center gap-2">
          {/* Raiser avatar */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold bg-muted text-foreground shrink-0"
            style={{ boxShadow: `0 0 0 2px ${raisedByColor}` }}
            title={query.raisedBy.name}
          >
            {query.raisedBy.avatarUrl ? (
              <img
                src={query.raisedBy.avatarUrl}
                alt={query.raisedBy.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {query.raisedBy.name}
          </span>

          <button
            onClick={handleResolve}
            disabled={resolving}
            className={cn(
              'ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors',
              'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {resolving ? (
              <span className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Resolve
          </button>
        </div>
      </div>
    </motion.div>
  )
}
