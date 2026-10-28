import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CreditCard, ChevronRight, Phone } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, GRADIENTS } from '../theme/colors';
import { ClickPesaService } from '../services/ClickPesaService';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const PaymentScreen = ({ navigation, route }) => {
    const { colors, gradients } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

    // Route params for context (Donation, Support, etc.)
    const {
        title = "Make Payment",
        description = "Secure mobile money payment",
        referencePrefix = "PAYMENT-",
        fixedAmount = null
    } = route.params || {};

    const [amount, setAmount] = useState(fixedAmount ? fixedAmount.toString() : '');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!amount) {
            Alert.alert('Missing Details', 'Please enter an amount');
            return;
        }

        setLoading(true);
        try {
            // Ensure alphanumeric reference
            const cleanPrefix = referencePrefix.replace(/[^a-zA-Z0-9]/g, '');
            const checkoutUrl = await ClickPesaService.getCheckoutUrl({
                amount: parseFloat(amount),
                reference: `${cleanPrefix}${Date.now()}`
            });

            // Check if checkoutUrl is a string (URL) or object
            const urlToOpen = typeof checkoutUrl === 'string' ? checkoutUrl : checkoutUrl.url || checkoutUrl.link;

            if (urlToOpen && (urlToOpen.startsWith('http') || urlToOpen.startsWith('https'))) {
                const supported = await Linking.canOpenURL(urlToOpen);
                if (supported) {
                    await Linking.openURL(urlToOpen);
                    Alert.alert('Payment Initiated', 'You have been redirected to the secure payment page.');
                    navigation.goBack();
                } else {
                    Alert.alert('Error', 'Cannot open payment link.');
                }
            } else {
                Alert.alert('Error', 'Invalid payment URL received.');
                console.error("Invalid URL:", checkoutUrl);
            }

        } catch (error) {
            Alert.alert('Payment Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color={colors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.content}>

                        <Text style={styles.description}>{description}</Text>

                        {/* Amount Section */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Amount (TZS)</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.currency}>Tsh</Text>
                                <TextInput
                                    style={styles.inputAmount}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    editable={!fixedAmount} // Disable if fixed amount passed
                                />
                            </View>
                        </View>

                        <View style={styles.infoBox}>
                            <CreditCard color={colors.primary} size={24} style={{ marginBottom: 8 }} />
                            <Text style={styles.infoText}>You will be redirected to a secure hosted page to complete your payment via Mobile Money or Card.</Text>
                        </View>

                    </ScrollView>

                    {/* Footer Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={loading}>
                            <LinearGradient colors={GRADIENTS.divine} style={styles.gradientBtn}>
                                {loading ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <Text style={styles.payButtonText}>Pay Tsh {amount || '0'}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const createStyles = (colors, insets) => StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: SPACING.lg },
    backBtn: { padding: 8, marginLeft: -8 }, // Negative margin to align icon visually if needed, or just keep as is. Let's just adjust padding.
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    description: { fontSize: 16, color: colors.textSecondary, marginBottom: 20, textAlign: 'center', paddingHorizontal: 16 }, // Added inner padding for text readability
    content: { paddingHorizontal: 32, paddingBottom: 32 },
    section: { marginBottom: SPACING.xl },
    label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: SPACING.sm },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg || colors.surface,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: colors.cardBorder || 'transparent'
    },
    currency: { fontSize: 18, fontWeight: '700', color: colors.text, marginRight: SPACING.sm },
    inputAmount: { flex: 1, fontSize: 24, fontWeight: '700', color: colors.text },
    infoBox: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder || 'transparent',
        marginTop: SPACING.md
    },
    infoText: {
        color: colors.text,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, SPACING.lg) : SPACING.lg,
        paddingTop: SPACING.lg
    },
    payButton: { borderRadius: 16, overflow: 'hidden', elevation: 5 },
    gradientBtn: { height: 56, justifyContent: 'center', alignItems: 'center' },
    payButtonText: { fontSize: 18, fontWeight: '800', color: 'black' }
});

export default PaymentScreen;
