-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FINANCEIRO', 'COMERCIAL', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "ChartAccountGroup" AS ENUM ('RECEITA', 'CUSTO_FIXO', 'DESPESA_FIXA', 'CUSTO_VARIAVEL', 'DESPESA_VARIAVEL', 'BONIFICACAO', 'INVESTIMENTO');

-- CreateEnum
CREATE TYPE "EntryNature" AS ENUM ('REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('JOB', 'VERSAO', 'PACOTE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CRIACAO', 'ALTERACAO', 'EXECUTIVO', 'VIDEO');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('CONCORRENCIA', 'JOB_FECHADO');

-- CreateEnum
CREATE TYPE "Temperature" AS ENUM ('MORNO', 'GO', 'QUENTE', 'FRIO');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('REGULAR', 'QUEIMA_ROUPA', 'BURACO_NEGRO');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CENOGRAFIA_FISICA', 'ARQUITETURA');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ESTANDE', 'FESTIVAL', 'EVENTO', 'QUIOSQUE');

-- CreateEnum
CREATE TYPE "ProjectSize" AS ENUM ('P', 'M', 'G', 'GG');

-- CreateEnum
CREATE TYPE "Deliverable" AS ENUM ('MODELO_3D', 'PLANTA', 'DESCRITIVO', 'VIDEO');

-- CreateEnum
CREATE TYPE "FunnelStage" AS ENUM ('FOLLOW', 'PROPOSTA_APROVADA', 'AG_PAGAMENTO_UNICO', 'AG_PAGAMENTO_RISCO', 'FINALIZADO', 'ENTREGUE', 'AJUSTE', 'NAO_INICIADA');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('ENVIAR_PROPOSTA', 'PROPOSTA_APROVADA', 'PROPOSTA_REPROVADA', 'AJUSTE_SEM_CUSTO');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('VALOR_UNICO', 'RISCO_SUCCESS', 'AJUSTE');

-- CreateEnum
CREATE TYPE "JobResult" AS ENUM ('GANHOU_COM_SUCCESS', 'GANHOU_SEM_SUCCESS', 'PERDEU', 'CANCELADO', 'AGUARDANDO_RETORNO');

-- CreateEnum
CREATE TYPE "JobPaymentStatus" AS ENUM ('PAGO', 'A_PAGAR');

-- CreateEnum
CREATE TYPE "JobInvoicingStatus" AS ENUM ('EMITIR_NFE', 'FATURADO_RISCO', 'FATURADO_TOTAL', 'NFE_EMITIDA');

