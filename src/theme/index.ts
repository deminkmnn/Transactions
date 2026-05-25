import { TransactionCategory } from '../types';

export const colors = {
  // Фон
  bg: '#0F0F14',
  bgCard: '#1A1A24',
  bgInput: '#22222F',

  // Акценти
  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',

  // Текст
  textPrimary: '#F0F0F8',
  textSecondary: '#9090A8',
  textMuted: '#5A5A72',

  // Межі
  border: '#2A2A3C',
  borderLight: '#333348',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: '500' as const, color: colors.textMuted },
};

// Іконки та кольори категорій
export const categoryMeta: Record<
  TransactionCategory,
  { label: string; icon: string; color: string }
> = {
  food:          { label: 'Продукти',    icon: '🛒', color: '#4ADE80' },
  cafe:          { label: 'Кафе',        icon: '☕', color: '#FB923C' },
  transport:     { label: 'Транспорт',   icon: '🚌', color: '#38BDF8' },
  fuel:          { label: 'Пальне',      icon: '⛽', color: '#F59E0B' },
  health:        { label: 'Здоров\'я',   icon: '💊', color: '#F472B6' },
  shopping:      { label: 'Шопінг',      icon: '🛍️', color: '#A78BFA' },
  utilities:     { label: 'Комуналка',   icon: '💡', color: '#94A3B8' },
  entertainment: { label: 'Розваги',     icon: '🎬', color: '#FB7185' },
  education:     { label: 'Освіта',      icon: '📚', color: '#6EE7B7' },
  travel:        { label: 'Подорожі',    icon: '✈️', color: '#67E8F9' },
  income:        { label: 'Дохід',       icon: '💰', color: '#4ADE80' },
  transfer:      { label: 'Переказ',     icon: '🔄', color: '#94A3B8' },
  other:         { label: 'Інше',        icon: '📌', color: '#6B7280' },
};
