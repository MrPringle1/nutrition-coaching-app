'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, UtensilsCrossed, Megaphone, BarChart2, Settings, LogOut } from 'lucide-react'

const NAV = [
  { href: '/partner', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/partner/ads', label: 'Ads', icon: Megaphone },
  { href: '/partner/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/partner/settings', label: 'Settings', icon: Settings },
]

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setLoading(false)
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0d2318] min-h-screen fixed top-0 left-0 z-20">
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center text-white text-lg">🍽️</div>
            <div>
              <p className="font-bold text-white text-base leading-none">NutriCoach</p>
              <p className="text-green-400 text-xs mt-0.5">Partner Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/partner' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-green-500 text-white' : 'text-green-200/70 hover:text-white hover:bg-white/5'}`}>
                <Icon size={16} /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-6">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-200/50 hover:text-white hover:bg-white/5 text-sm font-medium">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex">
        {NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/partner' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? 'text-green-600' : 'text-gray-400'}`}>
              <Icon size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="md:ml-60 flex-1 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
