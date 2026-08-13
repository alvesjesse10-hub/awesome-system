import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { CreateRevenueGoalDto } from './dto/create-revenue-goal.dto';
import { UpdateRevenueGoalDto } from './dto/update-revenue-goal.dto';

@Injectable()
export class RevenueGoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
  ) {}

  findAll(companyId: string, year?: number) {
    return this.prisma.revenueGoal.findMany({
      where: { companyId, year },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const goal = await this.prisma.revenueGoal.findFirst({ where: { id, companyId } });
    if (!goal) {
      throw new NotFoundException('Meta de faturamento não encontrada.');
    }
    return goal;
  }

  create(companyId: string, dto: CreateRevenueGoalDto) {
    return this.prisma.revenueGoal.create({ data: { ...dto, companyId } });
  }

  async update(companyId: string, id: string, dto: UpdateRevenueGoalDto) {
    await this.findOne(companyId, id);
    return this.prisma.revenueGoal.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.revenueGoal.delete({ where: { id } });
  }

  /** Meta x realizado (regime de competência, mesma base do DRE) mês a mês. */
  async comparison(companyId: string, year: number) {
    const [goals, dre] = await Promise.all([
      this.prisma.revenueGoal.findMany({ where: { companyId, year } }),
      this.reports.getDre([companyId], year),
    ]);

    const realizedByMonth = dre.rows.find((row) => row.key === 'RECEITA')!.months;
    const goalByMonth = new Map(goals.map((goal) => [goal.month, Number(goal.targetAmount)]));

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const target = goalByMonth.get(month) ?? 0;
      const realized = realizedByMonth[index];
      return {
        month,
        target,
        realized,
        achievementPercent: target > 0 ? (realized / target) * 100 : null,
      };
    });
  }
}
