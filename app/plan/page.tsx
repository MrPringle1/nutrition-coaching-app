'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { Meal, MealPlan } from '@/lib/types'
import { Flame, Beef, Wheat, Droplets } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MEAL_COLORS: Record<string, string> = {
  Breakfast: 'bg-amber-100 text-amber-700',
  Lunch: 'bg-blue-100 text-blue-700',
  Dinner: 'bg-purple-100 text-purple-700',
  Snack: 'bg-green-100 text-green-700',
}

function MacroRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function PlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [activeDay, setActiveDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!client) { setLoading(false); return }

      const { data: planData } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (planData) {
        setPlan(planData)
        const { data: mealData } = await supabase
          .from('meals')
          .select('*')
          .eq('meal_plan_id', planData.id)
          .order('meal_number')
        setMeals(mealData || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const dayMeals = meals.filter(m => m.day_number === activeDay)
  const totalCals = dayMeals.reduce((s, m) => s + m.calories, 0)
  const totalProtein = dayMeals.reduce((s, m) => s + m.protein, 0)
  const totalCarbs = dayMeals.reduce((s, m) => s + m.carbs, 0)
  const totalFat = dayMeals.reduce((s, m) => s + m.fat, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading your plan…</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <>
        <NavBar />
        <main className="md:ml-60 pb-24 md:pb-8 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🥗</span>
            </div>
            <p className="font-bold text-gray-800 text-lg">No plan yet</p>
            <p className="text-sm text-gray-400 mt-1">Your coach will assign your meal plan soon.</p>
          </div>
        </main>
      </>
    )
  }

  const calPct = plan.daily_calories ? (totalCals / plan.daily_calories) * 100 : 0
  const proteinPct = plan.daily_protein ? (totalProtein / plan.daily_protein) * 100 : 0
  const carbsPct = plan.daily_carbs ? (totalCarbs / plan.daily_carbs) * 100 : 0
  const fatPct = plan.daily_fat ? (totalFat / plan.daily_fat) * 100 : 0

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        {/* Hero header */}
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Active Plan</p>
          <h1 className="text-white font-bold text-xl mb-5">{plan.name}</h1>

          {/* Macro targets row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', val: plan.daily_calories, unit: '', pct: calPct, color: '#f59e0b', icon: Flame },
              { label: 'Protein', val: plan.daily_protein, unit: 'g', pct: proteinPct, color: '#22c55e', icon: Beef },
              { label: 'Carbs', val: plan.daily_carbs, unit: 'g', pct: carbsPct, color: '#f97316', icon: Wheat },
              { label: 'Fat', val: plan.daily_fat, unit: 'g', pct: fatPct, color: '#60a5fa', icon: Droplets },
            ].map(({ label, val, unit, pct, color }) => (
              <div key={label} className="bg-white/8 rounded-2xl p-3 text-center flex flex-col items-center gap-1">
                <div className="relative flex items-center justify-center">
                  <MacroRing pct={pct} color={color} size={48} />
                  <span className="absolute text-[9px] font-bold text-white">{Math.round(pct)}%</span>
                </div>
                <p className="text-white font-bold text-sm leading-none">{val}{unit}</p>
                <p className="text-green-300 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pt-5">
          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i + 1)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeDay === i + 1
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-green-200'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">Day</span>
                <span>{i + 1}</span>
                <span className="text-[9px] mt-0.5 opacity-70">{d}</span>
              </button>
            ))}
          </div>

          {/* Today's totals */}
          {dayMeals.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 animate-fadeIn">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Today's Totals</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{totalCals}</p>
                  <p className="text-[10px] text-gray-400 font-medium">KCAL</p>
                </div>
                <div>
                  <p className="font-bold text-green-600 text-lg">{totalProtein}g</p>
                  <p className="text-[10px] text-gray-400 font-medium">PROTEIN</p>
                </div>
                <div>
                  <p className="font-bold text-orange-500 text-lg">{totalCarbs}g</p>
                  <p className="text-[10px] text-gray-400 font-medium">CARBS</p>
                </div>
                <div>
                  <p className="font-bold text-blue-500 text-lg">{totalFat}g</p>
                  <p className="text-[10px] text-gray-400 font-medium">FAT</p>
                </div>
              </div>
            </div>
          )}

          {/* Meals */}
          <div className="space-y-3 animate-fadeIn">
            {dayMeals.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100">
                No meals for this day yet.
              </div>
            ) : (
              dayMeals.map((meal, idx) => (
                <div key={meal.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${MEAL_COLORS[meal.meal_label] || 'bg-gray-100 text-gray-600'}`}>
                          {meal.meal_label}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{meal.calories} kcal</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{meal.name}</h3>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{meal.description}</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-semibold text-gray-700">{meal.protein}g protein</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-xs font-semibold text-gray-700">{meal.carbs}g carbs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-xs font-semibold text-gray-700">{meal.fat}g fat</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
