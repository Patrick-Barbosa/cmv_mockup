export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 mt-4 text-xs text-brand-muted">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
        <span>Positivo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-brand-highlight" />
        <span>Negativo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-brand-muted" />
        <span>Neutro</span>
      </div>
    </div>
  )
}
