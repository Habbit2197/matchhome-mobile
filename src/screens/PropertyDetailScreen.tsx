import { useEffect, useRef, useState } from 'react'
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl, FlatList,
  NativeSyntheticEvent, NativeScrollEvent, SafeAreaView, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useProperty } from '../hooks/useProperty'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMG_HEIGHT = 320

type PropertyDetailRouteParams = {
  PropertyDetail: { propertyId: number }
}

/**
 * Pantalla de detalle de un inmueble.
 *
 * Estados manejados:
 *  - loading (primera carga)
 *  - refreshing (pull-to-refresh)
 *  - error / notFound (404)
 *  - sin imágenes (placeholder)
 *  - piso alquilado (rented_at) — badge informativo
 *
 * El CTA inferior cambia según el contexto, pero esa lógica vive en
 * el siguiente paso (lo conectaremos con leads/swipes). Por ahora,
 * solo lectura limpia y completa.
 */
export default function PropertyDetailScreen() {
  const route = useRoute<RouteProp<PropertyDetailRouteParams, 'PropertyDetail'>>()
  const navigation = useNavigation<any>()
  const { propertyId } = route.params

  const { property, loading, refreshing, error, notFound, refetch } = useProperty(propertyId)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    if (idx !== activeImageIdx) setActiveImageIdx(idx)
  }

  // ───── Estados especiales ─────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centerFlex}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.muted}>Cargando inmueble…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centerFlex}>
          <Ionicons name="home-outline" size={64} color="#cbd5e1" />
          <Text style={styles.errorTitle}>Inmueble no disponible</Text>
          <Text style={styles.muted}>Es posible que se haya alquilado o retirado del catálogo.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Volver al feed</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !property) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centerFlex}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc2626" />
          <Text style={styles.errorTitle}>{error ?? 'No se pudo cargar el piso'}</Text>
          <TouchableOpacity onPress={refetch} style={styles.btnPrimary}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ───── Render principal ─────
  const score = property.compatibility.score
  const scoreColor = property.compatibility.color
  const isRented = (property as any).rented_at != null
  const hasImages = property.images?.length > 0
  const typeLabel = property.type === 'flat' ? 'Piso' : property.type === 'house' ? 'Casa' : property.type === 'room' ? 'Habitación' : property.type

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor="#10b981" />
        }
      >
        {/* Carrusel de imágenes */}
        <View style={styles.carouselWrap}>
          {hasImages ? (
            <>
              <FlatList
                data={property.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
                keyExtractor={img => String(img.id)}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.url }} style={styles.carouselImg} resizeMode="cover" />
                )}
              />
              {property.images.length > 1 && (
                <View style={styles.dotsContainer}>
                  {property.images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeImageIdx && styles.dotActive]} />
                  ))}
                </View>
              )}
              <View style={styles.imageCounter}>
                <Ionicons name="image-outline" size={12} color="#fff" />
                <Text style={styles.imageCounterText}>
                  {activeImageIdx + 1}/{property.images.length}
                </Text>
              </View>
            </>
          ) : (
            <View style={[styles.carouselImg, styles.noImg]}>
              <Ionicons name="image-outline" size={48} color="#cbd5e1" />
              <Text style={styles.muted}>Sin fotografías</Text>
            </View>
          )}

          {/* Header flotante con back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backFloating}>
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          {/* Badge de score flotante */}
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Ionicons name="sparkles" size={12} color="#fff" />
            <Text style={styles.scoreBadgeText}>{score}% compatible</Text>
          </View>

          {/* Banner alquilado */}
          {isRented && (
            <View style={styles.rentedBanner}>
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={styles.rentedBannerText}>Alquilado · ya no disponible</Text>
            </View>
          )}
        </View>

        {/* Sección título + precio */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{typeLabel}</Text>
            </View>
            <Text style={styles.compatLabel} numberOfLines={1}>
              {property.compatibility.label}
            </Text>
          </View>

          <Text style={styles.title}>{property.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.location}>
              {property.location.city}{property.location.zip_code ? ` · CP ${property.location.zip_code}` : ''}
            </Text>
          </View>

          <Text style={styles.price}>
            {property.pricing.amount.toLocaleString('es-ES')} €
            <Text style={styles.priceUnit}>/mes</Text>
          </Text>
        </View>

        {/* Specs en grid */}
        <View style={styles.statsRow}>
          <StatCard icon="bed-outline"  value={String(property.specs.rooms)}     label={property.specs.rooms === 1 ? 'habitación' : 'habitaciones'} />
          <StatCard icon="water-outline" value={String(property.specs.bathrooms)} label={property.specs.bathrooms === 1 ? 'baño' : 'baños'} />
          {property.specs.size_m2 != null && (
            <StatCard icon="resize-outline" value={String(property.specs.size_m2)} label="m²" />
          )}
        </View>

        {/* Descripción */}
        {property.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre este inmueble</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        ) : null}

        {/* Reglas de convivencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reglas de convivencia</Text>
          <View style={styles.rulesGrid}>
            <RuleItem
              icon="paw-outline"
              label="Mascotas"
              allowed={property.rules.allows_pets}
            />
            <RuleItem
              icon="logo-no-smoking"
              label="Fumadores"
              allowed={property.rules.allows_smokers}
            />
          </View>
        </View>

        {/* Propietario / agencia */}
        {property.agency && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publicado por</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                <Ionicons name="business" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{property.agency.name}</Text>
                <Text style={styles.ownerSub}>Agencia inmobiliaria</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.verifiedText}>Verificada</Text>
              </View>
            </View>
          </View>
        )}

        {/* Disponibilidad */}
        {property.available_from && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            <View style={styles.availabilityCard}>
              <Ionicons name="calendar-outline" size={18} color="#0f172a" />
              <Text style={styles.availabilityText}>
                Desde el {new Date(property.available_from).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar fijo con CTA — placeholder, lo conectaremos después */}
      <View style={styles.bottomBar}>
        {isRented ? (
          <View style={[styles.cta, styles.ctaDisabled]}>
            <Ionicons name="lock-closed" size={16} color="#94a3b8" />
            <Text style={styles.ctaDisabledText}>Ya no disponible</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: scoreColor }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="heart" size={18} color="#fff" />
            <Text style={styles.ctaText}>Volver al feed para hacer match</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────
function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.headerLoading}>
      <TouchableOpacity onPress={onBack} style={styles.backInline}>
        <Ionicons name="chevron-back" size={26} color="#0f172a" />
      </TouchableOpacity>
    </View>
  )
}

