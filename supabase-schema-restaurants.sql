-- NutriCoach: Restaurant Partner System Schema
-- Run AFTER supabase-schema-v2.sql
-- Safe: CREATE TABLE IF NOT EXISTS + ALTER TABLE ... ADD COLUMN IF NOT EXISTS

-- ============================================================
-- RESTAURANT PARTNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  business_type text DEFAULT 'restaurant',
  description text,
  logo_url text,
  cover_image_url text,
  website_url text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip_code text,
  latitude numeric,
  longitude numeric,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  subscription_status text DEFAULT 'free',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurant_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurant_partners(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_type ON restaurant_partners(business_type);

DO $$ BEGIN
  CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON restaurant_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- MENU CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant_partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_cats_restaurant ON restaurant_menu_categories(restaurant_id, display_order);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant_partners(id) ON DELETE CASCADE,
  category_id uuid REFERENCES restaurant_menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  price numeric,
  serving_size numeric DEFAULT 1,
  serving_unit text DEFAULT 'serving',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  fiber numeric DEFAULT 0,
  sugar numeric DEFAULT 0,
  sodium numeric DEFAULT 0,
  cholesterol numeric DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_high_protein boolean DEFAULT false,
  is_low_carb boolean DEFAULT false,
  is_low_calorie boolean DEFAULT false,
  is_coach_approved boolean DEFAULT false,
  is_available boolean DEFAULT true,
  times_logged int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON restaurant_menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON restaurant_menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_filters ON restaurant_menu_items(is_high_protein, is_low_carb, is_low_calorie, is_coach_approved);
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON restaurant_menu_items USING gin(to_tsvector('english', name));

DO $$ BEGIN
  CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON restaurant_menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- MENU ITEM CUSTOMIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_item_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES restaurant_menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  customization_type text DEFAULT 'add_on',
  calories_delta numeric DEFAULT 0,
  protein_delta numeric DEFAULT 0,
  carbs_delta numeric DEFAULT 0,
  fat_delta numeric DEFAULT 0,
  sodium_delta numeric DEFAULT 0,
  price_delta numeric DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- ============================================================
-- RESTAURANT ADS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant_partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  call_to_action text DEFAULT 'View Menu',
  target_url text,
  placement text DEFAULT 'dashboard',
  start_date date,
  end_date date,
  daily_budget numeric,
  status text DEFAULT 'draft',
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_active ON restaurant_ads(status, placement, start_date, end_date);

-- ============================================================
-- AD EVENTS (impression / click tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES restaurant_ads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text CHECK (event_type IN ('impression','click')),
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_events_ad ON restaurant_ad_events(ad_id, event_type);

-- ============================================================
-- ALTER logged_food_items: add restaurant tracking columns
-- ============================================================
ALTER TABLE logged_food_items
  ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurant_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS restaurant_menu_item_id uuid REFERENCES restaurant_menu_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'food_database',
  ADD COLUMN IF NOT EXISTS source_label text;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE restaurant_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_item_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_ad_events ENABLE ROW LEVEL SECURITY;

-- Restaurants: active + verified are public to all auth users
CREATE POLICY "restaurants_public_read" ON restaurant_partners FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "restaurants_owner_all" ON restaurant_partners FOR ALL
  USING (owner_profile_id = auth.uid());

-- Menu categories: readable by all auth, manageable by owner
CREATE POLICY "menu_cats_read" ON restaurant_menu_categories FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurant_partners WHERE is_active = true));
CREATE POLICY "menu_cats_owner" ON restaurant_menu_categories FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurant_partners WHERE owner_profile_id = auth.uid()));

-- Menu items: readable by all auth, manageable by owner
CREATE POLICY "menu_items_read" ON restaurant_menu_items FOR SELECT TO authenticated
  USING (restaurant_id IN (SELECT id FROM restaurant_partners WHERE is_active = true) AND is_available = true);
CREATE POLICY "menu_items_owner" ON restaurant_menu_items FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurant_partners WHERE owner_profile_id = auth.uid()));

-- Customizations
CREATE POLICY "customizations_read" ON restaurant_item_customizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "customizations_owner" ON restaurant_item_customizations FOR ALL
  USING (menu_item_id IN (
    SELECT mi.id FROM restaurant_menu_items mi
    JOIN restaurant_partners rp ON rp.id = mi.restaurant_id
    WHERE rp.owner_profile_id = auth.uid()
  ));

-- Ads: active ads visible to all; management by owner
CREATE POLICY "ads_active_read" ON restaurant_ads FOR SELECT TO authenticated
  USING (status = 'active');
CREATE POLICY "ads_owner" ON restaurant_ads FOR ALL
  USING (restaurant_id IN (SELECT id FROM restaurant_partners WHERE owner_profile_id = auth.uid()));

-- Ad events
CREATE POLICY "ad_events_insert" ON restaurant_ad_events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ad_events_owner_read" ON restaurant_ad_events FOR SELECT
  USING (ad_id IN (
    SELECT a.id FROM restaurant_ads a
    JOIN restaurant_partners rp ON rp.id = a.restaurant_id
    WHERE rp.owner_profile_id = auth.uid()
  ));

