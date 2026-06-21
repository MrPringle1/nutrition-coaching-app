'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import type { ProgressLog } from '@/lib/types'

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

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single()
      if (!client) return
      setClientId(client.id)

      const { data: plan } = await supabase
        .from('meal_plans')
        .select('water_goal_oz')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (plan) setWaterGoal(plan.water_goal_oz)

      const { data } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('client_id', client.id)
        .order('logged_at', { ascending: false })
        .limit(30)
      setLogs(data || [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) return
    setSaving(true)

    const { data: newLog } = await supabase
      .from('progress_logs')
      .insert({
        client_id: clientId,
        weight: form.weight ? parseFloat(form.weight) : null,
        water_oz: form.water_oz ? parseInt(form.water_oz) : null,
        notes: form.notes || null,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newLog) setLogs(prev => [newLog, ...prev])
    setForm({ weight: '', water_oz: '', notes: '' })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  const latestWeight = logs.find(l => l.weight)?.weight
  const latestWater = logs.find(l => l.water_oz)?.water_oz

  return (
    <>
      <NavBar />
      <main className="md:ml-56 pb-24 md:pb-8 px-4 pt-4 max-w-2xl md:mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Progress Tracker</h1>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{latestWeight ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">lbs (latest)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{latestWater ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">oz water (latest)</p>
            <p className="text-xs text-gray-300">goal: {waterGoal} oz</p>
          </div>
        </div>

        {/* Log form */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Log Today</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="220"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Water (oz)</label>
                <input
                  type="number"
                  value={form.water_oz}
                  onChange={e => setForm(f => ({ ...f, water_oz: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="60"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="How are you feeling today?"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {success ? '✓ Logged!' : saving ? 'Saving…' : 'Save Today\'s Log'}
            </button>
          </form>
        </div>

        {/* History */}
        {logs.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">History</h2>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex gap-3 text-xs">
                      {log.weight && <span className="font-semibold text-gray-700">{log.weight} lbs</span>}
                      {log.water_oz && <span className="text-blue-500 font-medium">{log.water_oz} oz 💧</span>}
                    </div>
                  </div>
                  {log.notes && <p className="text-xs text-gray-500">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
