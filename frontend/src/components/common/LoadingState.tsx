import { Loader2, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "empty"
  message?: string
  icon?: React.ReactNode
  className?: string
}

export function LoadingState({
  type = "spinner",
  message = "Carregando...",
  icon,
  className = "",
}: LoadingStateProps) {
  if (type === "skeleton") {
    return (
      <div className={`flex items-center justify-center py-16 gap-2 text-brand-muted ${className}`}>
        <Skeleton className="h-8 w-8 rounded-full" />
        <span className="text-sm">{message}</span>
      </div>
    )
  }

  if (type === "empty") {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
        {icon || <AlertCircle className="w-10 h-10 text-brand-highlight opacity-30 mb-5" />}
        <p className="text-brand-soft text-sm font-medium mb-1 text-center">{message}</p>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center py-16 gap-2 text-brand-muted ${className}`}>
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

interface CardSkeletonsProps {
  count?: number
  className?: string
}

export function CardSkeletons({ count = 4, className = "" }: CardSkeletonsProps) {
  return (
    <div className={`grid md:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-sm" />
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}