-- ============================================================
-- SEED: Sample restaurant partners
-- ============================================================
DO $$
DECLARE
  chipotle_id uuid := gen_random_uuid();
  mealprep_id uuid := gen_random_uuid();
  smoothie_id uuid := gen_random_uuid();

  -- Chipotle categories
  cat_bowls uuid := gen_random_uuid();
  cat_burritos uuid := gen_random_uuid();
  cat_sides uuid := gen_random_uuid();

  -- Meal prep categories
  cat_mp_lunch uuid := gen_random_uuid();
  cat_mp_dinner uuid := gen_random_uuid();

  -- Smoothie categories
  cat_sm_smoothie uuid := gen_random_uuid();
  cat_sm_juice uuid := gen_random_uuid();

BEGIN

-- RESTAURANTS
INSERT INTO restaurant_partners (id, business_name, business_type, description, city, state, is_verified, is_active, subscription_status)
VALUES
  (chipotle_id, 'Chipotle Mexican Grill', 'fast_casual', 'Fresh Mexican-inspired food made with responsibly sourced ingredients.', 'Nationwide', 'US', true, true, 'featured'),
  (mealprep_id, 'CleanPlate Meal Prep Co.', 'meal_prep', 'Weekly macro-balanced meal prep delivered to your door. Gluten-free options available.', 'Houston', 'TX', true, true, 'premium'),
  (smoothie_id, 'Green Boost Smoothie Bar', 'smoothie_bar', 'Cold-pressed juices, protein smoothies, and wellness shots made fresh daily.', 'Houston', 'TX', true, true, 'free')
ON CONFLICT DO NOTHING;

-- CHIPOTLE CATEGORIES
INSERT INTO restaurant_menu_categories (id, restaurant_id, name, display_order)
VALUES
  (cat_bowls, chipotle_id, 'Bowls', 1),
  (cat_burritos, chipotle_id, 'Burritos', 2),
  (cat_sides, chipotle_id, 'Sides & Extras', 3)
ON CONFLICT DO NOTHING;

-- CHIPOTLE MENU ITEMS
INSERT INTO restaurant_menu_items (restaurant_id, category_id, name, description, calories, protein, carbs, fat, fiber, sugar, sodium, price, serving_size, serving_unit, tags, is_high_protein, is_low_carb, is_low_calorie)
VALUES
  (chipotle_id, cat_bowls, 'Chicken Bowl (no rice)', 'Grilled chicken, black beans, fajita veggies, salsa, guac', 515, 43, 32, 23, 9, 5, 1040, 11.50, 1, 'serving', ARRAY['high-protein','gluten-free'], true, false, false),
  (chipotle_id, cat_bowls, 'Steak Bowl', 'Grilled steak, brown rice, pinto beans, sour cream, cheese, salsa', 750, 47, 71, 27, 9, 5, 1510, 12.25, 1, 'serving', ARRAY['high-protein'], true, false, false),
  (chipotle_id, cat_bowls, 'Veggie Bowl', 'Sofritas, brown rice, black beans, fajita veggies, guac, lettuce', 620, 18, 72, 26, 14, 7, 890, 10.75, 1, 'serving', ARRAY['vegetarian','vegan'], false, false, false),
  (chipotle_id, cat_bowls, 'Chicken Salad Bowl', 'Grilled chicken, romaine, salsa fresca, guac, no rice no beans', 395, 40, 14, 19, 6, 4, 870, 11.50, 1, 'serving', ARRAY['high-protein','low-carb','gluten-free'], true, true, true),
  (chipotle_id, cat_burritos, 'Chicken Burrito', 'Flour tortilla, chicken, rice, beans, cheese, sour cream, salsa', 1025, 51, 104, 35, 10, 6, 2260, 11.50, 1, 'serving', ARRAY['high-protein'], true, false, false),
  (chipotle_id, cat_sides, 'Chips & Salsa', 'House-made tortilla chips with fresh tomatillo salsa', 570, 7, 78, 25, 5, 2, 770, 4.25, 1, 'serving', ARRAY['vegan','vegetarian'], false, false, false),
  (chipotle_id, cat_sides, 'Side of Guacamole', 'Fresh hand-mashed avocado with lime and cilantro', 230, 3, 12, 20, 7, 1, 310, 2.95, 1, 'serving', ARRAY['vegan','keto-friendly'], false, false, false)
ON CONFLICT DO NOTHING;

-- MEAL PREP CATEGORIES
INSERT INTO restaurant_menu_categories (id, restaurant_id, name, display_order)
VALUES
  (cat_mp_lunch, mealprep_id, 'Lunch Meals', 1),
  (cat_mp_dinner, mealprep_id, 'Dinner Meals', 2)
ON CONFLICT DO NOTHING;

