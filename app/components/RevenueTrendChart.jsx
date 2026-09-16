'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function RevenueTrendChart({ data }) {
  const chartData = data.map((record) => ({
    date: record.date.slice(5), // MM-DD
    revenue: record.revenue,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
            axisLine={{ stroke: 'var(--color-neutral-200)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--color-neutral-200)',
              fontSize: '13px',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-brand-600)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--color-brand-600)', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
