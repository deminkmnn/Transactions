import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setApiBaseUrl } from '../services/api';

interface AppSettings {
  language: 'en' | 'uk';
  currency: 'UAH' | 'USD' | 'EUR';
  backendUrl: string;
  hideBalance: boolean; // <--- ДОДАЛИ ПАМ'ЯТЬ ДЛЯ БАЛАНСУ
}

const defaultSettings: AppSettings = {
  language: 'en',
  currency: 'UAH',
  backendUrl: 'http://192.168.0.2:3001/api/v1',
  hideBalance: false, // За замовчуванням відкритий
};

const DICTIONARY = {
  en: {
    Settings: 'Settings',
    Preferences: 'Preferences',
    Language: 'Language',
    BaseCurrency: 'Base Currency',
    Server: 'Server',
    BackendURL: 'Backend URL',
    TestConnection: 'Test Connection',
    Data: 'Data',
    ImportPDF: 'Import PDF Statement',
    ResetSettings: 'Reset App Settings',
    Account: 'Account',
    SignOut: 'Sign Out',
    Checking: 'Checking...',
    TapToVerify: 'Tap to verify',
    TapToUpload: 'Tap to upload',
    SelectLanguage: 'Select Language',
    SelectCurrency: 'Select Base Currency',
    Cancel: 'Cancel',
    Save: 'Save',
    MyFinances: 'My Finances',
    RecentTransactions: 'Recent Transactions',
    NoTransactions: 'No transactions yet',
    MyCards: 'My Cards',
    Add: '+ Add',
    NoCards: 'No cards added.\nTap "+ Add"',
    NewCard: 'New Card',
    CardNumber: 'Card Number',
    AliasOptional: 'Alias (Optional)',
    BankApiOptional: 'Bank API Token (Optional)',
    Balance: 'Balance',
    Sync7Days: 'Sync 7 Days',
    Delete: 'Delete',
    Statistics: 'Statistics',
    Income: 'Income',
    Expenses: 'Expenses',
    ByCategory: 'By Category',
    LargestExpense: 'Largest Expense of the Month',
    ExpensesYearly: 'Expenses',
    All: 'All',
    ExpensesFilter: '↓ Expenses',
    IncomeFilter: '↑ Income',
    NothingFound: 'Nothing found',
    TransactionDetails: 'Transaction Details',
    Amount: 'Amount',
    Type: 'Type',
    Category: 'Category',
    Date: 'Date',
    Note: 'Note',
    SaveNote: 'Save Note',
    SyncBtn: '🔄 Synchronize',
  },
  uk: {
    Settings: 'Налаштування',
    Preferences: 'Основні',
    Language: 'Мова',
    BaseCurrency: 'Валюта',
    Server: 'Сервер',
    BackendURL: 'URL Сервера',
    TestConnection: 'Перевірити зв\'язок',
    Data: 'Дані',
    ImportPDF: 'Імпортувати PDF виписку',
    ResetSettings: 'Скинути налаштування',
    Account: 'Профіль',
    SignOut: 'Вийти',
    Checking: 'Перевірка...',
    TapToVerify: 'Натисніть для перевірки',
    TapToUpload: 'Натисніть для завантаження',
    SelectLanguage: 'Оберіть мову',
    SelectCurrency: 'Оберіть валюту',
    Cancel: 'Скасувати',
    Save: 'Зберегти',
    MyFinances: 'Мої Фінанси',
    RecentTransactions: 'Останні Транзакції',
    NoTransactions: 'Транзакцій ще немає',
    MyCards: 'Мої Картки',
    Add: '+ Додати',
    NoCards: 'Картки не додано.\nНатисніть "+ Додати"',
    NewCard: 'Нова Картка',
    CardNumber: 'Номер картки',
    AliasOptional: 'Назва (необов\'язково)',
    BankApiOptional: 'API Токен Банку (необов\'язково)',
    Balance: 'Баланс',
    Sync7Days: 'Синхронізувати 7 днів',
    Delete: 'Видалити',
    Statistics: 'Статистика',
    Income: 'Доходи',
    Expenses: 'Витрати',
    ByCategory: 'За Категоріями',
    LargestExpense: 'Найбільша витрата місяця',
    ExpensesYearly: 'Витрати за',
    All: 'Всі',
    ExpensesFilter: '↓ Витрати',
    IncomeFilter: '↑ Доходи',
    NothingFound: 'Нічого не знайдено',
    TransactionDetails: 'Деталі Транзакції',
    Amount: 'Сума',
    Type: 'Тип',
    Category: 'Категорія',
    Date: 'Дата',
    Note: 'Примітка',
    SaveNote: 'Зберегти примітку',
    SyncBtn: '🔄 Синхронізувати',
  }
};

const EXCHANGE_RATES = { UAH: 1, USD: 40.0, EUR: 43.5 };
const SYMBOLS = { UAH: '₴', USD: '$', EUR: '€' };

interface AppSettingsContextType {
  settings: AppSettings;
  updateLanguage: (lang: 'en' | 'uk') => Promise<void>;
  updateCurrency: (cur: 'UAH' | 'USD' | 'EUR') => Promise<void>;
  updateBackendUrl: (url: string) => Promise<void>;
  resetSettings: () => Promise<void>;
  toggleHideBalance: () => Promise<void>; // <--- ДОДАЛИ ФУНКЦІЮ
  loading: boolean;
  t: (key: keyof typeof DICTIONARY['en']) => string;
  convertAmount: (amountInUah: number) => number;
  currencySymbol: string;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('app_settings').then(saved => {
      if (saved) {
        const parsed = JSON.parse(saved);
        // Додаємо fallback, якщо у старих налаштуваннях не було hideBalance
        if (parsed.hideBalance === undefined) parsed.hideBalance = false;
        
        setSettings(parsed);
        setApiBaseUrl(parsed.backendUrl || defaultSettings.backendUrl);
      } else {
        setApiBaseUrl(defaultSettings.backendUrl);
      }
      setLoading(false);
    });
  }, []);

  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const updateLanguage = async (lang: 'en' | 'uk') => saveSettings({ ...settings, language: lang });
  const updateCurrency = async (cur: 'UAH' | 'USD' | 'EUR') => saveSettings({ ...settings, currency: cur });
  const updateBackendUrl = async (url: string) => { setApiBaseUrl(url); saveSettings({ ...settings, backendUrl: url }); };
  const resetSettings = async () => { setApiBaseUrl(defaultSettings.backendUrl); saveSettings(defaultSettings); };
  
  // Функція яка перемикає і зберігає стан приховування балансу
  const toggleHideBalance = async () => saveSettings({ ...settings, hideBalance: !settings.hideBalance });

  const t = (key: keyof typeof DICTIONARY['en']) => DICTIONARY[settings.language][key] || key;
  const convertAmount = (amountInUah: number) => amountInUah / EXCHANGE_RATES[settings.currency];
  const currencySymbol = SYMBOLS[settings.currency];

  return (
    <AppSettingsContext.Provider value={{ 
      settings, updateLanguage, updateCurrency, updateBackendUrl, resetSettings, 
      toggleHideBalance, loading, t, convertAmount, currencySymbol 
    }}>
      {!loading && children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return context;
};