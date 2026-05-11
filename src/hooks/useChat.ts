/**
 * Hook para el chat de un lead en mobile.
 * - Polling 3s con ?since={last_id}
 * - Carga inicial + envío de mensajes
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

export function useChat(leadId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [myId, setMyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const lastIdRef = useRef<number>(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const loadInitial = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      const r = await api.get(`/leads/${leadId}/messages`)
      const d = r.data.data
      setMessages(d.messages)
      setMyId(d.meta.my_id)
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

  return { messages, myId, loading, sending, send, refetch: loadInitial }
}
