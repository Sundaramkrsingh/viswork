'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Mail, ArrowRight, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type GoogleState = 'idle' | 'loading'
type EmailState = 'idle' | 'loading' | 'sent' | 'error'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/stack'

  const [googleState, setGoogleState] = useState<GoogleState>('idle')
  const [emailState, setEmailState] = useState<EmailState>('idle')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)

  useEffect(() => {
    if (searchParams.get('verify') === '1') setEmailState('sent')
    if (searchParams.get('error')) {
      setEmailState('error')
      setErrorMsg('The sign-in link is invalid or has expired.')
      setShowEmailForm(true)
    }
  }, [searchParams])

  async function handleGoogle() {
    setGoogleState('loading')
    await signIn('google', { callbackUrl })
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEmailState('loading')
    setErrorMsg('')
    try {
      const result = await signIn('email', { email: email.trim(), redirect: false, callbackUrl })
      if (result?.error) {
        setEmailState('error')
        setErrorMsg('Something went wrong. Please try again.')
      } else {
        setEmailState('sent')
      }
    } catch {
      setEmailState('error')
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

      <div className="rounded-2xl border border-border bg-card p-6">
        <AnimatePresence mode="wait">
          {emailState === 'sent' ? (
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
                onClick={() => { setEmailState('idle'); setEmail('') }}
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
              className="flex flex-col gap-4"
            >
              <div>
                <h1 className="text-lg font-semibold text-foreground mb-0.5">Sign in</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome to Viswork
                </p>
              </div>

              {/* Google button — primary */}
              <button
                onClick={handleGoogle}
                disabled={googleState === 'loading'}
                className={cn(
                  'flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg',
                  'bg-white text-[#1f1f1f] font-medium text-sm border border-[#dadce0]',
                  'hover:bg-gray-50 hover:shadow-sm transition-all',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {googleState === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                ) : (
                  <GoogleIcon />
                )}
                {googleState === 'loading' ? 'Redirecting…' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email magic link — secondary (collapsed by default) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowEmailForm((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Sign in with email link
                  <ChevronDown
                    className={cn('w-3.5 h-3.5 transition-transform', showEmailForm && 'rotate-180')}
                  />
                </button>

                <AnimatePresence>
                  {showEmailForm && (
                    <motion.form
                      key="email-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleEmailSubmit}
                      className="flex flex-col gap-2 mt-3 overflow-hidden"
                    >
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={emailState === 'loading'}
                        className={cn(
                          'w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted/40',
                          'text-sm text-foreground placeholder:text-muted-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
                          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        )}
                      />
                      {emailState === 'error' && (
                        <p className="text-xs text-red-400">{errorMsg}</p>
                      )}
                      <button
                        type="submit"
                        disabled={emailState === 'loading' || !email.trim()}
                        className={cn(
                          'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg',
                          'bg-primary text-primary-foreground font-medium text-sm',
                          'hover:bg-primary/90 transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {emailState === 'loading' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Send magic link
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 text-center">
        By signing in you agree to use this responsibly.
      </p>
    </motion.div>
  )
}
