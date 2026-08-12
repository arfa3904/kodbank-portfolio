import { useCallback, useEffect, useState } from 'react'
import { getReceivers } from '../api/banking'
import type { Receiver } from '../types'

export function useReceivers() {
  const [receivers, setReceivers] = useState<Receiver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setReceivers(await getReceivers())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { receivers, loading, error, reload }
}
