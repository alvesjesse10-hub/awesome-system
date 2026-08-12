import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ChartAccountGroup } from '@prisma/client';

export class CreateChartOfAccountDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(ChartAccountGroup)
  group!: ChartAccountGroup;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
