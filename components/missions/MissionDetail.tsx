'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Trophy, Users, Lock, Plus, Check, X, Search,
  AlertCircle, CheckCircle2, Clock, Zap
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { cn, expertiseToColor, formatDate } from '@/lib/utils'
import { TASK_TYPE_COLORS, TASK_TYPE_LABELS } from '@/lib/types'
import type { MissionWithItems, MissionItemWithTask } from '@/lib/db/mission'
import type { TaskWithRank } from '@/lib/types'

// ---- helpers ----

function isItemDone(item: MissionItemWithTask): boolean {
  if (item.taskId && item.task) return item.task.status === 'done'
  return item.done
}

function isMissionComplete(mission: MissionWithItems): boolean {
  if (mission.items.length === 0) return false
  return mission.items.every(isItemDone)
}

function isVictory(mission: MissionWithItems): boolean {
  return isMissionComplete(mission) && new Date() <= new Date(mission.deadline)
}

// ---- status badge ----

const STATUS_LABELS: Record<string, string> = {
  unassigned: 'Unassigned',
  in_progress: 'In Progress',
  in_review: 'In Review',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  unassigned: 'text-zinc-400 bg-zinc-800',
  in_progress: 'text-blue-400 bg-blue-500/15',
  in_review: 'text-violet-400 bg-violet-500/15',
  blocked: 'text-red-400 bg-red-500/15',
  done: 'text-emerald-400 bg-emerald-500/15',
  cancelled: 'text-zinc-500 bg-zinc-800',
}

// ---- fetchers ----

async function fetchMission(id: string): Promise<MissionWithItems> {
  const res = await fetch(`/api/missions/${id}`)
  if (!res.ok) throw new Error('Failed to fetch mission')
  return res.json()
}

async function fetchStackTasks(): Promise<TaskWithRank[]> {
  const res = await fetch('/api/stack')
  if (!res.ok) throw new Error('Failed to fetch stack')
  return res.json()
}

// ---- sub-components ----

