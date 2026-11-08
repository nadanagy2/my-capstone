// Pure chart-building logic. Takes a dataset's rows and a "chart spec" and
// returns the numbers a chart needs. No React and no database, so it is easy to
// unit test, and the same spec could later be produced by the AI assistant.

export const MAX_CATEGORIES = 12

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "2026-09-14" -> "2026-09" */
export function monthKey(dateString) {
  if (typeof dateString !== 'string' || dateString.length < 7) return null
  return dateString.slice(0, 7)
}

/** The calendar month before this one: "2026-01" -> "2025-12". */
export function previousMonthKey(key) {
  const [year, month] = key.split('-').map(Number)
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}

function nextMonthKey(key) {
  const [year, month] = key.split('-').map(Number)
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
}

/** "2026-09" -> "Sep 2026" (or "September 2026" when long). */
export function monthName(key, long = false) {
  const [year, month] = key.split('-').map(Number)
  return `${(long ? MONTHS_LONG : MONTHS_SHORT)[month - 1]} ${year}`
}

function daysInMonth(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

// Every calendar month from first to last, so gaps in the data show as gaps.
function monthRange(first, last) {
  const keys = []
  for (let key = first; key <= last; key = nextMonthKey(key)) keys.push(key)
  return keys
}

/** A short title such as "Total Revenue" or "Number of rows". */
export function describeMeasure({ measure, aggregation }) {
  if (aggregation === 'count') return 'Number of rows'
  const prefix = aggregation === 'avg' ? 'Average' : 'Total'
  // Avoid "Total Total Sales" when the column name already says it.
  if (measure.toLowerCase().startsWith(prefix.toLowerCase())) return measure
  return `${prefix} ${measure}`
}

// Sum, average or count for a group of rows. Blanks are ignored.
function aggregateRows(rows, measure, aggregation) {
  if (aggregation === 'count') return rows.length
  const numbers = rows.map((row) => row[measure]).filter((value) => typeof value === 'number')
  if (numbers.length === 0) return aggregation === 'avg' ? null : 0
  const total = numbers.reduce((sum, value) => sum + value, 0)
  return aggregation === 'avg' ? total / numbers.length : total
}

function changePercent(current, previous) {
  if (current === null || previous === null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function findDateColumn(columns) {
  const dates = columns.filter((column) => column.role === 'date')
  return (dates.find((column) => column.primary) ?? dates[0])?.name ?? null
}

// If the data starts or stops partway through a month, comparing that month
// with a full one is misleading, so say so.
function partialMonthWarnings(dates, involvedMonths) {
  const sorted = [...dates].sort()
  const firstDate = sorted[0]
  const lastDate = sorted[sorted.length - 1]
  const firstMonth = monthKey(firstDate)
  const lastMonth = monthKey(lastDate)
  const firstDay = Number(firstDate.slice(8, 10))
  const lastDay = Number(lastDate.slice(8, 10))
  const lastMonthDays = daysInMonth(lastMonth)
  const warnings = []

  if (firstMonth === lastMonth) {
    if (involvedMonths.has(firstMonth) && (firstDay > 1 || lastDay < lastMonthDays)) {
      warnings.push(
        `${monthName(firstMonth, true)} only has data from day ${firstDay} to day ${lastDay} of ${lastMonthDays}, so it is a partial month and comparisons with a full month can mislead.`
      )
    }
    return warnings
  }

  if (firstDay > 1 && involvedMonths.has(firstMonth)) {
    warnings.push(
      `${monthName(firstMonth, true)} only has data from day ${firstDay}, so it is a partial month and comparisons with it can mislead.`
    )
  }
  if (lastDay < lastMonthDays && involvedMonths.has(lastMonth)) {
    warnings.push(
      `${monthName(lastMonth, true)} only has data through day ${lastDay} of ${lastMonthDays}, so it is a partial month and comparisons with a full month can mislead.`
    )
  }
  return warnings
}

/**
 * Build everything a chart needs.
 *
 * spec: {
 *   measure,      // name of a measure column (ignored when aggregation is "count")
 *   aggregation,  // "sum" | "avg" | "count"
 *   groupBy,      // "time" (by month) or the name of a category column
 *   month,        // "YYYY-MM" to focus on; defaults to the latest month in the data
 *   compare,      // true to compare the focus month with the previous month
 * }
 */
export function buildChart(rows, columns, spec) {
  const { measure, aggregation = 'sum', groupBy, month, compare = false } = spec
  const dateColumn = findDateColumn(columns)

  // Group rows by month once. "This month" is the latest month IN THE DATA,
  // not today's date, because a company may upload a file that ended months ago.
  const byMonth = new Map()
  if (dateColumn) {
    for (const row of rows) {
      const key = monthKey(row[dateColumn])
      if (!key) continue
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key).push(row)
    }
  }
  const months = [...byMonth.keys()].sort()
  const hasMonths = months.length > 0
  const selectedMonth = hasMonths ? (months.includes(month) ? month : months[months.length - 1]) : null
  const previousMonth = selectedMonth ? previousMonthKey(selectedMonth) : null
  const rowsIn = (key) => byMonth.get(key) ?? []

  const isTime = groupBy === 'time'
  const usesPrevious = isTime || compare

  const warnings = []
  if (hasMonths) {
    const involved = new Set([selectedMonth])
    if (usesPrevious) involved.add(previousMonth)
    const dates = [...byMonth.values()].flat().map((row) => row[dateColumn])
    warnings.push(...partialMonthWarnings(dates, involved))
  }

  // Headline numbers: the focus month against the month before it.
  let kpi = null
  if (hasMonths) {
    const current = aggregateRows(rowsIn(selectedMonth), measure, aggregation)
    const previousRows = rowsIn(previousMonth)
    const previous = previousRows.length > 0 ? aggregateRows(previousRows, measure, aggregation) : null
    kpi = {
      current,
      previous,
      change: changePercent(current, previous),
      currentLabel: monthName(selectedMonth),
      previousLabel: monthName(previousMonth),
    }
  }

  const base = { months, selectedMonth, previousMonth, kpi, warnings, truncated: null }

  // Over time: one point per month.
  if (isTime) {
    if (!hasMonths) return { ...base, mode: 'time', data: [], series: [] }
    const data = monthRange(months[0], months[months.length - 1]).map((key) => {
      const monthRows = rowsIn(key)
      return {
        key,
        label: monthName(key),
        value: monthRows.length > 0 ? aggregateRows(monthRows, measure, aggregation) : null,
      }
    })
    return { ...base, mode: 'time', data, series: [{ key: 'value', label: describeMeasure(spec) }] }
  }

  // By category: one bar per category, optionally against the previous month.
  if (!groupBy) return { ...base, mode: 'category', data: [], series: [] }

  const currentRows = hasMonths ? rowsIn(selectedMonth) : rows
  const previousRows = hasMonths && compare ? rowsIn(previousMonth) : []
  const comparing = compare && hasMonths && previousRows.length > 0

  if (compare && hasMonths && previousRows.length === 0) {
    warnings.push(
      `There is no data for ${monthName(previousMonth, true)}, so there is nothing to compare ${monthName(selectedMonth, true)} with.`
    )
  }

  const labelOf = (row) => {
    const value = row[groupBy]
    return value === null || value === undefined || value === '' ? '(blank)' : String(value)
  }
  const groupRows = (list) => {
    const groups = new Map()
    for (const row of list) {
      const label = labelOf(row)
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label).push(row)
    }
    return groups
  }
  const currentGroups = groupRows(currentRows)
  const previousGroups = groupRows(previousRows)
  const emptyValue = aggregation === 'avg' ? null : 0
  const valueFor = (groups, label) =>
    groups.has(label) ? aggregateRows(groups.get(label), measure, aggregation) : emptyValue

  const labels = [...new Set([...currentGroups.keys(), ...previousGroups.keys()])]
  let data = labels.map((label) => ({
    label,
    current: valueFor(currentGroups, label),
    ...(comparing ? { previous: valueFor(previousGroups, label) } : {}),
  }))
  data.sort(
    (a, b) => (b.current ?? -Infinity) - (a.current ?? -Infinity) || (b.previous ?? 0) - (a.previous ?? 0)
  )

  let truncated = null
  if (data.length > MAX_CATEGORIES) {
    truncated = { shown: MAX_CATEGORIES, total: data.length }
    data = data.slice(0, MAX_CATEGORIES)
  }

  const series = [{ key: 'current', label: hasMonths ? monthName(selectedMonth) : 'All data' }]
  if (comparing) series.push({ key: 'previous', label: monthName(previousMonth) })

  return { ...base, mode: 'category', data, series, truncated }
}
