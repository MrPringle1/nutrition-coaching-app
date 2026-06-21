'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import ReportsChart from '@/components/ReportsChart'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { buildProgressReport, buildNutritionReport, type ReportData } from '@/lib/reports'
import type { ProgressLog } from '@/lib/types'

type Tab = 'progress' | 'nutrition'
type Range = 7 | 30 | 90

export default function ReportsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('progress')
  const [range, setRange] = useState<Range>(30)
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nutritionRows, setNutritionRows] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
      if (!client) { setLoading(false); return }
      setClientId(client.id)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!clientId) return
    async function load() {
      setLoading(true)
      const since = new Date()
      since.setDate(since.getDate() - range)
      const sinceIso = since.toISOString()

      const { data: progress } = await supabase.from('progress_logs').select('*')
        .eq('client_id', clientId!).gte('logged_at', sinceIso).order('logged_at', { ascending: true })
      setProgressLogs((progress as ProgressLog[]) ?? [])

      const { data: reports } = await supabase.from('nutrition_reports').select('*')
        .eq('client_id', clientId!).gte('report_date', sinceIso.split('T')[0]).order('report_date', { ascending: true })
      setNutritionRows(reports ?? [])

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, range])

  const weightReport: ReportData = buildProgressReport(progressLogs, 'weight', 'Weight', 'lbs')
  const waterReport: ReportData = buildProgressReport(progressLogs, 'water_oz', 'Water Intake', 'oz')
  const caloriesReport: ReportData = buildNutritionReport(nutritionRows, 'total_calories', 'Calories', 'cal')
  const proteinReport: ReportData = buildNutritionReport(nutritionRows, 'total_protein', 'Protein', 'g')

  if (loading) return <LoadingSpinner text="Building your reports…" />

  return (
    <>
      <NavBar />
      <main className="md:ml-60 pb-28 md:pb-10 min-h-screen bg-gray-50">
        <div className="bg-[#0d2318] px-5 pt-5 pb-6">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mb-1">Insights</p>
          <h1 className="text-white font-bold text-2xl">Reports</h1>
        </div>

        <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1">
              {(['progress', 'nutrition'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-green-600 text-white' : 'text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1">
              {([7, 30, 90] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${range === r ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>
                  {r}d
                </button>
              ))}
            </div>
          </div>

          {tab === 'progress' ? (
            <>
              <ReportsChart data={weightReport.data} label="Weight" unit="lbs" color="#22c55e" />
              <ReportsChart data={waterReport.data} label="Water Intake" unit="oz" color="#3b82f6" />
            </>
          ) : (
            <>
              <ReportsChart data={caloriesReport.data} label="Calories" unit="cal" color="#f59e0b" />
              <ReportsChart data={proteinReport.data} label="Protein" unit="g" color="#a855f7" />
            </>
          )}
        </div>
      </main>
    </>
  )
}
