/**
 * Hook para cargar el perfil público de cualquier usuario.
 * Equivalente mobile al usePublicProfile del web.
 */
import { useEffect, useState } from "react"
import { api } from "../api/client"

export interface PublicProfileData {
  user: {
    id: number
    name: string
    role: string
    profile_photo_path: string | null
    photo_url: string | null
    bio: string | null
    location: string | null
    response_time_hours: number
    created_at: string
  }
  stats: {
    ranking_score: number
    avg_rating: number
    reviews_count: number
  }
  histogram: Record<string, number>
  recent_reviews: PublicReview[]
}

export interface PublicReview {
  id: number
  reviewer_user_id: number
  reviewed_user_id: number
  lead_id: number | null
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    id: number
    name: string
    profile_photo_path: string | null
  }
}

export function usePublicProfile(userId: number | null) {
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    api.get(`/users/${userId}/profile`)
      .then(r => setData(r.data.data))
      .catch(e => setError(e?.response?.data?.message ?? "Error al cargar el perfil"))
      .finally(() => setLoading(false))
  }, [userId])

  return { data, loading, error }
}
