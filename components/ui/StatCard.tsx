interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  accent?: string
  dark?: boolean
}

export default function StatCard({ label, value, sub, icon, accent = 'bg-green-100', dark = false }: StatCardProps) {
  if (dark) {
    return (
      <div className="bg-white/8 rounded-2xl p-4">
        {icon && <div className="mb-2 opacity-80">{icon}</div>}
        <p className="text-white font-bold text-2xl leading-none">{value}</p>
        <p className="text-green-300 text-xs font-semibold mt-1 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-white/50 text-[10px] mt-0.5">{sub}</p>}
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {icon && (
        <div className={`w-9 h-9 ${accent} rounded-xl flex items-center justify-center mb-3`}>
          {icon}
        </div>
      )}
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
