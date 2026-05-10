export function ChartLegend() {
  return (
    <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-brand-muted">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-brand-primary" />
        <span>Custo Base / CMV Atual</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-destructive" />
        <span>Aumento (Variação Negativa)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-brand-highlight" />
        <span>Redução (Economia / Variação Positiva)</span>
      </div>
    </div>
  )
}