import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, apiErrorMessage, refreshAccessToken, setAccessToken } from './api'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  initials: string
  position: string | null
  mustChangePass: boolean
  role: { key: string; name: string }
  permissions: string[]
  moduleKeys: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasModule: (moduleKey: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Al cargar la app intenta restaurar la sesión desde la cookie de refresh.
    refreshAccessToken()
      .then(async (token) => {
        if (!token) return
        const { data } = await api.get<AuthUser>('/auth/me')
        setUser(data)
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const hasPermission = useCallback((permission: string) => user?.permissions.includes(permission) ?? false, [user])
  const hasModule = useCallback((moduleKey: string) => user?.moduleKeys.includes(moduleKey) ?? false, [user])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission, hasModule }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export { apiErrorMessage }
