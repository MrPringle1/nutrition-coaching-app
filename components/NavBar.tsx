'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Home, BookOpen, ShoppingCart, TrendingUp, Target, Trophy, Settings, LogOut, Leaf, UtensilsCrossed, ScanLine, Sparkles, ChefHat, BarChart3 } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Today', icon: Home },
  { href: '/log', label: 'Log', icon: UtensilsCrossed },
  { href: '/plan', label: 'Plan', icon: BookOpen },
  { href: '/scan', label: 'Scan', icon: ScanLine },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

const moreLinks = [
  { href: '/meal-generator', label: 'Meal Generator', icon: Sparkles },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/grocery', label: 'Grocery', icon: ShoppingCart },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/milestones', label: 'Milestones', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0d1117] min-h-screen fixed top-0 left-0 z-20 border-r border-[#21262d]">
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-base leading-none">NutriCoach</p>
              <p className="text-emerald-400 text-xs mt-1">by Perfect Fit</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          <p className="px-4 text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">Main</p>
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? 'bg-emerald-500/15 border-l-2 border-emerald-500 text-emerald-400' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={17} />
                {label}
              </Link>
            )
          })}

          <div className="my-3 border-t border-[#21262d]" />

          <p className="px-4 text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase mb-2">More</p>
          {moreLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? 'bg-emerald-500/15 border-l-2 border-emerald-500 text-emerald-400' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-6 pt-3 border-t border-[#21262d]">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              <Leaf size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">My Account</p>
              <p className="text-white/30 text-[11px]">Signed in</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all">
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden bg-[#0d1117] border-b border-[#21262d] px-4 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/40">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-black text-white text-sm">NutriCoach</span>
        </div>
        <Link href="/settings" className="p-1.5 text-white/40 hover:text-white">
          <Settings size={18} />
        </Link>
      </header>

      {/* Mobile bottom nav — 5 main tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1117] border-t border-[#21262d] flex z-10 md:hidden pb-[env(safe-area-inset-bottom)]">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center pt-2.5 pb-3 gap-1 relative">
              {active && <span className="absolute top-1 w-1 h-1 rounded-full bg-emerald-400" />}
              <Icon size={18} className={active ? 'text-emerald-400' : 'text-white/30'} />
              <span className={`text-[10px] font-bold ${active ? 'text-emerald-400' : 'text-white/30'}`}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
