-- NutriCoach Seed Foods
-- Run AFTER supabase-schema-v3.sql

-- ============================================================
-- FOOD CATEGORIES
-- ============================================================
INSERT INTO food_categories (name, slug, icon, color, sort_order) VALUES
  ('Eggs & Egg Products', 'eggs', '🥚', '#f59e0b', 1),
  ('Poultry', 'poultry', '🍗', '#f97316', 2),
  ('Beef & Pork', 'beef-pork', '🥩', '#dc2626', 3),
  ('Seafood', 'seafood', '🐟', '#0891b2', 4),
  ('Vegetables', 'vegetables', '🥦', '#16a34a', 5),
  ('Fruits', 'fruits', '🍎', '#dc2626', 6),
  ('Grains & Carbs', 'grains', '🌾', '#d97706', 7),
  ('Dairy', 'dairy', '🥛', '#60a5fa', 8),
  ('Nuts & Seeds', 'nuts-seeds', '🥜', '#92400e', 9),
  ('Fats & Oils', 'fats-oils', '🫒', '#65a30d', 10),
  ('Legumes', 'legumes', '🫘', '#854d0e', 11),
  ('Beverages', 'beverages', '🥤', '#3b82f6', 12),
  ('Snacks & Bars', 'snacks', '🍫', '#7c3aed', 13),
  ('Sauces & Condiments', 'sauces', '🫙', '#0f766e', 14),
  ('Supplements', 'supplements', '💊', '#7c3aed', 15),
  ('Restaurant & Fast Food', 'restaurant', '🍔', '#ef4444', 16)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DIET STYLES
-- ============================================================
INSERT INTO diet_styles (name, slug, description, color) VALUES
  ('Carnivore', 'carnivore', 'Animal products only — meat, fish, eggs, dairy', '#b45309'),
  ('Keto', 'keto', 'Very low carb, high fat — under 20-50g net carbs per day', '#7c3aed'),
  ('Low-Carb', 'low-carb', 'Reduced carbohydrates — under 100-150g carbs per day', '#0891b2'),
  ('Paleo', 'paleo', 'Whole unprocessed foods — meat, fish, eggs, vegetables, fruits, nuts', '#65a30d'),
  ('Mediterranean', 'mediterranean', 'Olive oil, fish, vegetables, legumes, whole grains, moderate dairy', '#2563eb'),
  ('High-Protein', 'high-protein', '30-40% of calories from protein — muscle building and fat loss', '#7c3aed'),
  ('Balanced', 'balanced', 'Standard macros — 40% carbs, 30% protein, 30% fat', '#059669'),
  ('Vegetarian', 'vegetarian', 'No meat or fish — includes dairy and eggs', '#16a34a'),
  ('Vegan', 'vegan', 'No animal products of any kind', '#15803d'),
  ('Low-Fat', 'low-fat', 'Under 30% calories from fat — heart health focused', '#dc2626')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FOOD TAGS
-- ============================================================
INSERT INTO food_tags (name, slug) VALUES
  ('High Protein', 'high-protein'),
  ('Low Carb', 'low-carb'),
  ('High Fat', 'high-fat'),
  ('Low Fat', 'low-fat'),
  ('Low Calorie', 'low-calorie'),
  ('High Fiber', 'high-fiber'),
  ('Dairy Free', 'dairy-free'),
  ('Gluten Free', 'gluten-free'),
  ('Vegan', 'vegan'),
  ('Vegetarian', 'vegetarian'),
  ('Keto Friendly', 'keto-friendly'),
  ('Paleo Friendly', 'paleo-friendly'),
  ('Carnivore Friendly', 'carnivore-friendly'),
  ('Whole Food', 'whole-food'),
  ('Processed', 'processed'),
  ('Fermented', 'fermented'),
  ('Raw', 'raw'),
  ('Organic', 'organic')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FOODS
-- ============================================================

