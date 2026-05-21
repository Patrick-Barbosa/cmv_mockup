import { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "./LoadingState"

interface Column<T> {
  key: string
  header?: string
  render?: (item: T, index: number) => ReactNode
  className?: string
  sortable?: boolean
  align?: "left" | "center" | "right"
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  emptyIcon?: ReactNode
  className?: string
  onRowClick?: (item: T) => void
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  loadingMessage = "Carregando dados...",
  emptyMessage = "Nenhum dado encontrado",
  emptyIcon,
  className = "",
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={`bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden ${className}`}>
        <LoadingState type="spinner" message={loadingMessage} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden ${className}`}>
        <LoadingState type="empty" message={emptyMessage} icon={emptyIcon} />
      </div>
    )
  }

  return (
    <div className={`bg-brand-surface-2 border border-brand-line/20 rounded-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`font-medium h-10 ${col.align ? `text-${col.align}` : ""} ${col.className || ""}`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={keyExtractor(item)}
                className={`border-b border-brand-line/10 hover:bg-brand-line/5 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(item, index) : (item as Record<string, unknown>)[col.key] as ReactNode}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface SimpleTableProps {
  headers: { key: string; label: string; align?: "left" | "center" | "right" }[]
  children: ReactNode
  className?: string
}

export function SimpleTable({ headers, children, className = "" }: SimpleTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-brand-line/20 text-brand-muted text-[0.72rem] tracking-[0.08em] uppercase hover:bg-transparent">
            {headers.map((h) => (
              <TableHead key={h.key} className={`font-medium h-10 ${h.align ? `text-${h.align}` : ""}`}>
                {h.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}