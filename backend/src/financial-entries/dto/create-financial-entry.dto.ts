import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateFinancialEntryDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsUUID()
  costCenterId!: string;

  @IsUUID()
  chartOfAccountId!: string;

  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsString()
  @MinLength(2)
  description!: string;

  /** Valor TOTAL do lançamento — se `installments` > 1, é dividido entre as parcelas. */
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(360)
  installments?: number;

  @IsDateString()
  entryDate!: string;

  /** Vencimento da 1ª parcela; as demais são geradas mensalmente a partir desta data. */
  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  situacao?: string;
}
