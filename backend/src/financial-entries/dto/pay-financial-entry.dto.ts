import { IsDateString, IsUUID } from 'class-validator';

export class PayFinancialEntryDto {
  @IsDateString()
  paymentDate!: string;

  @IsUUID()
  bankAccountId!: string;
}
