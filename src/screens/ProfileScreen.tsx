import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
      ]
    )
  }

  if (!user) return null

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleChip}>
          <Ionicons name="person" size={12} color="#0f172a" />
          <Text style={styles.roleTxt}>Inquilino</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Stat icon="heart-outline"        label="Solicitudes"  value="—" />
        <View style={styles.statDivider} />
        <Stat icon="checkmark-done-outline" label="Aceptadas"   value="—" />
        <View style={styles.statDivider} />
        <Stat icon="time-outline"         label="Pendientes"   value="—" />
      </View>

      {/* Sección — Preferencias del algoritmo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <Text style={styles.sectionSub}>Mejora tu compatibilidad completando tu perfil</Text>
      </View>

      <Row icon="cash-outline"       label="Presupuesto máximo"   value="No indicado" disabled />
      <Row icon="calendar-outline"   label="Fecha de mudanza"     value="Flexible"    disabled />
      <Row icon="paw-outline"        label="Mascotas"             value="No"          disabled />
      <Row icon="people-outline"     label="Convivencia"          value="Solo/a"      disabled />

      {/* Sección — Cuenta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
      </View>

      <Row icon="lock-closed-outline" label="Cambiar contraseña" disabled />
      <Row icon="notifications-outline" label="Notificaciones"   disabled />
      <Row icon="help-circle-outline"   label="Ayuda y soporte"  disabled />

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutTxt}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>MatchHome · v1.0.0</Text>
    </ScrollView>
  )
}

function Stat({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color="#475569" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function Row({ icon, label, value, disabled }: { icon: any; label: string; value?: string; disabled?: boolean }) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.55 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color="#475569" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  avatar:    {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTxt: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name:      { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  email:     { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#f1f5f9', borderRadius: 99, marginTop: 10,
  },
  roleTxt:   { fontSize: 11, fontWeight: '700', color: '#0f172a' },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16, padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stat:        { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0' },
  statValue:   { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  statLabel:   { fontSize: 11, color: '#64748b', fontWeight: '500' },

  section: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' },
  sectionSub:   { fontSize: 12, color: '#64748b', marginTop: 4 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  rowIcon:   {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel:  { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '500' },
  rowValue:  { fontSize: 13, color: '#64748b' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutTxt: { color: '#dc2626', fontSize: 14, fontWeight: '700' },

  version:   { textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 8 },
})
