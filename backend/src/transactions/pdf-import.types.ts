import { TransactionCategory, TransactionType } from './entities/transaction.entity';

export interface ParsedPdfTransaction {
  externalId: string;
  cardNumber: string;
  type: TransactionType;
  amount: number;
  currency: string;
  balance: number;
  description: string;
  category: TransactionCategory;
  transactionDate: Date;
  operationCurrency: string;
  operationAmount: number;
  commission: number;
  discount: number;
}

export interface PdfImportPreview {
  accountId: string;
  fileName: string;
  totalParsed: number;
  duplicateCount: number;
  newCount: number;
  period: string | null;
  transactions: ParsedPdfTransaction[];
}
