import { tool } from 'ai'
import { z } from 'zod'
import { querySales } from './sales-data'

/**
 * Tool contract: querySales
 *
 * Lets the assistant query the mock sales dataset to answer manager
 * questions about revenue and order volume.
 *
 * Input schema:
 *   - startDate?: string  (ISO date, e.g. "2026-08-01") — inclusive lower bound
 *   - endDate?: string    (ISO date) — inclusive upper bound
 *   - category?: string   ("Electronics" | "Apparel" | "Home") — filter to one category
 *   - groupBy?: "category" | "region" | "none" — how to aggregate results
 *
 * Return shape:
 *   {
 *     rows: Array<{ date, revenue, orders, category, region }>   // when groupBy is "none"
 *         | Array<{ key, revenue, orders }>                       // when grouped
 *     totalRevenue: number
 *     totalOrders: number
 *     groupedBy: "none" | "category" | "region"
 *   }
 *
 * Every field is optional except none are required — an empty call returns
 * the full dataset, so the model always has a safe default to fall back on.
 */
export const querySalesTool = tool({
  description:
    'Query the mock sales dataset for revenue and order data. Supports filtering by date range and category, and optional grouping by category or region. Use this whenever the user asks a question about sales, revenue, or orders.',
  inputSchema: z.object({
    startDate: z
      .string()
      .optional()
      .describe('Inclusive start date in YYYY-MM-DD format, e.g. "2026-08-01". Omit to include all dates from the beginning.'),
    endDate: z
      .string()
      .optional()
      .describe('Inclusive end date in YYYY-MM-DD format. Omit to include all dates up to the most recent.'),
    category: z
      .string()
      .optional()
      .describe('Filter to one category: "Electronics", "Apparel", or "Home". Omit to include all categories.'),
    groupBy: z
      .enum(['category', 'region', 'none'])
      .optional()
      .describe('Aggregate results by category or region, or "none" for raw daily rows. Defaults to "none".'),
  }),
  execute: async ({ startDate, endDate, category, groupBy }) => {
    // Intentionally allowed to throw if querySales fails (e.g. bad input
    // slipping past the schema) — the client renders this as a designed
    // error state rather than crashing, per the assignment's requirement.
    return querySales({ startDate, endDate, category, groupBy })
  },
})
