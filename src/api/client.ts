/**
 * API client para MatchHome Mobile.
 * Incluye helpers apiGet/apiPost/apiPut/apiDelete compatibles con el patrón del backend.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

// Para desarrollo: cambia a tu IP local cuando uses dispositivo físico
const API_URL = 'https://web-production-12589.up.railway.app/api'

const TOKEN_KEY = 'mh_auth_token'

export const tokenStorage = {
  get:    () => SecureStore.getItemAsync(TOKEN_KEY),
  set:    (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Accept': 'application/json' },
  timeout: 15000,
})

// Inyecta el token Bearer en cada petición
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → sesión caducada, borra token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) await tokenStorage.remove()
    return Promise.reject(error)
  }
)

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

// ── Helpers tipados ────────────────────────────────────────────────
// Extraen automáticamente data.data o data según el patrón del backend

export async function apiGet<T = any>(path: string): Promise<T> {
  const { data } = await api.get<{ data: T } | T>(path)
  return (data as any)?.data ?? (data as T)
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.post<{ data: T } | T>(path, body)
  return (data as any)?.data ?? (data as T)
}

export async function apiPut<T = any>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.put<{ data: T } | T>(path, body)
  return (data as any)?.data ?? (data as T)
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const { data } = await api.delete<{ data: T } | T>(path)
  return (data as any)?.data ?? (data as T)
}
