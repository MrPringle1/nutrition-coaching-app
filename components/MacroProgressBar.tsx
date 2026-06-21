import { getMacroPercentage } from '@/lib/nutrition'

interface MacroBarProps {
  label: string
  consumed: number
  target: number
  unit?: string
  color: string
}

// Premium macro progress bar — tall with label + values + gradient fill
export default function MacroProgressBar({ label, consumed, target, unit = 'g', color }: MacroBarProps) {
  const pct = target ? Math.min(getMacroPercentage(consumed, target), 100) : 0
  const over = consumed > target

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-500">{label}</span>
        <span className="text-xs font-bold text-slate-700">
          <span className={over ? 'text-rose-500' : ''}>{Math.round(consumed)}</span>
          <span className="text-slate-400 font-medium"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-rose-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface MacroPillProps {
  label: string
  value: number
  unit?: string
  color: string
  sub?: string
}

export function MacroPill({ label, value, unit = 'g', color, sub }: MacroPillProps) {
  return (
    <div className="text-center">
      <p className={`font-extrabold text-sm ${color}`}>{Math.round(value)}{unit}</p>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
      {sub && <p className="text-[9px] text-slate-300">{sub}</p>}
    </div>
  )
}
