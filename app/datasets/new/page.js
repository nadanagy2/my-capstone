'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { detectColumns, parseDateValue, parseNumberValue } from '@/lib/detect-columns'

const MAX_ROWS = 10000
const MAX_FILE_BYTES = 10 * 1024 * 1024
const CHUNK_SIZE = 1000

const ROLE_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'measure', label: 'Measure (a number to add up)' },
  { value: 'category', label: 'Category (text to group by)' },
  { value: 'ignore', label: 'Ignore this column' },
]

const ROLE_NAMES = { date: 'Date', measure: 'Measure', category: 'Category' }

const cardClass =
  'p-5 bg-[var(--color-neutral-0)] rounded-xl border border-[var(--color-neutral-100)]'
const cardStyle = { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }

// Turn one raw CSV row into clean, typed values for storage.
function normalizeRow(row, columns) {
  const data = {}
  for (const column of columns) {
    const raw = String(row[column.name] ?? '').trim()
    if (raw === '') {
      data[column.name] = null
    } else if (column.role === 'date') {
      data[column.name] = parseDateValue(raw)
    } else if (column.role === 'measure') {
      data[column.name] = parseNumberValue(raw)
    } else {
      data[column.name] = raw
    }
  }
  return data
}

export default function NewDatasetPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [fileName, setFileName] = useState('')
  const [datasetName, setDatasetName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rawRows, setRawRows] = useState([])
  const [examples, setExamples] = useState({})
  const [roles, setRoles] = useState({})
  const [primaryDate, setPrimaryDate] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'saving'
  const [progress, setProgress] = useState('')
  const [error, setError] = useState(null)

  // This page needs a signed-in user.
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
    setDatasetName('')
    setHeaders([])
    setRawRows([])
    setExamples({})
    setRoles({})
    setPrimaryDate('')
    setStatus('idle')
    setProgress('')
    setError(null)
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    resetAll()

    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 10 MB. Please upload a smaller CSV.')
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
        if (fields.some((field) => field === '')) {
          setError('Every column needs a name in the first row of the file.')
          return
        }
        if (new Set(fields).size !== fields.length) {
          setError('Two columns have the same name. Rename one of them and upload again.')
          return
        }
        if (results.data.length > MAX_ROWS) {
          setError(`That file has ${results.data.length} rows. The limit is ${MAX_ROWS}.`)
          return
        }

        const detected = detectColumns(fields, results.data)
        const sampleValues = {}
        for (const field of fields) {
          const seen = []
          for (const row of results.data) {
            const value = String(row[field] ?? '').trim()
            if (value !== '' && !seen.includes(value)) seen.push(value)
            if (seen.length >= 3) break
          }
          sampleValues[field] = seen.join(', ').slice(0, 60)
        }

        setFileName(file.name)
        setDatasetName(file.name.replace(/\.csv$/i, ''))
        setHeaders(fields)
        setRawRows(results.data)
        setExamples(sampleValues)
        setRoles(Object.fromEntries(detected.map((column) => [column.name, column.role])))
        setPrimaryDate(detected.find((column) => column.role === 'date')?.name ?? '')
      },
      error: () => setError('We could not read that file.'),
    })
  }

  const dateColumns = headers.filter((header) => roles[header] === 'date')
  const primary = dateColumns.includes(primaryDate) ? primaryDate : (dateColumns[0] ?? '')

  const activeColumns = headers
    .filter((header) => roles[header] && roles[header] !== 'ignore')
    .map((header) => ({
      name: header,
      role: roles[header],
      ...(header === primary ? { primary: true } : {}),
    }))

  const hasMeasure = activeColumns.some((column) => column.role === 'measure')

  // Check every non-blank value in every date and measure column. Blanks are
  // fine (stored as empty); a value that cannot be read blocks the import.
  const problems = useMemo(() => {
    const found = []
    const checked = headers
      .filter((header) => roles[header] === 'date' || roles[header] === 'measure')
      .map((header) => ({ name: header, role: roles[header] }))

    for (const column of checked) {
      let count = 0
      let firstLine = null
      let firstValue = ''

      rawRows.forEach((row, index) => {
        const raw = String(row[column.name] ?? '').trim()
        if (raw === '') return
        const parsed = column.role === 'date' ? parseDateValue(raw) : parseNumberValue(raw)
        if (parsed === null) {
          count += 1
          if (firstLine === null) {
            firstLine = index + 2 // row 1 of the file is the header
            firstValue = raw
          }
        }
      })

      if (count > 0) found.push({ ...column, count, firstLine, firstValue })
    }
    return found
  }, [headers, roles, rawRows])

  const canImport =
    status !== 'saving' &&
    activeColumns.length > 0 &&
    hasMeasure &&
    problems.length === 0 &&
    datasetName.trim() !== ''

  async function handleImport() {
    if (!canImport) return

    setStatus('saving')
    setError(null)
    let datasetId = null

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: created, error: createError } = await supabase
        .from('datasets')
        .insert({ user_id: user.id, name: datasetName.trim(), columns: activeColumns })
        .select('id')
        .single()
      if (createError) throw createError
      datasetId = created.id

      const rows = rawRows.map((row) => ({
        dataset_id: datasetId,
        user_id: user.id,
        data: normalizeRow(row, activeColumns),
      }))

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        setProgress(`Saving rows ${Math.min(i + CHUNK_SIZE, rows.length)} of ${rows.length}…`)
        const { error: insertError } = await supabase
          .from('dataset_rows')
          .insert(rows.slice(i, i + CHUNK_SIZE))
        if (insertError) throw insertError
      }

      router.push(`/datasets/${datasetId}`)
      router.refresh()
    } catch (err) {
      if (datasetId) {
        // Roll back: deleting the dataset also deletes any rows already saved.
        await supabase.from('datasets').delete().eq('id', datasetId)
      }
      setError(err.message || 'Something went wrong while saving. Nothing was kept, so you can try again.')
      setStatus('idle')
      setProgress('')
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
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">Add a dataset</h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-700)]">
            Upload any CSV. We work out what each column is, you confirm it, and nothing is saved
            until every value checks out.
          </p>
        </div>

        <div className={cardClass} style={cardStyle}>
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
            Up to {MAX_ROWS} rows and 10 MB. The first row must be column names. Dates need the
            format YYYY-MM-DD.
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
            <div className={cardClass} style={cardStyle}>
              <label
                htmlFor="dataset-name"
                className="block mb-2 text-sm font-medium text-[var(--color-neutral-800)]"
              >
                2. Name this dataset
              </label>
              <input
                id="dataset-name"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="w-full max-w-md border rounded px-3 py-2 text-[var(--color-neutral-900)]"
              />
            </div>

            <div className={cardClass} style={cardStyle}>
              <h2 className="mb-1 text-sm font-medium text-[var(--color-neutral-800)]">
                3. Confirm your columns
              </h2>
              <p className="mb-4 text-xs text-[var(--color-neutral-600)]">
                We guessed what each column is. Change any that are wrong. A measure is a number you
                want to add up, like revenue or cost. A category is something you group by, like a
                region or department.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
                      <th className="py-2 px-3 text-[var(--color-neutral-700)]">Column</th>
                      <th className="py-2 px-3 text-[var(--color-neutral-700)]">Example values</th>
                      <th className="py-2 px-3 text-[var(--color-neutral-700)]">What is it?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header, index) => (
                      <tr
                        key={header}
                        className="border-b"
                        style={{ borderColor: 'var(--color-neutral-100)' }}
                      >
                        <td className="py-2 px-3 font-medium text-[var(--color-neutral-900)]">
                          {header}
                        </td>
                        <td className="py-2 px-3 text-[var(--color-neutral-700)]">
                          {examples[header]}
                        </td>
                        <td className="py-2 px-3">
                          <label htmlFor={`role-${index}`} className="sr-only">
                            What kind of data is {header}?
                          </label>
                          <select
                            id={`role-${index}`}
                            value={roles[header] ?? 'category'}
                            onChange={(e) =>
                              setRoles((prev) => ({ ...prev, [header]: e.target.value }))
                            }
                            className="w-full border rounded px-3 py-2 bg-white text-[var(--color-neutral-900)]"
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {dateColumns.length > 1 && (
                <div className="mt-4">
                  <label
                    htmlFor="primary-date"
                    className="block mb-1 text-sm font-medium text-[var(--color-neutral-800)]"
                  >
                    Main date column (used for month-to-month comparisons)
                  </label>
                  <select
                    id="primary-date"
                    value={primary}
                    onChange={(e) => setPrimaryDate(e.target.value)}
                    className="w-full max-w-md border rounded px-3 py-2 bg-white text-[var(--color-neutral-900)]"
                  >
                    {dateColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={cardClass} style={cardStyle}>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-neutral-800)]">
                4. Check and import
              </h2>

              {!hasMeasure ? (
                <p role="alert" className="text-sm text-red-700">
                  Choose at least one Measure column, a number you want to add up such as revenue
                  or cost.
                </p>
              ) : problems.length > 0 ? (
                <div role="alert">
                  <p className="text-sm font-medium text-red-700">
                    Some values could not be read. Fix the file and upload it again, or change what
                    the column is above.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {problems.map((problem) => (
                      <li key={problem.name}>
                        {problem.name} ({ROLE_NAMES[problem.role]}): {problem.count} value
                        {problem.count === 1 ? '' : 's'} could not be read. First one is in row{' '}
                        {problem.firstLine}: “{problem.firstValue}”.{' '}
                        {problem.role === 'date'
                          ? 'Dates need the format YYYY-MM-DD.'
                          : 'A measure must be a number.'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p role="status" className="text-sm text-green-700">
                  All {rawRows.length} rows look good and are ready to import.
                </p>
              )}

              {hasMeasure && dateColumns.length === 0 && (
                <p className="mt-2 text-sm text-[var(--color-neutral-700)]">
                  No date column is selected. You can still import, but month-to-month comparisons
                  need a date.
                </p>
              )}

              <button
                type="button"
                onClick={handleImport}
                disabled={!canImport}
                className="mt-4 rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'saving' ? 'Importing…' : `Import ${rawRows.length} rows`}
              </button>
              {progress && (
                <p role="status" className="mt-2 text-sm text-[var(--color-neutral-700)]">
                  {progress}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
