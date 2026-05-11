import { useEffect, useState, useCallback } from 'react'
import { api, extractErrorMessage } from '../api/client'
import type { Lead } from '../types'

// Re-export para compatibilidad con código antiguo que importaba SwipeHistoryItem
export type SwipeHistoryItem = Lead

export function useMyMatches() {
  const [items, setItems]       = useState<Lead[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get('/me/leads')
      setItems(data.data.items as Lead[])
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al cargar tus solicitudes'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  /** Actualizar un lead concreto en el estado local sin re-fetch completo */
  const replaceLead = useCallback((updated: Lead) => {
    setItems(prev => prev.map(l => l.id === updated.id ? updated : l))
  }, [])

  return { items, isLoading, error, refetch: fetchLeads, replaceLead }
}
