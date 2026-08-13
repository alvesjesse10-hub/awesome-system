import { Module } from '@nestjs/common';
import { RevenueGoalsService } from './revenue-goals.service';
import { RevenueGoalsController } from './revenue-goals.controller';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [RevenueGoalsController],
  providers: [RevenueGoalsService],
})
export class RevenueGoalsModule {}
