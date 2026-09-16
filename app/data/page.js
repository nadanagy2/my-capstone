import { salesRecords } from '@/lib/sales-data'

export default function DataPage() {
  const sorted = [...salesRecords].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="min-h-full bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1 text-[var(--color-neutral-900)]">Dataset</h1>
        <p className="text-sm text-[var(--color-neutral-600)] mb-4">
          Raw sales records — {sorted.length} rows. This is the same dataset the "Ask" tool
          and the Dashboard chart use.
        </p>
        <div className="bg-[var(--color-neutral-0)] p-4 rounded overflow-auto" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
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
              {sorted.map((record) => (
                <tr
                  key={record.date}
                  className="border-b"
                  style={{ borderColor: 'var(--color-neutral-100)' }}
                >
                  <td className="py-2 px-3 text-[var(--color-neutral-900)]">{record.date}</td>
                  <td className="py-2 px-3 text-[var(--color-neutral-900)]">{record.category}</td>
                  <td className="py-2 px-3 text-[var(--color-neutral-900)]">{record.region}</td>
                  <td className="py-2 px-3 text-[var(--color-neutral-900)] text-right">
                    ${record.revenue.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-[var(--color-neutral-900)] text-right">
                    {record.orders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}