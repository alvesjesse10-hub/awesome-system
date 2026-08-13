import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class GenerateJobEntryDto {
  @IsUUID()
  costCenterId!: string;

  /** Categoria do plano de contas (deve ser do grupo RECEITA). */
  @IsUUID()
  chartOfAccountId!: string;

  @IsDateString()
  entryDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(360)
  installments?: number;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
