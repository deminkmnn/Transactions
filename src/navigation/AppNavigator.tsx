import React from 'react';
import { Platform, Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Transactions: '📋',
  Stats: '📊',
  Accounts: '💳',
  Settings: '⚙️',
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          minHeight: Platform.OS === 'ios' ? 85 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transactions' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Accounts" component={AccountsScreen} options={{ title: 'Cards' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function AppNavigator() {
  const { state, login, register, logout } = useAuth();

  return (
    <NavigationContainer>
      {state === 'loading' ? (
        <LoadingScreen />
      ) : state === 'unauthenticated' ? (
        // Auth stack — тільки LoginScreen
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={login} onRegister={register} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        // Main app stack
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgCard },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            headerBackTitle: 'Back',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ title: 'Transaction Details' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
