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
  ],
})
export class AppModule {}
