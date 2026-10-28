import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import NotificationBadge from './NotificationBadge';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = ({ color, size = 24 }) => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { unreadCount } = useNotifications();

    const iconColor = color || colors.textSecondary;

    return (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View>
                <Bell color={iconColor} size={size} />
                <NotificationBadge count={unreadCount} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({});

export default NotificationBell;
