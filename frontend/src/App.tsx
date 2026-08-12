import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ComingSoonPage } from '@/pages/coming-soon-page'

const comingSoon: { path: string; title: string }[] = [
  { path: '/lancamentos', title: 'Lançamentos Financeiros' },
  { path: '/jobs', title: 'Jobs / Projetos' },
  { path: '/clientes', title: 'Clientes' },
  { path: '/fornecedores', title: 'Fornecedores' },
  { path: '/colaboradores', title: 'Colaboradores' },
  { path: '/contas-bancarias', title: 'Contas Bancárias' },
  { path: '/plano-de-contas', title: 'Plano de Contas' },
  { path: '/centros-de-custo', title: 'Centros de Custo' },
  { path: '/metas', title: 'Metas e Projeções' },
  { path: '/relatorios', title: 'Relatórios' },
]

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                {comingSoon.map((route) => (
                  <Route key={route.path} path={route.path} element={<ComingSoonPage title={route.title} />} />
                ))}
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
