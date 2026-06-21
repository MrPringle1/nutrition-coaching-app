'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { RestaurantPartner } from '@/lib/types'
import { BUSINESS_TYPE_LABELS } from '@/lib/restaurants'
import { Save } from 'lucide-react'
import { InlineSpinner } from '@/components/ui/LoadingSpinner'

const BUSINESS_TYPES = ['restaurant', 'fast_casual', 'meal_prep', 'smoothie_bar', 'cafe', 'gym_cafe']

export default function PartnerSettingsPage() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<RestaurantPartner | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ business_name: '', business_type: 'restaurant', description: '', phone: '', email: '', address: '', city: '', state: '', zip_code: '', website_url: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: r } = await supabase.from('restaurant_partners').select('*').eq('owner_profile_id', user.id).maybeSingle()
      if (r) {
        setRestaurant(r as RestaurantPartner)
        setForm({
          business_name: r.business_name ?? '',
          business_type: r.business_type ?? 'restaurant',
          description: r.description ?? '',
          phone: r.phone ?? '',
          email: r.email ?? '',
          address: r.address ?? '',
          city: r.city ?? '',
          state: r.state ?? '',
          zip_code: r.zip_code ?? '',
          website_url: r.website_url ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    if (!restaurant) return
    setSaving(true)
    await supabase.from('restaurant_partners').update(form).eq('id', restaurant.id)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>

  if (!restaurant) return (
    <div className="px-6 py-12 text-center text-gray-400">
      <p>No restaurant account found. Contact support to get set up.</p>
    </div>
  )

  return (
    <div>
      <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Restaurant Settings</h1>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
          {saved ? '✓ Saved' : saving ? <InlineSpinner /> : <><Save size={15} /> Save</>}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Business Info</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Business Name</label>
            <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Business Type</label>
            <select value={form.business_type} onChange={e => set('business_type', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t] ?? t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Tell clients what makes your food great…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Contact & Location</h2>
          <div className="grid grid-cols-2 gap-3">
            {[['phone', 'Phone'], ['email', 'Email'], ['website_url', 'Website'], ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['zip_code', 'ZIP']].map(([k, l]) => (
              <div key={k} className={k === 'address' || k === 'website_url' ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{l}</label>
                <input value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)} placeholder={l}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saved ? '✓ Saved!' : saving ? <InlineSpinner /> : <><Save size={15} /> Save Settings</>}
        </button>
      </main>
    </div>
  )
}
