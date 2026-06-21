'use client'

import { useState } from 'react'
import type { Food } from '@/lib/types'
import { InlineSpinner } from './ui/LoadingSpinner'
import { Barcode, Camera, Search } from 'lucide-react'

interface Props {
  onFoodFound: (foods: Food[]) => void
}

export default function FoodScanner({ onFoodFound }: Props) {
  const [tab, setTab] = useState<'barcode' | 'photo'>('barcode')
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  async function searchBarcode() {
    if (!barcode.trim()) return
    setLoading(true); setMessage('')
    try {
      const res = await fetch('/api/scan/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode.trim() }),
      })
      const data = await res.json()
      if (data.found && data.foods?.length) {
        onFoodFound(data.foods)
      } else {
        setMessage(data.message || 'No food found for that barcode.')
      }
    } catch {
      setMessage('Scan failed. Try again.')
    }
    setLoading(false)
  }

  async function uploadPhoto() {
    setLoading(true); setMessage('')
    try {
      const res = await fetch('/api/scan/photo', { method: 'POST' })
      const data = await res.json()
      setMessage(data.message || 'Photo scanning is not available yet.')
      onFoodFound(data.suggestions || [])
    } catch {
      setMessage('Upload failed. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {([['barcode', 'Barcode', Barcode], ['photo', 'Photo', Camera]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => { setTab(t); setMessage('') }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${tab === t ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'barcode' ? (
          <div className="space-y-3">
            <div className="relative">
              <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Enter UPC / EAN barcode…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={searchBarcode} disabled={loading || !barcode.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <InlineSpinner /> : <><Search size={15} /> Search Barcode</>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-center cursor-pointer hover:border-green-300 transition-colors">
              <Camera size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{photo ? photo.name : 'Tap to take or upload a photo'}</p>
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={uploadPhoto} disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <InlineSpinner /> : 'Analyze Photo'}
            </button>
          </div>
        )}

        {message && <p className="text-center text-sm text-gray-500 mt-4">{message}</p>}
      </div>
    </div>
  )
}
