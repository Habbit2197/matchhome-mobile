/**
 * PropertyDetailScreen v4 — Detalle completo con score de afinidad prominente.
 * Galería deslizable, specs, amenities, score breakdown y CTA de match.
 */
import { useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, Share, Linking, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import { apiGet, apiPost } from '../api/client'

const { width: W } = Dimensions.get('window')

// ── Tipos ────────────────────────────────────────────────────────
interface Property {
  id: number; title: string; description?: string
  type?: string; city?: string; zip_code?: string
  price?: number; size?: number; rooms?: number; bathrooms?: number
  allows_pets?: boolean; allows_smokers?: boolean
  has_garage?: boolean; is_furnished?: boolean; has_ac?: boolean
  latitude?: number; longitude?: number
  images?: Array<{ url: string; image_path?: string }>
  owner?: { id: number; name: string }
  compatibility_score?: number
  location?: { city?: string; lat?: number; lng?: number }
  pricing?: { amount?: number }
  specs?: { rooms?: number; size_m2?: number; bathrooms?: number }
  rules?: { allows_pets?: boolean; allows_smokers?: boolean }
}

// ── Score ring visual ─────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color  = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#64748b'
  const label  = score >= 80 ? 'Alta' : score >= 60 ? 'Media' : 'Baja'
  const bg     = score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#f8fafc'
  return (
    <View style={[ss.scoreCard, { backgroundColor: bg, borderColor: color + '30' }]}>
      <View style={[ss.scoreRing, { borderColor: color }]}>
        <Text style={[ss.scoreNum, { color }]}>{score}</Text>
        <Text style={[ss.scorePct, { color }]}>%</Text>
      </View>
      <View>
        <Text style={ss.scoreTitle}>Afinidad</Text>
        <Text style={[ss.scoreLabel, { color }]}>{label}</Text>
      </View>
      <Ionicons name="sparkles" size={18} color={color} />
    </View>
  )
}

// ── Chip de amenidad ──────────────────────────────────────────────
function Chip({ icon, label, ok }: { icon: string; label: string; ok: boolean }) {
  if (!ok) return null
  return (
    <View style={ss.chip}>
      <Ionicons name={icon as any} size={13} color="#7c3aed" />
      <Text style={ss.chipTxt}>{label}</Text>
    </View>
  )
}

// ── Spec card ─────────────────────────────────────────────────────
function Spec({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={ss.specCard}>
      <Ionicons name={icon as any} size={20} color="#7c3aed" />
      <Text style={ss.specVal}>{value}</Text>
      <Text style={ss.specLabel}>{label}</Text>
    </View>
  )
}

