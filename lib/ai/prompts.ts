export interface MealPlanPromptParams {
  dietStyle: string
  dailyCalories: number
  protein: number
  carbs: number
  fat: number
  mealsPerDay: number
  days: number
  availableFoods: string[]
  dislikedFoods: string[]
  allergies: string[]
  cookingTime: string
  mealPrepStyle: string
}

export function buildMealPlanPrompt(params: MealPlanPromptParams): string {
  return `You are a professional nutritionist AI. Generate a structured ${params.days}-day meal plan.

REQUIREMENTS:
- Diet Style: ${params.dietStyle}
- Daily Target: ${params.dailyCalories} calories | ${params.protein}g protein | ${params.carbs}g carbs | ${params.fat}g fat
- Meals Per Day: ${params.mealsPerDay}
- Available Foods: ${params.availableFoods.length > 0 ? params.availableFoods.join(', ') : 'Any foods'}
- Disliked Foods: ${params.dislikedFoods.length > 0 ? params.dislikedFoods.join(', ') : 'None'}
- Allergies: ${params.allergies.length > 0 ? params.allergies.join(', ') : 'None'}
- Cooking Time: ${params.cookingTime}
- Meal Prep Style: ${params.mealPrepStyle}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "meal_type": "breakfast",
          "name": "Meal name",
          "foods": [
            {
              "food_name": "Food name",
              "quantity": 100,
              "serving_unit": "g",
              "calories": 165,
              "protein": 31,
              "carbs": 0,
              "fat": 3.6
            }
          ],
          "total_calories": 165,
          "total_protein": 31,
          "total_carbs": 0,
          "total_fat": 3.6
        }
      ],
      "total_calories": 1800,
      "total_protein": 150,
      "total_carbs": 180,
      "total_fat": 60
    }
  ]
}`
}
