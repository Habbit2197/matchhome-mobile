/**
 * FeedScreen v2 — Card del piso mejorada con score, amenities, tipo y detalles completos.
 * Botones rediseñados con etiquetas y animaciones.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Animated, PanResponder, Platform, ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useFeed } from '../hooks/useFeed'
import { useSwipe } from '../hooks/useSwipe'

const { width: W, height: H } = Dimensions.get('window')
const SWIPE_THRESHOLD = W * 0.25

// ── Card mejorada ─────────────────────────────────────────────────
function PropertyCard({ property, position, likeOpacity, nopeOpacity, panHandlers, cardScale, cardOpacity }: any) {
  const imgs   = property.images ?? []
  const cover  = imgs[0]?.url
  const score  = property.compatibility_score
  const price  = property.pricing?.amount ?? property.price
  const city   = property.location?.city ?? property.city
  const rooms  = property.specs?.rooms ?? property.rooms
  const size   = property.specs?.size_m2 ?? property.size
  const baths  = property.specs?.bathrooms ?? property.bathrooms
  const type   = property.type
  const typeLabel = type === 'flat' ? 'Piso' : type === 'house' ? 'Casa' : 'Habitación'

  const amenities = [
    property.rules?.allows_pets && '🐾',
    (property as any).is_furnished && '🛋️',
    (property as any).has_garage && '🚗',
    (property as any).near_hospital && '🏥',
    (property as any).near_university && '🎓',
    (property as any).has_ac && '❄️',
  ].filter(Boolean) as string[]

  const rotate = position.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  })

  return (
    <Animated.View
      {...panHandlers}
      style={[styles.card, {
        opacity: cardOpacity,
        transform: [...position.getTranslateTransform(), { rotate }, { scale: cardScale }],
      }]}
    >
      {/* Overlays */}
      <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
        <View style={styles.overlayBadge}><Text style={styles.overlayTxt}>MATCH ❤️</Text></View>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.nopeOverlay, { opacity: nopeOpacity }]}>
        <View style={[styles.overlayBadge, { backgroundColor: '#ef4444' }]}><Text style={styles.overlayTxt}>PASAR ✕</Text></View>
      </Animated.View>

      {/* Imagen */}
      <View style={styles.imgWrap}>
        {cover
          ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <View style={styles.noImg}><Ionicons name="home-outline" size={48} color="#cbd5e1" /></View>
        }
        {/* Gradiente inferior */}
        <View style={styles.imgGradient} />

        {/* Badges superiores */}
        <View style={styles.topBadges}>
          <View style={styles.typeBadge}><Text style={styles.typeBadgeTxt}>{typeLabel}</Text></View>
          {amenities.slice(0, 3).map((a, i) => (
            <View key={i} style={styles.amenityBadge}><Text style={{ fontSize: 13 }}>{a}</Text></View>
          ))}
        </View>

        {/* Score badge */}
        {score != null && (
          <View style={[styles.scoreBadge, {
            backgroundColor: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#475569'
          }]}>
            <Ionicons name="sparkles" size={10} color="#fff" />
            <Text style={styles.scoreTxt}>{score}% match</Text>
          </View>
        )}

        {/* Precio sobre la imagen */}
        <View style={styles.priceOverlay}>
          <Text style={styles.priceMain}>{price?.toLocaleString('es-ES')}€</Text>
          <Text style={styles.priceSub}>/mes</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>

        {/* Specs row */}
        <View style={styles.specsRow}>
          <View style={styles.spec}>
            <Ionicons name="location-outline" size={13} color="#7c3aed" />
            <Text style={styles.specTxt}>{city}</Text>
          </View>
          <View style={styles.specDot} />
          <View style={styles.spec}>
            <Ionicons name="bed-outline" size={13} color="#64748b" />
            <Text style={styles.specTxt}>{rooms} hab</Text>
          </View>
          <View style={styles.specDot} />
          <View style={styles.spec}>
            <Ionicons name="square-outline" size={13} color="#64748b" />
            <Text style={styles.specTxt}>{size}m²</Text>
          </View>
          {baths && <>
            <View style={styles.specDot} />
            <View style={styles.spec}>
              <Ionicons name="water-outline" size={13} color="#64748b" />
              <Text style={styles.specTxt}>{baths} baños</Text>
            </View>
          </>}
        </View>

        {/* Amenities */}
        {amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {amenities.map((a, i) => (
              <View key={i} style={styles.amenityChip}>
                <Text style={styles.amenityChipTxt}>{a} {
                  a === '🐾' ? 'Mascotas' : a === '🛋️' ? 'Amueblado' :
                  a === '🚗' ? 'Garaje' : a === '🏥' ? '≈Hospital' :
                  a === '🎓' ? '≈Univ.' : 'A/C'
                }</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  )
}

// ── Botones rediseñados ──────────────────────────────────────────
function ActionButtons({ onLeft, onSuper, onRight, onInfo, disabled }: {
  onLeft: () => void; onSuper: () => void; onRight: () => void
  onInfo: () => void; disabled?: boolean
}) {
  const scales = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current,
                  useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current]

  const press = (i: number, fn: () => void) => {
    if (disabled) return
    Animated.sequence([
      Animated.spring(scales[i], { toValue: 0.85, friction: 4, tension: 300, useNativeDriver: true }),
      Animated.spring(scales[i], { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start(); fn()
  }

  const BTNS = [
    { i: 0, fn: onLeft,  icon: 'close',        bg: '#fff', iconColor: '#ef4444', label: 'Pasar',   size: 24, border: '#fee2e2' },
    { i: 1, fn: onSuper, icon: 'star',          bg: '#fff', iconColor: '#f59e0b', label: 'Super',   size: 20, border: '#fef3c7' },
    { i: 2, fn: onRight, icon: 'heart',         bg: '#7c3aed', iconColor: '#fff',label: 'Match!',  size: 26, border: '#7c3aed', primary: true },
    { i: 3, fn: onInfo,  icon: 'information-circle-outline', bg: '#fff', iconColor: '#6366f1', label: 'Info', size: 18, border: '#e0e7ff' },
  ]

  return (
    <View style={styles.btnRow}>
      {BTNS.map(b => (
        <Animated.View key={b.i} style={{ transform: [{ scale: scales[b.i] }], alignItems: 'center' }}>
          <TouchableOpacity onPress={() => press(b.i, b.fn)} disabled={disabled}
            style={[styles.actionBtn,
              b.primary ? styles.actionBtnPrimary : {},
              { backgroundColor: b.bg, borderColor: b.border, width: b.primary ? 68 : 56, height: b.primary ? 68 : 56, borderRadius: b.primary ? 34 : 28 }
            ]}>
            <Ionicons name={b.icon as any} size={b.size} color={b.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.btnLabel, b.primary && { color: '#7c3aed', fontWeight: '700' }]}>{b.label}</Text>
        </Animated.View>
      ))}
    </View>
  )
}

// ── Pantalla ──────────────────────────────────────────────────────
export default function FeedScreen() {
  const { properties, isLoading, error, refetch } = useFeed()
  const { swipe } = useSwipe()
  const navigation = useNavigation<any>()

  const [index, setIndex] = useState(0)
  const [matched, setMatched] = useState<{ title: string; score: number } | null>(null)

  const position    = useRef(new Animated.ValueXY()).current
  const cardScale   = useRef(new Animated.Value(1)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const nextScale   = useRef(new Animated.Value(0.93)).current
  const matchAnim   = useRef(new Animated.Value(0)).current
  const swipingRef  = useRef(false)

  const current = properties[index]
  const next    = properties[index + 1]

  const likeOpacity = position.x.interpolate({ inputRange: [20, W * 0.3], outputRange: [0, 1], extrapolate: 'clamp' })
  const nopeOpacity = position.x.interpolate({ inputRange: [-W * 0.3, -20], outputRange: [1, 0], extrapolate: 'clamp' })

  useEffect(() => {
    if (!current) return
    cardOpacity.setValue(0); cardScale.setValue(0.92)
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start()
  }, [index, current])

  const animateSwipe = useCallback(async (dir: 'left' | 'right' | 'super') => {
    const toX = dir === 'left' ? -W * 1.4 : W * 1.4
    const toY = dir === 'super' ? -H * 0.7 : 40

    await new Promise<void>(resolve =>
      Animated.timing(position, { toValue: { x: toX, y: toY }, duration: 270, useNativeDriver: true })
        .start(() => resolve())
    )

    const prop = properties[index]
    if (prop && (dir === 'right' || dir === 'super')) {
      try {
        const res = await swipe(prop.id, dir === 'super' ? 'super' : 'right')
        if (res?.lead_created) {
          setMatched({ title: prop.title, score: res.compatibility_score ?? 0 })
          matchAnim.setValue(0)
          Animated.spring(matchAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start()
          setTimeout(() => Animated.timing(matchAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(), 2800)
        }
      } catch {}
    } else if (prop && dir === 'left') {
      try { await swipe(prop.id, 'left') } catch {}
    }

    position.setValue({ x: 0, y: 0 })
    swipingRef.current = false
    setIndex(i => i + 1)
  }, [index, properties, swipe])

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, { dx, dy }) => position.setValue({ x: dx, y: dy * 0.15 }),
    onPanResponderRelease: async (_, { dx, vx }) => {
      if (swipingRef.current) return
      if (dx > SWIPE_THRESHOLD || vx > 0.5) { swipingRef.current = true; await animateSwipe('right') }
      else if (dx < -SWIPE_THRESHOLD || vx < -0.5) { swipingRef.current = true; await animateSwipe('left') }
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: true }).start()
    },
  })).current

  const handleBtn = useCallback(async (dir: 'left' | 'right' | 'super') => {
    if (swipingRef.current || !current) return
    swipingRef.current = true
    await animateSwipe(dir)
  }, [current, animateSwipe])

  if (isLoading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#7c3aed" />
      <Text style={styles.loadingTxt}>Buscando pisos para ti...</Text>
    </View>
  )

  if (!current) return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}><Ionicons name="sparkles" size={40} color="#7c3aed" /></View>
      <Text style={styles.emptyTitle}>¡Has visto todos!</Text>
      <Text style={styles.emptyTxt}>Vuelve pronto para ver nuevas publicaciones</Text>
      <TouchableOpacity onPress={() => { setIndex(0); refetch() }} style={styles.retryBtn}>
        <Text style={styles.retryTxt}>Volver a empezar</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubrir</Text>
        <View style={styles.headerRight}>
          {properties.length > 0 && <Text style={styles.counter}>{index + 1}/{Math.min(properties.length, 20)}</Text>}
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Match badge */}
      {matched && (
        <Animated.View style={[styles.matchBadge, { transform: [{ scale: matchAnim }] }]}>
          <Text style={styles.matchTxt}>🎉 ¡Match enviado! {matched.score}% afinidad</Text>
        </Animated.View>
      )}

      {/* Deck */}
      <View style={styles.deck}>
        {next && (
          <Animated.View style={[styles.card, styles.nextCard, { transform: [{ scale: nextScale }] }]}>
            <Image source={{ uri: next.images?.[0]?.url }} style={[styles.imgWrap, { borderRadius: 24 }]} contentFit="cover" />
          </Animated.View>
        )}
        {current && (
          <PropertyCard property={current} position={position}
            likeOpacity={likeOpacity} nopeOpacity={nopeOpacity}
            panHandlers={panResponder.panHandlers}
            cardScale={cardScale} cardOpacity={cardOpacity} />
        )}
      </View>

      {/* Buttons */}
      <ActionButtons
        disabled={swipingRef.current}
        onLeft={()  => handleBtn('left')}
        onSuper={() => handleBtn('super')}
        onRight={() => handleBtn('right')}
        onInfo={() => navigation.navigate('PropertyDetail', { propertyId: current?.id, property: current })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counter:     { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  card: {
    position: 'absolute', width: W - 24,
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  nextCard: { height: H * 0.55 },

  // Imagen
  imgWrap:     { width: '100%', height: H * 0.38, position: 'relative' },
  noImg:       { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  imgGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.25)' },

  topBadges:   { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeBadge:   { backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '700' },
  amenityBadge:{ backgroundColor: 'rgba(255,255,255,0.9)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  scoreBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  scoreTxt:   { color: '#fff', fontSize: 11, fontWeight: '800' },

  priceOverlay: { position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceMain:    { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  priceSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },

  // Info
  info:      { padding: 14, paddingBottom: 16 },
  title:     { fontSize: 17, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, marginBottom: 6 },
  specsRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  spec:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  specTxt:   { fontSize: 12, color: '#64748b', fontWeight: '500' },
  specDot:   { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1' },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityChip:  { backgroundColor: '#f5f3ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#ede9fe' },
  amenityChipTxt:{ fontSize: 11, color: '#7c3aed', fontWeight: '600' },

  // Overlays
  overlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  likeOverlay: { backgroundColor: 'rgba(124,58,237,0.6)' },
  nopeOverlay: { backgroundColor: 'rgba(239,68,68,0.6)' },
  overlayBadge:{ backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  overlayTxt:  { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },

  // Botones
  btnRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start',
    gap: 16, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  actionBtnPrimary: { shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnLabel:  { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 4 },

  // Match badge
  matchBadge: { position: 'absolute', top: 120, alignSelf: 'center', zIndex: 100,
    backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30,
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  matchTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Empty / Loading
  loadingTxt: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyTxt:   { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  retryBtn:   { backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  retryTxt:   { color: '#fff', fontWeight: '700' },
})
