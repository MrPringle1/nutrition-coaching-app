'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { InlineSpinner } from '@/components/ui/LoadingSpinner'
import { User, Scale, Droplets, LogOut, Save, ChevronRight } from 'lucide-react'
import type { Client, Profile } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', height: '', notes: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) { setProfile(p); setForm(f => ({ ...f, full_name: p.full_name })) }
      const { data: c } = await supabase.from('clients').select('*').eq('profile_id', user.id).single()
      if (c) { setClient(c); setForm(f => ({ ...f, phone: c.phone ?? '', height: c.height ?? '', notes: c.notes ?? '' })) }
    }
    load()
  }, [])

  async function saveProfile() {
    if (!profile || !client) return
    setSaving(true)
    await Promise.all([
      supabase.from('profiles').update({ full_name: form.full_name }).eq('id', profile.id),
      supabase.from('clients').update({ phone: form.phone, height: form.height, notes: form.notes }).eq('id', client.id),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const stats = [
    { label: 'Current Weight', value: client?.current_weight ? `${client.current_weight} lbs` : '—', icon: Scale, color: 'bg-green-100' },
    { label: 'Goal Weight', value: client?.goal_weight ? `${client.goal_weight} lbs` : '—', icon: Scale, color: 'bg-blue-100' },
    { label: 'Age', value: client?.age ?? '—', icon: User, color: 'bg-purple-100' },
  ]

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-[#f6f8fc]">
        <div className="bg-gradient-to-br from-[#0d1f14] to-[#111827] px-5 pt-6 pb-7 relative overflow-hidden">
          <div className="absolute -top-10 -right-8 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400/70 mb-1">Account</p>
          <h1 className="relative text-white font-black text-2xl mb-4">Settings</h1>
          {profile && (
            <div className="relative flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-900/40">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{profile.full_name}</p>
                <p className="text-emerald-300 text-sm">{profile.email}</p>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide mt-1 inline-block">
                  {profile.role}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-3 text-center">
                <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={16} className="text-slate-600" />
                </div>
                <p className="font-extrabold text-slate-800 text-sm">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Edit profile */}
          <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="text-base font-bold text-slate-800">Edit Profile</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Update your personal information</p>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Full Name', key: 'full_name', placeholder: 'Your name', type: 'text' },
                { label: 'Phone', key: 'phone', placeholder: '+1 (555) 000-0000', type: 'tel' },
                { label: 'Height', key: 'height', placeholder: "5'4\"", type: 'text' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1.5">Notes / Preferences</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Dietary preferences, allergies, notes…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white resize-none transition-all"
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className={`w-full font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all shadow-lg text-white ${
                  saved ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 shadow-emerald-500/30'
                } disabled:opacity-60`}
              >
                {saving ? <InlineSpinner /> : saved ? '✓ Saved!' : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={18} />
              <span className="font-bold text-sm">Sign Out</span>
              <ChevronRight size={16} className="ml-auto text-slate-300" />
            </button>
          </div>

          <p className="text-center text-xs text-slate-300 pb-4">NutriCoach · Built by Perfect Fit Wellness Solutions</p>
        </div>
      </main>
    </>
  )
}
