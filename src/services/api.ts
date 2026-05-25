import axios from 'axios';
import { Transaction, Account, MonthlyStats, YearlyStats, PaginatedResponse, TransactionCategory } from '../types';

// Змінити на IP свого сервера (не localhost для реального пристрою)
const BASE_URL = 'http://192.168.1.100:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionQuery {
  startDate?: string;
  endDate?: string;
  type?: 'debit' | 'credit';
  category?: TransactionCategory;
  cardNumber?: string;
  limit?: number;
  offset?: number;
}

export const transactionsApi = {
  getAll: (params: TransactionQuery = {}): Promise<PaginatedResponse<Transaction>> =>
    api.get('/transactions', { params }).then(r => r.data),

  getOne: (id: string): Promise<Transaction> =>
    api.get(`/transactions/${id}`).then(r => r.data),

  getBalance: (cardNumber?: string): Promise<{ balance: number; currency: string }> =>
    api.get('/transactions/balance', { params: { cardNumber } }).then(r => r.data),

  getMonthlyStats: (year: number, month: number): Promise<MonthlyStats> =>
    api.get(`/transactions/stats/monthly/${year}/${month}`).then(r => r.data),

  getYearlyStats: (year: number): Promise<YearlyStats> =>
    api.get(`/transactions/stats/yearly/${year}`).then(r => r.data),

  updateCategory: (id: string, category: TransactionCategory, note?: string): Promise<Transaction> =>
    api.patch(`/transactions/${id}`, { category, note }).then(r => r.data),
};

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accountsApi = {
  getAll: (): Promise<Account[]> =>
    api.get('/accounts').then(r => r.data),

  getOne: (id: string): Promise<Account> =>
    api.get(`/accounts/${id}`).then(r => r.data),

  create: (data: { cardNumber: string; alias?: string; type?: string }): Promise<Account> =>
    api.post('/accounts', data).then(r => r.data),

  update: (id: string, data: { alias?: string; isActive?: boolean }): Promise<Account> =>
    api.patch(`/accounts/${id}`, data).then(r => r.data),

  refreshBalance: (id: string): Promise<Account> =>
    api.post(`/accounts/${id}/refresh-balance`).then(r => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/accounts/${id}`).then(r => r.data),
};

// ─── Sync ─────────────────────────────────────────────────────────────────────

export const syncApi = {
  syncNow: (days = 1): Promise<{ synced: number; daysBack: number }> =>
    api.post('/privatbank/sync', null, { params: { days } }).then(r => r.data),
};
