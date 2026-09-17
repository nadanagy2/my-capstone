import { describe, it, expect } from 'vitest'
import { querySales, salesRecords } from './sales-data'

describe('querySales', () => {
  it('returns all records with no filters', () => {
    const result = querySales({})
    expect(result.rows.length).toBe(salesRecords.length)
    expect(result.groupedBy).toBe('none')
  })

  it('correctly sums total revenue and orders across all records', () => {
    const result = querySales({})
    const expectedRevenue = salesRecords.reduce((sum, r) => sum + r.revenue, 0)
    const expectedOrders = salesRecords.reduce((sum, r) => sum + r.orders, 0)

    expect(result.totalRevenue).toBe(expectedRevenue)
    expect(result.totalOrders).toBe(expectedOrders)
  })

  it('filters by category correctly (case-insensitive)', () => {
    const result = querySales({ category: 'electronics' })
    expect(result.rows.every((r) => r.category === 'Electronics')).toBe(true)
    expect(result.rows.length).toBeGreaterThan(0)
  })

  it('returns an empty result for a category with no matches', () => {
    const result = querySales({ category: 'Nonexistent' })
    expect(result.rows).toEqual([])
    expect(result.totalRevenue).toBe(0)
    expect(result.totalOrders).toBe(0)
  })

  it('filters by date range correctly', () => {
    const result = querySales({ startDate: '2026-08-10', endDate: '2026-08-12' })
    expect(result.rows.every((r) => r.date >= '2026-08-10' && r.date <= '2026-08-12')).toBe(
      true
    )
  })

  it('groups by category and sorts by revenue descending', () => {
    const result = querySales({ groupBy: 'category' })
    expect(result.groupedBy).toBe('category')

    // Confirm the rows are actually sorted by revenue, descending.
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i - 1].revenue).toBeGreaterThanOrEqual(result.rows[i].revenue)
    }
  })

  it('groups by region and includes every distinct region present in the data', () => {
    const result = querySales({ groupBy: 'region' })
    const expectedRegions = new Set(salesRecords.map((r) => r.region))
    const resultRegions = new Set(result.rows.map((r) => r.key))

    expect(resultRegions).toEqual(expectedRegions)
  })
})
