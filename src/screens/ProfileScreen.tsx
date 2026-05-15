/**
 * ProfileScreen — Perfil completo con datos reales.
 * Inquilino: stats de leads, completitud del perfil, badge, acceso a editar.
 * Propietario: rating, pisos activos, galón.
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, ActivityIndicator, Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useRef, useState } from 'react'
import { apiGet } from '../api/client'

interface TenantProfileData {
  max_budget?: number; net_income?: number; occupation_type?: string
  preferred_city?: string; bio?: string; has_pets?: boolean
  is_smoker?: boolean; documents_ready?: boolean; has_guarantor?: boolean
  lifestyle?: string; family_composition?: string
}

interface LeadStats { total: number; pending: number; accepted: number; chat_unlocked: number }

function completionPct(p: TenantProfileData | null): number {
  if (!p) return 0
  const fields = [p.max_budget, p.net_income, p.occupation_type, p.preferred_city, p.bio, p.family_composition]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

function BadgeChip({ badge }: { badge?: { emoji: string; label: string; color: string } }) {
  if (!badge?.emoji) return null
  return (
    <View style={[styles.badgeChip, { borderColor: badge.color, backgroundColor: badge.color + '20' }]}>
      <Text style={[styles.badgeTxt, { color: badge.color }]}>{badge.emoji} {badge.label}</Text>
    </View>
  )
}

function StatBox({ icon, label, value, color = '#7c3aed' }: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MenuItem({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && { backgroundColor: '#fef2f2' }]}>
        <Ionicons name={icon as any} size={18} color={danger ? '#ef4444' : '#475569'} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#ef4444' }]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {!danger && <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const navigation = useNavigation<any>()
  const [profile,   setProfile]   = useState<TenantProfileData | null>(null)
  const [leadStats, setLeadStats] = useState<LeadStats>({ total: 0, pending: 0, accepted: 0, chat_unlocked: 0 })
  const [loading,   setLoading]   = useState(true)
  const fadeAnim = useRef(new Animated.Value(0)).current

  const isTenant   = user?.role === 'tenant'
  const isLandlord = user?.role === 'landlord' || user?.role === 'agency_admin'
  const completion = isTenant ? completionPct(profile) : null

  useEffect(() => {
    Promise.all([
      isTenant ? apiGet('/me/tenant-profile').catch(() => null) : Promise.resolve(null),
      apiGet('/me/leads?per_page=100').catch(() => null),
    ]).then(([prof, leadsData]) => {
      if (prof?.data) setProfile(prof.data)
      if (leadsData?.data?.items) {
        const items = leadsData.data.items
        setLeadStats({
          total:        items.length,
          pending:      items.filter((l: any) => l.status === 'new' || l.status === 'contacted').length,
          accepted:     items.filter((l: any) => l.status === 'closed_won').length,
          chat_unlocked:items.filter((l: any) => l.chat_unlocked_at).length,
        })
      }
    }).finally(() => {
      setLoading(false)
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    })
  }, [])

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ])
  }

  if (!user) return null

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarTxt}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleChip}>
          <Ionicons name={isTenant ? 'search' : 'home'} size={11} color="#0f172a" />
          <Text style={styles.roleTxt}>
            {isTenant ? 'Inquilino' : isLandlord ? 'Propietario' : 'Agencia'}
          </Text>
        </View>
        {/* Badge galón */}
        {(user as any).badge && <BadgeChip badge={(user as any).badge} />}
      </View>

      {loading ? (
        <ActivityIndicator style={{ margin: 24 }} color="#7c3aed" />
      ) : (
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {isTenant ? (
              <>
                <StatBox icon="heart-outline"         label="Solicitudes"  value={leadStats.total}        color="#7c3aed" />
                <View style={styles.divider} />
                <StatBox icon="chatbubble-outline"    label="Chats activos" value={leadStats.chat_unlocked} color="#0891b2" />
                <View style={styles.divider} />
                <StatBox icon="checkmark-done-outline" label="Aceptados"   value={leadStats.accepted}      color="#059669" />
              </>
            ) : (
              <>
                <StatBox icon="home-outline"          label="Pisos"        value="—"   color="#7c3aed" />
                <View style={styles.divider} />
                <StatBox icon="people-outline"        label="Inquilinos"   value="—"   color="#0891b2" />
                <View style={styles.divider} />
                <StatBox icon="star-outline"          label="Valoración"   value="—"   color="#f59e0b" />
              </>
            )}
          </View>

          {/* Barra completitud (solo inquilinos) */}
          {isTenant && completion !== null && (
            <View style={styles.card}>
              <View style={styles.completionRow}>
                <Text style={styles.completionLabel}>Completitud del perfil</Text>
                <Text style={[styles.completionPct, { color: completion >= 80 ? '#059669' : completion >= 50 ? '#d97706' : '#7c3aed' }]}>
                  {completion}%
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, {
                  width: `${completion}%` as any,
                  backgroundColor: completion >= 80 ? '#059669' : completion >= 50 ? '#d97706' : '#7c3aed',
                }]} />
              </View>
              {completion < 70 && (
                <Text style={styles.completionHint}>
                  ⚡ Perfiles con +70% reciben 3x más respuestas
                </Text>
              )}
            </View>
          )}

          {/* Mi perfil */}
          <View style={styles.section}><Text style={styles.sectionTitle}>Mi Perfil</Text></View>

          {isTenant && (
            <>
              <MenuItem icon="person-outline" label="Editar perfil de inquilino"
                value={profile?.occupation_type ? '✓ Completado' : 'Incompleto'}
                onPress={() => navigation.navigate('TenantProfileEdit')} />
              <MenuItem icon="home-outline"   label="Ciudad preferida"
                value={profile?.preferred_city || 'No indicada'} />
              <MenuItem icon="cash-outline"   label="Presupuesto máximo"
                value={profile?.max_budget ? `${profile.max_budget}€/mes` : 'No indicado'} />
              <MenuItem icon="paw-outline"    label="Mascotas"
                value={profile?.has_pets ? 'Sí 🐾' : 'No'} />
            </>
          )}

          {isLandlord && (
            <>
              <MenuItem icon="home-outline"   label="Mis propiedades"     onPress={() => {}} />
              <MenuItem icon="people-outline" label="Solicitudes recibidas" onPress={() => {}} />
              <MenuItem icon="star-outline"   label="Mis valoraciones"    onPress={() => {}} />
            </>
          )}

          {/* Mis leads/matches */}
          <View style={styles.section}><Text style={styles.sectionTitle}>Mis Solicitudes</Text></View>
          <MenuItem icon="heart-outline"     label="Ver todas mis solicitudes"  onPress={() => navigation.navigate('Matches')} />
          <MenuItem icon="chatbubble-outline" label="Mis conversaciones"        onPress={() => navigation.navigate('Matches')} />

          {/* Cuenta */}
          <View style={styles.section}><Text style={styles.sectionTitle}>Cuenta</Text></View>
          <MenuItem icon="notifications-outline" label="Notificaciones"    onPress={() => navigation.navigate('Notifications')} />
          <MenuItem icon="help-circle-outline"   label="Ayuda y soporte"  onPress={() => {}} />
          <MenuItem icon="information-circle-outline" label="Acerca de MatchHome" value="v2.0" />

          {/* Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.logoutTxt}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24, paddingHorizontal: 20,
    backgroundColor: '#fff', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  avatarTxt: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name:      { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  email:     { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#f1f5f9', borderRadius: 99, marginTop: 8,
  },
  roleTxt:   { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  badgeChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  badgeTxt:  { fontSize: 11, fontWeight: '800' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: 12, padding: 16, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statBox:   { flex: 1, alignItems: 'center', gap: 6 },
  statIcon:  { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  divider:   { width: 1, backgroundColor: '#f1f5f9' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
    padding: 16, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  completionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  completionLabel:{ fontSize: 13, fontWeight: '700', color: '#0f172a' },
  completionPct:  { fontSize: 16, fontWeight: '800' },
  progressBg:     { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },
  completionHint: { fontSize: 11, color: '#7c3aed', marginTop: 8, fontWeight: '600' },

  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f8fafc',
  },
  menuIcon:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '500' },
  menuValue: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginRight: 4 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutTxt: { color: '#dc2626', fontSize: 14, fontWeight: '700' },
})
