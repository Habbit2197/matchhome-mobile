/**
 * PublishPropertyScreen — Publicar piso desde móvil.
 * Formulario simplificado en 3 pasos: básico → detalles → fotos.
 */
import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../api/client'

type Step = 1 | 2 | 3
type PropertyType = 'flat' | 'house' | 'room'

interface FormData {
  title:       string
  type:        PropertyType
  city:        string
  zip_code:    string
  price:       string
  size:        string
  rooms:       string
  bathrooms:   string
  description: string
  allows_pets:     boolean
  allows_smokers:  boolean
}

const TYPE_OPTS: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'flat',  label: 'Piso / Apartamento', icon: 'business-outline' },
  { value: 'house', label: 'Casa / Chalet',       icon: 'home-outline'     },
  { value: 'room',  label: 'Habitación',          icon: 'bed-outline'      },
]

function StepIndicator({ step }: { step: Step }) {
  const steps = ['Básico', 'Detalles', 'Fotos']
  return (
    <View style={ss.stepRow}>
      {steps.map((s, i) => (
        <View key={s} style={ss.stepItem}>
          <View style={[ss.stepCircle, i + 1 <= step && ss.stepCircleActive]}>
            {i + 1 < step
              ? <Ionicons name="checkmark" size={14} color="#fff" />
              : <Text style={[ss.stepNum, i + 1 <= step && ss.stepNumActive]}>{i + 1}</Text>
            }
          </View>
          <Text style={[ss.stepLabel, i + 1 <= step && ss.stepLabelActive]}>{s}</Text>
          {i < steps.length - 1 && <View style={[ss.stepLine, i + 1 < step && ss.stepLineActive]} />}
        </View>
      ))}
    </View>
  )
}

