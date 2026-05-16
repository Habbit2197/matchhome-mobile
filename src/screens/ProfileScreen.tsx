/**
 * ProfileScreen v2 — Perfil completo y editable con foto.
 * Edita: foto, bio, teléfono, ciudad preferida, presupuesto.
 * Accesos: Editar perfil inquilino, Publicar piso, Ayuda, Cerrar sesión.
 */
import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform, Image as RNImage,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../hooks/useAuth'
import { api, apiGet, apiPut } from '../api/client'

const MENU_TENANT = (nav: any, role: string) => [
  { icon: 'person-outline',      label: 'Editar perfil de inquilino', color: '#7c3aed', bg: '#f5f3ff', onPress: () => nav.navigate('TenantProfileEdit') },
  { icon: 'heart-outline',       label: 'Mis favoritos',             color: '#ef4444', bg: '#fef2f2', onPress: () => nav.navigate('Tabs', { screen: 'Favorites' }) },
  { icon: 'document-text-outline',label: 'Mis contratos',            color: '#2563eb', bg: '#eff6ff', onPress: () => Alert.alert('Contratos', 'Gestiona tus contratos desde la web por ahora.') },
]

const MENU_LANDLORD = (nav: any) => [
  { icon: 'home-outline',        label: 'Publicar piso',             color: '#7c3aed', bg: '#f5f3ff', onPress: () => nav.navigate('PublishProperty') },
  { icon: 'document-text-outline',label: 'Mis contratos',            color: '#2563eb', bg: '#eff6ff', onPress: () => Alert.alert('Contratos', 'Gestiona tus contratos desde la web.') },
]

const MENU_COMMON = (nav: any, logout: () => void) => [
  { icon: 'help-circle-outline', label: 'Ayuda y soporte',           color: '#059669', bg: '#ecfdf5', onPress: () => nav.navigate('Help') },
  { icon: 'shield-outline',      label: 'Privacidad y datos',        color: '#64748b', bg: '#f8fafc', onPress: () => Alert.alert('Privacidad', 'Cumplimos con el RGPD. matchhometeam@gmail.com') },
  { icon: 'log-out-outline',     label: 'Cerrar sesión',             color: '#ef4444', bg: '#fef2f2', onPress: () =>
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ])
  },
]

