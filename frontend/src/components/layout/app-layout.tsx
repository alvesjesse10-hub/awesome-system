import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { CompanySwitcher } from './company-switcher'
import { navItems } from './nav-items'
import { PageLoading } from './page-loading'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  const { user, activeCompany, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold">Controle Financeiro</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                  isActive && 'bg-secondary text-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <CompanySwitcher />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.name} · {activeCompany?.role}
            </span>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
