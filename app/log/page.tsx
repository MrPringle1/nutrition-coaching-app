'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import MacroSummaryCard from '@/components/MacroSummaryCard'
import MealSection from '@/components/MealSection'
import FoodSearchDrawer from '@/components/FoodSearchDrawer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { getDailyPredictionSuggestions } from '@/lib/nutrition'
import type { LoggedFoodItem, MealPlan, MealType, MacroTargets } from '@/lib/types'
import { toDateString } from '@/lib/date'
import { ChevronLeft, ChevronRight, Lightbulb, Plus } from 'lucide-react'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const DEFAULT_TARGETS: MacroTargets = {
  calories: 1600, protein: 130, carbs: 130, fat: 50,
  fiber: 25, sugar: 50, sodium: 2300, water_oz: 64,
  calorie_deficit_target: 500,
}

export default function FoodLogPage() {
  const supabase = createClient()
  const [clientId, setClientId] = useState<string | null>(null)
  const [dailyLogId, setDailyLogId] = useState<string | null>(null)
  const [logDate, setLogDate] = useState(toDateString())
  const [items, setItems] = useState<LoggedFoodItem[]>([])
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [waterOz, setWaterOz] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast')

  useEffect(() => {
    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
      if (!client) { setLoading(false); return }
      setClientId(client.id)

      const { data: planData } = await supabase.from('meal_plans').select('*').eq('client_id', client.id)
        .eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (planData) setPlan(planData)

      await loadDayLog(client.id, logDate)
    }
    bootstrap()
  }, [])

  const loadDayLog = useCallback(async (cid: string, date: string) => {
    setLoading(true)
    // Get or create daily log
    let { data: log } = await supabase.from('daily_food_logs').select('id').eq('client_id', cid).eq('log_date', date).maybeSingle()
    if (!log) {
      const { data: newLog } = await supabase.from('daily_food_logs').insert({ client_id: cid, log_date: date }).select('id').single()
      log = newLog
    }
    if (!log) { setLoading(false); return }
    setDailyLogId(log.id)

    // Load items
    const { data: itemData } = await supabase.from('logged_food_items').select('*, foods(*)').eq('daily_log_id', log.id).order('created_at')
    setItems((itemData as LoggedFoodItem[]) ?? [])

    // Load today's water from progress log
    const todayStart = date + 'T00:00:00'
    const todayEnd = date + 'T23:59:59'
    const { data: progressData } = await supabase.from('progress_logs').select('water_oz')
      .eq('client_id', cid).gte('logged_at', todayStart).lte('logged_at', todayEnd)
      .order('logged_at', { ascending: false }).limit(1).maybeSingle()
    setWaterOz(progressData?.water_oz ?? 0)

    setLoading(false)
  }, [])

  async function refreshItems() {
    if (!clientId || !dailyLogId) return
    const { data } = await supabase.from('logged_food_items').select('*, foods(*)').eq('daily_log_id', dailyLogId).order('created_at')
    setItems((data as LoggedFoodItem[]) ?? [])
  }

  async function deleteItem(id: string) {
    await supabase.from('logged_food_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function changeDate(delta: number) {
    const d = new Date(logDate)
    d.setDate(d.getDate() + delta)
    const newDate = toDateString(d)
    setLogDate(newDate)
    if (clientId) loadDayLog(clientId, newDate)
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

  const suggestions = getDailyPredictionSuggestions(targets, totals)

  const isToday = logDate === toDateString()
  const formattedDate = new Date(logDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  if (loading && !clientId) return <LoadingSpinner text="Loading your food diary…" />

  if (!clientId) {
    return (
      <>
        <NavBar />
        <main className="md:ml-60 pb-28 min-h-screen bg-[#f6f8fc] flex items-center justify-center">
          <EmptyState emoji="🥗" title="No meal plan assigned" subtitle="Your coach will set up your plan soon." />
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-[#f6f8fc]">
        {/* Dark hero */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0d1f14] px-5 pt-6 pb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400/70 mb-2">Food Diary</p>

          {/* Date nav */}
          <div className="flex items-center gap-3">
            <button onClick={() => changeDate(-1)} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-white font-black text-xl">{isToday ? 'Today' : formattedDate}</p>
              {!isToday && <p className="text-emerald-300 text-xs mt-0.5">{formattedDate}</p>}
            </div>
            <button onClick={() => changeDate(1)} disabled={isToday}
              className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-colors">
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Floating macro summary bar — overlaps hero */}
        <div className="px-4 -mt-7">
          <div className="rounded-2xl bg-white/8 backdrop-blur border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)] grid grid-cols-4 gap-2 p-2 text-center">
            {[
              { label: 'Calories', val: Math.round(totals.calories), color: 'text-emerald-300' },
              { label: 'Protein', val: `${Math.round(totals.protein)}g`, color: 'text-purple-300' },
              { label: 'Carbs', val: `${Math.round(totals.carbs)}g`, color: 'text-amber-300' },
              { label: 'Fat', val: `${Math.round(totals.fat)}g`, color: 'text-cyan-300' },
            ].map(({ label, val, color }) => (
              <div key={label} className="py-2">
                <p className={`font-extrabold text-base ${color}`}>{val}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* Full macro card */}
          <MacroSummaryCard totals={totals} targets={targets} waterOz={waterOz} />

          {/* Prediction/suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg shadow-emerald-500/20">
              <Lightbulb size={18} className="text-white mt-0.5 flex-shrink-0" />
              <div>
                {suggestions.map((s, i) => (
                  <p key={i} className="text-white text-sm font-medium leading-snug">{s}</p>
                ))}
              </div>
            </div>
          )}

          {/* Meal sections */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            MEAL_TYPES.map(mt => (
              <MealSection
                key={mt}
                mealType={mt}
                items={items.filter(i => i.meal_type === mt)}
                onAddFood={(type) => { setActiveMealType(type); setDrawerOpen(true) }}
                onDelete={deleteItem}
              />
            ))
          )}
        </div>

        {/* Food search drawer */}
        {drawerOpen && clientId && dailyLogId && (
          <FoodSearchDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            defaultMealType={activeMealType}
            clientId={clientId}
            dailyLogId={dailyLogId}
            onFoodAdded={refreshItems}
          />
        )}

        {/* Mobile FAB */}
        <button
          onClick={() => { setActiveMealType('snack'); setDrawerOpen(true) }}
          className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center z-20 active:scale-95 transition-transform"
          aria-label="Add food"
        >
          <Plus size={26} className="text-white" />
        </button>
      </main>
    </>
  )
}
