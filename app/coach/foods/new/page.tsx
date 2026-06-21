'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InlineSpinner } from '@/components/ui/LoadingSpinner'
import { ChevronLeft, Save } from 'lucide-react'

const CATEGORIES = ['protein', 'dairy', 'grain', 'vegetable', 'fruit', 'fat', 'legume', 'supplement', 'beverage', 'snack', 'sauce', 'other']

export default function NewFoodPage() {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', brand: '', category: 'other',
    serving_size: '1', serving_unit: 'serving',
    calories: '', protein: '', carbs: '', fat: '',
    fiber: '', sugar: '', sodium: '',
    is_public: false,
  })

  function set(key: string, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function save() {
    if (!form.name.trim() || !form.calories) { setError('Name and calories are required'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase.from('foods').insert({
      name: form.name.trim(),
      brand: form.brand || null,
      category: form.category,
      serving_size: parseFloat(form.serving_size) || 1,
      serving_unit: form.serving_unit,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      fiber: parseFloat(form.fiber) || 0,
      sugar: parseFloat(form.sugar) || 0,
      sodium: parseFloat(form.sodium) || 0,
      created_by: user.id,
      source: 'coach',
      is_public: form.is_public,
      is_verified: false,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.push('/coach/foods')
  }

  const fields = [
    ['calories', 'Calories (kcal)', 'e.g. 200'],
    ['protein', 'Protein (g)', 'e.g. 25'],
    ['carbs', 'Carbs (g)', 'e.g. 30'],
    ['fat', 'Fat (g)', 'e.g. 8'],
    ['fiber', 'Fiber (g)', 'e.g. 4'],
    ['sugar', 'Sugar (g)', 'e.g. 5'],
    ['sodium', 'Sodium (mg)', 'e.g. 350'],
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <Link href="/coach/foods" className="text-gray-400 hover:text-gray-600"><ChevronLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Add Food</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create a custom food for your library</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-green-600/25 disabled:opacity-60 transition-all">
          {saving ? <InlineSpinner /> : <><Save size={15} /> Save</>}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Basic Info</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Food Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Grilled Chicken Breast"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Brand (optional)</label>
            <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Trader Joe's"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 capitalize">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Serving Size</label>
              <input type="number" value={form.serving_size} onChange={e => set('serving_size', e.target.value)} placeholder="1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Unit</label>
              <input value={form.serving_unit} onChange={e => set('serving_unit', e.target.value)} placeholder="oz, cup, piece…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Nutrition Facts <span className="text-xs font-normal text-gray-400">(per serving)</span></h2>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                <input type="number" value={form[key as keyof typeof form] as string}
                  onChange={e => set(key, e.target.value)} placeholder={placeholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={e => set('is_public', e.target.checked)}
              className="w-5 h-5 rounded text-green-600 focus:ring-green-500" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Make public</p>
              <p className="text-xs text-gray-400">All clients on the platform can search this food</p>
            </div>
          </label>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 text-sm shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
          {saving ? <InlineSpinner /> : <><Save size={15} /> Save Food</>}
        </button>
      </main>
    </div>
  )
}
