'use client'

import type { Food } from '@/lib/types'
import FoodImage from './FoodImage'

interface Props {
  foods: Food[]
  onConfirm: (food: Food) => void
  onManualSearch: () => void
}

export default function ScanResultPreview({ foods, onConfirm, onManualSearch }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="font-bold text-gray-900 text-sm mb-3">
        {foods.length === 1 ? 'We think this is…' : 'Top matches:'}
      </p>
      <div className="space-y-2">
        {foods.map(food => (
          <div key={food.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
            <FoodImage src={food.image_url} alt={food.name} category={food.category} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{food.name}</p>
              <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                <span>{food.calories} cal</span>
                <span>P {food.protein}g</span>
                <span>C {food.carbs}g</span>
                <span>F {food.fat}g</span>
              </div>
            </div>
            <button onClick={() => onConfirm(food)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex-shrink-0 transition-colors">
              Confirm
            </button>
          </div>
        ))}
      </div>
      <button onClick={onManualSearch} className="w-full text-center text-sm text-green-600 font-semibold mt-4 hover:underline">
        Not what you&apos;re looking for? Search manually
      </button>
    </div>
  )
}
