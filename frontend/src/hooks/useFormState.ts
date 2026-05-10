import { useState, useMemo, useCallback } from "react"
import type { SimulationInput, ComponenteSimulacao } from "@/lib/api"

interface UseFormStateOptions {
  onSimulate: (input: SimulationInput) => void
}

export function useFormState(options: UseFormStateOptions) {
  const [simulationType, setSimulationType] = useState<"insumo" | "receita">("insumo")
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [currentUnit, setCurrentUnit] = useState<string | null>(null)
  const [simulatedPrice, setSimulatedPrice] = useState<number | null>(null)
  const [simulatedPriceDisplay, setSimulatedPriceDisplay] = useState<string>("")
  const [selectedStores, setSelectedStores] = useState<string[]>(["RJ-COPA", "RJ-BARRA"])
  const [composicao, setComposicao] = useState<ComponenteSimulacao[]>([])
  const [componentesOriginais, setComponentesOriginais] = useState<ComponenteSimulacao[]>([])
  const [selectedProductName, setSelectedProductName] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-04")

  const handleTypeChange = useCallback((type: "insumo" | "receita") => {
    setSimulationType(type)
    setSelectedProductId(null)
    setCurrentPrice(0)
    setCurrentUnit(null)
    setSimulatedPrice(null)
    setSimulatedPriceDisplay("")
    setComposicao([])
    setComponentesOriginais([])
    setSelectedProductName("")
  }, [])

  const handleProductChange = useCallback(
    (productId: string, productName: string, price: number, unit: string | null) => {
      const id = Number(productId)
      setSelectedProductId(id)
      setSimulatedPrice(null)
      setSimulatedPriceDisplay("")
      setSelectedProductName(productName)
      setCurrentPrice(price)
      setCurrentUnit(unit)
      setComposicao([])
      setComponentesOriginais([])
    },
    []
  )

  const updatePrice = useCallback((price: number | null, display: string) => {
    setSimulatedPrice(price)
    setSimulatedPriceDisplay(display)
  }, [])

  const isFormValid = useMemo(() => {
    if (!selectedProductId) return false

    const hasPriceChange = simulatedPrice !== null && simulatedPrice !== currentPrice
    if (hasPriceChange) return true

    if (simulationType === "receita") {
      const originalMapped = JSON.stringify(componentesOriginais.map((c) => ({ id: c.id_componente, q: c.quantidade })))
      const currentMapped = JSON.stringify(composicao.map((c) => ({ id: c.id_componente, q: c.quantidade })))
      if (originalMapped !== currentMapped) return true
    }

    return false
  }, [selectedProductId, simulatedPrice, currentPrice, simulationType, componentesOriginais, composicao])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedProductId || !isFormValid) return

      const changeValue = simulatedPrice !== null ? simulatedPrice : currentPrice

      const input: SimulationInput = {
        type: simulationType === "insumo" ? "price_change" : "recipe_change",
        change_type: "absoluto",
        change_value: changeValue,
        store_ids: selectedStores.length > 0 ? selectedStores : undefined,
      }

      if (simulationType === "insumo") {
        input.ingredient_id = selectedProductId
      } else {
        input.recipe_id = selectedProductId
        if (composicao.length > 0) {
          input.novos_componentes = composicao
        }
      }

      options.onSimulate(input)
    },
    [selectedProductId, isFormValid, simulatedPrice, currentPrice, simulationType, selectedStores, composicao, options]
  )

  return {
    // State
    simulationType,
    selectedProductId,
    currentPrice,
    currentUnit,
    simulatedPrice,
    simulatedPriceDisplay,
    selectedMonth,
    selectedStores,
    composicao,
    componentesOriginais,
    selectedProductName,
    isFormValid,
    // Setters
    setSelectedMonth,
    setSelectedStores,
    setComposicao,
    setComponentesOriginais,
    // Handlers
    handleTypeChange,
    handleProductChange,
    updatePrice,
    handleSubmit,
  }
}