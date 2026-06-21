'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import RecipeImporter from '@/components/RecipeImporter'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { Recipe } from '@/lib/types'
import { ArrowLeft, Plus, ChefHat, Trash2, X } from 'lucide-react'

export default function CoachRecipesPage() {
  const supabase = createClient()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showImporter, setShowImporter] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCoachId(user.id)
      const { data } = await supabase.from('recipes').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
      setRecipes((data as Recipe[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function saveRecipe(recipe: any) {
    if (!coachId) return
    const { ingredients, ...rest } = recipe
    const { data: newRecipe } = await supabase.from('recipes').insert({
      ...rest,
      created_by: coachId,
      coach_id: coachId,
    }).select('*').single()
    if (newRecipe && ingredients?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('recipe_items').insert(ingredients.map((ing: any, i: number) => ({
        recipe_id: newRecipe.id,
        food_name: ing.food_name,
        quantity: ing.quantity,
        serving_unit: ing.serving_unit,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        sort_order: i,
      })))
    }
    if (newRecipe) setRecipes(prev => [newRecipe as Recipe, ...prev])
    setShowImporter(false)
  }

  async function deleteRecipe(id: string) {
    await supabase.from('recipes').delete().eq('id', id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <LoadingSpinner text="Loading recipes…" />

  return (
    <main className="min-h-screen bg-gray-50 md:ml-60">
      <div className="bg-[#0d2318] px-5 pt-5 pb-6 flex items-center justify-between">
        <div>
          <Link href="/coach" className="flex items-center gap-2 text-green-300 text-sm mb-3 hover:text-white">
            <ArrowLeft size={16} /> Coach Dashboard
          </Link>
          <h1 className="text-white font-bold text-2xl">Recipes</h1>
        </div>
        <button onClick={() => setShowImporter(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          <Plus size={16} /> Create
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-3xl mx-auto">
        {recipes.length === 0 ? (
          <EmptyState emoji="🍳" title="No recipes yet" subtitle="Build a recipe library to reuse across clients."
            action={<button onClick={() => setShowImporter(true)} className="bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">Create Recipe</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recipes.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <ChefHat size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.servings} serving{r.servings !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => deleteRecipe(r.id)} className="p-1.5 text-gray-300 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs bg-gray-50 rounded-xl py-2">
                  {[['Cal', Math.round(r.total_calories)], ['P', `${Math.round(r.total_protein)}g`], ['C', `${Math.round(r.total_carbs)}g`], ['F', `${Math.round(r.total_fat)}g`]].map(([l, v]) => (
                    <div key={String(l)}>
                      <p className="font-bold text-gray-900">{v}</p>
                      <p className="text-gray-400">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showImporter && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={e => e.target === e.currentTarget && setShowImporter(false)}>
          <div className="mt-auto bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl md:max-w-lg md:mx-auto md:my-auto md:rounded-3xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">New Recipe</h2>
              <button onClick={() => setShowImporter(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <RecipeImporter onSave={saveRecipe} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
