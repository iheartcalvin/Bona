import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabNavigator from './MainTabNavigator';
import NotificationsScreen from '../screens/NotificationsScreen';
import AITutorScreen from '../screens/AITutorScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import HelpScreen from '../screens/HelpScreen';
import LegalScreen from '../screens/LegalScreen';
import BannedScreen from '../screens/BannedScreen';
import VerificationPendingScreen from '../screens/VerificationPendingScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UsernameSetupScreen from '../screens/UsernameSetupScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('onboardingCompleted');
      if (value === null) {
        setIsFirstLaunch(true);
      }
    } catch (error) {
      // keep false
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"
    >
      {/* Onboarding Screen */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Main App (Immediately accessible as requested: "auth should wait i want to see the app work first") */}
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="AITutor" component={AITutorScreen} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} />

      {/* Optional Auth Screens (ready for when user wants to turn on auth) */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={AuthScreen} />
      <Stack.Screen name="UsernameSetup" component={UsernameSetupScreen} />
      <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
      <Stack.Screen name="Banned" component={BannedScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
