import { useEffect, useState, useCallback } from 'react'
import { api, extractErrorMessage } from '../api/client'
import type { Property } from '../types'

export function useFeed() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setLoading]     = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const fetchFeed = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get('/feed')
      setProperties(data.data.items)
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al cargar pisos'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  return { properties, isLoading, error, refetch: fetchFeed }
}
