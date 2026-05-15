/**
 * RegisterScreen — Con selección de rol (inquilino / propietario / agencia).
 */
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'

type Role = 'tenant' | 'landlord' | 'agency_admin'

const ROLES: { id: Role; icon: string; label: string; desc: string }[] = [
  { id: 'tenant',      icon: 'search',      label: 'Busco piso',   desc: 'Inquilino' },
  { id: 'landlord',    icon: 'home',        label: 'Tengo un piso',desc: 'Propietario' },
  { id: 'agency_admin',icon: 'business',    label: 'Soy agencia',  desc: 'Inmobiliaria' },
]

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth()
  const [role,     setRole]     = useState<Role>('tenant')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) { setError('Completa todos los campos'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setError(null); setLoading(true)
    try {
      await register({ name: name.trim(), email: email.trim(), password, password_confirmation: password, role })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}><Text style={styles.logoTxt}>M</Text></View>
          <Text style={styles.brand}>MatchHome</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear cuenta gratis</Text>
          <Text style={styles.cardSub}>¿Qué tipo de cuenta necesitas?</Text>

          {/* Selector rol */}
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity key={r.id} onPress={() => setRole(r.id)} activeOpacity={0.8}
                style={[styles.roleBtn, role === r.id && styles.roleBtnActive]}>
                <Ionicons name={r.icon as any} size={20} color={role === r.id ? '#7c3aed' : '#94a3b8'} />
                <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>{r.label}</Text>
                <Text style={[styles.roleDesc, role === r.id && { color: '#7c3aed' }]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          {[
            { label: 'Nombre completo', value: name, set: setName, placeholder: 'Tu nombre', icon: 'person-outline', keyboardType: 'default', secure: false },
            { label: 'Email',           value: email, set: setEmail, placeholder: 'tu@email.com', icon: 'mail-outline', keyboardType: 'email-address', secure: false },
          ].map(f => (
            <View key={f.label} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name={f.icon as any} size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput style={styles.input} value={f.value} onChangeText={f.set}
                  placeholder={f.placeholder} placeholderTextColor="#94a3b8"
                  keyboardType={f.keyboardType as any} autoCapitalize="none" />
              </View>
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]}
                value={password} onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres" placeholderTextColor="#94a3b8"
                secureTextEntry={!showPwd} returnKeyType="done" onSubmitEditing={handleSubmit} />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.btn} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Crear cuenta</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divTxt}>¿Ya tienes cuenta?</Text>
            <View style={styles.divLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.secondaryBtn} activeOpacity={0.8}>
            <Text style={styles.secondaryTxt}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Al registrarte aceptas los Términos y la Política de privacidad</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0c1524' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  hero:   { alignItems: 'center', marginBottom: 24 },
  logoWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoTxt:  { color: '#fff', fontSize: 28, fontWeight: '900' },
  brand:    { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 10 } },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#94a3b8', marginBottom: 16 },

  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleBtn: { flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fafafa' },
  roleBtnActive: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  roleLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  roleLabelActive: { color: '#7c3aed' },
  roleDesc:  { fontSize: 9, color: '#94a3b8', textAlign: 'center' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorTxt: { fontSize: 13, color: '#dc2626', fontWeight: '600', flex: 1 },

  field: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, backgroundColor: '#fafafa', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#0f172a', paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
  eyeBtn: { padding: 4 },

  btn: { backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 4, shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  divTxt:  { fontSize: 12, color: '#94a3b8' },
  secondaryBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  secondaryTxt: { fontSize: 15, fontWeight: '700', color: '#475569' },
  footer: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 20, textAlign: 'center', paddingHorizontal: 20 },
})
