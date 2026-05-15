/**
 * ChatScreen v2 — Chat móvil mejorado:
 * · Grupos de mensajes por fecha (Hoy / Ayer / fecha)
 * · Emoji picker rápido (16 emojis)
 * · Ticker de doble check con lectura en azul
 * · Banner de contrato si el lead está en negociación
 * · Botón enviar con color violeta (identidad visual)
 * · Indicador de typing animado
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
  Animated, SafeAreaView, Linking, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useChat, type ChatMessage } from '../hooks/useChat'
import ReviewModal from '../components/reviews/ReviewModal'

type ChatRouteParams = {
  Chat: { leadId: number; counterpartyName?: string; propertyTitle?: string }
}

const EMOJIS = ['😊','👋','👍','❤️','🏠','🔑','✅','📅','💬','🤝','💰','📝','🎉','🙏','⭐','😅']

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

function TypingDots() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current]
  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(a, { toValue: -5, duration: 250, useNativeDriver: true }),
        Animated.timing(a, { toValue:  0, duration: 250, useNativeDriver: true }),
      ])).start()
    })
  }, [])
  return (
    <View style={styles.typingBubble}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: a }] }]} />
      ))}
    </View>
  )
}

interface MessageItemProps { msg: ChatMessage; myId: number; showDate: boolean; dateLabel: string }

function MessageItem({ msg, myId, showDate, dateLabel }: MessageItemProps) {
  const isMine = msg.sender_id === myId
  return (
    <>
      {showDate && (
        <View style={styles.dateSep}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <View style={styles.dateLine} />
        </View>
      )}
      <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.bubbleText}>{msg.content}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>{formatTime(msg.created_at)}</Text>
            {isMine && (
              <Text style={[styles.ticks, msg.read_at ? styles.ticksRead : styles.ticksUnread]}>✓✓</Text>
            )}
          </View>
        </View>
      </View>
    </>
  )
}

export default function ChatScreen() {
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>()
  const navigation = useNavigation<any>()
  const { leadId, counterpartyName, propertyTitle } = route.params

  const { messages, myId, counterparty, propertyMeta, leadMeta, loading, sending, send } = useChat(leadId)

  const [draft,      setDraft]     = useState('')
  const [showEmoji,  setShowEmoji] = useState(false)
  const [reviewOpen, setReview]    = useState(false)
  const [reviewed,   setReviewed]  = useState(false)
  const listRef = useRef<FlatList>(null)

  const displayName = counterparty?.name ?? counterpartyName ?? 'Cargando…'
  const propTitle   = propertyMeta?.title ?? propertyTitle ?? 'Inmueble'
  const phone       = counterparty?.phone ?? null
  const initial     = displayName.charAt(0).toUpperCase()

  const canContract = leadMeta?.status === 'negotiating' || leadMeta?.status === 'visiting'

  const buildWaUrl = () => {
    if (!phone) return null
    const digits = phone.replace(/[^0-9]/g, '')
    const intl = digits.length === 9 ? `34${digits}` : digits
    const text = encodeURIComponent(`Hola ${displayName}, te escribo desde MatchHome sobre "${propTitle}".`)
    return `https://wa.me/${intl}?text=${text}`
  }

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!draft.trim()) return
    const text = draft.trim()
    setDraft('')
    setShowEmoji(false)
    const ok = await send(text)
    if (!ok) setDraft(text)
  }, [draft, send])

  // Agrupar mensajes por fecha
  const grouped: { msg: ChatMessage; showDate: boolean; dateLabel: string }[] = []
  messages.forEach((msg, i) => {
    const label = getDateLabel(msg.created_at)
    const prev  = i > 0 ? getDateLabel(messages[i - 1].created_at) : ''
    grouped.push({ msg, showDate: label !== prev, dateLabel: label })
  })

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{initial}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{propTitle}</Text>
        </View>
        <View style={styles.headerActions}>
          {phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.actionBtn}>
              <Ionicons name="call-outline" size={18} color="#475569" />
            </TouchableOpacity>
          )}
          {phone && (
            <TouchableOpacity onPress={() => { const u = buildWaUrl(); if(u) Linking.openURL(u) }} style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
            </TouchableOpacity>
          )}
          {!reviewed && counterparty?.id && (
            <TouchableOpacity onPress={() => setReview(true)} style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="star-outline" size={18} color="#d97706" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Banner contrato */}
      {canContract && (
        <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
          style={styles.contractBanner}>
          <Ionicons name="document-text-outline" size={14} color="#7c3aed" />
          <Text style={styles.contractBannerTxt}>¿Listo para formalizar? Gestiona el contrato →</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {/* Mensajes */}
        <FlatList
          ref={listRef}
          data={grouped}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageItem msg={item.msg} myId={myId ?? 0} showDate={item.showDate} dateLabel={item.dateLabel} />}
          contentContainerStyle={styles.listContent}
          style={styles.chatArea}
          ListHeaderComponent={
            !loading && messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <View style={styles.welcomeBox}>
                  <Text style={styles.welcomeText}>¡Empieza la conversación! Saluda a {displayName.split(' ')[0]}.</Text>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={loading && messages.length === 0 ? <ActivityIndicator style={{ margin: 20 }} color="#7c3aed" /> : null}
        />

        {/* Emoji picker */}
        {showEmoji && (
          <View style={styles.emojiPicker}>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity key={e} onPress={() => setDraft(d => d + e)}>
                  <Text style={styles.emoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={() => setShowEmoji(!showEmoji)}
            style={[styles.iconBtn, showEmoji && { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="happy-outline" size={22} color={showEmoji ? '#7c3aed' : '#64748b'} />
          </TouchableOpacity>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje…"
            placeholderTextColor="#94a3b8"
            multiline
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnOff]}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {counterparty?.id && leadMeta && (
        <ReviewModal isOpen={reviewOpen} onClose={() => setReview(false)}
          onSuccess={() => { setReviewed(true); setReview(false) }}
          reviewedUserId={counterparty.id} reviewedUserName={displayName} leadId={leadMeta.id} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#fff' },
  flex:  { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  backBtn:    { padding: 4 },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  headerSub:  { fontSize: 11, color: '#7c3aed', fontWeight: '500', marginTop: 1 },
  headerActions:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  contractBanner: { flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f5f3ff', borderBottomWidth: 1, borderBottomColor: '#ede9fe',
    paddingHorizontal: 16, paddingVertical: 10 },
  contractBannerTxt: { fontSize: 12, fontWeight: '600', color: '#7c3aed', flex: 1 },

  chatArea:    { flex: 1, backgroundColor: '#efeae2' },
  listContent: { paddingVertical: 12, paddingHorizontal: 10 },

  emptyChat:  { flex: 1, alignItems: 'center', paddingTop: 40 },
  welcomeBox: { backgroundColor: '#fef3c7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  welcomeText:{ fontSize: 13, color: '#92400e', textAlign: 'center' },

  dateSep:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  dateLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  dateLabel:{ fontSize: 11, color: '#6b7280', backgroundColor: '#d9d4cc', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, fontWeight: '500' },

  row:       { flexDirection: 'row', marginBottom: 4 },
  rowMine:   { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble:    { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bubbleMine:  { backgroundColor: '#d9fdd3', borderTopRightRadius: 4 },
  bubbleTheirs:{ backgroundColor: '#fff',    borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  bubbleText:  { fontSize: 14, color: '#0f172a', lineHeight: 20 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  time:        { fontSize: 10, color: '#94a3b8' },
  ticks:       { fontSize: 12 },
  ticksRead:   { color: '#3b82f6' },
  ticksUnread: { color: '#94a3b8' },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderTopLeftRadius: 4, alignSelf: 'flex-start', marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  typingDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94a3b8' },

  emojiPicker: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 8 },
  emojiGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 4 },
  emoji:       { fontSize: 24, padding: 4 },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  iconBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  input:    { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#0f172a', maxHeight: 120 },
  sendBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  sendBtnOff: { backgroundColor: '#e2e8f0', shadowOpacity: 0 },
})
