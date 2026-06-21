'use client'

import { useState } from 'react'
import type { LoggedFoodItem, MealType } from '@/lib/types'
import FoodImage from './FoodImage'
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react'

interface Props {
  mealType: MealType
  items: LoggedFoodItem[]
  onAddFood: (mealType: MealType) => void
  onDeleteItem: (id: string) => void
  onSwapFood?: (item: LoggedFoodItem) => void
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; accent: string; bg: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', accent: '#f59e0b', bg: 'bg-amber-500/15' },
  lunch: { label: 'Lunch', emoji: '☀️', accent: '#3b82f6', bg: 'bg-blue-500/15' },
  dinner: { label: 'Dinner', emoji: '🌙', accent: '#a855f7', bg: 'bg-purple-500/15' },
  snack: { label: 'Snacks', emoji: '🍎', accent: '#10b981', bg: 'bg-emerald-500/15' },
}

export default function MealLogSection({ mealType, items, onAddFood, onDeleteItem, onSwapFood }: Props) {
  const [expanded, setExpanded] = useState(true)
  const config = MEAL_CONFIG[mealType]
  const totalCals = items.reduce((s, i) => s + i.calories, 0)
  const totalProtein = items.reduce((s, i) => s + i.protein, 0)
  const totalCarbs = items.reduce((s, i) => s + i.carbs, 0)
  const totalFat = items.reduce((s, i) => s + i.fat, 0)

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-3 px-3 py-3.5 hover:bg-white/[0.03] transition-colors">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: config.accent }} />
        <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>{config.emoji}</div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-white">{config.label}</p>
            <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">{Math.round(totalCals)} cal</span>
          </div>
          {items.length > 0 && (
            <div className="flex gap-2 text-xs text-white/40 mt-1">
              <span>P {Math.round(totalProtein)}g</span>
              <span>C {Math.round(totalCarbs)}g</span>
              <span>F {Math.round(totalFat)}g</span>
            </div>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onAddFood(mealType) }}
          className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-1 hover:bg-emerald-400 transition-colors flex-shrink-0">
          <Plus size={16} className="text-white" />
        </button>
        {expanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>

      {expanded && (
        <div className="border-t border-white/5">
          {items.length === 0 ? (
            <div className="px-4 py-3">
              <button onClick={() => onAddFood(mealType)}
                className="w-full py-4 text-sm text-white/40 hover:text-white/70 border border-dashed border-[#30363d] rounded-xl hover:border-emerald-500/40 transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Add food to {config.label.toLowerCase()}
              </button>
            </div>
          ) : (
            <div>
              {items.map((item, idx) => (
                <div key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${idx < items.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <FoodImage src={item.food?.image_url} alt={item.food_name || 'Food'} category={item.food?.category || 'other'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{item.food_name || item.food?.name || 'Unknown food'}</p>
                    <div className="flex gap-1.5 text-[11px] mt-1">
                      <span className="font-medium text-white/60">{Math.round(item.calories)} cal</span>
                      <span className="bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded-md">P {Math.round(item.protein)}g</span>
                      <span className="bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-md">C {Math.round(item.carbs)}g</span>
                      <span className="bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded-md">F {Math.round(item.fat)}g</span>
                    </div>
                  </div>
                  {onSwapFood && item.food && (
                    <button onClick={() => onSwapFood(item)} className="p-1.5 text-white/30 hover:text-emerald-400 transition-colors flex-shrink-0" title="Swap food">
                      <ArrowLeftRight size={15} />
                    </button>
                  )}
                  <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-white/20 hover:text-rose-400 transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={() => onAddFood(mealType)}
                className="w-full py-3 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5 font-semibold">
                <Plus size={14} /> Add more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
