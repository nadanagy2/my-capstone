/**
 * Mock sales data for the "Ask Your Data" dashboard.
 *
 * This stands in for a real database/API in this skeleton stage — the tool
 * in app/api/chat/route.js queries this array the same way it would query
 * a real backend later, so swapping this out for a real data source later
 * shouldn't require changing the tool's shape.
 */
export const salesRecords = [
  { date: '2026-08-01', revenue: 4200, orders: 38, category: 'Electronics', region: 'West' },
  { date: '2026-08-02', revenue: 3100, orders: 29, category: 'Apparel', region: 'East' },
  { date: '2026-08-03', revenue: 5600, orders: 51, category: 'Electronics', region: 'West' },
  { date: '2026-08-04', revenue: 2200, orders: 20, category: 'Home', region: 'South' },
  { date: '2026-08-05', revenue: 6100, orders: 58, category: 'Electronics', region: 'East' },
  { date: '2026-08-06', revenue: 1800, orders: 15, category: 'Apparel', region: 'South' },
  { date: '2026-08-07', revenue: 3900, orders: 34, category: 'Home', region: 'West' },
  { date: '2026-08-08', revenue: 7200, orders: 63, category: 'Electronics', region: 'West' },
  { date: '2026-08-09', revenue: 2600, orders: 24, category: 'Apparel', region: 'East' },
  { date: '2026-08-10', revenue: 4400, orders: 40, category: 'Home', region: 'South' },
  { date: '2026-08-11', revenue: 5100, orders: 46, category: 'Electronics', region: 'East' },
  { date: '2026-08-12', revenue: 1500, orders: 12, category: 'Apparel', region: 'West' },
  { date: '2026-08-13', revenue: 3300, orders: 30, category: 'Home', region: 'East' },
  { date: '2026-08-14', revenue: 8900, orders: 77, category: 'Electronics', region: 'West' },
  { date: '2026-08-15', revenue: 2100, orders: 19, category: 'Apparel', region: 'South' },
]

/**
 * Query the mock sales data with simple filters and aggregation.
 *
 * @param {object} params
 * @param {string} [params.startDate] - inclusive ISO date, e.g. "2026-08-01"
 * @param {string} [params.endDate] - inclusive ISO date
 * @param {string} [params.category] - filter to one category, if provided
 * @param {string} [params.groupBy] - "category" | "region" | "none"
 */
export function querySales({ startDate, endDate, category, groupBy = 'none' }) {
  let rows = salesRecords

  if (startDate) {
    rows = rows.filter((r) => r.date >= startDate)
  }
  if (endDate) {
    rows = rows.filter((r) => r.date <= endDate)
  }
  if (category) {
    rows = rows.filter((r) => r.category.toLowerCase() === category.toLowerCase())
  }

  if (groupBy === 'category' || groupBy === 'region') {
    const groups = {}
    for (const row of rows) {
      const key = row[groupBy]
      if (!groups[key]) {
        groups[key] = { key, revenue: 0, orders: 0 }
      }
      groups[key].revenue += row.revenue
      groups[key].orders += row.orders
    }
    return {
      rows: Object.values(groups).sort((a, b) => b.revenue - a.revenue),
      totalRevenue: rows.reduce((sum, r) => sum + r.revenue, 0),
      totalOrders: rows.reduce((sum, r) => sum + r.orders, 0),
      groupedBy: groupBy,
    }
  }

  return {
    rows,
    totalRevenue: rows.reduce((sum, r) => sum + r.revenue, 0),
    totalOrders: rows.reduce((sum, r) => sum + r.orders, 0),
    groupedBy: 'none',
  }
}
