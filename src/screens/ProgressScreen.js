import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Zap,
  Target,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Flame,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { BonaAPI, LEADERBOARD_STUDENTS } from '../services/supabase';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [stats, setStats] = useState(null);
  const [leaderboardTab, setLeaderboardTab] = useState('dar'); // 'dar' | 'national'

  useEffect(() => {
    async function loadStats() {
      const data = await BonaAPI.getStudentStats();
      setStats(data);
    }
    loadStats();
  }, []);

  const subjectsMastery = [
    { name: 'Hisabati / Math', progress: 0.85, color: '#6366F1' },
    { name: 'Sayansi / Science & Bio', progress: 0.72, color: '#10B981' },
    { name: 'Kiswahili', progress: 0.9, color: '#F59E0B' },
    { name: 'English Language', progress: 0.78, color: '#EC4899' },
    { name: 'Jiografia / Geography', progress: 0.65, color: '#0EA5E9' },
  ];

  const daysOfWeek = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: true },
    { day: 'T', active: true },
    { day: 'F', active: true },
    { day: 'S', active: true },
    { day: 'S', active: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>ACADEMIC MILESTONES</Text>
            <Text style={styles.headerTitle}>Progress & Rank 🏆</Text>
          </View>
        </View>

        {/* Scholar Level Card */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5', '#312E81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelBadgeText}>LEVEL 5 SCHOLAR</Text>
              <Text style={styles.studentNameTitle}>Baraka Juma</Text>
              <Text style={styles.studentSchoolSub}>Azania Secondary • Form 2</Text>
            </View>
            <View style={styles.owlAvatarBox}>
              <Text style={{ fontSize: 32 }}>🦉</Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpInfoRow}>
            <Text style={styles.xpLabel}>Total Knowledge Points</Text>
            <Text style={styles.xpCount}>{stats?.xp || 2120} / 3000 XP</Text>
          </View>
          <View style={styles.levelProgressBg}>
            <View
              style={[
                styles.levelProgressFill,
                { width: `${((stats?.xp || 2120) / 3000) * 100}%` },
              ]}
            />
          </View>
        </LinearGradient>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B20' }]}>
              <Flame size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statVal}>{stats?.streak || 12} Days</Text>
            <Text style={styles.statLbl}>Study Streak</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#10B98120' }]}>
              <Target size={20} color="#10B981" />
            </View>
            <Text style={styles.statVal}>{stats?.accuracyRate || '88%'}</Text>
            <Text style={styles.statLbl}>Quiz Accuracy</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#8B5CF620' }]}>
              <BookOpen size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statVal}>{stats?.lessonsCompleted || 14}</Text>
            <Text style={styles.statLbl}>Lessons Done</Text>
          </View>
        </View>

        {/* Study Streak Calendar Strip */}
        <View style={styles.streakStripCard}>
          <View style={styles.streakStripHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Flame size={18} color="#F59E0B" />
              <Text style={styles.streakStripTitle}>12-Day Streak Active</Text>
            </View>
            <Text style={styles.streakStripSub}>Keep it burning today!</Text>
          </View>
          <View style={styles.weekDaysRow}>
            {daysOfWeek.map((d, i) => (
              <View key={i} style={styles.dayCol}>
                <View style={[styles.dayCircle, d.active && styles.dayCircleActive]}>
                  <Text style={[styles.dayCircleText, d.active && styles.dayCircleTextActive]}>
                    ✓
                  </Text>
                </View>
                <Text style={styles.dayLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* NECTA Syllabus Mastery */}
        <Text style={styles.sectionTitle}>Syllabus Mastery</Text>
        <View style={styles.masteryCard}>
          {subjectsMastery.map((sub, idx) => (
            <View key={idx} style={styles.masteryItem}>
              <View style={styles.masteryTextRow}>
                <Text style={styles.masterySubject}>{sub.name}</Text>
                <Text style={[styles.masteryPct, { color: sub.color }]}>
                  {Math.round(sub.progress * 100)}%
                </Text>
              </View>
              <View style={styles.masteryBarBg}>
                <View
                  style={[
                    styles.masteryBarFill,
                    { width: `${sub.progress * 100}%`, backgroundColor: sub.color },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Student Leaderboard */}
        <View style={styles.leaderboardHeader}>
          <Text style={styles.sectionTitle}>Scholars Leaderboard</Text>
          <View style={styles.lbToggle}>
            <TouchableOpacity
              style={[styles.lbBtn, leaderboardTab === 'dar' && styles.lbBtnActive]}
              onPress={() => setLeaderboardTab('dar')}
            >
              <Text style={[styles.lbBtnText, leaderboardTab === 'dar' && styles.lbBtnTextActive]}>
                Dar es Salaam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lbBtn, leaderboardTab === 'national' && styles.lbBtnActive]}
              onPress={() => setLeaderboardTab('national')}
            >
              <Text
                style={[
                  styles.lbBtnText,
                  leaderboardTab === 'national' && styles.lbBtnTextActive,
                ]}
              >
                National
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lbCard}>
          {LEADERBOARD_STUDENTS.map((item) => {
            const isMe = item.name.includes('(You)');
            return (
              <View
                key={item.rank}
                style={[styles.lbRow, isMe && styles.lbRowMe]}
              >
                <View style={styles.rankBadge}>
                  <Text
                    style={[
                      styles.rankText,
                      item.rank === 1 && { color: '#F59E0B', fontWeight: '900' },
                      item.rank === 2 && { color: '#94A3B8', fontWeight: '900' },
                    ]}
                  >
                    #{item.rank}
                  </Text>
                </View>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{item.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lbStudentName, isMe && { color: colors.primary }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.lbSchool}>
                    {item.school} • {item.grade}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.lbXP}>{item.xp} XP</Text>
                  <View style={styles.lbStreak}>
                    <Flame size={12} color="#F59E0B" />
                    <Text style={styles.lbStreakText}>{item.streak}d</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Badges Earned */}
        <Text style={styles.sectionTitle}>Badges & Achievements</Text>
        <View style={styles.badgesGrid}>
          {stats?.badges?.map((badge) => (
            <View key={badge.id} style={styles.badgeCard}>
              <Text style={{ fontSize: 32, marginBottom: 6 }}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      marginTop: 10,
      marginBottom: 16,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 1.2,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginTop: 2,
    },
    levelCard: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
    },
    levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    levelBadgeText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#FDE047',
      letterSpacing: 1,
    },
    studentNameTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      marginTop: 2,
    },
    studentSchoolSub: {
      fontSize: 12,
      color: '#E0E7FF',
      marginTop: 2,
    },
    owlAvatarBox: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    xpInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    xpLabel: {
      fontSize: 12,
      color: '#E0E7FF',
    },
    xpCount: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    levelProgressBg: {
      height: 8,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    levelProgressFill: {
      height: '100%',
      backgroundColor: '#FDE047',
      borderRadius: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    statIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statVal: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    statLbl: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    streakStripCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 22,
    },
    streakStripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    streakStripTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginLeft: 6,
    },
    streakStripSub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    weekDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayCol: {
      alignItems: 'center',
    },
    dayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(150,150,150,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    dayCircleActive: {
      backgroundColor: '#F59E0B',
    },
    dayCircleText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    dayCircleTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    dayLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
    },
    masteryCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 22,
      gap: 14,
    },
    masteryItem: {},
    masteryTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    masterySubject: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    masteryPct: {
      fontSize: 13,
      fontWeight: '800',
    },
    masteryBarBg: {
      height: 6,
      backgroundColor: 'rgba(150,150,150,0.12)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    masteryBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    leaderboardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    lbToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    lbBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    lbBtnActive: {
      backgroundColor: colors.primary,
    },
    lbBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    lbBtnTextActive: {
      color: '#FFFFFF',
    },
    lbCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 22,
    },
    lbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    lbRowMe: {
      backgroundColor: colors.primary + '15',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    rankBadge: {
      width: 32,
      alignItems: 'center',
    },
    rankText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    lbStudentName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    lbSchool: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    lbXP: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    lbStreak: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    lbStreakText: {
      fontSize: 11,
      color: '#F59E0B',
      fontWeight: '700',
      marginLeft: 2,
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    badgeCard: {
      width: (width - 50) / 2,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    badgeName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    badgeDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 15,
    },
  });

export default ProgressScreen;
