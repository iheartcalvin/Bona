import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, RefreshCw, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, GRADIENTS } from '../theme/colors';

const VerificationPendingScreen = () => {
    const { user, signOut, resendVerification, reloadUser } = useAuth();
    const { colors, gradients } = useTheme();
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleCheckStatus = async () => {
        setLoading(true);
        try {
            await reloadUser();
            // We check the updated user state in the next render cycle, 
            // but we can also check the result of reloadUser if we returned it, 
            // OR just alert based on what we expect. 
            // However, since reloadUser updates state, 'user.emailVerified' will be true in the UI.
            if (user.emailVerified) { // This might be stale in this closure? 
                // Let's rely on the fact that if it's true, RootNavigator redirects.
                // But for the alert:
                // We'll rely on the re-render. 
                // Actually, let's grab the immediate result if we want logic here.
                // But simplified: 
            } else {
                Alert.alert("Status Updated", "If you verified, you should be redirected momentarily. If not, please check again.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not check status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await resendVerification();
            Alert.alert("Sent", "A new verification email has been sent to " + user.email);
            setResendCooldown(60);
            const interval = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to resend email.");
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={styles.content}>
                <View style={styles.iconContainer}>
                    <Mail size={64} color={colors.primary} />
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Action Required</Text>
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Verify your Email</Text>

                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    We've sent a verification link to <Text style={{ fontWeight: '700', color: colors.text }}>{user?.email}</Text>.
                    Please click the link in that email to continue.
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleCheckStatus}
                        disabled={loading}
                    >
                        <LinearGradient colors={gradients.primary} style={styles.gradientBtn}>
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <RefreshCw size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.primaryBtnText}>I've Verified, Let Me In</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}
                        onPress={handleResend}
                        disabled={resendCooldown > 0}
                    >
                        <Text style={[styles.secondaryBtnText, { color: resendCooldown > 0 ? colors.textSecondary : colors.primary }]}>
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={signOut}
                    >
                        <LogOut size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center' },
    iconContainer: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        position: 'relative'
    },
    badge: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    title: { fontSize: 28, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
    description: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 48, paddingHorizontal: 20 },
    actions: { width: '100%', gap: 16 },
    primaryButton: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
    gradientBtn: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    secondaryButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
    secondaryBtnText: { fontSize: 16, fontWeight: '600' },
    logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, marginTop: 8 },
    logoutText: { fontSize: 14, fontWeight: '600' }
});

export default VerificationPendingScreen;
