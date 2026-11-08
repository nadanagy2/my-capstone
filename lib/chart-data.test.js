import { describe, it, expect } from 'vitest'
import { buildChart, describeMeasure, monthName, previousMonthKey, MAX_CATEGORIES } from './chart-data'

const columns = [
  { name: 'Date', role: 'date', primary: true },
  { name: 'Revenue', role: 'measure' },
  { name: 'Region', role: 'category' },
]

// August and September, both complete months.
const rows = [
  { Date: '2026-08-01', Revenue: 100, Region: 'West' },
  { Date: '2026-08-31', Revenue: 50, Region: 'East' },
  { Date: '2026-09-01', Revenue: 150, Region: 'West' },
  { Date: '2026-09-30', Revenue: 90, Region: 'East' },
]

describe('month helpers', () => {
  it('finds the previous calendar month, including across a year', () => {
    expect(previousMonthKey('2026-03')).toBe('2026-02')
    expect(previousMonthKey('2026-01')).toBe('2025-12')
  })

  it('formats month names', () => {
    expect(monthName('2026-09')).toBe('Sep 2026')
    expect(monthName('2026-09', true)).toBe('September 2026')
  })

  it('describes a measure', () => {
    expect(describeMeasure({ measure: 'Revenue', aggregation: 'sum' })).toBe('Total Revenue')
    expect(describeMeasure({ measure: 'Revenue', aggregation: 'avg' })).toBe('Average Revenue')
    expect(describeMeasure({ measure: 'Revenue', aggregation: 'count' })).toBe('Number of rows')
  })

  it('does not repeat the word Total when the column already starts with it', () => {
    expect(describeMeasure({ measure: 'Total Sales', aggregation: 'sum' })).toBe('Total Sales')
    expect(describeMeasure({ measure: 'Average Order', aggregation: 'avg' })).toBe('Average Order')
  })
})

describe('buildChart over time', () => {
  const result = buildChart(rows, columns, { measure: 'Revenue', aggregation: 'sum', groupBy: 'time' })

  it('totals each month', () => {
    expect(result.mode).toBe('time')
    expect(result.data.map((d) => d.value)).toEqual([150, 240])
    expect(result.data.map((d) => d.label)).toEqual(['Aug 2026', 'Sep 2026'])
  })

  it('compares the latest month with the previous one', () => {
    expect(result.selectedMonth).toBe('2026-09')
    expect(result.kpi.current).toBe(240)
    expect(result.kpi.previous).toBe(150)
    expect(result.kpi.change).toBeCloseTo(60)
  })

  it('shows a month with no data as a gap, not zero', () => {
    const gappy = [
      { Date: '2026-07-01', Revenue: 10, Region: 'West' },
      { Date: '2026-09-01', Revenue: 30, Region: 'West' },
    ]
    const out = buildChart(gappy, columns, { measure: 'Revenue', aggregation: 'sum', groupBy: 'time' })
    expect(out.data.map((d) => d.label)).toEqual(['Jul 2026', 'Aug 2026', 'Sep 2026'])
    expect(out.data[1].value).toBeNull()
  })
})

describe('buildChart by category', () => {
  const spec = { measure: 'Revenue', aggregation: 'sum', groupBy: 'Region', compare: true }

  it('compares each category with the previous month, largest first', () => {
    const out = buildChart(rows, columns, spec)
    expect(out.mode).toBe('category')
    expect(out.series.map((s) => s.label)).toEqual(['Sep 2026', 'Aug 2026'])
    expect(out.data).toEqual([
      { label: 'West', current: 150, previous: 100 },
      { label: 'East', current: 90, previous: 50 },
    ])
  })

  it('can focus on an earlier month', () => {
    const out = buildChart(rows, columns, { ...spec, compare: false, month: '2026-08' })
    expect(out.data).toEqual([
      { label: 'West', current: 100 },
      { label: 'East', current: 50 },
    ])
  })

  it('supports average and count', () => {
    const avg = buildChart(rows, columns, { ...spec, aggregation: 'avg', compare: false })
    expect(avg.data.find((d) => d.label === 'West').current).toBe(150)
    const count = buildChart(rows, columns, { ...spec, aggregation: 'count', compare: false })
    expect(count.data.find((d) => d.label === 'East').current).toBe(1)
  })

  it('keeps only the biggest categories and says how many were hidden', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      Date: '2026-09-01',
      Revenue: i + 1,
      Region: `R${i}`,
    }))
    const out = buildChart(many, columns, { ...spec, compare: false })
    expect(out.data).toHaveLength(MAX_CATEGORIES)
    expect(out.truncated).toEqual({ shown: MAX_CATEGORIES, total: 15 })
    expect(out.data[0].label).toBe('R14')
  })
})

describe('comparison edge cases', () => {
  it('reports no change when the previous month has no data', () => {
    const noAugust = [
      { Date: '2026-07-01', Revenue: 10, Region: 'West' },
      { Date: '2026-09-01', Revenue: 30, Region: 'West' },
    ]
    const out = buildChart(noAugust, columns, { measure: 'Revenue', aggregation: 'sum', groupBy: 'Region', compare: true })
    expect(out.kpi.previous).toBeNull()
    expect(out.kpi.change).toBeNull()
    expect(out.series).toHaveLength(1)
    expect(out.warnings.join(' ')).toMatch(/no data for August 2026/)
  })

  it('warns when the latest month is only partly covered', () => {
    const partial = [...rows, { Date: '2026-10-10', Revenue: 10, Region: 'West' }]
    const out = buildChart(partial, columns, { measure: 'Revenue', aggregation: 'sum', groupBy: 'time' })
    expect(out.selectedMonth).toBe('2026-10')
    expect(out.warnings.join(' ')).toMatch(/October 2026 only has data through day 10 of 31/)
  })

  it('does not warn when the partial month is not involved', () => {
    const partial = [...rows, { Date: '2026-10-10', Revenue: 10, Region: 'West' }]
    const out = buildChart(partial, columns, { measure: 'Revenue', aggregation: 'sum', groupBy: 'Region', compare: true, month: '2026-08' })
    expect(out.warnings.join(' ')).not.toMatch(/partial month/)
  })

  it('works without a date column and offers no comparison', () => {
    const noDate = [{ name: 'Revenue', role: 'measure' }, { name: 'Region', role: 'category' }]
    const plain = [
      { Revenue: 5, Region: 'West' },
      { Revenue: 7, Region: 'West' },
    ]
    const out = buildChart(plain, noDate, { measure: 'Revenue', aggregation: 'sum', groupBy: 'Region', compare: true })
    expect(out.kpi).toBeNull()
    expect(out.data).toEqual([{ label: 'West', current: 12 }])
    expect(out.series).toEqual([{ key: 'current', label: 'All data' }])
  })
})
