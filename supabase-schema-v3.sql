-- NutriCoach Platform v3 — Comprehensive Schema
-- Run this AFTER any previous schemas, or run standalone on a fresh project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- ============================================================
-- FOOD CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS food_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT '🍽️',
  color text DEFAULT '#6b7280',
  sort_order int DEFAULT 0
);

-- ============================================================
-- FOODS (comprehensive nutrition table)
-- ============================================================
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED,
  brand text,
  barcode text,
  category_id uuid REFERENCES food_categories(id) ON DELETE SET NULL,
  category text DEFAULT 'other',
  serving_size numeric NOT NULL DEFAULT 100,
  serving_unit text NOT NULL DEFAULT 'g',
  grams_per_serving numeric DEFAULT 100,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  saturated_fat numeric DEFAULT 0,
  polyunsaturated_fat numeric DEFAULT 0,
  monounsaturated_fat numeric DEFAULT 0,
  trans_fat numeric DEFAULT 0,
  cholesterol numeric DEFAULT 0,
  sodium numeric DEFAULT 0,
  potassium numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  sugar numeric DEFAULT 0,
  vitamin_a numeric DEFAULT 0,
  vitamin_c numeric DEFAULT 0,
  calcium numeric DEFAULT 0,
  iron numeric DEFAULT 0,
  image_url text,
  source text DEFAULT 'system',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  search_vector tsvector,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Indexes for foods
CREATE INDEX IF NOT EXISTS idx_foods_normalized ON foods(normalized_name);
CREATE INDEX IF NOT EXISTS idx_foods_brand ON foods(brand);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_verified ON foods(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_foods_public ON foods(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_foods_search ON foods USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING GIN(normalized_name gin_trgm_ops);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION update_food_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.brand, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_foods_search BEFORE INSERT OR UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_food_search_vector();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_foods_updated BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- FOOD ALIASES
-- ============================================================
CREATE TABLE IF NOT EXISTS food_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  alias text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aliases_food ON food_aliases(food_id);
CREATE INDEX IF NOT EXISTS idx_aliases_alias ON food_aliases(LOWER(alias));

-- ============================================================
-- FOOD TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS food_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS food_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES food_tags(id) ON DELETE CASCADE,
  UNIQUE(food_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_tag_links_food ON food_tag_links(food_id);
CREATE INDEX IF NOT EXISTS idx_tag_links_tag ON food_tag_links(tag_id);

-- ============================================================
-- DIET STYLES
-- ============================================================
CREATE TABLE IF NOT EXISTS diet_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#059669'
);

CREATE TABLE IF NOT EXISTS diet_food_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_style_id uuid REFERENCES diet_styles(id) ON DELETE CASCADE,
  food_tag_id uuid REFERENCES food_tags(id) ON DELETE CASCADE,
  rule_type text CHECK (rule_type IN ('allowed', 'restricted', 'forbidden')) DEFAULT 'allowed'
);

-- ============================================================
-- PROFILES (extend existing)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Chicago';

-- ============================================================
-- CLIENTS (extend existing)
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS waist numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hips numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS body_fat numeric;

-- ============================================================
-- CLIENT DIET PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS client_diet_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  diet_style_id uuid REFERENCES diet_styles(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(client_id)
);

CREATE TABLE IF NOT EXISTS client_available_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- FOOD LIBRARIES
-- ============================================================
CREATE TABLE IF NOT EXISTS food_libraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid REFERENCES food_libraries(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(library_id, food_id)
);

-- ============================================================
-- MEAL PLANS (extend existing if needed)
-- ============================================================
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS daily_sodium numeric DEFAULT 2300;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS daily_cholesterol numeric DEFAULT 300;

-- ============================================================
-- PLANNED MEALS (new structure)
-- ============================================================
CREATE TABLE IF NOT EXISTS planned_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_number int NOT NULL DEFAULT 1,
  meal_type text NOT NULL DEFAULT 'breakfast',
  name text NOT NULL,
  notes text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_meals_plan ON planned_meals(meal_plan_id, day_number);

CREATE TABLE IF NOT EXISTS planned_meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_meal_id uuid REFERENCES planned_meals(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  serving_unit text NOT NULL DEFAULT 'serving',
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  food_name text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- MEAL TEMPLATES (extend existing)
-- ============================================================
ALTER TABLE meal_templates ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE meal_templates ADD COLUMN IF NOT EXISTS diet_tags text[] DEFAULT '{}';

-- ============================================================
-- DAILY FOOD LOGS (extend existing)
-- ============================================================
ALTER TABLE daily_food_logs ADD COLUMN IF NOT EXISTS water_oz numeric DEFAULT 0;
ALTER TABLE daily_food_logs ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE daily_food_logs ADD COLUMN IF NOT EXISTS energy_level int;

-- ============================================================
-- LOGGED FOOD ITEMS (extend existing)
-- ============================================================
ALTER TABLE logged_food_items ADD COLUMN IF NOT EXISTS cholesterol numeric DEFAULT 0;

-- ============================================================
-- FREQUENT FOODS
-- ============================================================
CREATE TABLE IF NOT EXISTS frequent_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  log_count int DEFAULT 1,
  last_logged_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(client_id, food_id)
);
CREATE INDEX IF NOT EXISTS idx_frequent_client ON frequent_foods(client_id, log_count DESC);

-- ============================================================
-- FOOD SWAPS
-- ============================================================
CREATE TABLE IF NOT EXISTS food_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  original_food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  replacement_food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  diet_style_id uuid REFERENCES diet_styles(id) ON DELETE SET NULL,
  reason text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swap_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  replacement_food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- PROGRESS LOGS (extend existing)
-- ============================================================
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS waist numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS hips numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS neck numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS chest numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS arms numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS thighs numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS body_fat numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS energy_level int;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS progress_photo_url text;

-- ============================================================
-- NUTRITION REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  total_fiber numeric DEFAULT 0,
  total_sodium numeric DEFAULT 0,
  total_sugar numeric DEFAULT 0,
  total_cholesterol numeric DEFAULT 0,
  total_water_oz numeric DEFAULT 0,
  compliance_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(client_id, report_date)
);
CREATE INDEX IF NOT EXISTS idx_reports_client_date ON nutrition_reports(client_id, report_date DESC);

