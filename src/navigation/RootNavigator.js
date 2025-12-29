import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from '../screens/AuthScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabNavigator from './MainTabNavigator';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/ChatScreen';
import SupportScreen from '../screens/SupportScreen';
import HelpScreen from '../screens/HelpScreen';
import LegalScreen from '../screens/LegalScreen';
import BannedScreen from '../screens/BannedScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, loading } = useAuth();
    const [isFirstLaunch, setIsFirstLaunch] = useState(null);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem('onboardingCompleted');
            if (value === null) {
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }
        } catch (error) {
            setIsFirstLaunch(false);
        }
    };

    if (loading || isFirstLaunch === null) {
        return null;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isFirstLaunch && !user ? (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : null}

            {!user ? (
                <>
                    <Stack.Screen name="SignUp" component={AuthScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                </>
            ) : user.isBanned ? (
                <Stack.Screen name="Banned" component={BannedScreen} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="Chat" component={ChatScreen} />
                    <Stack.Screen name="Support" component={SupportScreen} options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="Help" component={HelpScreen} options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="Legal" component={LegalScreen} options={{ presentation: 'fullScreenModal' }} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;


