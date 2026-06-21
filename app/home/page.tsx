'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { Meal, MealPlan, Client, ProgressLog } from '@/lib/types'
import { Droplets, CheckCircle2, Circle, Flame, TrendingDown, Scale } from 'lucide-react'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MEAL_EMOJIS: Record<string, string> = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snack: '🍎',
}

const MOTIVATIONAL = [
  "Every meal you follow is a step toward your goal. You've got this!",
  "Consistency beats perfection. One day at a time.",
  "Your body is changing even when you can't see it yet.",
  "Fuel your body well and it will take you far.",
  "You're {lbs} lbs away from your goal — closer than yesterday!",
  "Small steps every day lead to big results. Keep going!",
]

function CalorieRing({ pct, goal }: { pct: number; calories: number; goal: number }) {
  const size = 130
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct / 100, 1) * circ

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg] absolute">
        <defs>
          <linearGradient id="homeCalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#homeCalGrad)" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-white font-black text-3xl leading-none">{goal}</p>
        <p className="text-emerald-300 text-[11px] font-semibold mt-1">cal goal</p>
      </div>
    </div>
  )
}

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = goal ? Math.min((current / goal) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/70 font-bold">{label}</span>
        <span className="text-white font-bold">{goal}g</span>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [clientData, setClientData] = useState<Client | null>(null)
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [todayLog, setTodayLog] = useState<ProgressLog | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [waterOz, setWaterOz] = useState(0)
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set())
  const [addingWater, setAddingWater] = useState(false)
  const [userName, setUserName] = useState('')
  const supabase = createClient()

  const todayDayNum = (new Date().getDay() === 0 ? 7 : new Date().getDay()) // Mon=1..Sun=7
  const todayName = DAY_NAMES[new Date().getDay()]
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile) setUserName(profile.full_name.split(' ')[0])

      const { data: client } = await supabase.from('clients').select('*').eq('profile_id', user.id).single()
      if (!client) { setLoading(false); return }
      setClientData(client)
      setClientId(client.id)

      const { data: planData } = await supabase.from('meal_plans').select('*').eq('client_id', client.id)
        .order('created_at', { ascending: false }).limit(1).single()

      if (planData) {
        setPlan(planData)
        const { data: meals } = await supabase.from('meals').select('*')
          .eq('meal_plan_id', planData.id).eq('day_number', todayDayNum).order('meal_number')
        setTodayMeals(meals || [])
      }

      // Today's log
      const todayStart = new Date(); todayStart.setHours(0,0,0,0)
      const { data: logs } = await supabase.from('progress_logs').select('*')
        .eq('client_id', client.id).gte('logged_at', todayStart.toISOString())
        .order('logged_at', { ascending: false }).limit(1)
      if (logs && logs[0]) {
        setTodayLog(logs[0])
        setWaterOz(logs[0].water_oz || 0)
      }

      // Load completed meals from localStorage
      const saved = localStorage.getItem(`done_${client.id}_${new Date().toDateString()}`)
      if (saved) setCompletedMeals(new Set(JSON.parse(saved)))

      setLoading(false)
    }
    load()
  }, [])

  async function addWater(oz: number) {
    if (!clientId) return
    setAddingWater(true)
    const newOz = waterOz + oz
    setWaterOz(newOz)

    if (todayLog) {
      await supabase.from('progress_logs').update({ water_oz: newOz }).eq('id', todayLog.id)
    } else {
      const { data } = await supabase.from('progress_logs').insert({
        client_id: clientId, water_oz: newOz, logged_at: new Date().toISOString()
      }).select().single()
      if (data) setTodayLog(data)
    }
    setAddingWater(false)
  }

  function toggleMeal(mealId: string) {
    if (!clientId) return
    setCompletedMeals(prev => {
      const next = new Set(prev)
      if (next.has(mealId)) next.delete(mealId)
      else next.add(mealId)
      localStorage.setItem(`done_${clientId}_${new Date().toDateString()}`, JSON.stringify([...next]))
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/40 font-medium">Setting up your day…</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <>
        <NavBar />
        <main className="md:ml-60 pb-28 flex items-center justify-center min-h-screen bg-[#0d1117]">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl">🥗</div>
            <p className="font-bold text-white text-lg">Your plan is on its way</p>
            <p className="text-sm text-white/40 mt-2">Your coach is setting up your personalized meal plan. Check back soon!</p>
          </div>
        </main>
      </>
    )
  }

  const waterGoal = plan.water_goal_oz || 64
  const waterPct = Math.min((waterOz / waterGoal) * 100, 100)
  const completedCount = todayMeals.filter(m => completedMeals.has(m.id)).length
  const lbsToGoal = clientData && clientData.current_weight && clientData.goal_weight
    ? (clientData.current_weight - clientData.goal_weight).toFixed(0)
    : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const tipIndex = Math.floor(new Date().getDate() % MOTIVATIONAL.length)
  const tip = lbsToGoal
    ? MOTIVATIONAL[tipIndex].replace('{lbs}', lbsToGoal)
    : MOTIVATIONAL[tipIndex]

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-[#0d1117]">
        {/* Dark hero */}
        <div className="bg-gradient-to-b from-[#0d1f14] to-[#0d1117] px-5 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-8 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl animate-orb-1 pointer-events-none" />
          <div className="relative flex items-start justify-between mb-6">
            <div>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.12em]">{todayName}, {dateStr}</p>
              <h1 className="text-white font-black text-3xl mt-1.5">{greeting},<br />{userName}! 👋</h1>
            </div>
            {lbsToGoal && (
              <div className="bg-white/10 backdrop-blur rounded-2xl px-3.5 py-2.5 text-center border border-white/10">
                <p className="text-white font-black text-xl">{lbsToGoal}</p>
                <p className="text-emerald-400 text-[10px] font-bold mt-0.5">lbs to goal</p>
              </div>
            )}
          </div>

          {/* Calorie ring + macros */}
          <div className="relative flex items-center gap-5">
            <CalorieRing pct={80} calories={plan.daily_calories} goal={plan.daily_calories} />
            <div className="flex-1 space-y-3">
              <MacroBar label="Protein" current={plan.daily_protein} goal={plan.daily_protein} color="bg-gradient-to-r from-purple-400 to-purple-600" />
              <MacroBar label="Carbs" current={plan.daily_carbs} goal={plan.daily_carbs} color="bg-gradient-to-r from-amber-400 to-amber-600" />
              <MacroBar label="Fat" current={plan.daily_fat} goal={plan.daily_fat} color="bg-gradient-to-r from-cyan-400 to-cyan-600" />
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Motivational tip */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl px-4 py-3 flex items-start gap-3 shadow-lg shadow-emerald-500/20">
            <span className="text-xl mt-0.5">💪</span>
            <p className="text-white text-sm font-medium leading-relaxed">{tip}</p>
          </div>

          {/* Water tracker */}
          <div className="rounded-2xl bg-[#161b22] border border-[#21262d] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
                  <Droplets size={17} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Water Intake</p>
                  <p className="text-xs text-white/40 font-medium">Goal: {waterGoal} oz per day</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-3xl text-blue-400 leading-none">{waterOz}<span className="text-sm font-medium text-white/40"> oz</span></p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${waterPct}%` }}
              />
            </div>

            {/* Quick-add buttons */}
            <div className="flex gap-2">
              {[8, 16, 24].map(oz => (
                <button
                  key={oz}
                  onClick={() => addWater(oz)}
                  disabled={addingWater}
                  className="flex-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  +{oz} oz
                </button>
              ))}
            </div>
            {waterPct >= 100 && (
              <p className="text-center text-blue-400 text-xs font-bold mt-2">Hydration goal reached! 💧</p>
            )}
          </div>

          {/* Today's meals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">Today&apos;s Meals</h2>
              <span className="text-xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">{completedCount}/{todayMeals.length} done</span>
            </div>

            {todayMeals.length === 0 ? (
              <div className="rounded-2xl bg-[#161b22] border border-[#21262d] p-8 text-center">
                <p className="text-white/40 text-sm font-medium">No meals scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayMeals.map(meal => {
                  const done = completedMeals.has(meal.id)
                  return (
                    <button
                      key={meal.id}
                      onClick={() => toggleMeal(meal.id)}
                      className={`w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all relative overflow-hidden border ${
                        done ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-[#161b22] border-[#21262d]'
                      }`}
                    >
                      {!done && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />}
                      {done
                        ? <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
                        : <Circle size={22} className="text-white/20 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-base">{MEAL_EMOJIS[meal.meal_label] || '🍽️'}</span>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-white/40">{meal.meal_label}</span>
                        </div>
                        <p className={`font-bold text-sm leading-tight ${done ? 'text-emerald-300 line-through' : 'text-white'}`}>
                          {meal.name}
                        </p>
                        <p className="text-xs text-white/40 font-medium mt-0.5">{meal.calories} kcal · {meal.protein}g protein</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="flex gap-1.5 text-[10px]">
                          <span className="bg-amber-500/15 text-amber-300 font-bold px-1.5 py-0.5 rounded-md">C {meal.carbs}g</span>
                          <span className="bg-cyan-500/15 text-cyan-300 font-bold px-1.5 py-0.5 rounded-md">F {meal.fat}g</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Weight progress card */}
          {clientData && clientData.current_weight && clientData.goal_weight && (
            <div className="rounded-2xl bg-[#161b22] border border-[#21262d] p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                  <Scale size={17} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Weight Journey</p>
                  <p className="text-xs text-white/40 font-medium">Keep logging to track your progress</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-center">
                  <p className="font-black text-2xl text-white">{clientData.current_weight}</p>
                  <p className="text-xs text-white/40 font-medium">Start (lbs)</p>
                </div>
                <div className="flex-1 mx-4">
                  <div className="relative h-2.5 bg-white/[0.06] rounded-full">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                      style={{ width: '5%' }}
                    />
                  </div>
                  <div className="flex items-center justify-center mt-1.5">
                    <TrendingDown size={12} className="text-emerald-400 mr-1" />
                    <span className="text-[10px] text-emerald-400 font-bold">{lbsToGoal} lbs to go</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-black text-2xl text-emerald-400">{clientData.goal_weight}</p>
                  <p className="text-xs text-white/40 font-medium">Goal (lbs)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
