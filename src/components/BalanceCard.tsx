import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Account } from '../types';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  account: Account;
  onSync?: () => void;
  syncing?: boolean;
}

export const BalanceCard: React.FC<Props> = ({ account, onSync, syncing }) => {
  const maskedCard = `•••• ${account.cardNumber.slice(-4)}`;

  return (
    <View style={styles.card}>
      {/* Верхній рядок */}
      <View style={styles.row}>
        <Text style={styles.alias}>{account.alias}</Text>
        <Text style={styles.cardNum}>{maskedCard}</Text>
      </View>

      {/* Баланс */}
      <Text style={styles.balance}>
        {Number(account.balance).toFixed(2)}{' '}
        <Text style={styles.currency}>{account.currency}</Text>
      </Text>

      {/* Кнопка синку */}
      <TouchableOpacity
        style={styles.syncBtn}
        onPress={onSync}
        disabled={syncing}
        activeOpacity={0.7}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.syncText}>🔄 Синхронізувати</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  alias: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardNum: {
    ...typography.caption,
  },
  balance: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  currency: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  syncBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  syncText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
