import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { CreateRevenueProjectionDto } from './dto/create-revenue-projection.dto';
import { UpdateRevenueProjectionDto } from './dto/update-revenue-projection.dto';

@Injectable()
export class RevenueProjectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
  ) {}

  findAll(companyId: string, year?: number) {
    return this.prisma.revenueProjection.findMany({
      where: { companyId, year },
      include: { chartOfAccount: { select: { id: true, name: true } } },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const projection = await this.prisma.revenueProjection.findFirst({ where: { id, companyId } });
    if (!projection) {
      throw new NotFoundException('Projeção não encontrada.');
    }
    return projection;
  }

  async create(companyId: string, dto: CreateRevenueProjectionDto) {
    const chartOfAccount = await this.prisma.chartOfAccount.findUnique({ where: { id: dto.chartOfAccountId } });
    if (!chartOfAccount) {
      throw new NotFoundException('Categoria do plano de contas não encontrada.');
    }
    return this.prisma.revenueProjection.create({ data: { ...dto, companyId } });
  }

  async update(companyId: string, id: string, dto: UpdateRevenueProjectionDto) {
    await this.findOne(companyId, id);
    return this.prisma.revenueProjection.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.revenueProjection.delete({ where: { id } });
  }

  /** Projeção (soma de todas as categorias) x realizado, mês a mês. */
  async comparison(companyId: string, year: number) {
    const [projections, dre] = await Promise.all([
      this.prisma.revenueProjection.findMany({ where: { companyId, year } }),
      this.reports.getDre([companyId], year),
    ]);

    const realizedByMonth = dre.rows.find((row) => row.key === 'RECEITA')!.months;
    const projectedByMonth = new Array(12).fill(0);
    for (const projection of projections) {
      projectedByMonth[projection.month - 1] += Number(projection.projectedAmount);
    }

    return Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      projected: projectedByMonth[index],
      realized: realizedByMonth[index],
    }));
  }
}
