import { NextRequest, NextResponse } from 'next/server'
import { buildMealPlanPrompt } from '@/lib/ai/prompts'
import { getDemoPlan } from '@/lib/ai/meal-generator'

export async function POST(req: NextRequest) {
  try {
    const params = await req.json()

    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ plan: getDemoPlan(params), demo: true })
    }

    const prompt = buildMealPlanPrompt(params)

    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) return NextResponse.json({ plan: JSON.parse(jsonMatch[0]) })
    }

    return NextResponse.json({ plan: getDemoPlan(params), demo: true })
  } catch (e) {
    console.error('Meal generation error:', e)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
