export type UserRole = 'ADMIN' | 'FINANCEIRO' | 'COMERCIAL' | 'VISUALIZADOR'

export interface CompanyAccess {
  id: string
  name: string
  tradeName: string | null
  role: UserRole
}

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  companies: CompanyAccess[]
}

export interface LoginResponse {
  accessToken: string
  user: AuthenticatedUser
}
