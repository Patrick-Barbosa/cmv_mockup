export function formatBRL(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatPercent(value: number | undefined | null): string {
  return `${((value ?? 0) * 100).toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR")
}

export function formatQuantity(value: number, unit?: string | null): string {
  const formatted = value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return unit ? `${formatted} ${unit}` : formatted
}

export function parseBRL(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".")
  return parseFloat(cleaned) || 0
}
