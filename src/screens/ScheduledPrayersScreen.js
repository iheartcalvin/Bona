import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Clock, AlertCircle, CheckCircle2, MoreHorizontal, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';

import { auth } from '../services/firebaseConfig';
import { UserService } from '../services/userService';
import AddPrayerModal from '../components/AddPrayerModal';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

const ScheduledPrayersScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [activeTab, setActiveTab] = useState('Timeline');
    const [prayerSchedule, setPrayerSchedule] = useState([]);
    const [prayerHistory, setPrayerHistory] = useState([]);
    const [user, setUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPrayer, setSelectedPrayer] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const unsubSchedule = UserService.subscribeToPrayerSchedule(currentUser.uid, (data) => {
                    setPrayerSchedule(data);
                });
                const unsubHistory = UserService.subscribeToPrayerHistory(currentUser.uid, 20, (data) => {
                    setPrayerHistory(data);
                });
                return () => {
                    unsubSchedule();
                    unsubHistory();
                };
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Helper: Parse time string (HH:mm or HH:mm AM/PM) to minutes
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

    // Helper: Check if prayer completed today
    const isCompletedToday = (title) => {
        if (!prayerHistory.length) return false;
        const today = new Date().toDateString();
        return prayerHistory.some(p =>
            p.title === title &&
            new Date(p.completedAt?.toDate?.() || p.date).toDateString() === today
        );
    };

    // Helper: Check if time has passed
    const hasTimePassed = (timeStr) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const prayerMinutes = parseTimeToMinutes(timeStr);
        return currentMinutes > prayerMinutes;
    };

    // Calculate Missed Prayers (Passed time AND not completed)
    const missedPrayers = prayerSchedule.filter(item => {
        return hasTimePassed(item.time) && !isCompletedToday(item.title);
    }).map(item => ({
        ...item,
        date: 'Today' // Since we check against logic "today"
    }));

    const handleSavePrayer = async (prayerData) => {
        if (!user) return;
        try {
            if (prayerData.id) {
                // Update
                const { id, ...data } = prayerData;
                await UserService.updateScheduledPrayer(user.uid, id, data);
            } else {
                // Add
                await UserService.addScheduledPrayer(user.uid, prayerData);
            }
            setShowAddModal(false);
            setSelectedPrayer(null);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not save prayer.");
        }
    };

    const handleDeletePrayer = async (prayerId) => {
        if (!user) return;
        try {
            await UserService.deleteScheduledPrayer(user.uid, prayerId);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not delete prayer.");
        }
    };

    const handleOpenOptions = (prayer) => {
        Alert.alert(
            "Manage Prayer",
            `Choose an action for "${prayer.title}"`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Edit",
                    onPress: () => {
                        setSelectedPrayer(prayer);
                        setShowAddModal(true);
                    }
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeletePrayer(prayer.id)
                }
            ]
        );
    };

    // Transform schedule to timeline data
    const timelineData = [
        {
            day: 'Today',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            items: prayerSchedule.map((item, index) => {
                const completed = isCompletedToday(item.title);
                const passed = hasTimePassed(item.time);
                let status = 'upcoming';
                if (completed) status = 'completed';
                else if (passed) status = 'missed';

                // For timeline display, we usually show "missed" as just upcoming or regular unless we want red styling.
                // The prompt implies missed should be in the missed section.
                // For the timeline itself, let's keep it strictly status based.

                return {
                    id: item.id || index.toString(),
                    title: item.title,
                    time: item.time,
                    category: item.category,
                    status: status,
                    original: item
                };
            })
        },
        {
            day: 'Tomorrow',
            date: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            items: prayerSchedule.map((item, index) => ({
                id: `tmrw-${item.id || index}`,
                title: item.title,
                time: item.time,
                category: item.category,
                status: 'upcoming',
                original: item
            }))
        }
    ];

    const renderMissedItem = ({ item }) => (
        <View style={styles.missedCard}>
            <View style={styles.missedContent}>
                <View style={[styles.categoryIndicator, { backgroundColor: colors.error }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.missedTitle}>{item.title}</Text>
                    <Text style={styles.missedTime}>{item.date} • {item.time}</Text>
                </View>
                <TouchableOpacity style={styles.remindBtn}>
                    <Text style={styles.remindBtnText}>Pray Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Prayer Schedule</Text>
                <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={() => navigation.navigate('PrayerAnalytics')}
                >
                    <Calendar color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Missed Prayers Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <AlertCircle color={colors.error} size={20} />
                        <Text style={[styles.sectionTitle, { color: colors.error, marginLeft: 8 }]}>Missed Prayers</Text>
                    </View>
                    <Text style={styles.missedCount}>{missedPrayers.length} pending</Text>
                </View>

                <FlatList
                    data={missedPrayers}
                    renderItem={renderMissedItem}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.missedList}
                />

                {/* Timeline Section */}
                <View style={styles.timelineHeader}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.tabContainer}>
                        {['Timeline', 'Calendar'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.timelineContainer}>
                    <View style={styles.verticalLine} />
                    {timelineData.map((dayData, dayIdx) => (
                        <View key={dayData.date} style={styles.dayGroup}>
                            <View style={styles.dayHeader}>
                                <View style={styles.dayDot} />
                                <Text style={styles.dayText}>{dayData.day}, <Text style={{ fontWeight: '400', opacity: 0.7 }}>{dayData.date}</Text></Text>
                            </View>

                            {dayData.items.map((item, itemIdx) => (
                                <TouchableOpacity key={item.id} style={styles.timelineItem}>
                                    <View style={styles.timeContainer}>
                                        <Text style={styles.timeText}>{item.time}</Text>
                                        <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? colors.success : colors.primary }]} />
                                    </View>

                                    <View style={[styles.prayerCard, item.status === 'completed' && styles.completedCard]}>
                                        <View style={styles.prayerCardHeader}>
                                            <Text style={[styles.prayerTitle, item.status === 'completed' && styles.completedText]}>{item.title}</Text>
                                            {item.status === 'completed' ? (
                                                <CheckCircle2 color={colors.success} size={18} />
                                            ) : (
                                                <TouchableOpacity onPress={() => handleOpenOptions(item.original)}>
                                                    <MoreHorizontal color={colors.textSecondary} size={18} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <View style={styles.prayerCardFooter}>
                                            <View style={styles.categoryBadge}>
                                                <Text style={styles.categoryBadgeText}>{item.category}</Text>
                                            </View>
                                            {item.status === 'upcoming' && (
                                                <View style={styles.reminderRow}>
                                                    <Clock size={12} color={colors.primary} />
                                                    <Text style={styles.reminderText}>Reminder set</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => { setSelectedPrayer(null); setShowAddModal(true); }}>
                <LinearGradient colors={GRADIENTS.primary} style={styles.fabGradient}>
                    <Plus color={colors.text} size={32} />
                </LinearGradient>
            </TouchableOpacity>

            <AddPrayerModal
                visible={showAddModal}
                onClose={() => { setShowAddModal(false); setSelectedPrayer(null); }}
                onSave={handleSavePrayer}
                initialPrayer={selectedPrayer}
            />
        </SafeAreaView>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    calendarButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingVertical: 20, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    missedCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    missedList: { paddingLeft: 20, paddingRight: 10, marginBottom: 30 },
    missedCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        marginRight: 15,
        width: 280,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        shadowColor: colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4
    },
    missedContent: { flexDirection: 'row', alignItems: 'center' },
    categoryIndicator: { width: 4, height: 40, borderRadius: 2 },
    missedTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    missedTime: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
    remindBtn: { backgroundColor: colors.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    remindBtnText: { color: colors.text, fontSize: 12, fontWeight: '700' },
    timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    tabContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 4 },
    tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    activeTab: { backgroundColor: 'rgba(108, 99, 255, 0.2)' },
    tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    activeTabText: { color: colors.primary },
    timelineContainer: { paddingHorizontal: 20, position: 'relative' },
    verticalLine: {
        position: 'absolute',
        left: 31,
        top: 10,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        zIndex: 0
    },
    dayGroup: { marginBottom: 30 },
    dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, zIndex: 1 },
    dayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginRight: 15, borderWidth: 2, borderColor: colors.background },
    dayText: { color: colors.text, fontSize: 16, fontWeight: '700' },
    timelineItem: { flexDirection: 'row', marginBottom: 20, zIndex: 1 },
    timeContainer: { width: 80, alignItems: 'flex-start', paddingTop: 10 },
    timeText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    statusDot: { position: 'absolute', left: 11, top: 15, width: 6, height: 6, borderRadius: 3, zIndex: 2 },
    prayerCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
    },
    completedCard: { opacity: 0.6, backgroundColor: 'rgba(255, 255, 255, 0.02)' },
    prayerCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    prayerTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
    completedText: { textDecorationLine: 'line-through' },
    prayerCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoryBadge: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    categoryBadgeText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    reminderRow: { flexDirection: 'row', alignItems: 'center' },
    reminderText: { color: colors.primary, fontSize: 11, fontWeight: '600', marginLeft: 4 },
    fab: { position: 'absolute', bottom: 30, right: 20, borderRadius: 30, elevation: 8 },
    fabGradient: { padding: SPACING.md, borderRadius: 30, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
});

export default ScheduledPrayersScreen;
