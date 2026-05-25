import React, { useState } from 'react';
import {
  Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAccounts } from '../hooks/useAccounts';
import { appApi, getApiBaseUrl } from '../services/api';
import { colors, radius, spacing, typography } from '../theme';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' },
];
const CURRENCIES = ['UAH', 'USD', 'EUR'];

export const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  // Дістаємо t (перекладач) з хука!
  const { settings, updateBackendUrl, updateCurrency, updateLanguage, resetSettings, t } = useAppSettings();
  const { accounts } = useAccounts();

  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [draftUrl, setDraftUrl] = useState(settings.backendUrl);
  const [testingConnection, setTestingConnection] = useState(false);

  const currentLanguageLabel = LANGUAGES.find(l => l.code === settings.language)?.label || 'English';

  const openServerModal = () => { setDraftUrl(settings.backendUrl); setServerModalVisible(true); };

  const saveServerUrl = async () => {
    const normalized = draftUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/i.test(normalized)) return;
    await updateBackendUrl(normalized);
    setServerModalVisible(false);
  };

  const testBackendConnection = async () => {
    setTestingConnection(true);
    try {
      await appApi.health();
      Alert.alert('Backend Connected', 'Server responded successfully');
    } catch (error: any) {
      Alert.alert('Connection Failed', error?.message || 'Unknown error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handlePdfImport = async () => {
    if (!accounts || accounts.length === 0) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const file = res.assets[0];

      const uploadPdf = async (accountId: string) => {
        const formData = new FormData();
        formData.append('file', { uri: file.uri, type: file.mimeType || 'application/pdf', name: file.name || 'statement.pdf' } as any);
        await appApi.post(`/transactions/import/pdf/${accountId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      };

      if (accounts.length === 1) await uploadPdf(accounts[0].id);
      else {
        const buttons = accounts.map((acc) => ({ text: `Card **${acc.cardNumber.slice(-4)}`, onPress: () => uploadPdf(acc.id) }));
        buttons.push({ text: t('Cancel'), style: 'cancel', onPress: () => {} });
        Alert.alert('Select Account', '', buttons);
      }
    } catch (err) {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>{t('Settings')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Preferences')}</Text>
          <View style={styles.card}>
            <SettingRow icon="A" label={t('Language')} value={currentLanguageLabel} onPress={() => setLanguageModalVisible(true)} />
            <View style={styles.divider} />
            <SettingRow icon="$" label={t('BaseCurrency')} value={settings.currency} onPress={() => setCurrencyModalVisible(true)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Server')}</Text>
          <View style={styles.card}>
            <SettingRow icon="API" label={t('BackendURL')} value={settings.backendUrl} onPress={openServerModal} />
            <View style={styles.divider} />
            <SettingRow icon="Net" label={t('TestConnection')} value={testingConnection ? t('Checking') : t('TapToVerify')} onPress={testBackendConnection} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Data')}</Text>
          <View style={styles.card}>
            <SettingRow icon="PDF" label={t('ImportPDF')} value={t('TapToUpload')} onPress={handlePdfImport} />
            <View style={styles.divider} />
            <SettingRow icon="Reset" label={t('ResetSettings')} isDestructive onPress={resetSettings} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Account')}</Text>
          <View style={styles.card}>
            <SettingRow icon="Out" label={t('SignOut')} isDestructive onPress={logout} />
          </View>
        </View>
      </ScrollView>

      {/* Модалки */}
      <Modal visible={languageModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalCardMenu}>
            <Text style={styles.modalTitle}>{t('SelectLanguage')}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.menuItem, settings.language === lang.code && styles.menuItemActive]}
                onPress={() => { updateLanguage(lang.code as any); setLanguageModalVisible(false); }}
              >
                <Text style={[styles.menuItemText, settings.language === lang.code && styles.menuItemTextActive]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={currencyModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCurrencyModalVisible(false)}>
          <View style={styles.modalCardMenu}>
            <Text style={styles.modalTitle}>{t('SelectCurrency')}</Text>
            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[styles.menuItem, settings.currency === curr && styles.menuItemActive]}
                onPress={() => { updateCurrency(curr as any); setCurrencyModalVisible(false); }}
              >
                <Text style={[styles.menuItemText, settings.currency === curr && styles.menuItemTextActive]}>{curr}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={serverModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('BackendURL')}</Text>
            <TextInput style={styles.input} value={draftUrl} onChangeText={setDraftUrl} autoCapitalize="none" autoCorrect={false} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setServerModalVisible(false)}>
                <Text style={styles.cancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveServerUrl}>
                <Text style={styles.confirmText}>{t('Save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const SettingRow = ({ icon, label, value, onPress, isDestructive }: any) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      <Text style={styles.rowBadge}>{icon}</Text>
      <Text style={[styles.rowLabel, isDestructive && { color: colors.danger }]}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  headerTitle: { ...typography.h2, marginBottom: spacing.lg, marginTop: spacing.sm },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.small, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, gap: spacing.sm },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  rowBadge: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.bg, textAlign: 'center', textAlignVertical: 'center', lineHeight: 36, color: colors.primary, fontWeight: '700', marginRight: spacing.md },
  rowLabel: { ...typography.body, fontWeight: '600' },
  rowValue: { ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm, maxWidth: 180 },
  chevron: { fontSize: 20, color: colors.textMuted, marginTop: -2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: spacing.xxl },
  modalCardMenu: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.md, paddingBottom: spacing.xxl },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemActive: { backgroundColor: colors.primary + '11' },
  menuItemText: { ...typography.body, color: colors.textPrimary },
  menuItemTextActive: { fontWeight: '700', color: colors.primary },
  modalTitle: { ...typography.h3, marginBottom: spacing.md, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  input: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  modalButtons: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textSecondary },
  confirmBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { ...typography.body, color: '#fff', fontWeight: '700' },
});