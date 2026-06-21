'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import AIMealGeneratorForm from '@/components/AIMealGeneratorForm'
import GeneratedMealPlanPreview from '@/components/GeneratedMealPlanPreview'
import type { MealPlanPromptParams } from '@/lib/ai/prompts'
import type { GeneratedPlan } from '@/lib/ai/meal-generator'

export default function MealGeneratorPage() {
  const supabase = createClient()
  const router = useRouter()
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [lastParams, setLastParams] = useState<MealPlanPromptParams | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [demo, setDemo] = useState(false)

  async function generate(params: MealPlanPromptParams) {
    setLoading(true)
    setLastParams(params)
    try {
      const res = await fetch('/api/ai/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      setPlan(data.plan)
      setDemo(!!data.demo)
    } catch {
      setPlan(null)
    }
    setLoading(false)
  }

  async function save() {
    if (!plan || !lastParams) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
    if (!client) { setSaving(false); return }

    const { data: newPlan } = await supabase.from('meal_plans').insert({
      client_id: client.id,
      coach_id: null,
      name: `AI ${lastParams.dietStyle} Plan (${lastParams.days}d)`,
      daily_calories: lastParams.dailyCalories,
      daily_protein: lastParams.protein,
      daily_carbs: lastParams.carbs,
      daily_fat: lastParams.fat,
      is_active: true,
    }).select('id').single()

    if (newPlan) {
      for (const day of plan.days) {
        for (let mi = 0; mi < day.meals.length; mi++) {
          const meal = day.meals[mi]
          const { data: pm } = await supabase.from('planned_meals').insert({
            meal_plan_id: newPlan.id,
            day_number: day.day,
            meal_type: meal.meal_type,
            name: meal.name,
            sort_order: mi,
          }).select('id').single()
          if (pm) {
            const rows = meal.foods.map((f, fi) => ({
              planned_meal_id: pm.id,
              food_name: f.food_name,
              quantity: f.quantity,
              serving_unit: f.serving_unit,
              calories: f.calories,
              protein: f.protein,
              carbs: f.carbs,
              fat: f.fat,
              sort_order: fi,
            }))
            if (rows.length) await supabase.from('planned_meal_items').insert(rows)
          }
        }
      }
    }
    setSaving(false)
    router.push('/plan')
  }

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">AI Powered</p>
          <h1 className="text-white font-bold text-2xl">Meal Plan Generator</h1>
          <p className="text-green-300/70 text-sm mt-1">Build a custom plan around your macros and preferences.</p>
        </div>

        <div className="px-4 pt-4 max-w-2xl mx-auto">
          {!plan ? (
            <AIMealGeneratorForm onGenerate={generate} loading={loading} />
          ) : (
            <div className="space-y-3">
              {demo && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-medium">
                  Demo plan — connect an AI API key for fully personalized plans.
                </div>
              )}
              <GeneratedMealPlanPreview
                plan={plan}
                onSave={save}
                onRegenerate={() => lastParams && generate(lastParams)}
                loading={loading || saving}
              />
              <button onClick={() => setPlan(null)} className="w-full text-sm text-gray-500 font-medium py-2">
                ← Back to form
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
