import { Module } from '@nestjs/common';
import { FinancialEntriesService } from './financial-entries.service';
import { FinancialEntriesController } from './financial-entries.controller';

@Module({
  controllers: [FinancialEntriesController],
  providers: [FinancialEntriesService],
  exports: [FinancialEntriesService],
})
export class FinancialEntriesModule {}
