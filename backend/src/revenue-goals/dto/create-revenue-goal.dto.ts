import { IsInt, IsNumber, IsPositive, Max, Min } from 'class-validator';

export class CreateRevenueGoalDto {
  @IsInt()
  @Min(2000)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsNumber()
  @IsPositive()
  targetAmount!: number;
}
