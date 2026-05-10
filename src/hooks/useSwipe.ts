import { useState } from 'react'
import { api, extractErrorMessage } from '../api/client'
import type { SwipeResult } from '../types'

export function useSwipe() {
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const swipe = async (
    propertyId: number,
    direction: 'right' | 'left'
  ): Promise<SwipeResult | null> => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.post('/swipes', {
        property_id: propertyId,
        direction,
      })
      return data.data
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al hacer swipe'))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { swipe, isLoading, error }
}
