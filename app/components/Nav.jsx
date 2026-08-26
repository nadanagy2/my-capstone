import Link from 'next/link'

export default function Nav() {
  return (
    <header className="bg-[var(--color-neutral-0)] border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-[var(--color-neutral-900)]">Ask-Your-Data</div>
        <nav aria-label="Main navigation" className="space-x-3">
          <Link href="/" className="px-3 py-2 rounded" style={{ color: 'var(--color-neutral-700)' }}>
            Dashboard
          </Link>
          <Link href="/ask" className="px-3 py-2 rounded" style={{ color: 'var(--color-neutral-700)' }}>
            Ask
          </Link>
          <Link href="/data" className="px-3 py-2 rounded" style={{ color: 'var(--color-neutral-700)' }}>
            Data
          </Link>
          <Link href="/health" className="px-3 py-2 rounded" style={{ color: 'var(--color-neutral-700)' }}>
            Health
          </Link>
          <Link href="/settings" className="px-3 py-2 rounded" style={{ color: 'var(--color-neutral-700)' }}>
            Settings
          </Link>
        </nav>
      </div>
    </header>
  )
}
