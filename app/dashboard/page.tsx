'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import MealLogSection from '@/components/MealLogSection'
import FoodSearchDrawer from '@/components/FoodSearchDrawer'
import FoodSwapModal from '@/components/FoodSwapModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { Client, MealPlan, LoggedFoodItem, MealType, MacroTargets, Food } from '@/lib/types'
import { calculateFoodMacros } from '@/lib/nutrition'
import { toDateString, getGreeting } from '@/lib/date'
import { ScanLine, Sparkles, Scale, Droplets, Plus } from 'lucide-react'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const DEFAULT_TARGETS: MacroTargets = {
  calories: 1800, protein: 150, carbs: 180, fat: 60,
  fiber: 25, sugar: 50, sodium: 2300, water_oz: 64,
  calorie_deficit_target: 500,
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const raf = (now: number) => {
      const pct = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3) // ease-out cubic
      setValue(Math.round(target * ease))
      if (pct < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration])
  return value
}

function MacroHero({ totals, targets, remaining }: {
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number; water_oz: number }
  targets: MacroTargets
  remaining: { calories: number }
}) {
  const calNow = useCountUp(Math.round(totals.calories))
  const proteinNow = useCountUp(Math.round(totals.protein))
  const carbsNow = useCountUp(Math.round(totals.carbs))
  const fatNow = useCountUp(Math.round(totals.fat))

  const size = 140
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const calPct = targets.calories ? Math.min(totals.calories / targets.calories, 1) : 0
  const dash = calPct * circ

  const macros = [
    { label: 'Protein', value: proteinNow, target: targets.protein, dot: '#a855f7', bar: 'linear-gradient(90deg,#a855f7,#c084fc)' },
    { label: 'Carbs', value: carbsNow, target: targets.carbs, dot: '#f59e0b', bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
    { label: 'Fat', value: fatNow, target: targets.fat, dot: '#06b6d4', bar: 'linear-gradient(90deg,#06b6d4,#22d3ee)' },
  ]

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-3xl overflow-hidden shadow-2xl">
      {/* Top — calorie ring */}
      <div className="relative px-5 pt-6 pb-5 bg-gradient-to-b from-[#11261b]/60 to-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-shrink-0 w-16">
            <p className="text-emerald-400 font-black text-xl leading-none">{Math.round(remaining.calories)}</p>
            <p className="text-white/40 text-[10px] mt-1 font-semibold">Remaining</p>
          </div>

          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute rotate-[-90deg]">
              <defs>
                <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
              <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="url(#emeraldGrad)" strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <div className="relative z-10 text-center">
              <p className="text-4xl font-black text-white leading-none">{calNow}</p>
              <p className="text-xs text-white/40 mt-1">of {targets.calories} cal</p>
            </div>
          </div>

          <div className="text-center flex-shrink-0 w-16">
            <p className="text-white/60 font-black text-xl leading-none">{targets.calories}</p>
            <p className="text-white/40 text-[10px] mt-1 font-semibold">Goal</p>
          </div>
        </div>
      </div>

      {/* Bottom — macro bars */}
      <div className="border-t border-white/5 px-5 py-4 grid grid-cols-3 gap-4">
        {macros.map(m => {
          const pct = m.target ? Math.min((m.value / m.target) * 100, 100) : 0
          return (
            <div key={m.label}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: m.dot }} />
                <span className="text-[11px] text-white/50 font-semibold">{m.label}</span>
              </div>
              <p className="text-lg font-black text-white leading-none">{m.value}<span className="text-xs text-white/30 font-medium"> / {m.target}g</span></p>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.bar }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Pill row */}
      <div className="border-t border-white/5 px-5 py-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Fiber', value: `${Math.round(totals.fiber)}g`, accent: 'text-emerald-300' },
          { label: 'Sodium', value: `${Math.round(totals.sodium)}mg`, accent: 'text-orange-300' },
          { label: 'Water', value: `${Math.round(totals.water_oz)}oz`, accent: 'text-sky-300' },
        ].map(p => (
          <div key={p.label} className="bg-white/[0.04] rounded-xl py-2 text-center">
            <p className={`font-extrabold text-sm ${p.accent}`}>{p.value}</p>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide mt-0.5">{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const today = toDateString()

  const [userName, setUserName] = useState('')
  const [client, setClient] = useState<Client | null>(null)
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [dailyLogId, setDailyLogId] = useState<string | null>(null)
  const [items, setItems] = useState<LoggedFoodItem[]>([])
  const [waterOz, setWaterOz] = useState(0)
  const [weight, setWeight] = useState<number | null>(null)
  const [progressLogId, setProgressLogId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast')
  const [swapItem, setSwapItem] = useState<LoggedFoodItem | null>(null)
  const [swapCandidates, setSwapCandidates] = useState<Food[]>([])

  useEffect(() => {
    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0])

      const { data: clientData } = await supabase.from('clients').select('*').eq('profile_id', user.id).single()
      if (!clientData) { setLoading(false); return }
      setClient(clientData)

      const { data: planData } = await supabase.from('meal_plans').select('*').eq('client_id', clientData.id)
        .eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (planData) setPlan(planData)

      // Get or create today's daily log
      let { data: log } = await supabase.from('daily_food_logs').select('id').eq('client_id', clientData.id).eq('log_date', today).maybeSingle()
      if (!log) {
        const { data: newLog } = await supabase.from('daily_food_logs').insert({ client_id: clientData.id, log_date: today }).select('id').single()
        log = newLog
      }
      if (log) {
        setDailyLogId(log.id)
        const { data: itemData } = await supabase.from('logged_food_items').select('*, foods(*)').eq('daily_log_id', log.id).order('created_at')
        setItems((itemData as LoggedFoodItem[]) ?? [])
      }

      // Today's water + weight from progress logs
      const { data: prog } = await supabase.from('progress_logs').select('*')
        .eq('client_id', clientData.id).gte('logged_at', today + 'T00:00:00').lte('logged_at', today + 'T23:59:59')
        .order('logged_at', { ascending: false }).limit(1).maybeSingle()
      if (prog) {
        setProgressLogId(prog.id)
        setWaterOz(prog.water_oz ?? 0)
        if (prog.weight) setWeight(prog.weight)
      }
      if (!prog || prog.weight == null) {
        const { data: latestWeight } = await supabase.from('progress_logs').select('weight')
          .eq('client_id', clientData.id).not('weight', 'is', null)
          .order('logged_at', { ascending: false }).limit(1).maybeSingle()
        if (latestWeight?.weight) setWeight(latestWeight.weight)
      }

      setLoading(false)
    }
    bootstrap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshItems = useCallback(async () => {
    if (!dailyLogId) return
    const { data } = await supabase.from('logged_food_items').select('*, foods(*)').eq('daily_log_id', dailyLogId).order('created_at')
    setItems((data as LoggedFoodItem[]) ?? [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLogId])

  async function deleteItem(id: string) {
    await supabase.from('logged_food_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function addWater(oz: number) {
    if (!client) return
    const newOz = waterOz + oz
    setWaterOz(newOz)
    if (progressLogId) {
      await supabase.from('progress_logs').update({ water_oz: newOz }).eq('id', progressLogId)
    } else {
      const { data } = await supabase.from('progress_logs').insert({ client_id: client.id, water_oz: newOz, logged_at: new Date().toISOString() }).select('id').single()
      if (data) setProgressLogId(data.id)
    }
  }

  async function openSwap(item: LoggedFoodItem) {
    if (!item.food) return
    setSwapItem(item)
    const { data } = await supabase.from('foods').select('*').eq('category', item.food.category).eq('is_public', true).limit(40)
    setSwapCandidates((data as Food[]) ?? [])
  }

  async function performSwap(replacement: Food) {
    if (!swapItem) return
    const qty = swapItem.quantity || replacement.serving_size
    const macros = calculateFoodMacros(replacement, qty)
    await supabase.from('logged_food_items').update({
      food_id: replacement.id,
      food_name: replacement.name,
      serving_unit: replacement.serving_unit,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      fiber: macros.fiber,
      sugar: macros.sugar,
      sodium: macros.sodium,
    }).eq('id', swapItem.id)
    setSwapItem(null)
    setSwapCandidates([])
    refreshItems()
  }

  const targets: MacroTargets = plan ? {
    calories: plan.daily_calories,
    protein: plan.daily_protein,
    carbs: plan.daily_carbs,
    fat: plan.daily_fat,
    fiber: plan.daily_fiber ?? 25,
    sugar: plan.daily_sugar ?? 50,
    sodium: plan.daily_sodium ?? 2300,
    water_oz: plan.water_goal_oz ?? 64,
    calorie_deficit_target: plan.calorie_deficit_target ?? 500,
  } : DEFAULT_TARGETS

  const totals = {
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein: items.reduce((s, i) => s + i.protein, 0),
    carbs: items.reduce((s, i) => s + i.carbs, 0),
    fat: items.reduce((s, i) => s + i.fat, 0),
    fiber: items.reduce((s, i) => s + i.fiber, 0),
    sugar: items.reduce((s, i) => s + i.sugar, 0),
    sodium: items.reduce((s, i) => s + i.sodium, 0),
    water_oz: waterOz,
  }

  const remaining = {
    calories: Math.max(0, targets.calories - totals.calories),
    protein: Math.max(0, targets.protein - totals.protein),
    carbs: Math.max(0, targets.carbs - totals.carbs),
    fat: Math.max(0, targets.fat - totals.fat),
    fiber: Math.max(0, targets.fiber - totals.fiber),
    sugar: Math.max(0, targets.sugar - totals.sugar),
    sodium: Math.max(0, targets.sodium - totals.sodium),
    water_oz: Math.max(0, targets.water_oz - totals.water_oz),
  }

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return <LoadingSpinner text="Setting up your day…" />

  if (!client) {
    return (
      <>
        <NavBar />
        <main className="md:ml-60 pb-28 min-h-screen bg-[#0d1117] flex items-center justify-center">
          <EmptyState emoji="🥗" title="No client profile yet" subtitle="Your coach will set up your account soon." />
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-[#0d1117]">
        {/* Hero */}
        <div className="bg-gradient-to-b from-[#0d1f14] to-[#0d1117] px-5 pt-6 pb-5">
          <div className="flex items-start justify-between mb-5 animate-fadeInUp">
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">{dateStr}</p>
              <h1 className="text-white font-black text-2xl mt-1">{getGreeting()},<br />{userName || 'there'}! 👋</h1>
            </div>
            {weight != null && (
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-3 py-2 text-center">
                <p className="text-white font-black text-lg">{weight}</p>
                <p className="text-emerald-400 text-[10px] font-semibold">lbs</p>
              </div>
            )}
          </div>

          <div className="animate-fadeInUp delay-150">
            <MacroHero totals={totals} targets={targets} remaining={remaining} />
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: '/scan', icon: ScanLine, label: 'Scan Food', ring: 'bg-emerald-500/15 text-emerald-400', delay: 'delay-200' },
              { href: '/meal-generator', icon: Sparkles, label: 'Generate', ring: 'bg-purple-500/15 text-purple-400', delay: 'delay-300' },
              { href: '/progress', icon: Scale, label: 'Log Weight', ring: 'bg-blue-500/15 text-blue-400', delay: 'delay-400' },
            ].map(({ href, icon: Icon, label, ring, delay }) => (
              <Link key={href} href={href}
                className={`bg-[#1c2128] border border-[#30363d] rounded-2xl py-4 flex flex-col items-center gap-2 hover:border-emerald-500/40 transition-colors animate-fadeInUp ${delay}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${ring}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-semibold text-white/70">{label}</span>
              </Link>
            ))}
          </div>

          {/* Water tracker */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-5 animate-fadeInUp delay-400">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
                  <Droplets size={17} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Water Intake</p>
                  <p className="text-3xl font-black text-blue-400 leading-none mt-0.5">{waterOz}<span className="text-sm font-medium text-white/40"> oz</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addWater(8)} className="bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 font-semibold text-xs px-3 py-2 rounded-xl transition-colors">+8 oz</button>
                <button onClick={() => addWater(16)} className="bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 font-semibold text-xs px-3 py-2 rounded-xl transition-colors">+16 oz</button>
              </div>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${targets.water_oz > 0 ? Math.min((waterOz / targets.water_oz) * 100, 100) : 0}%` }} />
            </div>
          </div>

          {/* Meal sections */}
          {MEAL_TYPES.map((mt, i) => (
            <div key={mt} className={`animate-fadeInUp delay-${Math.min(500 + i * 100, 800)}`}>
              <MealLogSection
                mealType={mt}
                items={items.filter(i => i.meal_type === mt)}
                onAddFood={(type) => { setActiveMealType(type); setDrawerOpen(true) }}
                onDeleteItem={deleteItem}
                onSwapFood={openSwap}
              />
            </div>
          ))}
        </div>

        {/* FAB */}
        <button onClick={() => { setActiveMealType('breakfast'); setDrawerOpen(true) }}
          className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center z-20 animate-pulse-glow">
          <Plus size={24} className="text-white" />
        </button>

        {drawerOpen && dailyLogId && (
          <FoodSearchDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            defaultMealType={activeMealType}
            clientId={client.id}
            dailyLogId={dailyLogId}
            onFoodAdded={refreshItems}
          />
        )}

        <FoodSwapModal
          open={!!swapItem}
          onClose={() => { setSwapItem(null); setSwapCandidates([]) }}
          originalFood={swapItem?.food ?? null}
          remaining={remaining}
          candidates={swapCandidates}
          onSwap={performSwap}
        />
      </main>
    </>
  )
}
