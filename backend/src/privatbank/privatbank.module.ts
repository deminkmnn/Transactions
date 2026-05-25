import { Module } from '@nestjs/common';
import { PrivatbankService } from './privatbank.service';
import { PrivatbankController } from './privatbank.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [AccountsModule, TransactionsModule],
  providers: [PrivatbankService],
  controllers: [PrivatbankController],
})
export class PrivatbankModule {}
