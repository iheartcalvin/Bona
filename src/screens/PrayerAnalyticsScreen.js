import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Flame, Trophy, Award, Target, Calendar, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { UserService } from '../services/userService';
import { auth } from '../services/firebaseConfig';
import { SPACING } from '../theme/colors';

const { width } = Dimensions.get('window');

const PrayerAnalyticsScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [streak, setStreak] = useState(0);
    const [userProfile, setUserProfile] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        weeklyAverage: 0,
        completionRate: 0,
        bestStreak: 0
    });

    useEffect(() => {
        let unsubscribe;
        const user = auth.currentUser;
        if (user) {
            unsubscribe = UserService.subscribeToUserProfile(user.uid, setUserProfile);
        }
        fetchData();
        return () => unsubscribe?.();
    }, []);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const data = await UserService.getExtendedPrayerHistory(user.uid, 30);
            setHistory(data);
            calculateStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        if (!data || data.length === 0) {
            setStreak(0);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prayerDates = [...new Set(data.map(p => {
            const d = new Date(p.completedAt?.toDate?.() || p.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }))].sort((a, b) => b - a);

        let currentStreak = 0;
        let checkDate = new Date(today);

        const hasToday = prayerDates.includes(today.getTime());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const hasYesterday = prayerDates.includes(yesterday.getTime());

        if (hasToday || hasYesterday) {
            if (!hasToday) checkDate = yesterday;

            for (let i = 0; i < 365; i++) {
                if (prayerDates.includes(checkDate.getTime())) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        setStreak(currentStreak);
    };

    const getStatusInfo = (count) => {
        if (count < 10) return { title: "Prayer Novice", color: "#94A3B8", next: 10, icon: <Award size={24} color="#94A3B8" /> };
        if (count < 50) return { title: "Faithful Servant", color: "#4ADE80", next: 50, icon: <Award size={24} color="#4ADE80" /> };
        if (count < 100) return { title: "Prayer Warrior", color: "#60A5FA", next: 100, icon: <Trophy size={24} color="#60A5FA" /> };
        if (count < 250) return { title: "Spiritual Shield", color: "#A78BFA", next: 250, icon: <ShieldCheck size={24} color="#A78BFA" /> };
        return { title: "Elder of Faith", color: "#FBBF24", next: 1000, icon: <Trophy size={24} color="#FBBF24" /> };
    };

    const status = getStatusInfo(userProfile?.stats?.completedPrayers || history.length);

    const weeklyActivity = useMemo(() => {
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last7Days.push({
                label: days[date.getDay()],
                date: date.getTime(),
                count: history.filter(p => {
                    const pd = new Date(p.completedAt?.toDate?.() || p.date);
                    pd.setHours(0, 0, 0, 0);
                    return pd.getTime() === date.getTime();
                }).length
            });
        }
        return last7Days;
    }, [history]);

    const maxWeekly = Math.max(...weeklyActivity.map(d => d.count), 1);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Prayer Insights</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={gradients.warmth} style={styles.streakCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>Current Streak</Text>
                        <Text style={styles.streakValue}>{streak} Days</Text>
                        <Text style={styles.streakSubText}>You're on fire! Keep it up.</Text>
                    </View>
                    <View style={styles.streakIconContainer}>
                        <Flame color="white" size={48} fill="white" />
                    </View>
                </LinearGradient>

                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View style={styles.statusIconBox}>
                            {status.icon}
                        </View>
                        <View>
                            <Text style={styles.statusLabel}>Your Rank</Text>
                            <Text style={[styles.statusTitle, { color: status.color }]}>{status.title}</Text>
                        </View>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressText}>{userProfile?.stats?.completedPrayers || history.length} / {status.next} prayers</Text>
                            <Text style={styles.progressPercent}>{Math.round(((userProfile?.stats?.completedPrayers || history.length) / status.next) * 100)}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <LinearGradient
                                colors={[status.color, status.color + '99']}
                                style={[styles.progressBarFill, { width: `${Math.min(100, ((userProfile?.stats?.completedPrayers || history.length) / status.next) * 100)}%` }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <BarChart3 color={colors.primary} size={20} />
                        <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        {weeklyActivity.map((day, idx) => (
                            <View key={idx} style={styles.chartBarWrapper}>
                                <View style={styles.barBackground}>
                                    <LinearGradient
                                        colors={day.count > 0 ? gradients.primary : ['transparent', 'transparent']}
                                        style={[styles.barFill, { height: `${(day.count / maxWeekly) * 100}%`, opacity: day.count > 0 ? 1 : 0.2 }]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, idx === 6 && { color: colors.primary, fontWeight: '700' }]}>{day.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                        <TrendingUp color={colors.success} size={24} />
                        <Text style={styles.metricValue}>85%</Text>
                        <Text style={styles.metricLabel}>Consistency</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Target color={colors.secondary} size={24} />
                        <Text style={styles.metricValue}>{history.length}</Text>
                        <Text style={styles.metricLabel}>30d Prayers</Text>
                    </View>
                </View>

                <Text style={styles.subHeaderText}>Milestones</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeList}>
                    <BadgeItem title="3 Day Streak" icon={<Flame size={20} color="#CD7F32" />} earned={streak >= 3} color="#CD7F32" themeStyles={styles} />
                    <BadgeItem title="7 Day Streak" icon={<ShieldCheck size={20} color="#C0C0C0" />} earned={streak >= 7} color="#C0C0C0" themeStyles={styles} />
                    <BadgeItem title="30 Day Streak" icon={<Trophy size={20} color="#FFD700" />} earned={streak >= 30} color="#FFD700" themeStyles={styles} />
                    <BadgeItem title="Prayer Warrior" icon={<Award size={20} color="#E5E4E2" />} earned={(userProfile?.stats?.completedPrayers || 0) >= 50} color="#E5E4E2" themeStyles={styles} />
                </ScrollView>
            </ScrollView>
        </SafeAreaView>
    );
};

const BadgeItem = ({ title, icon, earned, color, themeStyles }) => {
    return (
        <View style={[themeStyles.badgeCard, !earned && { opacity: 0.3 }]}>
            <View style={[themeStyles.badgeIconBox, { borderColor: color }]}>
                {icon}
            </View>
            <Text style={themeStyles.badgeTitle}>{title}</Text>
            {earned ? (
                <View style={[themeStyles.earnedBadge, { backgroundColor: color }]}>
                    <Text style={themeStyles.earnedText}>Earned</Text>
                </View>
            ) : (
                <Text style={themeStyles.lockedText}>Locked</Text>
            )}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    scrollContent: { padding: 20, paddingBottom: 40 },
    streakCard: {
        padding: 30,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        elevation: 10,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20
    },
    streakInfo: { flex: 1 },
    streakLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    streakValue: { color: 'white', fontSize: 36, fontWeight: '900', marginVertical: 4 },
    streakSubText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
    streakIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statusCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.cardBorder },
    statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    statusIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    statusLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    statusTitle: { fontSize: 22, fontWeight: '800' },
    progressContainer: { width: '100%' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    progressPercent: { color: colors.text, fontSize: 12, fontWeight: '700' },
    progressBarBg: { height: 10, backgroundColor: colors.background, borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },
    sectionCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: colors.cardBorder },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingHorizontal: 10 },
    chartBarWrapper: { alignItems: 'center', width: 30 },
    barBackground: { width: 12, height: 120, backgroundColor: colors.background, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
    barFill: { width: '100%', borderRadius: 6 },
    barLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 12 },
    metricsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    metricCard: { flex: 1, backgroundColor: colors.surface, padding: 20, borderRadius: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.cardBorder },
    metricValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
    metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    subHeaderText: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
    badgeList: { flexDirection: 'row', marginBottom: 20 },
    badgeCard: { width: 120, backgroundColor: colors.surface, padding: 16, borderRadius: 20, alignItems: 'center', marginRight: 12, gap: 12, borderWidth: 1, borderColor: colors.cardBorder },
    badgeIconBox: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    badgeTitle: { color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
    earnedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    earnedText: { color: 'white', fontSize: 10, fontWeight: '800' },
    lockedText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' }
});

export default PrayerAnalyticsScreen;
