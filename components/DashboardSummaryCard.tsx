import MacroRing from './MacroRing'
import MacroProgressBars from './MacroProgressBars'

interface Props {
  calories: number
  caloriesTarget: number
  protein: number
  proteinTarget: number
  carbs: number
  carbsTarget: number
  fat: number
  fatTarget: number
  waterOz?: number
  waterTarget?: number
  fiber?: number
  fiberTarget?: number
}

export default function DashboardSummaryCard({
  calories, caloriesTarget,
  protein, proteinTarget,
  carbs, carbsTarget,
  fat, fatTarget,
  waterOz = 0, waterTarget = 64,
  fiber, fiberTarget,
}: Props) {
  const waterPct = waterTarget > 0 ? Math.min((waterOz / waterTarget) * 100, 100) : 0

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-2xl shadow-2xl overflow-hidden text-white">
      <div className="px-5 py-5 flex items-center gap-5">
        <div className="flex-shrink-0">
          <MacroRing
            value={calories}
            max={caloriesTarget}
            color="#10b981"
            size={104}
            label={`${Math.round(calories)}`}
            sublabel="cal"
          />
        </div>
        <div className="flex-1 min-w-0">
          <MacroProgressBars
            protein={protein} proteinTarget={proteinTarget}
            carbs={carbs} carbsTarget={carbsTarget}
            fat={fat} fatTarget={fatTarget}
          />
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-3 grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-blue-300">Water</span>
            <span className="font-bold text-white/50">{Math.round(waterOz)} / {waterTarget} oz</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700" style={{ width: `${waterPct}%` }} />
          </div>
        </div>
        <div className="text-right self-center">
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wide">Fiber</p>
          <p className="font-bold text-emerald-300 text-sm">
            {Math.round(fiber ?? 0)}{fiberTarget ? ` / ${Math.round(fiberTarget)}` : ''} g
          </p>
        </div>
      </div>
    </div>
  )
}
