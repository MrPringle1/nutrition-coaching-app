import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key configured' }, { status: 500 })
  }

  // Check if mehlayne user exists
  const searchRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  })
  const searchData = await searchRes.json()
  const users = searchData.users || []
  const existing = users.find((u: { email: string }) => u.email === 'mehlayne@client.com')

  if (existing) {
    // User exists — confirm email and reset password
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existing.id}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_confirm: true,
        password: 'PerfectFit2025!',
      }),
    })
    const updateData = await updateRes.json()
    return NextResponse.json({ action: 'updated', email: existing.email, confirmed: updateData.email_confirmed_at ? true : false })
  }

  // User doesn't exist — create them
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'mehlayne@client.com',
      password: 'PerfectFit2025!',
      email_confirm: true,
    }),
  })
  const createData = await createRes.json()

  if (createData.id) {
    // Create profile row
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: createData.id,
        email: 'mehlayne@client.com',
        full_name: 'Mehlayne',
        role: 'client',
        onboarding_complete: false,
      }),
    })
  }

  return NextResponse.json({ action: 'created', id: createData.id, email: 'mehlayne@client.com' })
}
