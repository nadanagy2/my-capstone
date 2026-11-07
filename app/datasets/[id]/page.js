import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ROLE_NAMES = { date: 'Date', measure: 'Measure', category: 'Category' }

function formatCell(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export default async function DatasetPage({ params }) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Row Level Security means this only returns a dataset the user owns.
  const { data: dataset, error } = await supabase
    .from('datasets')
    .select('id, name, columns, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !dataset) {
    notFound()
  }

  const { count } = await supabase
    .from('dataset_rows')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', id)

  const { data: previewRows } = await supabase
    .from('dataset_rows')
    .select('id, data')
    .eq('dataset_id', id)
    .order('id', { ascending: true })
    .limit(10)

  const columns = dataset.columns ?? []
  const total = count ?? 0

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            href="/datasets"
            className="text-sm text-[var(--color-brand-600)] hover:underline"
          >
            ← All datasets
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">
            {dataset.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
            {total.toLocaleString()} rows · {columns.length} columns · added{' '}
            {new Date(dataset.created_at).toLocaleDateString()}
          </p>
        </div>

        <div
          className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-neutral-800)]">Columns</h2>
          <ul className="flex flex-wrap gap-2">
            {columns.map((column) => (
              <li
                key={column.name}
                className="rounded-full border border-[var(--color-neutral-200)] px-3 py-1 text-sm text-[var(--color-neutral-800)]"
              >
                {column.name}{' '}
                <span className="text-[var(--color-neutral-600)]">
                  · {ROLE_NAMES[column.role] ?? column.role}
                  {column.primary ? ' (main date)' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-neutral-800)]">
            Preview (first {(previewRows ?? []).length} of {total.toLocaleString()} rows)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
                  {columns.map((column) => (
                    <th
                      key={column.name}
                      className={`py-2 px-3 text-[var(--color-neutral-700)] ${
                        column.role === 'measure' ? 'text-right' : ''
                      }`}
                    >
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(previewRows ?? []).map((row) => (
                  <tr
                    key={row.id}
                    className="border-b"
                    style={{ borderColor: 'var(--color-neutral-100)' }}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.name}
                        className={`py-2 px-3 text-[var(--color-neutral-900)] ${
                          column.role === 'measure' ? 'text-right' : ''
                        }`}
                      >
                        {formatCell(row.data?.[column.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
