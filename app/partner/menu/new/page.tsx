'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Save } from 'lucide-react'
import { InlineSpinner } from '@/components/ui/LoadingSpinner'

const TAG_OPTIONS = ['high-protein', 'low-carb', 'low-calorie', 'vegan', 'vegetarian', 'gluten-free', 'keto-friendly', 'coach-approved']

export default function NewMenuItemPage() {
  const supabase = createClient()
  const router = useRouter()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', category_id: '',
    serving_size: '1', serving_unit: 'serving', price: '',
    calories: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', sodium: '',
    tags: [] as string[],
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: r } = await supabase.from('restaurant_partners').select('id').eq('owner_profile_id', user.id).maybeSingle()
      if (!r) { router.push('/partner'); return }
      setRestaurantId(r.id)
      const { data: cats } = await supabase.from('restaurant_menu_categories').select('id, name').eq('restaurant_id', r.id).order('display_order')
      setCategories(cats ?? [])
    }
    load()
  }, [])

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }
  function toggleTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))
  }

  async function save() {
    if (!form.name.trim() || !form.calories) { setError('Name and calories are required'); return }
    if (!restaurantId) return
    setSaving(true)
    const p = (k: string) => parseFloat(form[k as keyof typeof form] as string) || 0
    const { error: err } = await supabase.from('restaurant_menu_items').insert({
      restaurant_id: restaurantId,
      category_id: form.category_id || null,
      name: form.name.trim(),
      description: form.description || null,
      price: p('price') || null,
      serving_size: p('serving_size') || 1,
      serving_unit: form.serving_unit || 'serving',
      calories: p('calories'),
      protein: p('protein'),
      carbs: p('carbs'),
      fat: p('fat'),
      fiber: p('fiber'),
      sugar: p('sugar'),
      sodium: p('sodium'),
      tags: form.tags,
      is_high_protein: form.tags.includes('high-protein'),
      is_low_carb: form.tags.includes('low-carb'),
      is_low_calorie: form.tags.includes('low-calorie'),
      is_coach_approved: form.tags.includes('coach-approved'),
      is_available: true,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/partner/menu')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/partner/menu" className="text-gray-400 hover:text-gray-600"><ChevronLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Add Menu Item</h1>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
          {saving ? <InlineSpinner /> : <><Save size={15} /> Save</>}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Item Details</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Grilled Chicken Bowl"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="What's in this item?"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[['serving_size', 'Serving Size'], ['serving_unit', 'Unit'], ['price', 'Price ($)']].map(([k, l]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{l}</label>
                <input value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} placeholder={k === 'serving_unit' ? 'serving' : '0'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Nutrition Facts</h2>
          <div className="grid grid-cols-2 gap-3">
            {[['calories', 'Calories *'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)'], ['fiber', 'Fiber (g)'], ['sugar', 'Sugar (g)'], ['sodium', 'Sodium (mg)']].map(([k, l]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{l}</label>
                <input type="number" value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${form.tags.includes(tag) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <InlineSpinner /> : <><Save size={15} /> Save Menu Item</>}
        </button>
      </main>
    </div>
  )
}
