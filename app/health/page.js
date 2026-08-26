import getData from './getData'

export default async function HealthPage() {
  const data = await getData()

  return (
    <div className="min-h-full bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-[var(--color-neutral-900)]">Health</h1>

        <div className="bg-[var(--color-neutral-0)] p-4 rounded" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <p className="mb-2">
            <span className="font-medium">Overall status:</span>{' '}
            <span className={data.status === 'ok' ? 'text-[var(--color-brand-600)]' : 'text-red-600'}>
              {data.status}
            </span>
          </p>

          <p className="text-sm text-[var(--color-neutral-600)] mb-4">Checked at: {data.timestamp}</p>

          <div>
            <h2 className="font-medium mb-2 text-[var(--color-neutral-800)]">Checks</h2>
            <ul className="space-y-2">
              {data.checks.map((c) => (
                <li key={c.name} className="flex items-center justify-between border rounded p-2" style={{ borderColor: 'var(--color-neutral-100)' }}>
                  <span>{c.name}</span>
                  <span className={c.status === 'ok' ? 'text-[var(--color-brand-600)]' : 'text-red-600'}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