-- EGGS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Large Egg (whole, raw)', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 50, 72, 6.3, 0.4, 5, 1.5, 186, 71, 0, 0.2, true, true, 'system'),
('Egg Whites (raw)', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 100, 'g', 100, 52, 11, 0.7, 0.2, 0, 0, 66, 0, 0.7, true, true, 'system'),
('Egg Yolk (raw)', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 17, 'g', 17, 55, 2.7, 0.6, 4.5, 1.6, 210, 8, 0, 0.1, true, true, 'system'),
('Hard-Boiled Egg', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 50, 78, 6.3, 0.6, 5.3, 1.6, 187, 62, 0, 0.6, true, true, 'system'),
('Scrambled Eggs (2 eggs)', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 2, 'eggs', 100, 149, 10, 2.2, 11, 3.3, 372, 211, 0, 1.7, true, true, 'system'),
('Fried Egg', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 46, 90, 6.3, 0.4, 7, 2, 184, 94, 0, 0.4, true, true, 'system'),
('Liquid Egg Whites (carton)', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 240, 'ml', 240, 122, 26, 1.7, 0.4, 0, 0, 440, 0, 0, true, true, 'system'),
('Pasture-Raised Egg', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 50, 80, 7, 0, 5, 1.5, 195, 65, 0, 0, true, true, 'system'),
('Cage-Free Egg', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 50, 77, 6.5, 0.6, 5.3, 1.5, 186, 62, 0, 0.6, true, true, 'system'),
('Soft-Boiled Egg', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 50, 77, 6.3, 0.6, 5.4, 1.6, 186, 62, 0, 0.6, true, true, 'system'),
('Poached Egg', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 1, 'whole egg', 50, 72, 6, 0.4, 5, 1.5, 185, 147, 0, 0.4, true, true, 'system'),
('Deviled Eggs (2 halves)', (SELECT id FROM food_categories WHERE slug='eggs'), 'eggs', 2, 'halves', 60, 126, 6, 0.5, 10.5, 2.5, 194, 89, 0, 0.3, true, true, 'system');

