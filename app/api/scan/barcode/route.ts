import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { barcode } = await req.json()
  if (!barcode) return NextResponse.json({ error: 'Barcode required' }, { status: 400 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('foods').select('*').eq('barcode', barcode).eq('is_active', true).limit(5)
  if (data && data.length > 0) return NextResponse.json({ found: true, foods: data })
  return NextResponse.json({ found: false, foods: [], message: 'Food not found in database.' })
}
