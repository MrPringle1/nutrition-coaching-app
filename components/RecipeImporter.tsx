'use client'

import { useState } from 'react'
import type { Recipe } from '@/lib/types'
import { InlineSpinner } from './ui/LoadingSpinner'
import { Link2, Pencil, Plus, Trash2, Calculator } from 'lucide-react'

interface Ingredient {
  food_name: string
  quantity: number
  serving_unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Props {
  onSave: (recipe: Partial<Recipe> & { ingredients: Ingredient[] }) => void
}

const emptyIngredient: Ingredient = { food_name: '', quantity: 1, serving_unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 }

export default function RecipeImporter({ onSave }: Props) {
  const [mode, setMode] = useState<'url' | 'manual'>('manual')
  const [url, setUrl] = useState('')
  const [urlMessage, setUrlMessage] = useState('')
  const [importing, setImporting] = useState(false)

  const [name, setName] = useState('')
  const [servings, setServings] = useState(1)
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ...emptyIngredient }])
  const [totals, setTotals] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null)

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'

  async function importUrl() {
    if (!url.trim()) return
    setImporting(true); setUrlMessage('')
    try {
      const res = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      setUrlMessage(data.message || 'Import not available — please add manually.')
      setMode('manual')
    } catch {
      setUrlMessage('Import failed — please add manually.')
      setMode('manual')
    }
    setImporting(false)
  }

  function updateIngredient(idx: number, field: keyof Ingredient, value: string) {
    setIngredients(prev => prev.map((ing, i) => i === idx
      ? { ...ing, [field]: field === 'food_name' || field === 'serving_unit' ? value : parseFloat(value) || 0 }
      : ing))
  }

  function calcMacros() {
    const t = ingredients.reduce((acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    setTotals(t)
  }

  function save() {
    const t = totals ?? ingredients.reduce((acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    onSave({
      name,
      servings,
      description,
      total_calories: t.calories,
      total_protein: t.protein,
      total_carbs: t.carbs,
      total_fat: t.fat,
      ingredients: ingredients.filter(i => i.food_name.trim()),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([['url', 'Import URL', Link2], ['manual', 'Create Manually', Pencil]] as const).map(([m, label, Icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${mode === m ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {mode === 'url' && (
        <div className="space-y-2">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/recipe" className={inputCls} />
          <button onClick={importUrl} disabled={importing || !url.trim()}
            className="w-full bg-gray-900 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {importing ? <InlineSpinner /> : 'Import'}
          </button>
          {urlMessage && <p className="text-xs text-gray-500 text-center">{urlMessage}</p>}
        </div>
      )}

      <div className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Recipe name*" className={inputCls} />
        <div className="flex gap-2">
          <input type="number" value={servings} min={1} onChange={e => setServings(parseInt(e.target.value) || 1)} placeholder="Servings" className={inputCls} />
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Description" className={inputCls} />

        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ingredients</p>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-2.5 space-y-2">
                <div className="flex gap-2">
                  <input value={ing.food_name} onChange={e => updateIngredient(idx, 'food_name', e.target.value)} placeholder="Food name" className={inputCls + ' flex-1'} />
                  <button onClick={() => setIngredients(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-gray-300 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} placeholder="Qty" className={inputCls} />
                  <input value={ing.serving_unit} onChange={e => updateIngredient(idx, 'serving_unit', e.target.value)} placeholder="Unit" className={inputCls} />
                  <input type="number" value={ing.calories} onChange={e => updateIngredient(idx, 'calories', e.target.value)} placeholder="Cal" className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={ing.protein} onChange={e => updateIngredient(idx, 'protein', e.target.value)} placeholder="Protein" className={inputCls} />
                  <input type="number" value={ing.carbs} onChange={e => updateIngredient(idx, 'carbs', e.target.value)} placeholder="Carbs" className={inputCls} />
                  <input type="number" value={ing.fat} onChange={e => updateIngredient(idx, 'fat', e.target.value)} placeholder="Fat" className={inputCls} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setIngredients(prev => [...prev, { ...emptyIngredient }])}
            className="w-full mt-2 py-2.5 text-sm text-green-600 font-semibold border border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-1.5 hover:bg-green-50">
            <Plus size={14} /> Add Ingredient
          </button>
        </div>

        <button onClick={calcMacros}
          className="w-full border border-gray-200 text-gray-700 font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
          <Calculator size={15} /> Calculate Macros
        </button>

        {totals && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 grid grid-cols-4 gap-2 text-center text-xs">
            {[['Cal', Math.round(totals.calories)], ['P', `${Math.round(totals.protein)}g`], ['C', `${Math.round(totals.carbs)}g`], ['F', `${Math.round(totals.fat)}g`]].map(([l, v]) => (
              <div key={String(l)}>
                <p className="font-bold text-gray-900">{v}</p>
                <p className="text-gray-400">{l}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} disabled={!name.trim()}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 text-sm disabled:opacity-50">
          Save Recipe
        </button>
      </div>
    </div>
  )
}
