'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { RestaurantPartner, RestaurantMenuCategory, RestaurantMenuItem, MealType } from '@/lib/types'
import { BUSINESS_TYPE_EMOJIS, TAG_COLORS } from '@/lib/restaurants'
import { Search, ChevronLeft, Plus, CheckCircle2, Flame, Star } from 'lucide-react'
import { InlineSpinner } from './ui/LoadingSpinner'

interface Props {
  mealType: MealType
  clientId: string
  dailyLogId: string
  onFoodAdded: () => void
  onBack: () => void
}

type Step = 'restaurants' | 'menu' | 'preview'

export default function RestaurantSearchDrawer({ mealType, clientId, dailyLogId, onFoodAdded, onBack }: Props) {
  const supabase = createClient()

  const [step, setStep] = useState<Step>('restaurants')
  const [restaurants, setRestaurants] = useState<RestaurantPartner[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantPartner | null>(null)
  const [categories, setCategories] = useState<RestaurantMenuCategory[]>([])
  const [allItems, setAllItems] = useState<RestaurantMenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<RestaurantMenuItem | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  // Filters
  const [filterHP, setFilterHP] = useState(false)
  const [filterLC, setFilterLC] = useState(false)
  const [filterLCal, setFilterLCal] = useState(false)

  useEffect(() => {
    loadRestaurants()
  }, [])

  async function loadRestaurants() {
    setLoading(true)
    const { data } = await supabase
      .from('restaurant_partners')
      .select('*')
      .eq('is_active', true)
      .order('business_name')
    setRestaurants((data ?? []) as RestaurantPartner[])
    setLoading(false)
  }

  async function selectRestaurant(r: RestaurantPartner) {
    setSelectedRestaurant(r)
    setLoading(true)
    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from('restaurant_menu_categories').select('*').eq('restaurant_id', r.id).order('display_order'),
      supabase.from('restaurant_menu_items').select('*').eq('restaurant_id', r.id).eq('is_available', true).order('name'),
    ])
    setCategories((cats ?? []) as RestaurantMenuCategory[])
    setAllItems((items ?? []) as RestaurantMenuItem[])
    setSelectedCategory(null)
    setQuery('')
    setLoading(false)
    setStep('menu')
  }

  const filteredItems = useCallback(() => {
    let items = allItems
    if (selectedCategory) items = items.filter(i => i.category_id === selectedCategory)
    if (query) items = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    if (filterHP) items = items.filter(i => i.is_high_protein)
    if (filterLC) items = items.filter(i => i.is_low_carb)
    if (filterLCal) items = items.filter(i => i.is_low_calorie)
    return items
  }, [allItems, selectedCategory, query, filterHP, filterLC, filterLCal])

  async function addToLog() {
    if (!selectedItem) return
    setAdding(true)
    await supabase.from('restaurant_menu_items')
      .update({ times_logged: (selectedItem.times_logged ?? 0) + 1 })
      .eq('id', selectedItem.id)
    await supabase.from('logged_food_items').insert({
      daily_log_id: dailyLogId,
      client_id: clientId,
      food_id: null,
      meal_type: mealType,
      quantity: selectedItem.serving_size,
      serving_unit: selectedItem.serving_unit,
      calories: selectedItem.calories,
      protein: selectedItem.protein,
      carbs: selectedItem.carbs,
      fat: selectedItem.fat,
      fiber: selectedItem.fiber,
      sugar: selectedItem.sugar,
      sodium: selectedItem.sodium,
      food_name: selectedItem.name,
      eaten_status: 'eaten',
      restaurant_id: selectedItem.restaurant_id,
      restaurant_menu_item_id: selectedItem.id,
      source_type: 'restaurant',
      source_label: selectedRestaurant?.business_name ?? null,
    })
    setAdded(true)
    setAdding(false)
    setTimeout(() => {
      onFoodAdded()
      onBack()
    }, 800)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <InlineSpinner />
        <p className="text-xs text-gray-400">Loading…</p>
      </div>
    )
  }

  // Step: Restaurant list
  if (step === 'restaurants') {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ChevronLeft size={16} /> Back
        </button>

        <h3 className="font-bold text-gray-900 text-base mb-3">Partner Restaurants</h3>

        {restaurants.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🍽️</p>
            <p className="text-sm font-medium text-gray-600">No partner restaurants yet</p>
            <p className="text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {restaurants.map(r => {
              const emoji = BUSINESS_TYPE_EMOJIS[r.business_type] ?? '🍽️'
              return (
                <button
                  key={r.id}
                  onClick={() => selectRestaurant(r)}
                  className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-green-50 rounded-2xl transition-colors text-left border border-transparent hover:border-green-100"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl flex-shrink-0">
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm truncate">{r.business_name}</p>
                      {r.is_verified && <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />}
                    </div>
                    {r.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.description}</p>}
                    {r.city && <p className="text-xs text-gray-300 mt-0.5">{r.city}, {r.state}</p>}
                  </div>
                  <ChevronLeft size={16} className="text-gray-300 rotate-180 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Step: Menu items
  if (step === 'menu') {
    const items = filteredItems()
    return (
      <div>
        <button onClick={() => setStep('restaurants')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3">
          <ChevronLeft size={16} /> {selectedRestaurant?.business_name}
        </button>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search menu…"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!selectedCategory ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedCategory === cat.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Tag filters */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
          {[
            ['High Protein', filterHP, () => setFilterHP(f => !f)],
            ['Low Carb', filterLC, () => setFilterLC(f => !f)],
            ['Low Cal', filterLCal, () => setFilterLCal(f => !f)],
          ].map(([label, active, toggle]) => (
            <button
              key={String(label)}
              onClick={toggle as () => void}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors border ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {String(label)}
            </button>
          ))}
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No items match your filters</div>
        ) : (
          <div className="space-y-1">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setStep('preview') }}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.is_coach_approved && <Star size={11} className="fill-green-400 text-green-400 flex-shrink-0" />}
                  </div>
                  {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                  <div className="flex gap-2.5 text-xs mt-1">
                    <span className="flex items-center gap-0.5 text-gray-500"><Flame size={10} /> {item.calories}</span>
                    <span className="text-purple-600">P {item.protein}g</span>
                    <span className="text-amber-600">C {item.carbs}g</span>
                    <span className="text-cyan-600">F {item.fat}g</span>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {item.price && (
                  <span className="text-xs font-semibold text-gray-400 flex-shrink-0">${item.price.toFixed(2)}</span>
                )}
                <ChevronLeft size={15} className="rotate-180 text-gray-300 flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Step: Macro preview
  if (step === 'preview' && selectedItem) {
    return (
      <div>
        <button onClick={() => setStep('menu')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ChevronLeft size={16} /> Back to menu
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="font-bold text-gray-900 text-lg leading-tight">{selectedItem.name}</p>
            {selectedItem.is_coach_approved && <Star size={14} className="fill-green-400 text-green-400" />}
          </div>
          <p className="text-xs text-gray-400">{selectedRestaurant?.business_name}</p>
          {selectedItem.description && (
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{selectedItem.description}</p>
          )}
        </div>

        {/* Macro breakdown */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Nutrition Facts</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Calories', selectedItem.calories, 'text-white'],
              ['Protein', `${selectedItem.protein}g`, 'text-purple-400'],
              ['Carbs', `${selectedItem.carbs}g`, 'text-amber-400'],
              ['Fat', `${selectedItem.fat}g`, 'text-cyan-400'],
            ].map(([l, v, c]) => (
              <div key={String(l)}>
                <p className={`font-bold text-base ${c}`}>{v}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          {(selectedItem.fiber > 0 || selectedItem.sodium > 0) && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
              {selectedItem.fiber > 0 && <span>Fiber: {selectedItem.fiber}g</span>}
              {selectedItem.sodium > 0 && <span>Sodium: {selectedItem.sodium}mg</span>}
              {selectedItem.sugar > 0 && <span>Sugar: {selectedItem.sugar}g</span>}
            </div>
          )}
        </div>

        {/* Serving */}
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 mb-4 text-sm text-gray-500">
          Per {selectedItem.serving_size} {selectedItem.serving_unit}
          {selectedItem.price && <span className="float-right font-semibold text-gray-700">${selectedItem.price.toFixed(2)}</span>}
        </div>

        {/* Tags */}
        {selectedItem.tags && selectedItem.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {selectedItem.tags.map(tag => (
              <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={addToLog}
          disabled={adding || added}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 text-sm shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
        >
          {added ? (
            <><CheckCircle2 size={16} /> Added!</>
          ) : adding ? (
            <InlineSpinner />
          ) : (
            <><Plus size={16} /> Add to {mealType}</>
          )}
        </button>
      </div>
    )
  }

  return null
}
