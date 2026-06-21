'use client'

import { useState } from 'react'
import DietStyleSelector from './DietStyleSelector'
import { InlineSpinner } from './ui/LoadingSpinner'
import { Sparkles } from 'lucide-react'
import type { MealPlanPromptParams } from '@/lib/ai/prompts'

interface Props {
  onGenerate: (params: MealPlanPromptParams) => void
  loading: boolean
  initial?: Partial<MealPlanPromptParams>
}

export default function AIMealGeneratorForm({ onGenerate, loading, initial }: Props) {
  const [dietStyle, setDietStyle] = useState(initial?.dietStyle ?? 'balanced')
  const [dailyCalories, setDailyCalories] = useState(initial?.dailyCalories ?? 1800)
  const [protein, setProtein] = useState(initial?.protein ?? 150)
  const [carbs, setCarbs] = useState(initial?.carbs ?? 180)
  const [fat, setFat] = useState(initial?.fat ?? 60)
  const [days, setDays] = useState(initial?.days ?? 7)
  const [mealsPerDay, setMealsPerDay] = useState(initial?.mealsPerDay ?? 3)
  const [availableFoods, setAvailableFoods] = useState('')
  const [dislikedFoods, setDislikedFoods] = useState('')
  const [allergies, setAllergies] = useState('')
  const [cookingTime, setCookingTime] = useState('Normal (30min)')
  const [mealPrep, setMealPrep] = useState(false)

  function splitList(s: string): string[] {
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }

  function submit() {
    onGenerate({
      dietStyle,
      dailyCalories,
      protein,
      carbs,
      fat,
      mealsPerDay,
      days,
      availableFoods: splitList(availableFoods),
      dislikedFoods: splitList(dislikedFoods),
      allergies: splitList(allergies),
      cookingTime,
      mealPrepStyle: mealPrep ? 'Batch meal prep' : 'Cook fresh',
    })
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Diet Style</label>
        <DietStyleSelector selected={dietStyle} onChange={setDietStyle} />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Daily Calories</label>
        <input type="number" value={dailyCalories} onChange={e => setDailyCalories(parseInt(e.target.value) || 0)} className={inputCls} />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Macro Targets (g)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <input type="number" value={protein} onChange={e => setProtein(parseInt(e.target.value) || 0)} className={inputCls} placeholder="Protein" />
            <p className="text-[10px] text-gray-400 text-center mt-1">Protein</p>
          </div>
          <div>
            <input type="number" value={carbs} onChange={e => setCarbs(parseInt(e.target.value) || 0)} className={inputCls} placeholder="Carbs" />
            <p className="text-[10px] text-gray-400 text-center mt-1">Carbs</p>
          </div>
          <div>
            <input type="number" value={fat} onChange={e => setFat(parseInt(e.target.value) || 0)} className={inputCls} placeholder="Fat" />
            <p className="text-[10px] text-gray-400 text-center mt-1">Fat</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Days to Generate: {days}</label>
        <input type="range" min={1} max={14} value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full accent-green-600" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Meals Per Day</label>
        <div className="flex gap-2">
          {[3, 4].map(n => (
            <button key={n} type="button" onClick={() => setMealsPerDay(n)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${mealsPerDay === n ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              {n} meals
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Available Foods (comma separated)</label>
        <textarea value={availableFoods} onChange={e => setAvailableFoods(e.target.value)} rows={2} className={inputCls} placeholder="chicken, rice, broccoli…" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Disliked Foods</label>
        <textarea value={dislikedFoods} onChange={e => setDislikedFoods(e.target.value)} rows={2} className={inputCls} placeholder="mushrooms, tofu…" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Allergies</label>
        <textarea value={allergies} onChange={e => setAllergies(e.target.value)} rows={2} className={inputCls} placeholder="peanuts, shellfish…" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Cooking Time</label>
        <div className="flex gap-2">
          {['Quick (15min)', 'Normal (30min)', 'Flexible'].map(t => (
            <button key={t} type="button" onClick={() => setCookingTime(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${cookingTime === t ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Batch Meal Prep</label>
        <button type="button" onClick={() => setMealPrep(p => !p)}
          className={`w-12 h-7 rounded-full transition-colors relative ${mealPrep ? 'bg-green-600' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${mealPrep ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <button onClick={submit} disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 text-sm shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <InlineSpinner /> : <><Sparkles size={16} /> Generate Meal Plan</>}
      </button>
    </div>
  )
}
