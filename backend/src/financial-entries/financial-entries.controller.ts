import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FinancialEntriesService } from './financial-entries.service';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { UpdateFinancialEntryDto } from './dto/update-financial-entry.dto';
import { PayFinancialEntryDto } from './dto/pay-financial-entry.dto';
import { FindAllFinancialEntriesQuery } from './dto/find-all-financial-entries.query';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import { AuthenticatedUser } from '../auth/types';

@UseGuards(CompanyAccessGuard)
@Controller('financial-entries')
export class FinancialEntriesController {
  constructor(private readonly service: FinancialEntriesService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query() query: FindAllFinancialEntriesQuery) {
    return this.service.findAll(companyId, query);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post()
  create(
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFinancialEntryDto,
  ) {
    return this.service.create(companyId, user.id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch(':id')
  update(
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialEntryDto,
  ) {
    return this.service.update(companyId, user.id, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post(':id/pay')
  pay(
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayFinancialEntryDto,
  ) {
    return this.service.pay(companyId, user.id, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post(':id/unpay')
  unpay(
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.unpay(companyId, user.id, id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Delete('installment-group/:installmentGroupId')
  removeInstallmentGroup(
    @CompanyId() companyId: string,
    @Param('installmentGroupId') installmentGroupId: string,
  ) {
    return this.service.removeInstallmentGroup(companyId, installmentGroupId);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Delete(':id')
  remove(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(companyId, id);
  }
}
