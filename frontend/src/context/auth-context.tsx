import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { apiClient } from '@/lib/api-client'
import { authStorage } from '@/lib/auth-storage'
import type { AuthenticatedUser, CompanyAccess, LoginResponse } from '@/types/auth'

interface AuthContextValue {
  user: AuthenticatedUser | null
  activeCompany: CompanyAccess | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setActiveCompanyId: (companyId: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => authStorage.getUser())
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(() => {
    const stored = authStorage.getActiveCompanyId()
    const cachedUser = authStorage.getUser()
    if (stored && cachedUser?.companies.some((c) => c.id === stored)) {
      return stored
    }
    return cachedUser?.companies[0]?.id ?? null
  })

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
    authStorage.setToken(data.accessToken)
    authStorage.setUser(data.user)
    const firstCompanyId = data.user.companies[0]?.id
    if (firstCompanyId) {
      authStorage.setActiveCompanyId(firstCompanyId)
      setActiveCompanyIdState(firstCompanyId)
    }
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    setUser(null)
    setActiveCompanyIdState(null)
  }, [])

  const setActiveCompanyId = useCallback((companyId: string) => {
    authStorage.setActiveCompanyId(companyId)
    setActiveCompanyIdState(companyId)
  }, [])

  const activeCompany = useMemo(
    () => user?.companies.find((c) => c.id === activeCompanyId) ?? null,
    [user, activeCompanyId],
  )

  const value = useMemo(
    () => ({
      user,
      activeCompany,
      isAuthenticated: !!user,
      login,
      logout,
      setActiveCompanyId,
    }),
    [user, activeCompany, login, logout, setActiveCompanyId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa estar dentro de um AuthProvider')
  }
  return context
}
