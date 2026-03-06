'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, Users, Lock, Calendar } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import type { MissionVisibility } from '@/lib/types'

interface CreateMissionModalProps {
  open: boolean
  onClose: () => void
}

// Default deadline = 2 weeks from today
function defaultDeadline() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } },
}

export function CreateMissionModal({ open, onClose }: CreateMissionModalProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<MissionVisibility>('team')
  const [deadline, setDeadline] = useState(defaultDeadline())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
          deadline,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }

      queryClient.invalidateQueries({ queryKey: ['missions'] })
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setTitle('')
    setDescription('')
    setVisibility('team')
    setDeadline(defaultDeadline())
    setError('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Flag className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-foreground flex-1">New Mission</h2>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                    Mission Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Ship auth redesign by Q2"
                    autoFocus
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                    Description <span className="text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does success look like?"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Deadline <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
                  />
                </div>

                {/* Visibility */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Visibility</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility('team')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all',
                        visibility === 'team'
                          ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                      )}
                    >
                      <Users className="w-3.5 h-3.5" /> Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('personal')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all',
                        visibility === 'personal'
                          ? 'border-zinc-500/50 bg-zinc-700/60 text-zinc-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                      )}
                    >
                      <Lock className="w-3.5 h-3.5" /> Personal
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
                    'bg-violet-600 hover:bg-violet-500 text-white',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Launch Mission'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
