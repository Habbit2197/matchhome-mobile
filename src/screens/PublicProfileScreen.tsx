/**
 * Pantalla nativa del perfil público de un usuario.
 *
 * Route: PublicProfile (param: userId)
 *
 * Equivalente mobile del PublicProfilePage del web. Muestra:
 *  - Cabecera con avatar grande, nombre, rol y ubicación
 *  - Stats: ranking 0-100, valoración media (estrellas), nº reseñas
 *  - Histograma de estrellas
 *  - Lista de reseñas recibidas
 */
import { useLayoutEffect } from "react"
import {
  View, Text, ScrollView, StyleSheet, Image,
  ActivityIndicator, TouchableOpacity,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import { usePublicProfile, type PublicReview } from "../hooks/usePublicProfile"

const ROLE_LABEL: Record<string, string> = {
  tenant:        "Inquilino",
  landlord:      "Propietario particular",
  agency_admin:  "Agencia",
  agency_agent:  "Agente",
  admin:         "Admin",
}

export default function PublicProfileScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const userId = route.params?.userId as number | undefined
  const { data, loading, error } = usePublicProfile(userId ?? null)

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Perfil" })
  }, [navigation])

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /></View>
  }
  if (error || !data) {
    return <View style={styles.centered}><Text style={styles.error}>{error ?? "No se pudo cargar el perfil."}</Text></View>
  }

  const { user, stats, histogram, recent_reviews } = data
  const initial = user.name.charAt(0).toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  const roleLabel = ROLE_LABEL[user.role] ?? user.role

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Cabecera */}
      <View style={styles.headerCard}>
        <View style={styles.avatarBig}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={{ width: "100%", height: "100%", borderRadius: 50 }} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{roleLabel}</Text>
        <View style={styles.metaRow}>
          {user.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{user.location}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>Desde {memberSince}</Text>
          </View>
        </View>
        {user.bio && (
          <View style={styles.bioBox}>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#fffbeb", borderColor: "#fcd34d" }]}>
          <Ionicons name="trophy" size={22} color="#d97706" />
          <Text style={[styles.statBig, { color: "#92400e" }]}>{stats.ranking_score}
            <Text style={{ fontSize: 13, fontWeight: "400" }}>/100</Text>
          </Text>
          <Text style={styles.statLabel}>Puntuación</Text>
        </View>
        <View style={styles.statCard}>
          <Stars value={Math.round(stats.avg_rating)} />
          <Text style={styles.statBig}>{stats.avg_rating.toFixed(1)}
            <Text style={{ fontSize: 13, fontWeight: "400", color: "#64748b" }}>/5</Text>
          </Text>
          <Text style={styles.statLabel}>Valoración</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles-outline" size={22} color="#475569" />
          <Text style={styles.statBig}>{stats.reviews_count}</Text>
          <Text style={styles.statLabel}>Reseñas</Text>
        </View>
      </View>

      {/* Histograma */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución</Text>
        <View style={styles.card}>
          {[5,4,3,2,1].map(stars => {
            const count = histogram[stars.toString()] ?? 0
            const max = Math.max(...Object.values(histogram), 1)
            const pct = (count / max) * 100
            return (
              <View key={stars} style={styles.histRow}>
                <View style={styles.histLabel}>
                  <Text style={styles.histNumber}>{stars}</Text>
                  <Ionicons name="star" size={12} color="#fbbf24" />
                </View>
                <View style={styles.histTrack}>
                  <View style={[styles.histFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.histCount}>{count}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Reseñas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reseñas recientes</Text>
        <View style={styles.card}>
          {recent_reviews.length === 0 ? (
            <Text style={styles.empty}>Sin reseñas todavía.</Text>
          ) : (
            recent_reviews.map((r, i) => (
              <ReviewItem key={r.id} review={r} last={i === recent_reviews.length - 1} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  )
}

function ReviewItem({ review, last }: { review: PublicReview; last: boolean }) {
  const date = new Date(review.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  const initial = review.reviewer.name.charAt(0).toUpperCase()
  return (
    <View style={[styles.reviewRow, !last && styles.reviewDivider]}>
      <View style={styles.reviewerAvatar}>
        <Text style={styles.reviewerInitial}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <Stars value={review.rating} small />
        {review.comment && (
          <Text style={styles.reviewComment}>{review.comment}</Text>
        )}
      </View>
    </View>
  )
}

function Stars({ value, small }: { value: number; small?: boolean }) {
  const size = small ? 14 : 20
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons
          key={i}
          name={i <= value ? "star" : "star-outline"}
          size={size}
          color={i <= value ? "#fbbf24" : "#cbd5e1"}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  error: { color: "#dc2626", textAlign: "center", paddingHorizontal: 30 },

  headerCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  avatarBig: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#6366f1",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  avatarInitial: { color: "#fff", fontSize: 42, fontWeight: "900" },
  name: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  role: { fontSize: 12, fontWeight: "700", color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  metaRow: { flexDirection: "row", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#64748b" },
  bioBox: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#f1f5f9", width: "100%" },
  bio: { fontSize: 14, color: "#334155", lineHeight: 20, textAlign: "center" },

  statsRow: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  statCard: {
    flex: 1, backgroundColor: "#fff",
    borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  statBig: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginTop: 6 },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: "600" },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },

  histRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  histLabel: { flexDirection: "row", alignItems: "center", gap: 3, width: 30 },
  histNumber: { fontSize: 13, fontWeight: "700", color: "#334155" },
  histTrack: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  histFill:  { height: "100%", backgroundColor: "#fbbf24", borderRadius: 4 },
  histCount: { width: 28, textAlign: "right", fontSize: 12, color: "#64748b" },

  empty: { color: "#94a3b8", textAlign: "center", paddingVertical: 20 },
  reviewRow: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  reviewDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  reviewerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#e0e7ff",
    alignItems: "center", justifyContent: "center",
  },
  reviewerInitial: { color: "#4338ca", fontWeight: "800", fontSize: 16 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 },
  reviewerName: { fontWeight: "700", color: "#0f172a", fontSize: 14 },
  reviewDate:   { color: "#94a3b8", fontSize: 11 },
  reviewComment:{ marginTop: 6, fontSize: 13, color: "#475569", lineHeight: 18 },
})
