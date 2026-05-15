/**
 * TenantProfileEditScreen — Edición del perfil de inquilino en móvil.
 * Nueva pantalla, añadir al Stack en RootNavigator como "TenantProfileEdit".
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, ActivityIndicator, Switch,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useState, useEffect } from 'react'
import { apiGet, apiPut } from '../api/client'

interface Profile {
  max_budget?: number; net_income?: number; employment_status?: string
  occupation_type?: string; preferred_city?: string; preferred_zone?: string
  min_rooms_needed?: number; has_pets?: boolean; pet_details?: string
  is_smoker?: boolean; lifestyle?: string; work_from_home?: boolean
  has_guarantor?: boolean; documents_ready?: boolean; bio?: string
  family_composition?: string; tenant_count?: number
}

const OCCUPATION_OPTIONS = [
  { value: 'student',       label: '🎓 Estudiante' },
  { value: 'mir_student',   label: '🏥 MIR' },
  { value: 'professional',  label: '💼 Profesional' },
  { value: 'self_employed', label: '🧑‍💻 Autónomo' },
  { value: 'couple',        label: '👫 Pareja' },
  { value: 'family',        label: '👨‍👩‍👦 Familia' },
  { value: 'other',         label: '❓ Otro' },
]

const LIFESTYLE_OPTIONS = [
  { value: 'quiet',  label: '🤫 Tranquilo' },
  { value: 'mixed',  label: '😊 Equilibrado' },
  { value: 'social', label: '🎉 Social' },
]

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>
}

function Input({ value, onChange, placeholder, keyboardType = 'default', multiline = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  keyboardType?: any; multiline?: boolean
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      style={[styles.input, multiline && styles.inputMulti]}
    />
  )
}

function ChipGroup({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value?: string; onChange: (v: string) => void
}) {
  return (
    <View style={styles.chipGroup}>
      {options.map(o => (
        <TouchableOpacity key={o.value} onPress={() => onChange(o.value)}
          style={[styles.chip, value === o.value && styles.chipSelected]}>
          <Text style={[styles.chipTxt, value === o.value && styles.chipTxtSelected]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Label text={label} />
      {children}
    </View>
  )
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {desc && <Text style={styles.toggleDesc}>{desc}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#7c3aed' }} />
    </View>
  )
}

export default function TenantProfileEditScreen() {
  const navigation = useNavigation()
  const [profile, setProfile] = useState<Profile>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    apiGet('/me/tenant-profile')
      .then(r => { if (r?.data) setProfile(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (k: keyof Profile, v: any) => setProfile(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPut('/me/tenant-profile', profile)
      Alert.alert('✅ Guardado', 'Tu perfil ha sido actualizado.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator color="#7c3aed" size="large" />
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Navbar */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mi Perfil de Inquilino</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveTxt}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Nivel 1 — Esencial */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💼 Perfil Esencial</Text>

          <Row label="¿Qué tipo de inquilino eres?">
            <ChipGroup options={OCCUPATION_OPTIONS} value={profile.occupation_type} onChange={v => set('occupation_type', v)} />
          </Row>

          <View style={styles.grid2}>
            <View style={{ flex: 1 }}>
              <Label text="Presupuesto máx. (€/mes)" />
              <Input value={String(profile.max_budget ?? '')} onChange={v => set('max_budget', v ? +v : undefined)} placeholder="900" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Ingresos netos (€/mes)" />
              <Input value={String(profile.net_income ?? '')} onChange={v => set('net_income', v ? +v : undefined)} placeholder="2500" keyboardType="numeric" />
            </View>
          </View>

          <Row label="Situación laboral">
            <ChipGroup
              options={['Indefinido','Temporal','Autónomo','Estudiante','MIR','Funcionario'].map(s => ({ value: s, label: s }))}
              value={profile.employment_status}
              onChange={v => set('employment_status', v)}
            />
          </Row>
        </View>

        {/* Nivel 2 — Preferencias */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Preferencias del Piso</Text>

          <View style={styles.grid2}>
            <View style={{ flex: 1 }}>
              <Label text="Ciudad preferida" />
              <Input value={profile.preferred_city ?? ''} onChange={v => set('preferred_city', v)} placeholder="Madrid" />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Zona / Barrio" />
              <Input value={profile.preferred_zone ?? ''} onChange={v => set('preferred_zone', v)} placeholder="Centro" />
            </View>
          </View>

          <Row label="Habitaciones mínimas">
            <ChipGroup
              options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n}+` }))}
              value={String(profile.min_rooms_needed ?? '')}
              onChange={v => set('min_rooms_needed', +v)}
            />
          </Row>

          <ToggleRow label="Teletrabajo" desc="Necesito buen espacio para trabajar"
            value={!!profile.work_from_home} onChange={v => set('work_from_home', v)} />
        </View>

        {/* Nivel 3 — Convivencia */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌿 Estilo de Vida</Text>

          <Row label="Estilo de vida">
            <ChipGroup options={LIFESTYLE_OPTIONS} value={profile.lifestyle} onChange={v => set('lifestyle', v)} />
          </Row>

          <ToggleRow label="Tengo mascota(s)" value={!!profile.has_pets} onChange={v => set('has_pets', v)} />
          {profile.has_pets && (
            <View style={{ marginTop: 8 }}>
              <Label text="Cuéntanos sobre tu mascota" />
              <Input value={profile.pet_details ?? ''} onChange={v => set('pet_details', v)} placeholder="Perro pequeño, muy tranquilo..." />
            </View>
          )}
          <ToggleRow label="Soy fumador/a" value={!!profile.is_smoker} onChange={v => set('is_smoker', v)} />
        </View>

        {/* Nivel 4 — Confianza */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛡️ Confianza y Solvencia</Text>

          <ToggleRow label="Cuento con avalista/fiador"
            desc="Alguien que responda solidariamente"
            value={!!profile.has_guarantor} onChange={v => set('has_guarantor', v)} />
          <ToggleRow label="Tengo documentación lista"
            desc="Nóminas, DNI, todo listo para firmar"
            value={!!profile.documents_ready} onChange={v => set('documents_ready', v)} />

          <Row label="Carta de presentación">
            <Input value={profile.bio ?? ''} onChange={v => set('bio', v)}
              placeholder="Soy médico residente, tranquilo y ordenado..."
              multiline />
          </Row>
        </View>

        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtnLarge}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.saveLargeTxt}>Guardar perfil</Text></>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn:  { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  saveBtn:  { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  saveTxt:  { color: '#fff', fontSize: 13, fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 16 },

  label:  { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input:  {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a',
    backgroundColor: '#fafafa',
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },

  grid2: { flexDirection: 'row', gap: 10 },

  row: { marginTop: 4 },

  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fafafa' },
  chipSelected: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTxtSelected: { color: '#7c3aed' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f8fafc', marginTop: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  toggleDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  saveBtnLarge: {
    backgroundColor: '#7c3aed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 16, marginTop: 8,
  },
  saveLargeTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
