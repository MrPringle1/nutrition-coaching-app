interface MacroRingProps {
  value: number
  max: number
  color?: string
  size?: number
  label?: string
  sublabel?: string
  animate?: boolean
}

export default function MacroRing({ value, max, color = '#10b981', size = 80, label, sublabel, animate = true }: MacroRingProps) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const fill = pct * circ

  const gradId = `ring-grad-${color.replace('#', '')}-${size}`

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute rotate-[-90deg]">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${gradId})`} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={animate ? { transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' } : {}}
        />
      </svg>
      <div className="relative z-10 text-center">
        {label && <p className="font-black text-white leading-none" style={{ fontSize: size > 100 ? 24 : size > 70 ? 18 : 13 }}>{label}</p>}
        {sublabel && <p className="text-white/40 font-medium leading-none mt-0.5" style={{ fontSize: size > 100 ? 11 : 9 }}>{sublabel}</p>}
      </div>
    </div>
  )
}
