import type { Food, MacroTotals } from './types'

export interface SwapSuggestion {
  food: Food
  score: number
  reason: string
  calorieDiff: number
  proteinDiff: number
  carbsDiff: number
  fatDiff: number
}

export function getSwapSuggestions(
  original: Food,
  candidates: Food[],
  remaining?: MacroTotals
): SwapSuggestion[] {
  return candidates
    .filter(f => f.id !== original.id)
    .map(f => {
      let score = 0
      // Same category: +40 points
      if (f.category === original.category) score += 40
      // Similar calories (within 20%): +30 points
      const calDiff = Math.abs(f.calories - original.calories)
      if (calDiff <= original.calories * 0.2) score += 30
      else if (calDiff <= original.calories * 0.4) score += 15
      // Similar protein (within 5g): +20 points
      const protDiff = Math.abs(f.protein - original.protein)
      if (protDiff <= 5) score += 20
      else if (protDiff <= 10) score += 10
      // Verified: +10 points
      if (f.is_verified) score += 10
      // Fits remaining if provided
      if (remaining && f.calories <= remaining.calories) score += 5

      const reason = f.category === original.category
        ? 'Same category'
        : Math.abs(f.protein - original.protein) <= 5
          ? 'Similar protein'
          : 'Similar calories'

      return {
        food: f,
        score,
        reason,
        calorieDiff: Math.round(f.calories - original.calories),
        proteinDiff: parseFloat((f.protein - original.protein).toFixed(1)),
        carbsDiff: parseFloat((f.carbs - original.carbs).toFixed(1)),
        fatDiff: parseFloat((f.fat - original.fat).toFixed(1)),
      }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}
