/**
 * Hook de notificaciones para mobile.
 *
 * - Polling de unread-count cada 30s (pausado si la app va a background)
 * - Carga la lista al primer abrir la pantalla
 * - Acciones: markOne, markAll, deleteOne
 * - Optimistic updates en el badge
 *
 * Importante: en RN no hay document.hidden, usamos AppState para pausar polling
 * cuando el usuario está fuera de la app (mejor batería).
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"
import { api } from "../api/client"

const POLL_INTERVAL_MS = 30000

export interface AppNotification {
  id: number
  user_id: number
  type: string
  title: string
  body: string
  url: string | null
  icon: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export function useNotifications() {
  const [items, setItems]           = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCnt] = useState<number>(0)
  const [loading, setLoading]       = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [listLoaded, setListLoaded] = useState(false)

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const inFlightRef = useRef<boolean>(false)
  const isActiveRef = useRef<boolean>(true)

  /** Pide solo el count (rápido, para el badge) */
  const refreshCount = useCallback(async () => {
    if (inFlightRef.current || !isActiveRef.current) return
    inFlightRef.current = true
    try {
      const r = await api.get("/me/notifications/unread-count")
      setUnreadCnt(r.data.data.unread_count)
    } catch {
      // silencioso
    } finally {
      inFlightRef.current = false
    }
  }, [])

  /** Carga lista completa */
  const loadList = useCallback(async (force = false) => {
    if (listLoaded && !force && !refreshing) return
    if (force) setRefreshing(true)
    else setLoading(true)
    try {
      const r = await api.get("/me/notifications?per_page=30")
      const d = r.data.data
      setItems(d.items)
      setUnreadCnt(d.unread_count)
      setListLoaded(true)
    } catch (e) {
      console.warn("notifications loadList:", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [listLoaded, refreshing])

  /** Marca una leída (optimista + roundtrip) */
  const markOneAsRead = useCallback(async (id: number) => {
    setItems(prev => prev.map(n =>
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n
    ))
    setUnreadCnt(c => Math.max(0, c - 1))
    try {
      await api.put(`/me/notifications/${id}/read`, {})
    } catch (e) {
      console.warn("markOneAsRead:", e)
      loadList(true) // rollback
    }
  }, [loadList])

  /** Marca todas leídas */
  const markAllAsRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnreadCnt(0)
    try {
      await api.put("/me/notifications/read-all", {})
    } catch (e) {
      console.warn("markAllAsRead:", e)
      loadList(true)
    }
  }, [loadList])

  /** Borra una */
  const deleteOne = useCallback(async (id: number) => {
    const target = items.find(n => n.id === id)
    setItems(prev => prev.filter(n => n.id !== id))
    if (target && !target.read_at) setUnreadCnt(c => Math.max(0, c - 1))
    try {
      await api.delete(`/me/notifications/${id}`)
    } catch (e) {
      console.warn("deleteOne:", e)
      loadList(true)
    }
  }, [items, loadList])

  /** Polling + listener de AppState (pausa al ir a background) */
  useEffect(() => {
    refreshCount()
    pollRef.current = setInterval(refreshCount, POLL_INTERVAL_MS)

    const sub = AppState.addEventListener("change", (next) => {
      isActiveRef.current = next === "active"
      if (next === "active") refreshCount() // refrescar al volver al foreground
    })

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      sub.remove()
    }
  }, [refreshCount])

  return {
    items,
    unreadCount,
    loading,
    refreshing,
    listLoaded,
    loadList,
    refreshCount,
    markOneAsRead,
    markAllAsRead,
    deleteOne,
  }
}
