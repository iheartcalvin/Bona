import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Book, Heart, MessageCircle, Calendar, User, Users } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

import BibleScreen from '../screens/BibleScreen';
import PrayerScreen from '../screens/PrayerScreen';
import SpacesScreen from '../screens/SpacesScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScheduledPrayersScreen from '../screens/ScheduledPrayersScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const PrayerStack = createNativeStackNavigator();

const PrayerNavigator = () => (
    <PrayerStack.Navigator screenOptions={{ headerShown: false }}>
        <PrayerStack.Screen name="PrayerMain" component={PrayerScreen} />
        <PrayerStack.Screen name="ScheduledPrayers" component={ScheduledPrayersScreen} />
    </PrayerStack.Navigator>
);

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 60,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
            }}
        >
            <Tab.Screen
                name="Bible"
                component={BibleScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Prayer"
                component={PrayerNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Spaces"
                component={SpacesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Events"
                component={EventsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
