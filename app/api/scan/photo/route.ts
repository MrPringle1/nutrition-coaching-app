import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ message: 'Photo scanning requires AI vision setup.', suggestions: [], demo: true })
}
