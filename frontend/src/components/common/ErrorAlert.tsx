import { AlertCircle } from "lucide-react"

interface ErrorAlertProps {
  error: string | null
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({ error, onDismiss, className = "" }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className={`mb-6 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 flex items-center gap-2 ${className}`}>
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <p className="text-red-400 text-xs">{error}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-red-400 hover:text-red-300 text-xs"
        >
          ×
        </button>
      )}
    </div>
  )
}