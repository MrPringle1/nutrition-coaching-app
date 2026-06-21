'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { ProgressLog } from '@/lib/types'
import { Scale, Droplets, TrendingDown, CheckCircle2, TrendingUp } from 'lucide-react'

function WeightChart({ logs }: { logs: ProgressLog[] }) {
  const weightLogs = logs.filter(l => l.weight).slice(0, 14).reverse()
  if (weightLogs.length < 2) return (
    <div className="flex items-center justify-center h-28 text-gray-300 text-sm">
      Log at least 2 weights to see your chart
    </div>
  )

  const weights = weightLogs.map(l => l.weight!)
  const minW = Math.min(...weights) - 2
  const maxW = Math.max(...weights) + 2
  const range = maxW - minW

  const W = 280, H = 100
  const pts = weights.map((w, i) => {
    const x = (i / (weights.length - 1)) * W
    const y = H - ((w - minW) / range) * H
    return `${x},${y}`
  }).join(' ')

  const fillPts = `0,${H} ${pts} ${W},${H}`

  return (
    <div className="overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#weightGrad)" />
        <polyline points={pts} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {weights.map((w, i) => {
          const x = (i / (weights.length - 1)) * W
          const y = H - ((w - minW) / range) * H
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#22c55e" stroke="white" strokeWidth="1.5" />
        })}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">{new Date(weightLogs[0].logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span className="text-[10px] text-gray-400">{new Date(weightLogs[weightLogs.length - 1].logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [waterGoal, setWaterGoal] = useState(60)
  const [form, setForm] = useState({ weight: '', water_oz: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
      if (!client) return
      setClientId(client.id)

      const { data: plan } = await supabase.from('meal_plans').select('water_goal_oz')
        .eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single()
      if (plan) setWaterGoal(plan.water_goal_oz)

      const { data } = await supabase.from('progress_logs').select('*')
        .eq('client_id', client.id).order('logged_at', { ascending: false }).limit(30)
      setLogs(data || [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) return
    setSaving(true)

    const { data: newLog } = await supabase.from('progress_logs').insert({
      client_id: clientId,
      weight: form.weight ? parseFloat(form.weight) : null,
      water_oz: form.water_oz ? parseInt(form.water_oz) : null,
      notes: form.notes || null,
      logged_at: new Date().toISOString(),
    }).select().single()

    if (newLog) setLogs(prev => [newLog, ...prev])
    setForm({ weight: '', water_oz: '', notes: '' })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  const weightLogs = logs.filter(l => l.weight)
  const latestWeight = weightLogs[0]?.weight
  const prevWeight = weightLogs[1]?.weight
  const latestWater = logs.find(l => l.water_oz)?.water_oz
  const weightChange = latestWeight && prevWeight ? latestWeight - prevWeight : null
  const waterPct = latestWater ? Math.min((latestWater / waterGoal) * 100, 100) : 0

  const totalLost = weightLogs.length >= 2
    ? (weightLogs[weightLogs.length - 1].weight! - weightLogs[0].weight!)
    : null

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">My Progress</p>
          <h1 className="text-white font-bold text-xl mb-4">Track Your Journey</h1>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/8 rounded-2xl p-3 text-center">
              <Scale size={16} className="text-green-400 mx-auto mb-1" />
              <p className="text-white font-bold text-xl">{latestWeight ?? '—'}</p>
              <p className="text-green-300 text-[10px] font-semibold">CURRENT LBS</p>
            </div>
            <div className="bg-white/8 rounded-2xl p-3 text-center">
              {weightChange !== null ? (
                weightChange < 0
                  ? <TrendingDown size={16} className="text-green-400 mx-auto mb-1" />
                  : <TrendingUp size={16} className="text-amber-400 mx-auto mb-1" />
              ) : (
                <TrendingDown size={16} className="text-gray-500 mx-auto mb-1" />
              )}
              <p className={`font-bold text-xl ${weightChange !== null ? (weightChange < 0 ? 'text-green-400' : 'text-amber-400') : 'text-white'}`}>
                {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '—'}
              </p>
              <p className="text-green-300 text-[10px] font-semibold">LAST CHANGE</p>
            </div>
            <div className="bg-white/8 rounded-2xl p-3 text-center">
              <Droplets size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-blue-300 font-bold text-xl">{latestWater ?? '—'}</p>
              <p className="text-green-300 text-[10px] font-semibold">OZ WATER</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Weight chart */}
          {weightLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-sm">Weight Trend</h2>
                {totalLost !== null && totalLost < 0 && (
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
                    -{Math.abs(totalLost).toFixed(1)} lbs lost 🎉
                  </span>
                )}
              </div>
              <WeightChart logs={logs} />
            </div>
          )}

          {/* Water progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Droplets size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Hydration</p>
                  <p className="text-xs text-gray-400">Goal: {waterGoal} oz/day</p>
                </div>
              </div>
              <span className="text-blue-500 font-bold">{Math.round(waterPct)}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${waterPct}%` }} />
            </div>
          </div>

          {/* Log form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900">Log Today</h2>
              <p className="text-xs text-gray-400 mt-0.5">Record your daily check-in</p>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Weight (lbs)</label>
                  <div className="relative">
                    <Scale size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="number" step="0.1" value={form.weight}
                      onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="220"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Water (oz)</label>
                  <div className="relative">
                    <Droplets size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="number" value={form.water_oz}
                      onChange={e => setForm(f => ({ ...f, water_oz: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="How are you feeling today?"
                />
              </div>
              <button
                type="submit" disabled={saving}
                className={`w-full font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  success ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/25 disabled:opacity-60'
                }`}
              >
                {success ? <><CheckCircle2 size={16} /> Logged!</> : saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : "Save Today's Log"
                }
              </button>
            </form>
          </div>

          {/* History */}
          {logs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">History</p>
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-gray-400">
                          {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                        <div className="flex gap-3 text-xs">
                          {log.weight && <span className="font-bold text-gray-800">{log.weight} lbs</span>}
                          {log.water_oz && <span className="text-blue-500 font-semibold">{log.water_oz} oz 💧</span>}
                        </div>
                      </div>
                      {log.notes && <p className="text-xs text-gray-500 leading-relaxed">{log.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
