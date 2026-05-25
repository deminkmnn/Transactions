import { useState, useEffect, useCallback } from 'react';
import { transactionsApi, TransactionQuery } from '../services/api';
import { Transaction, MonthlyStats, YearlyStats } from '../types';

export function useTransactions(query: TransactionQuery = {}) {
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionsApi.getAll(query);
      setData(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message ?? 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(query)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

export function useMonthlyStats(year: number, month: number) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    transactionsApi
      .getMonthlyStats(year, month)
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, month]);

  return { stats, loading, error };
}

export function useYearlyStats(year: number) {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi
      .getYearlyStats(year)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [year]);

  return { stats, loading };
}
