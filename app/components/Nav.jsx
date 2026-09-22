'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/ask', label: 'Ask', prefetch: false },
  { href: '/data', label: 'Data' },
  { href: '/visualize', label: 'Visualize', prefetch: false },
  { href: '/health', label: 'Health' },
  { href: '/settings', label: 'Settings' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-[var(--color-neutral-0)] border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="text-lg font-semibold text-[var(--color-neutral-900)] shrink-0">Ask-Your-Data</div>
        <div className="flex items-center gap-4">
          <nav
            aria-label="Main navigation"
            className="flex gap-1 overflow-x-auto whitespace-nowrap -mx-1 px-1"
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={link.prefetch}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 rounded shrink-0 border-b-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isActive
                      ? 'border-[var(--color-brand-600)] font-semibold'
                      : 'border-transparent'
                  }`}
                  style={{ color: isActive ? 'var(--color-brand-600)' : 'var(--color-neutral-700)' }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-brand-600)] hover:underline shrink-0"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
