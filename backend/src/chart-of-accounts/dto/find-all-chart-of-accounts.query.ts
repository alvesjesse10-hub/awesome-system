import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChartAccountGroup } from '@prisma/client';

export class FindAllChartOfAccountsQuery {
  @IsOptional()
  @IsEnum(ChartAccountGroup)
  group?: ChartAccountGroup;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeInactive?: boolean;
}
