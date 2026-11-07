import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function DatasetsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('datasets')
    .select('id, name, columns, created_at')
    .order('created_at', { ascending: false })

  const datasets = data ?? []

  const counts = await Promise.all(
    datasets.map(async (dataset) => {
      const { count } = await supabase
        .from('dataset_rows')
        .select('*', { count: 'exact', head: true })
        .eq('dataset_id', dataset.id)
      return count ?? 0
    })
  )

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">Datasets</h1>
          <Link
            href="/datasets/new"
            className="rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition"
          >
            Add a dataset
          </Link>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            We could not load your datasets: {error.message}
          </p>
        )}

        {datasets.length === 0 ? (
          <div
            className="p-8 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)] text-center"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
          >
            <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">
              No datasets yet
            </h2>
            <p className="mt-2 mx-auto max-w-md text-sm text-[var(--color-neutral-700)]">
              Upload any CSV, such as sales, costs or headcount. You choose which columns to
              measure and which to group by.
            </p>
            <Link
              href="/datasets/new"
              className="mt-5 inline-block rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition"
            >
              Add your first dataset
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {datasets.map((dataset, index) => {
              const measures = (dataset.columns ?? [])
                .filter((column) => column.role === 'measure')
                .map((column) => column.name)
              return (
                <li
                  key={dataset.id}
                  className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                >
                  <Link
                    href={`/datasets/${dataset.id}`}
                    className="text-lg font-semibold text-[var(--color-brand-600)] hover:underline"
                  >
                    {dataset.name}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
                    {counts[index].toLocaleString()} rows · {(dataset.columns ?? []).length} columns
                    {measures.length > 0 ? ` · measures: ${measures.join(', ')}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-600)]">
                    Added {new Date(dataset.created_at).toLocaleDateString()}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
