export default function DataPage() {
  return (
    <div className="min-h-full bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-[var(--color-neutral-900)]">Dataset</h1>
        <div className="bg-[var(--color-neutral-0)] p-4 rounded overflow-auto" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
                <th className="py-2 px-3 text-[var(--color-neutral-700)]">ID</th>
                <th className="py-2 px-3 text-[var(--color-neutral-700)]">Name</th>
                <th className="py-2 px-3 text-[var(--color-neutral-700)]">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: 'var(--color-neutral-100)' }}>
                <td className="py-2 px-3">1</td>
                <td className="py-2 px-3">Users</td>
                <td className="py-2 px-3">Table</td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--color-neutral-100)' }}>
                <td className="py-2 px-3">2</td>
                <td className="py-2 px-3">Orders</td>
                <td className="py-2 px-3">Table</td>
              </tr>
              <tr>
                <td className="py-2 px-3">3</td>
                <td className="py-2 px-3">Events</td>
                <td className="py-2 px-3">Stream</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