// ── Pantalla ──────────────────────────────────────────────────────
export default function PropertyDetailScreen() {
  const navigation = useNavigation<any>()
  const route      = useRoute<any>()
  const { user }   = useAuth()

  const propertyId: number = route.params?.propertyId ?? route.params?.property?.id
  const [property,  setProperty]  = useState<Property | null>(route.params?.property ?? null)
  const [score,     setScore]     = useState<number | null>(property?.compatibility_score ?? null)
  const [loading,   setLoading]   = useState(!property)
  const [imgIndex,  setImgIndex]  = useState(0)
  const [requested, setRequested] = useState(false)
  const [requesting,setRequesting]= useState(false)

  const isTenant = user?.role === 'tenant'

  // Cargar datos del piso
  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    apiGet<any>(`/properties/${propertyId}`)
      .then(d => {
        const p = d?.data ?? d
        setProperty(p)
        if (p?.compatibility_score != null) setScore(p.compatibility_score)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [propertyId])

  // Cargar score de compatibilidad por separado
  useEffect(() => {
    if (!propertyId || !isTenant || score != null) return
    apiGet<any>(`/properties/${propertyId}/compatibility`)
      .then(d => {
        const s = d?.data?.score ?? d?.score
        if (s != null) setScore(s)
      })
      .catch(() => {})
  }, [propertyId, isTenant, score])

  const handleMatch = async () => {
    if (requesting || requested) return
    setRequesting(true)
    try {
      await apiPost(`/properties/${propertyId}/request-match`, {})
      setRequested(true)
      Alert.alert('🎉 ¡Match solicitado!', 'El propietario revisará tu perfil y te contactará si encajáis.')
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Error al solicitar el match'
      if (msg.includes('ya')) { setRequested(true) }
      else Alert.alert('Error', msg)
    } finally { setRequesting(false) }
  }

  const handleShare = () => {
    if (!property) return
    Share.share({
      message: `Mira este piso en MatchHome: ${property.title} — ${price}€/mes en ${city}`,
    })
  }

  if (loading || !property) return (
    <View style={ss.center}>
      <ActivityIndicator size="large" color="#7c3aed" />
      <Text style={{ color: '#94a3b8', marginTop: 12 }}>Cargando piso...</Text>
    </View>
  )

  // Normalizar datos (API puede devolver diferentes formatos)
  const images  = property.images ?? []
  const price   = property.pricing?.amount ?? property.price
  const city    = property.location?.city   ?? property.city
  const rooms   = property.specs?.rooms     ?? property.rooms
  const size    = property.specs?.size_m2   ?? property.size
  const baths   = property.specs?.bathrooms ?? property.bathrooms
  const pets    = property.rules?.allows_pets    ?? property.allows_pets
  const smoke   = property.rules?.allows_smokers ?? property.allows_smokers
  const typeLabel = property.type === 'flat' ? 'Piso/Apartamento' : property.type === 'house' ? 'Casa/Chalet' : property.type === 'room' ? 'Habitación' : property.type ?? 'Inmueble'

  return (
    <View style={ss.root}>
      {/* Header flotante */}
      <View style={ss.headerFloat}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ss.fabBtn}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={ss.fabBtn}>
          <Ionicons name="share-outline" size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── GALERÍA ──────────────────────────────────── */}
        <View style={{ height: W * 0.68, backgroundColor: '#f1f5f9' }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / W))}>
            {images.length > 0
              ? images.map((img, i) => (
                  <Image key={i} source={{ uri: img.url ?? `${require('../api/client').BASE_URL?.replace('/api','')}/storage/${img.image_path}` }}
                    style={{ width: W, height: W * 0.68 }} contentFit="cover" />
                ))
              : <View style={{ width: W, height: W * 0.68, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="home-outline" size={64} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', marginTop: 8 }}>Sin fotografías</Text>
                </View>
            }
          </ScrollView>
          {/* Dots galería */}
          {images.length > 1 && (
            <View style={ss.galDots}>
              {images.map((_, i) => (
                <View key={i} style={[ss.galDot, i === imgIndex && ss.galDotActive]} />
              ))}
            </View>
          )}
          {/* Badge tipo */}
          <View style={ss.typeBadge}>
            <Text style={ss.typeBadgeTxt}>{typeLabel}</Text>
          </View>
        </View>

        <View style={ss.body}>
          {/* ─── PRECIO + SCORE ──────────────────────────── */}
          <View style={ss.priceRow}>
            <View>
              <Text style={ss.price}>{price?.toLocaleString('es-ES')}€<Text style={ss.priceSub}>/mes</Text></Text>
              <Text style={ss.city}>
                <Ionicons name="location" size={13} color="#7c3aed" /> {city}{property.zip_code ? ` · ${property.zip_code}` : ''}
              </Text>
            </View>
            {score != null && <ScoreRing score={score} />}
          </View>

          {/* ─── TÍTULO ──────────────────────────────────── */}
          <Text style={ss.title}>{property.title}</Text>

          {/* ─── SPECS ───────────────────────────────────── */}
          <View style={ss.specs}>
            {rooms && <Spec icon="bed-outline"    value={rooms}   label="Hab." />}
            {size  && <Spec icon="square-outline" value={`${size}m²`} label="Superficie" />}
            {baths && <Spec icon="water-outline"  value={baths}   label="Baños" />}
          </View>

          {/* ─── AMENITIES ───────────────────────────────── */}
          <View style={ss.chips}>
            <Chip icon="paw-outline"    label="Mascotas OK"  ok={!!pets} />
            <Chip icon="car-outline"    label="Garaje"       ok={!!property.has_garage} />
            <Chip icon="snow-outline"   label="Aire A/C"     ok={!!property.has_ac} />
            <Chip icon="shirt-outline"  label="Amueblado"    ok={!!property.is_furnished} />
            {!smoke && <Chip icon="ban-outline" label="Sin fumar" ok={true} />}
          </View>

          {/* ─── SCORE EXPLICADO ─────────────────────────── */}
          {score != null && isTenant && (
            <View style={ss.scoreExplain}>
              <View style={ss.scoreExplainHeader}>
                <Ionicons name="analytics-outline" size={16} color="#7c3aed" />
                <Text style={ss.scoreExplainTitle}>¿Por qué {score}% de afinidad?</Text>
              </View>
              <Text style={ss.scoreExplainTxt}>
                Nuestro algoritmo compara tu perfil con este piso en 10 factores: presupuesto, ingresos, mascotas, zona, habitaciones, duración, garaje, fumador, documentación y tipo de inquilino.
              </Text>
              <View style={ss.scoreBar}>
                <View style={[ss.scoreBarFill, {
                  width: `${score}%` as any,
                  backgroundColor: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#64748b'
                }]} />
              </View>
            </View>
          )}

          {/* ─── DESCRIPCIÓN ─────────────────────────────── */}
          {property.description && (
            <View style={ss.section}>
              <Text style={ss.sectionTitle}>Descripción</Text>
              <Text style={ss.descTxt}>{property.description}</Text>
            </View>
          )}

          {/* ─── PROPIETARIO ─────────────────────────────── */}
          {property.owner && (
            <View style={ss.section}>
              <Text style={ss.sectionTitle}>Propietario</Text>
              <View style={ss.ownerCard}>
                <View style={ss.ownerAvatar}>
                  <Text style={ss.ownerAvatarTxt}>{property.owner.name?.charAt(0) ?? '?'}</Text>
                </View>
                <View>
                  <Text style={ss.ownerName}>{property.owner.name}</Text>
                  <Text style={ss.ownerRole}>Propietario verificado</Text>
                </View>
                <View style={ss.ownerBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                </View>
              </View>
            </View>
          )}

          {/* Espacio para el CTA fijo */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ─── CTA FIJO ────────────────────────────────────── */}
      {isTenant && (
        <View style={ss.ctaBar}>
          {score != null && (
            <View style={ss.ctaScore}>
              <Text style={[ss.ctaScoreNum, {
                color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#64748b'
              }]}>{score}%</Text>
              <Text style={ss.ctaScoreLbl}>match</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleMatch} disabled={requesting || requested}
            style={[ss.ctaBtn, requested && ss.ctaBtnDone]}>
            {requesting
              ? <ActivityIndicator color="#fff" size="small" />
              : requested
                ? <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={ss.ctaBtnTxt}>Match enviado ✓</Text></>
                : <><Ionicons name="heart" size={18} color="#fff" /><Text style={ss.ctaBtnTxt}>Solicitar Match</Text></>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },

  headerFloat: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16,
    left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, zIndex: 10 },
  fabBtn: { width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },

  galDots:    { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  galDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.45)' },
  galDotActive:{ backgroundColor: '#fff', width: 14, borderRadius: 7 },
  typeBadge:  { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 24, right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '700' },

  body: { padding: 20 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  price:    { fontSize: 30, fontWeight: '900', color: '#059669', letterSpacing: -0.5 },
  priceSub: { fontSize: 14, fontWeight: '400', color: '#94a3b8' },
  city:     { fontSize: 13, color: '#64748b', marginTop: 3 },

  scoreCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 10, borderWidth: 1 },
  scoreRing:  { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', alignItems: 'baseline' } as any,
  scoreNum:   { fontSize: 16, fontWeight: '900' },
  scorePct:   { fontSize: 9, fontWeight: '700' },
  scoreTitle: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  scoreLabel: { fontSize: 12, fontWeight: '800' },

  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, marginBottom: 16 },

  specs:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  specCard: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: '#f8fafc',
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  specVal:  { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  specLabel:{ fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#ede9fe' },
  chipTxt: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },

  scoreExplain: { backgroundColor: '#f5f3ff', borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ede9fe' },
  scoreExplainHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreExplainTitle:  { fontSize: 13, fontWeight: '800', color: '#5b21b6' },
  scoreExplainTxt:    { fontSize: 12, color: '#6d28d9', lineHeight: 18, marginBottom: 10 },
  scoreBar:           { height: 6, backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill:       { height: '100%', borderRadius: 3 },

  section:     { marginBottom: 20 },
  sectionTitle:{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  descTxt:     { fontSize: 14, color: '#374151', lineHeight: 22 },

  ownerCard:    { flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f8fafc', padding: 14, borderRadius: 16 },
  ownerAvatar:  { width: 48, height: 48, borderRadius: 16,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  ownerAvatarTxt: { fontSize: 20, fontWeight: '800', color: '#7c3aed' },
  ownerName:    { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  ownerRole:    { fontSize: 11, color: '#94a3b8' },
  ownerBadge:   { marginLeft: 'auto' } as any,

  ctaBar:   { position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  ctaScore:    { alignItems: 'center', minWidth: 52 },
  ctaScoreNum: { fontSize: 20, fontWeight: '900' },
  ctaScoreLbl: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  ctaBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7c3aed', borderRadius: 18, padding: 16,
    shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  ctaBtnDone:  { backgroundColor: '#059669', shadowColor: '#059669' },
  ctaBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
})
