'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AIMealGeneratorForm from '@/components/AIMealGeneratorForm'
import GeneratedMealPlanPreview from '@/components/GeneratedMealPlanPreview'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Client } from '@/lib/types'
import type { MealPlanPromptParams } from '@/lib/ai/prompts'
import type { GeneratedPlan } from '@/lib/ai/meal-generator'
import { ArrowLeft } from 'lucide-react'

export default function CoachGeneratePlanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [lastParams, setLastParams] = useState<MealPlanPromptParams | null>(null)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('clients').select('*').eq('id', id).single()
      setClient(data as Client)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function generate(params: MealPlanPromptParams) {
    setGenerating(true)
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
    setGenerating(false)
  }

  async function save() {
    if (!plan || !lastParams || !client) return
    setSaving(true)
    const { data: newPlan } = await supabase.from('meal_plans').insert({
      client_id: client.id,
      coach_id: client.coach_id,
      name: `${lastParams.dietStyle} Plan (${lastParams.days}d)`,
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
          if (pm && meal.foods.length) {
            await supabase.from('planned_meal_items').insert(meal.foods.map((f, fi) => ({
              planned_meal_id: pm.id,
              food_name: f.food_name,
              quantity: f.quantity,
              serving_unit: f.serving_unit,
              calories: f.calories,
              protein: f.protein,
              carbs: f.carbs,
              fat: f.fat,
              sort_order: fi,
            })))
          }
        }
      }
    }
    setSaving(false)
    router.push(`/coach/clients/${client.id}`)
  }

  if (loading) return <LoadingSpinner text="Loading client…" />

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-[#0d2318] px-5 pt-5 pb-6">
        <Link href={`/coach/clients/${id}`} className="flex items-center gap-2 text-green-300 text-sm mb-3 hover:text-white">
          <ArrowLeft size={16} /> Back to client
        </Link>
        <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">AI Meal Plan</p>
        <h1 className="text-white font-bold text-2xl">Generate for {client?.full_name ?? 'Client'}</h1>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto pb-16">
        {!plan ? (
          <AIMealGeneratorForm
            onGenerate={generate}
            loading={generating}
            initial={client ? {
              dailyCalories: 1800,
              protein: 150,
              carbs: 180,
              fat: 60,
            } : undefined}
          />
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
              loading={generating || saving}
            />
            <button onClick={() => setPlan(null)} className="w-full text-sm text-gray-500 font-medium py-2">← Back to form</button>
          </div>
        )}
      </div>
    </main>
  )
}
