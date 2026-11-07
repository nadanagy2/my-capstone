'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'

const MAX_ROWS = 5000
const MAX_FILE_BYTES = 5 * 1024 * 1024

// The five fields our database needs. `synonyms` are common header names
// (lowercased, punctuation removed) used to auto-guess the right column.
const FIELDS = [
  {
    key: 'date',
    label: 'Date',
    hint: 'Format YYYY-MM-DD',
    synonyms: ['date', 'orderdate', 'day', 'transactiondate', 'saledate', 'createdat'],
  },
  {
    key: 'revenue',
    label: 'Revenue',
    hint: 'A number, e.g. 4200 or $4,200',
    synonyms: ['revenue', 'totalsales', 'sales', 'amount', 'total', 'income'],
  },
  {
    key: 'orders',
    label: 'Orders',
    hint: 'A whole number',
    synonyms: ['orders', 'unitssold', 'units', 'quantity', 'qty', 'ordercount', 'count'],
  },
  {
    key: 'category',
    label: 'Category',
    hint: 'Text, e.g. Electronics',
    synonyms: ['category', 'productcategory', 'product', 'type', 'segment'],
  },
  {
    key: 'region',
    label: 'Region',
    hint: 'Text, e.g. West',
    synonyms: ['region', 'area', 'location', 'territory', 'market', 'country'],
  },
]

function normalize(header) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Guess which CSV column belongs to each field: exact synonym match first,
// then any header containing the field name. The user can correct it.
function guessMapping(headers) {
  const mapping = {}
  for (const field of FIELDS) {
    const exact = headers.find((h) => field.synonyms.includes(normalize(h)))
    const partial = headers.find((h) => normalize(h).includes(field.key))
    mapping[field.key] = exact ?? partial ?? ''
  }
  return mapping
}

function parseNumber(value) {
  const cleaned = String(value ?? '').replace(/[$,\s]/g, '')
  if (cleaned === '') return NaN
  return Number(cleaned)
}

