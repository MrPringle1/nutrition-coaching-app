'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { RestaurantAd } from '@/lib/types'
import { BUSINESS_TYPE_EMOJIS } from '@/lib/restaurants'
import { ExternalLink, X } from 'lucide-react'

interface Props {
  placement: string
}

export default function RestaurantAdCard({ placement }: Props) {
  const supabase = createClient()
  const [ad, setAd] = useState<RestaurantAd | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('restaurant_ads')
        .select('*, restaurant:restaurant_partners(id, business_name, logo_url, business_type)')
        .eq('status', 'active')
        .eq('placement', placement)
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(1)
        .maybeSingle()
      if (data) setAd(data as RestaurantAd)
    }
    load()
  }, [placement])

  if (!ad || dismissed) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restaurant = (ad as any).restaurant
  const emoji = BUSINESS_TYPE_EMOJIS[restaurant?.business_type ?? 'restaurant'] ?? '🍽️'

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-500"
      >
        <X size={13} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 text-xl">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Sponsored</span>
          </div>
          <p className="font-bold text-gray-900 text-sm leading-tight">{ad.title}</p>
          {ad.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{ad.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-semibold text-gray-500">{restaurant?.business_name}</span>
          </div>
        </div>
      </div>

      <button className="mt-3 w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
        {ad.call_to_action} <ExternalLink size={11} />
      </button>
    </div>
  )
}
