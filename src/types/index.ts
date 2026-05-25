export type TransactionType = 'debit' | 'credit';

export type TransactionCategory =
  | 'food' | 'transport' | 'entertainment' | 'health'
  | 'utilities' | 'shopping' | 'income' | 'transfer'
  | 'cafe' | 'fuel' | 'education' | 'travel' | 'other';

export interface Transaction {
  id: string;
  cardNumber: string;
  externalId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  balance: number;
  description: string;
  note?: string;
  category: TransactionCategory;
  mcc?: number;
  categoryEditedByUser: boolean;
  transactionDate: string;
  createdAt: string;
}

export interface Account {
  id: string;
  cardNumber: string;
  alias: string;
  type: 'personal' | 'fop';
  balance: number;
  currency: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

export interface MonthlyStats {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  byCategory: Partial<Record<TransactionCategory, number>>;
  topExpense: { description: string; amount: number } | null;
}

export interface YearlyStats {
  year: number;
  months: { month: number; income: number; expenses: number }[];
  totalIncome: number;
  totalExpenses: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
