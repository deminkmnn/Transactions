import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionItem } from '../components/TransactionItem';
import { Transaction, TransactionCategory } from '../types';
import { colors, spacing, radius, typography, categoryMeta } from '../theme';

const ALL_CATEGORIES: TransactionCategory[] = [
  'food', 'cafe', 'transport', 'fuel', 'health',
  'shopping', 'utilities', 'entertainment', 'income', 'transfer', 'other',
];

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState<TransactionCategory | undefined>();
  const [activeType, setActiveType] = useState<'debit' | 'credit' | undefined>();

  const { data, total, loading, refetch } = useTransactions({
    category: activeCategory,
    type: activeType,
    limit: 50,
  });

  const onTxPress = (tx: Transaction) => {
    navigation.navigate('TransactionDetail', { transaction: tx });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Фільтр тип */}
      <View style={styles.typeRow}>
        {([undefined, 'debit', 'credit'] as const).map(t => (
          <TouchableOpacity
            key={String(t)}
            style={[styles.typeBtn, activeType === t && styles.typeBtnActive]}
            onPress={() => setActiveType(t)}
          >
            <Text style={[styles.typeBtnText, activeType === t && styles.typeBtnTextActive]}>
              {t === undefined ? 'All' : t === 'debit' ? '↓ Expenses' : '↑ Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Фільтр категорій */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={ALL_CATEGORIES}
        keyExtractor={i => i}
        contentContainerStyle={styles.catScroll}
        style={styles.catList}
        renderItem={({ item }) => {
          const meta = categoryMeta[item];
          const active = activeCategory === item;
          return (
            <TouchableOpacity
              style={[styles.catChip, active && { backgroundColor: meta.color + '33', borderColor: meta.color }]}
              onPress={() => setActiveCategory(active ? undefined : item)}
            >
              <Text style={styles.catIcon}>{meta.icon}</Text>
              <Text style={[styles.catLabel, active && { color: meta.color }]}>
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Лічильник */}
      <Text style={styles.counter}>
        {loading ? '...' : `${total} transactions`}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={loading}
          renderItem={({ item }) => (
            <TransactionItem item={item} onPress={onTxPress} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nothing found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  typeRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1, paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  typeBtnText: { ...typography.caption, fontWeight: '600' },
  typeBtnTextActive: { color: colors.primary },

  catList: { maxHeight: 48, marginBottom: spacing.sm },
  catScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
    gap: 4,
  },
  catIcon: { fontSize: 14 },
  catLabel: { ...typography.small, color: colors.textSecondary, fontWeight: '600' },

  counter: {
    ...typography.small,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    ...typography.body, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.xl,
  },
});