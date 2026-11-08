import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ChartBuilder from './ChartBuilder'
import DeleteDatasetButton from './DeleteDatasetButton'

const PAGE_SIZE = 1000 // the API returns at most 1,000 rows per request
const MAX_PAGES = 20

const ROLE_NAMES = { date: 'Date', measure: 'Measure', category: 'Category' }

function formatCell(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

// Read every row of the dataset, one page at a time.
async function fetchAllRows(supabase, datasetId) {
  const rows = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE
    const { data, error } = await supabase
      .from('dataset_rows')
      .select('data')
      .eq('dataset_id', datasetId)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    const batch = data ?? []
    rows.push(...batch.map((row) => row.data))
    if (batch.length < PAGE_SIZE) break
  }
  return rows
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

  let rows = []
  let loadError = null
  try {
    rows = await fetchAllRows(supabase, id)
  } catch (err) {
    loadError = err.message
  }

  const columns = dataset.columns ?? []
  const preview = rows.slice(0, 10)
  const cardClass =
    'p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]'
  const cardStyle = { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/datasets" className="text-sm text-[var(--color-brand-600)] hover:underline">
            ← All datasets
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">
            {dataset.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
            {rows.length.toLocaleString()} rows · {columns.length} columns · added{' '}
            {new Date(dataset.created_at).toLocaleDateString()}
          </p>
        </div>

        {loadError ? (
          <p role="alert" className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            We could not load the rows for this dataset: {loadError}
          </p>
        ) : (
          <>
            <div className={cardClass} style={cardStyle}>
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-neutral-800)]">
                Chart builder
              </h2>
              <ChartBuilder columns={columns} rows={rows} />
            </div>

            <div className={cardClass} style={cardStyle}>
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

            <div className={cardClass} style={cardStyle}>
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-neutral-800)]">
                Preview (first {preview.length} of {rows.length.toLocaleString()} rows)
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
                    {preview.map((row, index) => (
                      <tr
                        key={index}
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
                            {formatCell(row?.[column.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div
          className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-red-200"
          style={cardStyle}
        >
          <h2 className="text-sm font-semibold text-[var(--color-neutral-800)]">
            Delete this dataset
          </h2>
          <p className="mt-1 mb-4 text-sm text-[var(--color-neutral-700)]">
            Permanently removes this dataset and all of its rows. Your other datasets are not
            affected.
          </p>
          <DeleteDatasetButton
            datasetId={dataset.id}
            datasetName={dataset.name}
            rowCount={loadError ? null : rows.length}
          />
        </div>
      </div>
    </div>
  )
}

