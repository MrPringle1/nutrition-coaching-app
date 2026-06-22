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

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all'
const labelCls = 'block text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-1'

export default function RecipeImporter({ onSave }: Props) {
  const [mode, setMode] = useState<'url' | 'manual'>('manual')
  const [url, setUrl] = useState('')
  const [urlMessage, setUrlMessage] = useState('')
  const [importing, setImporting] = useState(false)

  const [name, setName] = useState('')
  const [servings, setServings] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ...emptyIngredient }])
  const [totals, setTotals] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null)

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
      if (data.success && data.recipe) {
        const r = data.recipe
        setName(r.name || '')
        setDescription(r.description || '')
        setServings(r.servings || 1)
        if (r.ingredients?.length) setIngredients(r.ingredients)
        if (r.nutrition?.calories || r.nutrition?.protein) {
          setTotals(r.nutrition)
        }
        setUrlMessage(`Imported "${r.name}" — review the ingredients below, then save.`)
        setMode('manual')
      } else {
        setUrlMessage(data.error || 'Import failed — please add manually.')
        setMode('manual')
      }
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
      servings: Number(servings) || 1,
      description,
      total_calories: t.calories,
      total_protein: t.protein,
      total_carbs: t.carbs,
      total_fat: t.fat,
      ingredients: ingredients.filter(i => i.food_name.trim()),
    })
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
        {([['url', 'Import URL', Link2], ['manual', 'Create Manually', Pencil]] as const).map(([m, label, Icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === m
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-white/50 hover:text-white/80'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* URL import */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Recipe URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/my-recipe"
              className={inputCls} />
          </div>
          <button onClick={importUrl} disabled={importing || !url.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
            {importing ? <InlineSpinner /> : 'Import Recipe'}
          </button>
          {urlMessage && (
            <p className={`text-xs text-center ${urlMessage.startsWith('Imported') ? 'text-emerald-400' : 'text-rose-400'}`}>
              {urlMessage}
            </p>
          )}
        </div>
      )}

      {/* Manual form */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Recipe Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Grilled Chicken Bowl"
            className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Servings</label>
            <input type="number" value={servings} min={1}
              onChange={e => setServings(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
              placeholder="1"
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prep Time (min)</label>
            <input type="number" placeholder="0" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={2} placeholder="Optional notes about this recipe…"
            className={inputCls + ' resize-none'} />
        </div>

        {/* Ingredients */}
        <div>
          <p className={labelCls}>Ingredients</p>
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 space-y-3">
                {/* Food name row */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className={labelCls}>Food Name</label>
                    <input value={ing.food_name} onChange={e => updateIngredient(idx, 'food_name', e.target.value)}
                      placeholder="e.g. Chicken Breast"
                      className={inputCls} />
                  </div>
                  <button onClick={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}
                    className="mt-5 p-2 text-white/20 hover:text-rose-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Qty / Unit / Calories */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Qty</label>
                    <input type="number" value={ing.quantity || ''}
                      onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                      placeholder="1" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <input value={ing.serving_unit} onChange={e => updateIngredient(idx, 'serving_unit', e.target.value)}
                      placeholder="g / oz / cup" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Calories</label>
                    <input type="number" value={ing.calories || ''}
                      onChange={e => updateIngredient(idx, 'calories', e.target.value)}
                      placeholder="0" className={inputCls} />
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400/70 mb-1">Protein (g)</label>
                    <input type="number" value={ing.protein || ''}
                      onChange={e => updateIngredient(idx, 'protein', e.target.value)}
                      placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400/70 mb-1">Carbs (g)</label>
                    <input type="number" value={ing.carbs || ''}
                      onChange={e => updateIngredient(idx, 'carbs', e.target.value)}
                      placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-400/70 mb-1">Fat (g)</label>
                    <input type="number" value={ing.fat || ''}
                      onChange={e => updateIngredient(idx, 'fat', e.target.value)}
                      placeholder="0" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setIngredients(prev => [...prev, { ...emptyIngredient }])}
            className="w-full mt-3 py-3 text-sm text-emerald-400 font-semibold border border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center gap-1.5 hover:bg-emerald-500/10 transition-all">
            <Plus size={14} /> Add Ingredient
          </button>
        </div>

        {/* Calculate macros */}
        <button onClick={calcMacros}
          className="w-full border border-white/10 text-white/60 font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
          <Calculator size={15} /> Calculate Total Macros
        </button>

        {totals && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 grid grid-cols-4 gap-2 text-center">
            {[
              ['Cal', Math.round(totals.calories), 'text-emerald-400'],
              ['Protein', `${Math.round(totals.protein)}g`, 'text-purple-400'],
              ['Carbs', `${Math.round(totals.carbs)}g`, 'text-amber-400'],
              ['Fat', `${Math.round(totals.fat)}g`, 'text-cyan-400'],
            ].map(([l, v, c]) => (
              <div key={String(l)}>
                <p className={`font-black text-lg ${c}`}>{v}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-wide">{l}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={save} disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-40 text-white font-bold rounded-xl py-4 text-sm shadow-lg shadow-emerald-500/25 transition-all">
          Save Recipe
        </button>
      </div>
    </div>
  )
}
