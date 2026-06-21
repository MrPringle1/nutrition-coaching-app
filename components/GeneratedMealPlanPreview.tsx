'use client'

import { useState } from 'react'
import type { GeneratedPlan } from '@/lib/ai/meal-generator'
import { InlineSpinner } from './ui/LoadingSpinner'
import { ChevronDown, ChevronUp, RefreshCw, Save } from 'lucide-react'

interface Props {
  plan: GeneratedPlan
  onSave: () => void
  onRegenerate: () => void
  loading: boolean
}

const MEAL_EMOJIS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export default function GeneratedMealPlanPreview({ plan, onSave, onRegenerate, loading }: Props) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]))

  function toggle(day: number) {
    setOpen(prev => {
      const n = new Set(prev)
      if (n.has(day)) n.delete(day); else n.add(day)
      return n
    })
  }

  return (
    <div className="space-y-3">
      {plan.days.map(day => {
        const expanded = open.has(day.day)
        return (
          <div key={day.day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => toggle(day.day)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-sm">Day {day.day}</p>
                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{Math.round(day.total_calories)} cal</span>
                  <span>P {Math.round(day.total_protein)}g</span>
                  <span>C {Math.round(day.total_carbs)}g</span>
                  <span>F {Math.round(day.total_fat)}g</span>
                </div>
              </div>
              {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {expanded && (
              <div className="border-t border-gray-50 divide-y divide-gray-50">
                {day.meals.map((meal, mi) => (
                  <div key={mi} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>{MEAL_EMOJIS[meal.meal_type] || '🍽️'}</span>
                      <p className="font-semibold text-gray-900 text-sm">{meal.name}</p>
                      <span className="ml-auto text-xs text-gray-400">{Math.round(meal.total_calories)} cal</span>
                    </div>
                    <div className="space-y-0.5 pl-7">
                      {meal.foods.map((f, fi) => (
                        <div key={fi} className="flex justify-between text-xs text-gray-500">
                          <span>{f.food_name} <span className="text-gray-400">({f.quantity} {f.serving_unit})</span></span>
                          <span className="text-gray-400">{Math.round(f.calories)} cal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex gap-2 sticky bottom-0 bg-gray-50 py-3">
        <button onClick={onRegenerate} disabled={loading}
          className="flex-1 border border-gray-300 text-gray-700 font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          <RefreshCw size={15} /> Regenerate
        </button>
        <button onClick={onSave} disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <InlineSpinner /> : <><Save size={15} /> Save Plan</>}
        </button>
      </div>
    </div>
  )
}
