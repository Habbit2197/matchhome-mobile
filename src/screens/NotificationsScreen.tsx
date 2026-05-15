/**
 * NotificationsScreen v2 — Rediseñada con iconos, colores y mejor UX.
 * · Sección "Sin leer" destacada arriba
 * · Iconos y colores según tipo de notificación
 * · Swipe-to-delete hint (long press)
 * · Empty state animado
 * · Botón "Marcar todas" prominente
 */
import { useCallback, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Platform, Alert, Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useNotifications, type AppNotification } from '../hooks/useNotifications'

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  match_accepted:   { icon: 'heart',              color: '#059669', bg: '#ecfdf5' },
  match_received:   { icon: 'sparkles',           color: '#7c3aed', bg: '#f5f3ff' },
  new_lead:         { icon: 'person-add',         color: '#2563eb', bg: '#eff6ff' },
  chat_paid:        { icon: 'chatbubble-ellipses',color: '#0891b2', bg: '#ecfeff' },
  contract_created: { icon: 'document-text',      color: '#d97706', bg: '#fffbeb' },
  contract_signed:  { icon: 'checkmark-circle',   color: '#059669', bg: '#ecfdf5' },
  profile_reminder: { icon: 'person-circle',      color: '#7c3aed', bg: '#f5f3ff' },
  review_received:  { icon: 'star',               color: '#f59e0b', bg: '#fffbeb' },
}

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: 'notifications', color: '#64748b', bg: '#f8fafc' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Ahora'
  if (mins < 60) return `Hace ${mins}m`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7)  return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function NotifCard({ notif, onPress, onDelete }: {
  notif: AppNotification; onPress: () => void; onDelete: () => void
}) {
  const cfg     = getConfig(notif.type)
  const isUnread = !notif.read_at
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, friction: 8, useNativeDriver: true }).start()
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start()

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onDelete}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, isUnread && styles.cardUnread]}>

        {/* Icono */}
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>

        {/* Contenido */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, isUnread && styles.cardTitleBold]} numberOfLines={1}>
              {notif.title}
            </Text>
            <Text style={styles.cardTime}>{timeAgo(notif.created_at)}</Text>
          </View>
          <Text style={styles.cardBody2} numberOfLines={2}>{notif.body}</Text>
        </View>

        {/* Punto no leído */}
        {isUnread && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>()
  const { items, unreadCount, loading, listLoaded, loadList, markOneAsRead, markAllAsRead, deleteOne } = useNotifications()

  useFocusEffect(useCallback(() => {
    if (!listLoaded) loadList()
    else loadList(true)
  }, [listLoaded, loadList]))

  const navigateFromUrl = (url: string | null) => {
    if (!url) return
    const chat = url.match(/^\/chat\/(\d+)/)
    if (chat) { navigation.navigate('Chat', { leadId: parseInt(chat[1], 10) }); return }
    const prop = url.match(/^\/properties\/(\d+)/)
    if (prop) { navigation.navigate('PropertyDetail', { propertyId: parseInt(prop[1], 10) }); return }
    if (url.startsWith('/leads') || url.startsWith('/inquilino')) { navigation.navigate('Tabs', { screen: 'Matches' }); return }
    if (url.startsWith('/buscar') || url === '/properties') { navigation.navigate('Tabs', { screen: 'Feed' }) }
  }

  const handlePress = (n: AppNotification) => {
    if (!n.read_at) markOneAsRead(n.id)
    navigateFromUrl(n.url)
  }

  const handleDelete = (n: AppNotification) => {
    Alert.alert('Eliminar', '¿Quieres eliminar esta notificación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteOne(n.id) },
    ])
  }

  const handleMarkAll = () => {
    if (!unreadCount) return
    Alert.alert('Marcar todas como leídas', `Marcar ${unreadCount} notificacion${unreadCount > 1 ? 'es' : ''} como leídas?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: markAllAsRead },
    ])
  }

  const unread = items.filter(n => !n.read_at)
  const read   = items.filter(n => !!n.read_at)

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} sin leer</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={14} color="#7c3aed" />
            <Text style={styles.markAllTxt}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={n => String(n.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadList(true)} tintColor="#7c3aed" />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        ListHeaderComponent={
          unread.length > 0 && read.length > 0 ? (
            <Text style={styles.sectionLabel}>SIN LEER</Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <>
            {item.read_at && index > 0 && !items[index - 1].read_at && (
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ANTERIORES</Text>
            )}
            <NotifCard notif={item} onPress={() => handlePress(item)} onDelete={() => handleDelete(item)} />
          </>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptyTxt}>No tienes notificaciones nuevas.</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: '#7c3aed', fontWeight: '600', marginTop: 2 },
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  markAllTxt:  { fontSize: 12, fontWeight: '700', color: '#7c3aed' },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },

  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  cardUnread: { backgroundColor: '#faf9ff' },

  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shrink: 0 } as any,

  cardBody:   { flex: 1, minWidth: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  cardTitle:  { flex: 1, fontSize: 13, fontWeight: '500', color: '#374151' },
  cardTitleBold: { fontWeight: '700', color: '#0f172a' },
  cardTime:   { fontSize: 11, color: '#94a3b8', shrink: 0 } as any,
  cardBody2:  { fontSize: 12, color: '#6b7280', lineHeight: 18 },

  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },

  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty:     { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyTxt:  { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
})
