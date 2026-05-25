import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, SafeAreaView, ActivityIndicator, Modal,
} from 'react-native';
import { useAccounts } from '../hooks/useAccounts';
import { accountsApi } from '../services/api';
import { Account } from '../types';
import { colors, spacing, radius, typography } from '../theme';

export const AccountsScreen: React.FC = () => {
  const { accounts, loading, syncing, refetch, sync, refreshBalance } = useAccounts();
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [alias, setAlias] = useState('');
  const [saving, setSaving] = useState(false);

  const addAccount = async () => {
    if (cardNumber.length !== 16) {
      Alert.alert('Помилка', 'Номер картки має бути 16 цифр');
      return;
    }
    setSaving(true);
    try {
      await accountsApi.create({ cardNumber, alias: alias || undefined });
      setCardNumber('');
      setAlias('');
      setModalVisible(false);
      await refetch();
    } catch (e: any) {
      Alert.alert('Помилка', e.response?.data?.message ?? 'Не вдалося додати картку');
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = (account: Account) => {
    Alert.alert(
      'Видалити картку?',
      `${account.alias} (•••• ${account.cardNumber.slice(-4)})`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити', style: 'destructive',
          onPress: async () => {
            await accountsApi.remove(account.id);
            await refetch();
          },
        },
      ],
    );
  };

  const renderAccount = ({ item }: { item: Account }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountRow}>
        <View>
          <Text style={styles.accountAlias}>{item.alias}</Text>
          <Text style={styles.accountCard2}>•••• {item.cardNumber.slice(-4)}</Text>
        </View>
        <View style={styles.accountRight}>
          <Text style={styles.accountBalance}>
            {Number(item.balance).toFixed(2)} ₴
          </Text>
          {item.lastSyncAt && (
            <Text style={styles.lastSync}>
              Синк: {new Date(item.lastSyncAt).toLocaleDateString('uk')}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.accountActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => refreshBalance(item.id)}
        >
          <Text style={styles.actionBtnText}>🔄 Баланс</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => sync(7)}
          disabled={syncing}
        >
          {syncing
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.actionBtnText}>⬇️ Синк 7 днів</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.danger + '44' }]}
          onPress={() => removeAccount(item)}
        >
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={accounts}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.content}
        onRefresh={refetch}
        refreshing={loading}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.h2}>Мої картки</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addBtnText}>+ Додати</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderAccount}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              Картки не додано.{'\n'}Натисни «+ Додати»
            </Text>
          ) : null
        }
      />

      {/* Модалка додавання картки */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.h3, { marginBottom: spacing.md }]}>
              Нова картка
            </Text>

            <Text style={styles.inputLabel}>Номер картки</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={t => setCardNumber(t.replace(/\D/g, '').slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={16}
            />

            <Text style={styles.inputLabel}>Назва (необов'язково)</Text>
            <TextInput
              style={styles.input}
              value={alias}
              onChangeText={setAlias}
              placeholder="Основна, Зарплатна..."
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setCardNumber(''); setAlias(''); }}
              >
                <Text style={styles.cancelText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={addAccount}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.confirmText}>Додати</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  accountCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  accountAlias: { ...typography.body, fontWeight: '700' },
  accountCard2: { ...typography.caption, marginTop: 2 },
  accountRight: { alignItems: 'flex-end' },
  accountBalance: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  lastSync: { ...typography.small, marginTop: 2 },

  accountActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { ...typography.small, color: colors.primary, fontWeight: '600' },

  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },

  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, paddingBottom: spacing.xxl,
  },
  inputLabel: { ...typography.caption, marginBottom: spacing.xs },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.bgInput, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary },
  confirmBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  confirmText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
