import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { ChevronLeft, Shield, FileText } from 'lucide-react-native';

const LegalScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'privacy'

    const terms = `
1. ACCEPTANCE OF TERMS
By accessing and using Beloved, you accept and agree to be bound by these Terms of Service.

2. USER CONDUCT
Users agree to use the app for spiritual growth and community building. Any form of harassment or offensive behavior in Spaces is strictly prohibited.

3. PRIVACY & DATA
We value your privacy. Your data is used only to personalize your experience and facilitate community features like Fellowship.

4. CONTENT
All Bible versions and spiritual content provided are for personal use. Users are responsible for the content they share in Spaces.

5. DONATIONS
Contributions made through Beloved are voluntary and support the maintenance and charity missions described in the app.
    `;

    const privacy = `
1. DATA COLLECTION
We collect minimal data: name, email, and profile preferences to provide the spiritual experience.

2. SECURITY
We implement industry-standard security measures to protect your personal information.

3. THIRD-PARTY SERVICES
We use Firebase for authentication and database management, and Agora for live voice communication.

4. USER CONTROL
You have full control over your profile visibility and can update your settings at any time in the Profile section.

5. UPDATES
We may update this policy periodically. Your continued use of the app signifies acceptance of any changes.
    `;

    return (
        <View style={styles.container}>
            <LinearGradient colors={GRADIENTS.dark} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ChevronLeft color={COLORS.text} size={28} />
                        </TouchableOpacity>
                        <Text style={styles.screenTitle}>Legal Regulations</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.tabBar}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
                            onPress={() => setActiveTab('terms')}
                        >
                            <FileText size={18} color={activeTab === 'terms' ? COLORS.primary : COLORS.textSecondary} />
                            <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>Terms</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
                            onPress={() => setActiveTab('privacy')}
                        >
                            <Shield size={18} color={activeTab === 'privacy' ? COLORS.primary : COLORS.textSecondary} />
                            <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>Privacy</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.legalBox}>
                            <Text style={styles.legalTitle}>
                                {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                            </Text>
                            <Text style={styles.legalText}>
                                {activeTab === 'terms' ? terms : privacy}
                            </Text>
                        </View>

                        <Text style={styles.lastUpdated}>Last Updated: December 2025</Text>
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

    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: 12,
        marginBottom: 16
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    activeTab: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(108, 99, 255, 0.1)'
    },
    tabText: { color: COLORS.textSecondary, fontWeight: '600' },
    activeTabText: { color: COLORS.primary },

    content: { padding: SPACING.lg, paddingBottom: 50 },
    legalBox: {
        backgroundColor: COLORS.surface,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    legalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
    legalText: { color: COLORS.textSecondary, fontSize: 16, lineHeight: 26 },
    lastUpdated: { textAlign: 'center', color: COLORS.textSecondary, opacity: 0.4, fontSize: 12, marginTop: 32 }
});

export default LegalScreen;
