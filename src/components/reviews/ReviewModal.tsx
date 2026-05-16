/**
 * ReviewModal para móvil v2 — Cancelar funciona, solo aparece si chat está desbloqueado.
 */
import { useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../api/client'

interface Props {
  isOpen:           boolean
  onClose:          () => void
  onSuccess:        () => void
  leadId:           number
  reviewedUserId:   number
  reviewedUserName: string
}

const LABELS  = ['', 'Muy mal', 'Regular', 'Normal', 'Bueno', '¡Excelente!']
const PRESETS: Record<number, string[]> = {
  5: ['Muy puntual', 'Comunicación perfecta', 'Muy profesional'],
  4: ['Buena comunicación', 'Trato agradable', 'Cumplió lo prometido'],
  3: ['Correcto', 'Sin incidencias'],
  2: ['Tardó en responder', 'Poca información'],
  1: ['No recomendable', 'Mala experiencia'],
}

export default function ReviewModal({ isOpen, onClose, onSuccess, leadId, reviewedUserId, reviewedUserName }: Props) {
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const handleClose = () => {
    if (loading) return
    setRating(0); setComment(''); setDone(false)
    onClose() // Fix: esto debe funcionar correctamente
  }

  const handleSend = async () => {
    if (!rating) { Alert.alert('Valoración', 'Selecciona una puntuación'); return }
    setLoading(true)
    try {
      await api.post(`/leads/${leadId}/review`, { rating, comment: comment.trim() || undefined })
      setDone(true)
      setTimeout(() => { setDone(false); setRating(0); setComment(''); onSuccess() }, 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al enviar la reseña'
      Alert.alert('Error', msg)
    } finally { setLoading(false) }
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {done ? (
            <View style={styles.doneWrap}>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark" size={32} color="#059669" />
              </View>
              <Text style={styles.doneTitle}>¡Gracias!</Text>
              <Text style={styles.doneSub}>Tu valoración ayuda a la comunidad</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Valora a {reviewedUserName.split(' ')[0]}</Text>
                  <Text style={styles.sub}>¿Cómo fue tu experiencia?</Text>
                </View>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Estrellas */}
              <View style={styles.stars}>
                {[1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Ionicons
                      name={n <= rating ? 'star' : 'star-outline'}
                      size={40} color={n <= rating ? '#f59e0b' : '#cbd5e1'} />
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>}

              {/* Presets */}
              {rating > 0 && (
                <View style={styles.presets}>
                  {(PRESETS[rating] ?? []).map(p => (
                    <TouchableOpacity key={p} onPress={() => setComment(c => c ? `${c}. ${p}` : p)}
                      style={styles.presetChip}>
                      <Text style={styles.presetTxt}>+ {p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Comentario */}
              <TextInput value={comment} onChangeText={setComment} multiline
                placeholder="Cuenta tu experiencia: trato, rapidez, transparencia..."
                placeholderTextColor="#94a3b8" maxLength={500}
                style={styles.input} />
              <Text style={styles.charCount}>{comment.length}/500</Text>

              {/* Botones */}
              <View style={styles.btns}>
                <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.cancelBtn}>
                  <Text style={styles.cancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSend} disabled={loading || !rating}
                  style={[styles.sendBtn, (!rating || loading) && styles.sendBtnOff]}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.sendTxt}>Enviar reseña</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, maxHeight: '85%' },
  handle:   { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub:      { fontSize: 13, color: '#64748b', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  stars:        { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  starBtn:      { padding: 4 },
  ratingLabel:  { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#f59e0b', marginBottom: 14 },

  presets:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
  presetChip: { backgroundColor: '#f5f3ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#ede9fe' },
  presetTxt:  { fontSize: 12, fontWeight: '600', color: '#7c3aed' },

  input:     { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, fontSize: 14, color: '#0f172a', minHeight: 100, textAlignVertical: 'top', marginBottom: 4 },
  charCount: { fontSize: 10, color: '#94a3b8', textAlign: 'right', marginBottom: 20 },

  btns:      { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  sendBtn:   { flex: 2, paddingVertical: 14, borderRadius: 16, backgroundColor: '#7c3aed', alignItems: 'center',
    shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  sendBtnOff:{ backgroundColor: '#e2e8f0', shadowOpacity: 0 },
  sendTxt:   { fontSize: 15, fontWeight: '800', color: '#fff' },

  doneWrap:  { alignItems: 'center', paddingVertical: 40 },
  doneIcon:  { width: 64, height: 64, borderRadius: 20, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  doneSub:   { fontSize: 14, color: '#64748b' },
})
