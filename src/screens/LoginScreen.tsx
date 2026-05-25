import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
}

export const LoginScreen: React.FC<Props> = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const validate = (): string | null => {
    if (!email.trim()) return 'Enter your email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!isLogin && password !== confirm) return 'Passwords do not match';
    return null;
  };

  const getErrorMessage = (error: any): string => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (status === 409) return 'This email is already registered.';
    if (status === 401) return 'Invalid email or password.';
    if (status === 400 && Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string' && message.trim()) return message;
    if (error?.message === 'Network Error') {
      return 'Cannot reach the backend. Check that the server is running and the phone is on the same network.';
    }

    return isLogin ? 'Login failed.' : 'Registration failed.';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Error', err);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password);
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>Card</Text>
            <Text style={styles.appName}>Transactions</Text>
            <Text style={styles.tagline}>PrivatBank expense tracker</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!loading}
            />

            {!isLogin && (
              <>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repeat your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!loading}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md - 2,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
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
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
