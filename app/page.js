import AuroraHero from './components/AuroraHero'

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-[var(--color-neutral-50)]">
      <section className="relative h-[360px] overflow-hidden">
        <AuroraHero />
        <div className="relative z-10 flex h-full flex-col items-start justify-center px-6 sm:px-10 pointer-events-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
            Ask Your Data
          </h1>
          <p className="mt-3 max-w-xl text-base sm:text-lg text-white/90 drop-shadow-sm">
            A manager-facing analytics dashboard — ask questions about your data
            in plain language and get answers grounded in the real numbers.
          </p>
        </div>
      </section>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)] rounded" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              Summary Card 1
            </div>
            <div className="p-4 bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)] rounded" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              Summary Card 2
            </div>
            <div className="p-4 bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)] rounded" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              Summary Card 3
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
