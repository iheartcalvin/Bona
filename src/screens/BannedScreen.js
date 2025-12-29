import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldAlert, Mail, LogOut, Send } from 'lucide-react-native';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const BannedScreen = () => {
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
        <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <ShieldAlert size={64} color={COLORS.error || '#FF4444'} />
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
                                <Mail size={20} color={COLORS.text} />
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
                                        placeholderTextColor={COLORS.textSecondary}
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
                                            <ActivityIndicator color={COLORS.text} />
                                        ) : (
                                            <>
                                                <Text style={styles.submitBtnText}>Submit Appeal</Text>
                                                <Send size={18} color={COLORS.text} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
                            <LogOut size={20} color={COLORS.textSecondary} />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { padding: SPACING.xl, alignItems: 'center', paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: SPACING.xxl },
    iconContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.3)'
    },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
    subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.lg },
    reasonBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: SPACING.md,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center'
    },
    reasonLabel: { color: COLORS.error || '#FF4444', fontWeight: '700', marginBottom: 4 },
    reasonText: { color: COLORS.text, fontSize: 16 },

    actions: { width: '100%', marginBottom: SPACING.xl },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: SPACING.md,
        borderRadius: 12
    },
    btnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: SPACING.xl },

    sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
    sectionDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md },

    form: { width: '100%' },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: SPACING.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minHeight: 120,
        marginBottom: SPACING.md
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: 12
    },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },

    successBox: {
        backgroundColor: 'rgba(75, 181, 67, 0.1)',
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(75, 181, 67, 0.3)'
    },
    successText: { color: '#4bb543', fontWeight: '600', marginBottom: 8 },
    linkText: { color: COLORS.primary, textDecorationLine: 'underline' },

    signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    signOutText: { color: COLORS.textSecondary, fontSize: 16 }
});

export default BannedScreen;
