import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ComingSoonPage } from '@/pages/coming-soon-page'
import { ClientsPage } from '@/pages/clients-page'
import { SuppliersPage } from '@/pages/suppliers-page'
import { EmployeesPage } from '@/pages/employees-page'
import { CostCentersPage } from '@/pages/cost-centers-page'
import { BankAccountsPage } from '@/pages/bank-accounts-page'
import { ChartOfAccountsPage } from '@/pages/chart-of-accounts-page'
import { FinancialEntriesPage } from '@/pages/financial-entries-page'
import { JobsPage } from '@/pages/jobs-page'
import { ProjectsDashboardPage } from '@/pages/projects-dashboard-page'
import { AccountsPayableDashboardPage } from '@/pages/accounts-payable-dashboard-page'
import { FinancialDashboardPage } from '@/pages/financial-dashboard-page'

const comingSoon: { path: string; title: string }[] = [
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
