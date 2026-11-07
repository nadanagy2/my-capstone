import { describe, it, expect } from 'vitest'
import { detectColumns, parseDateValue, parseNumberValue } from './detect-columns'

describe('parseDateValue', () => {
  it('accepts ISO dates and ISO date-times', () => {
    expect(parseDateValue('2026-09-01')).toBe('2026-09-01')
    expect(parseDateValue('2026-09-01T10:30:00Z')).toBe('2026-09-01')
  })

  it('rejects other formats and impossible dates', () => {
    expect(parseDateValue('09/05/2026')).toBeNull()
    expect(parseDateValue('2026-02-31')).toBeNull()
    expect(parseDateValue('')).toBeNull()
  })
})

describe('parseNumberValue', () => {
  it('parses plain, currency and thousands-separated numbers', () => {
    expect(parseNumberValue('4200')).toBe(4200)
    expect(parseNumberValue('$4,200.50')).toBe(4200.5)
    expect(parseNumberValue('-15')).toBe(-15)
  })

  it('treats parentheses as negative', () => {
    expect(parseNumberValue('(1,200)')).toBe(-1200)
  })

  it('rejects text, percentages and blanks', () => {
    expect(parseNumberValue('abc')).toBeNull()
    expect(parseNumberValue('12%')).toBeNull()
    expect(parseNumberValue('')).toBeNull()
  })
})

describe('detectColumns', () => {
  const headers = ['Order Date', 'Revenue', 'Region', 'Order ID']
  const rows = [
    { 'Order Date': '2026-09-01', Revenue: '100', Region: 'West', 'Order ID': '1001' },
    { 'Order Date': '2026-09-02', Revenue: '$250.50', Region: 'East', 'Order ID': '1002' },
    { 'Order Date': '2026-09-03', Revenue: '75', Region: 'West', 'Order ID': '1003' },
  ]

  it('detects dates, measures and categories', () => {
    const roles = Object.fromEntries(detectColumns(headers, rows).map((c) => [c.name, c.role]))
    expect(roles['Order Date']).toBe('date')
    expect(roles.Revenue).toBe('measure')
    expect(roles.Region).toBe('category')
  })

  it('treats numeric ID columns as categories, not amounts', () => {
    const roles = Object.fromEntries(detectColumns(headers, rows).map((c) => [c.name, c.role]))
    expect(roles['Order ID']).toBe('category')
  })

  it('treats an empty column as a category', () => {
    const result = detectColumns(['Notes'], [{ Notes: '' }, { Notes: '' }])
    expect(result[0].role).toBe('category')
  })

  it('does not call a mostly-text column a measure', () => {
    const mostlyText = [
      ...Array.from({ length: 4 }, (_, i) => ({ Amount: String(i + 1) })),
      ...Array.from({ length: 6 }, () => ({ Amount: 'n/a' })),
    ]
    expect(detectColumns(['Amount'], mostlyText)[0].role).toBe('category')
  })

  it('keeps a mostly-numeric column as a measure so its bad values get flagged', () => {
    const mostlyNumbers = [
      ...Array.from({ length: 8 }, (_, i) => ({ Amount: String(i + 1) })),
      { Amount: 'abc' },
      { Amount: 'xyz' },
    ]
    expect(detectColumns(['Amount'], mostlyNumbers)[0].role).toBe('measure')
  })

  it('keeps a mostly-date column as a date so its bad values get flagged', () => {
    const mostlyDates = [
      { Day: '2026-10-01' },
      { Day: '09/05/2026' },
      { Day: '2026-10-03' },
      { Day: '2026-10-04' },
      { Day: '2026-10-05' },
    ]
    expect(detectColumns(['Day'], mostlyDates)[0].role).toBe('date')
  })
})
