'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, Plus } from 'lucide-react'
import { MissionCard } from '@/components/missions/MissionCard'
import { MissionDetail } from '@/components/missions/MissionDetail'
import { CreateMissionModal } from '@/components/missions/CreateMissionModal'
import type { MissionSummary } from '@/lib/db/mission'

async function fetchMissions(): Promise<MissionSummary[]> {
  const res = await fetch('/api/missions')
  if (!res.ok) throw new Error('Failed to fetch missions')
  return res.json()
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-start gap-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-12 ml-auto" />
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full" />
      <div className="h-1 bg-zinc-800 rounded-full" />
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-zinc-800 rounded-full" />
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="h-3 bg-zinc-800 rounded w-16 ml-auto" />
      </div>
    </div>
  )
}

export default function MissionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: missions, isLoading, isError } = useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    refetchInterval: 15_000,
  })

  // Deselect if selected mission is gone
  if (selectedId && missions && !missions.some((m) => m.id === selectedId)) {
    setSelectedId(null)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 px-6 py-5 border-b border-border/50 shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Flag className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Missions</h1>
          {missions && (
            <p className="text-xs text-muted-foreground/60">
              {missions.length} {missions.length === 1 ? 'mission' : 'missions'}
            </p>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-[0_0_16px_rgba(139,92,246,0.3)]"
        >
          <Plus className="w-4 h-4" />
          New Mission
        </button>
      </motion.div>

      {/* Body — split panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: mission list */}
        <div className="w-80 shrink-0 border-r border-border/50 overflow-y-auto">
          <div className="p-3 flex flex-col gap-2">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

            {isError && (
              <p className="text-sm text-red-400 px-2 py-4">Failed to load missions.</p>
            )}

            <AnimatePresence mode="popLayout">
              {missions?.map((mission, i) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  index={i}
                  selected={selectedId === mission.id}
                  onClick={() => setSelectedId(mission.id)}
                />
              ))}
            </AnimatePresence>

            {missions?.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 py-16 text-center px-4"
              >
                <p className="text-4xl">🚀</p>
                <p className="text-sm font-medium text-zinc-400">No missions yet</p>
                <p className="text-xs text-zinc-600 max-w-[180px]">
                  Define goals for your team. Link tasks and track progress.
                </p>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="mt-1 px-4 py-2 rounded-xl bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 text-sm font-medium transition-colors border border-violet-500/20"
                >
                  Create First Mission
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {selectedId ? (
              <MissionDetail key={selectedId} missionId={selectedId} />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center">
                  <Flag className="w-7 h-7 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">Select a mission</p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                    Choose a mission from the list to see its targets and linked tasks.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateMissionModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
