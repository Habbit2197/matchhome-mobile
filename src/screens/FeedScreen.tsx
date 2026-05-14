/**
 * FeedScreen — con animaciones mejoradas:
 * · Card de entrada: scale + fade al aparecer nueva card
 * · Overlay like/dislike: aparece con opacidad según velocidad de swipe
 * · Next card: escala suavemente de 0.93 → 0.97 → 1 según el swipe
 * · Match animation: corazón pulsante + badge bounce al hacer match
 * · Empty state: animación de entrada
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ActivityIndicator, Animated, PanResponder, Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useFeed }  from '../hooks/useFeed'
import { useSwipe } from '../hooks/useSwipe'
import type { Property } from '../types'

const { width: W, height: H } = Dimensions.get('window')
const SWIPE_THRESHOLD = W * 0.25

// ── Componente ────────────────────────────────────────────────────
export default function FeedScreen() {
  const { properties, isLoading, error, refetch } = useFeed()
  const { swipe } = useSwipe()
  const navigation = useNavigation<any>()

  const [index, setIndex]     = useState(0)
  const [matchInfo, setMatch] = useState<{ score: number; title: string } | null>(null)

  const position   = useRef(new Animated.ValueXY()).current
  const cardScale  = useRef(new Animated.Value(1)).current
  const cardOpacity= useRef(new Animated.Value(0)).current   // entrada de nueva card
  const nextScale  = useRef(new Animated.Value(0.93)).current
  const matchScale = useRef(new Animated.Value(0)).current   // match badge
  const swipingRef = useRef(false)

  const current = properties[index]
  const next    = properties[index + 1]

  // ── Animar entrada de card nueva ─────────────────────────────
  const animateCardIn = useCallback(() => {
    cardOpacity.setValue(0)
    cardScale.setValue(0.92)
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(cardScale,   { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start()
  }, [cardOpacity, cardScale])

  useEffect(() => {
    if (current) animateCardIn()
  }, [index, current])

  // ── Rotación ─────────────────────────────────────────────────
  const rotate = position.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
  })

  // Opacidad overlays (like / dislike)
  const likeOpacity = position.x.interpolate({
    inputRange: [20, W * 0.3],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })
  const nopeOpacity = position.x.interpolate({
    inputRange: [-W * 0.3, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  // Next card crece mientras arrastras
  const nextScaleDynamic = position.x.interpolate({
    inputRange: [-W * 0.5, 0, W * 0.5],
    outputRange: [1, 0.93, 1],
    extrapolate: 'clamp',
  })

  // ── PanResponder ─────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => {
        position.setValue({ x: dx, y: dy * 0.2 })
      },
      onPanResponderRelease: async (_, { dx, vx }) => {
        if (swipingRef.current) return

        if (dx > SWIPE_THRESHOLD || vx > 0.5) {
          swipingRef.current = true
          await animateSwipe('right')
        } else if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
          swipingRef.current = true
          await animateSwipe('left')
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: true }).start()
        }
      },
    })
  ).current

  const animateSwipe = useCallback(async (direction: 'left' | 'right') => {
    const toX = direction === 'right' ? W * 1.4 : -W * 1.4
    await new Promise<void>(resolve =>
      Animated.timing(position, { toValue: { x: toX, y: 40 }, duration: 280, useNativeDriver: true })
        .start(() => resolve())
    )

    const prop = properties[index]
    if (prop && direction === 'right') {
      try {
        const result = await swipe(prop.id, 'right')
        if (result?.lead_created) {
          setMatch({ score: result.compatibility_score ?? 0, title: prop.title })
          // Match badge animation
          matchScale.setValue(0)
          Animated.spring(matchScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start()
          setTimeout(() => {
            Animated.timing(matchScale, { toValue: 0, duration: 300, useNativeDriver: true }).start()
          }, 2500)
        }
      } catch {}
    } else if (prop && direction === 'left') {
      try { await swipe(prop.id, 'left') } catch {}
    }

    position.setValue({ x: 0, y: 0 })
    swipingRef.current = false
    setIndex(i => i + 1)
  }, [index, properties, swipe, matchScale])

  // ── Botones ──────────────────────────────────────────────────
  const handleButton = useCallback(async (dir: 'left' | 'right' | 'super') => {
    if (swipingRef.current || !current) return
    swipingRef.current = true
    if (dir === 'super') {
      // Super-like: rebota hacia arriba
      await new Promise<void>(resolve =>
        Animated.timing(position, { toValue: { x: 0, y: -H * 0.6 }, duration: 300, useNativeDriver: true })
          .start(() => resolve())
      )
      try { await swipe(current.id, 'super') } catch {}
    } else {
      await animateSwipe(dir)
      return
    }
    position.setValue({ x: 0, y: 0 })
    swipingRef.current = false
    setIndex(i => i + 1)
  }, [current, animateSwipe, swipe])

  // ── LOADING ──────────────────────────────────────────────────
  if (isLoading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#7c3aed" />
      <Text style={styles.loadingTxt}>Buscando pisos para ti...</Text>
    </View>
  )

  if (error) return (
    <View style={styles.center}>
      <Ionicons name="wifi-outline" size={48} color="#cbd5e1" />
      <Text style={styles.emptyTxt}>Sin conexión</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
        <Text style={styles.retryTxt}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  )

  // ── VACÍO ────────────────────────────────────────────────────
  if (!current) return (
    <View style={styles.center}>
      <Animated.View style={{ transform: [{ scale: cardScale }], opacity: cardOpacity }}>
        <View style={styles.emptyIcon}><Ionicons name="sparkles" size={40} color="#7c3aed" /></View>
        <Text style={styles.emptyTitle}>¡Has visto todos los pisos!</Text>
        <Text style={styles.emptyTxt}>Vuelve más tarde para ver nuevas publicaciones.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setIndex(0); refetch() }}>
          <Text style={styles.retryTxt}>Volver a empezar</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )

  const imgUrl = current.images?.[0]?.url
  const score  = current.compatibility_score

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubrir</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Match badge animado */}
      {matchInfo && (
        <Animated.View style={[styles.matchBadge, { transform: [{ scale: matchScale }] }]}>
          <Ionicons name="heart" size={20} color="#fff" />
          <Text style={styles.matchTxt}>Match enviado · {matchInfo.score}%</Text>
        </Animated.View>
      )}

      {/* Deck de cards */}
      <View style={styles.deck}>
        {/* Next card */}
        {next && (
          <Animated.View style={[styles.card, styles.nextCard, { transform: [{ scale: nextScaleDynamic }] }]}>
            <NextCardContent property={next} />
          </Animated.View>
        )}

        {/* Current card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.card, {
            opacity: cardOpacity,
            transform: [
              ...position.getTranslateTransform(),
              { rotate },
              { scale: cardScale },
            ],
          }]}
        >
          {/* Overlays */}
          <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
            <Ionicons name="heart" size={60} color="#fff" />
            <Text style={styles.overlayTxt}>SOLICITAR</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.nopeOverlay, { opacity: nopeOpacity }]}>
            <Ionicons name="close" size={60} color="#fff" />
            <Text style={styles.overlayTxt}>PASAR</Text>
          </Animated.View>

          {/* Imagen */}
          {imgUrl
            ? <Image source={{ uri: imgUrl }} style={styles.img} contentFit="cover" />
            : <View style={[styles.img, styles.noImg]}><Ionicons name="home-outline" size={60} color="#cbd5e1" /></View>
          }

          {/* Score badge */}
          {score != null && (
            <View style={[styles.scoreBadge, { backgroundColor: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626' }]}>
              <Text style={styles.scoreText}>{score}% match</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.price}>
              {current.pricing?.amount ?? current.price}€<Text style={styles.priceUnit}>/mes</Text>
            </Text>
            <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {current.location?.city ?? current.city}  ·  {current.specs?.rooms ?? current.rooms} hab  ·  {current.specs?.size_m2 ?? current.size}m²
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Botones */}
      <View style={styles.buttons}>
        <ActionBtn icon="close"      color="#ef4444" bg="#fef2f2" size={28} onPress={() => handleButton('left')}  />
        <ActionBtn icon="star"       color="#f59e0b" bg="#fffbeb" size={22} onPress={() => handleButton('super')} />
        <ActionBtn icon="heart"      color="#10b981" bg="#f0fdf4" size={28} onPress={() => handleButton('right')} />
        <ActionBtn icon="information-circle-outline" color="#6366f1" bg="#eef2ff" size={20}
          onPress={() => navigation.navigate('PropertyDetail', { property: current })} />
      </View>
    </View>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────
function NextCardContent({ property }: { property: Property }) {
  const imgUrl = property.images?.[0]?.url
  return (
    <>
      {imgUrl
        ? <Image source={{ uri: imgUrl }} style={styles.img} contentFit="cover" />
        : <View style={[styles.img, styles.noImg]}><Ionicons name="home-outline" size={60} color="#cbd5e1" /></View>
      }
      <View style={styles.info}>
        <Text style={styles.price}>{(property as any).pricing?.amount ?? (property as any).price}€<Text style={styles.priceUnit}>/mes</Text></Text>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
      </View>
    </>
  )
}

function ActionBtn({ icon, color, bg, size, onPress }: {
  icon: string; color: string; bg: string; size: number; onPress: () => void
}) {
  const scale = useRef(new Animated.Value(1)).current
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, friction: 4, tension: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    friction: 4, tension: 200, useNativeDriver: true }),
    ]).start()
    onPress()
  }
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.btn, { backgroundColor: bg, transform: [{ scale }] }]}>
        <Ionicons name={icon as any} size={size} color={color} />
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Estilos ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#f8fafc' },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f8fafc' },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12,
              backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },

  deck:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  card:     { position: 'absolute', width: W - 32, height: H * 0.56,
              borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff',
              shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12,
              shadowRadius: 20, elevation: 8 },
  nextCard: { position: 'absolute' },

  img:   { width: '100%', height: '65%' },
  noImg: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  overlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                 alignItems: 'center', justifyContent: 'center', borderRadius: 24, zIndex: 10 },
  likeOverlay: { backgroundColor: 'rgba(16,185,129,0.75)' },
  nopeOverlay: { backgroundColor: 'rgba(239,68,68,0.75)' },
  overlayTxt:  { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2, marginTop: 8 },

  scoreBadge: { position: 'absolute', top: 14, right: 14,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scoreText:  { color: '#fff', fontSize: 12, fontWeight: '800' },

  info:      { padding: 16 },
  price:     { fontSize: 26, fontWeight: '800', color: '#059669', letterSpacing: -0.5 },
  priceUnit: { fontSize: 14, fontWeight: '500', color: '#94a3b8' },
  title:     { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  sub:       { fontSize: 13, color: '#94a3b8', marginTop: 3 },

  buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
             gap: 12, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 20,
             paddingTop: 16, backgroundColor: '#fff',
             borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  btn:     { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
             shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
             shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },

  matchBadge: { position: 'absolute', top: 120, alignSelf: 'center',
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 12,
                borderRadius: 30, zIndex: 100,
                shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  matchTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },

  loadingTxt: { color: '#94a3b8', fontSize: 14, marginTop: 12 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f5f3ff',
                alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  emptyTxt:   { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  retryBtn:   { marginTop: 20, backgroundColor: '#7c3aed', paddingHorizontal: 24,
                paddingVertical: 12, borderRadius: 16, alignSelf: 'center' },
  retryTxt:   { color: '#fff', fontWeight: '700', fontSize: 14 },
})
