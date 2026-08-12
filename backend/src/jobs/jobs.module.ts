import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { FinancialEntriesModule } from '../financial-entries/financial-entries.module';

@Module({
  imports: [FinancialEntriesModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
