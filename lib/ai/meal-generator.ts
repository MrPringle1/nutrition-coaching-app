export interface GeneratedFood {
  food_name: string
  quantity: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface GeneratedMeal {
  meal_type: string
  name: string
  foods: GeneratedFood[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

export interface GeneratedDay {
  day: number
  meals: GeneratedMeal[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

export interface GeneratedPlan {
  days: GeneratedDay[]
}

export function validateGeneratedPlan(plan: unknown): GeneratedPlan {
  const p = plan as GeneratedPlan
  if (!p || !Array.isArray(p.days)) throw new Error('Invalid plan structure')
  return p
}

export function getDemoPlan(params: { days: number; mealsPerDay: number; dailyCalories: number }): GeneratedPlan {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'].slice(0, params.mealsPerDay)
  return {
    days: Array.from({ length: params.days }, (_, i) => ({
      day: i + 1,
      meals: mealTypes.map(mt => {
        const calsPerMeal = Math.round(params.dailyCalories / params.mealsPerDay)
        return {
          meal_type: mt,
          name: mt === 'breakfast' ? 'High Protein Breakfast' : mt === 'lunch' ? 'Power Lunch' : mt === 'dinner' ? 'Lean Dinner' : 'Protein Snack',
          foods: mt === 'breakfast'
            ? [{ food_name: 'Scrambled Eggs (2 eggs)', quantity: 2, serving_unit: 'eggs', calories: 149, protein: 10, carbs: 2.2, fat: 11 }, { food_name: 'Greek Yogurt (nonfat)', quantity: 170, serving_unit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0 }]
            : mt === 'lunch'
            ? [{ food_name: 'Chicken Breast', quantity: 150, serving_unit: 'g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 }, { food_name: 'Brown Rice (cooked)', quantity: 100, serving_unit: 'g', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9 }]
            : mt === 'dinner'
            ? [{ food_name: 'Atlantic Salmon', quantity: 150, serving_unit: 'g', calories: 312, protein: 30.6, carbs: 0, fat: 20.1 }, { food_name: 'Broccoli', quantity: 150, serving_unit: 'g', calories: 51, protein: 4.2, carbs: 9.9, fat: 0.6 }]
            : [{ food_name: 'Greek Yogurt (nonfat)', quantity: 170, serving_unit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0 }],
          total_calories: calsPerMeal,
          total_protein: Math.round(calsPerMeal * 0.3 / 4),
          total_carbs: Math.round(calsPerMeal * 0.4 / 4),
          total_fat: Math.round(calsPerMeal * 0.3 / 9),
        }
      }),
      total_calories: params.dailyCalories,
      total_protein: Math.round(params.dailyCalories * 0.3 / 4),
      total_carbs: Math.round(params.dailyCalories * 0.4 / 4),
      total_fat: Math.round(params.dailyCalories * 0.3 / 9),
    }))
  }
}
