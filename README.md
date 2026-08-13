# Sistema de Controle Financeiro e Gestão de Projetos — Grupo Ambiens

Sistema web multiusuário e multi-empresa para substituir o controle
financeiro hoje feito em planilha Excel (`CONTROLE_FINANCEIRO_AMBIENS.xlsm`
+ `Análise_Ambiens.xlsx`), cobrindo lançamentos financeiros, contas a
pagar/receber, jobs/projetos (pipeline comercial), DRE, fluxo de caixa,
metas, projeções, Simples Nacional, comissionamento e dashboards — para as
empresas do grupo (Ambiens, Smart, IGH) com visão individual e consolidada.

## Status atual

Em desenvolvimento incremental. Pronto e testado ponta a ponta contra um
Postgres real:

- **Modelagem de dados** — schema completo (ver [`docs/MODELO_DE_DADOS.md`](docs/MODELO_DE_DADOS.md)).
- **Backend (NestJS)**: autenticação JWT multi-empresa (papéis por empresa),
  CRUDs base (clientes, fornecedores, colaboradores, plano de contas,
  centros de custo, contas bancárias, transferências intercompany),
  lançamentos financeiros (parcelamento automático, status Pago/A
  pagar/Atrasado calculado em consulta), jobs/projetos (pipeline comercial,
  comissão automática, geração de lançamento a partir de job aprovado),
  relatórios (DRE, fluxo de caixa, saldo bancário, rentabilidade por job,
  clientes/fornecedores, contas a pagar, ranking de comissões — todos com
  exportação em CSV, Excel e PDF), metas/projeções e cálculo de Simples
  Nacional.
- **Frontend (React)**: login, layout com seletor de empresa/visão por
  papel, dashboards (geral, projetos, contas a pagar, financeiro por
  empresa/consolidado) com botões de exportação nos relatórios exibidos,
  página de Relatórios com navegação livre entre os 8 relatórios do
  sistema (visão empresa/consolidado, filtros de ano/mês/natureza e
  exportação CSV/Excel/PDF em todos), telas de cadastro, lançamentos
  financeiros, pipeline de jobs (kanban) e metas/projeções de faturamento
  (com gráfico de comparação x realizado).
- **Importação de dados históricos** — script que importa a planilha Excel
  legada para o banco novo (ver [`docs/IMPORTACAO_PLANILHA.md`](docs/IMPORTACAO_PLANILHA.md)).

## Estrutura do projeto

```
backend/          API NestJS + Prisma
  prisma/
    schema.prisma   modelo de dados
    migrations/      migrations versionadas
    seed.ts          plano de contas padrão, empresas exemplo, usuário admin
  src/
    auth/            login JWT, guards de empresa/papel
    <módulo>/         um diretório por recurso (clients, jobs, financial-entries, ...)
frontend/         SPA React + TypeScript + Vite
  src/
    components/ui/    componentes base (estilo shadcn, sem dependência do CLI)
    components/layout/ shell da aplicação (sidebar, seletor de empresa)
    context/          AuthProvider (login, empresa ativa)
    pages/            uma página por rota
    lib/              cliente HTTP (axios) e utilitários
docs/             Documentação de modelagem e decisões de arquitetura
docker-compose.yml
```

## Como rodar o ambiente localmente

### 1. Banco de dados

```bash
docker compose up -d postgres adminer
```

Adminer fica disponível em `http://localhost:8081` (sistema: PostgreSQL,
servidor: `postgres`, usuário/senha: `postgres`, banco:
`ambiens_financeiro`).

### 2. Backend

```bash
cd backend
cp .env.example .env
# adicione também JWT_SECRET="qualquer-valor-para-dev" ao .env
npm install
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

A API sobe em `http://localhost:3000/api`.

O seed cria:
- As 3 empresas do grupo (Ambiens, Smart, IGH) com um centro de custo
  "Geral" cada — apenas ponto de partida, edite/renomeie como quiser.
- O plano de contas padrão completo (7 grupos, ~30 subcategorias) extraído
  da planilha atual.
- A tabela de faixas do Simples Nacional — **Anexo III como placeholder**
  (ver `docs/MODELO_DE_DADOS.md`, ponto 4 — ainda precisa confirmar o anexo
  correto).
- Um usuário administrador: `admin@ambiens.com.br` / senha temporária
  `TrocarSenha123!`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. Em desenvolvimento, o Vite faz proxy de
`/api` para `http://localhost:3000`, então não é preciso configurar URL da
API à parte.

### Testes automatizados

```bash
cd backend
npm test
```

Testes unitários das funções puras (parcelamento — divisão em centavos e
rolagem de mês —, status automático Pago/A pagar/Atrasado, comissão,
Simples Nacional) e testes de integração ponta a ponta contra um Postgres
real dos serviços com regra de negócio: relatórios (DRE, fluxo de caixa,
saldo bancário, rentabilidade por job, contas a pagar, ranking de
comissões), lançamentos financeiros (parcelamento e isolamento
multi-tenant), jobs (cálculo/recálculo de comissão, geração de lançamento)
e Simples Nacional (RBT12, DAS, versionamento de faixas). Requer o banco
local configurado em `DATABASE_URL` (mesmo do `npm run start:dev`) — cada
suíte cria e limpa sua própria empresa de teste, então é seguro rodar
junto com dados reais/de desenvolvimento já existentes no banco.

### Importação da planilha histórica

```bash
cd backend
npx ts-node scripts/import-legacy-spreadsheet.ts --file /caminho/CONTROLE_FINANCEIRO_AMBIENS.xlsm --dry-run
```

Sempre rode com `--dry-run` primeiro e revise o relatório antes de rodar sem
a flag para gravar de verdade. Requer o banco migrado e com o seed já
rodado. Ver [`docs/IMPORTACAO_PLANILHA.md`](docs/IMPORTACAO_PLANILHA.md) para
o mapeamento completo de cada aba/coluna e as decisões de aproximação
tomadas para dados sem equivalente exato no schema. **O arquivo real da
planilha nunca deve ser commitado no repositório.**

## Deploy

O `Dockerfile` na raiz empacota frontend e backend num único serviço (o Nest
serve a API e os arquivos estáticos do React no mesmo processo/domínio). Ver
[`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md) para o passo a passo
completo de deploy no Railway (banco Postgres gerenciado, variáveis de
ambiente, domínio público).

## Como adicionar uma nova empresa, categoria ou centro de custo

- **Empresa**: hoje é feito via `backend/prisma/seed.ts` ou diretamente no
  banco (`Company` + `UserCompanyAccess` para dar acesso aos usuários). Uma
  tela de administração de empresas ainda não existe no frontend.
- **Categoria do plano de contas**: `POST /api/chart-of-accounts` (papel
  ADMIN ou FINANCEIRO em qualquer empresa) — é compartilhado entre todas as
  empresas do grupo, não precisa do header `X-Company-Id`.
- **Centro de custo**: `POST /api/cost-centers` com o header
  `X-Company-Id` da empresa — é específico de cada empresa.
