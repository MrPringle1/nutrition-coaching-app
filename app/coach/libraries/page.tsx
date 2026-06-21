'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import type { FoodLibrary } from '@/lib/types'
import { ArrowLeft, Plus, Library, ChevronRight, X } from 'lucide-react'

interface LibraryWithCount extends FoodLibrary {
  itemCount: number
}

export default function CoachLibrariesPage() {
  const supabase = createClient()
  const [libraries, setLibraries] = useState<LibraryWithCount[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCoachId(user.id)
      const { data } = await supabase.from('food_libraries').select('*').eq('coach_id', user.id).order('created_at', { ascending: false })
      const libs = (data as FoodLibrary[]) ?? []
      const withCounts = await Promise.all(libs.map(async lib => {
        const { count } = await supabase.from('food_library_items').select('id', { count: 'exact', head: true }).eq('library_id', lib.id)
        return { ...lib, itemCount: count ?? 0 }
      }))
      setLibraries(withCounts)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createLibrary() {
    if (!coachId || !name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('food_libraries').insert({
      coach_id: coachId,
      name: name.trim(),
      description: description.trim() || null,
    }).select('*').single()
    if (data) setLibraries(prev => [{ ...(data as FoodLibrary), itemCount: 0 }, ...prev])
    setName(''); setDescription(''); setShowForm(false); setSaving(false)
  }

  if (loading) return <LoadingSpinner text="Loading food libraries…" />

  return (
    <main className="min-h-screen bg-gray-50 md:ml-60">
      <div className="bg-[#0d2318] px-5 pt-5 pb-6 flex items-center justify-between">
        <div>
          <Link href="/coach" className="flex items-center gap-2 text-green-300 text-sm mb-3 hover:text-white">
            <ArrowLeft size={16} /> Coach Dashboard
          </Link>
          <h1 className="text-white font-bold text-2xl">Food Libraries</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          <Plus size={16} /> New
        </button>
      </div>

      <div className="px-4 pt-4 space-y-3 max-w-2xl mx-auto">
        {libraries.length === 0 ? (
          <EmptyState emoji="📚" title="No libraries yet" subtitle="Group foods into reusable libraries for your clients."
            action={<button onClick={() => setShowForm(true)} className="bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">Create Library</button>} />
        ) : (
          libraries.map(lib => (
            <div key={lib.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Library size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{lib.name}</p>
                <p className="text-xs text-gray-400">{lib.itemCount} food{lib.itemCount !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">Manage <ChevronRight size={14} /></span>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">New Library</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Library name*"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button onClick={createLibrary} disabled={saving || !name.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
                Create Library
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
