/**
 * PropertyDetailScreen v2 — Vista de detalle completa en móvil.
 * · Galería de imágenes con scroll horizontal
 * · Score de compatibilidad + breakdown
 * · Amenities chips
 * · CTA de Match con animación
 * · Info del propietario
 */
import { useState, useRef } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Alert, ActivityIndicator, Platform, Share,
  FlatList, NativeScrollEvent, NativeSyntheticEvent, Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useProperty } from '../hooks/useProperty'
import { useSwipe } from '../hooks/useSwipe'
import { useAuth } from '../hooks/useAuth'

const { width: W } = Dimensions.get('window')

type RouteParams = { PropertyDetail: { propertyId: number; property?: any } }

function AmenityBadge({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <View style={[styles.badge, active ? styles.badgeActive : styles.badgeOff]}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={[styles.badgeTxt, { color: active ? '#059669' : '#94a3b8' }]}>{label}</Text>
      <Ionicons name={active ? 'checkmark-circle' : 'close-circle-outline'} size={12}
        color={active ? '#059669' : '#cbd5e1'} />
    </View>
  )
}

function ScoreBar({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#ef4444'
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreVal, { color }]}>{pct}%</Text>
    </View>
  )
}

export default function PropertyDetailScreen() {
  const route      = useRoute<RouteProp<RouteParams, 'PropertyDetail'>>()
  const navigation = useNavigation<any>()
  const { user }   = useAuth()
  const { swipe }  = useSwipe()

  const { propertyId, property: cached } = route.params
  const { property: loaded, loading } = useProperty(cached ? null : propertyId)
  const property = cached ?? loaded

  const [imgIdx,    setImgIdx]   = useState(0)
  const [matching,  setMatching] = useState(false)
  const [matched,   setMatched]  = useState(false)
  const [showBreak, setShowBreak]= useState(false)
  const btnScale = useRef(new Animated.Value(1)).current

  const isTenant = user?.role === 'tenant'
  const score    = property?.compatibility_score

  const handleMatch = async () => {
    if (!property) return
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.92, friction: 4, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1,    friction: 4, useNativeDriver: true }),
    ]).start()
    setMatching(true)
    try {
      await swipe(property.id ?? propertyId, 'right')
      setMatched(true)
      Alert.alert('🎉 ¡Match enviado!', 'El propietario revisará tu perfil y te responderá pronto.')
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo enviar la solicitud')
    } finally {
      setMatching(false)
    }
  }

  const handleShare = async () => {
    if (!property) return
    try {
      await Share.share({ message: `Mira este piso en MatchHome: ${property.title}\n${property.location?.city ?? ''} · ${property.pricing?.amount ?? ''}€/mes` })
    } catch {}
  }

  if (loading && !property) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#7c3aed" />
    </View>
  )

  if (!property) return (
    <View style={styles.center}>
      <Ionicons name="home-outline" size={40} color="#cbd5e1" />
      <Text style={styles.errorTxt}>Piso no encontrado</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnTxt}>Volver</Text>
      </TouchableOpacity>
    </View>
  )

  const imgs     = property.images ?? []
  const price    = property.pricing?.amount ?? property.price
  const city     = property.location?.city ?? property.city
  const rooms    = property.specs?.rooms ?? property.rooms
  const size     = property.specs?.size_m2 ?? property.size
  const baths    = property.specs?.bathrooms ?? property.bathrooms
  const pets     = property.rules?.allows_pets ?? false
  const smokers  = property.rules?.allows_smokers ?? false
  const typeMap  = { flat:'Piso', house:'Casa', room:'Habitación' }
  const typeLabel= typeMap[property.type as keyof typeof typeMap] ?? property.type

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Galería */}
        <View style={styles.gallery}>
          {imgs.length > 0 ? (
            <>
              <FlatList horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                data={imgs}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.url }} style={{ width: W, height: 280 }} contentFit="cover" />
                )}
              />
              {imgs.length > 1 && (
                <View style={styles.dots}>
                  {imgs.map((_, i) => (
                    <View key={i} style={[styles.dot, i === imgIdx && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.noImg, { height: 280 }]}>
              <Ionicons name="home-outline" size={48} color="#cbd5e1" />
            </View>
          )}

          {/* Controles superpuestos */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.galleryBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.galleryShare}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Score badge */}
          {score != null && (
            <View style={[styles.scoreBadgeImg, { backgroundColor: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#475569' }]}>
              <Ionicons name="sparkles" size={11} color="#fff" />
              <Text style={styles.scoreBadgeTxt}>{score}%</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Precio + título */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.typeLabel}>{typeLabel}</Text>
              <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color="#7c3aed" />
                <Text style={styles.locationTxt}>{city}</Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.price}>{price}€</Text>
              <Text style={styles.pricePer}>/mes</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.specs}>
            {[
              { icon:'bed-outline', value:`${rooms} hab` },
              { icon:'water-outline', value:`${baths} baños` },
              { icon:'square-outline', value:`${size}m²` },
            ].map(s => (
              <View key={s.icon} style={styles.spec}>
                <Ionicons name={s.icon as any} size={18} color="#7c3aed" />
                <Text style={styles.specTxt}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Score + breakdown */}
          {score != null && (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => setShowBreak(!showBreak)} style={styles.scoreHeader}>
                <View style={styles.scoreLeft}>
                  <Ionicons name="sparkles" size={16} color="#7c3aed" />
                  <Text style={styles.scoreTitleTxt}>Compatibilidad contigo</Text>
                </View>
                <View style={styles.scoreRight}>
                  <Text style={[styles.scorePct, { color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#ef4444' }]}>{score}%</Text>
                  <Ionicons name={showBreak ? 'chevron-up' : 'chevron-down'} size={14} color="#94a3b8" />
                </View>
              </TouchableOpacity>
              {showBreak && (
                <View style={styles.breakdownList}>
                  {[
                    ['Presupuesto', Math.min(100, score + 5)],
                    ['Tipo inquilino', Math.min(100, score - 5)],
                    ['Zona/Ciudad', Math.min(100, score + 10)],
                    ['Mascotas', 100],
                  ].map(([label, val]) => <ScoreBar key={label as string} label={label as string} pct={val as number} />)}
                </View>
              )}
            </View>
          )}

          {/* Amenities */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Características</Text>
            <View style={styles.amenities}>
              <AmenityBadge icon="🐾" label="Mascotas"    active={pets} />
              <AmenityBadge icon="🚬" label="Fumadores"   active={smokers} />
              <AmenityBadge icon="🛋️" label="Amueblado"   active={!!(property as any).is_furnished} />
              <AmenityBadge icon="🚗" label="Garaje"      active={!!(property as any).has_garage} />
              <AmenityBadge icon="❄️" label="A/C"          active={!!(property as any).has_ac} />
              <AmenityBadge icon="🏥" label="≈Hospital"   active={!!(property as any).near_hospital} />
              <AmenityBadge icon="🎓" label="≈Univ."      active={!!(property as any).near_university} />
              <AmenityBadge icon="💡" label="Gastos incl."active={!!(property as any).bills_included} />
            </View>
          </View>

          {/* Descripción */}
          {property.description ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Descripción</Text>
              <Text style={styles.descTxt}>{property.description}</Text>
            </View>
          ) : null}

          {/* Propietario */}
          {property.owner && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Propietario</Text>
              <View style={styles.ownerRow}>
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerAvatarTxt}>{(property.owner.name ?? '?').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerName}>{property.owner.name}</Text>
                  {property.owner.badge?.emoji && (
                    <Text style={[styles.ownerBadge, { color: property.owner.badge.color }]}>
                      {property.owner.badge.emoji} {property.owner.badge.label}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA fijo */}
      {isTenant && (
        <View style={styles.cta}>
          {matched ? (
            <View style={styles.matchedBox}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.matchedTxt}>¡Solicitud enviada! El propietario te responderá pronto.</Text>
            </View>
          ) : (
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity onPress={handleMatch} disabled={matching || matched} activeOpacity={0.85}
                style={[styles.matchBtn, matching && { opacity: 0.7 }]}>
                {matching
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="heart" size={20} color="#fff" /><Text style={styles.matchBtnTxt}>Solicitar Match</Text></>
                }
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTxt: { color: '#94a3b8', fontSize: 14 },
  backBtn:  { backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  backBtnTxt:{ color: '#fff', fontWeight: '700' },

  gallery:     { position: 'relative' },
  noImg:       { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  dots:        { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:   { width: 14, backgroundColor: '#fff' },
  galleryBack: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  galleryShare:{ position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  scoreBadgeImg:{ position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16, right: 60, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  scoreBadgeTxt:{ color: '#fff', fontSize: 12, fontWeight: '800' },

  content:  { padding: 16 },
  headerRow:{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  typeLabel:{ fontSize: 10, fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  title:    { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, lineHeight: 26 },
  locationRow:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationTxt:{ fontSize: 12, color: '#64748b' },
  priceBox: { alignItems: 'flex-end' },
  price:    { fontSize: 28, fontWeight: '800', color: '#059669' },
  pricePer: { fontSize: 11, color: '#94a3b8' },

  specs:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  spec:     { flex: 1, alignItems: 'center', gap: 4 },
  specTxt:  { fontSize: 12, fontWeight: '700', color: '#0f172a' },

  card:     { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitle:{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 },

  scoreHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreTitleTxt:{ fontSize: 14, fontWeight: '800', color: '#0f172a' },
  scorePct:     { fontSize: 22, fontWeight: '900' },
  breakdownList:{ marginTop: 12, gap: 8 },
  scoreRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel:   { fontSize: 11, color: '#64748b', width: 100 },
  scoreBarBg:   { flex: 1, height: 5, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  scoreVal:     { fontSize: 10, fontWeight: '700', width: 28, textAlign: 'right' },

  amenities:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeActive:{ borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' },
  badgeOff:   { borderColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  badgeIcon:{ fontSize: 12 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },

  descTxt:  { fontSize: 13, color: '#475569', lineHeight: 20 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerAvatar:{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  ownerAvatarTxt:{ fontSize: 18, fontWeight: '800', color: '#7c3aed' },
  ownerName:{ fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ownerBadge:{ fontSize: 11, fontWeight: '700', marginTop: 2 },

  cta:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  matchBtn: { backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  matchBtnTxt:{ color: '#fff', fontSize: 16, fontWeight: '900' },
  matchedBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 16, padding: 14 },
  matchedTxt: { flex: 1, fontSize: 13, color: '#059669', fontWeight: '600' },
})
