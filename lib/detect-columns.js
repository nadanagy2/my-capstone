// Pure helpers for reading an arbitrary CSV: parse values and guess what each
// column is. No database, no React, so it is easy to unit test.

// Accepts YYYY-MM-DD, optionally followed by a time (e.g. 2026-09-01T10:30:00Z).
const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/

// Column names that hold numbers but are labels, not amounts to add up.
const LABEL_LIKE_NAME = /(^|[^a-z])(id|code|zip|postal|phone|year)([^a-z]|$)/i

const SAMPLE_SIZE = 200

// A column is treated as a date or a number when at least this share of its
// non-empty values parse. This is deliberately lenient: a column that is mostly
// dates with a few bad entries should still be validated as dates, so the bad
// values get reported instead of silently turning the column into plain text.
const MIN_SHARE = 0.7

/** Returns "YYYY-MM-DD" for a valid calendar date, or null. */
export function parseDateValue(value) {
  const text = String(value ?? '').trim()
  if (!DATE_PATTERN.test(text)) return null
  const day = text.slice(0, 10)
  const parsed = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
    return null
  }
  return day
}

/** Returns a number for values like 4200, $4,200.50 or (1,200), or null. */
export function parseNumberValue(value) {
  let text = String(value ?? '').trim()
  if (text === '') return null

  let negative = false
  if (/^\(.*\)$/.test(text)) {
    negative = true
    text = text.slice(1, -1)
  }

  text = text.replace(/[$€£,\s]/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null

  const number = Number(text)
  if (!Number.isFinite(number)) return null
  return negative ? -number : number
}

/**
 * Guess a role for every column: "date", "measure" (a number to add up) or
 * "category" (text to group by). A column needs at least MIN_SHARE of its
 * non-empty values to parse before it is treated as a date or a number.
 */
export function detectColumns(headers, rows) {
  return headers.map((name) => {
    const sample = []
    for (const row of rows) {
      const raw = String(row[name] ?? '').trim()
      if (raw !== '') sample.push(raw)
      if (sample.length >= SAMPLE_SIZE) break
    }

    if (sample.length === 0) return { name, role: 'category' }

    const dateShare = sample.filter((v) => parseDateValue(v) !== null).length / sample.length
    if (dateShare >= MIN_SHARE) return { name, role: 'date' }

    const numberShare = sample.filter((v) => parseNumberValue(v) !== null).length / sample.length
    if (numberShare >= MIN_SHARE && !LABEL_LIKE_NAME.test(name)) {
      return { name, role: 'measure' }
    }

    return { name, role: 'category' }
  })
}
