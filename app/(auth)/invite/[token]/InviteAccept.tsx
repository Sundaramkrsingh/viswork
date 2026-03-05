'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Layers, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  token: string
  email: string
  workspaceName: string
  invitedBy: string
}

export default function InviteAccept({ token, email, workspaceName, invitedBy }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')
    try {
      // Mark invite as used
      await fetch(`/api/invites/${token}/use`, { method: 'POST' })
      // Trigger magic link to the invite email
      await signIn('email', { email, redirect: false })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
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
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-semibold text-foreground">Check your email</p>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a sign-in link to{' '}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-1">You've been invited</p>
            <h1 className="text-lg font-semibold text-foreground mb-1">{workspaceName}</h1>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="text-foreground">{invitedBy}</span> invited{' '}
              <span className="text-foreground">{email}</span> to join the team.
            </p>

            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

            <button
              onClick={handleAccept}
              disabled={loading}
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
                  Accept & Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
