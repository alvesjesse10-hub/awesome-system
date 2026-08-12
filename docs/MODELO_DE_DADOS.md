# Modelo de dados — Sistema de Controle Financeiro e Gestão de Projetos

Status: **fase 1 — modelagem, aguardando validação**. Nenhum código de
aplicação (backend/frontend) foi gerado ainda; apenas o schema do banco
(`backend/prisma/schema.prisma`), para revisão.

## Stack escolhida

- **Backend: NestJS (Node.js/TypeScript).** Mesma linguagem do frontend
  (menos troca de contexto), estrutura modular com DI que se encaixa bem em
  domínio rico como este (financeiro + comercial + RH), e guards/decorators
  nativos para RBAC multi-empresa.
- **ORM: Prisma.** Migrations versionadas, schema declarativo (o arquivo que
  você está revisando agora), type-safety ponta a ponta com o TS do backend.
- **Banco: PostgreSQL** — conforme solicitado, com `Decimal` para todos os
  valores monetários (nunca `float`).
- **Frontend: React + TypeScript + Vite, shadcn/ui, Recharts, React Query,
  React Hook Form + Zod.**
- **Deploy: Docker Compose** (Postgres + backend + frontend + Adminer para
  inspecionar o banco durante o desenvolvimento).

## Estratégia multi-tenant

Multi-tenancy por **coluna discriminadora** (`companyId` em cada tabela
relevante), não por schema/banco separado — porque o requisito de "visão
consolidada do grupo" exige somar dados entre empresas com frequência, o que
seria caro/complexo com bancos isolados.

O acesso e o papel do usuário são definidos **por empresa**
(`UserCompanyAccess`): um usuário do financeiro pode ter acesso à Ambiens, à
Smart e à IGH ao mesmo tempo, com o papel `FINANCEIRO` em cada uma. A "visão
consolidada" é um relatório que agrega todas as empresas às quais o usuário
tem acesso — não existe uma "empresa virtual" no banco.

## Módulos do schema

1. **Empresas e acesso** — `Company`, `User`, `UserCompanyAccess`.
2. **Contas bancárias** — `BankAccount`, `AccountTransfer` (suporta
   transferência entre contas de empresas diferentes do grupo).
3. **Plano de contas e centros de custo** — `ChartOfAccount` (hierárquico,
   compartilhado entre as empresas do grupo), `CostCenter` (por empresa).
4. **Cadastros** — `Client`, `Supplier`, `Employee`.
5. **Lançamentos financeiros** — `FinancialEntry` (núcleo do sistema).
6. **Jobs/Projetos** — `Job` (pipeline comercial + execução).
7. **Metas e projeções** — `RevenueGoal`, `RevenueProjection`.
8. **Simples Nacional** — `SimplesNacionalBracket`, `TaxCalculationSnapshot`.
9. **Reajuste salarial** — `SalaryReviewCriteria`, `SalaryReviewAssessment`,
   `SalaryReviewScore`, `SalaryAdjustment`.
10. **Importação histórica** — `ImportBatch` (rastreabilidade da migração dos
    dados da planilha).

## Decisões de design que valem explicar

- **Status "Atrasado" não é persistido.** `FinancialEntry.status` só guarda
  `PENDING`/`PAID` (verdade objetiva: pago quando `paymentDate` é
  preenchida). "Atrasado" é calculado em consulta (`PENDING` + `dueDate` no
  passado) — isso evita ter um status desatualizado por falta de um job
  rodando todo dia à meia-noite para "promover" lançamentos a atrasado. Vou
  expor isso como uma view/computed field na API.
- **Competência (mês/ano) derivada, mantida pela camada de serviço.**
  `competenceMonth/Year` e `dueMonth/Year` são gravados a partir de
  `entryDate`/`dueDate` no momento do save, para acelerar relatórios sem
  recalcular em toda query.
- **Saldo de conta bancária não é uma coluna persistida.** É
  `initialBalance` + lançamentos pagos vinculados à conta + transferências —
  calculado via view, para nunca divergir da soma real dos lançamentos.
- **Parcelamento gera linhas "irmãs", não pai/filho.** Quando
  `installmentTotal > 1`, o backend cria N linhas de `FinancialEntry`
  compartilhando um `installmentGroupId`, cada uma com seu próprio
  vencimento mensal. Isso simplifica consultas ("todas as parcelas desta
  compra") comparado a uma estrutura pai/filho.
- **Contagem de jobs/success por colaborador não é persistida** — calculada
  por consulta sobre `Job.responsibleEmployeeId` + `Job.result`, para nunca
  ficar desatualizada.
- **Serviço e entregáveis do Job são multi-seleção** (arrays de enum no
  Postgres), porque a planilha permite combinações (ex.: Criação + Vídeo).

## Pontos para você validar

1. **`bankAccountId` em `FinancialEntry`** — adicionei este campo, que não
   estava na lista literal de campos do lançamento, porque sem ele não dá
   para gerar o relatório "Saldo por conta bancária" (entradas/saídas por
   conta). Faz sentido cada lançamento (quando pago) apontar para a conta
   por onde entrou/saiu o dinheiro?
2. **Cliente/Fornecedor cadastrados por empresa**, replicando a segregação
   atual da planilha. Se um cliente atende Ambiens e Smart ao mesmo tempo,
   hoje ele ficaria cadastrado duas vezes (uma por empresa). Está ok assim,
   ou vocês querem um cadastro único de cliente compartilhado entre as
   empresas do grupo, com histórico consolidado por cliente?
3. **Plano de contas único e compartilhado** entre as três empresas (mesma
   estrutura de categorias para todas), diferente do centro de custo, que é
   por empresa. Confirma que é assim que funciona hoje?
4. **Simples Nacional modelado por Anexo (I a V) com vigência por data**
   (as faixas/alíquotas mudam por lei de tempos em tempos). Preciso saber
   qual(is) anexo(s) se aplica(m) à Ambiens/Smart/IGH (serviços de
   criação/cenografia normalmente caem no Anexo III ou V) para cadastrar a
   tabela inicial corretamente.
5. **Campo "Situação de pagamento e de faturamento" do Job** — na planilha
   ele mistura dois conceitos (`Pago`/`A pagar` de um lado, `Emitir
   NFe`/`Faturado risco`/`Faturado total`/`NFe emitida` de outro). Separei
   em `paymentStatus` e `invoicingStatus`. Faz sentido, ou existe alguma
   combinação específica que deveria ser tratada como um único status?
6. **Rentabilidade de job**: hoje ligo `FinancialEntry.jobId` tanto em
   receitas quanto em custos diretos lançados manualmente contra o job. Não
   modelei rateio automático de custo fixo/overhead por job — é só custo
   direto lançado explicitamente. Confirma que é isso que vocês querem, ou
   precisa de rateio de custos indiretos também?
7. **Uma faixa de Simples por empresa/mês fica em `TaxCalculationSnapshot`**
   como cache/histórico auditável — o cálculo em si sempre pode ser
   refeito a partir dos lançamentos + tabela de faixas vigente.

Depois da sua validação, a ordem de execução segue o que você propôs: gerar
as migrations a partir deste schema, seeds de plano de contas/categorias
padrão, autenticação + CRUDs base, módulo de lançamentos, módulo de jobs,
relatórios, metas/projeções/Simples, dashboards e por fim o script de
importação da planilha.
