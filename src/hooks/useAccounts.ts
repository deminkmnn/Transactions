import { useState, useEffect, useCallback } from 'react';
import { accountsApi, syncApi } from '../services/api';
import { Account } from '../types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountsApi.getAll();
      setAccounts(data);
    } catch (e: any) {
      setError(e.message ?? 'Помилка');
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async (days = 1) => {
    setSyncing(true);
    try {
      const res = await syncApi.syncNow(days);
      await fetch(); // оновити баланси після синку
      return res;
    } finally {
      setSyncing(false);
    }
  }, [fetch]);

  const refreshBalance = useCallback(async (id: string) => {
    const updated = await accountsApi.refreshBalance(id);
    setAccounts(prev => prev.map(a => a.id === id ? updated : a));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { accounts, loading, syncing, error, refetch: fetch, sync, refreshBalance };
}
