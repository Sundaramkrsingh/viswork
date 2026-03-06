'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Skull } from 'lucide-react'
import { TombstoneCard } from '@/components/graveyard/TombstoneCard'
import { cn } from '@/lib/utils'
import { ALL_TASK_TYPES, TASK_TYPE_COLORS, TASK_TYPE_LABELS } from '@/lib/types'
import type { CancelledTask } from '@/lib/db/task'
import type { TaskType } from '@/lib/types'

async function fetchGraveyard(): Promise<CancelledTask[]> {
  const res = await fetch('/api/graveyard')
  if (!res.ok) throw new Error('Failed to fetch graveyard')
  return res.json()
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 bg-zinc-800 rounded w-14" />
        <div className="h-3 bg-zinc-800 rounded w-20 ml-auto" />
      </div>
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  )
}

export default function GraveyardPage() {
  const [filter, setFilter] = useState<TaskType | 'all'>('all')

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['graveyard'],
    queryFn: fetchGraveyard,
  })

  const filtered = tasks
    ? filter === 'all' ? tasks : tasks.filter((t) => t.type === filter)
    : []

  // Only show type filters that have cancelled tasks
  const typesWithTasks = tasks
    ? ALL_TASK_TYPES.filter((t) => tasks.some((task) => task.type === t))
    : []

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="px-8 py-6 flex flex-col gap-6 max-w-4xl w-full mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Skull className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-300">Graveyard</h1>
            {tasks && (
              <p className="text-xs text-zinc-600">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} cancelled
              </p>
            )}
          </div>
        </motion.div>

        {/* Type filter pills */}
        {tasks && typesWithTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                filter === 'all'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-400 border border-zinc-800'
              )}
            >
              All ({tasks.length})
            </button>
            {typesWithTasks.map((type) => {
              const count = tasks.filter((t) => t.type === type).length
              const color = TASK_TYPE_COLORS[type]
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                    filter === type
                      ? 'text-zinc-200 border-transparent'
                      : 'bg-zinc-900 text-zinc-500 hover:text-zinc-400 border-zinc-800'
                  )}
                  style={filter === type ? { backgroundColor: `${color}25`, borderColor: `${color}40`, color } : {}}
                >
                  {TASK_TYPE_LABELS[type]} ({count})
                </button>
              )
            })}
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-sm text-red-400">Failed to load graveyard.</p>
        )}

        {/* Cards */}
        {tasks && filtered.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((task, i) => (
                <TombstoneCard key={task.id} task={task} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state */}
        {tasks && tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-20 text-center"
          >
            <p className="text-5xl">🌱</p>
            <p className="text-sm font-medium text-zinc-400">No casualties</p>
            <p className="text-xs text-zinc-600 max-w-xs">
              All tasks are alive. Keep it that way.
            </p>
          </motion.div>
        )}

        {/* Filtered empty */}
        {tasks && tasks.length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <p className="text-xs text-zinc-600">No cancelled {filter} tasks.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
