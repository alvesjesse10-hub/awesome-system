import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountTransferDto } from './dto/create-account-transfer.dto';
import { AuthenticatedUser } from '../auth/types';

const TRANSFER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.FINANCEIRO];

@Injectable()
export class AccountTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.accountTransfer.findMany({
      where: {
        OR: [{ sourceAccount: { companyId } }, { destinationAccount: { companyId } }],
      },
      include: {
        sourceAccount: { select: { id: true, name: true, companyId: true } },
        destinationAccount: { select: { id: true, name: true, companyId: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(user: AuthenticatedUser, dto: CreateAccountTransferDto) {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException('Conta de origem e destino não podem ser a mesma.');
    }

    const [sourceAccount, destinationAccount] = await Promise.all([
      this.prisma.bankAccount.findUnique({ where: { id: dto.sourceAccountId } }),
      this.prisma.bankAccount.findUnique({ where: { id: dto.destinationAccountId } }),
    ]);

    if (!sourceAccount || !destinationAccount) {
      throw new NotFoundException('Conta de origem ou destino não encontrada.');
    }

    // Transferência pode ser entre empresas do grupo (intercompany), mas o
    // usuário precisa ter papel financeiro/admin em AMBAS as empresas
    // envolvidas — não só na empresa ativa da requisição.
    for (const companyId of [sourceAccount.companyId, destinationAccount.companyId]) {
      const access = user.companyAccess.find((entry) => entry.companyId === companyId);
      if (!access || !TRANSFER_ROLES.includes(access.role)) {
        throw new ForbiddenException(
          'Usuário precisa de papel financeiro/admin em ambas as empresas envolvidas na transferência.',
        );
      }
    }

    return this.prisma.accountTransfer.create({
      data: {
        date: new Date(dto.date),
        amount: dto.amount,
        sourceAccountId: dto.sourceAccountId,
        destinationAccountId: dto.destinationAccountId,
        description: dto.description,
        createdByUserId: user.id,
      },
      include: {
        sourceAccount: { select: { id: true, name: true, companyId: true } },
        destinationAccount: { select: { id: true, name: true, companyId: true } },
      },
    });
  }
}
