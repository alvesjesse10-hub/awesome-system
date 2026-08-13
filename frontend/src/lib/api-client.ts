import axios from 'axios'
import { authStorage } from './auth-storage'

export const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Chamadas podem fixar X-Company-Id explicitamente (ex.: dashboard
  // consolidado, que precisa de uma empresa OU nenhuma independente da
  // empresa ativa global). '' sinaliza "omitir de propósito" (visão
  // consolidada no backend); undefined (o padrão) cai no comportamento
  // normal, lendo a empresa ativa do localStorage.
  const explicitCompanyId = config.headers['X-Company-Id']
  if (explicitCompanyId === undefined) {
    const companyId = authStorage.getActiveCompanyId()
    if (companyId) {
      config.headers['X-Company-Id'] = companyId
    }
  } else if (explicitCompanyId === '') {
    delete config.headers['X-Company-Id']
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
