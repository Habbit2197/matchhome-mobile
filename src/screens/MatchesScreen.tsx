/**
 * MatchesScreen — Lista de solicitudes del inquilino. Rediseñada.
 * · Chats activos en sección destacada (verde)
 * · Solicitudes pendientes agrupadas con score
 * · Solicitudes cerradas/rechazadas colapsadas
 */
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Alert, Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useMyMatches } from '../hooks/useMyMatches'
import { useUnlockChat } from '../hooks/useUnlockChat'
import UnlockChatSheet from '../components/UnlockChatSheet'
import type { Lead } from '../types'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: 'Pendiente',   color: '#d97706', bg: '#fef3c7' },
  contacted:   { label: 'Contactado',  color: '#2563eb', bg: '#dbeafe' },
  visiting:    { label: 'Visita',      color: '#7c3aed', bg: '#ede9fe' },
  negotiating: { label: 'Negociando',  color: '#0891b2', bg: '#cffafe' },
  closed_won:  { label: '✓ Cerrado',   color: '#059669', bg: '#d1fae5' },
  closed_lost: { label: 'Descartado',  color: '#9ca3af', bg: '#f3f4f6' },
}

function ScoreRing({ score }: { score: number | null }) {
  if (score == null) return null
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#6b7280'
  return (
    <View style={[styles.scoreRing, { borderColor: color }]}>
      <Text style={[styles.scoreVal, { color }]}>{score}</Text>
      <Text style={[styles.scorePct, { color }]}>%</Text>
    </View>
  )
}

