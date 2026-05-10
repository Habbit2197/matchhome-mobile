import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokenStorage, extractErrorMessage } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [isLoading, setLoad]  = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.data.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    (async () => {
      const token = await tokenStorage.get()
      if (token) await fetchMe()
      setLoad(false)
    })()
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      await tokenStorage.set(data.data.token)
      setUser(data.data.user)
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Credenciales inválidas'))
    }
  }

  const register = async (payload: { name: string; email: string; password: string }) => {
    try {
      const { data } = await api.post('/auth/register', {
        ...payload,
        password_confirmation: payload.password,
        role: 'tenant',
      })
      await tokenStorage.set(data.data.token)
      setUser(data.data.user)
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'No se pudo registrar'))
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch { /* ignorar errores */ }
    await tokenStorage.remove()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login, register, logout,
      refresh: fetchMe,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
