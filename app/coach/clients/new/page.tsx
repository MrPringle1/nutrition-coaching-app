'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    age: '',
    height: '',
    current_weight: '',
    goal_weight: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: { user: coach } } = await supabase.auth.getUser()
    if (!coach) { setError('Not authenticated'); setSaving(false); return }

    // Create auth account for client
    const { data: newUser, error: signUpError } = await supabase.auth.admin
      ? { data: null, error: { message: 'Use service role for admin' } }
      : { data: null, error: null }

    // Since we can't use admin on client side, we insert client record
    // The client will receive an invite or set their own password via magic link
    // For now, create the profile and client rows directly
    const { data: clientRow, error: clientError } = await supabase
      .from('clients')
      .insert({
        coach_id: coach.id,
        profile_id: null,
        full_name: form.full_name,
        email: form.email,
        age: form.age ? parseInt(form.age) : null,
        height: form.height || null,
        current_weight: form.current_weight ? parseFloat(form.current_weight) : null,
        goal_weight: form.goal_weight ? parseFloat(form.goal_weight) : null,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (clientError) {
      setError(clientError.message)
      setSaving(false)
      return
    }

    router.push(`/coach/clients/${clientRow.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/coach" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-gray-900">Add New Client</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Info</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => update('full_name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="MehLayne Smith" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="client@email.com" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Body Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Age</label>
                <input type="number" value={form.age} onChange={e => update('age', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="31" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input value={form.height} onChange={e => update('height', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5'1&quot;" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Current Weight (lbs)</label>
                <input type="number" step="0.1" value={form.current_weight} onChange={e => update('current_weight', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="220" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Goal Weight (lbs)</label>
                <input type="number" step="0.1" value={form.goal_weight} onChange={e => update('goal_weight', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="140" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes</h2>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Gluten-sensitive, no pork, prefers minimal cooking…" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
            {saving ? 'Creating…' : 'Create Client'}
          </button>
        </form>
      </main>
    </div>
  )
}