function LeadCard({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const isActive = !!lead.chat_unlocked_at
  const st       = STATUS_LABELS[lead.status] ?? STATUS_LABELS.new
  const img      = lead.property?.images?.[0]?.url
  const price    = lead.property?.pricing?.amount
  const city     = lead.property?.location?.city

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.card, isActive && styles.cardActive]}>
        {/* Imagen */}
        <View style={styles.cardImg}>
          {img
            ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" />
            : <View style={styles.noImg}><Ionicons name="home-outline" size={22} color="#94a3b8" /></View>
          }
          {isActive && (
            <View style={styles.chatBadge}>
              <Ionicons name="chatbubble" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>{lead.property?.title ?? 'Inmueble'}</Text>
            <ScoreRing score={lead.compatibility_score ?? null} />
          </View>
          <Text style={styles.cardSub} numberOfLines={1}>
            {city}{price ? ` · ${price}€/mes` : ''}
          </Text>
          <View style={styles.cardBottom}>
            <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusTxt, { color: st.color }]}>{st.label}</Text>
            </View>
            {isActive
              ? <View style={styles.chatCta}>
                  <Ionicons name="chatbubble-ellipses" size={13} color="#fff" />
                  <Text style={styles.chatCtaTxt}>Abrir chat</Text>
                </View>
              : <View style={styles.lockCta}>
                  <Ionicons name="lock-closed" size={12} color="#7c3aed" />
                  <Text style={styles.lockCtaTxt}>5€ desbloquear</Text>
                </View>
            }
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function MatchesScreen() {
  const { items, isLoading, error, refetch, replaceLead } = useMyMatches()
  const { unlock, isPaying } = useUnlockChat()
  const navigation = useNavigation<any>()
  const [sheetLead, setSheetLead] = useState<Lead | null>(null)
  const [showClosed, setShowClosed] = useState(false)

  const activeLeads  = items.filter(l => l.chat_unlocked_at && l.status !== 'closed_lost')
  const pendingLeads = items.filter(l => !l.chat_unlocked_at && l.status !== 'closed_lost')
  const closedLeads  = items.filter(l => l.status === 'closed_lost')

  const handlePress = (lead: Lead) => {
    if (lead.chat_unlocked_at) {
      navigation.navigate('Chat', {
        leadId: lead.id,
        counterpartyName: lead.property?.agency?.name ?? 'Propietario',
        propertyTitle: lead.property?.title ?? 'Inmueble',
      })
    } else {
      setSheetLead(lead)
    }
  }

  const handleConfirmPay = async () => {
    if (!sheetLead) return
    const updated = await unlock(sheetLead.id)
    if (updated) {
      replaceLead(updated)
      setSheetLead(null)
      Alert.alert('🎉 ¡Chat desbloqueado!', 'Ya puedes hablar directamente con el propietario.')
    }
  }

  if (isLoading && items.length === 0) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>
  )

  if (error && items.length === 0) return (
    <View style={styles.center}>
      <Ionicons name="wifi-outline" size={40} color="#cbd5e1" />
      <Text style={styles.errorTxt}>Sin conexión</Text>
      <TouchableOpacity onPress={refetch} style={styles.retryBtn}><Text style={styles.retryTxt}>Reintentar</Text></TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis solicitudes</Text>
          <Text style={styles.subtitle}>{items.length} piso{items.length !== 1 ? 's' : ''} solicitado{items.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: activeLeads.length > 0 ? '#d1fae5' : '#f1f5f9' }]}>
          <Ionicons name="chatbubble-ellipses" size={14} color={activeLeads.length > 0 ? '#059669' : '#94a3b8'} />
          <Text style={[styles.countTxt, { color: activeLeads.length > 0 ? '#059669' : '#94a3b8' }]}>{activeLeads.length}</Text>
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#7c3aed" />}
        ListHeaderComponent={
          <View>
            {/* Chats activos */}
            {activeLeads.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>💬 Chats activos</Text>
                {activeLeads.map(l => <LeadCard key={l.id} lead={l} onPress={() => handlePress(l)} />)}
              </View>
            )}

            {/* Pendientes */}
            {pendingLeads.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>⏳ Pendientes de respuesta</Text>
                {pendingLeads.map(l => <LeadCard key={l.id} lead={l} onPress={() => handlePress(l)} />)}
              </View>
            )}

            {/* Cerradas */}
            {closedLeads.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity onPress={() => setShowClosed(!showClosed)} style={styles.closedHeader}>
                  <Text style={styles.closedLabel}>Descartados ({closedLeads.length})</Text>
                  <Ionicons name={showClosed ? 'chevron-up' : 'chevron-down'} size={14} color="#9ca3af" />
                </TouchableOpacity>
                {showClosed && closedLeads.map(l => <LeadCard key={l.id} lead={l} onPress={() => {}} />)}
              </View>
            )}

            {/* Empty */}
            {items.length === 0 && (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={32} color="#7c3aed" /></View>
                <Text style={styles.emptyTitle}>Sin solicitudes todavía</Text>
                <Text style={styles.emptyTxt}>Explora los pisos en Descubrir y haz swipe para solicitar match</Text>
              </View>
            )}
          </View>
        }
        keyExtractor={() => 'header'}
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      {sheetLead && (
        <UnlockChatSheet
          lead={sheetLead}
          isVisible={!!sheetLead}
          isPaying={isPaying}
          onConfirm={handleConfirmPay}
          onCancel={() => setSheetLead(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f8fafc' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  title:      { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle:   { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  countTxt:   { fontSize: 13, fontWeight: '800' },

  section:      { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20,
    overflow: 'hidden', marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardActive: { borderWidth: 1.5, borderColor: '#a7f3d0' },

  cardImg: { width: 90, height: 100, backgroundColor: '#f1f5f9', position: 'relative' },
  noImg:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatBadge: {
    position: 'absolute', bottom: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },

  cardBody:   { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitle:  { flex: 1, fontSize: 13, fontWeight: '700', color: '#0f172a' },
  cardSub:    { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },

  scoreRing:  { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scoreVal:   { fontSize: 13, fontWeight: '800', lineHeight: 14 },
  scorePct:   { fontSize: 8, fontWeight: '700', lineHeight: 9 },

  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusTxt:  { fontSize: 10, fontWeight: '700' },

  chatCta:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chatCtaTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  lockCta:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  lockCtaTxt: { fontSize: 11, fontWeight: '700', color: '#7c3aed' },

  closedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  closedLabel:  { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 },

  empty:      { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptyTxt:   { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  errorTxt:  { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  retryBtn:  { backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
  retryTxt:  { color: '#fff', fontWeight: '700' },
})
