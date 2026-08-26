import Link from 'next/link'

export default function Nav() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-semibold">Ask-Your-Data</div>
        <nav aria-label="Main navigation" className="space-x-3">
          <Link href="/" className="px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
          <Link href="/ask" className="px-3 py-2 rounded hover:bg-gray-100">Ask</Link>
          <Link href="/data" className="px-3 py-2 rounded hover:bg-gray-100">Data</Link>
          <Link href="/settings" className="px-3 py-2 rounded hover:bg-gray-100">Settings</Link>
        </nav>
      </div>
    </header>
  )
}
