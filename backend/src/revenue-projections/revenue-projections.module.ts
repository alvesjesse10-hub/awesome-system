import { Module } from '@nestjs/common';
import { RevenueProjectionsService } from './revenue-projections.service';
import { RevenueProjectionsController } from './revenue-projections.controller';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [RevenueProjectionsController],
  providers: [RevenueProjectionsService],
})
export class RevenueProjectionsModule {}
