import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateAccountTransferDto {
  @IsDateString()
  date!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsUUID()
  sourceAccountId!: string;

  @IsUUID()
  destinationAccountId!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
