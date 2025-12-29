import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { COLORS } from './src/theme/colors';

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <RootNavigator />
        </NotificationProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
