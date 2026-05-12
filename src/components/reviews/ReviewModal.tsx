/**
 * Modal nativo para escribir una reseña sobre el otro participante de un lead.
 *
 * Diseño: bottom-sheet centrado en pantalla. 5 estrellas tappables con
 * etiqueta dinámica ("Excelente", "Buena"...) y campo de comentario opcional.
 */
import { useState } from "react"
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { api } from "../../api/client"

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  reviewedUserId: number
  reviewedUserName: string
  leadId: number
}

const LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"]

export default function ReviewModal({
  visible, onClose, onSuccess,
  reviewedUserId, reviewedUserName, leadId,
}: Props) {
  const [rating, setRating]       = useState(0)
  const [comment, setComment]     = useState("")
  const [submitting, setSubmitting] = useState(false)

  const close = () => {
    setRating(0)
    setComment("")
    onClose()
  }

  const submit = async () => {
    if (rating < 1) {
      Alert.alert("Falta puntuación", "Selecciona cuántas estrellas le das.")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/reviews", {
        reviewed_user_id: reviewedUserId,
        lead_id:          leadId,
        rating,
        comment:          comment.trim() || null,
      })
      Alert.alert("¡Gracias!", "Tu reseña se ha publicado.")
      onSuccess()
      close()
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "No se pudo enviar la reseña."
      Alert.alert("Error", msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.title}>Valora a {reviewedUserName}</Text>
            <TouchableOpacity onPress={close} hitSlop={10}>
              <Ionicons name="close" size={26} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>
            ¿Cómo ha sido tu experiencia? Tu reseña ayudará a otros usuarios.
          </Text>

          {/* Estrellas */}
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={44}
                  color={n <= rating ? "#fbbf24" : "#cbd5e1"}
                  style={{ marginHorizontal: 3 }}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>

          {/* Comentario */}
          <Text style={styles.fieldLabel}>Comentario (opcional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Cuenta tu experiencia: trato, rapidez, transparencia..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={1000}
            style={styles.textarea}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{comment.length}/1000</Text>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={close}
              style={[styles.btn, styles.btnGhost]}
              disabled={submitting}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              style={[styles.btn, styles.btnPrimary, (submitting || rating < 1) && styles.btnDisabled]}
              disabled={submitting || rating < 1}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>Enviar reseña</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title:  { fontSize: 20, fontWeight: "800", color: "#0f172a", flex: 1, marginRight: 12 },
  helpText: { fontSize: 13, color: "#64748b", marginBottom: 18 },

  starsRow:    { flexDirection: "row", justifyContent: "center", marginBottom: 4 },
  ratingLabel: { textAlign: "center", color: "#64748b", fontSize: 13, height: 18, marginBottom: 16 },

  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 },
  textarea: {
    borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12,
    padding: 12, minHeight: 100, fontSize: 14, color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  counter: { textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 4 },

  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn:           { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnGhost:      { borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  btnGhostText:  { color: "#334155", fontWeight: "700", fontSize: 14 },
  btnPrimary:    { backgroundColor: "#6366f1" },
  btnPrimaryText:{ color: "#fff", fontWeight: "800", fontSize: 14 },
  btnDisabled:   { backgroundColor: "#cbd5e1" },
})
