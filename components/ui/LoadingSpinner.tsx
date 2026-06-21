export default function LoadingSpinner({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{text}</p>
      </div>
    </div>
  )
}

export function InlineSpinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="border-2 border-current border-t-transparent rounded-full animate-spin inline-block opacity-70"
      style={{ width: size, height: size }}
    />
  )
}
