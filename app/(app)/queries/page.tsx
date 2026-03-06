'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { QueryCard } from '@/components/queries/QueryCard'
import type { QueryWithContext } from '@/lib/db/query'

async function fetchQueries(): Promise<QueryWithContext[]> {
  const res = await fetch('/api/queries')
  if (!res.ok) throw new Error('Failed to fetch queries')
  return res.json()
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 bg-muted rounded w-16" />
        <div className="h-4 bg-muted rounded w-28" />
        <div className="h-3 bg-muted rounded w-10 ml-auto" />
      </div>
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-muted rounded-full" />
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-6 bg-muted rounded w-16 ml-auto" />
      </div>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <h2 className={`text-sm font-semibold ${color}`}>{label}</h2>
      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  )
}

export default function QueriesPage() {
  const { data: queries, isLoading, isError } = useQuery({
    queryKey: ['queries'],
    queryFn: fetchQueries,
    refetchInterval: 15_000,
  })

  const blocking = queries?.filter((q) => q.blocking) ?? []
  const nonBlocking = queries?.filter((q) => !q.blocking) ?? []

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
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Queries</h1>
            {queries && (
              <p className="text-xs text-muted-foreground">
                {queries.length} open {queries.length === 1 ? 'query' : 'queries'}
              </p>
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-sm text-red-400">Failed to load queries.</p>
        )}

        {/* Content */}
        {queries && (
          <div className="flex flex-col gap-8">
            {/* Blocking section */}
            {blocking.length > 0 && (
              <section>
                <SectionHeader
                  icon={AlertCircle}
                  label="Blocking"
                  count={blocking.length}
                  color="text-red-400"
                />
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {blocking.map((q, i) => (
                      <QueryCard key={q.id} query={q} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Non-blocking section */}
            {nonBlocking.length > 0 && (
              <section>
                <SectionHeader
                  icon={MessageSquare}
                  label="Open queries"
                  count={nonBlocking.length}
                  color="text-muted-foreground"
                />
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {nonBlocking.map((q, i) => (
                      <QueryCard key={q.id} query={q} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Empty state */}
            {queries.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 py-16 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-foreground">All clear</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  No open queries — the team is unblocked.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
