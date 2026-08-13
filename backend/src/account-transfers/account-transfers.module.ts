import { Module } from '@nestjs/common';
import { AccountTransfersService } from './account-transfers.service';
import { AccountTransfersController } from './account-transfers.controller';

@Module({
  controllers: [AccountTransfersController],
  providers: [AccountTransfersService],
})
export class AccountTransfersModule {}
