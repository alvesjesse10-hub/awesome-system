import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string, includeInactive?: boolean) {
    return this.prisma.employee.findMany({
      where: { companyId, isActive: includeInactive ? undefined : true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) {
      throw new NotFoundException('Colaborador não encontrado.');
    }
    return employee;
  }

  create(companyId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: { ...dto, companyId } });
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(companyId, id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.employee.delete({ where: { id } });
  }
}
