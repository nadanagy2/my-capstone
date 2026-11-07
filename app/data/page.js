import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { querySales } from '@/lib/sales-data'

export default async function DataPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { rows } = await querySales({})

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1 text-[var(--color-neutral-900)]">Dataset</h1>
        <p className="text-sm text-[var(--color-neutral-600)] mb-4">
          Raw sales records — {rows.length} rows. This is the same dataset the "Ask" tool
          and the Dashboard chart use.
        </p>
        <div className="bg-[var(--color-neutral-0)] p-4 rounded overflow-auto" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          {rows.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--color-neutral-700)]">
                You haven't added any sales records yet.
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-block rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition"
              >
                Upload a CSV
              </Link>
            </div>
          ) : (
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
                  <th className="py-2 px-3 text-[var(--color-neutral-700)]">Date</th>
                  <th className="py-2 px-3 text-[var(--color-neutral-700)]">Category</th>
                  <th className="py-2 px-3 text-[var(--color-neutral-700)]">Region</th>
                  <th className="py-2 px-3 text-[var(--color-neutral-700)] text-right">Revenue</th>
                  <th className="py-2 px-3 text-[var(--color-neutral-700)] text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b"
                    style={{ borderColor: 'var(--color-neutral-100)' }}
                  >
                    <td className="py-2 px-3 text-[var(--color-neutral-900)]">{record.date}</td>
                    <td className="py-2 px-3 text-[var(--color-neutral-900)]">{record.category}</td>
                    <td className="py-2 px-3 text-[var(--color-neutral-900)]">{record.region}</td>
                    <td className="py-2 px-3 text-[var(--color-neutral-900)] text-right">
                      ${Number(record.revenue).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-[var(--color-neutral-900)] text-right">
                      {record.orders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}