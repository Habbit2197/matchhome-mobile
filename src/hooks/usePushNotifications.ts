/**
 * usePushNotifications v2 — Registro + manejo de notificaciones en foreground.
 * Muestra un banner in-app cuando llega una notificación con la app abierta.
 */
import { useEffect, useRef } from 'react'
import { Platform, Alert } from 'react-native'
import { useAuth } from './useAuth'
import { api } from '../api/client'

let Notifications: any = null
let Device: any = null
try {
  Notifications = require('expo-notifications')
  Device = require('expo-device')
} catch {}

export function usePushNotifications() {
  const { user } = useAuth()
  const registered = useRef(false)
  const subscription = useRef<any>(null)

  useEffect(() => {
    if (!Notifications) return

    // Handler para notificaciones en foreground (app abierta)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,  // Muestra banner nativo
        shouldPlaySound: true,
        shouldSetBadge:  true,
      }),
    })

    // Listener: cuando llega una notificación con la app abierta
    subscription.current = Notifications.addNotificationReceivedListener((notification: any) => {
      const title = notification.request.content.title ?? 'MatchHome'
      const body  = notification.request.content.body  ?? ''
      // El setNotificationHandler ya muestra el banner nativo.
      // Aquí podemos hacer lógica adicional si queremos.
      console.log('📬 Notificación recibida en foreground:', title, body)
    })

    // Listener: cuando el usuario toca la notificación
    const tapSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const url = response.notification.request.content.data?.url
      if (url) {
        // Aquí podrías navegar: navigation.navigate(...)
        console.log('👆 Usuario tocó notificación, URL:', url)
      }
    })

    return () => {
      subscription.current?.remove()
      tapSub?.remove()
    }
  }, [])

  useEffect(() => {
    if (!user || registered.current || !Notifications || !Device) return
    if (!Device.isDevice) return

    registerToken()
  }, [user])

  async function registerToken() {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Push notifications: permisos denegados')
        return
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'MatchHome',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7c3aed',
        })
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'matchhome' })
      await api.post('/me/push-token', { token: tokenData.data, platform: Platform.OS })
      registered.current = true
      console.log('✅ Push token registrado:', tokenData.data.slice(0, 20) + '...')
    } catch (err) {
      console.log('Push token error (no crítico):', err)
    }
  }
}
