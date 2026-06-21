// NutriCoach Platform v2 — Full Type System

export type Role = 'coach' | 'client'
export type Source = 'system' | 'coach' | 'client' | 'imported'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type EatenStatus = 'planned' | 'eaten' | 'skipped'
export type ClientStatus = 'active' | 'inactive' | 'paused'
export type NoteVisibility = 'private' | 'client_visible'
export type MilestoneType = 'weight' | 'streak' | 'nutrition' | 'custom' | 'first_log'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  coach_id: string
  profile_id: string
  full_name: string
  email: string
  phone: string | null
  age: number | null
  gender: string | null
  height: string | null
  current_weight: number | null
  goal_weight: number | null
  activity_level: string | null
  goal_type: string | null
  notes: string | null
  client_status: ClientStatus
  editing_locked: boolean
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  client_id: string
  coach_id: string | null
  name: string
  description: string | null
  daily_calories: number
  daily_protein: number
  daily_carbs: number
  daily_fat: number
  daily_fiber: number
  daily_sugar: number
  daily_sodium: number
  water_goal_oz: number
  calorie_deficit_target: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Food {
  id: string
  name: string
  normalized_name: string
  brand: string | null
  barcode: string | null
  category: string
  serving_size: number
  serving_unit: string
  grams_per_serving: number
  calories: number
  protein: number
  carbs: number
  fat: number
  saturated_fat: number
  polyunsaturated_fat: number
  monounsaturated_fat: number
  trans_fat: number
  cholesterol: number
  sodium: number
  potassium: number
  fiber: number
  sugar: number
  vitamin_a: number
  vitamin_c: number
  calcium: number
  iron: number
  image_url: string | null
  created_by: string | null
  source: Source
  is_public: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface FoodLibrary {
  id: string
  coach_id: string
  name: string
  description: string | null
  created_at: string
}

export interface FoodLibraryItem {
  id: string
  library_id: string
  food_id: string
  food?: Food
  created_at: string
}

export interface MealTemplate {
  id: string
  coach_id: string
  name: string
  meal_type: string
  description: string | null
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  image_url: string | null
  items?: MealTemplateItem[]
  created_at: string
  updated_at: string
}

export interface MealTemplateItem {
  id: string
  meal_template_id: string
  food_id: string
  quantity: number
  serving_unit: string
  food?: Food
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

export interface DailyFoodLog {
  id: string
  client_id: string
  meal_plan_id: string | null
  log_date: string
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface LoggedFoodItem {
  id: string
  daily_log_id: string
  client_id: string
  food_id: string | null
  meal_type: MealType
  quantity: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  cholesterol: number
  is_planned: boolean
  eaten_status: EatenStatus
  food_name: string | null
  food?: Food
  created_at: string
  updated_at: string
}

export interface FavoriteFood {
  id: string
  client_id: string
  food_id: string
  food?: Food
  created_at: string
}

export interface RecentFood {
  id: string
  client_id: string
  food_id: string
  food?: Food
  used_at: string
}

export interface FoodSwap {
  id: string
  coach_id: string
  original_food_id: string
  replacement_food_id: string
  notes: string | null
  original_food?: Food
  replacement_food?: Food
  created_at: string
}

export interface WeeklyGoal {
  id: string
  client_id: string
  coach_id: string | null
  week_start: string
  calorie_goal: number | null
  protein_goal: number | null
  water_goal_oz: number | null
  weight_goal: number | null
  habit_goal: string | null
  checkin_required: boolean
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  client_id: string
  coach_id: string | null
  title: string
  description: string | null
  milestone_type: MilestoneType
  target_value: number | null
  current_value: number | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ProgressLog {
  id: string
  client_id: string
  logged_at: string
  weight: number | null
  water_oz: number | null
  waist: number | null
  hips: number | null
  neck: number | null
  chest: number | null
  arms: number | null
  thighs: number | null
  body_fat: number | null
  notes: string | null
  progress_photo_url: string | null
  mood: string | null
  energy_level: number | null
  created_at: string
}

export interface CoachNote {
  id: string
  coach_id: string
  client_id: string
  note: string
  visibility: NoteVisibility
  created_at: string
}

export interface GroceryItem {
  id: string
  meal_plan_id: string
  client_id: string | null
  category: string
  name: string
  quantity: string | null
  checked: boolean
  created_at: string
  updated_at: string
}

// ─── Utility / computed types ────────────────────────────────
export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  water_oz: number
}

export interface MacroTargets extends MacroTotals {
  calorie_deficit_target: number
}

export interface NutritionStatus {
  calories: 'on_track' | 'under' | 'over'
  protein: 'on_track' | 'under' | 'over'
  carbs: 'on_track' | 'under' | 'over'
  fat: 'on_track' | 'under' | 'over'
  overall: 'on_track' | 'under' | 'over' | 'no_data'
}

export interface FoodWithQty extends Food {
  quantity: number
  selectedUnit: string
}

export interface DayMacros {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  logged: boolean
}

// ─── Restaurant Partner System ───────────────────────────────
export interface RestaurantPartner {
  id: string
  owner_profile_id: string | null
  business_name: string
  business_type: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  website_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  is_verified: boolean
  is_active: boolean
  subscription_status: string
  created_at: string
  updated_at: string
}

export interface RestaurantMenuCategory {
  id: string
  restaurant_id: string
  name: string
  display_order: number
  created_at: string
}

export interface RestaurantMenuItem {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  image_url: string | null
  price: number | null
  serving_size: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  cholesterol: number
  tags: string[]
  is_high_protein: boolean
  is_low_carb: boolean
  is_low_calorie: boolean
  is_coach_approved: boolean
  is_available: boolean
  times_logged: number
  created_at: string
  updated_at: string
}

export interface RestaurantAd {
  id: string
  restaurant_id: string
  title: string
  description: string | null
  image_url: string | null
  call_to_action: string
  target_url: string | null
  placement: string
  start_date: string | null
  end_date: string | null
  status: string
  impressions: number
  clicks: number
  created_at: string
  restaurant?: RestaurantPartner
}

export interface LoggedFoodItemRestaurant extends LoggedFoodItem {
  restaurant_id: string | null
  restaurant_menu_item_id: string | null
  source_type: string
  source_label: string | null
}

// ─── v3 Platform Types ───────────────────────────────────────
export interface FoodCategory {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  sort_order: number
}

export interface FoodTag {
  id: string
  name: string
  slug: string
}

export interface DietStyle {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
}

export interface FrequentFood {
  id: string
  client_id: string
  food_id: string
  log_count: number
  last_logged_at: string
  food?: Food
}

export interface Recipe {
  id: string
  created_by: string
  coach_id: string | null
  name: string
  description: string | null
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  image_url: string | null
  source_url: string | null
  is_public: boolean
  diet_tags: string[]
  items?: RecipeItem[]
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: string
  recipe_id: string
  food_id: string | null
  quantity: number
  serving_unit: string
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sort_order: number
  food?: Food
}

export interface FoodScanEvent {
  id: string
  client_id: string
  scan_type: 'barcode' | 'photo'
  barcode: string | null
  photo_url: string | null
  detected_food_id: string | null
  confidence_score: number | null
  confirmed: boolean
  confirmed_food_id: string | null
  created_at: string
}

export interface NutritionReport {
  id: string
  client_id: string
  report_date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  total_sodium: number
  total_sugar: number
  total_cholesterol: number
  total_water_oz: number
  compliance_score: number
}
