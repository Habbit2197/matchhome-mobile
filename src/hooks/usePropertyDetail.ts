import { useState, useEffect } from 'react'
import { apiGet } from '../api/client'

export function usePropertyDetail(propertyId: number | null) {
  const [property, setProperty] = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    apiGet<any>(`/properties/${propertyId}`)
      .then(d => setProperty(d?.data ?? d))
      .catch(() => setError('No se pudo cargar el piso'))
      .finally(() => setLoading(false))
  }, [propertyId])

  return { property, loading, error }
}
