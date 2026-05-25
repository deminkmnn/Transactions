import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale'; // Змінено на англійську локаль
import { transactionsApi } from '../services/api';
import { Transaction, TransactionCategory } from '../types';
import { colors, spacing, radius, typography, categoryMeta } from '../theme';

const ALL_CATEGORIES: TransactionCategory[] = [
  'food', 'cafe', 'transport', 'fuel', 'health',
  'shopping', 'utilities', 'entertainment',
  'education', 'travel', 'income', 'transfer', 'other',
];

export const TransactionDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [tx, setTx] = useState<Transaction>(route.params.transaction);
  const [note, setNote] = useState(tx.note ?? '');
  const [saving, setSaving] = useState(false);

  const isDebit = tx.type === 'debit';
  const amountColor = isDebit ? colors.danger : colors.success;
  const sign = isDebit ? '−' : '+';
  const date = format(new Date(tx.transactionDate), 'd MMMM yyyy, HH:mm', { locale: enUS });

  const selectCategory = async (cat: TransactionCategory) => {
    if (cat === tx.category) return;
    setSaving(true);
    try {
      const updated = await transactionsApi.updateCategory(tx.id, cat, note);
      setTx(updated);
    } catch {
      Alert.alert('Error', 'Failed to change category');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      const updated = await transactionsApi.updateCategory(tx.id, tx.category, note);
      setTx(updated);
      Alert.alert('Saved ✓');
    } catch {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const meta = categoryMeta[tx.category];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Сума */}
        <View style={styles.amountBlock}>
          <Text style={styles.categoryIcon}>{meta.icon}</Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {sign}{Number(tx.amount).toFixed(2)} {tx.currency}
          </Text>
          <Text style={styles.description}>{tx.description || meta.label}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        {/* Деталі */}
        <View style={styles.card}>
          <Row label="Type" value={isDebit ? '↓ Expense' : '↑ Income'} valueColor={amountColor} />
          <Row label="Balance After" value={`${Number(tx.balance).toFixed(2)} ₴`} />
          {tx.mcc && <Row label="MCC Code" value={String(tx.mcc)} />}
          <Row label="Card" value={`•••• ${tx.cardNumber.slice(-4)}`} />
          {tx.categoryEditedByUser && (
            <Row label="Category" value="changed manually" valueColor={colors.warning} />
          )}
        </View>

        {/* Нотатка */}
        <Text style={styles.sectionTitle}>Note</Text>
        <View style={styles.noteWrap}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={100}
          />
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={saveNote}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Категорія */}
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.catGrid}>
          {ALL_CATEGORIES.map(cat => {
            const m = categoryMeta[cat];
            const active = tx.category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catBtn,
                  active && { backgroundColor: m.color + '33', borderColor: m.color },
                ]}
                onPress={() => selectCategory(cat)}
                disabled={saving}
              >
                <Text style={styles.catBtnIcon}>{m.icon}</Text>
                <Text style={[styles.catBtnLabel, active && { color: m.color }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({
  label, value, valueColor,
}: { label: string; value: string; valueColor?: string }) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={[rowStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  label: { ...typography.caption },
  value: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  amountBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  categoryIcon: { fontSize: 48, marginBottom: spacing.sm },
  amount: { fontSize: 40, fontWeight: '800', marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  date: { ...typography.caption, marginTop: spacing.xs },

  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    paddingHorizontal: spacing.md, marginBottom: spacing.lg,
  },

  sectionTitle: { ...typography.h3, marginBottom: spacing.sm, marginTop: spacing.sm },

  noteWrap: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  noteInput: {
    ...typography.body, color: colors.textPrimary,
    minHeight: 60, textAlignVertical: 'top',
  },
  saveBtn: {
    alignSelf: 'flex-end', marginTop: spacing.sm,
    backgroundColor: colors.primary + '22',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary + '66',
  },
  saveBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  catBtn: {
    width: '30%', alignItems: 'center',
    paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  catBtnIcon: { fontSize: 22, marginBottom: 2 },
  catBtnLabel: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
});