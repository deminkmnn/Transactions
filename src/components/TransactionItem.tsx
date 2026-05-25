import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Transaction } from '../types';
import { colors, spacing, radius, typography, categoryMeta } from '../theme';

interface Props {
  item: Transaction;
  onPress?: (tx: Transaction) => void;
}

export const TransactionItem: React.FC<Props> = ({ item, onPress }) => {
  const isDebit = item.type === 'debit';
  const meta = categoryMeta[item.category];
  const amountColor = isDebit ? colors.danger : colors.success;
  const sign = isDebit ? '−' : '+';

  const date = format(new Date(item.transactionDate), 'd MMM, HH:mm', { locale: uk });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(item)}
      activeOpacity={0.75}
    >
      {/* Іконка категорії */}
      <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>

      {/* Опис + дата */}
      <View style={styles.middle}>
        <Text style={styles.description} numberOfLines={1}>
          {item.description || meta.label}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      {/* Сума */}
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {sign}{item.amount.toFixed(2)} ₴
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
