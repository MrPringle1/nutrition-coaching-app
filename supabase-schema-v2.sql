-- NutriCoach Platform v2 Schema
-- Run this in Supabase SQL Editor after v1 schema
-- Safe: uses CREATE TABLE IF NOT EXISTS + ALTER TABLE ... ADD COLUMN IF NOT EXISTS

-- ============================================================
-- UTILITY: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ALTER EXISTING TABLES: add missing columns
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS activity_level text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'lose_weight';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS editing_locked boolean DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES profiles(id);
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS daily_fiber int DEFAULT 25;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS daily_sugar int DEFAULT 50;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS daily_sodium int DEFAULT 2300;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS calorie_deficit_target int DEFAULT 500;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS quantity text;
ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS waist numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS body_fat numeric;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS progress_photo_url text;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS energy_level int;
ALTER TABLE progress_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW();

-- ============================================================
-- FOODS
-- ============================================================
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  category text DEFAULT 'other',
  serving_size numeric DEFAULT 1,
  serving_unit text DEFAULT 'serving',
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  sugar numeric DEFAULT 0,
  sodium numeric DEFAULT 0,
  cholesterol numeric DEFAULT 0,
  image_url text,
  created_by uuid REFERENCES profiles(id),
  source text DEFAULT 'system' CHECK (source IN ('system','coach','client','imported')),
  is_public boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_foods_source ON foods(source);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_created_by ON foods(created_by);

-- ============================================================
-- FOOD LIBRARIES
-- ============================================================
CREATE TABLE IF NOT EXISTS food_libraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid REFERENCES food_libraries(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(library_id, food_id)
);

-- ============================================================
-- MEAL TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_type text DEFAULT 'any',
  description text,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_template_id uuid REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  quantity numeric DEFAULT 1,
  serving_unit text DEFAULT 'serving',
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- DAILY FOOD LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  meal_plan_id uuid REFERENCES meal_plans(id),
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(client_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_client_date ON daily_food_logs(client_id, log_date);

CREATE TABLE IF NOT EXISTS logged_food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id uuid REFERENCES daily_food_logs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  meal_type text NOT NULL DEFAULT 'breakfast' CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  quantity numeric DEFAULT 1,
  serving_unit text DEFAULT 'serving',
  calories numeric DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  sugar numeric DEFAULT 0,
  sodium numeric DEFAULT 0,
  is_planned boolean DEFAULT false,
  eaten_status text DEFAULT 'eaten' CHECK (eaten_status IN ('planned','eaten','skipped')),
  food_name text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logged_items_log ON logged_food_items(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_logged_items_client ON logged_food_items(client_id);

-- ============================================================
-- FAVORITE & RECENT FOODS
-- ============================================================
CREATE TABLE IF NOT EXISTS favorite_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(client_id, food_id)
);

CREATE TABLE IF NOT EXISTS recent_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE CASCADE,
  used_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recent_foods_client ON recent_foods(client_id, used_at DESC);

-- ============================================================
-- FOOD SWAPS
-- ============================================================
CREATE TABLE IF NOT EXISTS food_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  original_food_id uuid REFERENCES foods(id),
  replacement_food_id uuid REFERENCES foods(id),
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- WEEKLY GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES profiles(id),
  week_start date NOT NULL,
  calorie_goal int,
  protein_goal int,
  water_goal_oz int,
  weight_goal numeric,
  habit_goal text,
  checkin_required boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(client_id, week_start)
);

-- ============================================================
-- MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  milestone_type text DEFAULT 'custom',
  target_value numeric,
  current_value numeric,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- COACH NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  note text NOT NULL,
  visibility text DEFAULT 'private' CHECK (visibility IN ('private','client_visible')),
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
DO $$ BEGIN
  CREATE TRIGGER trg_foods_updated BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_daily_logs_updated BEFORE UPDATE ON daily_food_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_logged_items_updated BEFORE UPDATE ON logged_food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_milestones_updated BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logged_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;

-- Foods: public system foods readable by all; coach/client foods by their owner/coach
CREATE POLICY "foods_read" ON foods FOR SELECT USING (
  is_public = true
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM clients c
    WHERE c.coach_id = auth.uid()
    AND c.profile_id = foods.created_by
  )
);
CREATE POLICY "foods_insert" ON foods FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "foods_update" ON foods FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "foods_delete" ON foods FOR DELETE USING (created_by = auth.uid());

-- Daily logs: clients own their logs; coaches can view their clients' logs
CREATE POLICY "logs_select" ON daily_food_logs FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  OR client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
);
CREATE POLICY "logs_insert" ON daily_food_logs FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid() AND editing_locked = false)
);
CREATE POLICY "logs_update" ON daily_food_logs FOR UPDATE USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- Logged food items
CREATE POLICY "items_select" ON logged_food_items FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  OR client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
);
CREATE POLICY "items_insert" ON logged_food_items FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid() AND editing_locked = false)
);
CREATE POLICY "items_update" ON logged_food_items FOR UPDATE USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);
CREATE POLICY "items_delete" ON logged_food_items FOR DELETE USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- Favorites
CREATE POLICY "favs_all" ON favorite_foods FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- Recent
CREATE POLICY "recent_all" ON recent_foods FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- Weekly goals
CREATE POLICY "wg_select" ON weekly_goals FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  OR coach_id = auth.uid()
);
CREATE POLICY "wg_insert" ON weekly_goals FOR INSERT WITH CHECK (coach_id = auth.uid());
CREATE POLICY "wg_update" ON weekly_goals FOR UPDATE USING (coach_id = auth.uid());

-- Milestones
CREATE POLICY "ms_select" ON milestones FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  OR coach_id = auth.uid()
);
CREATE POLICY "ms_all_coach" ON milestones FOR ALL USING (coach_id = auth.uid());

