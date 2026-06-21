import type { Food } from './types'

export function normalizeFoodName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
}

export function searchFoods(query: string, foods: Food[]): Food[] {
  const q = normalizeFoodName(query)
  if (!q) return []
  return foods
    .filter(f => f.normalized_name?.includes(q) || f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q))
    .sort((a, b) => {
      const aExact = a.normalized_name === q ? 2 : a.normalized_name?.startsWith(q) ? 1 : 0
      const bExact = b.normalized_name === q ? 2 : b.normalized_name?.startsWith(q) ? 1 : 0
      return bExact - aExact
    })
}

export function findBestMatches(detectedName: string, foods: Food[]): Food[] {
  const results = searchFoods(detectedName, foods)
  return results.slice(0, 5)
}
