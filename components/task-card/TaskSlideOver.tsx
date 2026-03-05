'use client'

import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  ExternalLink,
  AlertCircle,
  CheckSquare,
  Flame,
  Clock,
  Signal,
} from 'lucide-react'
import { cn, expertiseToColor, formatAge, formatDate } from '@/lib/utils'
import { heatVariants } from '@/lib/heat'
import {
  TASK_TYPE_COLORS,
  TASK_TYPE_LABELS,
  TASK_WEIGHT_LABELS,
} from '@/lib/types'
import type { TaskWithRank, TeamMember, Query } from '@/lib/types'

// ---- Types ----
type TaskDetail = TaskWithRank & {
  assignee?: TeamMember
  queries: (Query & { raisedBy: TeamMember })[]
}

// ---- Fetchers ----
async function fetchTaskDetail(id: string): Promise<TaskDetail> {
  const res = await fetch(`/api/tasks/${id}`)
  if (!res.ok) throw new Error('Failed to fetch task')
  return res.json()
}

async function fetchMembers(): Promise<TeamMember[]> {
  const res = await fetch('/api/members')
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

// ---- Animation variants ----
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 32 } },
  exit: { x: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as [number, number, number, number] } },
}

// ---- Sub-components ----
function MemberAvatar({ member, size = 'sm' }: { member: TeamMember; size?: 'sm' | 'md' }) {
  const ringColor = expertiseToColor(member.expertiseRoles[0] ?? 'dev')
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const dim = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'

  return (
    <div className="relative shrink-0">
      <div
        className={cn('rounded-full flex items-center justify-center font-semibold bg-muted text-foreground', dim)}
        style={{ boxShadow: `0 0 0 2px ${ringColor}` }}
      >
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
        ) : initials}
      </div>
      <div
        className={cn(
          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
          member.availability === 'available' && 'bg-emerald-400',
          member.availability === 'in_progress' && 'bg-blue-400',
          member.availability === 'in_review' && 'bg-purple-400',
          member.availability === 'flow_state' && 'bg-amber-400',
          member.availability === 'away' && 'bg-zinc-500',
        )}
      />
    </div>
  )
}

function SignalBars({ score }: { score: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={cn('w-1 rounded-sm', level <= score ? 'bg-emerald-400' : 'bg-muted')}
          style={{ height: `${level * 3 + 2}px` }}
        />
      ))}
    </div>
  )
}

function PickPanel({
  taskId,
  taskStatus,
  currentAssignee,
  onClose,
}: {
  taskId: string
  taskStatus: string
  currentAssignee?: TeamMember
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
  })

  const mutation = useMutation({
    mutationFn: (assigneeId: string) =>
      fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId }),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to assign')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stack'] })
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      onClose()
    },
  })

  const alreadyPicked = taskStatus === 'in_progress' || taskStatus === 'in_review'

  return (
    <div className="border-t border-border pt-4 mt-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {alreadyPicked ? 'Reassign' : 'Pick this task'}
      </p>

      {alreadyPicked && currentAssignee && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <MemberAvatar member={currentAssignee} />
          <span>
            Currently with <span className="text-foreground font-medium">{currentAssignee.name}</span>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(m.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg border border-border',
              'hover:border-border/60 hover:bg-muted/40 transition-colors text-left',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              currentAssignee?.id === m.id && 'border-blue-500/40 bg-blue-500/5',
            )}
          >
            <MemberAvatar member={m} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {m.availability.replace('_', ' ')} · {m.expertiseRoles[0] ?? 'dev'}
              </p>
            </div>
            {mutation.isPending && (
              <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            )}
          </button>
        ))}
      </div>

      {mutation.isError && (
        <p className="text-xs text-red-400 mt-2">Failed to assign. Try again.</p>
      )}
    </div>
  )
}

// ---- Main component ----
interface TaskSlideOverProps {
  taskId: string | null
  onClose: () => void
}

export function TaskSlideOver({ taskId, onClose }: TaskSlideOverProps) {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const { data: task, isLoading, isError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskDetail(taskId!),
    enabled: !!taskId,
  })

  const typeColor = task ? TASK_TYPE_COLORS[task.type] : '#888'

  return (
    <AnimatePresence>
      {taskId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50 w-full max-w-md',
              'bg-card border-l border-border flex flex-col overflow-hidden'
            )}
          >
            {/* Top color bar */}
            {task && (
              <motion.div
                className="h-[3px] w-full shrink-0"
                style={{ backgroundColor: typeColor }}
                animate={task.heat === 'hot' ? heatVariants.hot : {}}
                transition={task.heat === 'hot' ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
              />
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              {task ? (
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                  >
                    {TASK_TYPE_LABELS[task.type]}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">#{task.globalRank}</span>
                  {task.heat !== 'cool' && (
                    <Flame
                      className={cn('w-3.5 h-3.5', task.heat === 'hot' ? 'text-red-400' : 'text-amber-400')}
                    />
                  )}
                </div>
              ) : (
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              )}

              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {isLoading && <SlideOverSkeleton />}

              {isError && (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                  <AlertCircle className="w-6 h-6" />
                  <p className="text-sm">Failed to load task.</p>
                </div>
              )}

              {task && (
                <>
                  {/* Title */}
                  <h2 className="text-base font-semibold text-foreground leading-snug">{task.title}</h2>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {task.weight && (
                      <span className="flex items-center gap-1">
                        <span className="text-foreground font-medium">{task.weight}</span>
                        <span>· {TASK_WEIGHT_LABELS[task.weight]}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Signal className="w-3 h-3" />
                      <SignalBars score={task.signalScore} />
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatAge(task.createdAt)}
                    </span>
                    {task.hasBlockingQuery && (
                      <span className="flex items-center gap-1 text-red-400 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Blocked
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <section>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Description
                      </p>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </section>
                  )}

                  {/* Acceptance Criteria */}
                  {task.acceptanceCriteria && (
                    <section>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Acceptance Criteria
                      </p>
                      <div className="rounded-lg bg-muted/40 border border-border px-3.5 py-3">
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {task.acceptanceCriteria}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Links */}
                  {task.links.length > 0 && (
                    <section>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Links
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {task.links.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Blocking Queries */}
                  {task.queries.length > 0 && (
                    <section>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Open Queries
                      </p>
                      <div className="flex flex-col gap-2">
                        {task.queries.map((q) => (
                          <div
                            key={q.id}
                            className={cn(
                              'rounded-lg border px-3.5 py-3',
                              q.blocking
                                ? 'border-red-500/30 bg-red-500/5'
                                : 'border-border bg-muted/20'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {q.blocking && (
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                              )}
                              <p className="text-sm text-foreground/80 flex-1">{q.text}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <MemberAvatar member={q.raisedBy} />
                              <span className="text-[10px] text-muted-foreground">
                                {q.raisedBy.name} · {formatDate(q.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Current assignee */}
                  {task.assignee && (
                    <section>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Assigned to
                      </p>
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={task.assignee} size="md" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{task.assignee.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {task.assignee.availability.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Pick / Assign */}
                  <PickPanel
                    taskId={task.id}
                    taskStatus={task.status}
                    currentAssignee={task.assignee}
                    onClose={onClose}
                  />
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SlideOverSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-4 bg-muted rounded w-12" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
      <div className="h-20 bg-muted rounded" />
      <div className="h-16 bg-muted rounded" />
    </div>
  )
}
