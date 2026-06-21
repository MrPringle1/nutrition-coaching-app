'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { Client, MealPlan, Meal, GroceryItem, ProgressLog } from '@/lib/types'

const MEAL_LABELS = ['Meal 1', 'Meal 2', 'Meal 3', 'Snack']
const GROCERY_CATEGORIES = ['Proteins', 'Carbs', 'Vegetables', 'Fats', 'Flavor / Sauces']

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<Client | null>(null)
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [groceries, setGroceries] = useState<GroceryItem[]>([])
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [tab, setTab] = useState<'plan' | 'grocery' | 'progress'>('plan')
  const [loading, setLoading] = useState(true)

  // New plan form
  const [planForm, setPlanForm] = useState({
    name: '7-Day Gluten-Free Fat Loss Plan',
    daily_calories: 1600,
    daily_protein: 130,
    daily_carbs: 130,
    daily_fat: 50,
    water_goal_oz: 60,
  })
  const [savingPlan, setSavingPlan] = useState(false)

  // New grocery item
  const [newItem, setNewItem] = useState({ category: 'Proteins', name: '' })
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: clientData } = await supabase.from('clients').select('*').eq('id', id).single()
      if (!clientData) { router.push('/coach'); return }
      setClient(clientData)

      const { data: planData } = await supabase
        .from('meal_plans').select('*').eq('client_id', id)
        .order('created_at', { ascending: false }).limit(1).single()

      if (planData) {
        setPlan(planData)
        const { data: mealData } = await supabase.from('meals').select('*').eq('meal_plan_id', planData.id).order('day_number').order('meal_number')
        setMeals(mealData || [])
        const { data: groceryData } = await supabase.from('grocery_items').select('*').eq('meal_plan_id', planData.id).order('category')
        setGroceries(groceryData || [])
      }

      const { data: logData } = await supabase.from('progress_logs').select('*').eq('client_id', id).order('logged_at', { ascending: false }).limit(20)
      setLogs(logData || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function createPlan() {
    setSavingPlan(true)
    const { data } = await supabase.from('meal_plans').insert({ ...planForm, client_id: id }).select().single()
    if (data) setPlan(data)
    setSavingPlan(false)
  }

  async function addGroceryItem(e: React.FormEvent) {
    e.preventDefault()
    if (!plan || !newItem.name.trim()) return
    setSavingItem(true)
    const { data } = await supabase.from('grocery_items')
      .insert({ meal_plan_id: plan.id, category: newItem.category, name: newItem.name.trim(), checked: false })
      .select().single()
    if (data) setGroceries(prev => [...prev, data])
    setNewItem(n => ({ ...n, name: '' }))
    setSavingItem(false)
  }

  async function deleteGroceryItem(itemId: string) {
    await supabase.from('grocery_items').delete().eq('id', itemId)
    setGroceries(prev => prev.filter(i => i.id !== itemId))
  }

  if (loading || !client) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/coach" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
              {client.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">{client.full_name}</p>
              <p className="text-xs text-gray-400">{client.email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {(['plan', 'grocery', 'progress'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tab === t ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-10">
        {/* Client stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
          {[
            { label: 'Age', val: client.age ?? '—' },
            { label: 'Current', val: client.current_weight ? `${client.current_weight} lbs` : '—' },
            { label: 'Goal', val: client.goal_weight ? `${client.goal_weight} lbs` : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-2">
              <p className="font-bold text-gray-800">{val}</p>
              <p className="text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {client.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
            <p className="text-xs text-amber-800">{client.notes}</p>
          </div>
        )}

        {/* PLAN TAB */}
        {tab === 'plan' && (
          <div>
            {!plan ? (
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <h2 className="font-semibold text-gray-800 text-sm">Create Meal Plan</h2>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Plan Name</label>
                  <input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([['daily_calories', 'Daily Calories'], ['daily_protein', 'Protein (g)'], ['daily_carbs', 'Carbs (g)'], ['daily_fat', 'Fat (g)'], ['water_goal_oz', 'Water Goal (oz)']] as [keyof typeof planForm, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input type="number" value={planForm[key]} onChange={e => setPlanForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  ))}
                </div>
                <button onClick={createPlan} disabled={savingPlan}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors">
                  {savingPlan ? 'Creating…' : 'Create Plan'}
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-green-600 rounded-xl p-4 text-white mb-4">
                  <p className="font-semibold mb-2 text-sm">{plan.name}</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[['Cals', plan.daily_calories, ''], ['Protein', plan.daily_protein, 'g'], ['Carbs', plan.daily_carbs, 'g'], ['Fat', plan.daily_fat, 'g']].map(([l, v, u]) => (
                      <div key={String(l)} className="bg-white/20 rounded-lg p-1.5">
                        <p className="font-bold">{v}{u}</p>
                        <p className="opacity-80">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-2">Meals are added via the Supabase dashboard or future meal editor. Showing {meals.length} meals assigned.</p>

                {meals.length > 0 && (
                  <div className="space-y-2">
                    {[1,2,3,4,5,6,7].map(day => {
                      const dayMeals = meals.filter(m => m.day_number === day)
                      if (!dayMeals.length) return null
                      return (
                        <div key={day} className="bg-white rounded-xl border border-gray-100 p-3">
                          <p className="text-xs font-bold text-gray-500 mb-2">Day {day}</p>
                          {dayMeals.map(m => (
                            <div key={m.id} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                              <span className="text-gray-700 font-medium">{m.name}</span>
                              <span className="text-gray-400">{m.calories} kcal · {m.protein}g P</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GROCERY TAB */}
        {tab === 'grocery' && (
          <div>
            {!plan ? (
              <p className="text-sm text-gray-400 text-center py-10">Create a meal plan first.</p>
            ) : (
              <>
                <form onSubmit={addGroceryItem} className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex gap-2">
                  <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                    {GROCERY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input required value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Item name…" />
                  <button type="submit" disabled={savingItem}
                    className="bg-green-600 text-white rounded-lg px-3 py-2 hover:bg-green-700 transition-colors disabled:opacity-50">
                    <Plus size={16} />
                  </button>
                </form>

                {GROCERY_CATEGORIES.map(cat => {
                  const catItems = groceries.filter(i => i.category === cat)
                  if (!catItems.length) return null
                  return (
                    <div key={cat} className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{cat}</p>
                      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                        {catItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-sm text-gray-700">{item.name}</span>
                            <button onClick={() => deleteGroceryItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* PROGRESS TAB */}
        {tab === 'progress' && (
          <div>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No progress logged yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <div className="flex gap-3 text-xs">
                        {log.weight && <span className="font-bold text-gray-800">{log.weight} lbs</span>}
                        {log.water_oz && <span className="text-blue-500 font-medium">{log.water_oz} oz 💧</span>}
                      </div>
                    </div>
                    {log.notes && <p className="text-xs text-gray-500">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