function LinkedTaskItem({ item }: { item: MissionItemWithTask }) {
  if (!item.task) return null
  const color = TASK_TYPE_COLORS[item.task.type]
  const done = item.task.status === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex items-center gap-3 rounded-lg border overflow-hidden pl-3 pr-3 py-2.5',
        done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-zinc-900/60'
      )}
    >
      {/* type bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: color }} />
      <div className={cn(
        'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
        done ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-600'
      )}>
        {done && <Check className="w-2.5 h-2.5 text-emerald-400" />}
      </div>
      <span
        className="text-[10px] font-semibold uppercase px-1 py-0.5 rounded shrink-0"
        style={{ color, backgroundColor: `${color}20` }}
      >
        {TASK_TYPE_LABELS[item.task.type]}
      </span>
      <p className={cn(
        'text-sm flex-1 truncate',
        done ? 'line-through text-muted-foreground' : 'text-foreground'
      )}>
        {item.task.title}
      </p>
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0', STATUS_COLORS[item.task.status])}>
        {STATUS_LABELS[item.task.status]}
      </span>
    </motion.div>
  )
}

function StandaloneTargetItem({
  item,
  missionId,
  onToggle,
}: {
  item: MissionItemWithTask
  missionId: string
  onToggle: () => void
}) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    try {
      await fetch(`/api/missions/${missionId}/items/${item.id}`, { method: 'PATCH' })
      onToggle()
    } finally {
      setToggling(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg border border-border bg-zinc-900/40 px-3 py-2.5"
    >
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={cn(
          'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all',
          item.done
            ? 'border-violet-500 bg-violet-500/20'
            : 'border-zinc-600 hover:border-zinc-400'
        )}
      >
        {toggling
          ? <span className="w-2 h-2 border border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
          : item.done && <Check className="w-2.5 h-2.5 text-violet-400" />
        }
      </button>
      <p className={cn(
        'text-sm flex-1',
        item.done ? 'line-through text-muted-foreground' : 'text-foreground'
      )}>
        {item.targetText}
      </p>
    </motion.div>
  )
}

// ---- add item panel ----

function AddItemPanel({
  missionId,
  onAdded,
}: {
  missionId: string
  onAdded: () => void
}) {
  const [mode, setMode] = useState<'target' | 'task'>('target')
  const [targetText, setTargetText] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: stackTasks } = useQuery({
    queryKey: ['stack'],
    queryFn: fetchStackTasks,
    enabled: mode === 'task',
    staleTime: 30_000,
  })

  const filteredTasks = (stackTasks ?? []).filter((t) =>
    taskSearch === '' || t.title.toLowerCase().includes(taskSearch.toLowerCase())
  )

  async function handleAddTarget() {
    if (!targetText.trim()) return
    setAdding(true)
    try {
      await fetch(`/api/missions/${missionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetText: targetText.trim() }),
      })
      setTargetText('')
      onAdded()
    } finally {
      setAdding(false)
    }
  }

  async function handleLinkTask(taskId: string) {
    setAdding(true)
    try {
      await fetch(`/api/missions/${missionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      setTaskSearch('')
      onAdded()
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="border border-dashed border-zinc-700 rounded-xl p-3">
      {/* Mode toggle */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setMode('target')}
          className={cn(
            'flex-1 py-1 rounded-md text-xs font-medium transition-colors',
            mode === 'target' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-400'
          )}
        >
          Add Target
        </button>
        <button
          onClick={() => setMode('task')}
          className={cn(
            'flex-1 py-1 rounded-md text-xs font-medium transition-colors',
            mode === 'task' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-400'
          )}
        >
          Link Task
        </button>
      </div>

      {mode === 'target' ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTarget()}
            placeholder="Describe a target…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={handleAddTarget}
            disabled={!targetText.trim() || adding}
            className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-40 transition-colors text-sm font-medium"
          >
            {adding ? (
              <span className="w-3.5 h-3.5 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin inline-block" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
        <div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-zinc-600 py-2 text-center">No tasks found</p>
            ) : (
              filteredTasks.slice(0, 12).map((task) => {
                const color = TASK_TYPE_COLORS[task.type]
                return (
                  <button
                    key={task.id}
                    onClick={() => handleLinkTask(task.id)}
                    disabled={adding}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
                  >
                    <span
                      className="text-[9px] font-bold uppercase px-1 py-0.5 rounded shrink-0"
                      style={{ color, backgroundColor: `${color}20` }}
                    >
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                    <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">#{task.globalRank}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- main component ----

interface MissionDetailProps {
  missionId: string
}

export function MissionDetail({ missionId }: MissionDetailProps) {
  const queryClient = useQueryClient()
  const [showAddItem, setShowAddItem] = useState(false)
  const prevCompleteRef = useRef(false)

  const { data: mission, isLoading, isError } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: () => fetchMission(missionId),
    refetchInterval: 10_000,
  })

  // Fire confetti on victory transition
  useEffect(() => {
    if (!mission) return
    const complete = isMissionComplete(mission)
    if (complete && !prevCompleteRef.current && isVictory(mission)) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#F59E0B', '#FCD34D', '#FBBF24'] })
    }
    prevCompleteRef.current = complete
  }, [mission])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mission', missionId] })
    queryClient.invalidateQueries({ queryKey: ['missions'] })
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-4 p-6 animate-pulse">
        <div className="h-7 bg-zinc-800 rounded w-2/3" />
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-px bg-zinc-800 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-zinc-800 rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError || !mission) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-red-400">Failed to load mission.</p>
      </div>
    )
  }

  const complete = isMissionComplete(mission)
  const victory = isVictory(mission)
  const overdue = !complete && new Date() > new Date(mission.deadline)
  const creatorColor = expertiseToColor(mission.creator.expertiseRoles[0] ?? 'dev')
  const creatorInitials = mission.creator.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const linkedItems = mission.items.filter((i) => i.taskId)
  const standaloneItems = mission.items.filter((i) => !i.taskId)

  return (
    <motion.div
      key={missionId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'h-full flex flex-col overflow-hidden rounded-xl border',
        victory
          ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.12)]'
          : 'border-border'
      )}
    >
      {/* Victory banner */}
      <AnimatePresence>
        {victory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Mission Complete!</span>
            <span className="text-xs text-amber-400/70 ml-1">Delivered before deadline.</span>
          </motion.div>
        )}
        {overdue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/8 border-b border-red-500/20 px-5 py-2 flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400/70" />
            <span className="text-xs text-red-400/70">Past deadline — keep pushing.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className={cn(
              'text-lg font-bold leading-snug',
              victory ? 'text-amber-300' : 'text-foreground'
            )}>
              {mission.title}
            </h2>
            {mission.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{mission.description}</p>
            )}
          </div>
          <span className={cn(
            'shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mt-0.5',
            mission.visibility === 'team'
              ? 'bg-violet-500/15 text-violet-400'
              : 'bg-zinc-700/60 text-zinc-400'
          )}>
            {mission.visibility === 'team'
              ? <><Users className="w-3 h-3" /> Team</>
              : <><Lock className="w-3 h-3" /> Personal</>
            }
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Creator */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-muted shrink-0"
              style={{ boxShadow: `0 0 0 1.5px ${creatorColor}` }}
            >
              {mission.creator.avatarUrl ? (
                <img src={mission.creator.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : creatorInitials}
            </div>
            <span className="text-xs text-muted-foreground">{mission.creator.name}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className={cn(
              overdue ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {formatDate(mission.deadline)}
            </span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1 text-xs ml-auto">
            <CheckCircle2 className={cn('w-3.5 h-3.5', complete ? 'text-emerald-400' : 'text-zinc-500')} />
            <span className={complete ? 'text-emerald-400' : 'text-muted-foreground'}>
              {mission.items.filter(isItemDone).length}/{mission.items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {/* Linked tasks section */}
        {linkedItems.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Linked Tasks
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {linkedItems.map((item) => (
                  <LinkedTaskItem key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Standalone targets section */}
        {standaloneItems.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Targets
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {standaloneItems.map((item) => (
                  <StandaloneTargetItem key={item.id} item={item} missionId={missionId} onToggle={invalidate} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {mission.items.length === 0 && !showAddItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-10 text-center"
          >
            <p className="text-3xl">🎯</p>
            <p className="text-sm font-medium text-zinc-400">No items yet</p>
            <p className="text-xs text-zinc-600">Add targets or link tasks from the stack.</p>
          </motion.div>
        )}

        {/* Add item panel */}
        <AnimatePresence>
          {showAddItem && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              <AddItemPanel
                missionId={missionId}
                onAdded={() => {
                  invalidate()
                  setShowAddItem(false)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50">
        <button
          onClick={() => setShowAddItem((v) => !v)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
            showAddItem
              ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
              : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20'
          )}
        >
          {showAddItem
            ? <><X className="w-4 h-4" /> Cancel</>
            : <><Plus className="w-4 h-4" /> Add Item</>
          }
        </button>
      </div>
    </motion.div>
  )
}
