import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAccounts } from '../hooks/useAccounts';
import { accountsApi, pdfImportApi } from '../services/api';
import { Account } from '../types';
import { colors, radius, spacing, typography } from '../theme';

export const AccountsScreen: React.FC = () => {
  const { accounts, loading, syncing, refetch, sync, refreshBalance } = useAccounts();
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [alias, setAlias] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [importingAccountId, setImportingAccountId] = useState<string | null>(null);

  const addAccount = async () => {
    if (cardNumber.length !== 16) {
      Alert.alert('Error', 'Card number must be 16 digits');
      return;
    }

    setSaving(true);
    try {
      await accountsApi.create({ cardNumber, alias: alias || undefined, apiToken });
      setCardNumber('');
      setAlias('');
      setApiToken('');
      setModalVisible(false);
      await refetch();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message ?? 'Failed to add card');
    } finally {
      setSaving(false);
    }
  };

  const importPdfStatement = async (account: Account) => {
    setImportingAccountId(account.id);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
      };

      const preview = await pdfImportApi.preview(account.id, file);

      if (!preview.totalParsed) {
        Alert.alert('Nothing found', 'No transactions were found in this PDF statement.');
        return;
      }

      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Import PDF statement?',
          [
            `File: ${preview.fileName}`,
            preview.period ? `Period: ${preview.period}` : null,
            `Transactions found: ${preview.totalParsed}`,
            `New transactions: ${preview.newCount}`,
            `Duplicates: ${preview.duplicateCount}`,
          ].filter(Boolean).join('\n'),
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Import', onPress: () => resolve(true) },
          ],
        );
      });

      if (!confirmed) return;

      const imported = await pdfImportApi.import(account.id, file);
      await refetch();

      Alert.alert(
        'Import finished',
        [
          `Imported: ${imported.imported}`,
          `Skipped: ${imported.skipped}`,
          imported.period ? `Period: ${imported.period}` : null,
        ].filter(Boolean).join('\n'),
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ??
        error.message ??
        'Failed to import PDF statement';
      Alert.alert('Import failed', Array.isArray(message) ? message.join('\n') : message);
    } finally {
      setImportingAccountId(null);
    }
  };

  const removeAccount = (account: Account) => {
    Alert.alert(
      'Delete card?',
      `${account.alias} (•••• ${account.cardNumber.slice(-4)})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await accountsApi.remove(account.id);
            await refetch();
          },
        },
      ],
    );
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const isImporting = importingAccountId === item.id;

    return (
      <View style={styles.accountCard}>
        <View style={styles.accountRow}>
          <View>
            <Text style={styles.accountAlias}>{item.alias}</Text>
            <Text style={styles.accountCard2}>•••• {item.cardNumber.slice(-4)}</Text>
          </View>
          <View style={styles.accountRight}>
            <Text style={styles.accountBalance}>
              {Number(item.balance).toFixed(2)} {item.currency || 'UAH'}
            </Text>
            {item.lastSyncAt && (
              <Text style={styles.lastSync}>
                Sync: {new Date(item.lastSyncAt).toLocaleDateString('en-US')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.accountActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => refreshBalance(item.id)}>
            <Text style={styles.actionBtnText}>Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => sync(7)} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.actionBtnText}>Sync 7 Days</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => importPdfStatement(item)}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.actionBtnText}>Import PDF</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => removeAccount(item)}
          >
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={accounts}
        keyExtractor={(account) => account.id}
        contentContainerStyle={styles.content}
        onRefresh={refetch}
        refreshing={loading}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={typography.h2}>My Cards</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={renderAccount}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No cards added.{'\n'}Tap "+ Add"</Text> : null
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[typography.h3, { marginBottom: spacing.md }]}>New Card</Text>

            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={(text) => setCardNumber(text.replace(/\D/g, '').slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={16}
            />

            <Text style={styles.inputLabel}>Alias (Optional)</Text>
            <TextInput
              style={styles.input}
              value={alias}
              onChangeText={setAlias}
              placeholder="Main, Savings..."
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Bank API Token (Optional)</Text>
            <TextInput
              style={styles.input}
              value={apiToken}
              onChangeText={setApiToken}
              placeholder="id:token (for PrivatBank AutoClient)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setCardNumber('');
                  setAlias('');
                  setApiToken('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={addAccount} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>Add</Text>}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  accountCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  accountAlias: { ...typography.body, fontWeight: '700' },
  accountCard2: { ...typography.caption, marginTop: 2 },
  accountRight: { alignItems: 'flex-end' },
  accountBalance: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  lastSync: { ...typography.small, marginTop: 2 },
  accountActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actionBtn: {
    minWidth: '22%',
    flexGrow: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: `${colors.danger}44`,
  },
  actionBtnText: { ...typography.small, color: colors.primary, fontWeight: '600' },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  inputLabel: { ...typography.caption, marginBottom: spacing.xs },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary },
  confirmBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmText: { ...typography.body, color: '#fff', fontWeight: '700' },
});
