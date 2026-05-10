export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return " — "
  }
  return value.toLocaleString("pt-BR")
}

export function formatQuantity(value: number, unit?: string | null): string {
  if (value === 0) {
    return `0 ${unit || ""}`.trim()
  }

  let decimals: number
  const normalizedUnit = unit?.toLowerCase().trim()

  if (normalizedUnit === "un" || normalizedUnit === "unidade" || normalizedUnit === "unit") {
    decimals = 2
  } else if (normalizedUnit === "kg") {
    if (value > 1) {
      decimals = 2
    } else if (value < 0.01) {
      decimals = 4
    } else {
      decimals = 3
    }
  } else if (normalizedUnit === "g" || normalizedUnit === "ml") {
    decimals = 4
  } else if (normalizedUnit === "l" || normalizedUnit === "litro" || normalizedUnit === "litros") {
    decimals = 3
  } else {
    decimals = 2
  }

  const formatted = value.toFixed(decimals).replace(".", ",")
  const [integerPart, decimalPart = ""] = formatted.split(",")
  const trimmedDecimal = decimalPart.replace(/0+$/, "")
  const finalNumber = trimmedDecimal ? `${integerPart},${trimmedDecimal}` : integerPart

  const unitStr = normalizedUnit ? ` ${normalizedUnit}` : ""
  return `${finalNumber}${unitStr}`
}

export function parseBRL(value: string): number | null {
  const cleaned = value.replace(/[^\d,]/g, "")
  const parsed = parseFloat(cleaned.replace(",", "."))
  return Number.isNaN(parsed) ? null : parsed
}