import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { UserRole } from '@prisma/client';
import { RevenueProjectionsService } from './revenue-projections.service';
import { CreateRevenueProjectionDto } from './dto/create-revenue-projection.dto';
import { UpdateRevenueProjectionDto } from './dto/update-revenue-projection.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-context.decorator';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';

class YearQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}

class ComparisonQuery {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;
}

@UseGuards(CompanyAccessGuard)
@Controller('revenue-projections')
export class RevenueProjectionsController {
  constructor(private readonly service: RevenueProjectionsService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query() query: YearQuery) {
    return this.service.findAll(companyId, query.year);
  }

  @Get('comparison')
  comparison(@CompanyId() companyId: string, @Query() query: ComparisonQuery) {
    return this.service.comparison(companyId, query.year);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateRevenueProjectionDto) {
    return this.service.create(companyId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRevenueProjectionDto) {
    return this.service.update(companyId, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Delete(':id')
  remove(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(companyId, id);
  }
}
