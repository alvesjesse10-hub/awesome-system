import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { BankAccountType } from '@prisma/client';

export class CreateBankAccountDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEnum(BankAccountType)
  type?: BankAccountType;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsNumber()
  initialBalance?: number;
}
