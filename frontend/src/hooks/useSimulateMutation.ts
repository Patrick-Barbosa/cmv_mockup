import { useState, useCallback, useEffect } from "react"
import { simulatorApi, type SimulationInput, type SimulationResponse, type EvolutionResponse } from "@/lib/api"

interface UseSimulateMutationOptions {
  onSuccess?: (result: SimulationResponse) => void
  onError?: (error: string) => void
}

export function useSimulateMutation(options?: UseSimulateMutationOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null)
  const [lastInput, setLastInput] = useState<SimulationInput | null>(null)

  const simulate = useCallback(async (input: SimulationInput) => {
    setLoading(true)
    setError(null)
    setSimulationResult(null)

    try {
      const response = await simulatorApi.simulate(input)
      setSimulationResult(response)
      setLastInput(input)
      options?.onSuccess?.(response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao realizar simulação"
      setError(msg)
      options?.onError?.(msg)
    } finally {
      setLoading(false)
    }
  }, [options])

  return {
    loading,
    error,
    simulationResult,
    lastInput,
    simulate,
  }
}

export function useEvolution(lastInput: SimulationInput | null, selectedMonth: string, impactedOnly: boolean) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EvolutionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lastInput || !selectedMonth) return

    let ignore = false

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    simulatorApi
      .getEvolution({
        ...lastInput,
        month: selectedMonth,
        impacted_only: impactedOnly,
      })
      .then((result) => {
        if (!ignore) setData(result)
      })
      .catch((err) => {
        console.error("Erro ao buscar evolução:", err)
        if (!ignore) setError("Erro ao buscar evolução")
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [lastInput, selectedMonth, impactedOnly])

  return {
    loading,
    data,
    error,
  }
}