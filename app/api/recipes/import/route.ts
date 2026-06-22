import { NextRequest, NextResponse } from 'next/server'

function parseISODuration(iso: string): number {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0')
}

function parseQuantity(str: string): { quantity: number; unit: string } {
  const s = str.trim()
  const match = s.match(/^([\d./\s½¼¾⅓⅔⅛]+)\s*([a-zA-Z]*)/)
  if (!match) return { quantity: 1, unit: 'unit' }
  let qty = match[1].trim()
  // Handle fractions like "1/2", "1 1/2"
  const fractionMap: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667, '⅛': 0.125 }
  for (const [sym, val] of Object.entries(fractionMap)) {
    qty = qty.replace(sym, String(val))
  }
  if (qty.includes('/')) {
    const parts = qty.trim().split(/\s+/)
    let total = 0
    for (const p of parts) {
      if (p.includes('/')) {
        const [n, d] = p.split('/')
        total += parseFloat(n) / parseFloat(d)
      } else {
        total += parseFloat(p) || 0
      }
    }
    return { quantity: Math.round(total * 100) / 100, unit: match[2] || 'unit' }
  }
  return { quantity: parseFloat(qty) || 1, unit: match[2] || 'unit' }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRecipeFromJsonLd(jsonld: any): any {
  // Handle arrays of JSON-LD blocks
  const items = Array.isArray(jsonld) ? jsonld : [jsonld]
  for (const item of items) {
    const type = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
    if (type.some((t: string) => t === 'Recipe' || t === 'schema:Recipe')) return item
    // Check @graph
    if (item['@graph']) {
      const found = extractRecipeFromJsonLd(item['@graph'])
      if (found) return found
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url?.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Could not fetch that page (status ${res.status}). The site may be blocking imports.` }, { status: 422 })
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('html')) {
      return NextResponse.json({ error: 'That URL does not point to a recipe page.' }, { status: 422 })
    }

    const html = await res.text()

    // Extract all JSON-LD blocks
    const jsonLdMatches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    let recipe = null
    for (const m of jsonLdMatches) {
      try {
        const parsed = JSON.parse(m[1])
        const found = extractRecipeFromJsonLd(parsed)
        if (found) { recipe = found; break }
      } catch { /* skip malformed blocks */ }
    }

    // Detect Cloudflare challenge page
    if (html.includes('cf-browser-verification') || html.includes('_cf_chl_opt') || html.includes('Enable JavaScript and cookies')) {
      return NextResponse.json({
        error: "This site (e.g. AllRecipes, Food Network) blocks automated access. Try a food blog URL instead — sites like therecipecritic.com, damndelicious.net, or pinchofyum.com work great."
      }, { status: 422 })
    }

    if (!recipe) {
      return NextResponse.json({
        error: "No recipe data found on that page. Try a food blog or a site like BBC Good Food, Tasty, or Simply Recipes."
      }, { status: 422 })
    }

    const name = recipe.name || 'Imported Recipe'
    const description = recipe.description || ''
    const servings = parseInt(
      typeof recipe.recipeYield === 'string'
        ? recipe.recipeYield.replace(/\D.*/, '')
        : Array.isArray(recipe.recipeYield)
        ? String(recipe.recipeYield[0]).replace(/\D.*/, '')
        : String(recipe.recipeYield || '1')
    ) || 1
    const prepTimeMin = parseISODuration(recipe.prepTime || '')
    const cookTimeMin = parseISODuration(recipe.cookTime || '')
    const totalTimeMin = parseISODuration(recipe.totalTime || '') || (prepTimeMin + cookTimeMin) || 0

    // Parse ingredients
    const rawIngredients: string[] = Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient
      : []

    const ingredients = rawIngredients.map((raw: string) => {
      const { quantity, unit } = parseQuantity(raw)
      // Strip the leading quantity/unit to get the food name
      const foodName = raw
        .replace(/^[\d./\s½¼¾⅓⅔⅛]+/, '')
        .replace(/^(cups?|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|cloves?|slices?|pieces?|cans?|pkg|packages?)\s*/i, '')
        .replace(/\s*,.*$/, '')
        .trim() || raw.trim()

      return {
        food_name: foodName,
        quantity,
        serving_unit: unit || 'unit',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    })

    // Try to extract nutrition if available
    let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    if (recipe.nutrition) {
      const n = recipe.nutrition
      nutrition = {
        calories: parseFloat(String(n.calories || '0').replace(/\D.*/, '')) || 0,
        protein: parseFloat(String(n.proteinContent || '0')) || 0,
        carbs: parseFloat(String(n.carbohydrateContent || '0')) || 0,
        fat: parseFloat(String(n.fatContent || '0')) || 0,
      }
    }

    return NextResponse.json({
      success: true,
      recipe: {
        name,
        description,
        servings,
        prepTimeMin,
        totalTimeMin,
        ingredients: ingredients.length > 0 ? ingredients : [{ food_name: '', quantity: 1, serving_unit: 'unit', calories: 0, protein: 0, carbs: 0, fat: 0 }],
        nutrition,
        sourceUrl: url,
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'The page took too long to load. Try a different URL.' }, { status: 422 })
    }
    return NextResponse.json({ error: 'Could not import that recipe. Try a different URL.' }, { status: 422 })
  }
}
