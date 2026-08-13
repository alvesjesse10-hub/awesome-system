import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { UserRole } from '@prisma/client';
import { SimplesNacionalService } from './simples-nacional.service';
import { CalculateDto } from './dto/calculate.dto';
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

@UseGuards(CompanyAccessGuard)
@Controller('simples-nacional')
export class SimplesNacionalController {
  constructor(private readonly service: SimplesNacionalService) {}

  @Get('snapshots')
  snapshots(@CompanyId() companyId: string, @Query() query: YearQuery) {
    return this.service.listSnapshots(companyId, query.year);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post('calculate')
  calculate(@CompanyId() companyId: string, @Body() dto: CalculateDto) {
    return this.service.calculateAndSave(companyId, dto.year, dto.month, dto.annex);
  }
}
