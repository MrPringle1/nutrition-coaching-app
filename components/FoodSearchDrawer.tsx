'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Food, MealType } from '@/lib/types'
import { calculateFoodMacros } from '@/lib/nutrition'
import FoodImage from './FoodImage'
import RestaurantSearchDrawer from './RestaurantSearchDrawer'
import { Search, X, Plus, Star, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { InlineSpinner } from './ui/LoadingSpinner'

interface Props {
  open: boolean
  onClose: () => void
  defaultMealType: MealType
  clientId: string
  dailyLogId: string
  onFoodAdded: () => void
}

type Tab = 'all' | 'recent' | 'favorites' | 'restaurants'

export default function FoodSearchDrawer({ open, onClose, defaultMealType, clientId, dailyLogId, onFoodAdded }: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [results, setResults] = useState<Food[]>([])
  const [recentFoods, setRecentFoods] = useState<Food[]>([])
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [mealType, setMealType] = useState<MealType>(defaultMealType)
  const [adding, setAdding] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCals, setCustomCals] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFat, setCustomFat] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(null)
      setQuantity(1)
      setMealType(defaultMealType)
      setShowCustom(false)
      loadRecentAndFavorites()
    }
  }, [open, defaultMealType])

  async function loadRecentAndFavorites() {
    const [{ data: recentData }, { data: favData }] = await Promise.all([
      supabase.from('recent_foods').select('food_id, used_at, foods(*)').eq('client_id', clientId).order('used_at', { ascending: false }).limit(10),
      supabase.from('favorite_foods').select('food_id, foods(*)').eq('client_id', clientId),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRecentFoods((recentData?.map((r: any) => r.foods as Food).filter(Boolean) as Food[]) ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const favs = (favData?.map((f: any) => f.foods as Food).filter(Boolean) as Food[]) ?? []
    setFavoriteFoods(favs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFavoriteIds(new Set(favData?.map((f: any) => f.food_id as string) ?? []))
  }

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase.from('foods').select('*').ilike('name', `%${q}%`).eq('is_public', true).limit(30)
    setResults(data ?? [])
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  async function toggleFavorite(food: Food) {
    if (favoriteIds.has(food.id)) {
      await supabase.from('favorite_foods').delete().eq('client_id', clientId).eq('food_id', food.id)
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(food.id); return n })
    } else {
      await supabase.from('favorite_foods').insert({ client_id: clientId, food_id: food.id })
      setFavoriteIds(prev => new Set([...prev, food.id]))
    }
  }

  async function addFood() {
    if (!selected) return
    setAdding(true)
    const macros = calculateFoodMacros(selected, quantity * selected.serving_size)
    await supabase.from('logged_food_items').insert({
      daily_log_id: dailyLogId,
      client_id: clientId,
      food_id: selected.id,
      meal_type: mealType,
      quantity: quantity * selected.serving_size,
      serving_unit: selected.serving_unit,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      fiber: macros.fiber,
      sugar: macros.sugar,
      sodium: macros.sodium,
      food_name: selected.name,
      eaten_status: 'eaten',
    })
    await supabase.from('recent_foods').insert({ client_id: clientId, food_id: selected.id })
    setAdding(false)
    onFoodAdded()
    onClose()
  }

  async function addCustomFood() {
    if (!customName.trim()) return
    setAdding(true)
    const cals = parseFloat(customCals) || 0
    await supabase.from('logged_food_items').insert({
      daily_log_id: dailyLogId,
      client_id: clientId,
      food_id: null,
      meal_type: mealType,
      quantity: 1,
      serving_unit: 'serving',
      calories: cals,
      protein: parseFloat(customProtein) || 0,
      carbs: parseFloat(customCarbs) || 0,
      fat: parseFloat(customFat) || 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      food_name: customName.trim(),
      eaten_status: 'eaten',
    })
    setAdding(false)
    onFoodAdded()
    onClose()
  }

  const displayList = tab === 'recent' ? recentFoods : tab === 'favorites' ? favoriteFoods : query ? results : []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mt-auto bg-[#161b22] rounded-t-3xl border-t border-[#30363d] max-h-[92vh] flex flex-col shadow-2xl md:max-w-lg md:mx-auto md:mb-4 md:rounded-3xl md:border md:mt-auto animate-slideUp">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-[#21262d]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white text-lg">Add Food</h2>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={16} className="text-white/60" />
            </button>
          </div>

          {/* Meal type selector */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(m => (
              <button key={m} onClick={() => setMealType(m)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${mealType === m ? 'bg-emerald-500 text-white' : 'bg-white/[0.08] text-white/50'}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setTab('all') }}
              placeholder="Search foods…"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              autoFocus
            />
            {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><InlineSpinner /></div>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-2">
            {[['all', 'Search'], ['recent', 'Recent'], ['favorites', 'Favorites']] .map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t as Tab); setQuery(''); setShowCustom(false) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${tab === t && !query && !showCustom ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'text-white/40 hover:text-white/70 border-transparent'}`}>
                {label}
              </button>
            ))}
            <button onClick={() => { setTab('restaurants'); setQuery(''); setShowCustom(false) }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${tab === 'restaurants' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'text-white/40 hover:text-white/70 border-transparent'}`}>
              <UtensilsCrossed size={11} /> Restaurants
            </button>
            <button onClick={() => { setShowCustom(!showCustom); setTab('all') }}
              className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${showCustom ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'text-white/40 hover:text-white/70 border-transparent'}`}>
              + Custom
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tab === 'restaurants' && !showCustom ? (
            <RestaurantSearchDrawer
              mealType={mealType}
              clientId={clientId}
              dailyLogId={dailyLogId}
              onFoodAdded={onFoodAdded}
              onBack={() => setTab('all')}
            />
          ) : showCustom ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-white text-sm">Quick Add Custom Food</h3>
              <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Food name*"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              <div className="grid grid-cols-2 gap-2">
                {[['Calories', customCals, setCustomCals], ['Protein (g)', customProtein, setCustomProtein], ['Carbs (g)', customCarbs, setCustomCarbs], ['Fat (g)', customFat, setCustomFat]].map(([label, val, setter]) => (
                  <input key={String(label)} type="number" value={String(val)} onChange={e => (setter as (v: string) => void)(e.target.value)}
                    placeholder={String(label)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                ))}
              </div>
              <button onClick={addCustomFood} disabled={!customName.trim() || adding}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all">
                {adding ? <InlineSpinner /> : <><Plus size={16} /> Add to {mealType}</>}
              </button>
            </div>
          ) : selected ? (
            <div className="animate-fadeIn">
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-white/40 mb-4 hover:text-white/70">
                ← Back to results
              </button>
              <div className="flex items-center gap-3 mb-4">
                <FoodImage src={selected.image_url} alt={selected.name} category={selected.category} size="lg" />
                <div>
                  <p className="font-bold text-white">{selected.name}</p>
                  {selected.brand && <p className="text-xs text-white/40">{selected.brand}</p>}
                  <p className="text-xs text-white/40 mt-0.5">Per {selected.serving_size} {selected.serving_unit}</p>
                </div>
              </div>

              {/* Nutrition per serving */}
              <div className="bg-[#0d1117] rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Per {selected.serving_size} {selected.serving_unit}</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[['Calories', selected.calories, 'text-white'], ['Protein', `${selected.protein}g`, 'text-purple-300'], ['Carbs', `${selected.carbs}g`, 'text-amber-300'], ['Fat', `${selected.fat}g`, 'text-cyan-300']].map(([l, v, c]) => (
                    <div key={String(l)}>
                      <p className={`font-bold ${c}`}>{v}</p>
                      <p className="text-white/40">{l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5">Servings</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(0.25, q - 0.25))}
                    className="w-10 h-10 bg-white/[0.08] rounded-xl font-bold text-white hover:bg-white/15 flex items-center justify-center text-lg">−</button>
                  <input type="number" value={quantity} step={0.25} min={0.25}
                    onChange={e => setQuantity(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
                    className="flex-1 text-center text-lg font-bold text-white bg-[#0d1117] border border-[#30363d] rounded-xl py-2 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20" />
                  <button onClick={() => setQuantity(q => q + 0.25)}
                    className="w-10 h-10 bg-white/[0.08] rounded-xl font-bold text-white hover:bg-white/15 flex items-center justify-center text-lg">+</button>
                </div>
                <p className="text-center text-xs text-white/40 mt-1">{Math.round(selected.calories * quantity)} cal total</p>
              </div>

              <button onClick={addFood} disabled={adding}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-semibold rounded-xl py-3.5 text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
                {adding ? <InlineSpinner /> : <><Plus size={16} /> Add to {mealType}</>}
              </button>
            </div>
          ) : (
            <div>
              {displayList.length === 0 && !searching ? (
                <div className="text-center py-10 text-white/40">
                  {tab === 'all' && !query && <p className="text-sm">Search above to find foods</p>}
                  {tab === 'recent' && <p className="text-sm">No recent foods yet</p>}
                  {tab === 'favorites' && <p className="text-sm">No favorites yet — tap ⭐ to save</p>}
                  {query && !searching && <p className="text-sm">No foods found for &quot;{query}&quot;</p>}
                </div>
              ) : (
                <div className="space-y-1">
                  {displayList.map(food => (
                    <div key={food.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <FoodImage src={food.image_url} alt={food.name} category={food.category} size="sm" />
                      <button className="flex-1 text-left min-w-0" onClick={() => setSelected(food)}>
                        <p className="font-semibold text-white text-sm truncate">{food.name}</p>
                        <div className="flex gap-1.5 text-[11px] mt-1">
                          <span className="text-white/60">{food.calories} cal</span>
                          <span className="bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded-md">P {food.protein}g</span>
                          <span className="bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-md">C {food.carbs}g</span>
                          <span className="bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded-md">F {food.fat}g</span>
                        </div>
                      </button>
                      <button onClick={() => toggleFavorite(food)} className="p-1.5 text-white/30 hover:text-yellow-400 transition-colors">
                        <Star size={16} className={favoriteIds.has(food.id) ? 'fill-yellow-400 text-yellow-400' : ''} />
                      </button>
                      <button onClick={() => setSelected(food)} className="p-1.5 text-white/30 hover:text-emerald-400 transition-colors">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
