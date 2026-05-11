export interface User {
  id: number
  name: string
  email: string
  role: 'tenant' | 'agency_admin' | 'agency_agent' | 'admin'
  avatar_url: string | null
  email_verified_at: string | null
  created_at: string
}

export interface Property {
  id: number
  title: string
  description: string
  type: 'flat' | 'house' | 'room'
  pricing: { amount: number; currency: string; period: string }
  specs: { size_m2: number; rooms: number; bathrooms: number }
  location: { city: string; zip_code: string }
  rules: { allows_pets: boolean; allows_smokers: boolean }
  available_from: string | null
  is_active: boolean
  images: { id: number; url: string; sort_order: number }[]
  created_at: string
  updated_at: string
}

export interface SwipeResult {
  direction: 'right' | 'left'
  compatibility_score: number
  lead_created: boolean
  lead?: Lead
}

export interface Lead {
  id: number
  status: 'new' | 'contacted' | 'visiting' | 'negotiating' | 'closed_won' | 'closed_lost'
  source: 'swipe' | 'direct' | 'imported_idealista' | 'imported_fotocasa'
  compatibility_score: number
  tenant?: User
  property?: Property
  agent_notes: string | null
  contacted_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string

  // ── Nuevos campos del marketplace transaccional ──
  chat_unlocked_at: string | null
  contract_signed_at: string | null
  contract_monthly_amount: string | number | null
}
