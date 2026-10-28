import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';

const BaseTheme = {
  dark: false,
  colors: {
    primary: 'rgb(0, 122, 255)',
    background: 'rgb(242, 242, 242)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(28, 28, 30)',
    border: 'rgb(216, 216, 216)',
    notification: 'rgb(255, 59, 48)',
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  }
};

const BaseDarkTheme = {
  ...BaseTheme,
  dark: true,
  colors: {
    ...BaseTheme.colors,
    primary: 'rgb(10, 132, 255)',
    background: 'rgb(1, 1, 1)',
    card: 'rgb(18, 18, 18)',
    text: 'rgb(229, 229, 231)',
    border: 'rgb(39, 39, 41)',
    notification: 'rgb(255, 69, 58)',
  },
};
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppRoleProvider } from './src/context/AppRoleContext';
import { COLORS } from './src/theme/colors';
import CustomSplashScreen from './src/screens/SplashScreen';

const AppContent = () => {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer theme={{
      ...(isDark ? BaseDarkTheme : BaseTheme),
      colors: {
        ...(isDark ? BaseDarkTheme.colors : BaseTheme.colors),
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.cardBorder,
        notification: colors.accent,
      }
    }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoleProvider><NotificationProvider><AppContent /></NotificationProvider></AppRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
