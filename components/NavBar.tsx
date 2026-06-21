'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UtensilsCrossed, ShoppingCart, TrendingUp, LogOut } from 'lucide-react'

const links = [
  { href: '/plan', label: 'My Plan', icon: UtensilsCrossed },
  { href: '/grocery', label: 'Grocery', icon: ShoppingCart },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥗</span>
          <span className="font-bold text-gray-900 text-sm">Nutrition Coaching</span>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Side nav (desktop) */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen fixed top-0 left-0 pt-16 px-3 gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </aside>
    </>
  )
}
