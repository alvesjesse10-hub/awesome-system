import { IsEmail, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  pixKey?: string;

  @IsString()
  @MinLength(2)
  role!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  baseSalary?: number;

  @IsOptional()
  @IsEnum(CommissionType)
  commissionType?: CommissionType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  commissionValue?: number;
}
