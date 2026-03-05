'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Layers, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OnboardWorkspacePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboard/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create workspace')
        setLoading(false)
        return
      }
      router.replace('/onboard/member')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm"
    >
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <p className="font-bold text-foreground text-lg">Viswork</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-lg font-semibold text-foreground mb-1">Name your workspace</h1>
        <p className="text-sm text-muted-foreground mb-5">
          This is your team's Viswork. You can always change it later.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="e.g. Acme Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            disabled={loading}
            autoFocus
            className={cn(
              'w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted/40',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
              'disabled:opacity-50 transition-colors'
            )}
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={cn(
              'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg',
              'bg-primary text-primary-foreground font-medium text-sm',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
