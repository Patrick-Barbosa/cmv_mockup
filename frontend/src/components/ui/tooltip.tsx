import * as React from "react"

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const [coords, setCoords] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }
  }

  React.useEffect(() => {
    if (open) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [open])

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div 
          style={{ 
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: 'translate(-50%, calc(-100% - 10px))',
            zIndex: 9999
          }}
          className="w-56 p-3 bg-brand-surface border border-brand-line/60 rounded-sm shadow-2xl text-xs text-brand-soft leading-snug text-center pointer-events-none animate-in fade-in zoom-in duration-150"
        >
          {content}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: 'hsl(var(--brand-surface)) transparent transparent transparent'
            }}
          />
        </div>
      )}
    </div>
  )
}