function StatCard({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color="#10b981" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function RuleItem({ icon, label, allowed }: { icon: any; label: string; allowed: boolean }) {
  return (
    <View style={styles.ruleItem}>
      <View style={[styles.ruleIcon, allowed ? styles.ruleOk : styles.ruleNo]}>
        <Ionicons name={allowed ? 'checkmark' : 'close'} size={16} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ruleLabel}>{label}</Text>
        <Text style={styles.ruleStatus}>{allowed ? 'Permitidas' : 'No permitidos'}</Text>
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#fff' },
  safe:        { flex: 1, backgroundColor: '#fff' },
  flex:        { flex: 1 },
  centerFlex:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10 },

  headerLoading: {
    height: 56, paddingHorizontal: 12, justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backInline: { padding: 6, alignSelf: 'flex-start' },
  backFloating: {
    position: 'absolute', top: 14, left: 14,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  carouselWrap: { position: 'relative', backgroundColor: '#0f172a' },
  carouselImg:  { width: SCREEN_WIDTH, height: IMG_HEIGHT, backgroundColor: '#e2e8f0' },
  noImg:        { alignItems: 'center', justifyContent: 'center', gap: 8 },

  dotsContainer: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 22 },

  imageCounter: {
    position: 'absolute', bottom: 12, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  imageCounterText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  scoreBadge: {
    position: 'absolute', top: 18, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  scoreBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  rentedBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(220,38,38,0.94)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 11,
  },
  rentedBannerText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  section: { paddingHorizontal: 20, paddingTop: 20 },

  typeChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#f1f5f9', borderRadius: 6,
  },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#0f172a', textTransform: 'uppercase' },
  compatLabel: { fontSize: 12, color: '#64748b', flex: 1 },

  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 8, lineHeight: 28 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  location:    { color: '#64748b', fontSize: 14 },
  price:       { fontSize: 28, fontWeight: '800', color: '#10b981', marginTop: 12 },
  priceUnit:   { fontSize: 14, fontWeight: '500', color: '#64748b' },

  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 16,
  },
  statCard: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  description:  { fontSize: 15, color: '#334155', lineHeight: 22 },

  rulesGrid: { gap: 10 },
  ruleItem:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: '#f8fafc',
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  ruleIcon:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ruleOk:    { backgroundColor: '#10b981' },
  ruleNo:    { backgroundColor: '#94a3b8' },
  ruleLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ruleStatus:{ fontSize: 12, color: '#64748b' },

  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: '#f8fafc',
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  ownerName:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ownerSub:    { fontSize: 12, color: '#64748b' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#10b981' },

  availabilityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, backgroundColor: '#eff6ff', borderRadius: 12,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  availabilityText: { fontSize: 14, color: '#0f172a', fontWeight: '600' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaText:         { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaDisabled:     { backgroundColor: '#f1f5f9', shadowOpacity: 0 },
  ctaDisabledText: { color: '#94a3b8', fontWeight: '700', fontSize: 15 },

  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 11,
    backgroundColor: '#10b981', borderRadius: 12,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnSecondary: {
    paddingHorizontal: 18, paddingVertical: 11,
    backgroundColor: '#f1f5f9', borderRadius: 12,
  },
  btnSecondaryText: { color: '#0f172a', fontWeight: '700' },

  muted:      { color: '#64748b', fontSize: 13, textAlign: 'center' },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
})
