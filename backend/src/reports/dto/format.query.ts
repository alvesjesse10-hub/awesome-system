import { IsIn, IsOptional } from 'class-validator';

/** Para relatórios sem período (ano/mês) mas que ainda aceitam ?format=csv|xlsx|pdf. */
export class FormatQuery {
  @IsOptional()
  @IsIn(['csv', 'xlsx', 'pdf'])
  format?: 'csv' | 'xlsx' | 'pdf';
}
