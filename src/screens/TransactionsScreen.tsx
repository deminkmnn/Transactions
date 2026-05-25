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
import { useAppSettings } from '../hooks/useAppSettings'; 

const ALL_CATEGORIES: TransactionCategory[] = [
  'food', 'cafe', 'transport', 'fuel', 'health',
  'shopping', 'utilities', 'entertainment', 'income', 'transfer', 'other',
];

const CATEGORIES_DATA = ['all', ...ALL_CATEGORIES];

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useAppSettings(); 

  const [activeCategory, setActiveCategory] = useState<TransactionCategory | undefined>();
  const [activeType, setActiveType] = useState<'debit' | 'credit' | undefined>();

  // Дістаємо нові функції з хука
  const { data, total, loading, loadingMore, refetch, loadMore } = useTransactions({
    category: activeCategory,
    type: activeType,
    limit: 50, // Вантажимо по 50 штук за раз
  });

  const onTxPress = (tx: Transaction) => {
    navigation.navigate('TransactionDetail', { transaction: tx });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Фільтр тип */}
      <View style={styles.typeRow}>
        {([undefined, 'debit', 'credit'] as const).map(typeKey => (
          <TouchableOpacity
            key={String(typeKey)}
            style={[styles.typeBtn, activeType === typeKey && styles.typeBtnActive]}
            onPress={() => setActiveType(typeKey)}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnText, activeType === typeKey && styles.typeBtnTextActive]}>
              {typeKey === undefined ? t('All') : typeKey === 'debit' ? t('ExpensesFilter') : t('IncomeFilter')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Фільтр категорій */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES_DATA}
        keyExtractor={i => i}
        contentContainerStyle={styles.catScroll}
        style={styles.catList}
        renderItem={({ item }) => {
          if (item === 'all') {
            const isAllActive = activeCategory === undefined;
            return (
              <TouchableOpacity
                style={[styles.catChip, isAllActive && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                onPress={() => setActiveCategory(undefined)}
                activeOpacity={0.7}
              >
                <Text style={styles.catIcon}>📋</Text>
                <Text style={[styles.catLabel, isAllActive && { color: colors.primary }]}>{t('All')}</Text>
              </TouchableOpacity>
            );
          }

          const cat = item as TransactionCategory;
          const meta = categoryMeta[cat];
          const active = activeCategory === cat;
          
          return (
            <TouchableOpacity
              style={[styles.catChip, active && { backgroundColor: meta.color + '33', borderColor: meta.color }]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
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
        {loading && !loadingMore ? '...' : `${total}`}
      </Text>

      {loading && !loadingMore ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={loading}
          
          // --- ПАГІНАЦІЯ ---
          onEndReached={loadMore} // Викликається при скролі вниз
          onEndReachedThreshold={0.5} // За скільки екранів до кінця починати вантажити (0.5 = пів екрана)
          ListFooterComponent={ // Показуємо крутилку знизу, якщо вантажимо нову сторінку
            loadingMore ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null
          }
          // -----------------

          renderItem={({ item }) => (
            <TransactionItem item={item} onPress={onTxPress} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('NothingFound')}</Text>
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
    flex: 1, 
    height: 40,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1, 
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  typeBtnText: { ...typography.caption, fontWeight: '600' },
  typeBtnTextActive: { color: colors.primary },
  
  catList: { maxHeight: 50, marginBottom: spacing.sm },
  catScroll: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
  
  catChip: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md, 
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1, 
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    gap: 6,
  },
  catIcon: { 
    fontSize: 16,
    lineHeight: 18,
  },
  catLabel: { 
    ...typography.small, 
    color: colors.textSecondary, 
    fontWeight: '600',
    lineHeight: 18,
  },
  
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