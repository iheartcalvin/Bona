import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

const NotificationBadge = ({ count }) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    if (!count || count <= 0) return null;
    if (!count || count <= 0) return null;

    return (
        <View style={styles.badge} />
    );
};

const createStyles = (colors) => StyleSheet.create({
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.error,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.background,
        zIndex: 10,
    },
});

export default NotificationBadge;
