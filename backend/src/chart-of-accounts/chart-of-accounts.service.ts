import { Injectable, NotFoundException } from '@nestjs/common';
import { ChartAccountGroup } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { group?: ChartAccountGroup; includeInactive?: boolean }) {
    return this.prisma.chartOfAccount.findMany({
      where: {
        group: params.group,
        isActive: params.includeInactive ? undefined : true,
      },
      include: { children: true },
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.chartOfAccount.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!account) {
      throw new NotFoundException('Categoria do plano de contas não encontrada.');
    }
    return account;
  }

  create(dto: CreateChartOfAccountDto) {
    return this.prisma.chartOfAccount.create({ data: dto });
  }

  // group e parentId não são editáveis: reclassificar uma categoria depois
  // que ela já tem lançamentos vinculados mudaria silenciosamente relatórios
  // históricos (DRE, projeções). Para reclassificar, crie uma categoria nova
  // e desative a antiga.
  async update(id: string, dto: UpdateChartOfAccountDto) {
    await this.findOne(id);
    return this.prisma.chartOfAccount.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.chartOfAccount.delete({ where: { id } });
  }
}
