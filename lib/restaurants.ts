import type { RestaurantPartner, RestaurantMenuItem } from './types'

export type BusinessType = 'restaurant' | 'fast_casual' | 'meal_prep' | 'smoothie_bar' | 'cafe' | 'gym_cafe'

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  fast_casual: 'Fast Casual',
  meal_prep: 'Meal Prep',
  smoothie_bar: 'Smoothie Bar',
  cafe: 'Café',
  gym_cafe: 'Gym Café',
}

export const BUSINESS_TYPE_EMOJIS: Record<string, string> = {
  restaurant: '🍽️',
  fast_casual: '🌮',
  meal_prep: '📦',
  smoothie_bar: '🥤',
  cafe: '☕',
  gym_cafe: '💪',
}

export type MenuTag = 'high-protein' | 'low-carb' | 'low-calorie' | 'vegan' | 'vegetarian' | 'gluten-free' | 'keto-friendly' | 'coach-approved'

export const TAG_COLORS: Record<string, string> = {
  'high-protein': 'bg-purple-100 text-purple-700',
  'low-carb': 'bg-orange-100 text-orange-700',
  'low-calorie': 'bg-sky-100 text-sky-700',
  'vegan': 'bg-green-100 text-green-700',
  'vegetarian': 'bg-lime-100 text-lime-700',
  'gluten-free': 'bg-yellow-100 text-yellow-700',
  'keto-friendly': 'bg-amber-100 text-amber-700',
  'coach-approved': 'bg-emerald-100 text-emerald-700',
}

export function getMacroScore(item: RestaurantMenuItem): number {
  const cals = item.calories || 1
  const proteinPct = ((item.protein * 4) / cals) * 100
  return Math.min(100, Math.round(proteinPct * 2.5))
}

export function filterMenuItems(
  items: RestaurantMenuItem[],
  query: string,
  filters: { highProtein: boolean; lowCarb: boolean; lowCalorie: boolean; coachApproved: boolean }
): RestaurantMenuItem[] {
  return items.filter(item => {
    const matchQ = !query || item.name.toLowerCase().includes(query.toLowerCase())
    const matchHP = !filters.highProtein || item.is_high_protein
    const matchLC = !filters.lowCarb || item.is_low_carb
    const matchLCal = !filters.lowCalorie || item.is_low_calorie
    const matchCA = !filters.coachApproved || item.is_coach_approved
    return matchQ && matchHP && matchLC && matchLCal && matchCA
  })
}
