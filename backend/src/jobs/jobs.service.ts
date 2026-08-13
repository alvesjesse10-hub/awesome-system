import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChartAccountGroup, FunnelStage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialEntriesService } from '../financial-entries/financial-entries.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateFunnelStageDto } from './dto/update-funnel-stage.dto';
import { FindAllJobsQuery } from './dto/find-all-jobs.query';
import { GenerateJobEntryDto } from './dto/generate-job-entry.dto';
import { calculateCommission, getJobTotalValue } from './commission.util';

const JOB_INCLUDE = {
  client: { select: { id: true, name: true } },
  responsibleEmployee: { select: { id: true, name: true, commissionType: true, commissionValue: true } },
} satisfies Prisma.JobInclude;

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialEntries: FinancialEntriesService,
  ) {}

  async findAll(companyId: string, query: FindAllJobsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where: Prisma.JobWhereInput = {
      companyId,
      funnelStage: query.funnelStage,
      result: query.result,
      temperature: query.temperature,
      clientId: query.clientId,
      responsibleEmployeeId: query.responsibleEmployeeId,
      name: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        include: JOB_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  /** Visão de funil: jobs agrupados por etapa, com contagem e valor total em pipeline por etapa. */
  async pipeline(companyId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { companyId },
      include: JOB_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    const stages = new Map<FunnelStage, { stage: FunnelStage; count: number; totalValue: number; jobs: typeof jobs }>();
    for (const stage of Object.values(FunnelStage)) {
      stages.set(stage, { stage, count: 0, totalValue: 0, jobs: [] });
    }

    for (const job of jobs) {
      const bucket = stages.get(job.funnelStage)!;
      bucket.count += 1;
      bucket.totalValue += getJobTotalValue({
        saleType: job.saleType,
        closedValue: job.closedValue ? Number(job.closedValue) : null,
        riskValue: job.riskValue ? Number(job.riskValue) : null,
        successValue: job.successValue ? Number(job.successValue) : null,
      });
      bucket.jobs.push(job);
    }

    return Array.from(stages.values());
  }

  async findOne(companyId: string, id: string) {
    const job = await this.prisma.job.findFirst({ where: { id, companyId }, include: JOB_INCLUDE });
    if (!job) {
      throw new NotFoundException('Job não encontrado.');
    }
    return job;
  }

  async create(companyId: string, userId: string, dto: CreateJobDto) {
    await this.validateReferences(companyId, dto);
    const commission = await this.resolveCommission(companyId, dto);

    return this.prisma.job.create({
      data: {
        ...dto,
        companyId,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
        proposalEntryDate: dto.proposalEntryDate ? new Date(dto.proposalEntryDate) : undefined,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        calculatedCommission: commission ?? undefined,
        createdByUserId: userId,
      },
      include: JOB_INCLUDE,
    });
  }

  async update(companyId: string, id: string, dto: UpdateJobDto) {
    const existing = await this.findOne(companyId, id);
    await this.validateReferences(companyId, dto);

    const valueFieldsChanged =
      dto.closedValue !== undefined ||
      dto.riskValue !== undefined ||
      dto.successValue !== undefined ||
      dto.saleType !== undefined ||
      dto.responsibleEmployeeId !== undefined;

    // Decimal do Prisma não soma como número (valueOf vira string) — converte
    // explicitamente ao mesclar os valores existentes com os do DTO.
    const commission = valueFieldsChanged
      ? await this.resolveCommission(companyId, {
          saleType: dto.saleType ?? existing.saleType ?? undefined,
          closedValue: dto.closedValue ?? (existing.closedValue ? Number(existing.closedValue) : undefined),
          riskValue: dto.riskValue ?? (existing.riskValue ? Number(existing.riskValue) : undefined),
          successValue: dto.successValue ?? (existing.successValue ? Number(existing.successValue) : undefined),
          responsibleEmployeeId: dto.responsibleEmployeeId ?? existing.responsibleEmployeeId ?? undefined,
        })
      : undefined;

    return this.prisma.job.update({
      where: { id },
      data: {
        ...dto,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
        proposalEntryDate: dto.proposalEntryDate ? new Date(dto.proposalEntryDate) : undefined,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        calculatedCommission: commission ?? undefined,
      },
      include: JOB_INCLUDE,
    });
  }

  async updateFunnelStage(companyId: string, id: string, dto: UpdateFunnelStageDto) {
    await this.findOne(companyId, id);
    return this.prisma.job.update({
      where: { id },
      data: { funnelStage: dto.funnelStage },
      include: JOB_INCLUDE,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.job.delete({ where: { id } });
  }

  /** Gera lançamento(s) de receita a receber a partir de um job aprovado/fechado. */
  async generateEntry(companyId: string, userId: string, id: string, dto: GenerateJobEntryDto) {
    const job = await this.findOne(companyId, id);
    if (!job.clientId) {
      throw new BadRequestException('Job não tem cliente vinculado; não é possível gerar lançamento de receita.');
    }

    const chartOfAccount = await this.prisma.chartOfAccount.findUnique({ where: { id: dto.chartOfAccountId } });
    if (!chartOfAccount) {
      throw new NotFoundException('Categoria do plano de contas não encontrada.');
    }
    if (chartOfAccount.group !== ChartAccountGroup.RECEITA) {
      throw new BadRequestException('A categoria escolhida precisa ser do grupo Receita.');
    }

    const amount = getJobTotalValue({
      saleType: job.saleType,
      closedValue: job.closedValue ? Number(job.closedValue) : null,
      riskValue: job.riskValue ? Number(job.riskValue) : null,
      successValue: job.successValue ? Number(job.successValue) : null,
    });
    if (amount <= 0) {
      throw new BadRequestException('Job não tem valor fechado/risco/success definido.');
    }

    return this.financialEntries.create(companyId, userId, {
      clientId: job.clientId,
      costCenterId: dto.costCenterId,
      chartOfAccountId: dto.chartOfAccountId,
      jobId: job.id,
      invoiceNumber: dto.invoiceNumber,
      description: `Job: ${job.name}`,
      amount,
      installments: dto.installments,
      entryDate: dto.entryDate,
      dueDate: dto.dueDate,
    });
  }

  private async resolveCommission(
    companyId: string,
    fields: {
      saleType?: CreateJobDto['saleType'];
      closedValue?: number;
      riskValue?: number;
      successValue?: number;
      responsibleEmployeeId?: string;
    },
  ) {
    if (!fields.responsibleEmployeeId) {
      return null;
    }
    const employee = await this.prisma.employee.findFirst({
      where: { id: fields.responsibleEmployeeId, companyId },
      select: { commissionType: true, commissionValue: true },
    });
    if (!employee) {
      throw new NotFoundException('Colaborador responsável não encontrado nesta empresa.');
    }

    return calculateCommission(
      {
        saleType: fields.saleType ?? null,
        closedValue: fields.closedValue ?? null,
        riskValue: fields.riskValue ?? null,
        successValue: fields.successValue ?? null,
      },
      { commissionType: employee.commissionType, commissionValue: employee.commissionValue ? Number(employee.commissionValue) : null },
    );
  }

  private async validateReferences(companyId: string, dto: Partial<CreateJobDto>) {
    const checks: Promise<unknown>[] = [];

    if (dto.clientId) {
      checks.push(
        this.prisma.client.findFirst({ where: { id: dto.clientId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Cliente não encontrado nesta empresa.');
        }),
      );
    }
    if (dto.responsibleEmployeeId) {
      checks.push(
        this.prisma.employee.findFirst({ where: { id: dto.responsibleEmployeeId, companyId } }).then((r) => {
          if (!r) throw new NotFoundException('Colaborador responsável não encontrado nesta empresa.');
        }),
      );
    }

    await Promise.all(checks);
  }
}
