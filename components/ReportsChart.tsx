import type { ReportDataPoint } from '@/lib/reports'

interface Props {
  data: ReportDataPoint[]
  label: string
  unit: string
  color?: string
  height?: number
}

export default function ReportsChart({ data, label, unit, color = '#22c55e', height = 200 }: Props) {
  const width = 600
  const padX = 40
  const padY = 24

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="font-semibold text-gray-700 text-sm">{label}</p>
        <p className="text-xs text-gray-400 mt-1">No data yet</p>
      </div>
    )
  }

  const values = data.map(d => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const avg = values.reduce((s, v) => s + v, 0) / values.length

  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const x = (i: number) => padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW)
  const y = (v: number) => padY + chartH - ((v - minV) / range) * chartH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padY + chartH} L ${x(0)} ${padY + chartH} Z`
  const avgY = y(avg)

  const labelStep = Math.max(1, Math.ceil(data.length / 6))
  const gradId = `grad-${label.replace(/\s/g, '')}`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-400">avg {avg.toFixed(1)} {unit}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Average dashed line */}
        <line x1={padX} y1={avgY} x2={width - padX} y2={avgY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 4" />
        <text x={width - padX} y={avgY - 4} textAnchor="end" className="fill-gray-400" fontSize="10">avg</text>

        {/* Area + line */}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill={color} />
        ))}

        {/* X axis labels */}
        {data.map((d, i) => (i % labelStep === 0 || i === data.length - 1) ? (
          <text key={`x${i}`} x={x(i)} y={height - 6} textAnchor="middle" className="fill-gray-400" fontSize="9">
            {d.date.slice(5)}
          </text>
        ) : null)}

        {/* Y axis min/max */}
        <text x={4} y={y(maxV) + 3} className="fill-gray-400" fontSize="9">{maxV}</text>
        <text x={4} y={y(minV) + 3} className="fill-gray-400" fontSize="9">{minV}</text>
      </svg>
    </div>
  )
}
