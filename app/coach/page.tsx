'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, LogOut, Plus, ChevronRight, Leaf, Target, Library, ChefHat } from 'lucide-react'
import type { Client } from '@/lib/types'

export default function CoachDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [coachName, setCoachName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'coach') { router.push('/plan'); return }
      setCoachName(profile.full_name)

      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
      setClients(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const AVATAR_COLORS = [
    'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500',
  ]

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0d2318] min-h-screen fixed top-0 left-0 flex flex-col z-20 border-r border-white/5">
        <div className="px-5 pt-7 pb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/40 rounded-2xl blur-md" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <Leaf size={20} className="text-white" />
              </div>
            </div>
            <div>
              <p className="font-black text-white text-base leading-none">NutriCoach</p>
              <p className="text-emerald-400 text-xs mt-1">by Perfect Fit</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/40">
            <Users size={18} />
            <span className="text-sm font-medium">Clients</span>
          </div>
          <Link href="/coach/libraries" className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-100/60 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all">
            <Library size={18} />
            <span>Food Libraries</span>
          </Link>
          <Link href="/coach/recipes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-100/60 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all">
            <ChefHat size={18} />
            <span>Recipes</span>
          </Link>
        </nav>

        <div className="px-3 pb-6 space-y-2">
          <div className="px-4 py-3 rounded-xl bg-white/5">
            <p className="text-white text-xs font-semibold">{coachName}</p>
            <p className="text-green-400 text-[10px] mt-0.5">Coach</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-200/50 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-60 flex-1 min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Coach Dashboard</h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">Good day, {coachName.split(' ')[0]} 👋</p>
          </div>
          <Link
            href="/coach/clients/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
          >
            <Plus size={16} />
            Add Client
          </Link>
        </header>

        <main className="px-8 py-6">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-emerald-600" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Clients</span>
              </div>
              <p className="text-4xl font-black text-slate-800">{clients.length}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Active coaching</p>
            </div>

            <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target size={20} className="text-blue-600" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Avg Goal</span>
              </div>
              <p className="text-4xl font-black text-slate-800">
                {clients.length > 0
                  ? Math.round(clients.filter(c => c.current_weight && c.goal_weight).reduce((s, c) => s + (c.current_weight! - c.goal_weight!), 0) / Math.max(clients.filter(c => c.current_weight && c.goal_weight).length, 1))
                  : '—'
                }
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">lbs to lose avg</p>
            </div>

            <div className="bg-gradient-to-br from-[#0d1f14] to-[#111827] rounded-2xl p-5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
              <div className="absolute -top-10 -right-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Leaf size={20} className="text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300/70">Plans Active</span>
              </div>
              <p className="relative text-4xl font-black text-white">{clients.length}</p>
              <p className="relative text-xs text-emerald-400 font-medium mt-1">7-Day gluten-free plans</p>
            </div>
          </div>

          {/* Client list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Your Clients</h2>
              <span className="text-xs text-slate-400 font-medium">{clients.length} total</span>
            </div>

            {clients.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-slate-400" />
                </div>
                <p className="font-bold text-slate-700 text-lg">No clients yet</p>
                <p className="text-sm text-slate-400 mt-1 mb-5">Add your first client to get started.</p>
                <Link
                  href="/coach/clients/new"
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                >
                  <Plus size={16} />
                  Add First Client
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
                {clients.map((client, idx) => {
                  const lbs = client.current_weight && client.goal_weight
                    ? client.current_weight - client.goal_weight
                    : null
                  const pct = client.current_weight && client.goal_weight
                    ? Math.max(0, Math.min(100, 100 - ((client.current_weight - client.goal_weight) / (client.current_weight - client.goal_weight)) * 100))
                    : 0
                  return (
                    <Link
                      key={client.id}
                      href={`/coach/clients/${client.id}`}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${
                        idx < clients.length - 1 ? 'border-b border-slate-50' : ''
                      }`}
                    >
                      <div className={`w-11 h-11 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                        {initials(client.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{client.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{client.email}</p>
                        {lbs !== null && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{lbs} lbs to goal</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {client.current_weight && (
                          <p className="text-sm font-bold text-slate-700">{client.current_weight} lbs</p>
                        )}
                        {client.goal_weight && (
                          <p className="text-xs text-emerald-600 font-bold">Goal: {client.goal_weight}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
