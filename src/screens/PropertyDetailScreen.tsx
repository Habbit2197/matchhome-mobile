/**
 * PropertyDetailScreen v3 — Con mapa de ubicación y distancia GPS.
 */
import { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Platform, Share, Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { usePropertyDetail } from '../hooks/usePropertyDetail'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'

let MapView: any = null, Marker: any = null
try {
  const maps = require('react-native-maps')
  MapView = maps.default; Marker = maps.Marker
} catch {}

let Location: any = null
try { Location = require('expo-location') } catch {}

const { width: W } = Dimensions.get('window')

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#64748b'
  return (
    <View style={[ss.scoreRing, { borderColor: color }]}>
      <Text style={[ss.scoreVal, { color }]}>{score}</Text>
      <Text style={[ss.scorePct, { color }]}>%</Text>
    </View>
  )
}

function AmenityChip({ icon, label, active = true }: { icon: string; label: string; active?: boolean }) {
  if (!active) return null
  return (
    <View style={ss.chip}>
      <Ionicons name={icon as any} size={13} color="#7c3aed" />
      <Text style={ss.chipTxt}>{label}</Text>
    </View>
  )
}

export default function PropertyDetailScreen() {
  const navigation = useNavigation<any>()
  const route      = useRoute<any>()
  const { user }   = useAuth()
  const propertyId: number = route.params?.propertyId ?? route.params?.property?.id
  const { property, loading } = usePropertyDetail(propertyId)
  const prop = property ?? route.params?.property

  const [currentImg,  setCurrentImg]  = useState(0)
  const [requesting,  setRequesting]  = useState(false)
  const [requested,   setRequested]   = useState(false)
  const [userDistance, setDistance]   = useState<number | null>(null)

  const isTenant   = user?.role === 'tenant'
  const lat        = prop?.location?.lat ?? prop?.latitude
  const lng        = prop?.location?.lng ?? prop?.longitude
  const hasMap     = !!(MapView && lat && lng)

  // Calcular distancia al usuario
  useEffect(() => {
    if (!lat || !lng || !Location) return
    ;(async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status !== 'granted') return
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
        const R = 6371, dLat = (lat - pos.coords.latitude) * Math.PI / 180
        const dLon = (lng - pos.coords.longitude) * Math.PI / 180
        const a = Math.sin(dLat/2)**2 + Math.cos(pos.coords.latitude*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2
        setDistance(Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10)
      } catch {}
    })()
  }, [lat, lng])

  const handleMatch = async () => {
    if (!prop?.id || requesting) return
    setRequesting(true)
    try {
      await api.post(`/properties/${prop.id}/request-match`, {})
      setRequested(true)
    } catch (e: any) {
      setRequested(true) // Si ya existe match, mostramos como enviado
    } finally { setRequesting(false) }
  }

  const handleShare = () => Share.share({ message: `Mira este piso en MatchHome: ${prop?.title} - ${prop?.pricing?.amount ?? prop?.price}€/mes en ${prop?.location?.city ?? prop?.city}` })

  if (loading || !prop) return (
    <View style={ss.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
  )

  const images     = prop.images ?? []
  const price      = prop.pricing?.amount ?? prop.price
  const city       = prop.location?.city ?? prop.city
  const rooms      = prop.specs?.rooms ?? prop.rooms
  const size       = prop.specs?.size_m2 ?? prop.size
  const baths      = prop.specs?.bathrooms ?? prop.bathrooms
  const score      = prop.compatibility_score
  const allowsPets = prop.rules?.allows_pets ?? prop.allows_pets
  const allowsSmoke= prop.rules?.allows_smokers ?? prop.allows_smokers
  const desc       = prop.description

  return (
    <View style={ss.root}>
      {/* Header flotante */}
      <View style={ss.floatHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ss.floatBtn}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={ss.floatBtn}>
          <Ionicons name="share-outline" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galería */}
        <View style={ss.gallery}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setCurrentImg(Math.round(e.nativeEvent.contentOffset.x / W))}>
            {images.length > 0
              ? images.map((img: any, i: number) => (
                  <Image key={i} source={{ uri: img.url }} style={{ width: W, height: W * 0.65 }} contentFit="cover" />
                ))
              : <View style={[ss.noImg, { width: W, height: W * 0.65 }]}>
                  <Ionicons name="home-outline" size={60} color="#cbd5e1" />
                </View>
            }
          </ScrollView>
          {images.length > 1 && (
            <View style={ss.dots}>
              {images.map((_: any, i: number) => (
                <View key={i} style={[ss.dot, i === currentImg && ss.dotActive]} />
              ))}
            </View>
          )}
          {score != null && (
            <View style={ss.scoreWrap}><ScoreRing score={score} /></View>
          )}
          {userDistance != null && (
            <View style={ss.distanceBadge}>
              <Ionicons name="location" size={11} color="#fff" />
              <Text style={ss.distanceTxt}>{userDistance} km</Text>
            </View>
          )}
        </View>

        <View style={ss.body}>
          {/* Precio + título */}
          <View style={ss.priceRow}>
            <View>
              <Text style={ss.price}>{price?.toLocaleString('es-ES')}€<Text style={ss.priceSub}>/mes</Text></Text>
              <Text style={ss.type}>{prop.type === 'flat' ? 'Piso' : prop.type === 'house' ? 'Casa' : 'Habitación'}</Text>
            </View>
          </View>
          <Text style={ss.title}>{prop.title}</Text>

          {/* Ubicación */}
          <View style={ss.locationRow}>
            <Ionicons name="location" size={16} color="#7c3aed" />
            <Text style={ss.locationTxt}>{city}{prop.zip_code ? ` (${prop.zip_code})` : ''}</Text>
            {userDistance != null && <Text style={ss.distanceInline}>· {userDistance} km de ti</Text>}
          </View>

          {/* Specs */}
          <View style={ss.specs}>
            <View style={ss.spec}><Ionicons name="bed-outline" size={18} color="#7c3aed" /><Text style={ss.specVal}>{rooms}</Text><Text style={ss.specLabel}>Hab.</Text></View>
            <View style={ss.specDiv} />
            <View style={ss.spec}><Ionicons name="square-outline" size={18} color="#7c3aed" /><Text style={ss.specVal}>{size}</Text><Text style={ss.specLabel}>m²</Text></View>
            {baths && <><View style={ss.specDiv} /><View style={ss.spec}><Ionicons name="water-outline" size={18} color="#7c3aed" /><Text style={ss.specVal}>{baths}</Text><Text style={ss.specLabel}>Baños</Text></View></>}
          </View>

          {/* Amenities */}
          <View style={ss.chips}>
            <AmenityChip icon="paw"           label="Mascotas OK"    active={!!allowsPets} />
            <AmenityChip icon="ban"            label="Sin fumar"      active={!allowsSmoke} />
            <AmenityChip icon="car"            label="Garaje"         active={!!(prop as any).has_garage} />
            <AmenityChip icon="wifi"           label="WiFi incluido"  active={!!(prop as any).has_wifi} />
            <AmenityChip icon="snow"           label="Aire A/C"       active={!!(prop as any).has_ac} />
            <AmenityChip icon="shirt"          label="Amueblado"      active={!!(prop as any).is_furnished} />
          </View>

          {/* Descripción */}
          {desc && (
            <View style={ss.section}>
              <Text style={ss.sectionTitle}>Descripción</Text>
              <Text style={ss.desc}>{desc}</Text>
            </View>
          )}

          {/* Propietario */}
          {prop.owner && (
            <View style={ss.section}>
              <Text style={ss.sectionTitle}>Propietario</Text>
              <View style={ss.ownerRow}>
                <View style={ss.ownerAvatar}>
                  <Text style={ss.ownerAvatarTxt}>{prop.owner.name?.charAt(0) ?? '?'}</Text>
                </View>
                <View>
                  <Text style={ss.ownerName}>{prop.owner.name}</Text>
                  <Text style={ss.ownerRole}>Propietario particular</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── MAPA ──────────────────────────────────────── */}
          <View style={ss.section}>
            <Text style={ss.sectionTitle}>Ubicación aproximada</Text>
            {hasMap ? (
              <View style={ss.mapWrap}>
                <MapView
                  style={ss.map}
                  initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                  scrollEnabled={false} zoomEnabled={false}>
                  <Marker coordinate={{ latitude: lat, longitude: lng }}
                    title={prop.title} description={city} />
                </MapView>
                <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)} style={ss.openMapBtn}>
                  <Ionicons name="navigate" size={14} color="#7c3aed" />
                  <Text style={ss.openMapTxt}>Abrir en Maps</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={ss.noMap}>
                <Ionicons name="map-outline" size={32} color="#cbd5e1" />
                <Text style={ss.noMapTxt}>{city}</Text>
                <Text style={ss.noMapSub}>Ubicación exacta disponible tras el match</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* CTA fijo */}
      {isTenant && (
        <View style={ss.cta}>
          {score != null && (
            <View style={ss.ctaScore}>
              <Text style={ss.ctaScoreTxt}>{score}%</Text>
              <Text style={ss.ctaScoreLabel}>afinidad</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleMatch} disabled={requesting || requested}
            style={[ss.ctaBtn, (requesting || requested) && ss.ctaBtnDone]}>
            {requesting
              ? <ActivityIndicator color="#fff" size="small" />
              : requested
                ? <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={ss.ctaBtnTxt}>Match enviado</Text></>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  floatHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  floatBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },

  gallery:  { position: 'relative' },
  noImg:    { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  dots:     { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot:      { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:{ backgroundColor: '#fff', width: 14 },
  scoreWrap:{ position: 'absolute', top: 70, right: 14 },
  scoreRing:{ width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', alignItems: 'baseline' } as any,
  scoreVal: { fontSize: 14, fontWeight: '900' },
  scorePct: { fontSize: 9, fontWeight: '700' },
  distanceBadge:{ position: 'absolute', bottom: 16, right: 14, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  distanceTxt:  { color: '#fff', fontSize: 11, fontWeight: '700' },

  body:      { padding: 20 },
  priceRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  price:     { fontSize: 28, fontWeight: '900', color: '#059669', letterSpacing: -0.5 },
  priceSub:  { fontSize: 14, fontWeight: '500', color: '#94a3b8' },
  type:      { fontSize: 12, color: '#7c3aed', fontWeight: '700', backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  title:     { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  locationTxt: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
  distanceInline: { fontSize: 12, color: '#94a3b8' },

  specs:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 16 },
  spec:    { flex: 1, alignItems: 'center', gap: 2 },
  specDiv: { width: 1, height: 28, backgroundColor: '#e2e8f0' },
  specVal: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  specLabel:{ fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ede9fe' },
  chipTxt: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },

  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  desc:         { fontSize: 14, color: '#374151', lineHeight: 22 },

  ownerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', padding: 14, borderRadius: 16 },
  ownerAvatar:    { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  ownerAvatarTxt: { fontSize: 20, fontWeight: '800', color: '#7c3aed' },
  ownerName:      { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  ownerRole:      { fontSize: 12, color: '#94a3b8' },

  mapWrap:     { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  map:         { height: 180, width: '100%' },
  openMapBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, backgroundColor: '#f5f3ff', borderTopWidth: 1, borderTopColor: '#ede9fe' },
  openMapTxt:  { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
  noMap:       { backgroundColor: '#f8fafc', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  noMapTxt:    { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  noMapSub:    { fontSize: 12, color: '#94a3b8' },

  cta:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  ctaScore:    { alignItems: 'center', minWidth: 48 },
  ctaScoreTxt: { fontSize: 18, fontWeight: '900', color: '#7c3aed' },
  ctaScoreLabel:{ fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  ctaBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 18, padding: 16,
    shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  ctaBtnDone:  { backgroundColor: '#059669', shadowColor: '#059669' },
  ctaBtnTxt:   { color: '#fff', fontSize: 16, fontWeight: '800' },
})
