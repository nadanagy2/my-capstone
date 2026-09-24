import { describe, it, expect } from 'vitest'
import { aggregateSales } from './sales-data'

// Fixed sample data, standing in for what would normally come from the
// database. This is intentionally the same shape as real Supabase rows.
const sampleRows = [
  { id: '1', date: '2026-08-01', revenue: 4200, orders: 38, category: 'Electronics', region: 'West' },
  { id: '2', date: '2026-08-02', revenue: 3100, orders: 29, category: 'Apparel', region: 'East' },
  { id: '3', date: '2026-08-03', revenue: 5600, orders: 51, category: 'Electronics', region: 'West' },
]

describe('aggregateSales', () => {
  it('returns all rows unmodified with no grouping', () => {
    const result = aggregateSales(sampleRows, 'none')
    expect(result.rows).toEqual(sampleRows)
    expect(result.groupedBy).toBe('none')
  })

  it('correctly sums total revenue and orders', () => {
    const result = aggregateSales(sampleRows, 'none')
    expect(result.totalRevenue).toBe(4200 + 3100 + 5600)
    expect(result.totalOrders).toBe(38 + 29 + 51)
  })

  it('groups by category and sorts by revenue descending', () => {
    const result = aggregateSales(sampleRows, 'category')
    expect(result.groupedBy).toBe('category')

    const electronics = result.rows.find((r) => r.key === 'Electronics')
    const apparel = result.rows.find((r) => r.key === 'Apparel')

    expect(electronics.revenue).toBe(4200 + 5600)
    expect(apparel.revenue).toBe(3100)

    // Confirm sort order: Electronics (9800) should come before Apparel (3100).
    expect(result.rows[0].key).toBe('Electronics')
  })

  it('groups by region and includes every distinct region present', () => {
    const result = aggregateSales(sampleRows, 'region')
    const regionKeys = result.rows.map((r) => r.key)
    expect(new Set(regionKeys)).toEqual(new Set(['West', 'East']))
  })

  it('returns a safe empty result for an empty input array', () => {
    const result = aggregateSales([], 'none')
    expect(result.rows).toEqual([])
    expect(result.totalRevenue).toBe(0)
    expect(result.totalOrders).toBe(0)
  })

  it('handles grouping on an empty input array without error', () => {
    const result = aggregateSales([], 'category')
    expect(result.rows).toEqual([])
    expect(result.groupedBy).toBe('category')
  })
})
