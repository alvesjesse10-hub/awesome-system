import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChartAccountGroup, EntryNature, EntryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { UpdateFinancialEntryDto } from './dto/update-financial-entry.dto';
import { PayFinancialEntryDto } from './dto/pay-financial-entry.dto';
import { FindAllFinancialEntriesQuery } from './dto/find-all-financial-entries.query';
import { addMonthsUTC, getCompetence, splitAmountIntoInstallments } from './date.util';
import { withDisplayStatus } from './status.util';

const ENTRY_INCLUDE = {
  client: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
  costCenter: { select: { id: true, name: true } },
  chartOfAccount: { select: { id: true, name: true, group: true } },
  bankAccount: { select: { id: true, name: true } },
  job: { select: { id: true, name: true } },
} satisfies Prisma.FinancialEntryInclude;

@Injectable()
export class FinancialEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: FindAllFinancialEntriesQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const where: Prisma.FinancialEntryWhereInput = {
      companyId,
      costCenterId: query.costCenterId,
      chartOfAccountId: query.chartOfAccountId,
      clientId: query.clientId,
      supplierId: query.supplierId,
      jobId: query.jobId,
      dueMonth: query.dueMonth,
      dueYear: query.dueYear,
      competenceMonth: query.competenceMonth,
      competenceYear: query.competenceYear,
      description: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
    };

    if (query.status === 'PAID') {
      where.status = EntryStatus.PAID;
    } else if (query.status === 'PENDING') {
      where.status = EntryStatus.PENDING;
      where.dueDate = { gte: today };
    } else if (query.status === 'OVERDUE') {
      where.status = EntryStatus.PENDING;
      where.dueDate = { lt: today };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.financialEntry.count({ where }),
      this.prisma.financialEntry.findMany({
        where,
        include: ENTRY_INCLUDE,
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(withDisplayStatus),
      total,
      page,
      pageSize,
    };
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.prisma.financialEntry.findFirst({
      where: { id, companyId },
      include: ENTRY_INCLUDE,
    });
    if (!entry) {
      throw new NotFoundException('Lançamento financeiro não encontrado.');
    }
    return withDisplayStatus(entry);
  }

  async create(companyId: string, userId: string, dto: CreateFinancialEntryDto) {
    if (!dto.clientId && !dto.supplierId) {
      throw new BadRequestException('Informe um cliente ou um fornecedor.');
    }
    if (dto.clientId && dto.supplierId) {
      throw new BadRequestException('Informe apenas um: cliente OU fornecedor, não os dois.');
    }

    const chartOfAccount = await this.validateReferences(companyId, dto);
    if (!chartOfAccount) {
      throw new BadRequestException('chartOfAccountId é obrigatório.');
    }
    const nature = chartOfAccount.group === ChartAccountGroup.RECEITA ? EntryNature.REVENUE : EntryNature.EXPENSE;

    const installments = dto.installments ?? 1;
    const entryDate = new Date(dto.entryDate);
    const firstDueDate = new Date(dto.dueDate);
    const amounts = splitAmountIntoInstallments(dto.amount, installments);
    const installmentGroupId = installments > 1 ? crypto.randomUUID() : null;

    const rows = amounts.map((amount, index) => {
      const dueDate = addMonthsUTC(firstDueDate, index);
      const competence = getCompetence(entryDate);
      const due = getCompetence(dueDate);

      return {
        companyId,
        clientId: dto.clientId,
        supplierId: dto.supplierId,
        costCenterId: dto.costCenterId,
        chartOfAccountId: dto.chartOfAccountId,
        bankAccountId: dto.bankAccountId,
        jobId: dto.jobId,
        nature,
        invoiceNumber: dto.invoiceNumber,
        description: dto.description,
        amount,
        installmentGroupId: installmentGroupId ?? undefined,
        installmentNumber: index + 1,
        installmentTotal: installments,
        entryDate,
        dueDate,
        situacao: dto.situacao,
        competenceMonth: competence.month,
        competenceYear: competence.year,
        dueMonth: due.month,
        dueYear: due.year,
        createdByUserId: userId,
      } satisfies Prisma.FinancialEntryUncheckedCreateInput;
    });

    const created = await this.prisma.$transaction(rows.map((data) => this.prisma.financialEntry.create({ data, include: ENTRY_INCLUDE })));
    return created.map(withDisplayStatus);
  }

  async update(companyId: string, userId: string, id: string, dto: UpdateFinancialEntryDto) {
    await this.findOne(companyId, id);

    let nature: EntryNature | undefined;
    if (dto.chartOfAccountId || dto.costCenterId || dto.clientId || dto.supplierId || dto.jobId) {
      const chartOfAccount = await this.validateReferences(companyId, dto, { partial: true });
      if (dto.chartOfAccountId && chartOfAccount) {
        nature = chartOfAccount.group === ChartAccountGroup.RECEITA ? EntryNature.REVENUE : EntryNature.EXPENSE;
      }
    }

    const data: Prisma.FinancialEntryUncheckedUpdateInput = {
      ...dto,
      nature,
      updatedByUserId: userId,
    };

    if (dto.entryDate) {
      const entryDate = new Date(dto.entryDate);
      const competence = getCompetence(entryDate);
      data.entryDate = entryDate;
      data.competenceMonth = competence.month;
      data.competenceYear = competence.year;
    }
    if (dto.dueDate) {
      const dueDate = new Date(dto.dueDate);
      const due = getCompetence(dueDate);
      data.dueDate = dueDate;
      data.dueMonth = due.month;
      data.dueYear = due.year;
    }

    const updated = await this.prisma.financialEntry.update({ where: { id }, data, include: ENTRY_INCLUDE });
    return withDisplayStatus(updated);
  }

  async pay(companyId: string, userId: string, id: string, dto: PayFinancialEntryDto) {
    await this.findOne(companyId, id);

    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, companyId },
    });
    if (!bankAccount) {
      throw new NotFoundException('Conta bancária não encontrada nesta empresa.');
    }

    const updated = await this.prisma.financialEntry.update({
      where: { id },
      data: {
        status: EntryStatus.PAID,
        paymentDate: new Date(dto.paymentDate),
        bankAccountId: dto.bankAccountId,
        updatedByUserId: userId,
      },
      include: ENTRY_INCLUDE,
    });
    return withDisplayStatus(updated);
  }

  async unpay(companyId: string, userId: string, id: string) {
    await this.findOne(companyId, id);
    const updated = await this.prisma.financialEntry.update({
      where: { id },
      data: { status: EntryStatus.PENDING, paymentDate: null, updatedByUserId: userId },
      include: ENTRY_INCLUDE,
    });
    return withDisplayStatus(updated);
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.financialEntry.delete({ where: { id } });
  }

  async removeInstallmentGroup(companyId: string, installmentGroupId: string) {
    const { count } = await this.prisma.financialEntry.deleteMany({
      where: { companyId, installmentGroupId },
    });
    if (count === 0) {
      throw new NotFoundException('Grupo de parcelas não encontrado.');
    }
    return { deleted: count };
  }

  private async validateReferences(
    companyId: string,
    dto: Partial<CreateFinancialEntryDto>,
    options: { partial?: boolean } = {},
  ) {
    const checks: Promise<unknown>[] = [];

    if (dto.costCenterId) {
      checks.push(
        this.prisma.costCenter.findFirst({ where: { id: dto.costCenterId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Centro de custo não encontrado nesta empresa.');
        }),
      );
    } else if (!options.partial) {
      throw new BadRequestException('costCenterId é obrigatório.');
    }

    if (dto.clientId) {
      checks.push(
        this.prisma.client.findFirst({ where: { id: dto.clientId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Cliente não encontrado nesta empresa.');
        }),
      );
    }
    if (dto.supplierId) {
      checks.push(
        this.prisma.supplier.findFirst({ where: { id: dto.supplierId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Fornecedor não encontrado nesta empresa.');
        }),
      );
    }
    if (dto.bankAccountId) {
      checks.push(
        this.prisma.bankAccount.findFirst({ where: { id: dto.bankAccountId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Conta bancária não encontrada nesta empresa.');
        }),
      );
    }
    if (dto.jobId) {
      checks.push(
        this.prisma.job.findFirst({ where: { id: dto.jobId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Job não encontrado nesta empresa.');
        }),
      );
    }

    let chartOfAccountPromise: Promise<{ id: string; group: ChartAccountGroup } | null> | null = null;
    if (dto.chartOfAccountId) {
      chartOfAccountPromise = this.prisma.chartOfAccount.findUnique({
        where: { id: dto.chartOfAccountId },
        select: { id: true, group: true },
      });
    } else if (!options.partial) {
      throw new BadRequestException('chartOfAccountId é obrigatório.');
    }

    // Dispara todas as verificações (incluindo o plano de contas) num único
    // Promise.all, sem nenhum `await` entre a criação das promises e essa
    // linha — se alguma checagem rejeitar antes de o plano de contas ser
    // aguardado separadamente, ela ficaria sem handler por um instante e
    // poderia disparar um unhandledRejection.
    const [chartOfAccount] = await Promise.all([chartOfAccountPromise ?? Promise.resolve(null), ...checks]);
    if (dto.chartOfAccountId && !chartOfAccount) {
      throw new NotFoundException('Categoria do plano de contas não encontrada.');
    }
    return chartOfAccount;
  }
}
