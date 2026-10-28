import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GRADIENTS, SPACING } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const UsernameSetupScreen = () => {
    const { colors, gradients } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const { user, reloadUser } = useAuth(); // We need reloadUser to refresh profile in context after update

    // Default to a sanitized version of their display name if available
    const initialUsername = user?.displayName ? user.displayName.replace(/\s/g, '').toLowerCase() : '';
    const [username, setUsername] = useState(initialUsername);

    const [isUsernameValid, setIsUsernameValid] = useState(null); // null, true, false
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Debounce username check
    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 3) {
                setIsUsernameValid(null);
                return;
            }
            setCheckingUsername(true);
            try {
                const available = await UserService.checkUsernameAvailability(username);
                setIsUsernameValid(available);
            } catch (error) {
                console.error("Check username error", error);
            } finally {
                setCheckingUsername(false);
            }
        };

        const timer = setTimeout(() => {
            if (username) checkUsername();
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSave = async () => {
        if (!username || username.length < 3) {
            Alert.alert("Invalid Username", "Username must be at least 3 characters.");
            return;
        }
        if (isUsernameValid === false) {
            Alert.alert("Unavailable", "This username is already taken. Please choose another.");
            return;
        }

        setSubmitting(true);
        try {
            // Update Firestore Profile
            await UserService.updateUserProfile(user.uid, {
                username: username.toLowerCase()
            });

            // Force reload of user context to reflect the new username and bypass the blocking check in RootNavigator
            // The RootNavigator check depends on user.username being present. 
            // reloadUser() updates the context state by re-fetching the profile listener? 
            // Actually, UserService.subscribeToUserProfile in AuthContext should pick up the change automatically!
            // But we might need to wait a moment or manually trigger a refresh if the listener is slow?
            // Usually local listener is instant-ish.

            // Just incase, we can provide feedback
            // Alert.alert("Success", "Username set!"); 
            // Navigation should happen automatically when user.username becomes valid in RootNavigator context.

        } catch (error) {
            console.error("Error saving username:", error);
            Alert.alert("Error", "Could not save username. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'center', padding: SPACING.xl }}
                >
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={{ width: 120, height: 40, resizeMode: 'contain', marginBottom: 20 }}
                        />
                        <Text style={styles.title}>Choose a Username</Text>
                        <Text style={styles.subtitle}>To complete your profile, please create a unique username.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIcon}>
                                <User size={20} color={colors.primary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor={colors.textSecondary}
                                value={username}
                                onChangeText={(text) => setUsername(text.replace(/\s/g, '').toLowerCase())}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {username.length >= 3 && (
                                <View style={{ marginRight: 8 }}>
                                    {checkingUsername ? (
                                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Checking...</Text>
                                    ) : isUsernameValid ? (
                                        <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>Available</Text>
                                    ) : (
                                        <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700' }}>Taken</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, (!isUsernameValid || submitting) && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={!isUsernameValid || submitting}
                        >
                            <LinearGradient colors={GRADIENTS.primary} style={styles.saveBtnGradient}>
                                <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Continue'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: colors.textSecondary, fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },
    form: { width: '100%' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: SPACING.md,
        height: 60,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    inputIcon: { marginRight: SPACING.sm },
    input: { flex: 1, color: 'white', fontSize: 16 },
    saveBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    saveBtnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: 'white', fontSize: 18, fontWeight: '800' }
});

export default UsernameSetupScreen;
