import { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface CRUDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSave: () => void
  saving?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
  saveText?: string
  cancelText?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
}

const widthMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
}

export function CRUDDialog({
  open,
  onOpenChange,
  title,
  onSave,
  saving = false,
  disabled = false,
  children,
  className = "",
  saveText = "Salvar",
  cancelText = "Cancelar",
  maxWidth = "2xl",
}: CRUDDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen || !saving) {
      onOpenChange(isOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${widthMap[maxWidth]} bg-brand-surface-2 border-brand-line/20 p-6 md:p-8 ${className}`}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-brand-text font-medium text-lg">
            {title}
          </DialogTitle>
        </DialogHeader>

        {children}

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-brand-muted hover:text-brand-soft"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onSave}
            disabled={disabled || saving}
            className="bg-brand-primary text-brand-button-text hover:bg-brand-primary-hover"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {saveText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}