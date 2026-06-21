'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Leaf, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'coach') {
      router.push('/coach')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060a0f] px-6 py-12 relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute top-[-10%] right-[-8%] w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-[-12%] left-[-10%] w-[400px] h-[400px] bg-teal-400/6 rounded-full blur-[100px] animate-orb-2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-green-600/5 rounded-full blur-[80px] animate-orb-1 pointer-events-none" />

      {/* Rotating faint ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/5 rounded-full animate-spin-slow pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/60 animate-slideUp">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7 animate-scaleIn delay-100">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/50">
                <Leaf size={36} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white">NutriCoach</h1>
            <p className="text-emerald-400 text-sm font-semibold mt-0.5">by Perfect Fit</p>
            <p className="text-white/40 text-xs mt-2">Your body. Your data. Your results.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 animate-fadeInUp delay-300">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-400/30 rounded-xl px-4 py-3">
                <p className="text-rose-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-60 text-white font-bold rounded-xl py-4 text-sm transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 animate-fadeInUp delay-500"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-white/20 text-xs mt-6 animate-fadeIn delay-700">
            Trusted by coaches · Powered by AI nutrition science
          </p>
        </div>
      </div>
    </div>
  )
}
