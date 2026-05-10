import { ReactNode } from "react"
import { FadeUp } from "@/components/ui/fade-up"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  breadcrumb?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <FadeUp className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${className}`}>
      <div>
        {breadcrumb && (
          <p className="text-brand-muted text-[0.7rem] tracking-[0.28em] uppercase font-medium mb-2">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-brand-soft text-sm md:text-base mt-2 leading-relaxed max-w-lg">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </FadeUp>
  )
}

interface PageHeaderWithButtonProps extends Omit<PageHeaderProps, "actions"> {
  buttonText?: string
  buttonIcon?: ReactNode
  onButtonClick?: () => void
}

export function PageHeaderWithButton({
  buttonText,
  buttonIcon,
  onButtonClick,
  ...props
}: PageHeaderWithButtonProps) {
  return (
    <PageHeader
      {...props}
      actions={
        buttonText && (
          <Button
            onClick={onButtonClick}
            className="hidden sm:flex bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover shadow-sm"
          >
            {buttonIcon}
            {buttonText}
          </Button>
        )
      }
    />
  )
}