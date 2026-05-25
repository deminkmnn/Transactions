import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { Transaction } from './entities/transaction.entity';
import { PdfImportService } from './pdf-import.service';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), AccountsModule],
  providers: [TransactionsService, PdfImportService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
