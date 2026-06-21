import type { RestaurantAd } from './types'
import { createClient } from './supabase'

export async function fetchActiveAds(placement: string): Promise<RestaurantAd[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('restaurant_ads')
    .select('*, restaurant:restaurant_partners(id, business_name, logo_url, business_type)')
    .eq('status', 'active')
    .eq('placement', placement)
    .lte('start_date', today)
    .gte('end_date', today)
    .limit(3)
  return (data ?? []) as RestaurantAd[]
}

export async function trackImpression(adId: string, userId: string) {
  const supabase = createClient()
  await supabase.from('restaurant_ad_events').insert({ ad_id: adId, user_id: userId, event_type: 'impression' })
  await supabase.rpc('increment_ad_impressions', { ad_id: adId }).then(() => null, () => null)
}

export async function trackClick(adId: string, userId: string) {
  const supabase = createClient()
  await supabase.from('restaurant_ad_events').insert({ ad_id: adId, user_id: userId, event_type: 'click' })
}
