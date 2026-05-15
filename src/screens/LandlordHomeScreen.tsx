/**
 * LandlordHomeScreen — Pantalla de inicio para propietarios en móvil.
 * Muestra sus pisos, solicitudes pendientes y accesos rápidos.
 */
import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import { apiGet, apiPost } from '../api/client'

interface Property {
  id: number; title: string; city?: string; price?: number
  is_active?: boolean; leads_count?: number
  images?: Array<{ url: string }>
}

interface MatchLead {
  id: number; status: string; compatibility_score?: number
  tenant: { id: number; name: string }
  property: { id: number; title: string }
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function LandlordHomeScreen() {
  const navigation = useNavigation<any>()
  const { user }   = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [leads,      setLeads]      = useState<MatchLead[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const [propsData, leadsData] = await Promise.all([
        apiGet<any>('/landlord/properties').catch(() => []),
        apiGet<any>('/landlord/leads').catch(() => ({ items: [] })),
      ])
      setProperties(Array.isArray(propsData) ? propsData : (propsData?.data ?? []))
      setLeads(leadsData?.data?.items ?? leadsData?.items ?? [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const pendingLeads = leads.filter(l => l.status === 'new' || l.status === 'contacted')
  const activeLeads  = leads.filter(l => !!l.chat_unlocked_at)
  const totalLeads   = leads.length

  const handleAccept = async (leadId: number) => {
    try {
      await apiPost(`/leads/${leadId}/accept`, {})
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'negotiating' } : l))
      Alert.alert('✅ Match aceptado', 'El inquilino recibirá una notificación.')
    } catch { Alert.alert('Error', 'No se pudo aceptar') }
  }

  const handleReject = async (leadId: number) => {
    Alert.alert('Rechazar solicitud', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
        await apiPost(`/leads/${leadId}/reject`, {})
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'closed_lost' } : l))
      }},
    ])
  }

  return (
    <ScrollView style={styles.root}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7c3aed" />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Gestiona tus pisos y solicitudes</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard icon="home-outline"         label="Pisos"       value={properties.length} color="#7c3aed" />
            <StatCard icon="people-outline"       label="Solicitudes" value={totalLeads}         color="#2563eb" />
            <StatCard icon="chatbubble-outline"   label="Chats"       value={activeLeads.length} color="#059669" />
          </View>

          {/* Solicitudes pendientes */}
          {pendingLeads.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>⏳ Solicitudes nuevas</Text>
                <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
                  <Text style={[styles.badgeTxt, { color: '#2563eb' }]}>{pendingLeads.length}</Text>
                </View>
              </View>
              {pendingLeads.map(lead => (
                <View key={lead.id} style={styles.leadCard}>
                  <View style={styles.leadAvatar}>
                    <Text style={styles.leadAvatarTxt}>{lead.tenant.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{lead.tenant.name}</Text>
                    <Text style={styles.leadProp} numberOfLines={1}>{lead.property.title}</Text>
                    {lead.compatibility_score != null && (
                      <View style={[styles.scorePill, { backgroundColor: lead.compatibility_score >= 80 ? '#ecfdf5' : '#fffbeb' }]}>
                        <Text style={[styles.scoreTxt, { color: lead.compatibility_score >= 80 ? '#059669' : '#d97706' }]}>
                          {lead.compatibility_score}% match
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.leadActions}>
                    <TouchableOpacity onPress={() => handleReject(lead.id)} style={styles.rejectBtn}>
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAccept(lead.id)} style={styles.acceptBtn}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Mis pisos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏠 Mis pisos</Text>
              <TouchableOpacity onPress={() => Alert.alert('Próximamente', 'Publicar piso desde la app estará disponible pronto. Usa la web por ahora.')}>
                <Ionicons name="add-circle" size={26} color="#7c3aed" />
              </TouchableOpacity>
            </View>

            {properties.length === 0 && (
              <View style={styles.emptyPisos}>
                <Text style={styles.emptyTxt}>No tienes pisos publicados</Text>
                <Text style={styles.emptyHint}>Publica tus pisos desde la web para empezar a recibir solicitudes</Text>
              </View>
            )}

            {properties.map(p => (
              <View key={p.id} style={styles.propCard}>
                <View style={styles.propImg}>
                  {p.images?.[0]?.url
                    ? <Image source={{ uri: p.images[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    : <View style={styles.propImgPh}><Ionicons name="home-outline" size={24} color="#cbd5e1" /></View>
                  }
                  <View style={[styles.statusDot, { backgroundColor: p.is_active ? '#059669' : '#94a3b8' }]} />
                </View>
                <View style={styles.propInfo}>
                  <Text style={styles.propTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.propMeta}>{p.city} · {p.price}€/mes</Text>
                  {(p.leads_count ?? 0) > 0 && (
                    <View style={styles.leadsChip}>
                      <Text style={styles.leadsChipTxt}>{p.leads_count} solicitud{p.leads_count !== 1 ? 'es' : ''}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  greeting:    { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subGreeting: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  notifBtn: { w: 40, h: 40, borderRadius: 20, backgroundColor: '#f1f5f9', padding: 8, alignItems: 'center', justifyContent: 'center' } as any,

  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  section:       { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },

  leadCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  leadAvatar:    { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  leadAvatarTxt: { fontSize: 18, fontWeight: '800', color: '#7c3aed' },
  leadInfo:  { flex: 1, minWidth: 0 },
  leadName:  { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  leadProp:  { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  scorePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  scoreTxt:  { fontSize: 10, fontWeight: '700' },
  leadActions: { flexDirection: 'row', gap: 8 },
  rejectBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  acceptBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },

  propCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  propImg:   { width: 80, height: 80, backgroundColor: '#f1f5f9', position: 'relative' },
  propImgPh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  propInfo:  { flex: 1, padding: 12, justifyContent: 'center' },
  propTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  propMeta:  { fontSize: 11, color: '#94a3b8' },
  leadsChip: { backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  leadsChipTxt:{ fontSize: 10, fontWeight: '700', color: '#d97706' },

  emptyPisos: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  emptyTxt:   { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 6 },
  emptyHint:  { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
})
