import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useMyMatches, type SwipeHistoryItem } from '../hooks/useMyMatches'

export default function MatchesScreen() {
  const { items, isLoading, error, refetch } = useMyMatches()

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    )
  }

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis solicitudes</Text>
          <Text style={styles.subtitle}>
            {items.length} {items.length === 1 ? 'piso solicitado' : 'pisos solicitados'}
          </Text>
        </View>
        <View style={styles.iconBox}>
          <Ionicons name="heart" size={20} color="#10b981" />
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={styles.errorTxt}>{error}</Text>
        </View>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <View style={[styles.flex, styles.center, { padding: 32 }]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={32} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>Aún no has solicitado ningún piso</Text>
          <Text style={styles.emptySub}>
            Vuelve a la pestaña de descubrir y desliza a la derecha los pisos que te gusten.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0f172a" />}
          renderItem={({ item }) => <MatchCard item={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

function MatchCard({ item }: { item: SwipeHistoryItem }) {
  const cover = item.property.images?.[0]?.url
  const score = item.compatibility_score
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#64748b'
  const scoreBg    = score >= 80 ? '#d1fae5' : score >= 60 ? '#fef3c7' : '#f1f5f9'

  return (
    <View style={styles.card}>
      {cover ? (
        <Image source={cover} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color="#cbd5e1" />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.property.title}</Text>
          <View style={[styles.scoreChip, { backgroundColor: scoreBg }]}>
            <Text style={[styles.scoreTxt, { color: scoreColor }]}>{score}%</Text>
          </View>
        </View>
        <View style={styles.cardLocation}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.cardLocationTxt}>{item.property.location.city}</Text>
        </View>
        <View style={styles.cardBottomRow}>
          <Text style={styles.cardSpecs}>
            {item.property.specs.rooms} hab · {item.property.specs.size_m2}m²
          </Text>
          <Text style={styles.cardPrice}>{item.property.pricing.amount}€</Text>
        </View>
        <View style={styles.cardStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusTxt}>Solicitud enviada</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: '#f8fafc' },
  center:  { alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  title:    { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  iconBox:  {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center',
  },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', paddingHorizontal: 16, paddingVertical: 10,
  },
  errorTxt: { color: '#991b1b', fontSize: 12, flex: 1 },

  list:    { padding: 16, gap: 12 },
  card:    {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    padding: 12, gap: 12, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImage: { width: 96, height: 96, borderRadius: 12, backgroundColor: '#e2e8f0' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody:  { flex: 1, justifyContent: 'space-between' },

  cardTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle:   { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 },
  scoreChip:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  scoreTxt:    { fontSize: 11, fontWeight: '800' },

  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardLocationTxt: { fontSize: 12, color: '#64748b' },

  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardSpecs:    { fontSize: 12, color: '#64748b' },
  cardPrice:    { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  cardStatus:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
  statusTxt:    { fontSize: 11, color: '#475569', fontWeight: '500' },

  emptyIcon:    {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 6 },
  emptySub:     { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19 },
})
