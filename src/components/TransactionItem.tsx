import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { Transaction } from '../types';
import { colors, spacing, radius, typography, categoryMeta } from '../theme';
import { useAppSettings } from '../hooks/useAppSettings'; // <--- Імпортуємо налаштування

interface Props {
  item: Transaction;
  onPress?: (tx: Transaction) => void;
}

export const TransactionItem: React.FC<Props> = ({ item, onPress }) => {
  // Дістаємо конвертер, символ валюти та мову
  const { settings, convertAmount, currencySymbol } = useAppSettings();

  const isDebit = item.type === 'debit';
  const meta = categoryMeta[item.category];
  const amountColor = isDebit ? colors.danger : colors.success;
  const sign = isDebit ? '−' : '+';

  // 1. Правильна мова для дат
  const dateLocale = settings.language === 'uk' ? uk : enUS;
  const date = format(new Date(item.transactionDate), 'd MMM, HH:mm', { locale: dateLocale });

  // 2. Конвертація суми по курсу
  const rawAmount = Number(item.amount || 0);
  const safeAmount = convertAmount(rawAmount).toFixed(2);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.description} numberOfLines={1}>
          {item.description || meta.label}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.right}>
        {/* Підставляємо конвертовану суму та динамічний символ ($/€/₴) */}
        <Text style={[styles.amount, { color: amountColor }]}>
          {sign}{safeAmount} {currencySymbol}
        </Text>
        {item.note ? (
          <Text style={styles.note} numberOfLines={1}>{item.note}</Text>
        ) : (
          <Text style={[styles.date, { textAlign: 'right' }]}>{meta.label}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  middle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  date: {
    ...typography.caption,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  note: {
    ...typography.small,
    color: colors.warning,
    maxWidth: 100,
  },
});