import { PrismaClient, ChartAccountGroup, SimplesAnnex, UserRole, TaxRegime } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Plano de contas padrão extraído da planilha atual. Editável depois pelo
// usuário via CRUD — isto é só o ponto de partida.
const CHART_OF_ACCOUNTS: Record<ChartAccountGroup, string[]> = {
  RECEITA: [
    'Criação Valor Único',
    'Alteração',
    'Vídeo',
    'Executivo',
    'Criação com Executivo',
    'Success Fee',
    'Criação Risco',
  ],
  CUSTO_FIXO: ['Pró-labore', 'Salário', 'Máquinas e Equipamentos', 'Limpeza', 'Marketing'],
  DESPESA_FIXA: ['Aluguel', 'Energia', 'Contabilidade', 'Escritório', 'Programas'],
  CUSTO_VARIAVEL: ['Imposto', 'Freelancer', 'Despesa com Alimentação', 'Despesa com Transporte'],
  DESPESA_VARIAVEL: ['Cartão de Crédito', 'Comissão', 'Mercado', 'Jurídico', 'Curso'],
  BONIFICACAO: ['Dividendos', 'PLR'],
  INVESTIMENTO: ['Aplicação por empresa', 'Renda Fixa'],
};

const GROUP_LABEL: Record<ChartAccountGroup, string> = {
  RECEITA: 'Receita',
  CUSTO_FIXO: 'Custo Fixo',
  DESPESA_FIXA: 'Despesa Fixa',
  CUSTO_VARIAVEL: 'Custo Variável',
  DESPESA_VARIAVEL: 'Despesa Variável',
  BONIFICACAO: 'Bonificação',
  INVESTIMENTO: 'Investimento',
};

// Tabela do Simples Nacional — Anexo III (serviços), vigente desde a reforma
// de jan/2018. PLACEHOLDER: confirmar com o usuário se Ambiens/Smart/IGH se
// enquadram no Anexo III ou em outro anexo antes de usar em produção.
const SIMPLES_ANEXO_III = [
  { bracketOrder: 1, revenueFrom: 0, revenueTo: 180_000, nominalRate: 0.06, deduction: 0 },
  { bracketOrder: 2, revenueFrom: 180_000.01, revenueTo: 360_000, nominalRate: 0.112, deduction: 9_360 },
  { bracketOrder: 3, revenueFrom: 360_000.01, revenueTo: 720_000, nominalRate: 0.135, deduction: 17_640 },
  { bracketOrder: 4, revenueFrom: 720_000.01, revenueTo: 1_800_000, nominalRate: 0.16, deduction: 35_640 },
  { bracketOrder: 5, revenueFrom: 1_800_000.01, revenueTo: 3_600_000, nominalRate: 0.21, deduction: 125_640 },
  { bracketOrder: 6, revenueFrom: 3_600_000.01, revenueTo: 4_800_000, nominalRate: 0.33, deduction: 648_000 },
];

async function seedChartOfAccounts() {
  for (const group of Object.keys(CHART_OF_ACCOUNTS) as ChartAccountGroup[]) {
    const parent = await prisma.chartOfAccount.upsert({
      where: { id: `seed-group-${group}` },
      update: {},
      create: { id: `seed-group-${group}`, name: GROUP_LABEL[group], group, parentId: null },
    });

    for (const childName of CHART_OF_ACCOUNTS[group]) {
      const existing = await prisma.chartOfAccount.findFirst({
        where: { parentId: parent.id, name: childName },
      });
      if (!existing) {
        await prisma.chartOfAccount.create({
          data: { name: childName, group, parentId: parent.id },
        });
      }
    }
  }
  console.log('Plano de contas padrão criado.');
}

async function seedSimplesNacional() {
  const effectiveFrom = new Date('2018-01-01');
  for (const bracket of SIMPLES_ANEXO_III) {
    await prisma.simplesNacionalBracket.upsert({
      where: {
        annex_bracketOrder_effectiveFrom: {
          annex: SimplesAnnex.ANEXO_III,
          bracketOrder: bracket.bracketOrder,
          effectiveFrom,
        },
      },
      update: {},
      create: {
        annex: SimplesAnnex.ANEXO_III,
        bracketOrder: bracket.bracketOrder,
        revenueFrom: bracket.revenueFrom,
        revenueTo: bracket.revenueTo,
        nominalRate: bracket.nominalRate,
        deduction: bracket.deduction,
        effectiveFrom,
      },
    });
  }
  console.log('Tabela do Simples Nacional (Anexo III) criada.');
}

async function seedCompanies() {
  const companies = [
    { id: 'seed-company-ambiens', name: 'Ambiens Cenografia e Arquitetura Ltda', tradeName: 'Ambiens', cnpj: '00000000000101' },
    { id: 'seed-company-smart', name: 'Smart Eventos Ltda', tradeName: 'Smart', cnpj: '00000000000102' },
    { id: 'seed-company-igh', name: 'IGH Ltda', tradeName: 'IGH', cnpj: '00000000000103' },
  ];

  const created = [];
  for (const company of companies) {
    const record = await prisma.company.upsert({
      where: { id: company.id },
      update: {},
      create: { ...company, taxRegime: TaxRegime.SIMPLES_NACIONAL },
    });
    created.push(record);

    const existingCostCenter = await prisma.costCenter.findFirst({
      where: { companyId: record.id, name: 'Geral' },
    });
    if (!existingCostCenter) {
      await prisma.costCenter.create({ data: { companyId: record.id, name: 'Geral' } });
    }
  }
  console.log('Empresas (Ambiens, Smart, IGH) e centro de custo padrão criados.');
  return created;
}

async function seedAdminUser(companies: { id: string }[]) {
  const email = 'admin@ambiens.com.br';
  const passwordHash = await bcrypt.hash('TrocarSenha123!', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Administrador', email, passwordHash },
  });

  for (const company of companies) {
    await prisma.userCompanyAccess.upsert({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
      update: {},
      create: { userId: user.id, companyId: company.id, role: UserRole.ADMIN },
    });
  }
  console.log(`Usuário admin criado: ${email} / senha temporária: TrocarSenha123! (trocar no primeiro acesso)`);
}

async function main() {
  await seedChartOfAccounts();
  await seedSimplesNacional();
  const companies = await seedCompanies();
  await seedAdminUser(companies);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