-- Coach notes
CREATE POLICY "cn_coach" ON coach_notes FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "cn_client_visible" ON coach_notes FOR SELECT USING (
  visibility = 'client_visible'
  AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
);

-- Food swaps
CREATE POLICY "swaps_select" ON food_swaps FOR SELECT USING (
  coach_id = auth.uid()
  OR coach_id IN (SELECT coach_id FROM clients WHERE profile_id = auth.uid())
);
CREATE POLICY "swaps_manage" ON food_swaps FOR ALL USING (coach_id = auth.uid());

-- Food libraries
CREATE POLICY "lib_coach" ON food_libraries FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "lib_items_coach" ON food_library_items FOR ALL USING (
  library_id IN (SELECT id FROM food_libraries WHERE coach_id = auth.uid())
);

-- Meal templates
CREATE POLICY "tmpl_coach" ON meal_templates FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "tmpl_items_coach" ON meal_template_items FOR ALL USING (
  meal_template_id IN (SELECT id FROM meal_templates WHERE coach_id = auth.uid())
);

-- ============================================================
-- SEED: System Foods (30 common foods)
-- ============================================================
INSERT INTO foods (name, brand, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium, source, is_public, is_verified)
VALUES
('Chicken Breast (grilled)', NULL, 'protein', 3, 'oz', 140, 26, 0, 3, 0, 0, 65, 'system', true, true),
('Ground Turkey (93% lean)', NULL, 'protein', 3, 'oz', 160, 22, 0, 8, 0, 0, 75, 'system', true, true),
('Salmon (baked)', NULL, 'protein', 3, 'oz', 175, 25, 0, 8, 0, 0, 50, 'system', true, true),
('Egg (large)', NULL, 'protein', 1, 'egg', 70, 6, 0, 5, 0, 0, 70, 'system', true, true),
('Egg Whites', NULL, 'protein', 3, 'egg whites', 50, 11, 0, 0, 0, 0, 165, 'system', true, true),
('Greek Yogurt (plain, 0%)', 'Fage', 'dairy', 1, 'cup', 100, 18, 6, 0, 0, 6, 65, 'system', true, true),
('Cottage Cheese (low fat)', NULL, 'dairy', 0.5, 'cup', 90, 12, 4, 2, 0, 3, 360, 'system', true, true),
('Tuna (canned in water)', NULL, 'protein', 3, 'oz', 100, 22, 0, 1, 0, 0, 300, 'system', true, true),
('Shrimp (cooked)', NULL, 'protein', 3, 'oz', 85, 18, 1, 1, 0, 0, 190, 'system', true, true),
('Black Beans (cooked)', NULL, 'legume', 0.5, 'cup', 114, 8, 20, 0, 8, 0, 1, 'system', true, true),
('Brown Rice (cooked)', NULL, 'grain', 0.5, 'cup', 108, 2, 22, 1, 2, 0, 5, 'system', true, true),
('Sweet Potato (baked)', NULL, 'vegetable', 1, 'medium', 103, 2, 24, 0, 4, 7, 41, 'system', true, true),
('Oatmeal (dry)', NULL, 'grain', 0.5, 'cup', 150, 5, 27, 3, 4, 1, 0, 'system', true, true),
('Quinoa (cooked)', NULL, 'grain', 0.5, 'cup', 111, 4, 20, 2, 3, 1, 6, 'system', true, true),
('White Rice (cooked)', NULL, 'grain', 0.5, 'cup', 103, 2, 22, 0, 0, 0, 1, 'system', true, true),
('Broccoli (raw)', NULL, 'vegetable', 1, 'cup', 31, 3, 6, 0, 2, 2, 30, 'system', true, true),
('Spinach (raw)', NULL, 'vegetable', 2, 'cups', 14, 2, 2, 0, 1, 0, 48, 'system', true, true),
('Banana', NULL, 'fruit', 1, 'medium', 105, 1, 27, 0, 3, 14, 1, 'system', true, true),
('Apple', NULL, 'fruit', 1, 'medium', 95, 0, 25, 0, 4, 19, 2, 'system', true, true),
('Blueberries', NULL, 'fruit', 0.5, 'cup', 42, 1, 11, 0, 2, 7, 1, 'system', true, true),
('Almonds', NULL, 'fat', 1, 'oz', 164, 6, 6, 14, 4, 1, 0, 'system', true, true),
('Avocado', NULL, 'fat', 0.5, 'medium', 80, 1, 4, 7, 3, 0, 4, 'system', true, true),
('Olive Oil', NULL, 'fat', 1, 'tbsp', 119, 0, 0, 14, 0, 0, 0, 'system', true, true),
('Peanut Butter (natural)', NULL, 'fat', 2, 'tbsp', 190, 8, 7, 16, 2, 2, 140, 'system', true, true),
('Whole Milk', NULL, 'dairy', 1, 'cup', 149, 8, 12, 8, 0, 12, 105, 'system', true, true),
('Almond Milk (unsweetened)', NULL, 'dairy', 1, 'cup', 30, 1, 1, 2, 1, 0, 150, 'system', true, true),
('Protein Shake (vanilla)', NULL, 'supplement', 1, 'scoop', 120, 25, 3, 2, 1, 2, 150, 'system', true, true),
('Whole Wheat Bread', NULL, 'grain', 1, 'slice', 80, 4, 15, 1, 2, 2, 135, 'system', true, true),
('Gluten-Free Bread', NULL, 'grain', 1, 'slice', 70, 1, 14, 1, 1, 1, 180, 'system', true, true),
('Turkey (deli, sliced)', NULL, 'protein', 2, 'oz', 50, 10, 1, 1, 0, 0, 450, 'system', true, true)
ON CONFLICT DO NOTHING;
