'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Layers } from 'lucide-react'
import { TaskCard } from '@/components/task-card/TaskCard'
import { StackFilterTabs } from './StackFilterTabs'
import type { TaskWithRank, TaskType } from '@/lib/types'

async function fetchStack(): Promise<TaskWithRank[]> {
  const res = await fetch('/api/stack')
  if (!res.ok) throw new Error('Failed to fetch stack')
  return res.json()
}

export function StackList() {
  const [activeFilter, setActiveFilter] = useState<TaskType | 'all'>('all')

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['stack'],
    queryFn: fetchStack,
    refetchInterval: 30_000,
  })

  const filtered = useMemo(
    () => (activeFilter === 'all' ? tasks : tasks.filter((t) => t.type === activeFilter)),
    [tasks, activeFilter]
  )

  if (isLoading) return <StackSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <span className="text-2xl">⚠️</span>
        <p className="text-sm">Failed to load stack. Check the console.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <StackFilterTabs
        tasks={tasks}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Stack count */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs text-muted-foreground">
          {activeFilter === 'all'
            ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} in queue`
            : `${filtered.length} of ${tasks.length} shown`}
        </span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState filter={activeFilter} />
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((task, i) => (
              <motion.div
                key={task.id}
                layout
                exit={{ opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.2 } }}
              >
                <TaskCard task={task} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function EmptyState({ filter }: { filter: TaskType | 'all' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-48 gap-3 rounded-xl border border-dashed border-border text-muted-foreground"
    >
      <Layers className="w-8 h-8 opacity-30" />
      <p className="text-sm">
        {filter === 'all' ? 'Stack is empty.' : `No ${filter} tasks in the queue.`}
      </p>
    </motion.div>
  )
}

function StackSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[90px] rounded-xl border border-border bg-card animate-pulse"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  )
}
