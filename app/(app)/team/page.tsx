'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { MemberCard } from '@/components/team/MemberCard'
import type { TeamMemberWithTask } from '@/lib/types'

async function fetchMembers(): Promise<TeamMemberWithTask[]> {
  const res = await fetch('/api/members')
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
        <div className="flex-1 pt-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 bg-muted rounded-full w-20" />
        <div className="h-5 bg-muted rounded-full w-14" />
      </div>
      <div className="h-4 bg-muted rounded w-28" />
    </div>
  )
}

export default function TeamPage() {
  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    refetchInterval: 30_000,
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Team</h1>
          {members && (
            <p className="text-xs text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-400">Failed to load team members.</p>
      )}

      {members && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((member, i) => (
            <MemberCard key={member.id} member={member} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