export default function PublishPropertyScreen() {
  const navigation = useNavigation<any>()
  const [step, setStep]       = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [images, setImages]   = useState<string[]>([])
  const [form, setForm]       = useState<FormData>({
    title: '', type: 'flat', city: '', zip_code: '',
    price: '', size: '', rooms: '', bathrooms: '',
    description: '', allows_pets: false, allows_smokers: false,
  })

  const set = (key: keyof FormData, val: any) => setForm(f => ({ ...f, [key]: val }))

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8,
    })
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 8))
    }
  }

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.title.trim()) { Alert.alert('Campo requerido', 'Añade un título al anuncio'); return false }
      if (!form.city.trim())  { Alert.alert('Campo requerido', 'Indica la ciudad'); return false }
      return true
    }
    if (step === 2) {
      if (!form.price || isNaN(+form.price)) { Alert.alert('Campo requerido', 'Indica el precio mensual'); return false }
      if (!form.size  || isNaN(+form.size))  { Alert.alert('Campo requerido', 'Indica el tamaño en m²'); return false }
      if (!form.rooms || isNaN(+form.rooms)) { Alert.alert('Campo requerido', 'Indica el número de habitaciones'); return false }
      if (!form.description.trim())          { Alert.alert('Campo requerido', 'Añade una descripción'); return false }
      return true
    }
    return true
  }

  const next = () => {
    if (!validateStep()) return
    if (step < 3) setStep(s => (s + 1) as Step)
    else publish()
  }

  const publish = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'boolean') formData.append(k, v ? '1' : '0')
        else formData.append(k, String(v))
      })
      images.forEach((uri, i) => {
        const ext  = uri.split('.').pop() ?? 'jpg'
        const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`
        formData.append('images[]', { uri, name: `photo_${i}.${ext}`, type } as any)
      })

      await api.post('/properties', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

      Alert.alert('¡Piso publicado!', 'Tu piso ya está disponible para los inquilinos.', [
        { text: 'Ver mis pisos', onPress: () => navigation.goBack() }
      ])
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo publicar el piso')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={ss.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={ss.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => (s - 1) as Step) : navigation.goBack()} style={ss.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Publicar piso</Text>
        <View style={{ width: 40 }} />
      </View>

      <StepIndicator step={step} />

      <ScrollView style={ss.scroll} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* ── PASO 1: Básico ─────────────────────────────── */}
        {step === 1 && (
          <>
            <Text style={ss.sectionTitle}>¿Qué tipo de inmueble es?</Text>
            <View style={ss.typeRow}>
              {TYPE_OPTS.map(t => (
                <TouchableOpacity key={t.value} onPress={() => set('type', t.value)}
                  style={[ss.typeBtn, form.type === t.value && ss.typeBtnActive]}>
                  <Ionicons name={t.icon as any} size={22} color={form.type === t.value ? '#7c3aed' : '#94a3b8'} />
                  <Text style={[ss.typeTxt, form.type === t.value && ss.typeTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ss.sectionTitle}>Título del anuncio</Text>
            <TextInput value={form.title} onChangeText={v => set('title', v)}
              placeholder="Ej: Luminoso piso céntrico con terraza"
              style={ss.input} placeholderTextColor="#94a3b8" />

            <View style={ss.row}>
              <View style={ss.half}>
                <Text style={ss.label}>Ciudad *</Text>
                <TextInput value={form.city} onChangeText={v => set('city', v)}
                  placeholder="Madrid" style={ss.input} placeholderTextColor="#94a3b8" />
              </View>
              <View style={ss.half}>
                <Text style={ss.label}>Código postal</Text>
                <TextInput value={form.zip_code} onChangeText={v => set('zip_code', v)}
                  placeholder="28001" keyboardType="numeric" style={ss.input} placeholderTextColor="#94a3b8" />
              </View>
            </View>
          </>
        )}

        {/* ── PASO 2: Detalles ───────────────────────────── */}
        {step === 2 && (
          <>
            <View style={ss.row}>
              <View style={ss.half}>
                <Text style={ss.label}>Precio/mes (€) *</Text>
                <TextInput value={form.price} onChangeText={v => set('price', v)}
                  keyboardType="decimal-pad" placeholder="950" style={ss.input} placeholderTextColor="#94a3b8" />
              </View>
              <View style={ss.half}>
                <Text style={ss.label}>Tamaño (m²) *</Text>
                <TextInput value={form.size} onChangeText={v => set('size', v)}
                  keyboardType="decimal-pad" placeholder="70" style={ss.input} placeholderTextColor="#94a3b8" />
              </View>
            </View>

            <View style={ss.row}>
              <View style={ss.half}>
                <Text style={ss.label}>Habitaciones *</Text>
                <TextInput value={form.rooms} onChangeText={v => set('rooms', v)}
                  keyboardType="numeric" placeholder="3" style={ss.input} placeholderTextColor="#94a3b8" />
              </View>
              <View style={ss.half}>
                <Text style={ss.label}>Baños</Text>
                <TextInput value={form.bathrooms} onChangeText={v => set('bathrooms', v)}
                  keyboardType="numeric" placeholder="1" style={ss.input} placeholderTextColor="#94a3b8" />
              </View>
            </View>

            <Text style={ss.label}>Descripción *</Text>
            <TextInput value={form.description} onChangeText={v => set('description', v)}
              placeholder="Describe el piso: luminosidad, orientación, vecindario, transporte cercano..."
              multiline rows={5} style={[ss.input, ss.textarea]}
              placeholderTextColor="#94a3b8" textAlignVertical="top" />

            <Text style={ss.sectionTitle}>Normas del piso</Text>
            <View style={ss.toggleRow}>
              <TouchableOpacity onPress={() => set('allows_pets', !form.allows_pets)} style={ss.toggleBtn}>
                <Ionicons name={form.allows_pets ? 'checkbox' : 'square-outline'} size={22} color={form.allows_pets ? '#7c3aed' : '#94a3b8'} />
                <Text style={ss.toggleTxt}>🐾 Se admiten mascotas</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => set('allows_smokers', !form.allows_smokers)} style={ss.toggleBtn}>
                <Ionicons name={form.allows_smokers ? 'checkbox' : 'square-outline'} size={22} color={form.allows_smokers ? '#7c3aed' : '#94a3b8'} />
                <Text style={ss.toggleTxt}>🚬 Se permite fumar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── PASO 3: Fotos ─────────────────────────────── */}
        {step === 3 && (
          <>
            <Text style={ss.sectionTitle}>Fotos del piso</Text>
            <Text style={ss.helpTxt}>Añade hasta 8 fotos. La primera será la portada del anuncio.</Text>

            <TouchableOpacity onPress={pickImages} style={ss.addPhotoBtn}>
              <Ionicons name="camera" size={28} color="#7c3aed" />
              <Text style={ss.addPhotoTxt}>Seleccionar fotos</Text>
              <Text style={ss.addPhotoSub}>{images.length}/8 fotos seleccionadas</Text>
            </TouchableOpacity>

            <View style={ss.photoGrid}>
              {images.map((uri, i) => (
                <View key={i} style={ss.photoWrap}>
                  <Image source={{ uri }} style={ss.photo} contentFit="cover" />
                  {i === 0 && <View style={ss.coverBadge}><Text style={ss.coverTxt}>Portada</Text></View>}
                  <TouchableOpacity onPress={() => removeImage(i)} style={ss.removeBtn}>
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {images.length === 0 && (
              <View style={ss.noPhotoHint}>
                <Ionicons name="image-outline" size={40} color="#cbd5e1" />
                <Text style={ss.noPhotoTxt}>Los pisos con fotos reciben 3x más solicitudes</Text>
              </View>
            )}

            <View style={ss.summaryCard}>
              <Text style={ss.summaryTitle}>Resumen del anuncio</Text>
              <Text style={ss.summaryTxt}>{form.title}</Text>
              <Text style={ss.summaryMeta}>{form.city} · {form.rooms} hab · {form.size}m² · {form.price}€/mes</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={ss.footer}>
        <TouchableOpacity onPress={next} disabled={loading} style={[ss.cta, loading && ss.ctaOff]}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={ss.ctaTxt}>{step < 3 ? 'Continuar' : '🚀 Publicar piso'}</Text>
                <Ionicons name={step < 3 ? 'arrow-forward' : 'checkmark-circle'} size={18} color="#fff" />
              </>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const ss = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn:     { w: 40, h: 40, borderRadius: 20, backgroundColor: '#f1f5f9', padding: 8, alignItems: 'center', justifyContent: 'center' } as any,
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  scroll:      { flex: 1 },

  stepRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#fff', gap: 0 },
  stepItem:   { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  stepCircleActive: { backgroundColor: '#7c3aed' },
  stepNum:    { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  stepNumActive: { color: '#fff' },
  stepLabel:  { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginRight: 8 },
  stepLabelActive: { color: '#7c3aed' },
  stepLine:   { width: 24, height: 2, backgroundColor: '#e2e8f0', marginRight: 8 },
  stepLineActive: { backgroundColor: '#7c3aed' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12, marginTop: 8 },
  label:        { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  helpTxt:      { fontSize: 13, color: '#64748b', marginBottom: 16 },

  typeRow: { flexDirection: 'column', gap: 8, marginBottom: 16 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  typeBtnActive: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  typeTxt:       { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  typeTxtActive: { color: '#7c3aed' },

  row:    { flexDirection: 'row', gap: 12, marginBottom: 4 },
  half:   { flex: 1 },
  input:  { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, fontSize: 14, color: '#0f172a', marginBottom: 12 },
  textarea:{ minHeight: 110 },

  toggleRow: { gap: 10, marginBottom: 8 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },

  addPhotoBtn: { borderWidth: 2, borderColor: '#7c3aed', borderStyle: 'dashed', borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, backgroundColor: '#faf9ff', marginBottom: 16 },
  addPhotoTxt: { fontSize: 15, fontWeight: '700', color: '#7c3aed' },
  addPhotoSub: { fontSize: 12, color: '#94a3b8' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoWrap: { width: '30%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photo:     { width: '100%', height: '100%' },
  coverBadge:{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(124,58,237,0.85)', padding: 3, alignItems: 'center' },
  coverTxt:  { fontSize: 9, color: '#fff', fontWeight: '700' },
  removeBtn: { position: 'absolute', top: 4, right: 4 },

  noPhotoHint: { alignItems: 'center', padding: 24, gap: 8 },
  noPhotoTxt:  { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  summaryCard:  { backgroundColor: '#f5f3ff', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#ede9fe' },
  summaryTitle: { fontSize: 11, fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryTxt:   { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  summaryMeta:  { fontSize: 12, color: '#64748b' },

  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  cta:    { backgroundColor: '#7c3aed', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  ctaOff: { backgroundColor: '#e2e8f0', shadowOpacity: 0 },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
})
