/**
 * Hook que carga el detalle de un inmueble por id desde GET /api/properties/{id}.
 *
 * Estados expuestos:
 *  - property: el inmueble con su compatibility decorada
 *  - loading: true durante la primera carga
 *  - refreshing: true durante un refetch manual (pull-to-refresh)
 *  - error: mensaje legible o null
 *  - notFound: true específicamente cuando el backend devuelve 404
 *
 * Reglas de robustez:
 *  - No se hace la petición si el id no es un número válido.
 *  - El error de red se diferencia del 404 (notFound) y del 401 (auth).
 *  - refetch() es seguro de llamar varias veces.
 *  - Se cancela cualquier petición pendiente al desmontar (AbortController).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { api } from '../api/client'

export interface PropertyDetail {
  id: number
  title: string
  description: string | null
  type: 'flat' | 'house' | 'room' | string
  pricing: { amount: number; currency: string; period: string }
  specs: { size_m2: number | null; rooms: number; bathrooms: number }
  location: { city: string; zip_code: string | null }
  rules: { allows_pets: boolean; allows_smokers: boolean }
  available_from: string | null
  is_active: boolean
  images: Array<{ id: number; url: string; sort_order: number }>
  agency: { id: number; name: string; slug?: string } | null
  compatibility: { score: number; label: string; color: string }
  created_at: string
  updated_at: string
}

interface UsePropertyResult {
  property: PropertyDetail | null
  loading: boolean
  refreshing: boolean
  error: string | null
  notFound: boolean
  refetch: () => Promise<void>
}

export function useProperty(id: number | null | undefined): UsePropertyResult {
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const isFirstLoad = useRef(true)

  const load = useCallback(async (manual = false) => {
    if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
      setProperty(null)
      setError('ID de inmueble inválido')
      return
    }

    // Cancelar petición anterior si la hay
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (manual) setRefreshing(true)
    else if (isFirstLoad.current) setLoading(true)

    setError(null)
    setNotFound(false)

    try {
      const r = await api.get(`/properties/${id}`, { signal: controller.signal })
      setProperty(r.data?.data ?? null)
    } catch (e: unknown) {
      if (axios.isCancel(e) || (e as any)?.name === 'CanceledError') return // cancelado a propósito

      if (axios.isAxiosError(e)) {
        if (e.response?.status === 404) {
          setNotFound(true)
          setError('Este inmueble ya no está disponible.')
        } else if (e.response?.status === 401) {
          setError('Tu sesión ha expirado. Vuelve a iniciar sesión.')
        } else if (!e.response) {
          setError('Sin conexión. Comprueba tu Wi-Fi.')
        } else {
          setError(e.response?.data?.message ?? 'No pudimos cargar este piso.')
        }
      } else {
        setError('Error inesperado al cargar el piso.')
      }
      setProperty(null)
    } finally {
      isFirstLoad.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    isFirstLoad.current = true
    load(false)
    return () => abortRef.current?.abort()
  }, [load])

  const refetch = useCallback(() => load(true), [load])

  return { property, loading, refreshing, error, notFound, refetch }
}
