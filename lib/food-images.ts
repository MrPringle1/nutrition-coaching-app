const CATEGORY_EMOJIS: Record<string, string> = {
  protein: '🥩',
  dairy: '🥛',
  grain: '🌾',
  vegetable: '🥦',
  fruit: '🍎',
  fat: '🥑',
  legume: '🫘',
  supplement: '💊',
  beverage: '🧃',
  snack: '🍿',
  sauce: '🫙',
  other: '🍽️',
}

const CATEGORY_COLORS: Record<string, string> = {
  protein: 'bg-red-100',
  dairy: 'bg-blue-100',
  grain: 'bg-amber-100',
  vegetable: 'bg-green-100',
  fruit: 'bg-pink-100',
  fat: 'bg-yellow-100',
  legume: 'bg-orange-100',
  supplement: 'bg-purple-100',
  beverage: 'bg-cyan-100',
  snack: 'bg-rose-100',
  sauce: 'bg-lime-100',
  other: 'bg-gray-100',
}

export function getFoodEmoji(category: string): string {
  return CATEGORY_EMOJIS[category?.toLowerCase()] ?? CATEGORY_EMOJIS.other
}

export function getFoodBgColor(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] ?? CATEGORY_COLORS.other
}

export function getFoodPlaceholder(name: string, category: string): { emoji: string; bg: string } {
  return {
    emoji: getFoodEmoji(category),
    bg: getFoodBgColor(category),
  }
}
