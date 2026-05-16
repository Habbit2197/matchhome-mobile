/**
 * useNearby — Obtiene la ubicación GPS y filtra propiedades cercanas.
 * Requiere: expo-location
 */
import { useState, useCallback } from 'react'
import { Alert, Platform } from 'react-native'
import { apiGet } from '../api/client'

let Location: any = null
try { Location = require('expo-location') } catch {}

export interface NearbyProperty {
  id: number; title: string; city?: string
  distance_km?: number; pricing?: { amount: number }
  specs?: { rooms: number; size_m2: number }
  images?: Array<{ url: string }>
  compatibility_score?: number
  location?: { lat?: number; lng?: number }
}

export function useNearby() {
  const [properties, setProperties] = useState<NearbyProperty[]>([])
  const [loading,    setLoading]    = useState(false)
  const [enabled,    setEnabled]    = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  const load = useCallback(async (radiusKm = 10) => {
    if (!Location) { setError('Módulo de ubicación no disponible'); return }
    setLoading(true); setError(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado'); setLoading(false); return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude: lat, longitude: lng } = pos.coords
      setUserCoords({ lat, lng })

      const data = await apiGet<any>(`/properties?lat=${lat}&lng=${lng}&radius=${radiusKm}&limit=20`)
      const list = data?.data ?? data ?? []
      setProperties(Array.isArray(list) ? list : [])
      setEnabled(true)
    } catch (e: any) {
      setError('No se pudo obtener tu ubicación')
    } finally { setLoading(false) }
  }, [])

  const disable = useCallback(() => {
    setEnabled(false); setProperties([]); setUserCoords(null)
  }, [])

  return { properties, loading, enabled, userCoords, error, load, disable }
}
