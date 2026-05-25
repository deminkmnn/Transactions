import { useState, useEffect, useCallback } from 'react';
import { transactionsApi } from '../services/api';
import { Transaction, TransactionCategory } from '../types';

interface UseTransactionsOptions {
  limit?: number;
  category?: TransactionCategory;
  type?: 'debit' | 'credit';
}

// 1. Хук для транзакцій (з нашою новою пагінацією!)
export const useTransactions = (options?: UseTransactionsOptions) => {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = options?.limit || 50;
  const category = options?.category;
  const type = options?.type;

  const fetchTransactions = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) setLoading(true);
      else setLoadingMore(true);

      const offset = (pageNum - 1) * limit;

      const res = await transactionsApi.getAll({
        limit,
        offset, 
        category,
        type,
      });

      if (isRefresh) {
        setData(res.data);
      } else {
        setData(prev => [...prev, ...res.data]);
      }

      setTotal(res.total);
      setHasMore(res.data.length === limit); 
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit, category, type]);

  useEffect(() => {
    setPage(1);
    fetchTransactions(1, true);
  }, [fetchTransactions]);

  const refetch = () => {
    setPage(1);
    return fetchTransactions(1, true);
  };

  const loadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, false);
  };

  return { data, total, loading, loadingMore, hasMore, refetch, loadMore };
};

// 2. ПОВЕРНУЛИ Хук для місячної статистики
export const useMonthlyStats = (year: number, month: number) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await transactionsApi.getMonthlyStats(year, month);
        if (isMounted) setStats(res);
      } catch (error) {
        console.error('Failed to fetch monthly stats:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchStats();
    
    return () => {
      isMounted = false;
    };
  }, [year, month]);

  return { stats, loading };
};

// 3. ПОВЕРНУЛИ Хук для річної статистики
export const useYearlyStats = (year: number) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await transactionsApi.getYearlyStats(year);
        if (isMounted) setStats(res);
      } catch (error) {
        console.error('Failed to fetch yearly stats:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchStats();
    
    return () => {
      isMounted = false;
    };
  }, [year]);

  return { stats, loading };
};