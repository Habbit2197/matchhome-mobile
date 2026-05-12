/**
 * Pantalla de notificaciones del usuario.
 *
 * - FlatList con pull-to-refresh (RefreshControl)
 * - Secciones implícitas: las no leídas tienen punto azul a la izquierda
 * - Click en notif: marca como leída + navega a la URL del frontend
 *   (parsea URLs como /chat/2 → navega a Chat con leadId=2,
 *    /properties/13 → PropertyDetail con propertyId=13)
 * - "Marcar todas" en cabecera si hay alguna sin leer
 * - Empty state amigable
 * - Long-press en una notif: confirma y borra
 */
import { useEffect, useCallback } from "react"
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { useNotifications, type AppNotification } from "../hooks/useNotifications"

export default function NotificationsScreen() {
  const navigation = useNavigation<any>()
  const {
    items, unreadCount, loading, refreshing, listLoaded,
    loadList, markOneAsRead, markAllAsRead, deleteOne,
  } = useNotifications()

  // Carga al primer focus + refresca cada vez que vuelves a esta tab
  useFocusEffect(useCallback(() => {
    if (!listLoaded) loadList()
    else loadList(true) // si ya estaba cargada, refresca al volver
  }, [listLoaded, loadList]))

  /** Convierte una URL del backend (/chat/2, /properties/13, /leads/2) a navegación nativa */
  const navigateFromUrl = (url: string | null) => {
    if (!url) return
    // /chat/{id}
    const chat = url.match(/^\/chat\/(\d+)/)
    if (chat) {
      navigation.navigate("Chat", { leadId: parseInt(chat[1], 10) })
      return
    }
    // /properties/{id}
    const prop = url.match(/^\/properties\/(\d+)/)
    if (prop) {
      navigation.navigate("PropertyDetail", { propertyId: parseInt(prop[1], 10) })
      return
    }
    // /leads/{id} — todavía no hay LeadDetail nativo; abrimos Matches
    if (url.startsWith("/leads")) {
      navigation.navigate("Tabs", { screen: "Matches" })
      return
    }
    // /properties — listado, abrimos Feed
    if (url === "/properties") {
      navigation.navigate("Tabs", { screen: "Feed" })
    }
  }

  const handleNotifPress = (n: AppNotification) => {
    if (!n.read_at) markOneAsRead(n.id)
    navigateFromUrl(n.url)
  }

  const handleNotifLongPress = (n: AppNotification) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Quieres eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteOne(n.id) },
      ]
    )
  }

  const handleMarkAll = () => {
    if (unreadCount === 0) return
    Alert.alert(
      "Marcar todas como leídas",
      `Se marcarán ${unreadCount} notificaciones.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Marcar", onPress: () => markAllAsRead() },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={16} color="#10b981" />
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => String(n.id)}
          renderItem={({ item }) => (
            <NotifRow
              n={item}
              onPress={() => handleNotifPress(item)}
              onLongPress={() => handleNotifLongPress(item)}
            />
          )}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptySub}>Te avisaremos cuando pase algo importante.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadList(true)} tintColor="#10b981" />
          }
        />
      )}
    </SafeAreaView>
  )
}

function NotifRow({ n, onPress, onLongPress }: {
  n: AppNotification
  onPress: () => void
  onLongPress: () => void
}) {
  const isUnread = !n.read_at
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={400}
      style={[styles.row, isUnread && styles.rowUnread]}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>{n.icon || "🔔"}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={1}>
            {n.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text>
        <Text style={styles.time}>{formatRelative(n.created_at)}</Text>
      </View>
    </TouchableOpacity>
  )
}

function formatRelative(iso: string): string {
  const date = new Date(iso)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60)        return "Justo ahora"
  if (diff < 3600)      return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400)     return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800)    return "Ayer"
  if (diff < 604800)    return `Hace ${Math.floor(diff / 86400)} d`
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title:     { fontSize: 26, fontWeight: "800", color: "#0f172a" },
  badge: {
    minWidth: 22, height: 22, paddingHorizontal: 6,
    borderRadius: 11, backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  markAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "#ecfdf5",
    borderRadius: 8, borderWidth: 1, borderColor: "#d1fae5",
  },
  markAllText: { color: "#10b981", fontSize: 12, fontWeight: "700" },

  listContent: { paddingVertical: 6 },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },

  separator: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 76 },

  row: {
    flexDirection: "row",
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 14,
    backgroundColor: "#fff",
  },
  rowUnread: { backgroundColor: "#eff6ff" },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e2e8f0",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2,
  },
  iconEmoji: { fontSize: 20 },

  body: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  rowTitle:         { fontSize: 14, fontWeight: "600", color: "#0f172a", flex: 1 },
  rowTitleUnread:   { fontWeight: "800" },
  unreadDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3b82f6" },
  rowBody:          { fontSize: 13, color: "#475569", lineHeight: 18 },
  time:             { fontSize: 11, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },

  empty: { alignItems: "center", padding: 30 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  emptySub:   { fontSize: 13, color: "#64748b", textAlign: "center" },
})
