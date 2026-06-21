'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { RestaurantPartner } from '@/lib/types'
import { BUSINESS_TYPE_EMOJIS } from '@/lib/restaurants'
import { UtensilsCrossed, Megaphone, Eye, MousePointerClick, TrendingUp, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  menuItems: number
  activeAds: number
  totalImpressions: number
  totalClicks: number
  timesLogged: number
}

export default function PartnerDashboard() {
  const supabase = createClient()
  const [restaurant, setRestaurant] = useState<RestaurantPartner | null>(null)
  const [stats, setStats] = useState<Stats>({ menuItems: 0, activeAds: 0, totalImpressions: 0, totalClicks: 0, timesLogged: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: r } = await supabase.from('restaurant_partners').select('*').eq('owner_profile_id', user.id).maybeSingle()
      if (r) {
        setRestaurant(r as RestaurantPartner)
        const [{ count: items }, { count: ads }, { data: loggedData }] = await Promise.all([
          supabase.from('restaurant_menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id),
          supabase.from('restaurant_ads').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id).eq('status', 'active'),
          supabase.from('restaurant_menu_items').select('times_logged').eq('restaurant_id', r.id),
        ])
        const totalLogged = (loggedData ?? []).reduce((s: number, i: { times_logged: number }) => s + (i.times_logged ?? 0), 0)
        setStats({ menuItems: items ?? 0, activeAds: ads ?? 0, totalImpressions: 0, totalClicks: 0, timesLogged: totalLogged })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>

  if (!restaurant) {
    return (
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Restaurant Found</h2>
        <p className="text-gray-400 text-sm mb-6">Your account isn&apos;t linked to a partner restaurant yet. Contact support to get set up.</p>
      </div>
    )
  }

  const emoji = BUSINESS_TYPE_EMOJIS[restaurant.business_type] ?? '🍽️'
  const statCards = [
    { label: 'Menu Items', value: stats.menuItems, icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Ads', value: stats.activeAds, icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Times Logged', value: stats.timesLogged, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Impressions', value: stats.totalImpressions, icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="bg-[#0d2318] px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl">{emoji}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{restaurant.business_name}</h1>
              {restaurant.is_verified && <CheckCircle2 size={16} className="text-green-400" />}
            </div>
            <p className="text-green-400 text-sm capitalize">{restaurant.business_type?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <main className="px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={18} className={card.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
              </div>
            )
          })}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/partner/menu/new"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
              <UtensilsCrossed size={16} className="text-green-600" />
              <span className="font-semibold text-green-700 text-sm">Add Menu Item</span>
            </Link>
            <Link href="/partner/ads"
              className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
              <Megaphone size={16} className="text-purple-600" />
              <span className="font-semibold text-purple-700 text-sm">Create Ad</span>
            </Link>
            <Link href="/partner/menu"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              <MousePointerClick size={16} className="text-blue-600" />
              <span className="font-semibold text-blue-700 text-sm">Manage Menu</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
