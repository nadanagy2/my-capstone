import AuroraHero from './components/AuroraHero'
import RevenueTrendChart from './components/RevenueTrendChart'
import { querySales, salesRecords } from '@/lib/sales-data'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'

function getTrend() {
  const sorted = [...salesRecords].sort((a, b) => a.date.localeCompare(b.date))
  const midpoint = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, midpoint)
  const secondHalf = sorted.slice(midpoint)

  const sum = (arr) => arr.reduce((total, r) => total + r.revenue, 0)
  const firstTotal = sum(firstHalf)
  const secondTotal = sum(secondHalf)

  const percentChange = firstTotal === 0 ? 0 : ((secondTotal - firstTotal) / firstTotal) * 100
  return { percentChange, isUp: percentChange >= 0 }
}

export default function DashboardPage() {
  const allData = querySales({})
  const topCategory = querySales({ groupBy: 'category' }).rows[0]
  const trend = getTrend()
  const sortedRecords = [...salesRecords].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)]">
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-neutral-800)]">
              Overview — {salesRecords.length} days of data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--color-neutral-600)]">Total Revenue</p>
                  <div className="p-2 rounded-lg bg-[var(--color-brand-50,#eff6ff)]">
                    <DollarSign size={18} className="text-[var(--color-brand-600)]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                  ${allData.totalRevenue.toLocaleString()}
                </p>
                <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp size={14} className={trend.isUp ? '' : 'rotate-180'} />
                  {Math.abs(trend.percentChange).toFixed(1)}% vs first half
                </p>
              </div>

              <div className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--color-neutral-600)]">Total Orders</p>
                  <div className="p-2 rounded-lg bg-purple-50">
                    <ShoppingCart size={18} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                  {allData.totalOrders.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                  ~{Math.round(allData.totalOrders / salesRecords.length)} orders/day avg
                </p>
              </div>

              <div className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--color-neutral-600)]">Top Category</p>
                  <div className="p-2 rounded-lg bg-green-50">
                    <TrendingUp size={18} className="text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--color-neutral-900)]">
                  {topCategory.key}
                </p>
                <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                  ${topCategory.revenue.toLocaleString()} in revenue
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <h3 className="text-sm font-semibold text-[var(--color-neutral-800)] mb-4">Revenue trend</h3>
            <RevenueTrendChart data={sortedRecords} />
          </div>
        </div>
      </div>
    </div>
  )
}