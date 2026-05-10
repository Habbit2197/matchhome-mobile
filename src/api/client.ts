import axios, { AxiosError, type AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

// IMPORTANTE: Para iOS Simulator usa localhost, para Android usa 10.0.2.2,
// para móvil real cambiar a IP local de tu Mac (ej: http://192.168.1.34:8000/api)
const API_URL = 'http://localhost:8000/api'

const TOKEN_KEY = 'mh_auth_token'

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Accept': 'application/json' },
  timeout: 15000,
})

// Inyecta el token Bearer en cada petición autenticada
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el backend devuelve 401, borra el token (sesión caducada)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await tokenStorage.remove()
    }
    return Promise.reject(error)
  }
)

// Helper para extraer mensajes de error del backend
export function extractErrorMessage(err: unknown, fallback = 'Error inesperado'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (data?.message) return data.message
    if (data?.errors) {
      const first = Object.values(data.errors)[0]
      if (first?.[0]) return first[0]
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return fallback
}
