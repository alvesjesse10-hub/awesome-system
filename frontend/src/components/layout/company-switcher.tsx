import { useAuth } from '@/context/auth-context'

export function CompanySwitcher() {
  const { user, activeCompany, setActiveCompanyId } = useAuth()

  if (!user || user.companies.length === 0) {
    return null
  }

  return (
    <select
      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={activeCompany?.id ?? ''}
      onChange={(event) => setActiveCompanyId(event.target.value)}
      aria-label="Empresa ativa"
    >
      {user.companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.tradeName ?? company.name}
        </option>
      ))}
    </select>
  )
}
