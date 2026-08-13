import { IsEnum, IsOptional } from 'class-validator';
import { EntryNature } from '@prisma/client';
import { FormatQuery } from './format.query';

export class AccountsPayableQuery extends FormatQuery {
  @IsOptional()
  @IsEnum(EntryNature)
  nature?: EntryNature;
}
