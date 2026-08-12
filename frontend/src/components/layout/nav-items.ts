import {
  Banknote,
  Briefcase,
  Building2,
  LayoutDashboard,
  ListTree,
  Receipt,
  Target,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'

export const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/lancamentos', label: 'Lançamentos', icon: Receipt },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/contas-bancarias', label: 'Contas Bancárias', icon: Wallet },
  { to: '/plano-de-contas', label: 'Plano de Contas', icon: ListTree },
  { to: '/centros-de-custo', label: 'Centros de Custo', icon: Building2 },
  { to: '/metas', label: 'Metas e Projeções', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: Banknote },
] as const
