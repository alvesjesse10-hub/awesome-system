import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-context.decorator';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';

@UseGuards(CompanyAccessGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query('search') search?: string) {
    return this.service.findAll(companyId, search);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO, UserRole.COMERCIAL)
  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateClientDto) {
    return this.service.create(companyId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO, UserRole.COMERCIAL)
  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(companyId, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO, UserRole.COMERCIAL)
  @Delete(':id')
  remove(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(companyId, id);
  }
}
