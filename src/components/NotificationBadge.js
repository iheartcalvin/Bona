import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

const NotificationBadge = ({ count }) => {
    if (!count || count <= 0) return null;

    return (
        <View style={styles.badge} />
    );
};

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.error,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: COLORS.background,
        zIndex: 10,
    },
});

export default NotificationBadge;
