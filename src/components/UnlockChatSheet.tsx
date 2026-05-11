import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TouchableWithoutFeedback, ActivityIndicator, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { Lead } from '../types'

interface Props {
  visible: boolean
  lead: Lead | null
  isPaying: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export default function UnlockChatSheet({
  visible, lead, isPaying, error, onClose, onConfirm,
}: Props) {
  if (!lead?.property) return null

  const property = lead.property
  const cover = property.images?.[0]?.url

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isPaying ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={isPaying ? undefined : onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <View style={styles.iconBox}>
                <Ionicons name="chatbubble-ellipses" size={28} color="#10b981" />
              </View>

              <Text style={styles.title}>Iniciar conversación</Text>
              <Text style={styles.subtitle}>
                Paga 5€ para desbloquear el chat con el propietario y comenzar a hablar sobre este piso.
              </Text>

              <View style={styles.propertyRow}>
                {cover ? (
                  <Image source={cover} style={styles.propertyImage} contentFit="cover" />
                ) : (
                  <View style={[styles.propertyImage, styles.propertyImagePh]}>
                    <Ionicons name="image-outline" size={20} color="#cbd5e1" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                  <Text style={styles.propertyMeta}>
                    {property.location.city} · {property.specs.rooms} hab · {property.specs.size_m2}m²
                  </Text>
                  <Text style={styles.propertyPrice}>{property.pricing.amount}€/mes</Text>
                </View>
              </View>

              <View style={styles.bullets}>
                <Bullet text="Chat directo con el propietario" />
                <Bullet text="Sin intermediarios ni comisiones de agencia" />
                <Bullet text="Pago único · sin suscripciones" />
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.payBtn, isPaying && styles.payBtnDisabled]}
                onPress={onConfirm}
                disabled={isPaying}
                activeOpacity={0.85}
              >
                {isPaying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-open" size={18} color="#fff" />
                    <Text style={styles.payBtnTxt}>Pagar 5€ y abrir chat</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isPaying}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelTxt}>Ahora no</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
      <Text style={styles.bulletTxt}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center', marginBottom: 20,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  title:    { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 20, marginBottom: 20 },

  propertyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f8fafc', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  propertyImage:   { width: 56, height: 56, borderRadius: 10, backgroundColor: '#e2e8f0' },
  propertyImagePh: { alignItems: 'center', justifyContent: 'center' },
  propertyTitle:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  propertyMeta:    { fontSize: 12, color: '#64748b', marginTop: 2 },
  propertyPrice:   { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 4 },

  bullets:   { marginTop: 20, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletTxt: { fontSize: 13, color: '#475569' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginTop: 16,
  },
  errorTxt: { color: '#991b1b', fontSize: 12, flex: 1 },

  payBtn: {
    marginTop: 20,
    backgroundColor: '#10b981',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },

  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelTxt: { color: '#64748b', fontSize: 14, fontWeight: '600' },
})
