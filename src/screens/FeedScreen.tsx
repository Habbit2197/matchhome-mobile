import { useState, useRef, useMemo } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Animated, PanResponder, Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useFeed } from '../hooks/useFeed'
import { useSwipe } from '../hooks/useSwipe'
import type { Property } from '../types'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_W * 0.25

export default function FeedScreen() {
  const { properties, isLoading, error, refetch } = useFeed()
  const { swipe } = useSwipe()

  const [index, setIndex]       = useState(0)
  const [matchInfo, setMatch]   = useState<{ score: number; title: string } | null>(null)
  const position                = useRef(new Animated.ValueXY()).current
  const swipingRef              = useRef(false)

  const current = properties[index]
  const navigation = useNavigation<any>()
  const next    = properties[index + 1]

  // Rotación de la card según movimiento horizontal
  const rotate = position.x.interpolate({
    inputRange:  [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  })

  // Opacidad del overlay LIKE/NOPE
  const likeOpacity = position.x.interpolate({
    inputRange:  [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })
  const nopeOpacity = position.x.interpolate({
    inputRange:  [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  // Próxima card crece según deslizamiento
  const nextScale = position.x.interpolate({
    inputRange:  [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  })

  const finishSwipe = async (direction: 'right' | 'left', toX: number) => {
    if (!current || swipingRef.current) return
    swipingRef.current = true

    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      // Llamada al backend
      const result = await swipe(current.id, direction)
      if (result?.lead_created) {
        setMatch({ score: result.compatibility_score, title: current.title })
        setTimeout(() => setMatch(null), 1800)
      }
      // Avanzar
      setIndex(i => i + 1)
      position.setValue({ x: 0, y: 0 })
      swipingRef.current = false
    })
  }

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder:  () => !swipingRef.current && !!current,
    onMoveShouldSetPanResponder:   () => !swipingRef.current && !!current,
    onPanResponderMove:  Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD)       finishSwipe('right', SCREEN_W * 1.5)
      else if (g.dx < -SWIPE_THRESHOLD) finishSwipe('left', -SCREEN_W * 1.5)
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 5 }).start()
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [current])

  const handleManualSwipe = (dir: 'right' | 'left') => {
    if (!current || swipingRef.current) return
    finishSwipe(dir, dir === 'right' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5)
  }

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    )
  }

  // Error
  if (error) {
    return (
      <View style={[styles.flex, styles.center, { padding: 24 }]}>
        <Ionicons name="cloud-offline" size={48} color="#94a3b8" />
        <Text style={styles.emptyTitle}>Sin conexión</Text>
        <Text style={styles.emptySub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryBtnTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // No quedan más pisos
  if (!current) {
    return (
      <View style={[styles.flex, styles.center, { padding: 24 }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="checkmark-done" size={32} color="#10b981" />
        </View>
        <Text style={styles.emptyTitle}>¡Has visto todo!</Text>
        <Text style={styles.emptySub}>
          Has revisado todos los pisos disponibles. Vuelve más tarde para ver nuevas publicaciones.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setIndex(0); refetch() }}>
          <Text style={styles.retryBtnTxt}>Recargar feed</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoTxt}>M</Text>
        </View>
        <Text style={styles.headerTitle}>MatchHome</Text>
        <View style={styles.counter}>
          <Text style={styles.counterTxt}>{index + 1}/{properties.length}</Text>
        </View>
      </View>

      {/* Stack de cards */}
      <View style={styles.deck}>
        {/* Card de fondo (la siguiente) */}
        {next && (
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ scale: nextScale }] }]}>
            <PropertyCardContent property={next} />
          </Animated.View>
        )}

        {/* Card actual con gestos */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.card, {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          }]}
        >
          <PropertyCardContent property={current} />

          {/* Overlay LIKE */}
          <Animated.View style={[styles.overlay, styles.overlayLike, { opacity: likeOpacity }]}>
            <Text style={styles.overlayText}>MATCH</Text>
          </Animated.View>

          {/* Overlay NOPE */}
          <Animated.View style={[styles.overlay, styles.overlayNope, { opacity: nopeOpacity }]}>
            <Text style={styles.overlayText}>NOPE</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Botones */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleManualSwipe('left')} style={[styles.actionBtn, styles.btnNope]}>
          <Ionicons name="close" size={32} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => current && navigation.navigate('PropertyDetail', { propertyId: current.id })}
          style={[styles.actionBtn, styles.btnDetails]}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={28} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleManualSwipe('right')} style={[styles.actionBtn, styles.btnLike]}>
          <Ionicons name="heart" size={28} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Match toast */}
      {matchInfo && (
        <View style={styles.matchToast}>
          <View style={styles.matchIcon}>
            <Ionicons name="sparkles" size={20} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle}>¡Solicitud enviada!</Text>
            <Text style={styles.matchSub}>Compatibilidad: {matchInfo.score}%</Text>
          </View>
        </View>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────
function PropertyCardContent({ property }: { property: Property }) {
  const cover = property.images?.[0]?.url
  const typeLabel = property.type === 'flat' ? 'Piso' : property.type === 'house' ? 'Casa' : 'Habitación'

  return (
    <View style={styles.cardInner}>
      {cover ? (
        <Image source={cover} style={styles.cardImage} contentFit="cover" transition={300} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={48} color="#cbd5e1" />
        </View>
      )}

      {/* Gradiente fondo */}
      <View style={styles.gradient} />

      {/* Tag tipo */}
      <View style={styles.typeTag}>
        <Text style={styles.typeTagTxt}>{typeLabel}</Text>
      </View>

      {/* Info abajo */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.cardPrice}>{property.pricing.amount}€</Text>
        </View>
        <View style={styles.cardLocation}>
          <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
          <Text style={styles.cardLocationTxt}>{property.location.city} · {property.location.zip_code}</Text>
        </View>
        <View style={styles.cardSpecs}>
          <Spec icon="bed" value={`${property.specs.rooms} hab`} />
          <Spec icon="water" value={`${property.specs.bathrooms} baño${property.specs.bathrooms > 1 ? 's' : ''}`} />
          <Spec icon="resize" value={`${property.specs.size_m2}m²`} />
        </View>
      </View>
    </View>
  )
}

function Spec({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={13} color="#fff" />
      <Text style={styles.specTxt}>{value}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────
const CARD_W = SCREEN_W - 24
const CARD_H = SCREEN_H * 0.68

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: '#f8fafc' },
  center:      { alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 12, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  logo: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
  },
  logoTxt:     { color: '#fff', fontSize: 14, fontWeight: '800' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  counter:     { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 99 },
  counterTxt:  { fontSize: 11, fontWeight: '700', color: '#475569' },

  deck:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:        {
    position: 'absolute',
    width: CARD_W, height: CARD_H,
    borderRadius: 24, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },
  cardBack:    { transform: [{ scale: 0.95 }] },
  cardInner:   { flex: 1 },
  cardImage:   { width: '100%', height: '100%', backgroundColor: '#e2e8f0' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  gradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  typeTag: {
    position: 'absolute', top: 16, left: 16,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8,
  },
  typeTagTxt: { fontSize: 10, fontWeight: '800', color: '#0f172a', letterSpacing: 0.5 },

  cardInfo:    { position: 'absolute', left: 18, right: 18, bottom: 22 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  cardTitle:   { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5, flex: 1 },
  cardPrice:   { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  cardLocation:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  cardLocationTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  cardSpecs:   { flexDirection: 'row', gap: 14 },
  spec:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specTxt:     { color: '#fff', fontSize: 12, fontWeight: '600' },

  overlay: {
    position: 'absolute', top: 32,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 4, borderRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  overlayLike: { right: 28, borderColor: '#10b981' },
  overlayNope: { left: 28, borderColor: '#ef4444', transform: [{ rotate: '15deg' }] },
  overlayText: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: 1 },

  actions: {
    flexDirection: 'row', justifyContent: 'center', gap: 28,
    paddingVertical: 24, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  actionBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1.5,
  },
  btnNope:     { borderColor: '#fee2e2' },
  btnLike:     { borderColor: '#d1fae5' },
  btnDetails:  { width: 56, height: 56, borderRadius: 28, borderColor: '#cbd5e1', transform: [{ scale: 0.92 }] },

  matchToast: {
    position: 'absolute', top: Platform.OS === 'ios' ? 110 : 90,
    left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  matchIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  matchTitle:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  matchSub:    { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  emptyIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle:  { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  emptySub:    { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn:    { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0f172a', borderRadius: 12 },
  retryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
