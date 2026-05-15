/**
 * FavoritesScreen — Pisos guardados como favoritos en móvil.
 * Tab o pantalla en el stack, muestra tarjetas con botón de quitar.
 */
import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { apiGet, apiDelete } from '../api/client'

interface FavProperty {
  id: number; title: string; type?: string
  pricing?: { amount: number }
  location?: { city: string }
  specs?: { rooms: number; size_m2: number }
  images?: Array<{ url: string }>
  compatibility_score?: number
}

function ScorePill({ score }: { score?: number }) {
  if (!score) return null
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#64748b'
  return (
    <View style={[styles.scorePill, { backgroundColor: color }]}>
      <Text style={styles.scoreTxt}>{score}%</Text>
    </View>
  )
}

function PropertyCard({ item, onPress, onRemove }: { item: FavProperty; onPress: () => void; onRemove: () => void }) {
  const img = item.images?.[0]?.url
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
      <View style={styles.cardImg}>
        {img
          ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <View style={styles.noImg}><Ionicons name="home-outline" size={28} color="#cbd5e1" /></View>
        }
        <ScorePill score={item.compatibility_score} />
        <TouchableOpacity onPress={onRemove} style={styles.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="heart" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {item.location?.city} · {item.specs?.rooms} hab · {item.specs?.size_m2}m²
        </Text>
        <Text style={styles.cardPrice}>{item.pricing?.amount}€<Text style={styles.cardPricePer}>/mes</Text></Text>
      </View>
    </TouchableOpacity>
  )
}

export default function FavoritesScreen() {
  const navigation = useNavigation<any>()
  const [items,   setItems]   = useState<FavProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRef]  = useState(false)

  const load = useCallback(async (refresh = false) => {
    refresh ? setRef(true) : setLoading(true)
    try {
      const data = await apiGet<any>('/me/favorites')
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setItems(list)
    } catch { setItems([]) }
    finally { setLoading(false); setRef(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleRemove = (id: number) => {
    Alert.alert('Quitar favorito', '¿Eliminar este piso de tus favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive',
        onPress: async () => {
          setItems(prev => prev.filter(p => p.id !== id))
          try { await apiDelete(`/me/favorites/${id}`) } catch {}
        },
      },
    ])
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis favoritos</Text>
        <Text style={styles.subtitle}>{items.length} piso{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listPadding}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7c3aed" />}
          renderItem={({ item }) => (
            <PropertyCard
              item={item}
              onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id, property: item })}
              onRemove={() => handleRemove(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={36} color="#7c3aed" />
              </View>
              <Text style={styles.emptyTitle}>Sin favoritos todavía</Text>
              <Text style={styles.emptyTxt}>Pulsa ❤️ en cualquier piso para guardarlo aquí</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Feed')} style={styles.cta}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.ctaTxt}>Explorar pisos</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const CARD_W = (Platform.OS === 'android' ? 390 : 393) / 2 - 24

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title:    { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  listPadding:   { padding: 12 },
  emptyContainer:{ flex: 1, justifyContent: 'center', padding: 24 },

  row: { gap: 12, marginBottom: 12 },

  card:    { width: CARD_W, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardImg: { height: 130, backgroundColor: '#f1f5f9', position: 'relative' },
  noImg:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scorePill:{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  scoreTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardBody: { padding: 10 },
  cardTitle:{ fontSize: 12, fontWeight: '700', color: '#0f172a', lineHeight: 16, marginBottom: 3 },
  cardSub:  { fontSize: 10, color: '#94a3b8', marginBottom: 6 },
  cardPrice:{ fontSize: 15, fontWeight: '800', color: '#059669' },
  cardPricePer: { fontSize: 10, fontWeight: '400', color: '#94a3b8' },

  empty:     { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyTxt:  { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  cta:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  ctaTxt:    { color: '#fff', fontWeight: '700', fontSize: 14 },
})
