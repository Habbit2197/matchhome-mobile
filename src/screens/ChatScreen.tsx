import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator, SafeAreaView, Image, Linking, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useChat, ChatMessage } from '../hooks/useChat'
import ReviewModal from '../components/reviews/ReviewModal'

type ChatRouteParams = {
  Chat: {
    leadId: number
    /** Fallback antes de que cargue el counterparty del backend */
    counterpartyName?: string
    propertyTitle?: string
  }
}

/**
 * Pantalla de chat estilo WhatsApp.
 *
 * El counterparty (con phone para WhatsApp) y el propertyMeta vienen
 * directamente del backend en el meta de /api/leads/{lead}/messages, asi
 * que no hace falta una llamada extra. Los route params son solo un
 * fallback visual mientras se completa la primera carga.
 */
export default function ChatScreen() {
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>()
  const navigation = useNavigation<any>()
  const { leadId, counterpartyName, propertyTitle } = route.params

  const {
    messages, myId, counterparty, propertyMeta, leadMeta,
    loading, sending, send,
  } = useChat(leadId)

  const [draft, setDraft] = useState('')
  const listRef = useRef<FlatList>(null)

  // Datos para pintar
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewedSuccess, setReviewedSuccess] = useState(false)
  const displayName = counterparty?.name ?? counterpartyName ?? 'Cargando…'
  const propTitle   = propertyMeta?.title ?? propertyTitle ?? 'Inmueble'
  const phone       = counterparty?.phone ?? null
  const avatarUrl   = counterparty?.avatar_url ?? null

  // Construye numero internacional (asume Espana si tiene 9 digitos)
  const buildIntlPhone = (raw: string): string => {
    const digits = raw.replace(/[^0-9]/g, '')
    return digits.length === 9 ? `34${digits}` : digits
  }

  const openWhatsApp = async () => {
    if (!phone) return
    const intl = buildIntlPhone(phone)
    const text = encodeURIComponent(
      `Hola ${counterparty?.name ?? ''}, te escribo desde MatchHome sobre "${propTitle}".`
    )
    const url = `https://wa.me/${intl}?text=${text}`
    const can = await Linking.canOpenURL(url)
    if (can) {
      Linking.openURL(url)
    } else {
      Alert.alert('No se pudo abrir WhatsApp', 'Comprueba que tienes WhatsApp instalado.')
    }
  }

  const openCall = async () => {
    if (!phone) return
    const sanitized = phone.replace(/[^0-9+]/g, '')
    const url = `tel:${sanitized}`
    const can = await Linking.canOpenURL(url)
    if (can) {
      Linking.openURL(url)
    } else {
      Alert.alert('Llamadas no disponibles', 'Este dispositivo no puede hacer llamadas.')
    }
  }

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  const handleSend = async () => {
    if (!draft.trim()) return
    const text = draft
    setDraft('')
    const ok = await send(text)
    if (!ok) setDraft(text)
  }

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === myId
    const time = new Date(item.created_at).toLocaleTimeString('es', {
      hour: '2-digit', minute: '2-digit',
    })
    return (
      <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.bubbleText}>{item.content}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>{time}</Text>
            {isMine && (
              <Text style={[styles.ticks, item.read_at ? styles.ticksRead : styles.ticksUnread]}>
                ✓✓
              </Text>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#0f172a" />
        </TouchableOpacity>

        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
          <View style={styles.headerSubRow}>
            <Ionicons name="home-outline" size={11} color="#64748b" />
            <Text style={styles.headerSub} numberOfLines={1}>{propTitle}</Text>
          </View>
        </View>

        {/* Atajos de contacto */}
        {phone && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={openCall} style={styles.callBtn} accessibilityLabel="Llamar">
              <Ionicons name="call" size={16} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={openWhatsApp} style={styles.waBtn} accessibilityLabel="Abrir WhatsApp">
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {leadMeta?.status === 'closed_won' && !reviewedSuccess && counterparty?.id && (
          <TouchableOpacity
            onPress={() => setReviewOpen(true)}
            style={styles.reviewBtn}
            accessibilityLabel="Dejar reseña"
          >
            <Ionicons name="star" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de reseña */}
      {leadMeta && counterparty?.id && (
        <ReviewModal
          visible={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => setReviewedSuccess(true)}
          reviewedUserId={counterparty.id}
          reviewedUserName={displayName}
          leadId={leadMeta.id}
        />
      )}

      {/* Mensajes */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatArea}>
          {loading && messages.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.welcomeBox}>
                <Text style={styles.welcomeText}>
                  ¡Empieza la conversación! Rompe el hielo con un saludo.
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={m => String(m.id)}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            />
          )}
        </View>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje…"
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !draft.trim()}
            style={[
              styles.sendBtn,
              (!draft.trim() || sending) && styles.sendBtnDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#fff' },
  flex:  { flex: 1 },
  center:{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row:   { flexDirection: 'row', marginBottom: 6 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  backBtn: { padding: 4 },
  avatar:  { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  headerSub: { fontSize: 11, color: '#64748b' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  waBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },

  chatArea: { flex: 1, backgroundColor: '#efeae2' },
  listContent: { paddingVertical: 12, paddingHorizontal: 10 },

  rowMine:   { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleMine:   { backgroundColor: '#d1fae5', borderTopRightRadius: 2 },
  bubbleTheirs: { backgroundColor: '#fff',    borderTopLeftRadius: 2 },
  bubbleText:   { fontSize: 14, color: '#0f172a', lineHeight: 19 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time:    { fontSize: 10, color: '#64748b' },
  ticks:        { fontSize: 11 },
  ticksRead:    { color: '#3b82f6' },
  ticksUnread:  { color: '#94a3b8' },

  welcomeBox: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1, borderColor: '#fde68a',
  },
  welcomeText: { fontSize: 13, color: '#92400e', textAlign: 'center' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#cbd5e1' },
})
