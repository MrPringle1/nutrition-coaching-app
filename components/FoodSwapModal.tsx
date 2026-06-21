'use client'

import type { Food, MacroTotals } from '@/lib/types'
import { getSwapSuggestions } from '@/lib/swaps'
import FoodImage from './FoodImage'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  originalFood: Food | null
  remaining: MacroTotals
  candidates: Food[]
  onSwap: (replacement: Food) => void
}

export default function FoodSwapModal({ open, onClose, originalFood, remaining, candidates, onSwap }: Props) {
  if (!open || !originalFood) return null

  const suggestions = getSwapSuggestions(originalFood, candidates, remaining)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mt-auto bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl md:max-w-lg md:mx-auto md:mb-4 md:rounded-3xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-lg truncate">Swap {originalFood.name}</h2>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 grid grid-cols-4 gap-2 text-center text-xs">
            {[['Cal', originalFood.calories], ['P', `${originalFood.protein}g`], ['C', `${originalFood.carbs}g`], ['F', `${originalFood.fat}g`]].map(([l, v]) => (
              <div key={String(l)}>
                <p className="font-bold text-gray-900">{v}</p>
                <p className="text-gray-400">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No good swaps found in this category.</div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s, idx) => {
                const overTarget = s.calorieDiff > remaining.calories
                return (
                  <div key={s.food.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                    <FoodImage src={s.food.image_url} alt={s.food.name} category={s.food.category} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{s.food.name}</p>
                        {idx === 0 && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">BEST MATCH</span>}
                      </div>
                      <div className="flex gap-2 text-xs mt-0.5">
                        <span className={s.calorieDiff > 0 ? 'text-red-500' : 'text-green-600'}>{s.calorieDiff > 0 ? '+' : ''}{s.calorieDiff} cal</span>
                        <span className={s.proteinDiff >= 0 ? 'text-green-600' : 'text-red-500'}>{s.proteinDiff > 0 ? '+' : ''}{s.proteinDiff}g P</span>
                        <span className="text-gray-400">· {s.reason}</span>
                      </div>
                      {overTarget && <p className="text-[10px] text-red-500 font-semibold mt-0.5">Over Target</p>}
                    </div>
                    <button onClick={() => onSwap(s.food)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex-shrink-0 transition-colors">
                      Swap
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
