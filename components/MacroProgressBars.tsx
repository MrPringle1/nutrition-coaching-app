interface Props {
  protein: number
  proteinTarget: number
  carbs: number
  carbsTarget: number
  fat: number
  fatTarget: number
  fiber?: number
  fiberTarget?: number
}

interface BarProps {
  label: string
  value: number
  target: number
  dot: string
  fill: string
}

function Bar({ label, value, target, dot, fill }: BarProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const over = value > target * 1.05
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="flex items-center gap-1.5 font-semibold text-white/60">
          <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
          {label}
        </span>
        <span className={`font-bold ${over ? 'text-rose-400' : 'text-white/40'}`}>
          <span className={over ? 'text-rose-400' : 'text-white'}>{Math.round(value)}</span>g / {Math.round(target)}g {over && 'over'}
        </span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? '#f43f5e' : fill }}
        />
      </div>
    </div>
  )
}

export default function MacroProgressBars({
  protein, proteinTarget, carbs, carbsTarget, fat, fatTarget, fiber, fiberTarget,
}: Props) {
  return (
    <div className="space-y-3">
      <Bar label="Protein" value={protein} target={proteinTarget} dot="#a855f7" fill="linear-gradient(90deg,#a855f7,#c084fc)" />
      <Bar label="Carbs" value={carbs} target={carbsTarget} dot="#f59e0b" fill="linear-gradient(90deg,#f59e0b,#fbbf24)" />
      <Bar label="Fat" value={fat} target={fatTarget} dot="#06b6d4" fill="linear-gradient(90deg,#06b6d4,#22d3ee)" />
      {fiber !== undefined && fiberTarget !== undefined && (
        <Bar label="Fiber" value={fiber} target={fiberTarget} dot="#10b981" fill="linear-gradient(90deg,#10b981,#34d399)" />
      )}
    </div>
  )
}
