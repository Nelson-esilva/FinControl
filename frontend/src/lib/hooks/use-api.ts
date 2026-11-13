"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { errorMessage } from "@/lib/finance/client"

/**
 * Carrega dados da API e recarrega quando `deps` muda ou quando qualquer tela
 * avisa mudança (notifyDataChanged). Mantém o último dado durante o recarregamento.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const seq = useRef(0)

  const reload = useCallback(async () => {
    const id = ++seq.current
    setLoading(true)
    try {
      const result = await fetcherRef.current()
      if (id === seq.current) {
        setData(result)
        setError(null)
      }
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err, "Não foi possível carregar os dados."))
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const onChange = () => void reload()
    window.addEventListener("fincontrol:changed", onChange)
    return () => window.removeEventListener("fincontrol:changed", onChange)
  }, [reload])

  return { data, error, loading, reload }
}