-- POULTRY
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Chicken Breast (raw, skinless)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 165, 31, 0, 3.6, 1, 85, 74, 0, 0, true, true, 'system'),
('Chicken Breast (cooked, grilled)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 165, 31, 0, 3.6, 1, 85, 74, 0, 0, true, true, 'system'),
('Chicken Thigh (raw, skinless)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 177, 18, 0, 11, 3, 90, 88, 0, 0, true, true, 'system'),
('Chicken Thigh (cooked, skinless)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 179, 24, 0, 8.9, 2.5, 105, 97, 0, 0, true, true, 'system'),
('Chicken Wing (raw)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 203, 18.3, 0, 14, 4, 75, 80, 0, 0, true, true, 'system'),
('Chicken Drumstick (cooked)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 172, 28, 0, 5.7, 1.5, 93, 93, 0, 0, true, true, 'system'),
('Ground Chicken (93% lean)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 148, 17, 0, 8.1, 2.3, 93, 98, 0, 0, true, true, 'system'),
('Turkey Breast (skinless, raw)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 135, 30, 0, 1, 0.3, 69, 63, 0, 0, true, true, 'system'),
('Ground Turkey 93/7', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 148, 17, 0, 8, 2, 90, 95, 0, 0, true, true, 'system'),
('Ground Turkey 99% Lean', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 120, 28, 0, 1, 0.3, 74, 67, 0, 0, true, true, 'system'),
('Rotisserie Chicken Breast', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 166, 28.6, 0, 5.7, 1.6, 88, 348, 0, 0, true, true, 'system'),
('Turkey Bacon (2 slices)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 2, 'slices', 28, 70, 4, 1, 6, 2, 25, 390, 0, 0, true, true, 'system'),
('Duck Breast (raw)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 201, 17.4, 0, 11.2, 3, 89, 74, 0, 0, true, true, 'system'),
('Chicken Sausage', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 148, 13.2, 2.2, 9.4, 2.5, 85, 540, 0, 1, true, true, 'system'),
('Deli Turkey (sliced)', (SELECT id FROM food_categories WHERE slug='poultry'), 'poultry', 100, 'g', 100, 89, 17.7, 1.5, 1.8, 0.5, 45, 990, 0, 1.2, true, true, 'system');

-- BEEF & PORK
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Ground Beef 80/20 (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 254, 17.2, 0, 20, 7.9, 78, 75, 0, 0, true, true, 'system'),
('Ground Beef 85/15 (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 218, 17.2, 0, 15, 5.9, 73, 75, 0, 0, true, true, 'system'),
('Ground Beef 90/10 (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 196, 19.4, 0, 12.4, 4.8, 71, 75, 0, 0, true, true, 'system'),
('Ground Beef 93/7 (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 152, 21.4, 0, 6.7, 2.6, 68, 75, 0, 0, true, true, 'system'),
('Ribeye Steak (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 291, 17.4, 0, 24, 9.8, 80, 52, 0, 0, true, true, 'system'),
('Sirloin Steak (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 207, 26, 0, 10.6, 4.2, 81, 56, 0, 0, true, true, 'system'),
('Filet Mignon (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 274, 23, 0, 19.3, 7.7, 82, 54, 0, 0, true, true, 'system'),
('Chuck Roast (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 258, 17.5, 0, 20.5, 8.3, 80, 62, 0, 0, true, true, 'system'),
('Beef Liver (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 135, 20.4, 3.9, 3.6, 1.2, 389, 69, 0, 0, true, true, 'system'),
('Bacon (2 strips, cooked)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 2, 'strips', 14, 81, 5.4, 0.1, 6.3, 2.1, 16, 345, 0, 0, true, true, 'system'),
('Pork Chop (boneless, raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 201, 22.4, 0, 12, 4.3, 77, 56, 0, 0, true, true, 'system'),
('Ham (deli, sliced)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 100, 15.3, 1.8, 3.3, 1.1, 49, 1070, 0, 0.5, true, true, 'system'),
('Brisket (cooked)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 300, 21.9, 0, 23, 8.9, 93, 64, 0, 0, true, true, 'system'),
('Italian Sausage (pork)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 302, 14.3, 2.4, 25.7, 9.1, 67, 854, 0, 0.3, true, true, 'system'),
('Lamb Chop (raw)', (SELECT id FROM food_categories WHERE slug='beef-pork'), 'beef-pork', 100, 'g', 100, 294, 24, 0, 21, 9.6, 97, 72, 0, 0, true, true, 'system');

-- SEAFOOD
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Atlantic Salmon (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 208, 20.4, 0, 13.4, 3.1, 63, 59, 0, 0, true, true, 'system'),
('Canned Tuna in Water', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 85, 'g', 85, 100, 22, 0, 0.5, 0.1, 30, 280, 0, 0, true, true, 'system'),
('Tilapia (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 96, 20, 0, 1.7, 0.5, 57, 56, 0, 0, true, true, 'system'),
('Cod (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 82, 17.8, 0, 0.7, 0.1, 43, 54, 0, 0, true, true, 'system'),
('Shrimp (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 99, 24, 0.2, 0.3, 0.1, 189, 111, 0, 0, true, true, 'system'),
('Lobster (cooked)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 98, 20.5, 1.3, 0.6, 0.1, 72, 380, 0, 0, true, true, 'system'),
('Sardines in Oil', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 208, 24.6, 0, 11.4, 1.5, 142, 505, 0, 0, true, true, 'system'),
('Mackerel (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 205, 18.6, 0, 13.9, 3.3, 70, 90, 0, 0, true, true, 'system'),
('Scallops (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 88, 16.8, 2.4, 0.8, 0.1, 33, 392, 0, 0, true, true, 'system'),
('Mahi-Mahi (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 85, 18.5, 0, 0.7, 0.2, 73, 89, 0, 0, true, true, 'system'),
('Halibut (raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 91, 18.6, 0, 1.3, 0.2, 41, 68, 0, 0, true, true, 'system'),
('Crab (Dungeness, raw)', (SELECT id FROM food_categories WHERE slug='seafood'), 'seafood', 100, 'g', 100, 86, 17.4, 0.9, 0.9, 0.1, 59, 295, 0, 0, true, true, 'system');

-- VEGETABLES
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, potassium, vitamin_c, is_public, is_verified, source) VALUES
('Broccoli (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 34, 2.8, 6.6, 0.4, 0, 33, 2.6, 1.7, 316, 89.2, true, true, 'system'),
('Spinach (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 23, 2.9, 3.6, 0.4, 0, 79, 2.2, 0.4, 558, 28.1, true, true, 'system'),
('Kale (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 49, 4.3, 8.8, 0.9, 0, 38, 3.6, 2.3, 491, 120, true, true, 'system'),
('Romaine Lettuce (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 17, 1.2, 3.3, 0.3, 0, 8, 2.1, 1.2, 264, 4, true, true, 'system'),
('Cauliflower (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 25, 1.9, 5, 0.3, 0, 30, 2, 1.9, 299, 48.2, true, true, 'system'),
('Zucchini (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 17, 1.2, 3.1, 0.3, 0, 8, 1, 2.5, 261, 17.9, true, true, 'system'),
('Asparagus (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 20, 2.2, 3.9, 0.1, 0, 2, 2.1, 1.9, 202, 5.6, true, true, 'system'),
('Green Beans (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 31, 1.8, 7, 0.1, 0, 6, 3.4, 3.3, 211, 12.2, true, true, 'system'),
('Brussels Sprouts (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 43, 3.4, 8.9, 0.3, 0, 25, 3.8, 2.2, 389, 85, true, true, 'system'),
('Bell Pepper (red, raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 31, 1, 6, 0.3, 0, 4, 2.1, 4.2, 211, 127.7, true, true, 'system'),
('Mushrooms (white, raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 22, 3.1, 3.3, 0.3, 0, 5, 1, 2, 318, 2.1, true, true, 'system'),
('Onion (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 40, 1.1, 9.3, 0.1, 0, 4, 1.7, 4.2, 146, 7.4, true, true, 'system'),
('Carrot (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 41, 0.9, 9.6, 0.2, 0, 69, 2.8, 4.7, 320, 5.9, true, true, 'system'),
('Cucumber (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 16, 0.7, 3.6, 0.1, 0, 2, 0.5, 1.7, 147, 2.8, true, true, 'system'),
('Tomato (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 18, 0.9, 3.9, 0.2, 0, 5, 1.2, 2.6, 237, 13.7, true, true, 'system'),
('Avocado', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 160, 2, 8.5, 14.7, 0, 7, 6.7, 0.7, 485, 10, true, true, 'system'),
('Celery (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 16, 0.7, 3, 0.2, 0, 80, 1.6, 1.3, 260, 3.1, true, true, 'system'),
('Sweet Potato (raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 86, 1.6, 20, 0.1, 0, 55, 3, 4.2, 337, 2.4, true, true, 'system'),
('Cabbage (green, raw)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 25, 1.3, 5.8, 0.1, 0, 18, 2.5, 3.2, 170, 36.6, true, true, 'system'),
('Edamame (shelled)', (SELECT id FROM food_categories WHERE slug='vegetables'), 'vegetables', 100, 'g', 100, 122, 11, 9.9, 5.2, 0, 6, 5.2, 2.2, 436, 6.1, true, true, 'system');

-- FRUITS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, potassium, vitamin_c, is_public, is_verified, source) VALUES
('Banana', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 1, 'medium', 118, 105, 1.3, 27, 0.4, 0, 1, 3.1, 14.4, 422, 10.3, true, true, 'system'),
('Apple (with skin)', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 1, 'medium', 182, 95, 0.5, 25.1, 0.3, 0, 2, 4.4, 18.9, 195, 8.4, true, true, 'system'),
('Blueberries', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 57, 0.7, 14.5, 0.3, 0, 1, 2.4, 10, 77, 9.7, true, true, 'system'),
('Strawberries', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 32, 0.7, 7.7, 0.3, 0, 1, 2, 4.9, 153, 58.8, true, true, 'system'),
('Mango', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 60, 0.8, 15, 0.4, 0, 1, 1.6, 13.7, 168, 36.4, true, true, 'system'),
('Grapes (red/green)', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 69, 0.6, 18.1, 0.2, 0, 2, 0.9, 15.5, 191, 3.2, true, true, 'system'),
('Orange', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 1, 'medium', 131, 62, 1.2, 15.4, 0.2, 0, 0, 3.1, 12.2, 237, 69.7, true, true, 'system'),
('Pineapple', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 50, 0.5, 13.1, 0.1, 0, 1, 1.4, 9.9, 109, 47.8, true, true, 'system'),
('Raspberries', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 52, 1.2, 11.9, 0.7, 0, 1, 6.5, 4.4, 151, 26.2, true, true, 'system'),
('Watermelon', (SELECT id FROM food_categories WHERE slug='fruits'), 'fruits', 100, 'g', 100, 30, 0.6, 7.6, 0.2, 0, 1, 0.4, 6.2, 112, 8.1, true, true, 'system');

-- GRAINS & CARBS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, potassium, is_public, is_verified, source) VALUES
('Brown Rice (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 112, 2.6, 23.5, 0.9, 0, 5, 1.8, 0.4, 43, true, true, 'system'),
('White Rice (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 130, 2.7, 28, 0.3, 0, 0, 0.4, 0.1, 35, true, true, 'system'),
('Rolled Oats (dry)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 40, 'g', 40, 148, 5.4, 26.2, 2.6, 0, 1, 4, 0.5, 148, true, true, 'system'),
('Quinoa (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 120, 4.4, 21.3, 1.9, 0, 7, 2.8, 0.9, 172, true, true, 'system'),
('Sweet Potato (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 90, 2, 20.7, 0.1, 0, 36, 3.3, 6.5, 475, true, true, 'system'),
('Whole Wheat Bread (1 slice)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 1, 'slice', 28, 69, 3.5, 12.6, 1, 0, 132, 1.9, 1.4, 81, true, true, 'system'),
('White Bread (1 slice)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 1, 'slice', 28, 75, 2.6, 14, 1, 0, 136, 0.6, 1.4, 26, true, true, 'system'),
('Pasta (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 158, 5.8, 30.9, 0.9, 0, 1, 1.8, 0.6, 44, true, true, 'system'),
('Flour Tortilla (medium)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 1, 'tortilla', 45, 146, 3.7, 24.5, 4, 0, 331, 1.5, 1.7, 54, true, true, 'system'),
('Corn Tortilla (6 inch)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 1, 'tortilla', 26, 57, 1.5, 12, 0.7, 0, 11, 1.4, 0.2, 45, true, true, 'system'),
('Cream of Rice (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 62, 1.2, 13.8, 0.1, 0, 1, 0.1, 0, 16, true, true, 'system'),
('Couscous (cooked)', (SELECT id FROM food_categories WHERE slug='grains'), 'grains', 100, 'g', 100, 112, 3.8, 23.2, 0.2, 0, 5, 1.4, 0.1, 58, true, true, 'system');

-- DAIRY
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, calcium, is_public, is_verified, source) VALUES
('Whole Milk', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 240, 'ml', 240, 149, 8, 11.7, 8, 4.7, 24, 105, 0, 12.3, 276, true, true, 'system'),
('2% Milk', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 240, 'ml', 240, 122, 8, 11.7, 4.8, 3, 20, 115, 0, 12.3, 285, true, true, 'system'),
('Skim Milk', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 240, 'ml', 240, 83, 8.3, 12.2, 0.2, 0.1, 5, 103, 0, 12.5, 299, true, true, 'system'),
('Greek Yogurt (plain, nonfat)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 170, 'g', 170, 100, 17, 6, 0, 0, 10, 65, 0, 6, 187, true, true, 'system'),
('Greek Yogurt (2%)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 170, 'g', 170, 130, 17, 8, 4, 2.5, 15, 65, 0, 7, 190, true, true, 'system'),
('Cottage Cheese (1%, low-fat)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 113, 'g', 113, 81, 14, 3, 1.1, 0.4, 10, 390, 0, 3.4, 138, true, true, 'system'),
('Mozzarella (part skim)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 100, 'g', 100, 254, 24.4, 2.8, 15.9, 9.9, 54, 466, 0, 1, 505, true, true, 'system'),
('Cheddar Cheese', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 100, 'g', 100, 403, 24.9, 1.3, 33.1, 21.1, 105, 621, 0, 0.5, 721, true, true, 'system'),
('Parmesan (grated)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 5, 'g', 5, 22, 2, 0.2, 1.5, 0.9, 5, 76, 0, 0.1, 55, true, true, 'system'),
('Ricotta (part skim)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 100, 'g', 100, 138, 11.3, 4.9, 7.9, 4.9, 31, 125, 0, 0.3, 208, true, true, 'system'),
('Butter (unsalted)', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 1, 'tbsp', 14, 102, 0.1, 0, 11.5, 7.3, 31, 2, 0, 0, 3, true, true, 'system'),
('Heavy Cream', (SELECT id FROM food_categories WHERE slug='dairy'), 'dairy', 1, 'tbsp', 15, 51, 0.3, 0.4, 5.4, 3.4, 20, 6, 0, 0.4, 14, true, true, 'system');

-- NUTS & SEEDS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, potassium, is_public, is_verified, source) VALUES
('Almonds', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 28, 'g', 28, 164, 6, 6, 14, 1.1, 0, 0, 3.5, 1.2, 200, true, true, 'system'),
('Walnuts', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 28, 'g', 28, 185, 4.3, 3.9, 18.5, 1.7, 0, 1, 1.9, 0.7, 125, true, true, 'system'),
('Cashews', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 28, 'g', 28, 157, 5.2, 8.6, 12.4, 2.2, 0, 3, 0.9, 1.7, 187, true, true, 'system'),
('Peanut Butter (smooth)', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 2, 'tbsp', 32, 188, 8, 6.3, 16.1, 3.4, 0, 136, 1.9, 3.4, 200, true, true, 'system'),
('Almond Butter', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 2, 'tbsp', 32, 196, 6.7, 6, 18.6, 1.9, 0, 4, 3, 1.5, 243, true, true, 'system'),
('Chia Seeds', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 1, 'tbsp', 12, 58, 2, 5, 3.7, 0.4, 0, 2, 4, 0.1, 67, true, true, 'system'),
('Flaxseeds (ground)', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 1, 'tbsp', 10, 55, 1.9, 3, 4.3, 0.4, 0, 3, 2.8, 0.2, 84, true, true, 'system'),
('Pumpkin Seeds', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 28, 'g', 28, 151, 9.5, 1.7, 13, 2.5, 0, 2, 1.1, 0.4, 226, true, true, 'system'),
('Sunflower Seeds', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 28, 'g', 28, 166, 5.5, 7, 14.5, 1.5, 0, 1, 3, 1, 241, true, true, 'system'),
('Hemp Seeds (hulled)', (SELECT id FROM food_categories WHERE slug='nuts-seeds'), 'nuts-seeds', 3, 'tbsp', 30, 166, 9.5, 2.6, 14.6, 1.4, 0, 0, 1.2, 0.5, 360, true, true, 'system');

-- FATS & OILS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, saturated_fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Olive Oil (extra virgin)', (SELECT id FROM food_categories WHERE slug='fats-oils'), 'fats-oils', 1, 'tbsp', 14, 119, 0, 0, 13.5, 1.9, 0, 0, 0, 0, true, true, 'system'),
('Coconut Oil', (SELECT id FROM food_categories WHERE slug='fats-oils'), 'fats-oils', 1, 'tbsp', 14, 121, 0, 0, 13.5, 11.8, 0, 0, 0, 0, true, true, 'system'),
('Avocado Oil', (SELECT id FROM food_categories WHERE slug='fats-oils'), 'fats-oils', 1, 'tbsp', 14, 124, 0, 0, 14, 1.6, 0, 0, 0, 0, true, true, 'system'),
('MCT Oil', (SELECT id FROM food_categories WHERE slug='fats-oils'), 'fats-oils', 1, 'tbsp', 14, 115, 0, 0, 14, 13, 0, 0, 0, 0, true, true, 'system'),
('Ghee (clarified butter)', (SELECT id FROM food_categories WHERE slug='fats-oils'), 'fats-oils', 1, 'tbsp', 13, 112, 0, 0, 12.7, 7.9, 33, 0, 0, 0, true, true, 'system'),
('Sesame Oil', (SELECT id FROM food_categories WHERE slug='fats-oils'), 'fats-oils', 1, 'tbsp', 14, 120, 0, 0, 13.6, 1.9, 0, 0, 0, 0, true, true, 'system');

-- LEGUMES
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, potassium, is_public, is_verified, source) VALUES
('Black Beans (cooked)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 132, 8.9, 23.7, 0.5, 0, 1, 8.7, 0.3, 355, true, true, 'system'),
('Chickpeas (cooked)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 164, 8.9, 27.4, 2.6, 0, 7, 7.6, 4.8, 291, true, true, 'system'),
('Lentils (cooked)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 116, 9, 20, 0.4, 0, 2, 7.9, 1.8, 369, true, true, 'system'),
('Kidney Beans (cooked)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 127, 8.7, 22.8, 0.5, 0, 2, 6.4, 0.3, 355, true, true, 'system'),
('Tofu (firm)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 76, 8.1, 1.9, 4.8, 0, 7, 0.3, 0.4, 121, true, true, 'system'),
('Tempeh', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 193, 20.3, 7.6, 11, 0, 9, 3.4, 0, 412, true, true, 'system'),
('Pinto Beans (cooked)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 143, 9, 26.2, 0.6, 0, 1, 9.2, 0, 436, true, true, 'system'),
('Green Peas (frozen, cooked)', (SELECT id FROM food_categories WHERE slug='legumes'), 'legumes', 100, 'g', 100, 84, 5.4, 14.5, 0.4, 0, 3, 5.5, 5.7, 271, true, true, 'system');

-- BEVERAGES
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, potassium, is_public, is_verified, source) VALUES
('Water', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 240, 'ml', 240, 0, 0, 0, 0, 0, 7, 0, 0, 0, true, true, 'system'),
('Black Coffee', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 240, 'ml', 240, 5, 0.3, 0, 0, 0, 5, 0, 0, 116, true, true, 'system'),
('Green Tea', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 240, 'ml', 240, 2, 0, 0, 0, 0, 2, 0, 0, 19, true, true, 'system'),
('Whey Protein (vanilla, 1 scoop)', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 1, 'scoop', 30, 120, 25, 3, 1.5, 50, 150, 0, 2, 150, true, true, 'system'),
('Casein Protein (1 scoop)', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 1, 'scoop', 33, 120, 24, 4, 1, 25, 190, 0, 2, 150, true, true, 'system'),
('Orange Juice (100%)', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 240, 'ml', 240, 112, 1.7, 26, 0.5, 0, 2, 0.5, 21, 496, true, true, 'system'),
('Almond Milk (unsweetened)', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 240, 'ml', 240, 30, 1, 1, 2.5, 0, 170, 0.5, 0, 160, true, true, 'system'),
('Coconut Water', (SELECT id FROM food_categories WHERE slug='beverages'), 'beverages', 240, 'ml', 240, 46, 1.7, 8.9, 0.5, 0, 252, 0, 6.3, 600, true, true, 'system');

-- SNACKS & BARS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Rice Cake (plain)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 1, 'cake', 9, 35, 0.7, 7.3, 0.3, 0, 29, 0.2, 0.1, true, true, 'system'),
('Quest Bar (average)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 1, 'bar', 60, 190, 21, 21, 7, 5, 210, 14, 1, true, true, 'system'),
('KIND Bar (average)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 1, 'bar', 40, 200, 6, 18, 15, 0, 15, 7, 7, true, true, 'system'),
('Popcorn (air-popped)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 3, 'cups', 24, 93, 3.1, 18.7, 1.1, 0, 1, 3.5, 0.2, true, true, 'system'),
('Dark Chocolate (70%+)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 28, 'g', 28, 172, 2.2, 13, 12.1, 1, 6, 2, 6.8, true, true, 'system'),
('Mixed Nuts (unsalted)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 28, 'g', 28, 173, 4.9, 7.6, 15.9, 0, 0, 2.5, 1.5, true, true, 'system'),
('Beef Jerky (original)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 28, 'g', 28, 80, 11.5, 5.4, 2.4, 15, 530, 0.5, 4.5, true, true, 'system'),
('Protein Chips (average)', (SELECT id FROM food_categories WHERE slug='snacks'), 'snacks', 28, 'g', 28, 120, 15, 8, 3, 5, 200, 1, 1, true, true, 'system');

-- SAUCES & CONDIMENTS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Ketchup', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 1, 'tbsp', 17, 20, 0.3, 4.8, 0, 0, 160, 0.1, 3.7, true, true, 'system'),
('Yellow Mustard', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 1, 'tsp', 5, 3, 0.2, 0.3, 0.2, 0, 57, 0.1, 0.1, true, true, 'system'),
('Hot Sauce (Tabasco)', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 1, 'tsp', 5, 1, 0, 0.1, 0, 0, 35, 0, 0.1, true, true, 'system'),
('Soy Sauce', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 1, 'tbsp', 15, 11, 1.9, 0.8, 0, 0, 879, 0, 0.4, true, true, 'system'),
('Ranch Dressing', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 2, 'tbsp', 30, 145, 0.4, 1.7, 15, 10, 270, 0, 1.1, true, true, 'system'),
('Salsa (fresh)', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 2, 'tbsp', 30, 10, 0.5, 2, 0, 0, 115, 0.5, 1.2, true, true, 'system'),
('Hummus', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 2, 'tbsp', 30, 71, 2.6, 5.1, 4.7, 0, 113, 1.9, 0.2, true, true, 'system'),
('Guacamole', (SELECT id FROM food_categories WHERE slug='sauces'), 'sauces', 2, 'tbsp', 30, 48, 0.6, 2.5, 4.4, 0, 92, 1.9, 0.3, true, true, 'system');

-- SUPPLEMENTS
INSERT INTO foods (name, category_id, category, serving_size, serving_unit, grams_per_serving, calories, protein, carbs, fat, cholesterol, sodium, fiber, sugar, is_public, is_verified, source) VALUES
('Creatine Monohydrate', (SELECT id FROM food_categories WHERE slug='supplements'), 'supplements', 1, 'tsp', 5, 0, 0, 0, 0, 0, 0, 0, 0, true, true, 'system'),
('Fish Oil (1000mg capsule)', (SELECT id FROM food_categories WHERE slug='supplements'), 'supplements', 1, 'capsule', 1.4, 10, 0, 0, 1, 5, 0, 0, 0, true, true, 'system'),
('Magnesium Glycinate (400mg)', (SELECT id FROM food_categories WHERE slug='supplements'), 'supplements', 1, 'capsule', 1, 0, 0, 0, 0, 0, 0, 0, 0, true, true, 'system'),
('Vitamin D3 (2000 IU)', (SELECT id FROM food_categories WHERE slug='supplements'), 'supplements', 1, 'capsule', 0.5, 0, 0, 0, 0, 0, 0, 0, 0, true, true, 'system'),
('BCAA Powder (1 serving)', (SELECT id FROM food_categories WHERE slug='supplements'), 'supplements', 1, 'scoop', 8, 20, 5, 0, 0, 0, 10, 0, 0, true, true, 'system'),
('Pre-Workout (average)', (SELECT id FROM food_categories WHERE slug='supplements'), 'supplements', 1, 'scoop', 10, 25, 1, 5, 0, 0, 110, 0, 2, true, true, 'system');

-- Update search vectors for all seeded foods (trigger covers inserts, this is a safety net)
UPDATE foods SET search_vector = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE(brand, '') || ' ' ||
  COALESCE(category, '')
) WHERE source = 'system';
