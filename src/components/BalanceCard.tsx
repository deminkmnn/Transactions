import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Account } from '../types';
import { colors, spacing, radius, typography } from '../theme';
import { useAppSettings } from '../hooks/useAppSettings';

interface Props {
  account: Account;
  onSync?: () => void;
  syncing?: boolean;
}

export const BalanceCard: React.FC<Props> = ({ account, onSync, syncing }) => {
  // Дістаємо налаштування і функцію перемикання
  const { settings, toggleHideBalance, convertAmount, currencySymbol, t } = useAppSettings();
  
  const maskedCard = `•••• ${account.cardNumber.slice(-4)}`;
  const convertedBalance = convertAmount(Number(account.balance || 0)).toFixed(2);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.alias}>{account.alias}</Text>
        <Text style={styles.cardNum}>{maskedCard}</Text>
      </View>

      {/* РОБИМО БАЛАНС КЛІКАБЕЛЬНИМ */}
      <TouchableOpacity 
        onPress={toggleHideBalance} 
        activeOpacity={0.7}
        style={styles.balanceWrapper}
      >
        <Text style={styles.balance}>
          {settings.hideBalance ? '••••' : convertedBalance}{' '}
          <Text style={styles.currency}>{currencySymbol}</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.syncBtn}
        onPress={onSync}
        disabled={syncing}
        activeOpacity={0.7}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.syncText}>{t('SyncBtn')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary + '33' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  alias: { ...typography.caption, color: colors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  cardNum: { ...typography.caption },
  
  // Додано balanceWrapper, щоб клік працював тільки по ширині тексту, а не по всьому рядку
  balanceWrapper: { 
    alignSelf: 'flex-start', 
    marginBottom: spacing.md,
    minWidth: 220, // <-- Завжди тримає ширину кнопки не менше 220 пікселів
  },
  balance: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },
  currency: { fontSize: 18, fontWeight: '400', color: colors.textSecondary },
  
  syncBtn: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '44' },
  syncText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});