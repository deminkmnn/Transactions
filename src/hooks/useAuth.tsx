import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { authApi, authEvents } from '../services/api';
import { tokenStorage } from '../storage/tokenStorage';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>('loading');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setState((prev) => (prev === 'loading' ? 'unauthenticated' : prev));
    }, 3000);

    tokenStorage.getAccess()
      .then((token) => {
        setState(token ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        setState('unauthenticated');
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const unsub = authEvents.on('logout', () => setState('unauthenticated'));
    return () => {
      unsub();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    await tokenStorage.save(tokens.accessToken, tokens.refreshToken);
    Alert.alert('Успіх', 'Вхід виконано успішно.');
    setState('authenticated');
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.register(email, password);
    await tokenStorage.save(tokens.accessToken, tokens.refreshToken);
    Alert.alert('Акаунт створено', 'Реєстрація пройшла успішно.');
    setState('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server-side logout fails, local logout should still complete.
    }
    await tokenStorage.clear();
    setState('unauthenticated');
    Alert.alert('Вихід виконано', 'Ви вийшли з акаунта.');
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    state,
    login,
    register,
    logout,
  }), [state, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
