import { tool } from 'ai'
import { z } from 'zod'
import { querySales } from './sales-data'

/**
 * Tool contract: querySales
 *
 * Lets the assistant query the logged-in user's own sales data to answer
 * questions about revenue and order volume. It only ever sees that user's
 * rows (enforced in querySales and by Row Level Security in the database).
 *
 * Input schema (all fields optional):
 *   - startDate?: string  (ISO date, e.g. "2026-08-01") — inclusive lower bound
 *   - endDate?: string    (ISO date) — inclusive upper bound
 *   - category?: string   a category name from the user's data (case-insensitive)
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
 * An empty call returns all of the user's data, so the model always has a
 * safe default to fall back on.
 */
export const querySalesTool = tool({
  description:
    "Query the logged-in user's own sales data for revenue and order figures. Supports filtering by date range and category, and optional grouping by category or region. Use this whenever the user asks a question about their sales, revenue, or orders.",
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
      .describe("Filter to a single category, using a category name that exists in the user's own data (matching is case-insensitive). If you are not sure which categories exist, call this tool with groupBy set to category first. Omit to include all categories."),
    groupBy: z
      .enum(['category', 'region', 'none'])
      .optional()
      .describe('Aggregate results by category or region, or "none" for raw daily rows. Defaults to "none".'),
  }),
  execute: async ({ startDate, endDate, category, groupBy }) => {
    // Intentionally allowed to throw if querySales fails — the chat renders
    // that as a designed error state rather than crashing.
    return querySales({ startDate, endDate, category, groupBy })
  },
})