-- CreateEnum
CREATE TYPE "SimplesAnnex" AS ENUM ('ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT NOT NULL,
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'SIMPLES_NACIONAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BankAccountType" NOT NULL DEFAULT 'CHECKING',
    "bankName" TEXT,
    "initialBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_transfers" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "destinationAccountId" TEXT NOT NULL,
    "description" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "group" "ChartAccountGroup" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "pixKey" TEXT,
    "role" TEXT NOT NULL,
    "baseSalary" DECIMAL(14,2),
    "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "commissionValue" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT,
    "supplierId" TEXT,
    "costCenterId" TEXT NOT NULL,
    "chartOfAccountId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "jobId" TEXT,
    "nature" "EntryNature" NOT NULL,
    "invoiceNumber" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "installmentGroupId" TEXT,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "installmentTotal" INTEGER NOT NULL DEFAULT 1,
    "entryDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "paymentDate" DATE,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "situacao" TEXT,
    "competenceMonth" INTEGER NOT NULL,
    "competenceYear" INTEGER NOT NULL,
    "dueMonth" INTEGER NOT NULL,
    "dueYear" INTEGER NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agency" TEXT,
    "clientId" TEXT,
    "brand" TEXT,
    "contactName" TEXT,
    "entryDate" DATE,
    "proposalEntryDate" DATE,
    "eventDate" DATE,
    "estimatedBudget" DECIMAL(14,2),
    "type" "JobType" NOT NULL DEFAULT 'JOB',
    "service" "ServiceType"[],
    "competitionStatus" "CompetitionStatus" NOT NULL DEFAULT 'CONCORRENCIA',
    "temperature" "Temperature" NOT NULL DEFAULT 'MORNO',
    "projectType" "ProjectType" NOT NULL DEFAULT 'REGULAR',
    "product" "ProductType",
    "eventType" "EventType",
    "projectSize" "ProjectSize",
    "location" TEXT,
    "segment" TEXT,
    "deliverables" "Deliverable"[],
    "funnelStage" "FunnelStage" NOT NULL DEFAULT 'FOLLOW',
    "proposalStatus" "ProposalStatus" NOT NULL DEFAULT 'ENVIAR_PROPOSTA',
    "saleType" "SaleType",
    "result" "JobResult" NOT NULL DEFAULT 'AGUARDANDO_RETORNO',
    "closedValue" DECIMAL(14,2),
    "riskValue" DECIMAL(14,2),
    "successValue" DECIMAL(14,2),
    "calculatedCommission" DECIMAL(14,2),
    "paymentStatus" "JobPaymentStatus" NOT NULL DEFAULT 'A_PAGAR',
    "invoicingStatus" "JobInvoicingStatus",
    "responsibleEmployeeId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_goals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_projections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "chartOfAccountId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "projectedAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simples_nacional_brackets" (
    "id" TEXT NOT NULL,
    "annex" "SimplesAnnex" NOT NULL,
    "bracketOrder" INTEGER NOT NULL,
    "revenueFrom" DECIMAL(14,2) NOT NULL,
    "revenueTo" DECIMAL(14,2) NOT NULL,
    "nominalRate" DECIMAL(6,4) NOT NULL,
    "deduction" DECIMAL(14,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simples_nacional_brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_calculation_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "rbt12" DECIMAL(14,2) NOT NULL,
    "nominalRate" DECIMAL(6,4) NOT NULL,
    "effectiveRate" DECIMAL(6,4) NOT NULL,
    "dasValue" DECIMAL(14,2) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_calculation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_review_criteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salary_review_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_review_assessments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assessmentDate" DATE NOT NULL,
    "notes" TEXT,
    "finalScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_review_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_review_scores" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "score" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "salary_review_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_adjustments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "referenceDate" DATE NOT NULL,
    "indexUsed" DECIMAL(6,4) NOT NULL,
    "previousSalary" DECIMAL(14,2) NOT NULL,
    "adjustmentPercentage" DECIMAL(6,4) NOT NULL,
    "newSalary" DECIMAL(14,2) NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sourceSheet" TEXT NOT NULL,
    "importedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rowsProcessed" INTEGER NOT NULL DEFAULT 0,
    "rowsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_access_userId_companyId_key" ON "user_company_access"("userId", "companyId");

-- CreateIndex
CREATE INDEX "bank_accounts_companyId_idx" ON "bank_accounts"("companyId");

-- CreateIndex
CREATE INDEX "account_transfers_sourceAccountId_idx" ON "account_transfers"("sourceAccountId");

-- CreateIndex
CREATE INDEX "account_transfers_destinationAccountId_idx" ON "account_transfers"("destinationAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_companyId_name_key" ON "cost_centers"("companyId", "name");

-- CreateIndex
CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_document_key" ON "clients"("companyId", "document");

-- CreateIndex
CREATE INDEX "suppliers_companyId_idx" ON "suppliers"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_document_key" ON "suppliers"("companyId", "document");

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "financial_entries_companyId_dueDate_idx" ON "financial_entries"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "financial_entries_companyId_status_idx" ON "financial_entries"("companyId", "status");

-- CreateIndex
CREATE INDEX "financial_entries_companyId_competenceYear_competenceMonth_idx" ON "financial_entries"("companyId", "competenceYear", "competenceMonth");

-- CreateIndex
CREATE INDEX "financial_entries_jobId_idx" ON "financial_entries"("jobId");

-- CreateIndex
CREATE INDEX "financial_entries_installmentGroupId_idx" ON "financial_entries"("installmentGroupId");

-- CreateIndex
CREATE INDEX "jobs_companyId_funnelStage_idx" ON "jobs"("companyId", "funnelStage");

-- CreateIndex
CREATE INDEX "jobs_responsibleEmployeeId_idx" ON "jobs"("responsibleEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_goals_companyId_year_month_key" ON "revenue_goals"("companyId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_projections_companyId_chartOfAccountId_year_month_key" ON "revenue_projections"("companyId", "chartOfAccountId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "simples_nacional_brackets_annex_bracketOrder_effectiveFrom_key" ON "simples_nacional_brackets"("annex", "bracketOrder", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "tax_calculation_snapshots_companyId_year_month_key" ON "tax_calculation_snapshots"("companyId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "salary_review_scores_assessmentId_criteriaId_key" ON "salary_review_scores"("assessmentId", "criteriaId");

-- CreateIndex
CREATE UNIQUE INDEX "salary_adjustments_assessmentId_key" ON "salary_adjustments"("assessmentId");

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_chartOfAccountId_fkey" FOREIGN KEY ("chartOfAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_goals" ADD CONSTRAINT "revenue_goals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_projections" ADD CONSTRAINT "revenue_projections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_projections" ADD CONSTRAINT "revenue_projections_chartOfAccountId_fkey" FOREIGN KEY ("chartOfAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_calculation_snapshots" ADD CONSTRAINT "tax_calculation_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_review_assessments" ADD CONSTRAINT "salary_review_assessments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_review_scores" ADD CONSTRAINT "salary_review_scores_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "salary_review_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_review_scores" ADD CONSTRAINT "salary_review_scores_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "salary_review_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_adjustments" ADD CONSTRAINT "salary_adjustments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "salary_review_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
