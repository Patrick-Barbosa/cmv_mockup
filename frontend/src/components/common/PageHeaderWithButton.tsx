import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"
import type { ReactNode } from "react"

interface PageHeaderWithButtonProps {
  title: string
  description?: string
  breadcrumb?: string
  backTo?: string
  button?: {
    label: string
    onClick: () => void
  } | null
  buttonText?: string
  buttonIcon?: ReactNode
  onButtonClick?: () => void
}

export function PageHeaderWithButton({
  title,
  description,
  breadcrumb,
  backTo,
  button,
  buttonText,
  buttonIcon,
  onButtonClick,
}: PageHeaderWithButtonProps) {
  const actionButton = button || (buttonText && onButtonClick
    ? {
        label: (
          <span className="flex items-center">
            {buttonIcon}
            {buttonText}
          </span>
        ),
        onClick: onButtonClick,
      }
    : null)

  return (
    <div className="flex flex-col gap-1.5 mb-6">
      {breadcrumb && (
        <p className="text-sm text-brand-muted mb-1">{breadcrumb}</p>
      )}
      <div className="flex items-center gap-4">
        {backTo && (
          <Link
            to={backTo}
            className="p-2 hover:bg-brand-muted/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-brand-muted" />
          </Link>
        )}
        <h1 className="text-2xl font-semibold text-brand-dark">{title}</h1>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="ml-auto px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors text-sm font-medium"
          >
            {typeof actionButton.label === 'string' ? actionButton.label : actionButton.label}
          </button>
        )}
      </div>
      {description && (
        <p className="text-sm text-brand-muted ml-9">{description}</p>
      )}
    </div>
  )
}