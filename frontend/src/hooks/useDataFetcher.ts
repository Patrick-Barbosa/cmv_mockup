import { useState, useEffect, useCallback } from "react"

interface UseDataFetcherOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseDataFetcherResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDataFetcher<T = any>(
  fetcher: () => Promise<T>,
  options: UseDataFetcherOptions<T> = {}
): UseDataFetcherResult<T> {
  const { immediate = true, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      onError?.(err instanceof Error ? err : new Error(message))
    } finally {
      setLoading(false)
    }
  }, [fetcher, onSuccess, onError])

  useEffect(() => {
    if (immediate) {
      fetch()
    }
  }, [fetch, immediate])

  return { data, loading, error, refetch: fetch }
}

interface UseMutationResult<T> {
  mutate: (payload?: unknown) => Promise<T | null>
  loading: boolean
  error: string | null
}

export function useMutation<T>(
  mutationFn: (payload?: unknown) => Promise<T>
): UseMutationResult<T> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (payload?: unknown): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(payload)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao executar operação"
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [mutationFn])

  return { mutate, loading, error }
}