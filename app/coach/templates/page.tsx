'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { MealTemplate } from '@/lib/types'
import { Plus, Trash2, ChevronRight } from 'lucide-react'

const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-blue-100 text-blue-700',
  dinner: 'bg-purple-100 text-purple-700',
  snack: 'bg-green-100 text-green-700',
  any: 'bg-gray-100 text-gray-700',
}

export default function TemplatesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', meal_type: 'any', description: '', total_calories: '', total_protein: '', total_carbs: '', total_fat: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'coach') { router.push('/home'); return }
      const { data } = await supabase.from('meal_templates').select('*').eq('coach_id', user.id).order('created_at', { ascending: false })
      setTemplates(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveTemplate() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('meal_templates').insert({
      coach_id: user.id,
      name: form.name,
      meal_type: form.meal_type,
      description: form.description || null,
      total_calories: parseFloat(form.total_calories) || 0,
      total_protein: parseFloat(form.total_protein) || 0,
      total_carbs: parseFloat(form.total_carbs) || 0,
      total_fat: parseFloat(form.total_fat) || 0,
    }).select().single()
    if (data) setTemplates(prev => [data, ...prev])
    setForm({ name: '', meal_type: 'any', description: '', total_calories: '', total_protein: '', total_carbs: '', total_fat: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await supabase.from('meal_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meal Templates</h1>
          <p className="text-sm text-gray-400 mt-0.5">Reusable meal blueprints for your clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-green-600/25 transition-all">
          <Plus size={16} /> New Template
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 animate-fadeIn">
            <h2 className="font-bold text-gray-900">New Template</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Template Name</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. High-Protein Breakfast"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Meal Type</label>
                <select value={form.meal_type} onChange={e => setForm(f => ({...f, meal_type: e.target.value}))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 capitalize">
                  {['any', 'breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                </select>
              </div>
              {[['total_calories', 'Calories'], ['total_protein', 'Protein (g)'], ['total_carbs', 'Carbs (g)'], ['total_fat', 'Fat (g)']].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{l}</label>
                  <input type="number" value={form[k as keyof typeof form]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2}
                placeholder="Describe this meal template…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 font-semibold rounded-xl py-2.5 text-sm">Cancel</button>
              <button onClick={saveTemplate} disabled={!form.name || saving}
                className="flex-1 bg-green-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        )}

        {templates.length === 0 && !showForm ? (
          <EmptyState emoji="📋" title="No templates yet" subtitle="Create reusable meal blueprints to assign to clients quickly."
            action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700"><Plus size={15} /> Create Template</button>} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {templates.map((t, idx) => (
              <div key={t.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 ${idx < templates.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${MEAL_COLORS[t.meal_type] ?? MEAL_COLORS.any}`}>{t.meal_type}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>{t.total_calories} cal</span>
                    <span className="text-purple-500">P: {t.total_protein}g</span>
                    <span className="text-amber-500">C: {t.total_carbs}g</span>
                    <span className="text-cyan-500">F: {t.total_fat}g</span>
                  </div>
                  {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
                </div>
                <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
