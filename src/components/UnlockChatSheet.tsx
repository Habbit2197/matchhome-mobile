/**
 * UnlockChatSheet v2 — Modal nativo para desbloquear chat (5€).
 * Props actualizadas: isVisible/onCancel/onConfirm (con aliases para retrocompat).
 */
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { Lead } from '../types'

interface Props {
  // Props nuevas (MatchesScreen v2)
  isVisible?: boolean
  onCancel?:  () => void
  onConfirm?: () => void
  // Props antiguas (retrocompatibilidad)
  visible?:   boolean
  onClose?:   () => void
  // Comunes
  lead:       Lead | null
  isPaying:   boolean
  error?:     string | null
}

export default function UnlockChatSheet({
  isVisible, visible, lead, isPaying, error,
  onCancel, onClose, onConfirm,
}: Props) {
  const show    = isVisible ?? visible ?? false
  const dismiss = onCancel ?? onClose ?? (() => {})
  const confirm = onConfirm ?? (() => {})

  if (!lead?.property) return null

  const property = lead.property
  const cover    = property.images?.[0]?.url
  const score    = lead.compatibility_score

  return (
    <Modal visible={show} transparent animationType="slide"
      onRequestClose={isPaying ? undefined : dismiss}>
      <TouchableWithoutFeedback onPress={isPaying ? undefined : dismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Icono principal */}
              <View style={styles.iconBox}>
                <Ionicons name="chatbubble-ellipses" size={28} color="#7c3aed" />
              </View>

              <Text style={styles.title}>Desbloquear chat</Text>
              <Text style={styles.subtitle}>
                Paga 5€ para hablar directamente con el propietario y coordinar una visita.
              </Text>

              {/* Piso */}
              <View style={styles.propertyRow}>
                {cover
                  ? <Image source={{ uri: cover }} style={styles.propertyImg} contentFit="cover" />
                  : <View style={[styles.propertyImg, styles.propertyImgPh]}>
                      <Ionicons name="image-outline" size={20} color="#cbd5e1" />
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                  <Text style={styles.propertyMeta}>
                    {property.location?.city} · {property.specs?.rooms} hab · {property.specs?.size_m2}m²
                  </Text>
                  {score != null && (
                    <View style={styles.scorePill}>
                      <Text style={styles.scoreTxt}>{score}% compatibilidad</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Precio */}
              <View style={styles.priceBox}>
                <Text style={styles.priceBig}>5€</Text>
                <Text style={styles.priceSub}>Pago único · Sin suscripción</Text>
              </View>

              {/* Beneficios */}
              <View style={styles.benefits}>
                {['Chat directo con el propietario','Coordinar visitas','Negociar condiciones','Contratos digitales'].map(b => (
                  <View key={b} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.benefitTxt}>{b}</Text>
                  </View>
                ))}
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              )}

              {/* Botones */}
              <TouchableOpacity onPress={confirm} disabled={isPaying}
                style={[styles.payBtn, isPaying && styles.payBtnDisabled]} activeOpacity={0.85}>
                {isPaying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="lock-open" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.payBtnTxt}>Pagar 5€ y abrir chat</Text></>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={dismiss} disabled={isPaying} style={styles.cancelBtn}>
                <Text style={styles.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>

              {/* Garantía */}
              <View style={styles.guarantee}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#94a3b8" />
                <Text style={styles.guaranteeTxt}>Si el propietario no responde, te devolvemos el dinero</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    alignItems: 'center',
  },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginBottom: 20 },
  iconBox:{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:   { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6, textAlign: 'center' },
  subtitle:{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 19 },

  propertyRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 16, padding: 12, width: '100%', marginBottom: 16 },
  propertyImg:  { width: 60, height: 60, borderRadius: 12 },
  propertyImgPh:{ backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  propertyTitle:{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  propertyMeta: { fontSize: 11, color: '#94a3b8' },
  scorePill:    { backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  scoreTxt:     { fontSize: 10, fontWeight: '700', color: '#7c3aed' },

  priceBox: { alignItems: 'center', marginBottom: 16 },
  priceBig: { fontSize: 42, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  priceSub: { fontSize: 12, color: '#94a3b8', marginTop: -4 },

  benefits:    { width: '100%', gap: 8, marginBottom: 20 },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitTxt:  { fontSize: 13, color: '#374151', fontWeight: '500' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, width: '100%', marginBottom: 12 },
  errorTxt: { fontSize: 12, color: '#dc2626', fontWeight: '600', flex: 1 },

  payBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 16, width: '100%', marginBottom: 10,
    shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  payBtnDisabled:{ opacity: 0.7 },
  payBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '800' },

  cancelBtn: { paddingVertical: 12, width: '100%', alignItems: 'center', marginBottom: 8 },
  cancelTxt: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },

  guarantee:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  guaranteeTxt:{ fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'center' },
})
