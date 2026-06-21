'use client'

import type { Food } from '@/lib/types'
import FoodImage from './FoodImage'
import { Star, BadgeCheck } from 'lucide-react'

interface Props {
  food: Food
  onSelect: (food: Food) => void
  onFavorite?: (food: Food) => void
  isFavorite?: boolean
  compact?: boolean
}

export default function FoodItemCard({ food, onSelect, onFavorite, isFavorite, compact }: Props) {
  return (
    <div className={`flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors ${compact ? 'p-2' : 'p-3'}`}>
      <FoodImage src={food.image_url} alt={food.name} category={food.category} size={compact ? 'sm' : 'md'} />
      <button className="flex-1 text-left min-w-0" onClick={() => onSelect(food)}>
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{food.name}</p>
          {food.is_verified && <BadgeCheck size={13} className="text-green-500 flex-shrink-0" />}
        </div>
        {food.brand && <p className="text-[11px] text-gray-400 truncate">{food.brand}</p>}
        <p className="text-[10px] text-gray-400">per {food.serving_size} {food.serving_unit}</p>
        <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
          <span className="font-medium text-gray-600">{food.calories} cal</span>
          <span className="text-purple-500">P {food.protein}g</span>
          <span className="text-amber-500">C {food.carbs}g</span>
          <span className="text-cyan-500">F {food.fat}g</span>
        </div>
      </button>
      {onFavorite && (
        <button onClick={() => onFavorite(food)} className="p-1.5 text-gray-300 hover:text-yellow-400 transition-colors flex-shrink-0">
          <Star size={16} className={isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
        </button>
      )}
    </div>
  )
}
