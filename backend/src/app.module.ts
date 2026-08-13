import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChartOfAccountsModule } from './chart-of-accounts/chart-of-accounts.module';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { ClientsModule } from './clients/clients.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { EmployeesModule } from './employees/employees.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { AccountTransfersModule } from './account-transfers/account-transfers.module';
import { FinancialEntriesModule } from './financial-entries/financial-entries.module';
import { JobsModule } from './jobs/jobs.module';
import { ReportsModule } from './reports/reports.module';
import { RevenueGoalsModule } from './revenue-goals/revenue-goals.module';
import { RevenueProjectionsModule } from './revenue-projections/revenue-projections.module';
import { SimplesNacionalModule } from './simples-nacional/simples-nacional.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    AuthModule,
    ChartOfAccountsModule,
    CostCentersModule,
    ClientsModule,
    SuppliersModule,
    EmployeesModule,
    BankAccountsModule,
    AccountTransfersModule,
    FinancialEntriesModule,
    JobsModule,
    ReportsModule,
    RevenueGoalsModule,
    RevenueProjectionsModule,
    SimplesNacionalModule,
  ],
})
export class AppModule {}
