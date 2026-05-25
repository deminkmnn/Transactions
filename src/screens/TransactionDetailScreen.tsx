import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, ScrollView, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { transactionsApi } from '../services/api';
import { colors, spacing, radius, typography, categoryMeta } from '../theme';
import { useAppSettings } from '../hooks/useAppSettings';
import { TransactionCategory } from '../types';

// Список всіх категорій для можливості їх зміни
const ALL_CATEGORIES: TransactionCategory[] = [
  'food', 'cafe', 'transport', 'fuel', 'health',
  'shopping', 'utilities', 'entertainment', 'income', 'transfer', 'other',
];

export const TransactionDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { t, convertAmount, currencySymbol, settings } = useAppSettings();
  
  const tx = route.params?.transaction;
  
  // Додали стейт для вибору нової категорії
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>(tx?.category || 'other');
  const [note, setNote] = useState(tx?.note || '');
  const [saving, setSaving] = useState(false);

  if (!tx) return null;

  const isDebit = tx.type === 'debit';
  const activeMeta = categoryMeta[selectedCategory]; // Беремо мету для обраної категорії
  
  const dateLocale = settings.language === 'uk' ? uk : enUS;
  const formattedDate = format(new Date(tx.transactionDate), 'd MMMM yyyy, HH:mm', { locale: dateLocale });

  const convertedAmount = convertAmount(Number(tx.amount || 0)).toFixed(2);
  const convertedBalance = convertAmount(Number(tx.balance || 0)).toFixed(2);

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      // Тепер зберігаємо не тільки нотатку, а й обрану категорію!
      await transactionsApi.updateCategory(tx.id, selectedCategory, note);
      Alert.alert('Success', 'Transaction updated successfully');
      navigation.goRoot ? navigation.goBack() : navigation.navigate('Transactions' as any);
    } catch (err) {
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. ВЕРХНІЙ БЛОК: Головна інформація (Іконка, Опис, Сума) */}
          <View style={styles.headerCentered}>
            <View style={[styles.bigIconWrap, { backgroundColor: activeMeta.color + '22' }]}>
              <Text style={styles.bigIcon}>{activeMeta.icon}</Text>
            </View>
            <Text style={styles.txDescription} numberOfLines={2}>
              {tx.description}
            </Text>
            <Text style={[styles.txAmount, { color: isDebit ? colors.danger : colors.success }]}>
              {isDebit ? '−' : '+'}{convertedAmount} {currencySymbol}
            </Text>
          </View>

          {/* 2. БЛОК ВИБОРУ КАТЕГОРІЇ */}
          <Text style={styles.sectionTitle}>{t('Category')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.catScroll}
            style={styles.catList}
          >
            {ALL_CATEGORIES.map(cat => {
              const meta = categoryMeta[cat];
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isActive && { backgroundColor: meta.color + '33', borderColor: meta.color }]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={styles.catIcon}>{meta.icon}</Text>
                  <Text style={[styles.catLabel, isActive && { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 3. ДЕТАЛІ ТРАНЗАКЦІЇ (Технічна інфа) */}
          <Text style={styles.sectionTitle}>Деталі</Text>
          <View style={styles.card}>
            <DetailRow label={t('Date')} value={formattedDate} />
            <View style={styles.divider} />
            <DetailRow label={t('Balance')} value={`${convertedBalance} ${currencySymbol}`} />
            
            {/* Додаткова технічна інфа з бази */}
            {tx.cardNumber && (
              <>
                <View style={styles.divider} />
                <DetailRow label="Картка" value={`•••• ${tx.cardNumber.slice(-4)}`} />
              </>
            )}
            {tx.externalId && (
              <>
                <View style={styles.divider} />
                <DetailRow label="ID Операції" value={tx.externalId} />
              </>
            )}
            {tx.mcc && (
              <>
                <View style={styles.divider} />
                <DetailRow label="MCC Код" value={tx.mcc.toString()} />
              </>
            )}
          </View>

          {/* 4. НОТАТКА */}
          <Text style={styles.sectionTitle}>{t('Note')}</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Додати коментар..."
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('Save')}</Text>}
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Допоміжний компонент для рядків з деталями, щоб не дублювати код
const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value} selectable>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  
  // Стилі верхнього блоку
  headerCentered: { alignItems: 'center', marginVertical: spacing.xl },
  bigIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  bigIcon: { fontSize: 40 },
  txDescription: { ...typography.h3, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  txAmount: { fontSize: 36, fontWeight: '800' },

  // Стилі категорій
  sectionTitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: 4 },
  catList: { marginBottom: spacing.lg, maxHeight: 44 },
  catScroll: { gap: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard, gap: 6 },
  catIcon: { fontSize: 16 },
  catLabel: { ...typography.small, color: colors.textSecondary, fontWeight: '600' },

  // Стилі карток деталей
  card: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  label: { ...typography.body, color: colors.textSecondary },
  value: { ...typography.body, color: colors.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },

  // Ввід
  input: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, height: 100, textAlignVertical: 'top', marginBottom: spacing.xl },
  
  // Кнопка
  saveBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
});