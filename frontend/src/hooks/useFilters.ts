import { useState, useEffect, useCallback } from "react"

interface VendasFiltersResponse {
  lojas: string[]
  meses: string[]
}

interface UseFiltersResult {
  filters: VendasFiltersResponse
  loading: boolean
  error: string | null
  selectedStore: string
  selectedMonth: string
  setSelectedStore: (value: string) => void
  setSelectedMonth: (value: string) => void
}

export function useFilters(
  getFiltersFn: () => Promise<VendasFiltersResponse>,
  defaultStore = "todas",
  defaultMonth = "todos"
): UseFiltersResult {
  const [filters, setFilters] = useState<VendasFiltersResponse>({ lojas: [], meses: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState(defaultStore)
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)

  useEffect(() => {
    getFiltersFn()
      .then((response) => {
        setFilters(response)
        setSelectedMonth(defaultMonth)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar filtros."))
      .finally(() => setLoading(false))
  }, [getFiltersFn, defaultMonth])

  return {
    filters,
    loading,
    error,
    selectedStore,
    selectedMonth,
    setSelectedStore,
    setSelectedMonth,
  }
}

interface UseFilterOptions {
  defaultValue?: string
  placeholder?: string
}

interface UseFilterResult {
  value: string
  onChange: (value: string) => void
}

export function useFilter(
  options: UseFilterOptions = {}
): UseFilterResult {
  const [value, setValue] = useState(options.defaultValue || "")

  const onChange = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  return { value, onChange }
}