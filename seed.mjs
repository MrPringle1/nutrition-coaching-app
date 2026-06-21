import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ysnbfzcwfroytefemghq.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  console.log('🌱 Starting seed...')

  // ── 1. Create coach account ──────────────────────────────────────────────
  console.log('Creating coach account...')
  const { data: coachAuth, error: coachAuthErr } = await supabase.auth.admin.createUser({
    email: 'perfectfitlp@gmail.com',
    password: 'Jlcp12345',
    email_confirm: true,
    user_metadata: { full_name: 'Larry Pringle', role: 'coach' }
  })
  if (coachAuthErr && !coachAuthErr.message.includes('already been registered')) {
    console.error('Coach auth error:', coachAuthErr.message); process.exit(1)
  }

  // Get coach ID (either new or existing)
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const coach = users.find(u => u.email === 'perfectfitlp@gmail.com')
  const coachId = coach.id
  console.log('✓ Coach ID:', coachId)

  // Upsert coach profile
  await supabase.from('profiles').upsert({
    id: coachId,
    email: 'perfectfitlp@gmail.com',
    full_name: 'Larry Pringle',
    role: 'coach'
  })
  console.log('✓ Coach profile set')

  // ── 2. Create MehLayne client account ────────────────────────────────────
  console.log('Creating MehLayne client account...')
  const { data: clientAuth, error: clientAuthErr } = await supabase.auth.admin.createUser({
    email: 'mehlayne@client.com',
    password: 'MehLayne2024!',
    email_confirm: true,
    user_metadata: { full_name: 'MehLayne', role: 'client' }
  })
  if (clientAuthErr && !clientAuthErr.message.includes('already been registered')) {
    console.error('Client auth error:', clientAuthErr.message)
  }

  // Re-fetch users to get MehLayne's ID
  const { data: { users: users2 } } = await supabase.auth.admin.listUsers()
  let clientUserId = users2.find(u => u.email === 'mehlayne@client.com')?.id || clientAuth?.user?.id

  // Upsert client profile
  if (clientUserId) {
    await supabase.from('profiles').upsert({
      id: clientUserId,
      email: 'mehlayne@client.com',
      full_name: 'MehLayne',
      role: 'client'
    })
  }
  console.log('✓ MehLayne auth account created, temp password: MehLayne2024!')

  // ── 3. Create client record ───────────────────────────────────────────────
  const { data: existingClient } = await supabase
    .from('clients').select('id').eq('email', 'mehlayne@client.com').single()

  let clientId = existingClient?.id
  if (!clientId) {
    const { data: newClient, error: clientInsertErr } = await supabase.from('clients').insert({
      coach_id: coachId,
      profile_id: clientUserId || null,
      full_name: 'MehLayne',
      email: 'mehlayne@client.com',
      age: 31,
      height: "5'1\"",
      current_weight: 220,
      goal_weight: 140,
      notes: 'Gluten-sensitive. No pork. Prefers minimal cooking. Eats out 1-4x weekly. First meal around noon. Drinks juice/Calypsos — replacing with water is priority. Current water intake 30-40 oz daily.'
    }).select().single()
    if (clientInsertErr) { console.error('Client insert error:', clientInsertErr.message, clientInsertErr.details, clientInsertErr.hint); process.exit(1) }
    clientId = newClient.id
  }
  console.log('✓ Client record created, ID:', clientId)

  // ── 4. Create meal plan ───────────────────────────────────────────────────
  const { data: existingPlan } = await supabase
    .from('meal_plans').select('id').eq('client_id', clientId).single()

  let planId = existingPlan?.id
  if (!planId) {
    const { data: plan } = await supabase.from('meal_plans').insert({
      client_id: clientId,
      name: '7-Day Gluten-Free Fat Loss Plan',
      daily_calories: 1600,
      daily_protein: 130,
      daily_carbs: 130,
      daily_fat: 50,
      water_goal_oz: 60
    }).select().single()
    planId = plan.id
  }
  console.log('✓ Meal plan created, ID:', planId)

  // ── 5. Seed meals ─────────────────────────────────────────────────────────
  const { count } = await supabase.from('meals').select('*', { count: 'exact', head: true }).eq('meal_plan_id', planId)
  if (count > 0) {
    console.log('✓ Meals already seeded, skipping')
  } else {
    const meals = [
      // DAY 1
      { day_number: 1, meal_number: 1, meal_label: 'Meal 1', name: 'Egg & Turkey Breakfast Bowl', description: '2 whole eggs, 3 egg whites, 3 oz lean ground turkey, 1 cup sautéed zucchini/squash, ½ cup cooked sweet potatoes', calories: 430, protein: 40, carbs: 30, fat: 18 },
      { day_number: 1, meal_number: 2, meal_label: 'Meal 2', name: 'Baked Chicken Plate', description: '5 oz baked chicken breast, 1 cup broccoli, ½ cup cooked rice, 1 tbsp olive oil', calories: 500, protein: 45, carbs: 35, fat: 18 },
      { day_number: 1, meal_number: 3, meal_label: 'Snack', name: 'Protein Shake', description: '1 scoop gluten-free protein powder with water or unsweetened almond milk', calories: 170, protein: 28, carbs: 5, fat: 3 },
      { day_number: 1, meal_number: 4, meal_label: 'Meal 3', name: 'Burger Bowl', description: '5 oz lean ground beef, lettuce/spinach base, pickles, tomato, onion, ½ cup roasted potatoes, mustard', calories: 500, protein: 40, carbs: 35, fat: 20 },
      // DAY 2
      { day_number: 2, meal_number: 1, meal_label: 'Meal 1', name: 'GF Oatmeal Protein Bowl', description: '½ cup gluten-free oats, 1 scoop protein powder, 1 tbsp peanut butter, cinnamon, ½ cup berries', calories: 420, protein: 35, carbs: 45, fat: 14 },
      { day_number: 2, meal_number: 2, meal_label: 'Meal 2', name: 'Steak & Veggie Bowl', description: '5 oz steak, 1 cup zucchini/squash, ½ cup rice or quinoa, 1 tsp olive oil', calories: 520, protein: 42, carbs: 35, fat: 22 },
      { day_number: 2, meal_number: 3, meal_label: 'Snack', name: 'Boiled Eggs & Fruit', description: '2 boiled eggs, 1 apple or a handful of berries', calories: 220, protein: 12, carbs: 20, fat: 10 },
      { day_number: 2, meal_number: 4, meal_label: 'Meal 3', name: 'Chicken Taco Bowl', description: '5 oz chicken, ½ cup black beans, ½ cup rice, lettuce, salsa, 1 tbsp Greek yogurt instead of sour cream', calories: 500, protein: 45, carbs: 50, fat: 10 },
      // DAY 3
      { day_number: 3, meal_number: 1, meal_label: 'Meal 1', name: 'GF Bagel Protein Breakfast', description: '1 gluten-free bagel, 2 eggs, 2 egg whites, 1 slice cheese (if tolerated)', calories: 450, protein: 32, carbs: 45, fat: 16 },
      { day_number: 3, meal_number: 2, meal_label: 'Meal 2', name: 'Mediterranean Chicken Bowl', description: '5 oz grilled chicken, 1 cup cucumber/tomato salad, ½ cup quinoa, 2 tbsp hummus, 1 tbsp olive oil dressing', calories: 520, protein: 45, carbs: 40, fat: 20 },
      { day_number: 3, meal_number: 3, meal_label: 'Snack', name: 'Greek Yogurt or Protein Shake', description: 'Greek yogurt with cinnamon (if tolerated), or 1 scoop gluten-free protein shake', calories: 180, protein: 25, carbs: 8, fat: 4 },
      { day_number: 3, meal_number: 4, meal_label: 'Meal 3', name: 'Salmon & Butternut Squash', description: '5 oz baked salmon, 1 cup broccoli, ½ cup roasted butternut squash', calories: 500, protein: 38, carbs: 28, fat: 25 },
      // DAY 4
      { day_number: 4, meal_number: 1, meal_label: 'Meal 1', name: 'Protein Smoothie', description: '1 scoop protein powder, 1 cup unsweetened almond milk, ½ banana, 1 tbsp peanut butter, handful of spinach, ice', calories: 350, protein: 30, carbs: 25, fat: 14 },
      { day_number: 4, meal_number: 2, meal_label: 'Meal 2', name: 'Beef & Broccoli Bowl', description: '5 oz lean beef, 1½ cups broccoli, ½ cup rice, coconut aminos or gluten-free teriyaki sauce', calories: 520, protein: 42, carbs: 40, fat: 18 },
      { day_number: 4, meal_number: 3, meal_label: 'Snack', name: 'Controlled Snack', description: '1 serving Heavenly Hunks or similar snack. Pair with protein shake if still hungry. Keep to 1 serving only.', calories: 200, protein: 8, carbs: 22, fat: 9 },
      { day_number: 4, meal_number: 4, meal_label: 'Meal 3', name: 'Chicken & Veggie Plate', description: '5 oz baked chicken, 1 cup squash/zucchini, side salad, ¼ avocado', calories: 450, protein: 45, carbs: 15, fat: 20 },
      // DAY 5
      { day_number: 5, meal_number: 1, meal_label: 'Meal 1', name: 'Egg Scramble Plate', description: '2 eggs, 3 egg whites, ½ cup potatoes, 1 cup mixed vegetables, salsa on top', calories: 400, protein: 35, carbs: 30, fat: 15 },
      { day_number: 5, meal_number: 2, meal_label: 'Meal 2', name: 'Turkey Burger Lettuce Bowl', description: '5 oz turkey burger patty, lettuce, tomato, onions, pickles, ½ cup sweet potatoes, mustard', calories: 480, protein: 42, carbs: 35, fat: 16 },
      { day_number: 5, meal_number: 3, meal_label: 'Snack', name: 'Apple & Almond Butter', description: '1 apple, 1 tbsp almond butter', calories: 200, protein: 4, carbs: 25, fat: 9 },
      { day_number: 5, meal_number: 4, meal_label: 'Meal 3', name: 'GF Pasta Protein Bowl', description: '1 serving gluten-free pasta, 5 oz chicken or lean beef, marinara sauce, zucchini or broccoli mixed in', calories: 550, protein: 45, carbs: 55, fat: 15 },
      // DAY 6
      { day_number: 6, meal_number: 1, meal_label: 'Meal 1', name: 'Protein Oats', description: '½ cup gluten-free oats, 1 scoop protein powder, cinnamon, 1 tbsp peanut butter', calories: 400, protein: 35, carbs: 40, fat: 13 },
      { day_number: 6, meal_number: 2, meal_label: 'Meal 2', name: 'Chicken Fajita Bowl', description: '5 oz chicken, peppers and onions, ½ cup rice, ½ cup black beans, salsa, lettuce', calories: 525, protein: 45, carbs: 55, fat: 10 },
      { day_number: 6, meal_number: 3, meal_label: 'Snack', name: 'Boiled Eggs or Protein Shake', description: '2 boiled eggs or 1 scoop gluten-free protein shake with water', calories: 180, protein: 25, carbs: 4, fat: 8 },
      { day_number: 6, meal_number: 4, meal_label: 'Meal 3', name: 'Steak & Vegetables', description: '5 oz steak, 1½ cups broccoli/zucchini/squash mix, ½ cup roasted butternut squash', calories: 500, protein: 42, carbs: 25, fat: 22 },
      // DAY 7
      { day_number: 7, meal_number: 1, meal_label: 'Meal 1', name: 'GF Breakfast Sandwich', description: '2 eggs, 2 egg whites, gluten-free bread, turkey or chicken sausage, fruit on the side', calories: 500, protein: 40, carbs: 45, fat: 18 },
      { day_number: 7, meal_number: 2, meal_label: 'Meal 2', name: 'Salmon Rice Bowl', description: '5 oz salmon, ½ cup rice, 1 cup broccoli, coconut aminos or gluten-free sauce', calories: 520, protein: 38, carbs: 40, fat: 22 },
      { day_number: 7, meal_number: 3, meal_label: 'Snack', name: 'Protein Shake', description: '1 scoop gluten-free protein powder with water or unsweetened almond milk', calories: 170, protein: 28, carbs: 5, fat: 3 },
      { day_number: 7, meal_number: 4, meal_label: 'Meal 3', name: 'Chicken & Veggie Dinner', description: '5 oz chicken, 1½ cups mixed vegetables, ¼ avocado or 1 tbsp olive oil. Optional: ½ cup sweet potatoes if still hungry.', calories: 500, protein: 45, carbs: 25, fat: 18 },
    ]

    const mealsWithPlanId = meals.map(m => ({ ...m, meal_plan_id: planId }))
    const { error: mealsErr } = await supabase.from('meals').insert(mealsWithPlanId)
    if (mealsErr) { console.error('Meals error:', mealsErr.message); process.exit(1) }
    console.log(`✓ ${meals.length} meals seeded`)
  }

  // ── 6. Seed grocery list ──────────────────────────────────────────────────
  const { count: groceryCount } = await supabase.from('grocery_items').select('*', { count: 'exact', head: true }).eq('meal_plan_id', planId)
  if (groceryCount > 0) {
    console.log('✓ Grocery items already seeded, skipping')
  } else {
    const groceries = [
      // Proteins
      { category: 'Proteins', name: 'Eggs (1 dozen)' },
      { category: 'Proteins', name: 'Egg whites (carton)' },
      { category: 'Proteins', name: 'Chicken breast or thighs (3 lbs)' },
      { category: 'Proteins', name: 'Lean ground beef (1 lb)' },
      { category: 'Proteins', name: 'Lean ground turkey (1 lb)' },
      { category: 'Proteins', name: 'Turkey sausage or chicken sausage' },
      { category: 'Proteins', name: 'Steak (1 lb)' },
      { category: 'Proteins', name: 'Salmon (1 lb)' },
      { category: 'Proteins', name: 'Gluten-free protein powder' },
      { category: 'Proteins', name: 'Greek yogurt (if tolerated)' },
      { category: 'Proteins', name: 'Black beans (can)' },
      // Carbs
      { category: 'Carbs', name: 'Gluten-free oats' },
      { category: 'Carbs', name: 'White or brown rice' },
      { category: 'Carbs', name: 'Quinoa' },
      { category: 'Carbs', name: 'Sweet potatoes (3-4)' },
      { category: 'Carbs', name: 'Regular potatoes (3-4)' },
      { category: 'Carbs', name: 'Butternut squash' },
      { category: 'Carbs', name: 'Gluten-free bread' },
      { category: 'Carbs', name: 'Gluten-free bagels' },
      { category: 'Carbs', name: 'Gluten-free pasta' },
      { category: 'Carbs', name: 'Apples' },
      { category: 'Carbs', name: 'Berries (fresh or frozen)' },
      { category: 'Carbs', name: 'Bananas' },
      // Vegetables
      { category: 'Vegetables', name: 'Broccoli' },
      { category: 'Vegetables', name: 'Zucchini' },
      { category: 'Vegetables', name: 'Yellow squash' },
      { category: 'Vegetables', name: 'Lettuce or spinach (bag)' },
      { category: 'Vegetables', name: 'Bell peppers' },
      { category: 'Vegetables', name: 'Onions' },
      { category: 'Vegetables', name: 'Cucumbers' },
      { category: 'Vegetables', name: 'Tomatoes' },
      // Fats
      { category: 'Fats', name: 'Olive oil or avocado oil' },
      { category: 'Fats', name: 'Peanut butter' },
      { category: 'Fats', name: 'Almond butter' },
      { category: 'Fats', name: 'Avocados (2-3)' },
      // Flavor / Sauces
      { category: 'Flavor / Sauces', name: 'Salsa' },
      { category: 'Flavor / Sauces', name: 'Mustard' },
      { category: 'Flavor / Sauces', name: 'Coconut aminos' },
      { category: 'Flavor / Sauces', name: 'Gluten-free marinara sauce' },
      { category: 'Flavor / Sauces', name: 'Hummus' },
      { category: 'Flavor / Sauces', name: 'Gluten-free taco seasoning' },
      { category: 'Flavor / Sauces', name: 'Garlic powder, onion powder, paprika, sea salt' },
      { category: 'Flavor / Sauces', name: 'Unsweetened almond milk' },
      { category: 'Flavor / Sauces', name: 'Cinnamon' },
    ]

    const groceriesWithPlanId = groceries.map(g => ({ ...g, meal_plan_id: planId, checked: false }))
    const { error: groceryErr } = await supabase.from('grocery_items').insert(groceriesWithPlanId)
    if (groceryErr) { console.error('Grocery error:', groceryErr.message); process.exit(1) }
    console.log(`✓ ${groceries.length} grocery items seeded`)
  }

  console.log('\n✅ Seed complete!')
  console.log('─────────────────────────────────────')
  console.log('Coach login:   perfectfitlp@gmail.com / Jlcp12345')
  console.log('Client login:  mehlayne@client.com / MehLayne2024!')
  console.log('─────────────────────────────────────')
}

seed().catch(err => { console.error(err); process.exit(1) })