export default function ProfileScreen() {
  const navigation   = useNavigation<any>()
  const { user, logout, refresh } = useAuth()

  const [editing,   setEditing]  = useState(false)
  const [saving,    setSaving]   = useState(false)
  const [uploading, setUploading]= useState(false)

  const [name,   setName]   = useState(user?.name ?? '')
  const [phone,  setPhone]  = useState((user as any)?.phone ?? '')
  const [bio,    setBio]    = useState((user as any)?.bio ?? '')
  const [city,   setCity]   = useState((user as any)?.city ?? '')
  const [budget, setBudget] = useState((user as any)?.max_budget ?? '')
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    setName(user?.name ?? '')
    setPhone((user as any)?.phone ?? '')
    setBio((user as any)?.bio ?? '')
    setCity((user as any)?.city ?? '')
    setBudget((user as any)?.max_budget ?? '')
  }, [user]))

  const roleLabel  = user?.role === 'tenant' ? 'Inquilino' : user?.role === 'landlord' ? 'Propietario' : 'Agencia'
  const roleColor  = user?.role === 'tenant' ? '#7c3aed' : user?.role === 'landlord' ? '#2563eb' : '#059669'
  const avatar     = photoUri ?? (user as any)?.profile_photo_url ?? null
  const initial    = (user?.name ?? 'U').charAt(0).toUpperCase()

  // Calcular % de perfil completo
  const fields   = [name, phone, bio, city, budget]
  const filled   = fields.filter(Boolean).length
  const progress = Math.round((filled / fields.length) * 100)

  const handlePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    })
    if (!result.canceled) {
      const uri = result.assets[0].uri
      setPhotoUri(uri)
      setUploading(true)
      try {
        const form = new FormData()
        const ext  = uri.split('.').pop() ?? 'jpg'
        form.append('photo', { uri, name: `photo.${ext}`, type: `image/${ext}` } as any)
        await api.post('/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        await refresh()
        Alert.alert('✅ Foto actualizada')
      } catch { Alert.alert('Error', 'No se pudo subir la foto') }
      finally { setUploading(false) }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPut('/me/profile', { name, phone, bio, city, max_budget: budget || undefined })
      await refresh()
      setEditing(false)
      Alert.alert('✅ Perfil actualizado')
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil')
    } finally { setSaving(false) }
  }

  const isTenant   = user?.role === 'tenant'
  const isLandlord = user?.role === 'landlord'
  const menuItems  = [
    ...(isTenant   ? MENU_TENANT(navigation, user?.role ?? '') : []),
    ...(isLandlord ? MENU_LANDLORD(navigation)  : []),
    ...MENU_COMMON(navigation, logout),
  ]

  return (
    <ScrollView style={ss.root} showsVerticalScrollIndicator={false}>
      {/* Avatar + nombre */}
      <View style={ss.header}>
        <TouchableOpacity onPress={handlePhoto} disabled={uploading} style={ss.avatarWrap}>
          {avatar
            ? <Image source={{ uri: avatar }} style={ss.avatar} contentFit="cover" />
            : <View style={ss.avatarFallback}><Text style={ss.avatarTxt}>{initial}</Text></View>
          }
          <View style={ss.cameraBtn}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={14} color="#fff" />
            }
          </View>
        </TouchableOpacity>

        <View style={ss.headerInfo}>
          <Text style={ss.userName}>{user?.name}</Text>
          <Text style={ss.userEmail}>{user?.email}</Text>
          <View style={[ss.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[ss.roleTxt, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setEditing(!editing)} style={ss.editBtn}>
          <Ionicons name={editing ? 'close' : 'pencil'} size={16} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      {/* Barra de progreso */}
      <View style={ss.progressWrap}>
        <View style={ss.progressHeader}>
          <Text style={ss.progressLabel}>Perfil completo</Text>
          <Text style={ss.progressPct}>{progress}%</Text>
        </View>
        <View style={ss.progressBar}>
          <View style={[ss.progressFill, { width: `${progress}%` as any,
            backgroundColor: progress >= 80 ? '#059669' : progress >= 50 ? '#d97706' : '#7c3aed' }]} />
        </View>
        {progress < 100 && <Text style={ss.progressHint}>Completa tu perfil para mejorar tu score de compatibilidad</Text>}
      </View>

      {/* Formulario editable */}
      {editing && (
        <View style={ss.form}>
          <Text style={ss.formTitle}>Editar información</Text>

          {[
            { label: '👤 Nombre', value: name, set: setName, placeholder: 'Tu nombre completo' },
            { label: '📱 Teléfono', value: phone, set: setPhone, placeholder: '+34 600 000 000', keyboard: 'phone-pad' },
            { label: '📍 Ciudad preferida', value: city, set: setCity, placeholder: 'Madrid, Barcelona...' },
            { label: '💰 Presupuesto máximo (€)', value: String(budget), set: setBudget, placeholder: '900', keyboard: 'numeric' },
          ].map(f => (
            <View key={f.label} style={ss.field}>
              <Text style={ss.fieldLabel}>{f.label}</Text>
              <TextInput value={f.value} onChangeText={f.set}
                placeholder={f.placeholder} placeholderTextColor="#94a3b8"
                keyboardType={(f as any).keyboard ?? 'default'}
                style={ss.fieldInput} />
            </View>
          ))}

          <View style={ss.field}>
            <Text style={ss.fieldLabel}>💬 Bio / Presentación</Text>
            <TextInput value={bio} onChangeText={setBio} multiline rows={3}
              placeholder="Cuéntanos algo sobre ti..." placeholderTextColor="#94a3b8"
              style={[ss.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]} />
          </View>

          <TouchableOpacity onPress={handleSave} disabled={saving} style={ss.saveBtn}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={ss.saveTxt}>Guardar cambios</Text></>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Info del perfil (modo lectura) */}
      {!editing && (bio || city || phone) && (
        <View style={ss.infoCard}>
          {bio   && <Text style={ss.bioTxt}>{bio}</Text>}
          {city  && <View style={ss.infoRow}><Ionicons name="location-outline" size={14} color="#94a3b8" /><Text style={ss.infoTxt}>{city}</Text></View>}
          {phone && <View style={ss.infoRow}><Ionicons name="call-outline" size={14} color="#94a3b8" /><Text style={ss.infoTxt}>{phone}</Text></View>}
          {budget && <View style={ss.infoRow}><Ionicons name="cash-outline" size={14} color="#94a3b8" /><Text style={ss.infoTxt}>Hasta {budget}€/mes</Text></View>}
        </View>
      )}

      {/* Menú de acciones */}
      <View style={ss.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} onPress={item.onPress} style={ss.menuItem}>
            <View style={[ss.menuIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={ss.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={ss.version}>MatchHome v1.0 · matchhometeam@gmail.com</Text>
    </ScrollView>
  )
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarWrap:    { position: 'relative' },
  avatar:        { width: 72, height: 72, borderRadius: 24, backgroundColor: '#f1f5f9' },
  avatarFallback:{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 28, fontWeight: '800', color: '#fff' },
  cameraBtn:     { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff' },
  headerInfo:    { flex: 1 },
  userName:      { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  userEmail:     { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  roleBadge:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 5 },
  roleTxt:       { fontSize: 11, fontWeight: '700' },
  editBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' },

  progressWrap:  { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  progressPct:   { fontSize: 12, fontWeight: '800', color: '#7c3aed' },
  progressBar:   { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressHint:  { fontSize: 11, color: '#94a3b8', marginTop: 6 },

  form:       { backgroundColor: '#fff', margin: 12, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  formTitle:  { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  field:      { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  fieldInput: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, fontSize: 14, color: '#0f172a' },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7c3aed', borderRadius: 16, padding: 14, marginTop: 8,
    shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  saveTxt:    { color: '#fff', fontWeight: '800', fontSize: 15 },

  infoCard:  { backgroundColor: '#fff', margin: 12, borderRadius: 20, padding: 16, gap: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  bioTxt:    { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 4 },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTxt:   { fontSize: 13, color: '#64748b' },

  menu:     { margin: 12, gap: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },

  version: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginBottom: 32 },
})
