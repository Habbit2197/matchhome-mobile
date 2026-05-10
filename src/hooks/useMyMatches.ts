import { useEffect, useState, useCallback } from 'react'
import { api, extractErrorMessage } from '../api/client'

export interface SwipeHistoryItem {
  id: number
  direction: 'right' | 'left'
  compatibility_score: number
  property: {
    id: number
    title: string
    type: string
    pricing: { amount: number }
    location: { city: string; zip_code: string }
    specs: { rooms: number; bathrooms: number; size_m2: number }
    images: { id: number; url: string; sort_order: number }[]
  }
  created_at: string
}

export function useMyMatches() {
  const [items, setItems]       = useState<SwipeHistoryItem[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get('/swipes/history')
      // Solo los swipe right
      const items = (data.data.items as SwipeHistoryItem[]).filter(s => s.direction === 'right')
      setItems(items)
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al cargar matches'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  return { items, isLoading, error, refetch: fetchHistory }
}
