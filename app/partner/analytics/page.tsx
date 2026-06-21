'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TrendingUp, Eye, MousePointerClick, UtensilsCrossed } from 'lucide-react'

export default function PartnerAnalyticsPage() {
  const supabase = createClient()
  const [topItems, setTopItems] = useState<{ name: string; times_logged: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: r } = await supabase.from('restaurant_partners').select('id').eq('owner_profile_id', user.id).maybeSingle()
      if (!r) { setLoading(false); return }
      const { data } = await supabase
        .from('restaurant_menu_items')
        .select('name, times_logged')
        .eq('restaurant_id', r.id)
        .order('times_logged', { ascending: false })
        .limit(10)
      setTopItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const maxLogged = Math.max(...topItems.map(i => i.times_logged), 1)

  return (
    <div>
      <header className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">How clients are engaging with your menu</p>
      </header>

      <main className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ad Impressions', value: '—', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Ad Clicks', value: '—', icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Times Logged', value: topItems.reduce((s, i) => s + i.times_logged, 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center mb-2`}>
                  <Icon size={15} className={card.color} />
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{card.label}</p>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={16} className="text-green-600" />
            <h2 className="font-bold text-gray-900">Top Menu Items</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : topItems.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No data yet. Items will appear here once clients log them.</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.times_logged}×</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(item.times_logged / maxLogged) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
