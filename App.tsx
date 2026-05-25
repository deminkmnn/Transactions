import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppSettingsProvider } from './src/hooks/useAppSettings';
import { AuthProvider } from './src/hooks/useAuth';

export default function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </AppSettingsProvider>
  );
}