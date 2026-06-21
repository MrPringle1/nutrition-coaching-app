'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { RestaurantAd } from '@/lib/types'
import { Plus, Trash2, Eye, MousePointerClick } from 'lucide-react'
import { InlineSpinner } from '@/components/ui/LoadingSpinner'

const PLACEMENTS = ['dashboard', 'food_search']

export default function PartnerAdsPage() {
  const supabase = createClient()
  const [ads, setAds] = useState<RestaurantAd[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', call_to_action: 'View Menu', placement: 'dashboard', start_date: '', end_date: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: r } = await supabase.from('restaurant_partners').select('id').eq('owner_profile_id', user.id).maybeSingle()
      if (!r) { setLoading(false); return }
      setRestaurantId(r.id)
      const { data } = await supabase.from('restaurant_ads').select('*').eq('restaurant_id', r.id).order('created_at', { ascending: false })
      setAds((data ?? []) as RestaurantAd[])
      setLoading(false)
    }
    load()
  }, [])

  async function createAd() {
    if (!restaurantId || !form.title) return
    setSaving(true)
    const { data } = await supabase.from('restaurant_ads').insert({
      restaurant_id: restaurantId,
      title: form.title,
      description: form.description || null,
      call_to_action: form.call_to_action,
      placement: form.placement,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: 'draft',
    }).select().single()
    if (data) setAds(prev => [data as RestaurantAd, ...prev])
    setForm({ title: '', description: '', call_to_action: 'View Menu', placement: 'dashboard', start_date: '', end_date: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function toggleStatus(ad: RestaurantAd) {
    const next = ad.status === 'active' ? 'paused' : 'active'
    await supabase.from('restaurant_ads').update({ status: next }).eq('id', ad.id)
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: next } : a))
  }

  async function deleteAd(id: string) {
    if (!confirm('Delete this ad?')) return
    await supabase.from('restaurant_ads').delete().eq('id', id)
    setAds(prev => prev.filter(a => a.id !== id))
  }

  const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-500', paused: 'bg-amber-100 text-amber-700' }

  return (
    <div>
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ads</h1>
          <p className="text-sm text-gray-400 mt-0.5">Promote your restaurant to NutriCoach clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-green-600/25">
          <Plus size={16} /> New Ad
        </button>
      </header>

      <main className="px-6 py-5 space-y-5">
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 animate-fadeIn">
            <h2 className="font-bold text-gray-900">New Ad</h2>
            {[['title', 'Ad Title *'], ['description', 'Description'], ['call_to_action', 'Button Text']].map(([k, l]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{l}</label>
                <input value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={k === 'call_to_action' ? 'View Menu' : ''}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Placement</label>
                <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {PLACEMENTS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </div>
              {[['start_date', 'Start Date'], ['end_date', 'End Date']].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{l}</label>
                  <input type="date" value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 font-semibold rounded-xl py-2.5 text-sm">Cancel</button>
              <button onClick={createAd} disabled={!form.title || saving}
                className="flex-1 bg-green-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <InlineSpinner /> : 'Create Ad (Draft)'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📢</p>
            <p className="font-semibold text-gray-600">No ads yet</p>
            <p className="text-sm mt-1">Create an ad to reach NutriCoach clients</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {ads.map((ad, idx) => (
              <div key={ad.id} className={`px-5 py-4 ${idx < ads.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">{ad.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold capitalize ${STATUS_COLORS[ad.status] ?? 'bg-gray-100 text-gray-500'}`}>{ad.status}</span>
                    </div>
                    {ad.description && <p className="text-xs text-gray-400 mb-1">{ad.description}</p>}
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="capitalize">{ad.placement.replace('_', ' ')}</span>
                      <span className="flex items-center gap-0.5"><Eye size={10} /> {ad.impressions}</span>
                      <span className="flex items-center gap-0.5"><MousePointerClick size={10} /> {ad.clicks}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleStatus(ad)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${ad.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {ad.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => deleteAd(ad.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
