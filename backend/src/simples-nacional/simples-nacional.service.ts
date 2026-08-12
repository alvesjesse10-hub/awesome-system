import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntryNature, SimplesAnnex } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBracketDto } from './dto/create-bracket.dto';
import { UpdateBracketDto } from './dto/update-bracket.dto';
import { calculateDas, calculateEffectiveRate, findBracket, type SimplesBracket } from './simples-nacional.util';

@Injectable()
export class SimplesNacionalService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // Faixas (CRUD global, compartilhado — igual ao plano de contas)
  // ---------------------------------------------------------------------

  findAllBrackets(annex?: SimplesAnnex) {
    return this.prisma.simplesNacionalBracket.findMany({
      where: { annex },
      orderBy: [{ annex: 'asc' }, { effectiveFrom: 'desc' }, { bracketOrder: 'asc' }],
    });
  }

  createBracket(dto: CreateBracketDto) {
    return this.prisma.simplesNacionalBracket.create({
      data: { ...dto, effectiveFrom: new Date(dto.effectiveFrom) },
    });
  }

  async updateBracket(id: string, dto: UpdateBracketDto) {
    await this.findBracketOrThrow(id);
    return this.prisma.simplesNacionalBracket.update({
      where: { id },
      data: { ...dto, effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined },
    });
  }

  async removeBracket(id: string) {
    await this.findBracketOrThrow(id);
    await this.prisma.simplesNacionalBracket.delete({ where: { id } });
  }

  private async findBracketOrThrow(id: string) {
    const bracket = await this.prisma.simplesNacionalBracket.findUnique({ where: { id } });
    if (!bracket) {
      throw new NotFoundException('Faixa do Simples Nacional não encontrada.');
    }
    return bracket;
  }

  // ---------------------------------------------------------------------
  // Cálculo (por empresa)
  // ---------------------------------------------------------------------

  async calculateAndSave(companyId: string, year: number, month: number, annex: SimplesAnnex) {
    const result = await this.calculate(companyId, year, month, annex);
    await this.prisma.taxCalculationSnapshot.upsert({
      where: { companyId_year_month: { companyId, year, month } },
      update: {
        rbt12: result.rbt12,
        nominalRate: result.nominalRate,
        effectiveRate: result.effectiveRate,
        dasValue: result.dasValue,
      },
      create: {
        companyId,
        year,
        month,
        rbt12: result.rbt12,
        nominalRate: result.nominalRate,
        effectiveRate: result.effectiveRate,
        dasValue: result.dasValue,
      },
    });
    return result;
  }

  async calculate(companyId: string, year: number, month: number, annex: SimplesAnnex) {
    const referenceDate = new Date(Date.UTC(year, month, 0)); // último dia do mês de referência
    const brackets = await this.getActiveBrackets(annex, referenceDate);
    if (brackets.length === 0) {
      throw new BadRequestException(
        `Nenhuma tabela de faixas do Simples Nacional cadastrada para o Anexo ${annex} até ${referenceDate.toISOString().slice(0, 10)}.`,
      );
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));
    const rbt12Start = new Date(Date.UTC(year, month - 12, 1));

    const [rbt12, monthRevenue] = await Promise.all([
      this.sumRevenueInRange(companyId, rbt12Start, monthEnd),
      this.sumRevenueInRange(companyId, monthStart, monthEnd),
    ]);

    const bracket = findBracket(brackets, rbt12);
    if (!bracket) {
      throw new BadRequestException(
        `RBT12 de R$ ${rbt12.toFixed(2)} excede o limite cadastrado do Simples Nacional para o Anexo ${annex}.`,
      );
    }

    const effectiveRate = calculateEffectiveRate(rbt12, bracket.nominalRate, bracket.deduction);
    const dasValue = calculateDas(monthRevenue, effectiveRate);

    return {
      companyId,
      year,
      month,
      annex,
      rbt12,
      monthRevenue,
      bracketOrder: bracket.bracketOrder,
      nominalRate: bracket.nominalRate,
      deduction: bracket.deduction,
      effectiveRate,
      dasValue,
    };
  }

  listSnapshots(companyId: string, year?: number) {
    return this.prisma.taxCalculationSnapshot.findMany({
      where: { companyId, year },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
  }

  /** Resolve a tabela de faixas vigente em `referenceDate`: para cada bracketOrder, usa a versão com o effectiveFrom mais recente que ainda seja <= referenceDate. */
  private async getActiveBrackets(annex: SimplesAnnex, referenceDate: Date): Promise<SimplesBracket[]> {
    const rows = await this.prisma.simplesNacionalBracket.findMany({
      where: { annex, effectiveFrom: { lte: referenceDate } },
      orderBy: [{ bracketOrder: 'asc' }, { effectiveFrom: 'desc' }],
    });

    const latestByOrder = new Map<number, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latestByOrder.has(row.bracketOrder)) {
        latestByOrder.set(row.bracketOrder, row);
      }
    }

    return Array.from(latestByOrder.values())
      .map((row) => ({
        bracketOrder: row.bracketOrder,
        revenueFrom: Number(row.revenueFrom),
        revenueTo: Number(row.revenueTo),
        nominalRate: Number(row.nominalRate),
        deduction: Number(row.deduction),
      }))
      .sort((a, b) => a.bracketOrder - b.bracketOrder);
  }

  private async sumRevenueInRange(companyId: string, start: Date, end: Date): Promise<number> {
    const result = await this.prisma.financialEntry.aggregate({
      where: { companyId, nature: EntryNature.REVENUE, entryDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
