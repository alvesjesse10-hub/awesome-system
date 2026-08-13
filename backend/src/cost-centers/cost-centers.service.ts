import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.costCenter.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async findOne(companyId: string, id: string) {
    const costCenter = await this.prisma.costCenter.findFirst({ where: { id, companyId } });
    if (!costCenter) {
      throw new NotFoundException('Centro de custo não encontrado.');
    }
    return costCenter;
  }

  create(companyId: string, dto: CreateCostCenterDto) {
    return this.prisma.costCenter.create({ data: { ...dto, companyId } });
  }

  async update(companyId: string, id: string, dto: UpdateCostCenterDto) {
    await this.findOne(companyId, id);
    return this.prisma.costCenter.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.costCenter.delete({ where: { id } });
  }
}
