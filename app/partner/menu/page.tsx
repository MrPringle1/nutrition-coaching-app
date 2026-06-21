'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { RestaurantMenuItem, RestaurantMenuCategory } from '@/lib/types'
import { TAG_COLORS } from '@/lib/restaurants'
import Link from 'next/link'
import { Plus, Trash2, Star, Search } from 'lucide-react'

export default function PartnerMenuPage() {
  const supabase = createClient()
  const [items, setItems] = useState<RestaurantMenuItem[]>([])
  const [categories, setCategories] = useState<RestaurantMenuCategory[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: r } = await supabase.from('restaurant_partners').select('id').eq('owner_profile_id', user.id).maybeSingle()
      if (!r) { setLoading(false); return }
      setRestaurantId(r.id)
      const [{ data: menuItems }, { data: cats }] = await Promise.all([
        supabase.from('restaurant_menu_items').select('*').eq('restaurant_id', r.id).order('name'),
        supabase.from('restaurant_menu_categories').select('*').eq('restaurant_id', r.id).order('display_order'),
      ])
      setItems((menuItems ?? []) as RestaurantMenuItem[])
      setCategories((cats ?? []) as RestaurantMenuCategory[])
      setLoading(false)
    }
    load()
  }, [])

  async function deleteItem(id: string) {
    if (!confirm('Delete this menu item?')) return
    await supabase.from('restaurant_menu_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleAvailable(item: RestaurantMenuItem) {
    await supabase.from('restaurant_menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
  }

  const filtered = items.filter(i => {
    const matchQ = !query || i.name.toLowerCase().includes(query.toLowerCase())
    const matchC = !selectedCat || i.category_id === selectedCat
    return matchQ && matchC
  })

  return (
    <div>
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} items</p>
        </div>
        {restaurantId && (
          <Link href="/partner/menu/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-green-600/25 transition-all">
            <Plus size={16} /> Add Item
          </Link>
        )}
      </header>

      <main className="px-6 py-5 space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search menu items…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedCat(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${!selectedCat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${selectedCat === cat.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🍽️</p>
            <p className="font-semibold text-gray-600">No menu items yet</p>
            {restaurantId && <Link href="/partner/menu/new" className="text-green-600 text-sm font-semibold mt-2 inline-block">+ Add your first item</Link>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.map((item, idx) => (
              <div key={item.id} className={`flex items-start gap-3 px-5 py-4 ${idx < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.is_coach_approved && <Star size={12} className="fill-green-400 text-green-400" />}
                  </div>
                  <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{item.calories} cal</span>
                    <span className="text-purple-500">P {item.protein}g</span>
                    <span className="text-amber-500">C {item.carbs}g</span>
                    <span className="text-cyan-500">F {item.fat}g</span>
                    {item.price && <span className="text-gray-500">${item.price}</span>}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-500'}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleAvailable(item)}
                    className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {item.is_available ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
