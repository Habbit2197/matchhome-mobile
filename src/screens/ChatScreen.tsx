import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { useChat, ChatMessage } from '../hooks/useChat'

type ChatRouteParams = {
  Chat: {
    leadId: number
    counterpartyName?: string
    propertyTitle?: string
  }
}

export default function ChatScreen() {
  const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>()
  const navigation = useNavigation()
  const { leadId, counterpartyName = 'Propietario', propertyTitle = 'Inmueble' } = route.params

  const { messages, myId, loading, sending, send } = useChat(leadId)
  const [draft, setDraft] = useState('')
  const listRef = useRef<FlatList>(null)

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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {counterpartyName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{counterpartyName}</Text>
          <View style={styles.headerSubRow}>
            <Ionicons name="home-outline" size={11} color="#64748b" />
            <Text style={styles.headerSub} numberOfLines={1}>{propertyTitle}</Text>
          </View>
        </View>
      </View>

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
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  headerSub: { fontSize: 11, color: '#64748b' },

  chatArea: { flex: 1, backgroundColor: '#efeae2' },
  listContent: { paddingVertical: 12, paddingHorizontal: 10 },

  row: { flexDirection: 'row', marginBottom: 6 },
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
