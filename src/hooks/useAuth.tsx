import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokenStorage, extractErrorMessage } from '../api/client'
import type { User } from '../types'

interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation?: string
  role?: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login:    (email: string, password: string) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout:   () => Promise<void>
  refresh:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]  = useState<User | null>(null)
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

  const register = async (payload: RegisterPayload) => {
    try {
      const { data } = await api.post('/auth/register', {
        name:                  payload.name,
        email:                 payload.email,
        password:              payload.password,
        password_confirmation: payload.password_confirmation ?? payload.password,
        role:                  payload.role ?? 'tenant', // ← respeta el rol elegido
      })
      await tokenStorage.set(data.data.token)
      setUser(data.data.user)
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'No se pudo registrar'))
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    await tokenStorage.remove()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, register, logout, refresh: fetchMe,
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
