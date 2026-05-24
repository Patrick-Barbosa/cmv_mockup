import React from "react"

interface PageHeaderProps {
  breadcrumb?: string
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ breadcrumb, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <p className="text-brand-muted text-[0.75rem] tracking-[0.28em] uppercase font-medium mb-2">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">{title}</h1>
        {description && (
          <p className="text-brand-soft text-base mt-2 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}
