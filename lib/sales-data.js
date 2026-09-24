import { createSupabaseServerClient } from './supabase-server'

/**
 * Pure aggregation logic, extracted from the database-fetching code so it
 * can be unit tested without needing a real database connection or a
 * logged-in user. Takes an already-fetched array of rows and computes
 * totals and (optionally) grouping — no side effects, no I/O.
 *
 * @param {Array<object>} rows - raw sales rows already fetched from the DB
 * @param {string} [groupBy] - "category" | "region" | "none"
 */
export function aggregateSales(rows, groupBy = 'none') {
  if (groupBy === 'category' || groupBy === 'region') {
    const groups = {}
    for (const row of rows) {
      const key = row[groupBy]
      if (!groups[key]) {
        groups[key] = { key, revenue: 0, orders: 0 }
      }
      groups[key].revenue += Number(row.revenue)
      groups[key].orders += Number(row.orders)
    }
    return {
      rows: Object.values(groups).sort((a, b) => b.revenue - a.revenue),
      totalRevenue: rows.reduce((sum, r) => sum + Number(r.revenue), 0),
      totalOrders: rows.reduce((sum, r) => sum + Number(r.orders), 0),
      groupedBy: groupBy,
    }
  }

  return {
    rows,
    totalRevenue: rows.reduce((sum, r) => sum + Number(r.revenue), 0),
    totalOrders: rows.reduce((sum, r) => sum + Number(r.orders), 0),
    groupedBy: 'none',
  }
}

/**
 * Query the user's real sales data from Supabase, with simple filters and
 * aggregation. Must be called from a Server Component, route handler, or
 * server action (it reads the logged-in user from cookies server-side).
 *
 * @param {object} params
 * @param {string} [params.startDate] - inclusive ISO date, e.g. "2026-08-01"
 * @param {string} [params.endDate] - inclusive ISO date
 * @param {string} [params.category] - filter to one category, if provided
 * @param {string} [params.groupBy] - "category" | "region" | "none"
 */
export async function querySales({ startDate, endDate, category, groupBy = 'none' } = {}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // No logged-in user: return an empty, safe result rather than throwing,
    // so pages can decide how to handle "not signed in" themselves.
    return { rows: [], totalRevenue: 0, totalOrders: 0, groupedBy: 'none' }
  }

  let query = supabase.from('sales_records').select('*').eq('user_id', user.id)

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  if (category) query = query.ilike('category', category)

  const { data, error } = await query.order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to query sales data: ${error.message}`)
  }

  return aggregateSales(data || [], groupBy)
}
