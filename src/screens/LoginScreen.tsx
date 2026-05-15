/**
 * LoginScreen — Rediseñado con nueva identidad visual MatchHome.
 */
import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const shakeAnim = useRef(new Animated.Value(0)).current

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password) { setError('Completa todos los campos'); shake(); return }
    setError(null); setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email o contraseña incorrectos')
      shake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo + hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoTxt}>M</Text>
          </View>
          <Text style={styles.brand}>MatchHome</Text>
          <Text style={styles.tagline}>El alquiler inteligente</Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bienvenido de vuelta</Text>
            <Text style={styles.cardSub}>Inicia sesión en tu cuenta</Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email} onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password} onChangeText={setPassword}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPwd}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.btn} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnTxt}>Iniciar sesión</Text>
              }
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divTxt}>¿No tienes cuenta?</Text>
              <View style={styles.divLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.secondaryBtn} activeOpacity={0.8}>
              <Text style={styles.secondaryTxt}>Crear cuenta gratis</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={styles.footer}>Al acceder aceptas los Términos de uso</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0c1524' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },

  hero:     { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#7c3aed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#7c3aed', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  logoTxt:  { color: '#fff', fontSize: 36, fontWeight: '900' },
  brand:    { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline:  { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },

  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: '#fff', borderRadius: 28,
    padding: 24,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 10 },
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#94a3b8', marginBottom: 20 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorTxt: { fontSize: 13, color: '#dc2626', fontWeight: '600', flex: 1 },

  field: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    backgroundColor: '#fafafa', paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, fontSize: 15, color: '#0f172a',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  eyeBtn: { padding: 4 },

  btn: {
    backgroundColor: '#7c3aed', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    marginTop: 4,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  divider:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  divLine:  { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  divTxt:   { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryTxt: { fontSize: 15, fontWeight: '700', color: '#475569' },

  footer: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 24, textAlign: 'center' },
})
