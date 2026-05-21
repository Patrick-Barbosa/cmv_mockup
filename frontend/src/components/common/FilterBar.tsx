import { FadeUp } from "@/components/ui/fade-up"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FilterBarProps {
  stores: string[]
  months: string[]
  selectedStore: string
  selectedMonth: string
  onStoreChange: (value: string) => void
  onMonthChange: (value: string) => void
  loading?: boolean
  storePlaceholder?: string
  monthPlaceholder?: string
  className?: string
  storeLabel?: string
  monthLabel?: string
}

export function FilterBar({
  stores,
  months,
  selectedStore,
  selectedMonth,
  onStoreChange,
  onMonthChange,
  loading = false,
  storePlaceholder = "Selecione a loja",
  monthPlaceholder = "Selecione o mês",
  className = "",
  storeLabel = "Filtro de Unidade",
  monthLabel = "Mês de Referência",
}: FilterBarProps) {
  return (
    <FadeUp delay={0.05} className={`bg-brand-surface-2 border border-brand-line/20 rounded-sm p-6 ${className}`}>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-soft tracking-tight block">
            {storeLabel}
          </label>
          <Select value={selectedStore} onValueChange={onStoreChange} disabled={loading}>
            <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
              <SelectValue placeholder={storePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Lojas</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store} value={store}>
                  {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-soft tracking-tight block">
            {monthLabel}
          </label>
          <Select value={selectedMonth} onValueChange={onMonthChange} disabled={loading}>
            <SelectTrigger className="w-full bg-brand-surface border-brand-line/35 h-11 text-base">
              <SelectValue placeholder={monthPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FadeUp>
  )
}