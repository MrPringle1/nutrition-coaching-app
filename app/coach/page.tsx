'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, LogOut, Plus } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥗</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">Coach Dashboard</p>
            <p className="text-xs text-gray-400 mt-0.5">{coachName}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
          <LogOut size={18} />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="bg-green-600 rounded-2xl p-4 text-white mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-sm opacity-80">Active Clients</p>
            </div>
          </div>
        </div>

        {/* Client list */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Your Clients</h2>
          <Link
            href="/coach/clients/new"
            className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={14} />
            Add Client
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">👤</p>
            <p className="font-semibold text-gray-600">No clients yet</p>
            <p className="text-sm mt-1">Add your first client to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map(client => (
              <Link
                key={client.id}
                href={`/coach/clients/${client.id}`}
                className="block bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      {client.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{client.full_name}</p>
                      <p className="text-xs text-gray-400">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {client.current_weight && <p>{client.current_weight} lbs</p>}
                    {client.goal_weight && <p className="text-green-600">Goal: {client.goal_weight} lbs</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
