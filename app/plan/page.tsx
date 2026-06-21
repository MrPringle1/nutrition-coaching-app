'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { Meal, MealPlan } from '@/lib/types'

const DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <>
        <NavBar />
        <main className="md:ml-56 pb-20 md:pb-0 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-500">
            <p className="text-4xl mb-3">🥗</p>
            <p className="font-semibold text-gray-700">No plan yet</p>
            <p className="text-sm mt-1">Your coach will assign your meal plan soon.</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <NavBar />
      <main className="md:ml-56 pb-24 md:pb-8 px-4 pt-4 max-w-2xl md:mx-auto">
        {/* Macro summary */}
        <div className="bg-green-600 rounded-2xl p-4 text-white mb-4">
          <p className="text-sm font-medium opacity-80 mb-1">{plan.name}</p>
          <p className="text-xs opacity-70 mb-3">Daily targets</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', val: plan.daily_calories, unit: '' },
              { label: 'Protein', val: plan.daily_protein, unit: 'g' },
              { label: 'Carbs', val: plan.daily_carbs, unit: 'g' },
              { label: 'Fat', val: plan.daily_fat, unit: 'g' },
            ].map(({ label, val, unit }) => (
              <div key={label} className="bg-white/20 rounded-xl p-2 text-center">
                <p className="text-sm font-bold">{val}{unit}</p>
                <p className="text-xs opacity-80">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {DAYS.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i + 1)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeDay === i + 1
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Day totals */}
        {dayMeals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div><p className="font-bold text-gray-900">{totalCals}</p><p className="text-gray-400">kcal</p></div>
            <div><p className="font-bold text-green-600">{totalProtein}g</p><p className="text-gray-400">protein</p></div>
            <div><p className="font-bold text-amber-500">{totalCarbs}g</p><p className="text-gray-400">carbs</p></div>
            <div><p className="font-bold text-blue-500">{totalFat}g</p><p className="text-gray-400">fat</p></div>
          </div>
        )}

        {/* Meals */}
        <div className="space-y-3">
          {dayMeals.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No meals for this day yet.</p>
          ) : (
            dayMeals.map(meal => (
              <div key={meal.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">{meal.meal_label}</span>
                  <span className="text-xs text-gray-400">{meal.calories} kcal</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{meal.name}</h3>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{meal.description}</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600 font-medium">{meal.protein}g protein</span>
                  <span className="text-amber-500 font-medium">{meal.carbs}g carbs</span>
                  <span className="text-blue-500 font-medium">{meal.fat}g fat</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}
