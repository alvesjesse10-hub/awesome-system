import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-context.decorator';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';

@UseGuards(CompanyAccessGuard)
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Get()
  findAll(@CompanyId() companyId: string) {
    return this.service.findAll(companyId);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateBankAccountDto) {
    return this.service.create(companyId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBankAccountDto) {
    return this.service.update(companyId, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Delete(':id')
  remove(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(companyId, id);
  }
}
