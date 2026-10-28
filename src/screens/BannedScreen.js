import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldAlert, Mail, LogOut, Send } from 'lucide-react-native';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

const BannedScreen = () => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const { user, signOut } = useAuth();
    const [appealText, setAppealText] = useState('');
    const [sending, setSending] = useState(false);
    const [appealSent, setAppealSent] = useState(false);

    const handleContactSupport = () => {
        const subject = "Account Suspension Inquiry - " + (user?.uid || 'User');
        const body = "Dear Admin,\n\nI would like to discuss my account suspension.\n\nUser ID: " + (user?.uid) + "\nEmail: " + user?.email;
        Linking.openURL(`mailto:support@beloved.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    const handleSubmitAppeal = async () => {
        if (!appealText.trim()) {
            Alert.alert("Error", "Please explain why you believe this decision should be reversed.");
            return;
        }

        setSending(true);
        try {
            await addDoc(collection(db, 'appeals'), {
                uid: user.uid,
                email: user.email,
                reason: appealText,
                status: 'pending',
                createdAt: serverTimestamp(),
                userDisplayName: user.displayName || 'Unknown'
            });
            setAppealSent(true);
            setAppealText('');
            Alert.alert("Appeal Submitted", "Your appeal has been received. Our team will review it shortly.");
        } catch (error) {
            console.error("Error submitting appeal:", error);
            Alert.alert("Error", "Failed to submit appeal. Please try contacting support directly.");
        } finally {
            setSending(false);
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <ShieldAlert size={64} color={colors.error} />
                            </View>
                            <Text style={styles.title}>Account Suspended</Text>
                            <Text style={styles.subtitle}>
                                Your account has been suspended due to a violation of our Terms of Service or Community Guidelines.
                            </Text>

                            {user?.banReason && (
                                <View style={styles.reasonBox}>
                                    <Text style={styles.reasonLabel}>Reason:</Text>
                                    <Text style={styles.reasonText}>{user.banReason}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.contactBtn} onPress={handleContactSupport}>
                                <Mail size={20} color={colors.text} />
                                <Text style={styles.btnText}>Contact Support</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>Submit an Appeal</Text>
                            <Text style={styles.sectionDesc}>
                                If you believe this is a mistake, please let us know.
                            </Text>

                            {appealSent ? (
                                <View style={styles.successBox}>
                                    <Text style={styles.successText}>Appeal submitted successfully.</Text>
                                    <TouchableOpacity onPress={() => setAppealSent(false)}>
                                        <Text style={styles.linkText}>Submit another information</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.form}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Explain your case..."
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={4}
                                        value={appealText}
                                        onChangeText={setAppealText}
                                        textAlignVertical="top"
                                    />
                                    <TouchableOpacity
                                        style={[styles.submitBtn, sending && styles.disabledBtn]}
                                        onPress={handleSubmitAppeal}
                                        disabled={sending}
                                    >
                                        {sending ? (
                                            <ActivityIndicator color={colors.text} />
                                        ) : (
                                            <>
                                                <Text style={styles.submitBtnText}>Submit Appeal</Text>
                                                <Send size={18} color={colors.text} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
                            <LogOut size={20} color={colors.textSecondary} />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { padding: SPACING.xl, alignItems: 'center', paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: SPACING.xxl },
    iconContainer: {
        width: 100,
        height: 100,
        backgroundColor: colors.surface,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: SPACING.sm, textAlign: 'center' },
    subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.lg },
    reasonBox: {
        backgroundColor: colors.surface,
        padding: SPACING.md,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    reasonLabel: { color: colors.error, fontWeight: '700', marginBottom: 4 },
    reasonText: { color: colors.text, fontSize: 16 },

    actions: { width: '100%', marginBottom: SPACING.xl },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: colors.surface,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    btnText: { color: colors.text, fontSize: 16, fontWeight: '600' },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: SPACING.xl },

    sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: SPACING.xs },
    sectionDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: SPACING.md },

    form: { width: '100%' },
    input: {
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        padding: SPACING.md,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        minHeight: 120,
        marginBottom: SPACING.md
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: colors.primary,
        padding: SPACING.md,
        borderRadius: 12
    },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

    successBox: {
        backgroundColor: colors.surface,
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.success
    },
    successText: { color: colors.success, fontWeight: '600', marginBottom: 8 },
    linkText: { color: colors.primary, textDecorationLine: 'underline' },

    signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    signOutText: { color: colors.textSecondary, fontSize: 16 }
});

export default BannedScreen;
