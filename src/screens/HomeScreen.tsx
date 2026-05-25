import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionItem } from '../components/TransactionItem';
import { Transaction } from '../types';
import { colors, spacing, typography } from '../theme';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { accounts, syncing, refetch: refetchAccounts, sync } = useAccounts();
  const { data: transactions, loading, refetch } = useTransactions({ limit: 30 });
  const [refreshing, setRefreshing] = useState(false);

  const primaryAccount = accounts[0] ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchAccounts()]);
    setRefreshing(false);
  };

  const onSync = async () => {
    await sync(1);
    await refetch();
  };

  const onTxPress = (tx: Transaction) => {
    navigation.navigate('TransactionDetail', { transaction: tx });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Заголовок */}
            <View style={styles.header}>
              <Text style={styles.greeting}>Привіт 👋</Text>
              <Text style={typography.h2}>Мої фінанси</Text>
            </View>

            {/* Картки балансу */}
            {primaryAccount && (
              <BalanceCard
                account={primaryAccount}
                onSync={onSync}
                syncing={syncing}
              />
            )}

            {/* Заголовок списку */}
            <Text style={styles.sectionTitle}>Останні транзакції</Text>

            {loading && (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            )}
          </>
        }
        renderItem={({ item }) => (
          <TransactionItem item={item} onPress={onTxPress} />
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Транзакцій поки немає</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  greeting: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
