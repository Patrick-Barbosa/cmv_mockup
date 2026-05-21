import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardTitle } from "@/components/ui/card"
import { formatBRL, formatPercent, formatNumber, formatQuantity } from "@/lib/format"
import { ArrowUpDown } from "lucide-react"
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
  current_cmv?: number
  new_cmv?: number
  cmv_diff?: number | null
}

interface RecipeResult {
  recipe_id: number
  recipe_name: string
  monthly_sales_quantity: number
  ingredient_quantity?: number
  monthly_revenue_current: number
  monthly_revenue_new?: number
  current_cmv?: number
  new_cmv?: number
  cmv_diff?: number | null
  current_cost: number
  new_cost: number
}

const getImpactColorClass = (value: number) => {
  if (value > 0.0001) return "text-destructive"
  if (value < -0.0001) return "text-brand-highlight"
  return "text-brand-soft"
}

type SortConfig = {
  key: string
  direction: "asc" | "desc"
} | null

export function SimulationResultTable({ title, data, type, currentUnit }: SimulationResultTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "cmv_diff", direction: "desc" })

  const toggleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" }
      }
      return { key, direction: "desc" }
    })
  }

  const isStoreResult = (item: StoreResult | RecipeResult): item is StoreResult => {
    return "store_id" in item
  }

  const sortedData = useMemo(() => {
    const list = [...data]
    if (sortConfig) {
      list.sort((a, b) => {
        let aVal: any = (a as any)[sortConfig.key] ?? 0
        let bVal: any = (b as any)[sortConfig.key] ?? 0
        
        // Calculados on the fly properties
        if (sortConfig.key === "dif_custo_rs") {
           const getDifCusto = (item: any) => {
               if (isStoreResult(item)) return item.total_new_cost - item.total_current_cost;
               const cmvAtualRS = item.current_cost * item.monthly_sales_quantity;
               const cmvSimuladoRS = item.new_cost * item.monthly_sales_quantity;
               return cmvSimuladoRS - cmvAtualRS;
           }
           aVal = getDifCusto(a);
           bVal = getDifCusto(b);
        } else if (sortConfig.key === "cmv_atual_rs") {
           const getCusto = (item: any) => isStoreResult(item) ? item.total_current_cost : item.current_cost * item.monthly_sales_quantity;
           aVal = getCusto(a);
           bVal = getCusto(b);
        } else if (sortConfig.key === "cmv_simulado_rs") {
           const getCusto = (item: any) => isStoreResult(item) ? item.total_new_cost : item.new_cost * item.monthly_sales_quantity;
           aVal = getCusto(a);
           bVal = getCusto(b);
        } else if (sortConfig.key === "monthly_revenue_current") {
           const getRev = (item: any) => isStoreResult(item) ? ((item.current_cmv ?? 0) > 0 ? item.total_current_cost / ((item.current_cmv ?? 0) / 100) : 0) : item.monthly_revenue_current;
           aVal = getRev(a);
           bVal = getRev(b);
        } else if (sortConfig.key === "monthly_revenue_new") {
           const getRev = (item: any) => isStoreResult(item) ? ((item.new_cmv ?? 0) > 0 ? item.total_new_cost / ((item.new_cmv ?? 0) / 100) : 0) : item.monthly_revenue_new || 0;
           aVal = getRev(a);
           bVal = getRev(b);
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }
    return list
  }, [data, sortConfig])

  const renderStoreRow = (store: StoreResult) => {
    const revenueCurrent = store.current_cmv && store.current_cmv > 0
      ? (store.total_current_cost / (store.current_cmv / 100))
      : 0
    const revenueSimulated = store.new_cmv && store.new_cmv > 0
      ? (store.total_new_cost / (store.new_cmv / 100))
      : revenueCurrent
    const costDiff = store.total_new_cost - store.total_current_cost

    return (
      <TableRow key={store.store_id} className="border-b border-brand-line/5 hover:bg-brand-highlight/5 transition-all duration-200 group h-16">
        <TableCell className="font-bold text-[0.9rem] px-6">{store.store_id}</TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium px-4 whitespace-nowrap">{formatNumber(store.monthly_sales_quantity)}</TableCell>
        {type === "insumo" && (
          <TableCell className="text-right tabular-nums text-[0.9rem] font-medium px-4 whitespace-nowrap">{formatQuantity(store.ingredient_quantity || 0, currentUnit)}</TableCell>
        )}
        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium text-brand-soft px-4 whitespace-nowrap">{formatBRL(revenueCurrent)}</TableCell>
        {type === "receita" && (
          <TableCell className="text-right tabular-nums text-[0.9rem] font-medium text-brand-muted px-4 whitespace-nowrap">{formatBRL(revenueSimulated)}</TableCell>
        )}
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-soft px-4 whitespace-nowrap">{formatPercent(store.current_cmv)}</TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-soft px-4 whitespace-nowrap">{formatPercent(store.new_cmv)}</TableCell>
        <TableCell className={cn("text-right tabular-nums text-[1.05rem] font-bold px-4 whitespace-nowrap", getImpactColorClass(store.cmv_diff ?? 0))}>
          {((store.cmv_diff ?? 0) >= 0 ? "+" : "") + (store.cmv_diff ?? 0).toFixed(1)}%
        </TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold px-4 whitespace-nowrap">{formatBRL(store.total_current_cost)}</TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold px-4 whitespace-nowrap">{formatBRL(store.total_new_cost)}</TableCell>
        <TableCell className={cn("text-right tabular-nums text-[1.05rem] font-bold px-6 whitespace-nowrap", getImpactColorClass(costDiff))}>
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
      <TableRow key={item.recipe_id} className="border-b border-brand-line/5 hover:bg-brand-highlight/5 transition-all duration-200 group h-16">
        <TableCell className="font-bold text-[0.9rem] px-6">{item.recipe_name}</TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium px-4 whitespace-nowrap">{formatNumber(item.monthly_sales_quantity)}</TableCell>
        {type === "insumo" && (
          <TableCell className="text-right tabular-nums text-[0.9rem] font-medium px-4 whitespace-nowrap">{formatQuantity(item.ingredient_quantity || 0, currentUnit)}</TableCell>
        )}
        <TableCell className="text-right tabular-nums text-[0.9rem] font-medium text-brand-soft px-4 whitespace-nowrap">{formatBRL(item.monthly_revenue_current)}</TableCell>
        {type === "receita" && (
          <TableCell className="text-right tabular-nums text-[0.9rem] font-medium text-brand-soft px-4 whitespace-nowrap">{formatBRL(item.monthly_revenue_new || 0)}</TableCell>
        )}
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-soft px-4 whitespace-nowrap">{formatPercent(item.current_cmv)}</TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold text-brand-soft px-4 whitespace-nowrap">{formatPercent(item.new_cmv)}</TableCell>
        <TableCell className={cn("text-right tabular-nums text-[1.05rem] font-bold px-4 whitespace-nowrap", getImpactColorClass(item.cmv_diff ?? 0))}>
          {((item.cmv_diff ?? 0) >= 0 ? "+" : "") + (item.cmv_diff ?? 0).toFixed(1)}%
        </TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold px-4 whitespace-nowrap">{formatBRL(cmvAtualRS)}</TableCell>
        <TableCell className="text-right tabular-nums text-[0.9rem] font-bold px-4 whitespace-nowrap">{formatBRL(cmvSimuladoRS)}</TableCell>
        <TableCell className={cn("text-right tabular-nums text-[1.05rem] font-bold px-6 whitespace-nowrap", getImpactColorClass(difCustoRS))}>
          {(difCustoRS >= 0 ? "+" : "") + formatBRL(difCustoRS)}
        </TableCell>
      </TableRow>
    )
  }

  const thClass = "cursor-pointer group text-[0.8rem] uppercase font-bold text-brand-muted transition-colors hover:text-brand-highlight px-4 whitespace-nowrap";

  return (
    <Card className="bg-brand-surface-2 border-brand-line/20 shadow-none overflow-hidden">
      {title && (
        <div className="px-6 py-6 border-b border-brand-line/10 flex flex-row items-center justify-between bg-brand-surface/25">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </div>
      )}
      <Table scrollClassName="max-h-[500px]">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b border-brand-line/15 h-14 bg-brand-surface-2 hover:bg-brand-surface-2">
            <TableHead onClick={() => toggleSort(data.length > 0 && isStoreResult(data[0]) ? "store_id" : "recipe_name")} className={`${thClass} px-6 text-left`}>
              <div className="flex items-center gap-2">{data.length > 0 && isStoreResult(data[0]) ? "Loja" : "Receita"} <ArrowUpDown className="size-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort("monthly_sales_quantity")} className={thClass}>
              <div className="flex items-center justify-end gap-2">Qtd. Vendido <ArrowUpDown className="size-4" /></div>
            </TableHead>
            {type === "insumo" && (
              <TableHead onClick={() => toggleSort("ingredient_quantity")} className={thClass}>
                <div className="flex items-center justify-end gap-2">Qtd. Insumo <ArrowUpDown className="size-4" /></div>
              </TableHead>
            )}
            <TableHead onClick={() => toggleSort("monthly_revenue_current")} className={thClass}>
              <div className="flex items-center justify-end gap-2">Fat. Atual <ArrowUpDown className="size-4" /></div>
            </TableHead>
            {type === "receita" && (
              <TableHead onClick={() => toggleSort("monthly_revenue_new")} className={thClass}>
                <div className="flex items-center justify-end gap-2">Fat. Simulado <ArrowUpDown className="size-4" /></div>
              </TableHead>
            )}
            <TableHead onClick={() => toggleSort("current_cmv")} className={thClass}>
              <div className="flex items-center justify-end gap-2">CMV Atual <ArrowUpDown className="size-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort("new_cmv")} className={thClass}>
              <div className="flex items-center justify-end gap-2">CMV Simulado <ArrowUpDown className="size-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort("cmv_diff")} className={thClass}>
              <div className="flex items-center justify-end gap-2">Dif. % <ArrowUpDown className="size-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort("cmv_atual_rs")} className={thClass}>
              <div className="flex items-center justify-end gap-2">Custo Atual <ArrowUpDown className="size-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort("cmv_simulado_rs")} className={thClass}>
              <div className="flex items-center justify-end gap-2">Custo Simulado <ArrowUpDown className="size-4" /></div>
            </TableHead>
            <TableHead onClick={() => toggleSort("dif_custo_rs")} className={`${thClass} px-6`}>
              <div className="flex items-center justify-end gap-2">Dif. R$ <ArrowUpDown className="size-4" /></div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => isStoreResult(item) ? renderStoreRow(item) : renderRecipeRow(item))}
        </TableBody>
      </Table>
    </Card>
  )
}
