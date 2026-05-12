/**
 * Hook del chat de un lead para mobile.
 *
 * Responsabilidades:
 *  - Carga inicial completa de mensajes (since=0)
 *  - Polling cada 3s con ?since=last_id
 *  - Envío de mensaje con rollback
 *  - Expone counterparty (con phone para WhatsApp) y propertyMeta
 *    para que la cabecera del chat no haga peticiones extra
 *
 * Cierra el polling al desmontar o al cambiar de lead.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const POLL_INTERVAL_MS = 3000

export interface ChatMessage {
  id: number
  match_id: number
  sender_id: number
  content: string
  read_at: string | null
  created_at: string
}

export interface ChatCounterparty {
  id: number
  name: string
  phone: string | null
  avatar_url: string | null
}

export interface ChatPropertyMeta {
  id: number | null
  title: string | null
  city: string | null
}

export function useChat(leadId: number | null) {
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [myId, setMyId]             = useState<number | null>(null)
  const [counterparty, setCounter]  = useState<ChatCounterparty | null>(null)
  const [propertyMeta, setProperty] = useState<ChatPropertyMeta | null>(null)
  const [loading, setLoading]       = useState(false)
  const [sending, setSending]       = useState(false)

  const lastIdRef = useRef<number>(0)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadInitial = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      const r = await api.get(`/leads/${leadId}/messages`)
      const d = r.data.data
      setMessages(d.messages)
      setMyId(d.meta.my_id)
      setCounter(d.meta.counterparty ?? null)
      setProperty(d.meta.property ?? null)
      lastIdRef.current = d.meta.last_id ?? 0
    } catch (e) {
      console.warn('chat loadInitial:', e)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  const poll = useCallback(async () => {
    if (!leadId) return
    try {
      const r = await api.get(`/leads/${leadId}/messages?since=${lastIdRef.current}`)
      const d = r.data.data
      if (d.messages.length > 0) {
        setMessages(cur => [...cur, ...d.messages])
        lastIdRef.current = d.meta.last_id ?? lastIdRef.current
      }
    } catch {
      // silencioso
    }
  }, [leadId])

  const send = useCallback(async (content: string): Promise<boolean> => {
    if (!leadId || !content.trim()) return false
    setSending(true)
    try {
      const r = await api.post(`/leads/${leadId}/messages`, { content })
      const msg: ChatMessage = r.data.data
      setMessages(cur => [...cur, msg])
      lastIdRef.current = msg.id
      return true
    } catch (e) {
      console.warn('chat send:', e)
      return false
    } finally {
      setSending(false)
    }
  }, [leadId])

  useEffect(() => {
    if (!leadId) return
    loadInitial()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [leadId, loadInitial, poll])

  return {
    messages,
    myId,
    counterparty,
    propertyMeta,
    loading,
    sending,
    send,
    refetch: loadInitial,
  }
}
