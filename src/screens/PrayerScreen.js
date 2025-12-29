import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Bell, Plus, ChevronRight, X, Play, Pause, CheckCircle2, Mic2, Heart, Share2, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { AIService } from '../services/aiService';


import { auth } from '../services/firebaseConfig';
import { UserService } from '../services/userService';
import { SpaceService } from '../services/SpaceService';
import { WordOfDayService } from '../services/WordOfDayService';
import AddPrayerModal from '../components/AddPrayerModal';
import NotificationBell from '../components/NotificationBell';

const PrayerScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [prayerSchedule, setPrayerSchedule] = useState([]);
    const [prayerHistory, setPrayerHistory] = useState([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [wod, setWod] = useState({
        text: "The Lord is my light and my salvation—whom shall I fear?",
        ref: "Psalm 27:1",
        book: "Psalm",
        chapter: "27:1"
    });
    const [loadingWod, setLoadingWod] = useState(true);

    const WOD_TEXT = wod.text;
    const WOD_REF = wod.ref;
    const WOD_BOOK = wod.book;
    const WOD_CHAPTER = wod.chapter;
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [aiVoiceActive, setAiVoiceActive] = useState(false);
    const [generatedPrayer, setGeneratedPrayer] = useState(null);
    const [selectedPrayer, setSelectedPrayer] = useState(null);
    const [prayerToSchedule, setPrayerToSchedule] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const categories = ['Healing', 'Wisdom', 'Strength', 'Gratitude'];

    const upcomingPrayerText = "Heavenly Father, I come before You today seeking Your divine peace for my well-being. Please guide my thoughts toward tranquility, strengthen my body with Your healing presence, and remind me that Your love is the ultimate source of health and wholeness. Let Your grace overflow in my life, restoring my soul and granting me the resilience to face any challenge. Amen.";

    const handleGeneratePrayer = async (category = 'Wisdom') => {
        setLoading(true);
        try {
            const prayer = await AIService.generatePrayer(category);
            setGeneratedPrayer({ category, text: prayer });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneratedPrayer = async () => {
        if (!user || !generatedPrayer) return;
        setLoading(true);
        try {
            await UserService.markPrayerComplete(user.uid, {
                title: `${generatedPrayer.category} Prayer`,
                category: generatedPrayer.category,
                text: generatedPrayer.text,
                type: 'AI Generated',
                duration: "1 min"
            });
            Alert.alert("Saved", "Prayer saved to your history.");
            setGeneratedPrayer(null);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not save prayer.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveScheduledPrayer = async (newPrayer) => {
        if (!user) return;
        try {
            await UserService.addScheduledPrayer(user.uid, newPrayer);
            setShowAddModal(false);
            setPrayerToSchedule(null);
            Alert.alert("Success", "Prayer scheduled successfully.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not schedule prayer.");
        }
    };

    const handleOpenSchedule = (prayer) => {
        setPrayerToSchedule(prayer);
        setShowAddModal(true);
    };

    useEffect(() => {
        const fetchWOD = async () => {
            try {
                const daily = await WordOfDayService.getDailyVerse();
                setWod(daily);
            } catch (error) {
                console.error("Failed to load WOD", error);
            } finally {
                setLoadingWod(false);
            }
        };

        const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchWOD();
                const unsubSchedule = UserService.subscribeToPrayerSchedule(currentUser.uid, setPrayerSchedule);
                const unsubHistory = UserService.subscribeToPrayerHistory(currentUser.uid, 5, setPrayerHistory);

                return () => {
                    unsubSchedule();
                    unsubHistory();
                };
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const getNotificationCount = () => {
        let count = 0;
        if (userNotifications) count += userNotifications.filter(n => !n.read).length;
        if (activeSpaces) count += activeSpaces.length;

        if (prayerSchedule) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const parseTimeToMinutes = (timeStr) => {
                if (!timeStr) return -1;
                const [time, modifier] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (modifier) {
                    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
                }
                return hours * 60 + minutes;
            };

            prayerSchedule.forEach(item => {
                const prayerMinutes = parseTimeToMinutes(item.time);
                if (prayerMinutes < currentMinutes && (currentMinutes - prayerMinutes) > 15) {
                    count++;
                } else if (prayerMinutes > currentMinutes && (prayerMinutes - currentMinutes) <= 60) {
                    count++;
                }
            });
        }
        return count;
    };

    // Logic to find upcoming prayer
    const getUpcomingSession = () => {
        if (!prayerSchedule || prayerSchedule.length === 0) return null;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Parse "HH:mm" or "hh:mm AM/PM" to minutes
        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr) return -1;
            // distinct handling for AM/PM vs 24h if needed, but assuming consistent format is best.
            // Let's handle standard "HH:mm" or "HH:mm AM/PM" loosely
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier) {
                if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            return hours * 60 + minutes;
        };

        // Find the first prayer that is later than now
        const nextPrayer = prayerSchedule.find(p => parseTimeToMinutes(p.time) > currentMinutes);

        // If we found one later today, return it.
        // If not (all passed for today), return the first one (tomorrow morning).
        return nextPrayer || prayerSchedule[0];
    };

    const upcomingSession = getUpcomingSession();
    const displayUpcomingTime = upcomingSession ? upcomingSession.time : "18:00";
    const displayUpcomingTitle = upcomingSession ? upcomingSession.title : "Evening Prayer";
    const displayUpcomingCategory = upcomingSession ? upcomingSession.category : "Well being";

    const handleCompleteSession = async () => {
        if (!user) return;

        try {
            await UserService.markPrayerComplete(user.uid, {
                title: upcomingSession ? upcomingSession.title : "Live Session",
                category: upcomingSession ? upcomingSession.category : "General",
                duration: "15 min", // Mock duration for now
            });
            Alert.alert("Prayer Completed", "May God answer your heart's desires.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not save progress");
        }

        setShowSessionModal(false);
        setSessionActive(false);
        setAiVoiceActive(false);
    };

    const wordOfDayRef = useRef();

    const handleShareWord = async () => {
        try {
            const uri = await captureRef(wordOfDayRef, {
                format: 'png',
                quality: 1,
            });
            await shareAsync(uri);
        } catch (error) {
            console.error("Error sharing word of day:", error);
            Alert.alert("Error", "Could not share at this time.");
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Prayers</Text>
                    <NotificationBell color={COLORS.textSecondary} />
                </View>

                <TouchableOpacity
                    style={styles.aiButton}
                    onPress={() => handleGeneratePrayer()}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={GRADIENTS.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.aiGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.text} />
                        ) : (
                            <>
                                <Sparkles color={COLORS.text} size={24} />
                                <Text style={styles.aiButtonText}>Generate AI Prayer</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={styles.categoryCard}
                            onPress={() => handleGeneratePrayer(cat)}
                        >
                            <Text style={styles.categoryText}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Upcoming Session</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ScheduledPrayers')}>
                        <Text style={styles.seeAllText}>See All Schedule</Text>
                    </TouchableOpacity>
                </View>
                {upcomingSession ? (
                    <TouchableOpacity style={styles.upcomingCard} onPress={() => setShowSessionModal(true)}>
                        <Text style={styles.upcomingLabel}>Upcoming Prayer session</Text>
                        <View style={styles.upcomingTimeRow}>
                            <View style={styles.upcomingIconRing}>
                                <View style={styles.upcomingIconInner} />
                            </View>
                            <Text style={styles.upcomingTimeText}>{displayUpcomingTime} - <Text style={{ fontWeight: '700' }}>{displayUpcomingCategory}</Text></Text>
                        </View>
                        <Text style={styles.upcomingTapHint}>Tap to view prayers</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.upcomingCard, { justifyContent: 'center', alignItems: 'center' }]} onPress={() => setShowAddModal(true)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                                <Plus color={COLORS.text} size={24} />
                            </View>
                            <View>
                                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>Add Scheduled Prayer</Text>
                                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Stay consistent with your spiritual goals</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                <Text style={styles.sectionTitle}>Recent Prayers</Text>
                {prayerHistory.length > 0 ? (
                    prayerHistory.map((item, idx) => (
                        <TouchableOpacity key={idx} style={styles.prayerItem} onPress={() => setSelectedPrayer(item)}>
                            <View style={styles.prayerLeft}>
                                <View style={[styles.categoryIndicator, { backgroundColor: item.category === 'Gratitude' ? COLORS.accent : item.category === 'Strength' ? COLORS.secondary : COLORS.success }]} />
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={styles.prayerTitle}>{item.title}</Text>
                                    {item.text && (
                                        <Text style={styles.prayerPreview} numberOfLines={2}>
                                            "{item.text}"
                                        </Text>
                                    )}
                                    <Text style={styles.prayerDate}>
                                        {/* Simple Date Formatting */}
                                        {new Date(item.completedAt?.toDate?.() || item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight color={COLORS.textSecondary} size={20} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={{ color: COLORS.textSecondary, marginBottom: 20 }}>No recent prayers yet.</Text>
                )}
                <Text style={styles.expirationWarning}>Recent prayers are automatically cleared after 7 days.</Text>

                <View style={styles.wordOfDayCard}>
                    {loadingWod ? (
                        <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.shareWordBtn} onPress={() => setShowShareModal(true)}>
                                <Share2 color={COLORS.accent} size={20} />
                            </TouchableOpacity>
                            <Text style={styles.wordOfDayLabel}>Word of the Day</Text>
                            <Text style={styles.wordOfDayText}>"{WOD_TEXT}"</Text>
                            <Text style={styles.wordOfDayRef}>{WOD_REF}</Text>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Share Card Modal - Matches BibleScreen Design */}
            <Modal visible={showShareModal} animationType="fade" presentationStyle="fullScreen">
                <LinearGradient colors={GRADIENTS.dark} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <SafeAreaView style={{ width: '100%', height: '100%', alignItems: 'center' }}>
                        <View style={{ width: '100%', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => setShowShareModal(false)}>
                                <X color={COLORS.text} size={28} />
                            </TouchableOpacity>
                            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700' }}>Share Word</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View
                                ref={wordOfDayRef}
                                collapsable={false}
                                style={{ margin: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}
                            >
                                <LinearGradient
                                    colors={GRADIENTS.primary}
                                    style={{
                                        padding: 40,
                                        borderRadius: 20,
                                        width: 340,
                                        minHeight: 400,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                                        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center', fontFamily: 'serif' }}>
                                            {WOD_BOOK}
                                        </Text>
                                        <Text style={{ color: 'white', fontSize: 14, opacity: 0.8, letterSpacing: 3, fontWeight: '600' }}>
                                            CHAPTER {WOD_CHAPTER}
                                        </Text>
                                    </View>

                                    <View style={{ marginBottom: 40 }}>
                                        <Text style={{ color: 'white', fontSize: 22, lineHeight: 36, textAlign: 'center', fontStyle: 'italic', fontWeight: '500' }}>
                                            "{WOD_TEXT}"
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 'auto', opacity: 0.9 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white', marginRight: 10 }} />
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Beloved App</Text>
                                    </View>
                                </LinearGradient>
                            </View>
                        </View>

                        <View style={{ padding: 30, width: '100%' }}>
                            <TouchableOpacity
                                style={{ backgroundColor: COLORS.primary, padding: 20, borderRadius: 30, alignItems: 'center', marginBottom: 20 }}
                                onPress={handleShareWord}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Share Image</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

            {/* AI Generation Modal */}
            <Modal visible={!!generatedPrayer} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{generatedPrayer?.category} Prayer</Text>
                            <TouchableOpacity onPress={() => setGeneratedPrayer(null)}>
                                <X color={COLORS.textSecondary} size={24} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400, marginBottom: SPACING.lg }}>
                            <Text style={styles.generatedText}>{generatedPrayer?.text}</Text>
                        </ScrollView>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGeneratedPrayer}>
                            {loading ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.saveButtonText}>Save to My Prayers</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* View Saver Prayer Details Modal */}
            <Modal visible={!!selectedPrayer} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedPrayer?.title || 'Prayer Details'}</Text>
                            <TouchableOpacity onPress={() => setSelectedPrayer(null)}>
                                <X color={COLORS.textSecondary} size={24} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400, marginBottom: SPACING.lg }}>
                            <Text style={styles.generatedText}>{selectedPrayer?.text || selectedPrayer?.content || 'No content available.'}</Text>
                        </ScrollView>
                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: COLORS.secondary, marginBottom: 10 }]} onPress={() => {
                            const p = selectedPrayer;
                            setSelectedPrayer(null);
                            setTimeout(() => handleOpenSchedule(p), 100);
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Clock size={20} color={COLORS.text} />
                                <Text style={styles.saveButtonText}>Schedule this Prayer</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setSelectedPrayer(null)}>
                            <Text style={styles.saveButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Active Prayer Session Modal */}
            <Modal visible={showSessionModal} transparent={false} animationType="slide">
                <LinearGradient colors={GRADIENTS.dark} style={styles.sessionModal}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.sessionHeader}>
                            <TouchableOpacity onPress={() => {
                                setShowSessionModal(false);
                                setSessionActive(false);
                                setAiVoiceActive(false);
                            }}>
                                <X color={COLORS.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.sessionTitle}>Live Prayer</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.sessionContent}>
                            <View style={styles.sessionSubjectBadge}>
                                <Heart size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
                                <Text style={styles.sessionSubjectText}>Well-being & Wholeness</Text>
                            </View>

                            <Text style={styles.sessionPrayerText}>{upcomingPrayerText}</Text>

                            <View style={styles.sessionControls}>
                                <TouchableOpacity
                                    style={[styles.aiVoiceBtn, aiVoiceActive && styles.aiVoiceBtnActive]}
                                    onPress={() => setAiVoiceActive(!aiVoiceActive)}
                                >
                                    {aiVoiceActive ? <Pause size={24} color={COLORS.text} /> : <Play size={24} color={COLORS.text} />}
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.aiVoiceTitle}>AI Voice Follow-through</Text>
                                        <Text style={styles.aiVoiceStatus}>{aiVoiceActive ? 'Playing Voice Guide...' : 'Tap to start audio guide'}</Text>
                                    </View>
                                </TouchableOpacity>

                                {!sessionActive ? (
                                    <TouchableOpacity style={styles.startPrayingBtn} onPress={() => setSessionActive(true)}>
                                        <LinearGradient colors={GRADIENTS.primary} style={styles.startPrayingGradient}>
                                            <Mic2 size={24} color={COLORS.text} style={{ marginRight: 10 }} />
                                            <Text style={styles.startPrayingText}>Start Personal Prayer</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.activeSessionContainer}>
                                        <LinearGradient colors={['rgba(108, 99, 255, 0.1)', 'rgba(79, 70, 229, 0.1)']} style={styles.prayingActiveIndicator}>
                                            <ActivityIndicator color={COLORS.primary} size="large" />
                                            <Text style={styles.prayingActiveText}>You are currently praying...</Text>
                                            <Text style={styles.prayingActiveSub}>Take your time, God is listening.</Text>
                                        </LinearGradient>

                                        <TouchableOpacity
                                            style={styles.doneBtn}
                                            onPress={handleCompleteSession}
                                        >
                                            <LinearGradient colors={GRADIENTS.primary} style={styles.doneGradient}>
                                                <CheckCircle2 size={24} color={COLORS.text} style={{ marginRight: 10 }} />
                                                <Text style={styles.doneText}>Finish & Return</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

            <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
                <LinearGradient colors={GRADIENTS.warmth} style={styles.fabGradient}>
                    <Plus color={COLORS.text} size={32} />
                </LinearGradient>
            </TouchableOpacity>
            <AddPrayerModal
                visible={showAddModal}
                onClose={() => { setShowAddModal(false); setPrayerToSchedule(null); }}
                onSave={handleSaveScheduledPrayer}
                initialData={prayerToSchedule}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
    headerTitle: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
    aiButton: { marginBottom: SPACING.xl, borderRadius: 20, overflow: 'hidden', elevation: 10 },
    aiGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        gap: SPACING.md,
        minHeight: 80
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md
    },
    seeAllText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700'
    },
    aiButtonText: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
    sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: SPACING.md },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
    categoryCard: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 16,
        minWidth: '45%',
        alignItems: 'center'
    },
    categoryText: { color: COLORS.text, fontWeight: '600' },
    upcomingCard: {
        backgroundColor: COLORS.surface,
        padding: 24,
        borderRadius: 28,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center'
    },
    upcomingLabel: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    upcomingTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    upcomingIconRing: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 4,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    upcomingIconInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: COLORS.primary,
        opacity: 0.3
    },
    upcomingTimeText: { color: COLORS.text, fontSize: 26, fontWeight: '300' },
    upcomingTapHint: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500', opacity: 0.7 },
    prayerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 18,
        borderRadius: 20,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    categoryIndicator: { width: 4, height: 30, borderRadius: 2 },
    prayerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
    prayerPreview: { color: COLORS.textSecondary, fontSize: 14, fontStyle: 'italic', marginVertical: 4, opacity: 0.8 },
    prayerDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
    wordOfDayCard: {
        marginTop: SPACING.xl,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        padding: SPACING.lg,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        alignItems: 'center'
    },
    wordOfDayLabel: { color: COLORS.accent, fontWeight: '800', fontSize: 14, marginBottom: SPACING.sm, textTransform: 'uppercase' },
    wordOfDayText: { color: COLORS.text, fontSize: 18, textAlign: 'center', fontStyle: 'italic', lineHeight: 26 },
    wordOfDayRef: { color: COLORS.accent, marginTop: SPACING.sm, fontWeight: '700' },
    shareWordBtn: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20
    },
    fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 30, elevation: 8 },
    fabGradient: { padding: SPACING.md, borderRadius: 30, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', padding: SPACING.xl, zIndex: 1000 },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: 30, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    modalTitle: { color: COLORS.accent, fontSize: 20, fontWeight: '700' },
    generatedText: { color: COLORS.text, fontSize: 18, lineHeight: 28, fontStyle: 'italic', marginBottom: SPACING.xl },
    saveButton: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 16, alignItems: 'center' },
    saveButtonText: { color: COLORS.text, fontWeight: '700', fontSize: 16 },

    // Session Modal Styles
    sessionModal: { flex: 1 },
    sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: Platform.OS === 'ios' ? 50 : 0 },
    sessionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
    sessionContent: { padding: 24, alignItems: 'center' },
    sessionSubjectBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 101, 132, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 101, 132, 0.2)'
    },
    sessionSubjectText: { color: COLORS.secondary, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
    sessionPrayerText: { color: COLORS.text, fontSize: 22, lineHeight: 36, textAlign: 'center', fontStyle: 'italic', marginBottom: 48, fontWeight: '300' },
    sessionControls: { width: '100%', gap: 20 },
    aiVoiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    aiVoiceBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(108, 99, 255, 0.1)' },
    aiVoiceTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    aiVoiceStatus: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    startPrayingBtn: { borderRadius: 24, overflow: 'hidden', elevation: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    startPrayingGradient: { height: 74, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    startPrayingText: { color: COLORS.text, fontSize: 20, fontWeight: '800' },

    activeSessionContainer: { width: '100%', gap: 20 },
    prayingActiveIndicator: { padding: 32, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108, 99, 255, 0.2)' },
    prayingActiveText: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 16 },
    prayingActiveSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    doneBtn: { borderRadius: 24, overflow: 'hidden' },
    doneGradient: { height: 74, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    doneText: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
    expirationWarning: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, opacity: 0.6 }
});

export default PrayerScreen;
