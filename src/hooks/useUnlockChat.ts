import { useState, useCallback } from 'react'
import { api, extractErrorMessage } from '../api/client'
import type { Lead } from '../types'

interface UnlockChatResponse {
  lead: Lead
  transaction_id: number
  amount_paid: string
  chat_unlocked: true
}

export function useUnlockChat() {
  const [isPaying, setPaying] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const unlock = useCallback(async (leadId: number): Promise<Lead | null> => {
    setPaying(true); setError(null)
    try {
      const { data } = await api.post(`/leads/${leadId}/unlock-chat`, {})
      const payload = data.data as UnlockChatResponse
      return payload.lead
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo procesar el pago'))
      return null
    } finally {
      setPaying(false)
    }
  }, [])

  return { unlock, isPaying, error }
}
