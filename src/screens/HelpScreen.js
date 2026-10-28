import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { ChevronLeft, Mail, Phone, ExternalLink, HelpCircle, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const FAQItem = ({ question, answer, colors, styles }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <TouchableOpacity
            style={styles.faqItem} // Note: This will need styles passed or handled via useTheme inside if needed, but for now we fix the prop
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <ChevronRight
                    size={20}
                    color={colors.primary}
                    style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
                />
            </View>
            {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
        </TouchableOpacity>
    );
};

const HelpScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
            }
        } catch (error) {
            console.error("Error fetching help config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = () => {
        const email = config?.adminEmail || 'support@beloved.app';
        Linking.openURL(`mailto:${email}`);
    };

    const handleCall = () => {
        const phone = config?.phoneNumber || '';
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert("Not available", "Phone support is currently unavailable.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const faqs = [
        {
            question: "How do I join a Space?",
            answer: "Go to the 'Spaces' tab, browse available active groups, and click 'Join Space' to enter the live study session."
        },
        {
            question: "Is the app free to use?",
            answer: "Yes, Beloved is completely free for everyone. We are supported by community donations."
        },
        {
            question: "How can I support the mission?",
            answer: "You can contribute by going to the 'Events' tab and selecting 'Support the Vision' or participating in charity events."
        },
        {
            question: "Can I read the Bible offline?",
            answer: "Bible text is currently fetched online to ensure you always have the latest versions and study aids."
        }
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradients.background} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft color={colors.text} size={28} />
                        </TouchableOpacity>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={{ width: 110, height: 35, resizeMode: 'contain' }}
                        />
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.contactSection}>
                            <Text style={styles.sectionTitle}>Contact Admin</Text>
                            <View style={styles.contactCards}>
                                <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(108, 99, 255, 0.1)' }]}>
                                        <Mail color={colors.primary} size={24} />
                                    </View>
                                    <Text style={styles.contactLabel}>Email Us</Text>
                                    <Text style={styles.contactValue} numberOfLines={1}>{config?.adminEmail || 'support@beloved.app'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                        <Phone color={colors.success} size={24} />
                                    </View>
                                    <Text style={styles.contactLabel}>Call Support</Text>
                                    <Text style={styles.contactValue}>{config?.phoneNumber || 'Available via App'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.faqSection}>
                            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                            <View style={styles.faqList}>
                                {faqs.map((faq, index) => (
                                    <FAQItem key={index} question={faq.question} answer={faq.answer} colors={colors} styles={styles} />
                                ))}
                            </View>
                        </View>

                        <View style={styles.linksSection}>
                            <Text style={styles.sectionTitle}>Resources</Text>
                            <TouchableOpacity style={styles.resourceLink} onPress={() => Linking.openURL('https://beloved.app/guide')}>
                                <View style={styles.resourceContent}>
                                    <HelpCircle size={20} color={colors.primary} />
                                    <Text style={styles.resourceText}>User Guide & Tutorials</Text>
                                </View>
                                <ExternalLink size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.footerText}>Beloved App Version 1.0.0</Text>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: Platform.OS === 'ios' ? 32 : 0 },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    screenTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    content: { padding: SPACING.lg, paddingBottom: 50 },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },

    contactSection: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
    contactCards: { flexDirection: 'row', gap: 12 },
    contactCard: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        minWidth: '45%'
    },
    iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    contactLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    contactValue: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },

    faqSection: { marginBottom: 32 },
    faqList: { gap: 12 },
    faqItem: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 10 },
    faqAnswer: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 12 },

    linksSection: { marginBottom: 32 },
    resourceLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    resourceContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    resourceText: { color: colors.text, fontSize: 15, fontWeight: '600' },

    footerText: { textAlign: 'center', color: colors.textSecondary, opacity: 0.4, fontSize: 12, marginTop: 20 }
});

export default HelpScreen;
