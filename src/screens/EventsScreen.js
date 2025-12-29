import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Users, Coffee, Gift, X as CloseIcon, MapPin, Clock, Bell, Info, Copy, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

import NotificationBell from '../components/NotificationBell';

const EventsScreen = ({ navigation }) => {
    const [selectedEvent, setSelectedEvent] = React.useState(null);
    const [showDonateModal, setShowDonateModal] = React.useState(false);
    const [paymentConfig, setPaymentConfig] = React.useState(null);
    const [sponsors, setSponsors] = React.useState([]);
    const [charityEvents, setCharityEvents] = React.useState([]);
    const [devSupport, setDevSupport] = React.useState(null);
    const [selectedSponsor, setSelectedSponsor] = React.useState(null);

    const handleCopy = async (text) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied!', 'The number has been copied to your clipboard.', [
            { text: 'OK', style: 'default' }
        ]);
    };

    React.useEffect(() => {
        // Real-time listener for system config
        const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPaymentConfig(data);
                setDevSupport({
                    id: 'dev',
                    title: data.devSupportTitle || "Support the Vision",
                    description: data.devSupportDesc || "Help our engineers maintain and improve Beloved for everyone.",
                    goal: 1000000, // Goals could also be dynamic if needed, but keeping for now
                    raised: 450000,
                    location: "Spiritual Tech Team",
                    time: "Active Daily",
                    image: data.devSupportImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&auto=format&fit=crop',
                    showProgress: data.showDevProgress ?? false
                });
            }
        });

        // Real-time listener for charity events
        const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCharityEvents(list);
        });

        // Real-time listener for sponsors
        const sponsorsQuery = query(collection(db, 'sponsors'), orderBy('createdAt', 'desc'));
        const unsubSponsors = onSnapshot(sponsorsQuery, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSponsors(list);
        });

        return () => {
            unsubConfig();
            unsubEvents();
            unsubSponsors();
        };
    }, []);



    const getProgress = (raised, goal) => {
        return (raised / goal) * 100;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Act of Love</Text>
                        <Text style={styles.headerSubtitle}>Give and it shall be given unto you.</Text>
                    </View>
                    <NotificationBell color={COLORS.textSecondary} />
                </View>

                <Text style={styles.sectionTitle}>Charity Events</Text>
                {
                    charityEvents.map((event) => (
                        <View key={event.id} style={styles.eventCard}>
                            <Image source={{ uri: event.image }} style={styles.eventImage} />
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                <Text style={styles.eventDesc}>{event.description}</Text>

                                <View style={styles.progressSection}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${getProgress(event.raised, event.goal)}%` }]} />
                                    </View>
                                    <View style={styles.progressLabels}>
                                        <Text style={styles.progressText}>Raised: ${event.raised}</Text>
                                        <Text style={styles.progressText}>Goal: ${event.goal}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.donateButton}
                                    onPress={() => {
                                        setSelectedEvent(event);
                                        setShowDonateModal(true);
                                    }}
                                >
                                    <LinearGradient colors={GRADIENTS.warmth} style={styles.donateGradient}>
                                        <Heart color={COLORS.text} size={20} />
                                        <Text style={styles.donateText}>Donate Now</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                }

                <View style={styles.devSection}>
                    <LinearGradient colors={GRADIENTS.dark} style={styles.devGradient}>
                        <View style={styles.devHeader}>
                            <Coffee color={COLORS.accent} size={32} />
                            <Text style={styles.devTitle}>{devSupport?.title || "Support the Vision"}</Text>
                        </View>
                        <Text style={styles.devText}>{devSupport?.description || "Help our engineers maintain and improve Beloved for everyone."}</Text>
                        <TouchableOpacity
                            style={styles.devButton}
                            onPress={() => {
                                setSelectedEvent(devSupport);
                                setShowDonateModal(true);
                            }}
                        >
                            <Text style={styles.devButtonText}>Support Engineers</Text>
                            <Gift color={COLORS.accent} size={20} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </ScrollView >

            <Modal visible={showDonateModal} animationType="slide" presentationStyle="fullScreen">
                <LinearGradient colors={GRADIENTS.dark} style={styles.modalContainer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowDonateModal(false)}>
                                <CloseIcon color={COLORS.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.modalHeaderTitle}>Contribute</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScroll}>
                            {selectedEvent && (
                                <>
                                    <Image source={{ uri: selectedEvent.image }} style={styles.detailImage} />
                                    <View style={styles.detailBody}>
                                        <Text style={styles.detailTitle}>{selectedEvent.title}</Text>

                                        <View style={styles.metaRow}>
                                            <View style={styles.metaItem}>
                                                <MapPin size={16} color={COLORS.accent} />
                                                <Text style={styles.metaText}>{selectedEvent.location}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Clock size={16} color={COLORS.accent} />
                                                <Text style={styles.metaText}>{selectedEvent.time}</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.descriptionText}>{selectedEvent.description}</Text>

                                        <View style={styles.sponsorsSection}>
                                            <Text style={styles.sponsorsTitle}>Our Valued Sponsors</Text>
                                            {sponsors.length > 0 ? (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sponsorsList}>
                                                    {sponsors.map(sponsor => (
                                                        <TouchableOpacity
                                                            key={sponsor.id}
                                                            style={styles.sponsorCard}
                                                            onPress={() => setSelectedSponsor(sponsor)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <View style={styles.sponsorLogoWrapper}>
                                                                <Image source={{ uri: sponsor.logo }} style={styles.sponsorLogo} />
                                                            </View>
                                                            <Text style={styles.sponsorName}>{sponsor.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            ) : (
                                                <View style={styles.noSponsorsCard}>
                                                    <Heart size={20} color={COLORS.textSecondary} />
                                                    <Text style={styles.noSponsorsText}>Sponsors are the pillars of our mission.</Text>
                                                </View>
                                            )}
                                        </View>

                                        {selectedEvent.showProgress !== false && (
                                            <View style={styles.liveProgressCard}>
                                                <View style={styles.progressHeader}>
                                                    <Text style={styles.progressMainLabel}>Live Funding Progress</Text>
                                                    <Text style={styles.percentageText}>{Math.round(getProgress(selectedEvent.raised, selectedEvent.goal))}%</Text>
                                                </View>
                                                <View style={styles.fullProgressBar}>
                                                    <View style={[styles.fullProgressFill, { width: `${getProgress(selectedEvent.raised, selectedEvent.goal)}%` }]} />
                                                </View>
                                                <View style={styles.statsRow}>
                                                    <View>
                                                        <Text style={styles.statLabel}>Raised</Text>
                                                        <Text style={styles.statValue}>${selectedEvent.raised.toLocaleString()}</Text>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={styles.statLabel}>Goal</Text>
                                                        <Text style={styles.statValue}>${selectedEvent.goal.toLocaleString()}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.paymentSection}>
                                            <Text style={styles.paymentTitle}>Scan to Donate</Text>

                                            {paymentConfig?.paymentQrUrl ? (
                                                <View style={styles.qrDisplayContainer}>
                                                    <View style={styles.qrImageWrapper}>
                                                        <Image
                                                            source={{ uri: paymentConfig.paymentQrUrl }}
                                                            style={styles.qrImage}
                                                            resizeMode="contain"
                                                        />
                                                    </View>
                                                    {paymentConfig.paymentInstructions && (
                                                        <View style={styles.instructionsWrapper}>
                                                            <Text style={styles.instructionsTitle}>How to Pay:</Text>
                                                            <Text style={styles.instructionsText}>{paymentConfig.paymentInstructions}</Text>
                                                        </View>
                                                    )}
                                                    {paymentConfig.phoneNumber && (
                                                        <View style={styles.directPayInfo}>
                                                            <View>
                                                                <Text style={styles.directPayLabel}>Lipa Namba / Phone:</Text>
                                                                <Text style={styles.directPayValue}>{paymentConfig.phoneNumber}</Text>
                                                            </View>
                                                            <TouchableOpacity
                                                                style={styles.copyButton}
                                                                onPress={() => handleCopy(paymentConfig.phoneNumber)}
                                                            >
                                                                <Copy size={20} color={COLORS.primary} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <View style={styles.emptyContainer}>
                                                    <Info size={48} color={COLORS.textSecondary} />
                                                    <Text style={styles.emptyText}>Payment information is currently unavailable.</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>
            {/* Sponsor Info Modal */}
            <Modal
                visible={!!selectedSponsor}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedSponsor(null)}
            >
                <View style={styles.sponsorModalOverlay}>
                    <View style={styles.sponsorModalContent}>
                        <TouchableOpacity
                            style={styles.closeSponsorModal}
                            onPress={() => setSelectedSponsor(null)}
                        >
                            <CloseIcon size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {selectedSponsor && (
                            <View style={styles.sponsorDetails}>
                                <View style={styles.modalLogoWrapper}>
                                    <Image source={{ uri: selectedSponsor.logo }} style={styles.modalSponsorLogo} />
                                </View>
                                <Text style={styles.modalSponsorName}>{selectedSponsor.name}</Text>
                                <View style={styles.legitimacyBadge}>
                                    <ShieldCheck size={14} color={COLORS.primary} />
                                    <Text style={styles.legitimacyLabel}>Verified Sponsor</Text>
                                </View>
                                <ScrollView style={styles.sponsorBioScroll}>
                                    <Text style={styles.modalSponsorBio}>
                                        {selectedSponsor.description}
                                    </Text>
                                </ScrollView>
                                <TouchableOpacity
                                    style={styles.modalCloseBtn}
                                    onPress={() => setSelectedSponsor(null)}
                                >
                                    <Text style={styles.modalCloseBtnText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl
    },
    headerTitle: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
    headerSubtitle: { color: COLORS.textSecondary, fontSize: 16, marginTop: SPACING.xs },
    sectionTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: SPACING.md },
    eventCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    eventImage: { width: '100%', height: 200 },
    eventInfo: { padding: SPACING.lg },
    eventTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: SPACING.sm },
    eventDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: SPACING.lg },
    progressSection: { marginBottom: SPACING.lg },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    progressText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    donateButton: { borderRadius: 16, overflow: 'hidden' },
    donateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        gap: SPACING.sm
    },
    donateText: { color: 'white', fontWeight: '700', fontSize: 16 },
    devSection: { marginTop: SPACING.lg, marginBottom: SPACING.xl },
    devGradient: { padding: SPACING.xl, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,215,0,0.1)' },
    devHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
    devTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
    devText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: SPACING.xl },
    devButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.accent,
        padding: SPACING.md,
        borderRadius: 16,
        gap: SPACING.sm
    },
    devButtonText: { color: COLORS.accent, fontWeight: '700', fontSize: 16 },

    // Modal & Progress Styles
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: 60 },
    modalHeaderTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
    modalScroll: { paddingBottom: 40 },
    detailImage: { width: '100%', height: 250 },
    detailBody: { padding: SPACING.lg },
    detailTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
    descriptionText: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 24 },

    // Sponsors Styles
    sponsorsSection: { marginBottom: 32 },
    sponsorsTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
    sponsorsList: { gap: 16, paddingRight: 20 },
    sponsorCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 20,
        width: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 8
    },
    sponsorLogoWrapper: {
        width: 50,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    sponsorLogo: { width: '100%', height: '100%', resizeMode: 'contain' },
    sponsorName: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', textAlign: 'center' },
    noSponsorsCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 12
    },
    noSponsorsText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500', textAlign: 'center' },

    // Sponsor Modal Styles
    sponsorModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    sponsorModalContent: { backgroundColor: COLORS.surface, width: '100%', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', position: 'relative' },
    closeSponsorModal: { position: 'absolute', top: 20, right: 20, pdding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    sponsorDetails: { alignItems: 'center' },
    modalLogoWrapper: { width: 100, height: 100, backgroundColor: 'white', borderRadius: 24, padding: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    modalSponsorLogo: { width: '100%', height: '100%', resizeMode: 'contain' },
    modalSponsorName: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
    legitimacyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(108, 99, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 20 },
    legitimacyLabel: { color: COLORS.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    sponsorBioScroll: { maxHeight: 200, width: '100%', marginBottom: 24 },
    modalSponsorBio: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
    modalCloseBtn: { width: '100%', backgroundColor: COLORS.primary, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    modalCloseBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

    liveProgressCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    progressMainLabel: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    percentageText: { color: COLORS.secondary, fontSize: 20, fontWeight: '800' },
    fullProgressBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, marginBottom: 16 },
    fullProgressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 6 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },

    // Payment Styles
    paymentSection: { marginTop: 8 },
    paymentTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },

    // QR Display Styles
    qrDisplayContainer: { alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    qrPrompt: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
    qrImageWrapper: { padding: 12, backgroundColor: 'white', borderRadius: 16, width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    qrImage: { width: '100%', height: '100%' },
    instructionsWrapper: { width: '100%', marginBottom: 16 },
    instructionsTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    instructionsText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
    directPayInfo: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 },
    directPayLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    directPayValue: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
    copyButton: {
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(108, 99, 255, 0.2)'
    }
});

export default EventsScreen;
