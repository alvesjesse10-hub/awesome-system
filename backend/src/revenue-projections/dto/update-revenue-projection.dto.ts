import { IsNumber, IsPositive } from 'class-validator';

export class UpdateRevenueProjectionDto {
  @IsNumber()
  @IsPositive()
  projectedAmount!: number;
}
