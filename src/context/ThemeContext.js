import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME, GRADIENTS } from '../theme/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 'system', 'light', 'dark'
    const [themePreference, setThemePreference] = useState('system');
    const systemColorScheme = useColorScheme(); // 'light' or 'dark' from OS

    // Load persisted theme on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('themePreference');
                if (storedTheme) {
                    setThemePreference(storedTheme);
                }
            } catch (error) {
                console.log('Failed to load theme preference:', error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async (newPreference) => {
        setThemePreference(newPreference);
        try {
            await AsyncStorage.setItem('themePreference', newPreference);
        } catch (error) {
            console.log('Failed to save theme preference:', error);
        }
    };

    // Calculate effective theme
    const activeMode = themePreference === 'system' ? (systemColorScheme || 'dark') : themePreference;
    const colors = activeMode === 'light' ? LIGHT_THEME : DARK_THEME;
    const isDark = activeMode === 'dark';

    // Helper for gradients based on theme
    const themeGradients = {
        ...GRADIENTS,
        background: isDark ? GRADIENTS.hero : GRADIENTS.light,
        primary:    GRADIENTS.primary,
        gold:       GRADIENTS.gold,
        teal:       GRADIENTS.teal,
    };

    return (
        <ThemeContext.Provider value={{
            theme: themePreference, // 'system', 'light', 'dark'
            activeMode,             // 'light', 'dark'
            setTheme: toggleTheme,
            colors,
            gradients: themeGradients,
            isDark
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
