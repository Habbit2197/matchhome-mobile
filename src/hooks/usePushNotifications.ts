/**
 * usePushNotifications — Registro de Expo Push Token.
 * 
 * Llama a este hook en App.tsx o en el RootNavigator tras autenticarse.
 * Registra el token en el backend para recibir notificaciones push reales.
 * 
 * Requiere: expo-notifications, expo-device
 * Instalar si no están: npx expo install expo-notifications expo-device
 */
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useAuth } from './useAuth'
import { api } from '../api/client'

// Importación condicional — si expo-notifications no está instalado no rompe
let Notifications: any = null
let Device: any = null
try {
  Notifications = require('expo-notifications')
  Device = require('expo-device')
} catch {}

export function usePushNotifications() {
  const { user } = useAuth()
  const registered = useRef(false)

  useEffect(() => {
    if (!user || registered.current || !Notifications || !Device) return
    if (!Device.isDevice) return // no funciona en simulador

    registerToken()
  }, [user])

  async function registerToken() {
    try {
      // Pedir permisos
      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') return

      // Obtener token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'matchhome', // Cambia por tu Expo project ID
      })
      const token = tokenData.data

      // Enviar al backend
      await api.post('/me/push-token', {
        token,
        platform: Platform.OS,
      })

      registered.current = true

      // Configurar cómo mostrar notificaciones cuando la app está en primer plano
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      })
    } catch (err) {
      // silencioso — no romper la app si falla
    }
  }
}
