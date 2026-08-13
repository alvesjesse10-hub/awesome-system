import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AccountTransfersService } from './account-transfers.service';
import { CreateAccountTransferDto } from './dto/create-account-transfer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import { AuthenticatedUser } from '../auth/types';

// Sem PATCH/DELETE: transferências são movimentações financeiras
// confirmadas, tratadas como imutáveis por integridade de auditoria (uma
// transferência errada se corrige com uma nova transferência de estorno,
// não editando o registro original).
@UseGuards(CompanyAccessGuard)
@Controller('account-transfers')
export class AccountTransfersController {
  constructor(private readonly service: AccountTransfersService) {}

  @Get()
  findAll(@CompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAccountTransferDto) {
    return this.service.create(user, dto);
  }
}
