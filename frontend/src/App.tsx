import { Suspense, lazy } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { PageLoading } from '@/components/layout/page-loading'

// Cada tela vira seu próprio chunk (carregado só quando a rota é
// visitada) em vez de tudo ir para o bundle inicial — o app tem ~15
// telas, e a esmagadora maioria nunca é aberta na mesma sessão.
const LoginPage = lazy(() => import('@/pages/login-page').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })))
const ClientsPage = lazy(() => import('@/pages/clients-page').then((m) => ({ default: m.ClientsPage })))
const SuppliersPage = lazy(() => import('@/pages/suppliers-page').then((m) => ({ default: m.SuppliersPage })))
const EmployeesPage = lazy(() => import('@/pages/employees-page').then((m) => ({ default: m.EmployeesPage })))
const CostCentersPage = lazy(() => import('@/pages/cost-centers-page').then((m) => ({ default: m.CostCentersPage })))
const BankAccountsPage = lazy(() => import('@/pages/bank-accounts-page').then((m) => ({ default: m.BankAccountsPage })))
const ChartOfAccountsPage = lazy(() =>
  import('@/pages/chart-of-accounts-page').then((m) => ({ default: m.ChartOfAccountsPage })),
)
const FinancialEntriesPage = lazy(() =>
  import('@/pages/financial-entries-page').then((m) => ({ default: m.FinancialEntriesPage })),
)
const JobsPage = lazy(() => import('@/pages/jobs-page').then((m) => ({ default: m.JobsPage })))
const ProjectsDashboardPage = lazy(() =>
  import('@/pages/projects-dashboard-page').then((m) => ({ default: m.ProjectsDashboardPage })),
)
const AccountsPayableDashboardPage = lazy(() =>
  import('@/pages/accounts-payable-dashboard-page').then((m) => ({ default: m.AccountsPayableDashboardPage })),
)
const FinancialDashboardPage = lazy(() =>
  import('@/pages/financial-dashboard-page').then((m) => ({ default: m.FinancialDashboardPage })),
)
const RevenuePlanningPage = lazy(() =>
  import('@/pages/revenue-planning-page').then((m) => ({ default: m.RevenuePlanningPage })),
)
const ReportsPage = lazy(() => import('@/pages/reports-page').then((m) => ({ default: m.ReportsPage })))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <Suspense fallback={<PageLoading />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard/projetos" element={<ProjectsDashboardPage />} />
                <Route path="/dashboard/contas-a-pagar" element={<AccountsPayableDashboardPage />} />
                <Route path="/dashboard/financeiro" element={<FinancialDashboardPage />} />
                <Route path="/lancamentos" element={<FinancialEntriesPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/fornecedores" element={<SuppliersPage />} />
                <Route path="/colaboradores" element={<EmployeesPage />} />
                <Route path="/contas-bancarias" element={<BankAccountsPage />} />
                <Route path="/plano-de-contas" element={<ChartOfAccountsPage />} />
                <Route path="/centros-de-custo" element={<CostCentersPage />} />
                <Route path="/metas" element={<RevenuePlanningPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
