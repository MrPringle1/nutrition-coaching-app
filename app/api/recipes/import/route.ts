import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { url } = await req.json()
  return NextResponse.json({ message: 'URL recipe import coming soon. Please add recipes manually.', url, manual_entry_available: true })
}