-- ============================================================
-- RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  servings int DEFAULT 1,
  prep_time_minutes int,
  cook_time_minutes int,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  image_url text,
  source_url text,
  is_public boolean DEFAULT false,
  diet_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  serving_unit text NOT NULL DEFAULT 'g',
  food_name text NOT NULL,
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);

CREATE TABLE IF NOT EXISTS recipe_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source_url text,
  raw_html text,
  parsed_data jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- FOOD SCAN EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS food_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scan_type text CHECK (scan_type IN ('barcode', 'photo')) NOT NULL,
  barcode text,
  photo_url text,
  detected_food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  confidence_score numeric,
  confirmed boolean DEFAULT false,
  confirmed_food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "foods_public_read" ON foods;
CREATE POLICY "foods_public_read" ON foods FOR SELECT TO authenticated
  USING (is_public = true AND is_active = true);
DROP POLICY IF EXISTS "foods_creator_all" ON foods;
CREATE POLICY "foods_creator_all" ON foods FOR ALL
  USING (created_by = auth.uid());

ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_read" ON food_categories;
CREATE POLICY "categories_read" ON food_categories FOR SELECT TO authenticated USING (true);

ALTER TABLE food_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_read" ON food_tags;
CREATE POLICY "tags_read" ON food_tags FOR SELECT TO authenticated USING (true);

ALTER TABLE food_tag_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tag_links_read" ON food_tag_links;
CREATE POLICY "tag_links_read" ON food_tag_links FOR SELECT TO authenticated USING (true);

ALTER TABLE food_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aliases_read" ON food_aliases;
CREATE POLICY "aliases_read" ON food_aliases FOR SELECT TO authenticated USING (true);

ALTER TABLE diet_styles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diet_styles_read" ON diet_styles;
CREATE POLICY "diet_styles_read" ON diet_styles FOR SELECT TO authenticated USING (true);

ALTER TABLE diet_food_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diet_rules_read" ON diet_food_rules;
CREATE POLICY "diet_rules_read" ON diet_food_rules FOR SELECT TO authenticated USING (true);

ALTER TABLE client_diet_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diet_prefs_own" ON client_diet_preferences;
CREATE POLICY "diet_prefs_own" ON client_diet_preferences FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipes_own" ON recipes;
CREATE POLICY "recipes_own" ON recipes FOR ALL USING (created_by = auth.uid());
DROP POLICY IF EXISTS "recipes_public" ON recipes;
CREATE POLICY "recipes_public" ON recipes FOR SELECT TO authenticated USING (is_public = true);

ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipe_items_own" ON recipe_items;
CREATE POLICY "recipe_items_own" ON recipe_items FOR ALL
  USING (recipe_id IN (SELECT id FROM recipes WHERE created_by = auth.uid()));

ALTER TABLE frequent_foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "frequent_own" ON frequent_foods;
CREATE POLICY "frequent_own" ON frequent_foods FOR ALL USING (client_id = auth.uid());

ALTER TABLE food_libraries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "libraries_own" ON food_libraries;
CREATE POLICY "libraries_own" ON food_libraries FOR ALL USING (coach_id = auth.uid());

ALTER TABLE food_library_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_items_own" ON food_library_items;
CREATE POLICY "library_items_own" ON food_library_items FOR ALL
  USING (library_id IN (SELECT id FROM food_libraries WHERE coach_id = auth.uid()));

ALTER TABLE food_swaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "swaps_coach" ON food_swaps;
CREATE POLICY "swaps_coach" ON food_swaps FOR ALL USING (coach_id = auth.uid());
DROP POLICY IF EXISTS "swaps_read_public" ON food_swaps;
CREATE POLICY "swaps_read_public" ON food_swaps FOR SELECT TO authenticated USING (is_active = true);

ALTER TABLE nutrition_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_own" ON nutrition_reports;
CREATE POLICY "reports_own" ON nutrition_reports FOR ALL USING (client_id = auth.uid());

ALTER TABLE food_scan_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scans_own" ON food_scan_events;
CREATE POLICY "scans_own" ON food_scan_events FOR ALL USING (client_id = auth.uid());
