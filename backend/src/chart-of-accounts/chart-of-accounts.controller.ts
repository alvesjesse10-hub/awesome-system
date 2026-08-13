import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { FindAllChartOfAccountsQuery } from './dto/find-all-chart-of-accounts.query';
import { Roles } from '../common/decorators/roles.decorator';

// Plano de contas é compartilhado entre todas as empresas do grupo, por
// isso este controller NÃO usa CompanyAccessGuard (não há empresa ativa).
@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly service: ChartOfAccountsService) {}

  @Get()
  findAll(@Query() query: FindAllChartOfAccountsQuery) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post()
  create(@Body() dto: CreateChartOfAccountDto) {
    return this.service.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChartOfAccountDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
