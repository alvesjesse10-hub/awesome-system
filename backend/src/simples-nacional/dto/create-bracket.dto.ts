import { IsDateString, IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { SimplesAnnex } from '@prisma/client';

export class CreateBracketDto {
  @IsEnum(SimplesAnnex)
  annex!: SimplesAnnex;

  @IsInt()
  @Min(1)
  bracketOrder!: number;

  @IsNumber()
  @Min(0)
  revenueFrom!: number;

  @IsNumber()
  @Min(0)
  revenueTo!: number;

  /** Fração decimal, ex.: 0.06 para 6%. */
  @IsNumber()
  @Min(0)
  nominalRate!: number;

  @IsNumber()
  @Min(0)
  deduction!: number;

  @IsDateString()
  effectiveFrom!: string;
}
