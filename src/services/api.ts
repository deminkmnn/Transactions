import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import {
  Account,
  MonthlyStats,
  PaginatedResponse,
  PdfImportPreview,
  PdfImportResult,
  Transaction,
  TransactionCategory,
  YearlyStats,
} from '../types';

let apiBaseUrl = 'http://192.168.0.2:3001/api/v1';

const withBaseUrl = (path: string) => `${apiBaseUrl}${path}`;

export function setApiBaseUrl(nextUrl: string) {
  apiBaseUrl = nextUrl.replace(/\/+$/, '');
  api.defaults.baseURL = apiBaseUrl;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: string) => void; reject: (error: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((pending) => (error ? pending.reject(error) : pending.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefresh();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(withBaseUrl('/auth/refresh'), { refreshToken });
        await tokenStorage.save(data.accessToken, data.refreshToken);

        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clear();
        authEvents.emit('logout');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

type Listener = () => void;
const authEvents = {
  listeners: new Set<Listener>(),
  emit(event: 'logout') {
    if (event === 'logout') this.listeners.forEach((listener) => listener());
  },
  on(event: 'logout', fn: Listener) {
    if (event === 'logout') this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
};

export { authEvents };

export const appApi = {
  health: () =>
    axios.get<{ ok: boolean; timestamp: string }>(withBaseUrl('/health')).then((response) => response.data),
};

export const authApi = {
  register: (email: string, password: string) =>
    axios.post<{ accessToken: string; refreshToken: string }>(
      withBaseUrl('/auth/register'),
      { email, password },
    ).then((response) => response.data),

  login: (email: string, password: string) =>
    axios.post<{ accessToken: string; refreshToken: string }>(
      withBaseUrl('/auth/login'),
      { email, password },
    ).then((response) => response.data),

  logout: () =>
    api.post('/auth/logout').then((response) => response.data),
};

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
    api.get('/transactions', { params }).then((response) => response.data),

  getOne: (id: string): Promise<Transaction> =>
    api.get(`/transactions/${id}`).then((response) => response.data),

  getBalance: (cardNumber?: string): Promise<{ balance: number; currency: string }> =>
    api.get('/transactions/balance', { params: { cardNumber } }).then((response) => response.data),

  getMonthlyStats: (year: number, month: number): Promise<MonthlyStats> =>
    api.get(`/transactions/stats/monthly/${year}/${month}`).then((response) => response.data),

  getYearlyStats: (year: number): Promise<YearlyStats> =>
    api.get(`/transactions/stats/yearly/${year}`).then((response) => response.data),

  updateCategory: (id: string, category: TransactionCategory, note?: string): Promise<Transaction> =>
    api.patch(`/transactions/${id}`, { category, note }).then((response) => response.data),
};

export const accountsApi = {
  getAll: (): Promise<Account[]> =>
    api.get('/accounts').then((response) => response.data),

  getOne: (id: string): Promise<Account> =>
    api.get(`/accounts/${id}`).then((response) => response.data),

  create: (data: { cardNumber: string; alias?: string; type?: string; apiToken?: string }): Promise<Account> =>
    api.post('/accounts', data).then((response) => response.data),

  update: (id: string, data: { alias?: string; isActive?: boolean }): Promise<Account> =>
    api.patch(`/accounts/${id}`, data).then((response) => response.data),

  refreshBalance: (id: string): Promise<Account> =>
    api.post(`/accounts/${id}/refresh-balance`).then((response) => response.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/accounts/${id}`).then((response) => response.data),
};

export const syncApi = {
  syncNow: (days = 1): Promise<{ synced: number; daysBack: number }> =>
    api.post('/privatbank/sync', null, { params: { days } }).then((response) => response.data),
};

const buildPdfFormData = (file: { uri: string; name: string; mimeType?: string }) => {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/pdf',
  } as any);
  return form;
};

export const pdfImportApi = {
  preview: (accountId: string, file: { uri: string; name: string; mimeType?: string }): Promise<PdfImportPreview> =>
    api.post(`/transactions/import/pdf/preview/${accountId}`, buildPdfFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((response) => response.data),

  import: (accountId: string, file: { uri: string; name: string; mimeType?: string }): Promise<PdfImportResult> =>
    api.post(`/transactions/import/pdf/${accountId}`, buildPdfFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((response) => response.data),
};
