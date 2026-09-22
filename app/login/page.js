'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-50)] p-6">
      <div className="w-full max-w-sm bg-[var(--color-neutral-0)] p-6 rounded-xl border border-[var(--color-neutral-100)]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <h1 className="text-xl font-semibold text-[var(--color-neutral-900)] mb-1">
          {mode === 'login' ? 'Log in' : 'Create an account'}
        </h1>
        <p className="text-sm text-[var(--color-neutral-600)] mb-6">
          {mode === 'login'
            ? 'Welcome back to Ask Your Data.'
            : 'Start tracking your own sales data.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-[var(--color-neutral-700)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-[var(--color-neutral-700)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
          }}
          className="w-full mt-4 text-sm text-[var(--color-brand-600)] hover:underline"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}