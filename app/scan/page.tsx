'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import FoodScanner from '@/components/FoodScanner'
import ScanResultPreview from '@/components/ScanResultPreview'
import type { Food } from '@/lib/types'

export default function ScanPage() {
  const router = useRouter()
  const [results, setResults] = useState<Food[]>([])

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Scan & Log</p>
          <h1 className="text-white font-bold text-2xl">Scan Food</h1>
          <p className="text-green-300/70 text-sm mt-1">Scan a barcode or snap a photo to find foods fast.</p>
        </div>

        <div className="px-4 pt-4 space-y-4">
          <FoodScanner onFoodFound={setResults} />
          {results.length > 0 && (
            <ScanResultPreview
              foods={results}
              onConfirm={() => router.push('/dashboard')}
              onManualSearch={() => router.push('/log')}
            />
          )}
        </div>
      </main>
    </>
  )
}
