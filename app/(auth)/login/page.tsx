'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // NextAuth redirects here with ?verify=1 after sending the magic link
  useEffect(() => {
    if (searchParams.get('verify') === '1') setState('sent')
    if (searchParams.get('error')) {
      setState('error')
      setErrorMsg('The sign-in link is invalid or has expired.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    try {
      const result = await signIn('email', { email: email.trim(), redirect: false })
      if (result?.error) {
        setState('error')
        setErrorMsg('Something went wrong. Please try again.')
      } else {
        setState('sent')
      }
    } catch {
      setState('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg leading-none">Viswork</p>
          <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
            Visual project management
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <AnimatePresence mode="wait">
          {state === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex flex-col items-center text-center gap-4 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"
              >
                <Mail className="w-6 h-6 text-blue-400" />
              </motion.div>
              <div>
                <p className="font-semibold text-foreground">Check your email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a sign-in link to{' '}
                  <span className="text-foreground font-medium">{email || 'your email'}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the link in the email to sign in. It expires in 24 hours.
              </p>
              <button
                onClick={() => { setState('idle'); setEmail('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Use a different email
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-lg font-semibold text-foreground mb-1">Sign in</h1>
              <p className="text-sm text-muted-foreground mb-5">
                Enter your email to receive a magic link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={state === 'loading'}
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted/40',
                    'text-sm text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                />

                {state === 'error' && (
                  <p className="text-xs text-red-400">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={state === 'loading' || !email.trim()}
                  className={cn(
                    'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg',
                    'bg-primary text-primary-foreground font-medium text-sm',
                    'hover:bg-primary/90 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {state === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send magic link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-[11px] text-muted-foreground mt-4 text-center">
                No password needed. Just click the link in your email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
