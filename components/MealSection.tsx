'use client'

import { useState } from 'react'
import type { LoggedFoodItem, MealType } from '@/lib/types'
import FoodImage from './FoodImage'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

interface Props {
  mealType: MealType
  items: LoggedFoodItem[]
  onAddFood: (mealType: MealType) => void
  onDelete: (id: string) => void
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; accent: string; bg: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', accent: '#f59e0b', bg: 'bg-amber-500/15' },
  lunch: { label: 'Lunch', emoji: '☀️', accent: '#3b82f6', bg: 'bg-blue-500/15' },
  dinner: { label: 'Dinner', emoji: '🌙', accent: '#a855f7', bg: 'bg-purple-500/15' },
  snack: { label: 'Snacks', emoji: '🍎', accent: '#10b981', bg: 'bg-emerald-500/15' },
}

export default function MealSection({ mealType, items, onAddFood, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true)
  const config = MEAL_CONFIG[mealType]
  const totalCals = items.reduce((s, i) => s + i.calories, 0)

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 pl-3 pr-3 py-3.5 hover:bg-white/[0.03] transition-colors"
      >
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: config.accent }} />
        <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
          {config.emoji}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-base font-bold text-white">{config.label}</p>
          <p className="text-xs text-white/40 font-medium mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <span className="bg-white/10 text-white/60 text-xs font-bold px-2.5 py-1 rounded-full">{Math.round(totalCals)} cal</span>
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onAddFood(mealType) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onAddFood(mealType) } }}
          className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/30 cursor-pointer"
        >
          <Plus size={16} className="text-white" />
        </span>
        <ChevronDown size={16} className={`text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Items */}
      {expanded && (
        <div className="border-t border-white/5">
          {items.length === 0 ? (
            <div className="m-4 border border-dashed border-[#30363d] rounded-xl py-6 text-center">
              <button onClick={() => onAddFood(mealType)} className="text-sm text-white/40 hover:text-white/70 font-medium inline-flex items-center gap-1.5 transition-colors">
                <Plus size={14} /> Tap + to add food
              </button>
            </div>
          ) : (
            <div>
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 pl-4 pr-3 py-3 hover:bg-white/[0.03] transition-colors ${idx < items.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <FoodImage
                    src={item.food?.image_url}
                    alt={item.food_name || 'Food'}
                    category={item.food?.category || 'other'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{item.food_name || item.food?.name || 'Unknown food'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300">P {Math.round(item.protein)}g</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300">C {Math.round(item.carbs)}g</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300">F {Math.round(item.fat)}g</span>
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(item as any).source_label && (
                      <p className="text-[10px] text-emerald-400 font-semibold mt-1">📍 {(item as any).source_label}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-extrabold text-white">{Math.round(item.calories)}</p>
                    <p className="text-[10px] text-white/40 font-medium">cal</p>
                  </div>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-white/20 hover:text-rose-400 transition-colors flex-shrink-0 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => onAddFood(mealType)}
                className="w-full py-3 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5 font-bold"
              >
                <Plus size={14} /> Add more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
