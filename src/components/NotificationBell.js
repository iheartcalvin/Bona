import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import NotificationBadge from './NotificationBadge';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = ({ color = COLORS.textSecondary, size = 24 }) => {
    const navigation = useNavigation();
    const { unreadCount } = useNotifications();

    return (
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View>
                <Bell color={color} size={size} />
                <NotificationBadge count={unreadCount} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({});

export default NotificationBell;
