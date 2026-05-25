import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { appApi, getApiBaseUrl } from '../services/api';
import { colors, radius, spacing, typography } from '../theme';

const LANGUAGE_LABELS = {
  en: 'English',
  uk: 'Ukrainian',
};

const CURRENCY_OPTIONS = ['UAH', 'USD', 'EUR'] as const;

export const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const {
    settings,
    updateBackendUrl,
    updateCurrency,
    updateLanguage,
    resetSettings,
  } = useAppSettings();

  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [draftUrl, setDraftUrl] = useState(settings.backendUrl);
  const [testingConnection, setTestingConnection] = useState(false);

  const nextLanguage = settings.language === 'en' ? 'uk' : 'en';
  const nextCurrency = useMemo(() => {
    const currentIndex = CURRENCY_OPTIONS.indexOf(settings.currency);
    return CURRENCY_OPTIONS[(currentIndex + 1) % CURRENCY_OPTIONS.length];
  }, [settings.currency]);

  const openServerModal = () => {
    setDraftUrl(settings.backendUrl);
    setServerModalVisible(true);
  };

  const saveServerUrl = async () => {
    const normalized = draftUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/i.test(normalized)) {
      Alert.alert('Invalid URL', 'Enter a full backend URL, for example http://192.168.0.2:3001/api/v1');
      return;
    }

    await updateBackendUrl(normalized);
    setServerModalVisible(false);
    Alert.alert('Saved', 'Backend URL updated.');
  };

  const testBackendConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await appApi.health();
      Alert.alert('Backend Connected', `Server responded successfully.\n${result.timestamp}`);
    } catch (error: any) {
      const message =
        error?.message === 'Network Error'
          ? `Cannot reach ${getApiBaseUrl()}`
          : error?.response?.data?.message ?? error?.message ?? 'Unknown error';
      Alert.alert('Connection Failed', message);
    } finally {
      setTestingConnection(false);
    }
  };

  const handlePdfImportInfo = () => {
    Alert.alert(
      'PDF import',
      'Next step is a PDF statement parser. To make it reliable for PrivatBank, we need 1-2 real PDF statement samples and then we can wire import into this screen.',
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset settings?',
      'This will restore the default backend URL, language, and base currency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('Reset complete', 'Settings were restored to defaults.');
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign out?',
      'You can log back in at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow
              icon="A"
              label="Language"
              value={LANGUAGE_LABELS[settings.language]}
              onPress={() => updateLanguage(nextLanguage)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="$"
              label="Base Currency"
              value={settings.currency}
              onPress={() => updateCurrency(nextCurrency)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server</Text>
          <View style={styles.card}>
            <SettingRow
              icon="API"
              label="Backend URL"
              value={settings.backendUrl}
              onPress={openServerModal}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="Net"
              label="Test Connection"
              value={testingConnection ? 'Checking...' : 'Tap to verify'}
              onPress={testBackendConnection}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <SettingRow
              icon="PDF"
              label="Import PDF Statement"
              value="Parser setup next"
              onPress={handlePdfImportInfo}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="Reset"
              label="Reset App Settings"
              isDestructive
              onPress={handleResetSettings}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingRow
              icon="Out"
              label="Sign Out"
              isDestructive
              onPress={handleLogout}
            />
          </View>
        </View>

        <Text style={styles.version}>App Version 1.0.0</Text>
      </ScrollView>

      <Modal visible={serverModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Backend URL</Text>
            <Text style={styles.modalHint}>
              Use the full API URL, for example `http://192.168.0.2:3001/api/v1`
            </Text>
            <TextInput
              style={styles.input}
              value={draftUrl}
              onChangeText={setDraftUrl}
              placeholder="http://192.168.0.2:3001/api/v1"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setServerModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={saveServerUrl}>
                <Text style={styles.confirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SettingRow = ({
  icon,
  label,
  value,
  onPress,
  isDestructive,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  isDestructive?: boolean;
}) => (
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
  sectionTitle: {
    ...typography.small,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  rowBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 36,
    color: colors.primary,
    fontWeight: '700',
    marginRight: spacing.md,
  },
  rowLabel: { ...typography.body, fontWeight: '600' },
  rowValue: { ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm, maxWidth: 180 },
  chevron: { fontSize: 20, color: colors.textMuted, marginTop: -2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  version: { ...typography.small, textAlign: 'center', marginTop: spacing.xl },
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
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  modalHint: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
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
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
  },
});
