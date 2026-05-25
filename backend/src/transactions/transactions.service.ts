import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { Transaction, TransactionCategory } from './entities/transaction.entity';
import { PdfImportService } from './pdf-import.service';
import { PdfImportPreview } from './pdf-import.types';

export interface TransactionQuery {
  startDate?: string;
  endDate?: string;
  type?: 'debit' | 'credit';
  category?: TransactionCategory;
  cardNumber?: string;
  limit?: number;
  offset?: number;
}

export interface UpsertTransactionDto {
  cardNumber: string;
  externalId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency?: string;
  balance?: number;
  description: string;
  mcc?: number | null;
  category?: TransactionCategory;
  transactionDate: Date;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>,
    private readonly accounts: AccountsService,
    private readonly pdfImport: PdfImportService,
  ) {}

  // Перевіряємо що транзакція належить юзеру через JOIN на accounts
  private baseQuery(userId: string) {
    return this.repo
      .createQueryBuilder('t')
      .innerJoin('accounts', 'a', 'a.cardNumber = t.cardNumber AND a.userId = :userId', { userId });
  }

  async findAll(query: TransactionQuery, userId: string) {
    const qb = this.baseQuery(userId).select('t');

    if (query.cardNumber) qb.andWhere('t.cardNumber = :card', { card: query.cardNumber });
    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.category) qb.andWhere('t.category = :cat', { cat: query.category });

    if (query.startDate || query.endDate) {
      const from = query.startDate ? new Date(query.startDate) : new Date('2000-01-01');
      const to = query.endDate ? new Date(query.endDate) : new Date();
      to.setHours(23, 59, 59, 999);
      qb.andWhere('t.transactionDate BETWEEN :from AND :to', { from, to });
    }

    const limit = Math.min(Number(query.limit) || 30, 200);
    const offset = Number(query.offset) || 0;

    qb.orderBy('t.transactionDate', 'DESC').take(limit).skip(offset);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const tx = await this.baseQuery(userId)
      .select('t')
      .andWhere('t.id = :id', { id })
      .getOne();
    if (!tx) throw new NotFoundException(`Transaction not found`);
    return tx;
  }

  async getBalance(userId: string, cardNumber?: string) {
    const qb = this.baseQuery(userId).select('t');
    if (cardNumber) qb.andWhere('t.cardNumber = :cardNumber', { cardNumber });

    const last = await qb.orderBy('t.transactionDate', 'DESC').limit(1).getOne();
    return { balance: last?.balance ?? 0, currency: last?.currency ?? 'UAH' };
  }

  async getMonthlyStats(year: number, month: number, userId: string) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const txs = await this.baseQuery(userId)
      .select('t')
      .andWhere('t.transactionDate BETWEEN :from AND :to', { from, to })
      .getMany();

    const totalIncome = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);

    const byCategory: Partial<Record<TransactionCategory, number>> = {};
    for (const tx of txs.filter((t) => t.type === 'debit')) {
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + Number(tx.amount);
    }

    const topExpense = txs
      .filter((t) => t.type === 'debit')
      .sort((a, b) => Number(b.amount) - Number(a.amount))[0] ?? null;

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      totalIncome,
      totalExpenses,
      transactionCount: txs.length,
      byCategory,
      topExpense: topExpense
        ? { description: topExpense.description, amount: Number(topExpense.amount) }
        : null,
    };
  }

  async getYearlyStats(year: number, userId: string) {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const txs = await this.baseQuery(userId)
      .select('t')
      .andWhere('t.transactionDate BETWEEN :from AND :to', { from, to })
      .getMany();

    const monthMap: Record<number, { income: number; expenses: number }> = {};
    for (let m = 1; m <= 12; m++) monthMap[m] = { income: 0, expenses: 0 };

    for (const tx of txs) {
      const m = new Date(tx.transactionDate).getMonth() + 1;
      if (tx.type === 'credit') monthMap[m].income += Number(tx.amount);
      else monthMap[m].expenses += Number(tx.amount);
    }

    const months = Object.entries(monthMap).map(([month, data]) => ({ month: Number(month), ...data }));
    return {
      year,
      months,
      totalIncome: months.reduce((s, m) => s + m.income, 0),
      totalExpenses: months.reduce((s, m) => s + m.expenses, 0),
    };
  }

  async updateCategory(id: string, category: TransactionCategory, note: string | undefined, userId: string): Promise<Transaction> {
    const tx = await this.findOne(id, userId);
    tx.category = category;
    tx.categoryEditedByUser = true;
    if (note !== undefined) tx.note = note;
    return this.repo.save(tx);
  }

  async upsertMany(dtos: UpsertTransactionDto[]): Promise<number> {
    if (!dtos.length) return 0;
    let inserted = 0;
    for (const dto of dtos) {
      const exists = await this.repo.findOne({ where: { externalId: dto.externalId } });
      if (exists) continue;
      const tx = this.repo.create({
        ...dto,
        balance: dto.balance ?? 0,
        currency: dto.currency ?? 'UAH',
        category: dto.category ?? 'other',
        note: null,
        categoryEditedByUser: false,
      });
      await this.repo.save(tx);
      inserted++;
    }
    return inserted;
  }

  async previewPdfImport(accountId: string, fileName: string, buffer: Buffer, userId: string): Promise<PdfImportPreview> {
    const account = await this.accounts.findOne(accountId, userId);
    const parsed = await this.pdfImport.parse(buffer, account);

    const externalIds = parsed.transactions.map((transaction) => transaction.externalId);
    const existing = externalIds.length
      ? await this.repo.find({
          where: { externalId: In(externalIds) },
          select: { externalId: true } as any,
        })
      : [];

    const duplicateIds = new Set(existing.map((transaction) => transaction.externalId));
    const newTransactions = parsed.transactions.filter((transaction) => !duplicateIds.has(transaction.externalId));

    return {
      accountId,
      fileName,
      period: parsed.period,
      totalParsed: parsed.transactions.length,
      duplicateCount: parsed.transactions.length - newTransactions.length,
      newCount: newTransactions.length,
      transactions: newTransactions,
    };
  }

  async importPdf(accountId: string, fileName: string, buffer: Buffer, userId: string) {
    const preview = await this.previewPdfImport(accountId, fileName, buffer, userId);
    const inserted = await this.upsertMany(preview.transactions.map((transaction) => ({
      cardNumber: transaction.cardNumber,
      externalId: transaction.externalId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      balance: transaction.balance,
      description: transaction.description,
      category: transaction.category,
      transactionDate: transaction.transactionDate,
      mcc: null,
    })));

    return {
      fileName: preview.fileName,
      period: preview.period,
      totalParsed: preview.totalParsed,
      imported: inserted,
      skipped: preview.totalParsed - inserted,
    };
  }
}
