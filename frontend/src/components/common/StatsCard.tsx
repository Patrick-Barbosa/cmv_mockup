import type { ReactNode } from "react"

interface StatsCardProps {
  label: string
  value: string | number | ReactNode
  subtitle?: string
  icon?: ReactNode
  variant?: "default" | "highlight" | "muted"
  className?: string
}

export function StatsCard({
  label,
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
  }[variant]

  return (
    <div className={`bg-brand-surface-2 border border-brand-line/20 rounded-[2px] p-5 ${className}`}>
      <p className="text-brand-muted text-[0.7rem] tracking-[0.12em] uppercase font-medium mb-3 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className={`text-3xl font-light tabular-nums ${valueClass}`}>{value}</p>
      {subtitle && <p className="text-brand-muted text-xs mt-1">{subtitle}</p>}
    </div>
  )
}

interface StatsSidebarProps {
  stats: {
    label: string
    value: string | number | ReactNode
    subtitle?: string
    variant?: "default" | "highlight" | "muted"
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