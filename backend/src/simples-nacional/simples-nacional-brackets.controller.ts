import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { SimplesAnnex, UserRole } from '@prisma/client';
import { SimplesNacionalService } from './simples-nacional.service';
import { CreateBracketDto } from './dto/create-bracket.dto';
import { UpdateBracketDto } from './dto/update-bracket.dto';
import { Roles } from '../common/decorators/roles.decorator';

class FindAllBracketsQuery {
  @IsOptional()
  @IsEnum(SimplesAnnex)
  annex?: SimplesAnnex;
}

// Faixas do Simples Nacional são compartilhadas entre as empresas do grupo
// (igual ao plano de contas): sem CompanyAccessGuard.
@Controller('simples-nacional/brackets')
export class SimplesNacionalBracketsController {
  constructor(private readonly service: SimplesNacionalService) {}

  @Get()
  findAll(@Query() query: FindAllBracketsQuery) {
    return this.service.findAllBrackets(query.annex);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post()
  create(@Body() dto: CreateBracketDto) {
    return this.service.createBracket(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBracketDto) {
    return this.service.updateBracket(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeBracket(id);
  }
}
