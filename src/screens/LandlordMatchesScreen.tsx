/**
 * LandlordMatchesScreen — Solicitudes recibidas para propietarios en móvil.
 * Agrupa: Nuevas | Activas (con chat) | Cerradas
 */
import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { apiGet, apiPost } from '../api/client'

interface MatchLead {
  id: number; status: string; compatibility_score?: number
  chat_unlocked_at?: string; created_at: string
  property: { id: number; title: string; city?: string }
  tenant: {
    id: number; name: string
    profile?: { occupation_type?: string; net_income?: number; has_guarantor?: boolean }
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: 'Nueva',       color: '#2563eb', bg: '#eff6ff' },
  contacted:   { label: 'Contactado',  color: '#7c3aed', bg: '#f5f3ff' },
  negotiating: { label: 'Negociando',  color: '#d97706', bg: '#fffbeb' },
  closed_won:  { label: 'Aceptado ✓', color: '#059669', bg: '#ecfdf5' },
  closed_lost: { label: 'Rechazado',  color: '#94a3b8', bg: '#f8fafc' },
}

type Tab = 'new' | 'active' | 'closed'

function LeadCard({ lead, onAccept, onReject, onChat }: {
  lead: MatchLead
  onAccept?: () => void
  onReject?: () => void
  onChat?: () => void
}) {
  const st    = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
  const score = lead.compatibility_score
  const isPending = lead.status === 'new' || lead.status === 'contacted'
  const hasChat   = !!lead.chat_unlocked_at

  return (
    <View style={styles.card}>
      {/* Avatar + info */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{lead.tenant.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <Text style={styles.tenantName}>{lead.tenant.name}</Text>
            <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusTxt, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <Text style={styles.propTitle} numberOfLines={1}>{lead.property.title}</Text>
          <View style={styles.details}>
            {lead.tenant.profile?.occupation_type && (
              <Text style={styles.detail}>
                {lead.tenant.profile.occupation_type === 'mir_student' ? '🏥 MIR' :
                 lead.tenant.profile.occupation_type === 'student' ? '🎓 Estudiante' :
                 lead.tenant.profile.occupation_type === 'professional' ? '💼 Profesional' :
                 lead.tenant.profile.occupation_type}
              </Text>
            )}
            {lead.tenant.profile?.net_income && (
              <Text style={styles.detail}>💰 {lead.tenant.profile.net_income}€/mes</Text>
            )}
            {lead.tenant.profile?.has_guarantor && (
              <Text style={styles.detail}>✅ Avalista</Text>
            )}
          </View>
        </View>
        {/* Score ring */}
        {score != null && (
          <View style={[styles.scoreRing, {
            borderColor: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#94a3b8'
          }]}>
            <Text style={[styles.scoreVal, { color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#94a3b8' }]}>
              {score}
            </Text>
            <Text style={styles.scorePct}>%</Text>
          </View>
        )}
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        {isPending && onAccept && onReject && (
          <>
            <TouchableOpacity onPress={onReject} style={styles.rejectBtn}>
              <Ionicons name="close" size={15} color="#ef4444" />
              <Text style={styles.rejectTxt}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.acceptBtn}>
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={styles.acceptTxt}>Aceptar</Text>
            </TouchableOpacity>
          </>
        )}
        {hasChat && onChat && (
          <TouchableOpacity onPress={onChat} style={styles.chatBtn}>
            <Ionicons name="chatbubble-ellipses" size={15} color="#7c3aed" />
            <Text style={styles.chatBtnTxt}>Abrir chat</Text>
          </TouchableOpacity>
        )}
        {!isPending && !hasChat && (
          <Text style={styles.closedTxt}>Solicitud cerrada</Text>
        )}
      </View>
    </View>
  )
}

export default function LandlordMatchesScreen() {
  const navigation = useNavigation<any>()
  const [leads,     setLeads]     = useState<MatchLead[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [tab,       setTab]       = useState<Tab>('new')

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const data = await apiGet<any>('/landlord/leads')
      setLeads(data?.data?.items ?? data?.items ?? [])
    } catch { setLeads([]) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleAccept = async (leadId: number) => {
    try {
      await apiPost(`/leads/${leadId}/accept`, {})
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'negotiating' } : l))
      Alert.alert('✅ Aceptado', 'El inquilino recibirá una notificación.')
    } catch { Alert.alert('Error', 'No se pudo aceptar') }
  }

  const handleReject = (leadId: number) => {
    Alert.alert('Rechazar', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
        await apiPost(`/leads/${leadId}/reject`, {})
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'closed_lost' } : l))
      }},
    ])
  }

  const filtered = leads.filter(l => {
    if (tab === 'new')    return l.status === 'new' || l.status === 'contacted'
    if (tab === 'active') return l.status === 'negotiating' || !!l.chat_unlocked_at
    return l.status === 'closed_lost' || l.status === 'closed_won'
  })

  const counts = {
    new:    leads.filter(l => l.status === 'new' || l.status === 'contacted').length,
    active: leads.filter(l => l.status === 'negotiating' || !!l.chat_unlocked_at).length,
    closed: leads.filter(l => l.status === 'closed_lost' || l.status === 'closed_won').length,
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'new',    label: `Nuevas (${counts.new})` },
    { id: 'active', label: `Activas (${counts.active})` },
    { id: 'closed', label: `Cerradas (${counts.closed})` },
  ]

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Solicitudes</Text>
        <Text style={styles.sub}>{leads.length} total</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}>
            <Text style={[styles.tabTxt, tab === t.id && styles.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={l => String(l.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#7c3aed" />}
          renderItem={({ item }) => (
            <LeadCard lead={item}
              onAccept={counts.new > 0 ? () => handleAccept(item.id) : undefined}
              onReject={counts.new > 0 ? () => handleReject(item.id) : undefined}
              onChat={item.chat_unlocked_at ? () => navigation.navigate('Chat', { leadId: item.id, counterpartyName: item.tenant.name, propertyTitle: item.property.title }) : undefined}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTxt}>Sin solicitudes en esta sección</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  sub:   { fontSize: 12, color: '#94a3b8', marginTop: 1 },

  tabs:        { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabBtn:      { flex: 1, paddingVertical: 7, borderRadius: 12, alignItems: 'center', backgroundColor: '#f8fafc' },
  tabBtnActive:{ backgroundColor: '#7c3aed' },
  tabTxt:      { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  tabTxtActive:{ color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center', shrink: 0 } as any,
  avatarTxt:  { fontSize: 18, fontWeight: '800', color: '#7c3aed' },
  info:       { flex: 1 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  tenantName: { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1 },
  propTitle:  { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  details:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  detail:     { fontSize: 10, color: '#64748b', backgroundColor: '#f8fafc', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },

  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusTxt:  { fontSize: 10, fontWeight: '700' },

  scoreRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreVal:  { fontSize: 14, fontWeight: '900', lineHeight: 16 },
  scorePct:  { fontSize: 8, fontWeight: '700', lineHeight: 9 },

  actions:    { flexDirection: 'row', gap: 8 },
  rejectBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  rejectTxt:  { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  acceptBtn:  { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12, backgroundColor: '#059669' },
  acceptTxt:  { fontSize: 12, fontWeight: '700', color: '#fff' },
  chatBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#ddd6fe' },
  chatBtnTxt: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  closedTxt:  { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },

  empty:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTxt: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
})
