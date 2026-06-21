'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FoodImage from '@/components/FoodImage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { Food } from '@/lib/types'
import { Plus, Search, Trash2, ChevronLeft } from 'lucide-react'

export default function CoachFoodsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'mine' | 'system'>('mine')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'coach') { router.push('/home'); return }
      await loadFoods(user.id, tab, query)
    }
    check()
  }, [])

  async function loadFoods(userId: string, currentTab: string, q: string) {
    setLoading(true)
    let queryBuilder = supabase.from('foods').select('*')
    if (currentTab === 'mine') queryBuilder = queryBuilder.eq('created_by', userId)
    else queryBuilder = queryBuilder.eq('source', 'system')
    if (q) queryBuilder = queryBuilder.ilike('name', `%${q}%`)
    const { data } = await queryBuilder.order('name').limit(50)
    setFoods(data ?? [])
    setLoading(false)
  }

  async function deleteFood(id: string) {
    if (!confirm('Delete this food?')) return
    await supabase.from('foods').delete().eq('id', id)
    setFoods(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Coach sidebar */}
      <CoachSidebarSimple active="foods" />

      <div className="md:ml-60 flex-1">
        <header className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="text-gray-400 hover:text-gray-600 md:hidden"><ChevronLeft size={20} /></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Food Library</h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage foods for your clients</p>
            </div>
          </div>
          <Link href="/coach/foods/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-green-600/25 transition-all">
            <Plus size={16} /> Add Food
          </Link>
        </header>

        <main className="px-6 py-6">
          {/* Search + tabs */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search foods…"
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[['mine', 'My Foods'], ['system', 'System']].map(([t, l]) => (
                <button key={t} onClick={() => setTab(t as 'mine' | 'system')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : foods.length === 0 ? (
            <EmptyState emoji="🍽️" title={tab === 'mine' ? "No custom foods yet" : "No system foods found"}
              subtitle={tab === 'mine' ? "Add foods to your library for your clients." : ""}
              action={tab === 'mine' ? <Link href="/coach/foods/new" className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors"><Plus size={15} /> Add First Food</Link> : undefined} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {foods.map((food, idx) => (
                <div key={food.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx < foods.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <FoodImage src={food.image_url} alt={food.name} category={food.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{food.name}</p>
                    {food.brand && <p className="text-xs text-gray-400">{food.brand}</p>}
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      <span>{food.calories} cal</span>
                      <span className="text-purple-500">P: {food.protein}g</span>
                      <span className="text-amber-500">C: {food.carbs}g</span>
                      <span className="text-cyan-500">F: {food.fat}g</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${food.is_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {food.is_verified ? 'Verified' : food.source}
                    </span>
                    {tab === 'mine' && (
                      <button onClick={() => deleteFood(food.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function CoachSidebarSimple({ active }: { active: string }) {
  const router = useRouter()
  const supabase = createClient()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  const navItems = [
    { href: '/coach', label: 'Clients', icon: '👥' },
    { href: '/coach/foods', label: 'Food Library', icon: '🍽️' },
    { href: '/coach/templates', label: 'Templates', icon: '📋' },
  ]
  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#0d2318] min-h-screen fixed top-0 left-0 z-20">
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🌿</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">NutriCoach</p>
            <p className="text-green-400 text-xs mt-0.5">Coach Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active === item.label.toLowerCase().split(' ')[0] ? 'bg-green-500 text-white' : 'text-green-200/70 hover:text-white hover:bg-white/5'
            }`}>
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-6">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-200/50 hover:text-white hover:bg-white/5 text-sm font-medium">
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
