import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.bankAccount.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async findOne(companyId: string, id: string) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id, companyId } });
    if (!account) {
      throw new NotFoundException('Conta bancária não encontrada.');
    }
    return account;
  }

  create(companyId: string, dto: CreateBankAccountDto) {
    return this.prisma.bankAccount.create({ data: { ...dto, companyId } });
  }

  async update(companyId: string, id: string, dto: UpdateBankAccountDto) {
    await this.findOne(companyId, id);
    return this.prisma.bankAccount.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.bankAccount.delete({ where: { id } });
  }
}
