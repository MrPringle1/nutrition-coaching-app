'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { GroceryItem } from '@/lib/types'
import { RefreshCw } from 'lucide-react'

const CATEGORY_ORDER = ['Proteins', 'Carbs', 'Vegetables', 'Fats', 'Flavor / Sauces']

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  'Proteins': { emoji: '🥩', color: 'text-red-600', bg: 'bg-red-50' },
  'Carbs': { emoji: '🌾', color: 'text-amber-600', bg: 'bg-amber-50' },
  'Vegetables': { emoji: '🥦', color: 'text-green-600', bg: 'bg-green-50' },
  'Fats': { emoji: '🥑', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Flavor / Sauces': { emoji: '🧄', color: 'text-purple-600', bg: 'bg-purple-50' },
}

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
  const pct = items.length ? Math.round((checkedCount / items.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Weekly Shop</p>
          <div className="flex items-end justify-between mb-4">
            <h1 className="text-white font-bold text-xl">Grocery List</h1>
            {checkedCount > 0 && (
              <button onClick={resetAll} className="flex items-center gap-1.5 text-green-300 hover:text-white text-xs font-medium transition-colors">
                <RefreshCw size={13} />
                Reset
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="bg-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-semibold">{checkedCount} of {items.length} items</span>
              <span className="text-green-400 font-bold text-sm">{pct}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct === 100 && (
              <p className="text-green-300 text-xs mt-2 font-medium">All done! You're ready to cook. 🎉</p>
            )}
          </div>
        </div>

        <div className="px-4 pt-5">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🛒</span>
              </div>
              <p className="font-bold text-gray-800">No grocery list yet</p>
              <p className="text-sm text-gray-400 mt-1">Your coach will set this up soon.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              {Object.entries(grouped).map(([category, catItems]) => {
                const config = CATEGORY_CONFIG[category] || { emoji: '📦', color: 'text-gray-600', bg: 'bg-gray-50' }
                const catChecked = catItems.filter(i => i.checked).length
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 ${config.bg} rounded-lg flex items-center justify-center text-base`}>
                        {config.emoji}
                      </div>
                      <h2 className={`text-sm font-bold ${config.color}`}>{category}</h2>
                      <span className="text-xs text-gray-400 ml-auto">{catChecked}/{catItems.length}</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      {catItems.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                            idx < catItems.length - 1 ? 'border-b border-gray-50' : ''
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            item.checked ? 'bg-green-600 border-green-600' : 'border-gray-200'
                          }`}>
                            {item.checked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm font-medium transition-all ${
                            item.checked ? 'line-through text-gray-300' : 'text-gray-800'
                          }`}>
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
