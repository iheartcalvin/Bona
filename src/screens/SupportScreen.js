import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Clipboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { ChevronLeft, Info, Copy } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const SupportScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, 'system', 'config');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConfig(docSnap.data());
            } else {
                console.log("No config found");
            }
        } catch (error) {
            console.error("Error fetching config:", error);
            Alert.alert("Error", "Failed to load support information.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        Clipboard.setString(text);
        Alert.alert("Copied", "Text copied to clipboard!");
    };

    const shareQrCode = async () => {
        if (!config?.paymentQrUrl) return;

        try {
            const fileUri = FileSystem.documentDirectory + 'payment_qr.png';
            const { uri } = await FileSystem.downloadAsync(config.paymentQrUrl, fileUri);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Sharing not available", "Sharing is not supported on this device");
            }
        } catch (error) {
            console.error("Sharing error:", error);
            Alert.alert("Error", "Could not share the image.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={GRADIENTS.dark} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft color={COLORS.text} size={28} />
                        </TouchableOpacity>
                        <Text style={styles.screenTitle}>Support Us</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {!config?.paymentQrUrl ? (
                            <View style={styles.emptyContainer}>
                                <Info size={48} color={COLORS.textSecondary} />
                                <Text style={styles.emptyText}>Payment information is currently unavailable. Please check back later.</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.qrContainer}>
                                    <Text style={styles.scanTitle}>Scan to Pay</Text>
                                    <View style={styles.qrWrapper}>
                                        <Image
                                            source={{ uri: config.paymentQrUrl }}
                                            style={styles.qrImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </View>

                                {config.phoneNumber && (
                                    <View style={styles.infoSection}>
                                        <Text style={styles.infoLabel}>Or Pay via Phone Number / Lipa Namba</Text>
                                        <TouchableOpacity
                                            style={styles.copyRow}
                                            onPress={() => copyToClipboard(config.phoneNumber)}
                                        >
                                            <Text style={styles.phoneNumber}>{config.phoneNumber}</Text>
                                            <Copy size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {config.paymentInstructions && (
                                    <View style={styles.instructionSection}>
                                        <Text style={styles.infoLabel}>Instructions</Text>
                                        <View style={styles.instructionBox}>
                                            <Text style={styles.instructionText}>{config.paymentInstructions}</Text>
                                        </View>
                                    </View>
                                )}

                                <Text style={styles.disclaimer}>
                                    Thank you for supporting our engineers. Your contribution helps us maintain and improve Beloved.
                                </Text>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: Platform.OS === 'ios' ? 32 : 0 },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    content: { padding: SPACING.lg, paddingBottom: 50 },
    loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

    qrContainer: { alignItems: 'center', marginBottom: 32 },
    scanTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
    qrWrapper: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 24,
        width: 280,
        height: 280,
        elevation: 8,
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    qrImage: { width: '100%', height: '100%' },

    infoSection: { marginBottom: 24 },
    infoLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12 },
    copyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    phoneNumber: { fontSize: 20, fontWeight: '700', color: COLORS.primary },

    instructionSection: { marginBottom: 32 },
    instructionBox: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16 },
    instructionText: { color: COLORS.text, fontSize: 16, lineHeight: 24 },

    disclaimer: { textAlign: 'center', color: COLORS.textSecondary, opacity: 0.6, fontSize: 12 },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 22 }
});

export default SupportScreen;
