import { IsInt, IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class CreateRevenueProjectionDto {
  @IsUUID()
  chartOfAccountId!: string;

  @IsInt()
  @Min(2000)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsNumber()
  @IsPositive()
  projectedAmount!: number;
}
