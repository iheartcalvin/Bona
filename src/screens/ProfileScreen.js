import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  Globe,
  Bell,
  Database,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { BonaAPI, isSupabaseConnected, initSupabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppRole } from '../context/AppRoleContext';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDark, setTheme, theme } = useTheme();
  const { isTeacher, setRole } = useAppRole();
  const styles = getStyles(colors);

  const [student, setStudent] = useState({
    name: 'Baraka Juma',
    school: 'Azania Secondary School',
    grade: 'Form 2',
    level: 'Secondary',
    xp: 2120,
    streak: 12,
  });

  const [bilingualMode, setBilingualMode] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  // Supabase Modal
  const [supabaseModalVisible, setSupabaseModalVisible] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [connected, setConnected] = useState(isSupabaseConnected());

  // Grade Picker Modal
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  useEffect(() => {
    async function loadData() {
      const stats = await BonaAPI.getStudentStats();
      if (stats) setStudent(stats);
      setConnected(isSupabaseConnected());
    }
    loadData();
  }, []);

  const handleGradeSelect = async (newGrade, newLevel) => {
    const updated = { ...student, grade: newGrade, level: newLevel };
    setStudent(updated);
    await AsyncStorage.setItem('bona_student_stats', JSON.stringify(updated));
    setGradeModalVisible(false);
  };

  const handleConnectSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      Alert.alert('Required', 'Please enter both Supabase URL and Anon Key');
      return;
    }
    const client = await initSupabase(supabaseUrl.trim(), supabaseKey.trim());
    if (client) {
      setConnected(true);
      setSupabaseModalVisible(false);
      Alert.alert('Connected! 🚀', 'Bona is now synced with your Supabase backend!');
    } else {
      Alert.alert('Connection Failed', 'Could not initialize Supabase. Check URL and Key.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>{isTeacher ? 'TEACHER PROFILE' : 'STUDENT PROFILE'}</Text>
          <Text style={styles.headerTitle}>My Account 🦉</Text>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={['#6366F1', '#4F46E5', '#312E81']}
          style={styles.profileCard}
        >
          <View style={styles.profileCardTop}>
            <View style={styles.avatarRing}>
              <Text style={{ fontSize: 40 }}>🦉</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.levelTag}>
                <Sparkles size={12} color="#FDE047" />
                <Text style={styles.levelTagText}>LEVEL 5 SCHOLAR</Text>
              </View>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentSchool}>{student.school}</Text>
              <Text style={styles.studentGrade}>{student.grade} • Tanzania Syllabus</Text>
            </View>
          </View>

          <View style={styles.profileCardStats}>
            <View style={styles.cardStatCol}>
              <Text style={styles.cardStatVal}>{student.xp} XP</Text>
              <Text style={styles.cardStatLbl}>Knowledge</Text>
            </View>
            <View style={styles.cardStatDivider} />
            <View style={styles.cardStatCol}>
              <Text style={styles.cardStatVal}>{student.streak} Days</Text>
              <Text style={styles.cardStatLbl}>Streak 🔥</Text>
            </View>
            <View style={styles.cardStatDivider} />
            <View style={styles.cardStatCol}>
              <Text style={styles.cardStatVal}>Top 2%</Text>
              <Text style={styles.cardStatLbl}>Class Rank</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionHeader}>App experience</Text>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#8B5CF615' }]}>
              <GraduationCap size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Teacher / Facilitator Mode</Text>
              <Text style={styles.menuItemSub}>{isTeacher ? 'Teacher Studio and teaching spaces enabled' : 'Switch on to publish courses and challenges'}</Text>
            </View>
            <Switch value={isTeacher} onValueChange={(enabled) => setRole(enabled ? 'teacher' : 'student')} trackColor={{ false: '#767577', true: colors.primary }} />
          </View>
        </View>

        {/* Syllabus & Curriculum Settings */}
        <Text style={styles.sectionHeader}>Curriculum & Grade</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setGradeModalVisible(true)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#6366F115' }]}>
              <GraduationCap size={20} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Current Syllabus Grade</Text>
              <Text style={styles.menuItemSub}>{student.grade} ({student.level})</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#F59E0B15' }]}>
              <Globe size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Bilingual Mode</Text>
              <Text style={styles.menuItemSub}>Kiswahili & English explanations</Text>
            </View>
            <Switch
              value={bilingualMode}
              onValueChange={setBilingualMode}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>
        </View>

        {/* Learning Preferences */}
        <Text style={styles.sectionHeader}>Preferences & Habits</Text>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#10B98115' }]}>
              <Bell size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Daily Study Reminders</Text>
              <Text style={styles.menuItemSub}>Remind me at 6:30 PM</Text>
            </View>
            <Switch
              value={studyReminders}
              onValueChange={setStudyReminders}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#EC489915' }]}>
              <Zap size={20} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Dark Mode</Text>
              <Text style={styles.menuItemSub}>Gentle on eyes during night study</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>
        </View>

        {/* Backend & Cloud Sync */}
        <Text style={styles.sectionHeader}>Backend & Database</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setSupabaseModalVisible(true)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#10B98115' }]}>
              <Database size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Supabase Cloud Database</Text>
              <Text style={[styles.menuItemSub, { color: connected ? '#10B981' : colors.textSecondary }]}>
                {connected ? '● Connected & Ready' : '○ Offline Mode (Using Seed Syllabus)'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Info Banner */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>Bona Educational Platform 🇹🇿</Text>
          <Text style={styles.appInfoSub}>
            Version 1.0.0 • Designed for Tanzania Primary & Secondary Students
          </Text>
        </View>
      </ScrollView>

      {/* GRADE SELECTOR MODAL */}
      <Modal
        visible={gradeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGradeModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalArea, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Class / Grade</Text>
            <TouchableOpacity onPress={() => setGradeModalVisible(false)}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.modalGroupTitle}>Secondary School (O-Level)</Text>
            {['Form 1', 'Form 2', 'Form 3', 'Form 4'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.gradeSelectBtn,
                  student.grade === g && styles.gradeSelectBtnActive,
                ]}
                onPress={() => handleGradeSelect(g, 'Secondary')}
              >
                <Text
                  style={[
                    styles.gradeSelectText,
                    student.grade === g && styles.gradeSelectTextActive,
                  ]}
                >
                  📘 {g}
                </Text>
                {student.grade === g && <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <Text style={[styles.modalGroupTitle, { marginTop: 20 }]}>Primary School (Shule ya Msingi)</Text>
            {['Std 4', 'Std 5', 'Std 6', 'Std 7'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.gradeSelectBtn,
                  student.grade === g && styles.gradeSelectBtnActive,
                ]}
                onPress={() => handleGradeSelect(g, 'Primary')}
              >
                <Text
                  style={[
                    styles.gradeSelectText,
                    student.grade === g && styles.gradeSelectTextActive,
                  ]}
                >
                  📗 {g}
                </Text>
                {student.grade === g && <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* SUPABASE MODAL */}
      <Modal
        visible={supabaseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSupabaseModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalArea, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Connect Supabase ⚡</Text>
            <TouchableOpacity onPress={() => setSupabaseModalVisible(false)}>
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.supaDesc}>
              Bona currently runs with built-in Tanzania curriculum seed data. To sync your own live database, paste your Supabase Project URL and Anon Key below:
            </Text>

            <Text style={styles.inputLabel}>Supabase Project URL</Text>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              placeholder="https://xyzcompany.supabase.co"
              placeholderTextColor={colors.textSecondary}
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Supabase Anon Key</Text>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              placeholderTextColor={colors.textSecondary}
              value={supabaseKey}
              onChangeText={setSupabaseKey}
              autoCapitalize="none"
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.supaSaveBtn}
              onPress={handleConnectSupabase}
            >
              <Text style={styles.supaSaveBtnText}>Save & Connect</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    profileCard: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
    },
    profileCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    avatarRing: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    levelTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    levelTagText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#FDE047',
      marginLeft: 4,
      letterSpacing: 0.8,
    },
    studentName: {
      fontSize: 20,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    studentSchool: {
      fontSize: 12,
      color: '#E0E7FF',
      marginTop: 2,
    },
    studentGrade: {
      fontSize: 11,
      color: '#CBD5E1',
      marginTop: 2,
    },
    profileCardStats: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderRadius: 16,
      padding: 12,
      justifyContent: 'space-around',
    },
    cardStatCol: {
      alignItems: 'center',
    },
    cardStatVal: {
      fontSize: 15,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    cardStatLbl: {
      fontSize: 11,
      color: '#CBD5E1',
      marginTop: 2,
    },
    cardStatDivider: {
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 8,
    },
    menuGroup: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 18,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    menuIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    menuItemTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    menuItemSub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginLeft: 68,
    },
    appInfoCard: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    appInfoTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    appInfoSub: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    modalArea: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    modalGroupTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    gradeSelectBtn: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 10,
    },
    gradeSelectBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    gradeSelectText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    gradeSelectTextActive: {
      color: '#FFFFFF',
    },
    supaDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    inputField: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      marginBottom: 16,
    },
    supaSaveBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    supaSaveBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });

export default ProfileScreen;
