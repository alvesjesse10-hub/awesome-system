import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { SimplesAnnex } from '@prisma/client';

export class CalculateDto {
  @IsInt()
  @Min(2000)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsEnum(SimplesAnnex)
  annex!: SimplesAnnex;
}
