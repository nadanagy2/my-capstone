'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { buildChart, describeMeasure, monthName } from '@/lib/chart-data'

const CURRENT_COLOR = '#1d4ed8'
const PREVIOUS_COLOR = '#94a3b8'
const PIE_COLORS = ['#1d4ed8', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b']

const TIME_TYPES = [
  { value: 'column', label: 'Column' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
]
const CATEGORY_TYPES = [
  { value: 'column', label: 'Column' },
  { value: 'bar', label: 'Bar (horizontal)' },
  { value: 'pie', label: 'Pie' },
]

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })

function formatValue(value) {
  return value === null || value === undefined ? '—' : full.format(value)
}

const selectClass = 'w-full border rounded px-3 py-2 bg-white text-[var(--color-neutral-900)]'
const cardStyle = { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 text-sm font-medium text-[var(--color-neutral-800)]">
        {label}
      </label>
      {children}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="p-4 rounded-lg border border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
      <p className="text-sm text-[var(--color-neutral-700)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--color-neutral-900)]">{value}</p>
    </div>
  )
}

function ChartView({ result, type }) {
  const tick = { fontSize: 12, fill: 'var(--color-neutral-600)' }
  const axisLine = { stroke: 'var(--color-neutral-200)' }
  const margin = { top: 10, right: 10, left: 0, bottom: 0 }
  const tooltip = (
    <Tooltip
      formatter={(value) => formatValue(value)}
      contentStyle={{ borderRadius: 8, border: '1px solid var(--color-neutral-200)', fontSize: 13 }}
    />
  )
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
  const xAxis = <XAxis dataKey="label" tick={tick} axisLine={axisLine} tickLine={false} />
  const yAxis = (
    <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={(v) => compact.format(v)} />
  )

  if (result.mode === 'time') {
    const name = result.series[0].label
    if (type === 'line') {
      return (
        <LineChart data={result.data} margin={margin}>
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          <Line type="monotone" dataKey="value" name={name} stroke={CURRENT_COLOR} strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      )
    }
    if (type === 'area') {
      return (
        <AreaChart data={result.data} margin={margin}>
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          <Area type="monotone" dataKey="value" name={name} stroke={CURRENT_COLOR} fill={CURRENT_COLOR} fillOpacity={0.15} strokeWidth={2.5} />
        </AreaChart>
      )
    }
    return (
      <BarChart data={result.data} margin={margin}>
        {grid}
        {xAxis}
        {yAxis}
        {tooltip}
        <Bar dataKey="value" name={name} fill={CURRENT_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    )
  }

  if (type === 'pie') {
    const slices = result.data.filter((item) => item.current > 0)
    return (
      <PieChart>
        <Pie data={slices} dataKey="current" nameKey="label" outerRadius={110}>
          {slices.map((item, index) => (
            <Cell key={item.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        {tooltip}
        <Legend />
      </PieChart>
    )
  }

  const bars = result.series.map((series) => (
    <Bar
      key={series.key}
      dataKey={series.key}
      name={series.label}
      fill={series.key === 'current' ? CURRENT_COLOR : PREVIOUS_COLOR}
      radius={type === 'bar' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
    />
  ))

  if (type === 'bar') {
    return (
      <BarChart data={result.data} layout="vertical" margin={margin}>
        {grid}
        <XAxis type="number" tick={tick} axisLine={axisLine} tickLine={false} tickFormatter={(v) => compact.format(v)} />
        <YAxis type="category" dataKey="label" width={120} tick={tick} axisLine={false} tickLine={false} />
        {tooltip}
        {result.series.length > 1 && <Legend />}
        {bars}
      </BarChart>
    )
  }

  return (
    <BarChart data={result.data} margin={margin}>
      {grid}
      {xAxis}
      {yAxis}
      {tooltip}
      {result.series.length > 1 && <Legend />}
      {bars}
    </BarChart>
  )
}

export default function ChartBuilder({ columns, rows }) {
  const measureColumns = columns.filter((column) => column.role === 'measure')
  const categoryColumns = columns.filter((column) => column.role === 'category')
  const hasDate = columns.some((column) => column.role === 'date')

  const [aggregation, setAggregation] = useState(measureColumns.length > 0 ? 'sum' : 'count')
  const [measure, setMeasure] = useState(measureColumns[0]?.name ?? '')
  const [groupBy, setGroupBy] = useState(hasDate ? 'time' : (categoryColumns[0]?.name ?? ''))
  const [chartType, setChartType] = useState('column')
  const [month, setMonth] = useState('')
  const [compare, setCompare] = useState(true)

  const isTime = groupBy === 'time'
  const allowedTypes = isTime ? TIME_TYPES : CATEGORY_TYPES
  const type = allowedTypes.some((option) => option.value === chartType) ? chartType : 'column'
  const canCompare = !isTime && type !== 'pie' && hasDate
  const comparing = canCompare && compare

  const result = useMemo(
    () => buildChart(rows, columns, { measure, aggregation, groupBy, month, compare: comparing }),
    [rows, columns, measure, aggregation, groupBy, month, comparing]
  )

  if (!hasDate && categoryColumns.length === 0) {
    return (
      <p className="text-sm text-[var(--color-neutral-700)]">
        This dataset needs a date column or a category column before it can be charted.
      </p>
    )
  }

  const spec = { measure, aggregation, groupBy }
  const title = `${describeMeasure(spec)} ${isTime ? 'by month' : `by ${groupBy}`}`
  const ariaLabel = `${type} chart: ${title}${
    result.series.length > 1 ? `, ${result.series.map((s) => s.label).join(' compared with ')}` : ''
  }`
  const pieData = type === 'pie' && !isTime ? result.data.filter((item) => item.current > 0) : result.data

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field id="cb-aggregation" label="How to calculate">
          <select
            id="cb-aggregation"
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className={selectClass}
          >
            {measureColumns.length > 0 && <option value="sum">Total (sum)</option>}
            {measureColumns.length > 0 && <option value="avg">Average</option>}
            <option value="count">Number of rows</option>
          </select>
        </Field>

        {aggregation !== 'count' && (
          <Field id="cb-measure" label="Measure">
            <select
              id="cb-measure"
              value={measure}
              onChange={(e) => setMeasure(e.target.value)}
              className={selectClass}
            >
              {measureColumns.map((column) => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field id="cb-groupby" label="Group by">
          <select
            id="cb-groupby"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className={selectClass}
          >
            {hasDate && <option value="time">Time (by month)</option>}
            {categoryColumns.map((column) => (
              <option key={column.name} value={column.name}>
                {column.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="cb-type" label="Chart type">
          <select
            id="cb-type"
            value={type}
            onChange={(e) => setChartType(e.target.value)}
            className={selectClass}
          >
            {allowedTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {hasDate && result.months.length > 0 && (
          <Field id="cb-month" label="Month to focus on">
            <select
              id="cb-month"
              value={result.selectedMonth}
              onChange={(e) => setMonth(e.target.value)}
              className={selectClass}
            >
              {[...result.months].reverse().map((key) => (
                <option key={key} value={key}>
                  {monthName(key, true)}
                </option>
              ))}
            </select>
          </Field>
        )}

        {canCompare && (
          <div className="flex items-end">
            <div className="flex items-center gap-2 pb-2">
              <input
                id="cb-compare"
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              <label htmlFor="cb-compare" className="text-sm text-[var(--color-neutral-800)]">
                Compare with the previous month
              </label>
            </div>
          </div>
        )}
      </div>

      {result.kpi && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-neutral-800)]">
            {describeMeasure(spec)}: {result.kpi.currentLabel} compared with {result.kpi.previousLabel}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label={result.kpi.currentLabel} value={formatValue(result.kpi.current)} />
            <Stat
              label={result.kpi.previousLabel}
              value={result.kpi.previous === null ? 'No data' : formatValue(result.kpi.previous)}
            />
            <Stat
              label="Change"
              value={
                result.kpi.change === null
                  ? '—'
                  : `${result.kpi.change >= 0 ? '▲' : '▼'} ${Math.abs(result.kpi.change).toFixed(1)}%`
              }
            />
          </div>
        </div>
      )}

      {result.warnings.map((warning) => (
        <p
          key={warning}
          role="note"
          className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-900"
        >
          {warning}
        </p>
      ))}

      <h3 className="mt-6 text-sm font-semibold text-[var(--color-neutral-800)]">{title}</h3>

      {pieData.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-neutral-700)]">
          Nothing to chart for this selection.
        </p>
      ) : (
        <div role="img" aria-label={ariaLabel} className="mt-3 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartView result={result} type={type} />
          </ResponsiveContainer>
        </div>
      )}

      {result.truncated && (
        <p className="mt-2 text-xs text-[var(--color-neutral-600)]">
          Showing the top {result.truncated.shown} of {result.truncated.total} groups.
        </p>
      )}

      {pieData.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-brand-600)]">
            Show the numbers as a table
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-neutral-200)' }}>
                  <th className="py-2 px-3 text-[var(--color-neutral-700)]">
                    {isTime ? 'Month' : groupBy}
                  </th>
                  {result.series.map((series) => (
                    <th key={series.key} className="py-2 px-3 text-right text-[var(--color-neutral-700)]">
                      {series.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((item) => (
                  <tr
                    key={item.label}
                    className="border-b"
                    style={{ borderColor: 'var(--color-neutral-100)' }}
                  >
                    <td className="py-2 px-3 text-[var(--color-neutral-900)]">{item.label}</td>
                    {result.series.map((series) => (
                      <td key={series.key} className="py-2 px-3 text-right text-[var(--color-neutral-900)]">
                        {formatValue(item[series.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
