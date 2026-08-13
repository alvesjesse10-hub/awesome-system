import { IsString, MinLength } from 'class-validator';

export class CreateCostCenterDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
