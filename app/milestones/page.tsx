'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { Milestone } from '@/lib/types'
import { Trophy, CheckCircle2, Circle, Lock } from 'lucide-react'

const MILESTONE_ICONS: Record<string, string> = {
  weight: '⚖️', streak: '🔥', nutrition: '🥗', first_log: '📝', custom: '🏆',
}

const SYSTEM_MILESTONES = [
  { title: 'First Food Log', description: 'Log your first meal — the journey begins!', type: 'first_log', emoji: '📝' },
  { title: '3-Day Streak', description: 'Log food 3 days in a row', type: 'streak', emoji: '🔥' },
  { title: '7-Day Streak', description: 'Log food every day for a full week', type: 'streak', emoji: '🔥' },
  { title: 'Hit Protein Goal', description: 'Meet your protein target for the first time', type: 'nutrition', emoji: '💪' },
  { title: 'Hit Water Goal', description: 'Drink your daily water goal', type: 'nutrition', emoji: '💧' },
  { title: 'First Weigh-In', description: 'Log your weight for the first time', type: 'weight', emoji: '⚖️' },
  { title: 'Lost 5 lbs', description: 'Drop your first 5 pounds!', type: 'weight', emoji: '📉' },
  { title: 'Lost 10 lbs', description: 'Double digits — incredible progress!', type: 'weight', emoji: '🎉' },
  { title: 'Reached Goal Weight', description: 'You made it! Goal weight achieved!', type: 'weight', emoji: '🏆' },
]

export default function MilestonesPage() {
  const supabase = createClient()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
      if (!client) { setLoading(false); return }
      const { data } = await supabase.from('milestones').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      setMilestones(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner text="Loading milestones…" />

  const completed = milestones.filter(m => m.completed)
  const inProgress = milestones.filter(m => !m.completed)

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Achievements</p>
          <h1 className="text-white font-bold text-xl mb-4">Milestones</h1>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/8 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-2xl">{completed.length}</p>
              <p className="text-green-300 text-xs font-semibold">Completed</p>
            </div>
            <div className="bg-white/8 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-2xl">{inProgress.length}</p>
              <p className="text-green-300 text-xs font-semibold">In Progress</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Completed 🎉</p>
              <div className="space-y-2">
                {completed.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                      {MILESTONE_ICONS[m.milestone_type] ?? '🏆'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                      {m.completed_at && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          {new Date(m.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In progress */}
          {inProgress.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">In Progress</p>
              <div className="space-y-2">
                {inProgress.map(m => {
                  const pct = m.target_value && m.current_value ? Math.min((m.current_value / m.target_value) * 100, 100) : 0
                  return (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {MILESTONE_ICONS[m.milestone_type] ?? '🎯'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">{m.title}</p>
                          {m.description && <p className="text-xs text-gray-400">{m.description}</p>}
                        </div>
                        <Circle size={20} className="text-gray-300 flex-shrink-0" />
                      </div>
                      {m.target_value && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{m.current_value ?? 0} / {m.target_value}</span>
                            <span>{Math.round(pct)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* System milestone grid — locked ones */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">All Achievements</p>
            <div className="grid grid-cols-3 gap-3">
              {SYSTEM_MILESTONES.map(sm => {
                const unlocked = milestones.some(m => m.title === sm.title && m.completed)
                return (
                  <div key={sm.title} className={`bg-white rounded-2xl border p-3 text-center shadow-sm ${unlocked ? 'border-green-200' : 'border-gray-100 opacity-60'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2 ${unlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {unlocked ? sm.emoji : <Lock size={18} className="text-gray-400" />}
                    </div>
                    <p className="text-[10px] font-bold text-gray-700 leading-tight">{sm.title}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {milestones.length === 0 && (
            <EmptyState emoji="🏆" title="No milestones yet" subtitle="Keep logging meals and hitting your goals — your coach will add milestones as you progress!" />
          )}
        </div>
      </main>
    </>
  )
}
