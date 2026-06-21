'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { getMacroPercentage } from '@/lib/nutrition'
import { getWeekStart, getWeekDays, formatShortDate, toDateString } from '@/lib/date'
import type { WeeklyGoal, DailyFoodLog, LoggedFoodItem } from '@/lib/types'
import { Target, Droplets, Scale, Flame, CheckCircle2, XCircle } from 'lucide-react'

function GoalRing({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  )
}

interface DayCompliance {
  date: string
  logged: boolean
  calories: number
  protein: number
}

export default function GoalsPage() {
  const supabase = createClient()
  const [clientId, setClientId] = useState<string | null>(null)
  const [goal, setGoal] = useState<WeeklyGoal | null>(null)
  const [dayCompliance, setDayCompliance] = useState<DayCompliance[]>([])
  const [loading, setLoading] = useState(true)
  const weekStart = getWeekStart()
  const weekDays = getWeekDays(weekStart)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
      if (!client) { setLoading(false); return }
      setClientId(client.id)

      // Load weekly goal
      const { data: goalData } = await supabase.from('weekly_goals').select('*').eq('client_id', client.id)
        .gte('week_start', weekStart).order('created_at', { ascending: false }).limit(1).maybeSingle()
      setGoal(goalData)

      // Load daily logs for this week
      const { data: logs } = await supabase.from('daily_food_logs').select('id, log_date').eq('client_id', client.id)
        .in('log_date', weekDays)
      const logMap = Object.fromEntries((logs ?? []).map(l => [l.log_date, l.id]))

      const compliance: DayCompliance[] = []
      for (const day of weekDays) {
        let calories = 0, protein = 0
        if (logMap[day]) {
          const { data: itemData } = await supabase.from('logged_food_items')
            .select('calories, protein').eq('daily_log_id', logMap[day])
          calories = (itemData ?? []).reduce((s, i) => s + i.calories, 0)
          protein = (itemData ?? []).reduce((s, i) => s + i.protein, 0)
        }
        compliance.push({ date: day, logged: !!logMap[day] && calories > 0, calories, protein })
      }
      setDayCompliance(compliance)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner text="Loading your goals…" />

  const loggedDays = dayCompliance.filter(d => d.logged).length
  const compliancePct = Math.round((loggedDays / 7) * 100)
  const avgCals = loggedDays > 0 ? Math.round(dayCompliance.filter(d => d.logged).reduce((s, d) => s + d.calories, 0) / loggedDays) : 0
  const avgProtein = loggedDays > 0 ? Math.round(dayCompliance.filter(d => d.logged).reduce((s, d) => s + d.protein, 0) / loggedDays) : 0

  const today = toDateString()

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">This Week</p>
          <h1 className="text-white font-bold text-xl mb-4">Weekly Goals</h1>

          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <GoalRing pct={compliancePct} color="#22c55e" size={88} />
              <div className="absolute text-center">
                <p className="text-white font-bold text-lg leading-none">{compliancePct}%</p>
                <p className="text-green-300 text-[10px]">logged</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-white/8 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-green-300 text-xs font-semibold">Days Logged</span>
                <span className="text-white font-bold">{loggedDays}/7</span>
              </div>
              <div className="bg-white/8 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-green-300 text-xs font-semibold">Avg Calories</span>
                <span className="text-white font-bold">{avgCals}</span>
              </div>
              <div className="bg-white/8 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-green-300 text-xs font-semibold">Avg Protein</span>
                <span className="text-white font-bold">{avgProtein}g</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Day compliance strip */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Daily Compliance</p>
            <div className="grid grid-cols-7 gap-1.5">
              {dayCompliance.map((day, i) => {
                const isToday = day.date === today
                const isFuture = day.date > today
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {['M','T','W','T','F','S','S'][i]}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isToday ? 'ring-2 ring-green-500' : ''
                    } ${
                      isFuture ? 'bg-gray-100 text-gray-300' :
                      day.logged ? 'bg-green-500 text-white' : 'bg-red-100 text-red-400'
                    }`}>
                      {isFuture ? '·' : day.logged ? '✓' : '✗'}
                    </div>
                    <span className="text-[9px] text-gray-400">{formatShortDate(day.date).split(' ')[1]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly goal details */}
          {goal ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <p className="font-bold text-gray-900">This Week's Targets</p>

              {goal.calorie_goal && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Flame size={16} className="text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">Daily Calories</span>
                      <span className="text-gray-400">{avgCals} / {goal.calorie_goal}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${getMacroPercentage(avgCals, goal.calorie_goal)}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {goal.protein_goal && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target size={16} className="text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">Avg Protein</span>
                      <span className="text-gray-400">{avgProtein}g / {goal.protein_goal}g</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${getMacroPercentage(avgProtein, goal.protein_goal)}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {goal.water_goal_oz && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Droplets size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700 text-xs">Water Goal</p>
                    <p className="text-gray-400 text-xs">{goal.water_goal_oz} oz per day</p>
                  </div>
                </div>
              )}

              {goal.weight_goal && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                    <Scale size={16} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700 text-xs">Weight Target This Week</p>
                    <p className="text-gray-400 text-xs">{goal.weight_goal} lbs</p>
                  </div>
                </div>
              )}

              {goal.habit_goal && (
                <div className="bg-green-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">Weekly Habit Goal</p>
                  <p className="text-sm text-green-800">{goal.habit_goal}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState emoji="🎯" title="No weekly goal set" subtitle="Your coach will set your weekly targets soon." />
          )}
        </div>
      </main>
    </>
  )
}
