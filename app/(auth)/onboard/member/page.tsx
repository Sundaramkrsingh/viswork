'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Loader2, ArrowRight, X, Plus } from 'lucide-react'
import { cn, expertiseToColor } from '@/lib/utils'

export default function OnboardMemberPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [roleInput, setRoleInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addRole() {
    const trimmed = roleInput.trim()
    if (!trimmed || roles.includes(trimmed)) return
    setRoles([...roles, trimmed])
    setRoleInput('')
    inputRef.current?.focus()
  }

  function removeRole(role: string) {
    setRoles(roles.filter((r) => r !== role))
  }

  function handleRoleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRole()
    } else if (e.key === 'Backspace' && !roleInput && roles.length > 0) {
      setRoles(roles.slice(0, -1))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || roles.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboard/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), expertiseRoles: roles }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create profile')
        setLoading(false)
        return
      }
      router.replace('/stack')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const primaryColor = roles[0] ? expertiseToColor(roles[0]) : 'hsl(217, 91%, 60%)'

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
        <h1 className="text-lg font-semibold text-foreground mb-1">Set up your profile</h1>
        <p className="text-sm text-muted-foreground mb-5">
          How should the team know you? Add your name and skills.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your name
            </label>
            <input
              type="text"
              placeholder="e.g. Alice Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              autoFocus
              className={cn(
                'w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted/40',
                'text-sm text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
                'disabled:opacity-50 transition-colors'
              )}
            />
          </div>

          {/* Expertise roles */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Expertise{' '}
                <span className="normal-case font-normal">(first = primary skill)</span>
              </label>
            </div>

            {/* Chips + input */}
            <div
              className={cn(
                'flex flex-wrap gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/40',
                'focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60',
                'transition-colors min-h-[44px] cursor-text'
              )}
              onClick={() => inputRef.current?.focus()}
            >
              <AnimatePresence>
                {roles.map((role, i) => (
                  <motion.span
                    key={role}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${i === 0 ? primaryColor : 'hsl(215,20%,25%)'}`,
                      color: i === 0 ? '#fff' : 'hsl(215,20%,70%)',
                    }}
                  >
                    {role}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeRole(role) }}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>

              <input
                ref={inputRef}
                type="text"
                placeholder={roles.length === 0 ? 'e.g. React, Backend, Design...' : 'Add more...'}
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={handleRoleKeyDown}
                disabled={loading}
                className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />

              {roleInput.trim() && (
                <button
                  type="button"
                  onClick={addRole}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Type a skill and press Enter. Order matters — first is your primary.
            </p>
          </div>

          {/* Avatar ring preview */}
          {roles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border"
            >
              <div
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground shrink-0"
                style={{ boxShadow: `0 0 0 2.5px ${primaryColor}` }}
              >
                {name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{name || 'Your name'}</p>
                <p className="text-[11px] text-muted-foreground">
                  Ring color from <span style={{ color: primaryColor }}>{roles[0]}</span>
                </p>
              </div>
            </motion.div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim() || roles.length === 0}
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
                Go to Viswork
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
