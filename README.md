# Sistema de Controle Financeiro e Gestão de Projetos — Grupo Ambiens

Sistema web multiusuário e multi-empresa para substituir o controle
financeiro hoje feito em planilha Excel (`CONTROLE_FINANCEIRO_AMBIENS.xlsm`
+ `Análise_Ambiens.xlsx`), cobrindo lançamentos financeiros, contas a
pagar/receber, jobs/projetos (pipeline comercial), DRE, fluxo de caixa,
metas, projeções, Simples Nacional, comissionamento e dashboards — para as
empresas do grupo (Ambiens, Smart, IGH) com visão individual e consolidada.

## Status atual

**Fase 1 — modelagem de dados**, em validação. Veja
[`docs/MODELO_DE_DADOS.md`](docs/MODELO_DE_DADOS.md) para a explicação das
decisões de schema e os pontos que precisam de confirmação antes de seguir
para o restante do código (backend, frontend, dashboards, importação da
planilha).

O schema proposto está em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

## Estrutura do projeto (planejada)

```
backend/          API (NestJS) + schema/migrations Prisma
  prisma/
    schema.prisma
frontend/         SPA React + TypeScript (a ser criado)
docs/             Documentação de modelagem e decisões de arquitetura
docker-compose.yml
```

## Como rodar o banco localmente (fase atual)

```bash
docker compose up -d postgres adminer
cd backend
cp .env.example .env
npm install
npm run prisma:migrate:dev
```

Adminer fica disponível em `http://localhost:8081` (sistema: PostgreSQL,
servidor: `postgres`, usuário/senha: `postgres`, banco:
`ambiens_financeiro`) para inspecionar o schema aplicado.

O backend (API NestJS) e o frontend (React) ainda serão adicionados nas
próximas fases, após validação do modelo de dados.

## Próximos passos (após validação do schema)

1. Gerar a migration inicial + seeds de plano de contas/categorias padrão.
2. Autenticação (e-mail/senha, papéis por empresa) e CRUDs base (clientes,
   fornecedores, colaboradores, plano de contas, centros de custo, contas
   bancárias).
3. Módulo de lançamentos financeiros (parcelamento, status automático).
4. Módulo de jobs/projetos (pipeline + geração automática de lançamentos).
5. Relatórios (DRE, fluxo de caixa, saldo bancário, clientes, fornecedores).
6. Metas, projeções e cálculo de Simples Nacional.
7. Dashboards.
8. Script de importação dos dados históricos da planilha.
