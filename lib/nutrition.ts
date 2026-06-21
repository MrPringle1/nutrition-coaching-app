import type { Food, LoggedFoodItem, MacroTotals, MacroTargets, NutritionStatus } from './types'

export function calculateFoodMacros(food: Food, quantity: number): MacroTotals {
  const ratio = quantity / food.serving_size
  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    fiber: Math.round(food.fiber * ratio * 10) / 10,
    sugar: Math.round(food.sugar * ratio * 10) / 10,
    sodium: Math.round(food.sodium * ratio),
    water_oz: 0,
  }
}

export function calculateDailyTotals(items: LoggedFoodItem[]): MacroTotals {
  return items.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    carbs: acc.carbs + (item.carbs || 0),
    fat: acc.fat + (item.fat || 0),
    fiber: acc.fiber + (item.fiber || 0),
    sugar: acc.sugar + (item.sugar || 0),
    sodium: acc.sodium + (item.sodium || 0),
    water_oz: acc.water_oz,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, water_oz: 0 })
}

export function calculateRemainingTargets(targets: MacroTargets, totals: MacroTotals): MacroTotals {
  return {
    calories: Math.max(0, targets.calories - totals.calories),
    protein: Math.max(0, targets.protein - totals.protein),
    carbs: Math.max(0, targets.carbs - totals.carbs),
    fat: Math.max(0, targets.fat - totals.fat),
    fiber: Math.max(0, targets.fiber - totals.fiber),
    sugar: Math.max(0, targets.sugar - totals.sugar),
    sodium: Math.max(0, targets.sodium - totals.sodium),
    water_oz: Math.max(0, targets.water_oz - totals.water_oz),
  }
}

export function getNutritionStatus(targets: MacroTargets, totals: MacroTotals): NutritionStatus {
  const pct = (v: number, t: number) => t > 0 ? v / t : 0
  const status = (v: number, t: number): 'on_track' | 'under' | 'over' => {
    const p = pct(v, t)
    if (p > 1.1) return 'over'
    if (p < 0.8) return 'under'
    return 'on_track'
  }
  const calStatus = status(totals.calories, targets.calories)
  return {
    calories: calStatus,
    protein: status(totals.protein, targets.protein),
    carbs: status(totals.carbs, targets.carbs),
    fat: status(totals.fat, targets.fat),
    overall: totals.calories === 0 ? 'no_data' : calStatus,
  }
}

export function getMacroPercentage(consumed: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(Math.round((consumed / target) * 100), 100)
}

export function compareFoodMacros(original: Food, replacement: Food) {
  return {
    calorieDiff: replacement.calories - original.calories,
    proteinDiff: replacement.protein - original.protein,
    carbsDiff: replacement.carbs - original.carbs,
    fatDiff: replacement.fat - original.fat,
    fitsPlan: Math.abs(replacement.calories - original.calories) <= 50,
  }
}

export function getDailyPredictionSuggestions(targets: MacroTargets, totals: MacroTotals): string[] {
  const suggestions: string[] = []
  const calRemaining = targets.calories - totals.calories
  const proteinRemaining = targets.protein - totals.protein

  if (calRemaining > 300) suggestions.push(`You're ${calRemaining} calories under target — add a meal or snack`)
  if (calRemaining < -100) suggestions.push(`You're ${Math.abs(calRemaining)} calories over target today`)
  if (proteinRemaining > 25) suggestions.push(`Add ${Math.round(proteinRemaining)}g of protein to hit your goal`)
  if (calRemaining >= -100 && calRemaining <= 100) suggestions.push('This day fits your calorie deficit perfectly!')
  if (totals.calories === 0) suggestions.push('Start logging meals to see your daily prediction')
  return suggestions
}

export function formatMacro(value: number, unit = 'g'): string {
  return `${Math.round(value)}${unit}`
}

export function getCalorieStatus(consumed: number, target: number): 'no_data' | 'under' | 'on_track' | 'over' {
  if (consumed === 0) return 'no_data'
  const pct = consumed / target
  if (pct > 1.1) return 'over'
  if (pct < 0.8) return 'under'
  return 'on_track'
}
