import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import Svg from 'react-native-svg';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useMonthlyStats, useYearlyStats } from '../hooks/useTransactions';
import { colors, spacing, radius, typography, categoryMeta } from '../theme';
import { TransactionCategory } from '../types';

const SCREEN_W = Dimensions.get('window').width;
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const StatsScreen: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { stats, loading } = useMonthlyStats(year, month);
  const { stats: yearly } = useYearlyStats(year);

  // Дані для bar chart
  const barData = yearly ? {
    labels: yearly.months.map(m => MONTHS_EN[m.month - 1]),
    datasets: [
      {
        data: yearly.months.map(m => m.expenses),
        color: () => colors.danger,
      },
    ],
  } : null;

  const topCategories = stats
    ? Object.entries(stats.byCategory)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
        .slice(0, 6)
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Statistics</Text>

        {/* Новий зручний вибір дати */}
        <View style={styles.dateSelectorCard}>
          {/* Вибір року */}
          <View style={styles.yearRow}>
            <TouchableOpacity onPress={() => setYear(y => y - 1)} style={styles.navBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.yearLabel}>{year}</Text>
            <TouchableOpacity onPress={() => setYear(y => y + 1)} style={styles.navBtn}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Стрічка місяців */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.monthsScroll}
          >
            {MONTHS_EN.map((mName, index) => {
              const mNum = index + 1;
              const isActive = mNum === month;
              return (
                <TouchableOpacity
                  key={mNum}
                  style={[styles.monthChip, isActive && styles.monthChipActive]}
                  onPress={() => setMonth(mNum)}
                >
                  <Text style={[styles.monthChipText, isActive && styles.monthChipTextActive]}>
                    {mName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : stats ? (
          <>
            {/* Картки income / expenses */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: colors.success + '44' }]}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryAmount, { color: colors.success }]}>
                  +{stats.totalIncome.toFixed(0)} ₴
                </Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: colors.danger + '44' }]}>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={[styles.summaryAmount, { color: colors.danger }]}>
                  −{stats.totalExpenses.toFixed(0)} ₴
                </Text>
              </View>
            </View>

            {/* Категорії */}
            {topCategories.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>By Category</Text>
                {topCategories.map(([cat, amount]) => {
                  const meta = categoryMeta[cat as TransactionCategory];
                  const pct = stats.totalExpenses > 0
                    ? ((amount ?? 0) / stats.totalExpenses) * 100
                    : 0;
                  return (
                    <View key={cat} style={styles.catRow}>
                      <Text style={styles.catIcon}>{meta.icon}</Text>
                      <View style={styles.catMiddle}>
                        <Text style={styles.catLabel}>{meta.label}</Text>
                        <View style={styles.barBg}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${pct}%`, backgroundColor: meta.color },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.catAmount}>
                        {(amount ?? 0).toFixed(0)} ₴
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

            {/* Найбільша витрата */}
            {stats.topExpense && (
              <View style={styles.topExpenseCard}>
                <Text style={styles.summaryLabel}>Largest Expense of the Month</Text>
                <Text style={styles.topExpenseDesc} numberOfLines={1}>
                  {stats.topExpense.description}
                </Text>
                <Text style={[styles.summaryAmount, { color: colors.danger }]}>
                  −{stats.topExpense.amount.toFixed(2)} ₴
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Графік по місяцях (річний) */}
        {barData && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              Expenses {year}
            </Text>
            <BarChart
              data={barData}
              width={SCREEN_W - spacing.md * 2}
              height={200}
              yAxisLabel=""
              yAxisSuffix="₴"
              chartConfig={{
                backgroundColor: colors.bgCard,
                backgroundGradientFrom: colors.bgCard,
                backgroundGradientTo: colors.bgCard,
                decimalPlaces: 0,
                color: () => colors.danger,
                labelColor: () => colors.textSecondary,
                propsForBackgroundLines: { stroke: colors.border },
              }}
              style={{ borderRadius: radius.md, marginTop: spacing.sm }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Стилі для нового селектора дат
  dateSelectorCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  navBtn: { padding: spacing.sm, paddingHorizontal: spacing.md },
  navArrow: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  yearLabel: { ...typography.h3 },
  monthsScroll: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  monthChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
  },
  monthChipActive: {
    backgroundColor: colors.primary + '22', // Напівпрозорий фон активного місяця
  },
  monthChipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  monthChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1,
  },
  summaryLabel: { ...typography.caption, marginBottom: spacing.xs },
  summaryAmount: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },

  sectionTitle: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.sm },

  catRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.md,
  },
  catIcon: { fontSize: 22, marginRight: spacing.sm, width: 30 },
  catMiddle: { flex: 1, marginRight: spacing.sm },
  catLabel: { ...typography.caption, marginBottom: 4 },
  barBg: {
    height: 6, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  catAmount: { ...typography.caption, fontWeight: '600', color: colors.textPrimary, minWidth: 60, textAlign: 'right' },

  topExpenseCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.danger + '33',
  },
  topExpenseDesc: { ...typography.body, fontWeight: '600', marginVertical: spacing.xs },
});