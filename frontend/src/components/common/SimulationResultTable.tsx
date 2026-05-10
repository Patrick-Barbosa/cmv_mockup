import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardTitle } from "@/components/ui/card"
import { formatBRL, formatPercent, formatNumber, formatQuantity } from "@/lib/format"
import { cn } from "@/lib/utils"

interface SimulationResultTableProps {
  title?: string
  data: StoreResult[] | RecipeResult[]
  type: "insumo" | "receita"
  currentUnit?: string | null
}

interface StoreResult {
  store_id: string
  monthly_sales_quantity: number
  ingredient_quantity?: number
  total_current_cost: number
  total_new_cost: number
  current_cmv: number
  new_cmv: number
  cmv_diff: number | null
}

interface RecipeResult {
  recipe_id: number
  recipe_name: string
  monthly_sales_quantity: number
  ingredient_quantity?: number
  monthly_revenue_current: number
  monthly_revenue_new?: number
  current_cmv: number
  new_cmv: number
  cmv_diff: number | null
  current_cost: number
  new_cost: number
}

const getImpactColorClass = (value: number) => {
  if (value > 0.0001) return "text-destructive"
  if (value < -0.0001) return "text-brand-highlight"
  return "text-brand-soft"
}

export function SimulationResultTable({ title, data, type, currentUnit }: SimulationResultTableProps) {
  const isStoreResult = (item: StoreResult | RecipeResult): item is StoreResult => {
    return "store_id" in item
  }

  const renderStoreRow = (store: StoreResult) => {
    const revenueCurrent = store.current_cmv && store.current_cmv > 0
      ? (store.total_current_cost / (store.current_cmv / 100))
      : 0
    const revenueSimulated = store.new_cmv && store.new_cmv > 0
      ? (store.total_new_cost / (store.new_cmv / 100))
      : revenueCurrent
    const costDiff = store.total_new_cost - store.total_current_cost

    return (
      <TableRow key={store.store_id} className="border-brand-line/20">
        <TableCell className="font-medium text-brand-soft">{store.store_id}</TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatNumber(store.monthly_sales_quantity)}</TableCell>
        {type === "insumo" && (
          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatQuantity(store.ingredient_quantity || 0, currentUnit)}</TableCell>
        )}
        <TableCell className="text-brand-muted text-right text-xs whitespace-nowrap">{formatBRL(revenueCurrent)}</TableCell>
        {type === "receita" && (
          <TableCell className="text-brand-muted text-right text-xs whitespace-nowrap">{formatBRL(revenueSimulated)}</TableCell>
        )}
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(store.current_cmv)}</TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(store.new_cmv)}</TableCell>
        <TableCell className={cn("text-right font-bold text-xs whitespace-nowrap", getImpactColorClass(store.cmv_diff ?? 0))}>
          {((store.cmv_diff ?? 0) >= 0 ? "+" : "") + (store.cmv_diff ?? 0).toFixed(1)}%
        </TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(store.total_current_cost)}</TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(store.total_new_cost)}</TableCell>
        <TableCell className={cn("text-right font-bold text-xs whitespace-nowrap", getImpactColorClass(costDiff))}>
          {(costDiff >= 0 ? "+" : "") + formatBRL(costDiff)}
        </TableCell>
      </TableRow>
    )
  }

  const renderRecipeRow = (item: RecipeResult) => {
    const cmvAtualRS = item.current_cost * item.monthly_sales_quantity
    const cmvSimuladoRS = item.new_cost * item.monthly_sales_quantity
    const difCustoRS = cmvSimuladoRS - cmvAtualRS

    return (
      <TableRow key={item.recipe_id} className="border-brand-line/20">
        <TableCell className="font-medium text-brand-soft">{item.recipe_name}</TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatNumber(item.monthly_sales_quantity)}</TableCell>
        {type === "insumo" && (
          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatQuantity(item.ingredient_quantity || 0, currentUnit)}</TableCell>
        )}
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(item.monthly_revenue_current)}</TableCell>
        {type === "receita" && (
          <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(item.monthly_revenue_new || 0)}</TableCell>
        )}
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(item.current_cmv)}</TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatPercent(item.new_cmv)}</TableCell>
        <TableCell className={cn("text-right font-bold text-xs whitespace-nowrap", getImpactColorClass(item.cmv_diff ?? 0))}>
          {((item.cmv_diff ?? 0) >= 0 ? "+" : "") + (item.cmv_diff ?? 0).toFixed(1)}%
        </TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(cmvAtualRS)}</TableCell>
        <TableCell className="text-brand-soft text-right text-xs whitespace-nowrap">{formatBRL(cmvSimuladoRS)}</TableCell>
        <TableCell className={cn("text-right font-bold text-xs whitespace-nowrap", getImpactColorClass(difCustoRS))}>
          {(difCustoRS >= 0 ? "+" : "") + formatBRL(difCustoRS)}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none p-6">
      {title && <CardTitle className="text-lg font-semibold mb-4">{title}</CardTitle>}
      <div className="[&>div]:max-h-[440px] [&>div]:overflow-y-auto pr-2 -mr-2">
        <Table>
          <TableHeader className="sticky top-0 bg-brand-surface-2 z-10 shadow-sm shadow-brand-line/10">
            <TableRow className="border-brand-line/20 hover:bg-transparent">
              <TableHead className="text-brand-muted font-medium bg-brand-surface-2">Loja</TableHead>
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Qtd. Vendido</TableHead>
              {type === "insumo" && (
                <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Qtd. Insumo</TableHead>
              )}
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Fat. Atual</TableHead>
              {type === "receita" && (
                <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Fat. Simulado</TableHead>
              )}
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV %</TableHead>
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV Simulado %</TableHead>
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Diferença %</TableHead>
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV R$</TableHead>
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">CMV Simulado R$</TableHead>
              <TableHead className="text-brand-muted font-medium text-right bg-brand-surface-2">Diferença R$</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => isStoreResult(item) ? renderStoreRow(item) : renderRecipeRow(item))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}