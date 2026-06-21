export type Role = 'coach' | 'client'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
}

export interface Client {
  id: string
  coach_id: string
  profile_id: string
  full_name: string
  email: string
  age: number | null
  height: string | null
  current_weight: number | null
  goal_weight: number | null
  notes: string | null
  created_at: string
}

export interface MealPlan {
  id: string
  client_id: string
  name: string
  daily_calories: number
  daily_protein: number
  daily_carbs: number
  daily_fat: number
  water_goal_oz: number
  created_at: string
}

export interface Meal {
  id: string
  meal_plan_id: string
  day_number: number
  meal_number: number
  meal_label: string
  name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface GroceryItem {
  id: string
  meal_plan_id: string
  category: string
  name: string
  checked: boolean
}

export interface ProgressLog {
  id: string
  client_id: string
  logged_at: string
  weight: number | null
  water_oz: number | null
  notes: string | null
}
