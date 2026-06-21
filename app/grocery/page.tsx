'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { GroceryItem } from '@/lib/types'

const CATEGORY_ORDER = ['Proteins', 'Carbs', 'Vegetables', 'Fats', 'Flavor / Sauces']

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [planId, setPlanId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single()
      if (!client) { setLoading(false); return }

      const { data: plan } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (!plan) { setLoading(false); return }

      setPlanId(plan.id)
      const { data } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('meal_plan_id', plan.id)
        .order('category')
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleItem(item: GroceryItem) {
    const updated = !item.checked
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: updated } : i))
    await supabase.from('grocery_items').update({ checked: updated }).eq('id', item.id)
  }

  async function resetAll() {
    if (!planId) return
    setItems(prev => prev.map(i => ({ ...i, checked: false })))
    await supabase.from('grocery_items').update({ checked: false }).eq('meal_plan_id', planId)
  }

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {} as Record<string, GroceryItem[]>)

  const checkedCount = items.filter(i => i.checked).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <NavBar />
      <main className="md:ml-56 pb-24 md:pb-8 px-4 pt-4 max-w-2xl md:mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grocery List</h1>
            <p className="text-sm text-gray-400">{checkedCount} of {items.length} items checked</p>
          </div>
          {checkedCount > 0 && (
            <button onClick={resetAll} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
              Reset all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">🛒</p>
            <p className="font-semibold text-gray-600">No grocery list yet</p>
            <p className="text-sm mt-1">Your coach will set this up soon.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{category}</h2>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {catItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        item.checked ? 'bg-green-600 border-green-600' : 'border-gray-300'
                      }`}>
                        {item.checked && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${
                        item.checked ? 'line-through text-gray-300' : 'text-gray-700'
                      }`}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
