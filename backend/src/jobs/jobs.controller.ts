import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateFunnelStageDto } from './dto/update-funnel-stage.dto';
import { FindAllJobsQuery } from './dto/find-all-jobs.query';
import { GenerateJobEntryDto } from './dto/generate-job-entry.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyAccessGuard } from '../auth/guards/company-access.guard';
import { AuthenticatedUser } from '../auth/types';

@UseGuards(CompanyAccessGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query() query: FindAllJobsQuery) {
    return this.service.findAll(companyId, query);
  }

  @Get('pipeline')
  pipeline(@CompanyId() companyId: string) {
    return this.service.pipeline(companyId);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(companyId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @Post()
  create(@CompanyId() companyId: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobDto) {
    return this.service.create(companyId, user.id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @Patch(':id')
  update(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJobDto) {
    return this.service.update(companyId, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @Patch(':id/stage')
  updateStage(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFunnelStageDto,
  ) {
    return this.service.updateFunnelStage(companyId, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post(':id/generate-entry')
  generateEntry(
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateJobEntryDto,
  ) {
    return this.service.generateEntry(companyId, user.id, id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.COMERCIAL)
  @Delete(':id')
  remove(@CompanyId() companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(companyId, id);
  }
}
