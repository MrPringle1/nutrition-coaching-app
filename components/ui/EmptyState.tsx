interface EmptyStateProps {
  emoji?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function EmptyState({ emoji = '📭', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl">
        {emoji}
      </div>
      <p className="font-bold text-gray-800 text-base">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
