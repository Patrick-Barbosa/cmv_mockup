import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Info } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"

interface StatsCardProps {
  label: string
  description?: string
  value: string | number | ReactNode
  subtitle?: string
  icon?: ReactNode
  variant?: "default" | "highlight" | "muted" | "destructive"
  className?: string
}

export function StatsCard({
  label,
  description,
  value,
  subtitle,
  icon,
  variant = "default",
  className = "",
}: StatsCardProps) {
  const valueClass = {
    default: "text-brand-soft",
    highlight: "text-brand-highlight",
    muted: "text-brand-muted",
    destructive: "text-destructive",
  }[variant]

  return (
    <Card className={`bg-brand-surface-2 border-brand-line/20 shadow-none relative overflow-hidden group hover:border-brand-highlight/30 transition-colors ${className}`}>
      {(variant === "highlight" || variant === "destructive") && (
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${variant === "highlight" ? "bg-brand-highlight/5" : "bg-destructive/5"}`} />
      )}
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm uppercase tracking-wider font-medium text-brand-muted flex items-center gap-2">
            {icon}
            {label}
          </CardDescription>
          {description && (
            <Tooltip content={description}>
              <Info className="w-3.5 h-3.5 text-brand-muted/50 hover:text-brand-highlight transition-colors cursor-help" />
            </Tooltip>
          )}
        </div>
        <CardTitle className={`text-4xl font-semibold tracking-tight ${valueClass} mt-1`}>
          {value}
        </CardTitle>
      </CardHeader>
      {subtitle && (
        <CardContent className="relative z-10">
          <p className="text-brand-muted text-sm font-medium">{subtitle}</p>
        </CardContent>
      )}
    </Card>
  )
}

interface StatsSidebarProps {
  stats: {
    label: string
    value: string | number | ReactNode
    subtitle?: string
    variant?: "default" | "highlight" | "muted" | "destructive"
  }[]
  className?: string
  children?: ReactNode
}

export function StatsSidebar({ stats, className = "", children }: StatsSidebarProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          label={stat.label}
          value={stat.value}
          subtitle={stat.subtitle}
          variant={stat.variant}
        />
      ))}
      {children}
    </div>
  )
}