// Strict check: must be YYYY-MM-DD and a real calendar date (rejects 2026-02-31).
function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export default function UploadPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rawRows, setRawRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [replace, setReplace] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'saving' | 'done'
  const [error, setError] = useState(null)
  const [importedCount, setImportedCount] = useState(0)

  // This page needs a logged-in user; send everyone else to /login.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  function resetAll() {
    setFileName('')
    setHeaders([])
    setRawRows([])
    setMapping({})
    setReplace(false)
    setStatus('idle')
    setError(null)
    setImportedCount(0)
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    resetAll()

    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 5 MB. Please upload a smaller CSV.')
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const fields = results.meta.fields || []

        if (fields.length === 0 || results.data.length === 0) {
          setError('We could not find any rows. Check that the file is a CSV with a header row.')
          return
        }
        if (results.data.length > MAX_ROWS) {
          setError(`That file has ${results.data.length} rows. The limit is ${MAX_ROWS}.`)
          return
        }

        setFileName(file.name)
        setHeaders(fields)
        setRawRows(results.data)
        setMapping(guessMapping(fields))
      },
      error: () => setError('We could not read that file.'),
    })
  }

  // Validate every row against the current column mapping. Nothing is saved
  // unless every row passes, so bad data never reaches the database.
  const validation = useMemo(() => {
    if (rawRows.length === 0 || FIELDS.some((field) => !mapping[field.key])) return null

    const validRows = []
    const errors = []

    rawRows.forEach((row, index) => {
      const line = index + 2 // row 1 of the file is the header
      const date = String(row[mapping.date] ?? '').trim()
      const revenue = parseNumber(row[mapping.revenue])
      const orders = parseNumber(row[mapping.orders])
      const category = String(row[mapping.category] ?? '').trim()
      const region = String(row[mapping.region] ?? '').trim()

      const problems = []
      if (!isValidIsoDate(date)) problems.push(`date "${date}" is not YYYY-MM-DD`)
      if (!Number.isFinite(revenue) || revenue < 0) problems.push('revenue is not a non-negative number')
      if (!Number.isInteger(orders) || orders < 0) problems.push('orders is not a whole number')
      if (!category) problems.push('category is empty')
      if (!region) problems.push('region is empty')

      if (problems.length > 0) {
        errors.push({ line, message: problems.join('; ') })
      } else {
        validRows.push({ date, revenue, orders, category, region })
      }
    })

    return { validRows, errors }
  }, [rawRows, mapping])

  const mappedHeaders = FIELDS.map((field) => mapping[field.key]).filter(Boolean)
  const hasDuplicateMapping = new Set(mappedHeaders).size !== mappedHeaders.length
  const canImport =
    validation !== null &&
    validation.errors.length === 0 &&
    !hasDuplicateMapping &&
    status !== 'saving'

  async function handleImport() {
    if (!canImport) return

    setStatus('saving')
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (replace) {
        const { error: deleteError } = await supabase
          .from('sales_records')
          .delete()
          .eq('user_id', user.id)
        if (deleteError) throw deleteError
      }

      // One insert call = one database transaction: all rows save or none do.
      const payload = validation.validRows.map((row) => ({ ...row, user_id: user.id }))
      const { error: insertError } = await supabase.from('sales_records').insert(payload)
      if (insertError) throw insertError

      setImportedCount(payload.length)
      setStatus('done')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Something went wrong while saving. Please try again.')
      setStatus('idle')
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
        <p className="text-[var(--color-neutral-700)]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">Upload data</h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
            Upload a CSV of your sales. You choose which column is which, and nothing is saved
            until every row checks out.
          </p>
        </div>

        {status === 'done' ? (
          <div
            role="status"
            className="p-6 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
          >
            <p className="text-lg font-semibold text-[var(--color-neutral-900)]">
              Imported {importedCount} rows
            </p>
            <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
              Your dashboard, data table, charts and AI assistant now use this data.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/"
                className="rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition"
              >
                Go to dashboard
              </Link>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-lg border border-[var(--color-neutral-200)] px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition"
              >
                Upload another file
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
            >
              <label
                htmlFor="csv-file"
                className="block mb-2 text-sm font-medium text-[var(--color-neutral-800)]"
              >
                1. Choose a CSV file
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="block w-full text-sm text-[var(--color-neutral-700)]"
              />
              <p className="mt-2 text-xs text-[var(--color-neutral-600)]">
                Up to {MAX_ROWS} rows and 5 MB. The first row must be column names.
              </p>
              {fileName && (
                <p className="mt-2 text-sm text-[var(--color-neutral-800)]">Selected: {fileName}</p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {headers.length > 0 && (
              <>
                <div
                  className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                >
                  <h2 className="mb-1 text-sm font-medium text-[var(--color-neutral-800)]">
                    2. Match your columns
                  </h2>
                  <p className="mb-4 text-xs text-[var(--color-neutral-600)]">
                    We guessed these from your column names. Change any that are wrong.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FIELDS.map((field) => (
                      <div key={field.key}>
                        <label
                          htmlFor={`map-${field.key}`}
                          className="block mb-1 text-sm font-medium text-[var(--color-neutral-800)]"
                        >
                          {field.label}
                        </label>
                        <select
                          id={`map-${field.key}`}
                          value={mapping[field.key] ?? ''}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="w-full border rounded px-3 py-2 bg-white text-[var(--color-neutral-900)]"
                        >
                          <option value="">Choose a column…</option>
                          {headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-[var(--color-neutral-600)]">{field.hint}</p>
                      </div>
                    ))}
                  </div>
                  {hasDuplicateMapping && (
                    <p role="alert" className="mt-4 text-sm text-red-700">
                      Each field needs its own column. Two fields are using the same one.
                    </p>
                  )}
                </div>

                <div
                  className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                >
                  <h2 className="mb-3 text-sm font-medium text-[var(--color-neutral-800)]">
                    Preview (first 5 of {rawRows.length} rows)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
                          {headers.map((header) => (
                            <th key={header} className="py-2 px-3 text-[var(--color-neutral-700)]">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawRows.slice(0, 5).map((row, index) => (
                          <tr
                            key={index}
                            className="border-b"
                            style={{ borderColor: 'var(--color-neutral-100)' }}
                          >
                            {headers.map((header) => (
                              <td key={header} className="py-2 px-3 text-[var(--color-neutral-900)]">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div
                  className="p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]"
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                >
                  <h2 className="mb-3 text-sm font-medium text-[var(--color-neutral-800)]">
                    3. Check and import
                  </h2>

                  {validation === null ? (
                    <p className="text-sm text-[var(--color-neutral-700)]">
                      Choose a column for every field to check your data.
                    </p>
                  ) : validation.errors.length === 0 ? (
                    <p role="status" className="text-sm text-green-700">
                      All {validation.validRows.length} rows look good and are ready to import.
                    </p>
                  ) : (
                    <div role="alert">
                      <p className="text-sm font-medium text-red-700">
                        {validation.errors.length} of {rawRows.length} rows have problems. Fix the
                        file and upload it again, or change the column matching above.
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-red-700">
                        {validation.errors.slice(0, 10).map((item) => (
                          <li key={item.line}>
                            Row {item.line}: {item.message}
                          </li>
                        ))}
                      </ul>
                      {validation.errors.length > 10 && (
                        <p className="mt-1 text-sm text-red-700">
                          …and {validation.errors.length - 10} more.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-start gap-2">
                    <input
                      id="replace-existing"
                      type="checkbox"
                      checked={replace}
                      onChange={(e) => setReplace(e.target.checked)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="replace-existing"
                      className="text-sm text-[var(--color-neutral-800)]"
                    >
                      Replace my existing data
                      <span className="block text-xs text-[var(--color-neutral-600)]">
                        Permanently deletes all your current records before importing. Leave this
                        unchecked to add these rows to what you already have.
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!canImport}
                    className="mt-4 rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'saving'
                      ? 'Importing…'
                      : validation
                        ? `Import ${validation.validRows.length} rows`
                        : 'Import'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}