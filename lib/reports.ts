import type { ProgressLog } from './types'

export interface ReportDataPoint {
  date: string
  value: number
}

export interface ReportData {
  label: string
  unit: string
  data: ReportDataPoint[]
  average: number
  trend: 'up' | 'down' | 'flat'
  min: number
  max: number
}

export function buildProgressReport(
  logs: ProgressLog[],
  field: keyof ProgressLog,
  label: string,
  unit: string
): ReportData {
  const points: ReportDataPoint[] = logs
    .filter(l => l[field] !== null && l[field] !== undefined)
    .map(l => ({ date: l.logged_at.split('T')[0], value: Number(l[field]) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const values = points.map(p => p.value)
  const average = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 0

  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (values.length >= 2) {
    const first = values.slice(0, Math.ceil(values.length / 2)).reduce((s, v) => s + v, 0) / Math.ceil(values.length / 2)
    const last = values.slice(Math.floor(values.length / 2)).reduce((s, v) => s + v, 0) / Math.ceil(values.length / 2)
    if (last > first * 1.02) trend = 'up'
    else if (last < first * 0.98) trend = 'down'
  }

  return { label, unit, data: points, average: parseFloat(average.toFixed(1)), trend, min, max }
}

export function buildNutritionReport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs: any[],
  field: string,
  label: string,
  unit: string
): ReportData {
  const points: ReportDataPoint[] = logs
    .filter(l => l[field] !== null && l[field] !== undefined)
    .map(l => ({ date: l.log_date || l.logged_at?.split('T')[0], value: Number(l[field]) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const values = points.map(p => p.value)
  const average = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 0

  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (values.length >= 2) {
    const first = values.slice(0, Math.ceil(values.length / 2)).reduce((s, v) => s + v, 0) / Math.ceil(values.length / 2)
    const last = values.slice(Math.floor(values.length / 2)).reduce((s, v) => s + v, 0) / Math.ceil(values.length / 2)
    if (last > first * 1.02) trend = 'up'
    else if (last < first * 0.98) trend = 'down'
  }

  return { label, unit, data: points, average: parseFloat(average.toFixed(1)), trend, min, max }
}
