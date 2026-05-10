import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    setError(null); setLoading(true)
    try {
      await register({ name, email, password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.logo}><Text style={styles.logoTxt}>M</Text></View>
          <Text style={styles.brand}>MatchHome</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Y empieza a hacer match con tu próximo hogar</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name} onChangeText={setName}
              placeholder="Tu nombre completo"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email} onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password} onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnTxt}>Crear cuenta gratis</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkBox}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoBox:   { alignItems: 'center', marginBottom: 30 },
  logo:      {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoTxt:   { color: '#fff', fontSize: 24, fontWeight: '800' },
  brand:     { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  header:    { marginBottom: 24 },
  title:     { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -1, marginBottom: 6 },
  subtitle:  { fontSize: 14, color: '#64748b' },
  form:      { gap: 14 },
  field:     { gap: 6 },
  label:     { fontSize: 13, fontWeight: '600', color: '#334155' },
  input:     {
    height: 52, paddingHorizontal: 16,
    backgroundColor: '#f8fafc', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    fontSize: 15, color: '#0f172a',
  },
  btn:       {
    height: 52, backgroundColor: '#0f172a',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  btnTxt:    { color: '#fff', fontSize: 15, fontWeight: '600' },
  linkBox:   { alignItems: 'center', paddingVertical: 12 },
  linkText:  { color: '#64748b', fontSize: 14 },
  linkBold:  { color: '#0f172a', fontWeight: '700' },
  errorBox:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorText: { color: '#991b1b', fontSize: 13, flex: 1 },
})
