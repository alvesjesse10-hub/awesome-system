# Frontend — Controle Financeiro Ambiens

SPA React + TypeScript + Vite. Ver o [README raiz](../README.md) para como
subir o ambiente completo (banco + backend + frontend).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4, componentes base escritos à mão no estilo shadcn/ui
  (`src/components/ui`) — sem dependência do CLI do shadcn, só Radix
  primitives + `class-variance-authority`.
- React Router para navegação, TanStack Query para dados remotos, Axios
  como cliente HTTP.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (proxy de /api -> localhost:3000)
npm run build    # typecheck + build de produção
npm run lint     # oxlint
```

## Convenção importante: queries escopadas por empresa

Qualquer `useQuery` que chama um endpoint escopado por empresa (a maioria)
precisa incluir o `companyId` da empresa ativa na `queryKey` e usar
`enabled: !!companyId`. Sem isso, trocar de empresa no seletor do topo troca
o header `X-Company-Id` enviado ao backend, mas o React Query continua
servindo o cache da empresa anterior — ver `src/pages/dashboard-page.tsx`
para o padrão a seguir.
