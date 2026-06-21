'use client'

// MacroSummaryCard — premium dark hero card
// Shows calorie ring + macro bars + nutrient pills
import type { MacroTotals, MacroTargets } from '@/lib/types'
import { getCalorieStatus } from '@/lib/nutrition'

interface Props {
  totals: MacroTotals
  targets: MacroTargets
  waterOz?: number
}

const STATUS_CONFIG = {
  on_track: { label: 'On Track', color: 'bg-emerald-400/15 text-emerald-300' },
  under: { label: 'Under Target', color: 'bg-amber-400/15 text-amber-300' },
  over: { label: 'Over Target', color: 'bg-rose-400/15 text-rose-300' },
  no_data: { label: 'No Data', color: 'bg-white/10 text-white/50' },
}

function MacroLine({ label, consumed, target, gradient }: { label: string; consumed: number; target: number; gradient: string }) {
  const pct = target ? Math.min((consumed / target) * 100, 100) : 0
  const over = consumed > target
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-white/70">{label}</span>
        <span className="text-xs font-bold text-white">
          <span className={over ? 'text-rose-300' : ''}>{Math.round(consumed)}</span>
          <span className="text-white/40 font-medium"> / {target}g</span>
        </span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-rose-400' : gradient}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Pill({ label, value, unit, accent }: { label: string; value: number; unit: string; accent: string }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
      <p className={`font-extrabold text-sm ${accent}`}>{Math.round(value)}<span className="text-[10px] font-medium text-white/40"> {unit}</span></p>
      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

export default function MacroSummaryCard({ totals, targets, waterOz = 0 }: Props) {
  const status = getCalorieStatus(totals.calories, targets.calories)
  const config = STATUS_CONFIG[status]

  // Calorie ring geometry
  const size = 100
  const r = 42
  const circ = 2 * Math.PI * r
  const calPct = targets.calories ? Math.min(totals.calories / targets.calories, 1) : 0
  const dash = calPct * circ

  return (
    <div className="rounded-2xl bg-[#111827] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-white/5 overflow-hidden relative">
      {/* green accent glow */}
      <div className="absolute -top-16 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Today&apos;s Intake</span>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${config.color}`}>{config.label}</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Calorie ring */}
          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg] absolute">
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
              <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="url(#calGrad)" strokeWidth="9"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-white font-black text-2xl leading-none">{Math.round(totals.calories)}</p>
              <p className="text-emerald-300/80 text-[10px] font-semibold mt-0.5">kcal</p>
            </div>
          </div>

          {/* Macro bars */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <MacroLine label="Protein" consumed={totals.protein} target={targets.protein} gradient="bg-gradient-to-r from-purple-400 to-purple-600" />
            <MacroLine label="Carbs" consumed={totals.carbs} target={targets.carbs} gradient="bg-gradient-to-r from-amber-400 to-amber-600" />
            <MacroLine label="Fat" consumed={totals.fat} target={targets.fat} gradient="bg-gradient-to-r from-cyan-400 to-cyan-600" />
          </div>
        </div>
      </div>

      {/* Bottom pill strip */}
      <div className="relative px-5 pb-5 pt-1 grid grid-cols-4 gap-2">
        <Pill label="Fiber" value={totals.fiber} unit="g" accent="text-green-300" />
        <Pill label="Sodium" value={totals.sodium} unit="mg" accent="text-orange-300" />
        <Pill label="Sugar" value={totals.sugar} unit="g" accent="text-rose-300" />
        <Pill label="Water" value={waterOz} unit="oz" accent="text-sky-300" />
      </div>
    </div>
  )
}
