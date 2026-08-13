import type { AuthenticatedUser } from '@/types/auth'

const TOKEN_KEY = 'ambiens.accessToken'
const USER_KEY = 'ambiens.user'
const ACTIVE_COMPANY_KEY = 'ambiens.activeCompanyId'

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  getUser(): AuthenticatedUser | null {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null
  },
  setUser(user: AuthenticatedUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  getActiveCompanyId(): string | null {
    return localStorage.getItem(ACTIVE_COMPANY_KEY)
  },
  setActiveCompanyId(companyId: string) {
    localStorage.setItem(ACTIVE_COMPANY_KEY, companyId)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ACTIVE_COMPANY_KEY)
  },
}