-- MEAL PREP MENU ITEMS
INSERT INTO restaurant_menu_items (restaurant_id, category_id, name, description, calories, protein, carbs, fat, fiber, sugar, sodium, price, serving_size, serving_unit, tags, is_high_protein, is_low_carb, is_low_calorie, is_coach_approved)
VALUES
  (mealprep_id, cat_mp_lunch, 'Grilled Chicken & Sweet Potato', 'Herb-marinated grilled chicken breast with roasted sweet potato and steamed broccoli', 480, 48, 38, 10, 6, 9, 520, 12.99, 1, 'meal', ARRAY['high-protein','gluten-free','coach-approved'], true, false, false, true),
  (mealprep_id, cat_mp_lunch, 'Turkey & Quinoa Power Bowl', 'Lean ground turkey, tri-colored quinoa, roasted peppers, and light vinaigrette', 520, 42, 44, 12, 5, 4, 490, 13.49, 1, 'meal', ARRAY['high-protein','gluten-free'], true, false, false, true),
  (mealprep_id, cat_mp_lunch, 'Salmon & Asparagus', 'Wild-caught salmon fillet, steamed asparagus, lemon herb sauce', 420, 38, 8, 22, 3, 2, 380, 15.99, 1, 'meal', ARRAY['high-protein','low-carb','keto-friendly','gluten-free'], true, true, false, true),
  (mealprep_id, cat_mp_dinner, 'Lean Beef & Veggie Stir-Fry', 'Sirloin beef strips, zucchini, bell peppers, broccoli, coconut aminos sauce', 450, 40, 22, 18, 5, 8, 610, 13.99, 1, 'meal', ARRAY['high-protein','gluten-free'], true, false, false, false),
  (mealprep_id, cat_mp_dinner, 'Shrimp & Cauliflower Rice', 'Garlic butter shrimp with riced cauliflower and spinach', 320, 35, 12, 14, 4, 3, 420, 14.49, 1, 'meal', ARRAY['high-protein','low-carb','low-calorie','gluten-free'], true, true, true, true)
ON CONFLICT DO NOTHING;

-- SMOOTHIE CATEGORIES
INSERT INTO restaurant_menu_categories (id, restaurant_id, name, display_order)
VALUES
  (cat_sm_smoothie, smoothie_id, 'Protein Smoothies', 1),
  (cat_sm_juice, smoothie_id, 'Cold-Pressed Juices', 2)
ON CONFLICT DO NOTHING;

-- SMOOTHIE MENU ITEMS
INSERT INTO restaurant_menu_items (restaurant_id, category_id, name, description, calories, protein, carbs, fat, fiber, sugar, sodium, price, serving_size, serving_unit, tags, is_high_protein, is_low_carb, is_low_calorie)
VALUES
  (smoothie_id, cat_sm_smoothie, 'Muscle Builder', 'Banana, almond milk, whey protein, peanut butter, oats, honey', 450, 32, 52, 10, 5, 28, 220, 9.99, 24, 'oz', ARRAY['high-protein'], true, false, false),
  (smoothie_id, cat_sm_smoothie, 'Green Goddess', 'Spinach, kale, banana, almond milk, vanilla protein, chia seeds', 280, 22, 34, 6, 7, 16, 140, 9.49, 24, 'oz', ARRAY['high-protein','low-calorie'], true, false, true),
  (smoothie_id, cat_sm_smoothie, 'Berry Blast Protein', 'Mixed berries, Greek yogurt, protein powder, almond milk, flaxseed', 310, 28, 38, 5, 6, 22, 180, 9.99, 24, 'oz', ARRAY['high-protein','low-calorie'], true, false, true),
  (smoothie_id, cat_sm_smoothie, 'Keto Avocado Shake', 'Avocado, coconut milk, MCT oil, vanilla protein, spinach, stevia', 380, 25, 8, 28, 6, 2, 120, 10.99, 20, 'oz', ARRAY['high-protein','low-carb','keto-friendly'], true, true, false),
  (smoothie_id, cat_sm_juice, 'Green Detox', 'Cold-pressed cucumber, celery, spinach, apple, lemon, ginger', 90, 2, 22, 0, 2, 14, 55, 8.49, 16, 'oz', ARRAY['vegan','low-calorie','detox'], false, false, true),
  (smoothie_id, cat_sm_juice, 'Beet & Carrot Energizer', 'Cold-pressed beet, carrot, orange, turmeric, black pepper', 120, 2, 28, 0, 3, 20, 90, 8.49, 16, 'oz', ARRAY['vegan','low-calorie'], false, false, true)
ON CONFLICT DO NOTHING;

-- SAMPLE ADS
INSERT INTO restaurant_ads (restaurant_id, title, description, call_to_action, placement, status, start_date, end_date)
SELECT mealprep_id, 'Macro-Balanced Meals Delivered', 'Coach-approved meal prep. High protein. Gluten-free. Ready in minutes.', 'See Menu', 'dashboard', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'
ON CONFLICT DO NOTHING;

INSERT INTO restaurant_ads (restaurant_id, title, description, call_to_action, placement, status, start_date, end_date)
SELECT smoothie_id, 'Fuel Your Day Right', 'Protein smoothies with 28g+ protein. No artificial sweeteners. Made fresh.', 'Order Now', 'food_search', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'
ON CONFLICT DO NOTHING;

END $$;
