'use client'

interface Props {
  selected: string
  onChange: (slug: string) => void
}

const DIET_STYLES = [
  { slug: 'carnivore', name: 'Carnivore', emoji: '🥩', desc: 'Animal products only' },
  { slug: 'keto', name: 'Keto', emoji: '🥑', desc: 'Very low carb, high fat' },
  { slug: 'low-carb', name: 'Low-Carb', emoji: '🍖', desc: 'Reduced carbs' },
  { slug: 'paleo', name: 'Paleo', emoji: '🌿', desc: 'Whole unprocessed foods' },
  { slug: 'mediterranean', name: 'Mediterranean', emoji: '🫒', desc: 'Olive oil, fish, veg' },
  { slug: 'high-protein', name: 'High-Protein', emoji: '💪', desc: 'Muscle & fat loss' },
  { slug: 'balanced', name: 'Balanced', emoji: '⚖️', desc: 'Standard macros' },
  { slug: 'vegetarian', name: 'Vegetarian', emoji: '🥦', desc: 'No meat or fish' },
  { slug: 'vegan', name: 'Vegan', emoji: '🌱', desc: 'No animal products' },
  { slug: 'low-fat', name: 'Low-Fat', emoji: '❤️', desc: 'Heart health focus' },
]

export default function DietStyleSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
      {DIET_STYLES.map(d => {
        const active = selected === d.slug
        return (
          <button key={d.slug} type="button" onClick={() => onChange(d.slug)}
            className={`text-left p-3 rounded-xl border transition-all ${active ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className="text-xl mb-1">{d.emoji}</div>
            <p className={`font-semibold text-xs ${active ? 'text-green-700' : 'text-gray-900'}`}>{d.name}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{d.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
