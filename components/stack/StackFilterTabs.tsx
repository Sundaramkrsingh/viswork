'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TASK_TYPE_COLORS, TASK_TYPE_LABELS, ALL_TASK_TYPES } from '@/lib/types'
import type { TaskType, TaskWithRank } from '@/lib/types'

interface StackFilterTabsProps {
  tasks: TaskWithRank[]
  activeFilter: TaskType | 'all'
  onFilterChange: (filter: TaskType | 'all') => void
}

export function StackFilterTabs({ tasks, activeFilter, onFilterChange }: StackFilterTabsProps) {
  const totalCount = tasks.length

  // Count per type — only show types that have tasks
  const typeCounts = ALL_TASK_TYPES.reduce((acc, type) => {
    acc[type] = tasks.filter((t) => t.type === type).length
    return acc
  }, {} as Record<TaskType, number>)

  const activeTypes = ALL_TASK_TYPES.filter((t) => typeCounts[t] > 0)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* All tab */}
      <TabPill
        label="All"
        count={totalCount}
        isActive={activeFilter === 'all'}
        color={undefined}
        onClick={() => onFilterChange('all')}
      />

      {/* Per-type tabs */}
      {activeTypes.map((type) => (
        <TabPill
          key={type}
          label={TASK_TYPE_LABELS[type]}
          count={typeCounts[type]}
          isActive={activeFilter === type}
          color={TASK_TYPE_COLORS[type]}
          onClick={() => onFilterChange(type)}
        />
      ))}
    </div>
  )
}

interface TabPillProps {
  label: string
  count: number
  isActive: boolean
  color: string | undefined
  onClick: () => void
}

function TabPill({ label, count, isActive, color, onClick }: TabPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {/* Active background */}
      {isActive && (
        <motion.div
          layoutId="stack-filter-active"
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: color ? `${color}18` : 'hsl(var(--accent))',
            border: `1px solid ${color ? `${color}40` : 'hsl(var(--border))'}`,
          }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
        />
      )}

      {/* Color dot */}
      {color && (
        <span
          className="relative w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}

      <span className="relative">{label}</span>

      <span
        className={cn(
          'relative text-[10px] font-mono tabular-nums',
          isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'
        )}
      >
        {count}
      </span>
    </button>
  )
}
