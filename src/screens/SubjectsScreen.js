import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    TextInput,
    Dimensions,
    FlatList,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, BookOpen, Star, ChevronRight, Zap, Trophy, Clock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SUBJECTS } from '../theme/colors';
import { getSubjectCurriculum } from '../data/learningCatalog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─── Seed Lesson Data (will be Supabase-backed later) ──────────
const SEED_LESSONS = {
    english: [
        { id: 'e1', title: 'Parts of Speech',        description: 'Nouns, verbs, adjectives & more', duration: '12 min', xp: 15, icon: '🔤', difficulty: 1 },
        { id: 'e2', title: 'Tenses Made Easy',        description: 'Past, present and future tense', duration: '15 min', xp: 20, icon: '⏰', difficulty: 2 },
        { id: 'e3', title: 'Essay Writing',           description: 'Structure, vocabulary & style',   duration: '20 min', xp: 25, icon: '✍️', difficulty: 3 },
        { id: 'e4', title: 'Reading Comprehension',  description: 'Understanding texts deeply',       duration: '18 min', xp: 20, icon: '📖', difficulty: 2 },
        { id: 'e5', title: 'NECTA English Paper 1',  description: 'Past paper practice & analysis',  duration: '40 min', xp: 50, icon: '📝', difficulty: 4 },
    ],
    mathematics: [
        { id: 'm1', title: 'Fractions & Decimals',   description: 'Master numbers step by step',     duration: '14 min', xp: 15, icon: '½', difficulty: 2 },
        { id: 'm2', title: 'Algebra Basics',          description: 'Solving equations with x',        duration: '16 min', xp: 20, icon: '𝑥', difficulty: 3 },
        { id: 'm3', title: 'Geometry & Shapes',       description: 'Area, perimeter and angles',      duration: '18 min', xp: 20, icon: '📐', difficulty: 2 },
        { id: 'm4', title: 'Word Problems',           description: 'Real-life math applications',     duration: '20 min', xp: 25, icon: '🧩', difficulty: 3 },
        { id: 'm5', title: 'NECTA Maths Paper 1',    description: 'Past paper with full solutions',  duration: '45 min', xp: 50, icon: '📝', difficulty: 4 },
    ],
    science: [
        { id: 's1', title: 'Photosynthesis',          description: 'How plants make food',            duration: '10 min', xp: 12, icon: '🌿', difficulty: 2 },
        { id: 's2', title: 'The Human Body',          description: 'Organs, systems and health',      duration: '14 min', xp: 15, icon: '🫀', difficulty: 2 },
        { id: 's3', title: 'States of Matter',        description: 'Solid, liquid, gas & changes',   duration: '12 min', xp: 12, icon: '💧', difficulty: 1 },
        { id: 's4', title: 'Forces & Energy',         description: 'Newton\'s laws made simple',      duration: '16 min', xp: 18, icon: '⚡', difficulty: 3 },
    ],
    kiswahili: [
        { id: 'k1', title: 'Sarufi ya Kiswahili',    description: 'Kanuni za lugha ya Kiswahili',    duration: '12 min', xp: 15, icon: '🗣️', difficulty: 2 },
        { id: 'k2', title: 'Insha na Utungaji',       description: 'Jinsi ya kuandika vizuri',        duration: '18 min', xp: 20, icon: '✍️', difficulty: 3 },
        { id: 'k3', title: 'Fasihi ya Kiswahili',    description: 'Hadithi, mashairi na methali',    duration: '15 min', xp: 18, icon: '📜', difficulty: 2 },
    ],
    history: [
        { id: 'h1', title: 'Pre-Colonial Africa',     description: 'African kingdoms before 1800',   duration: '14 min', xp: 15, icon: '🏛️', difficulty: 2 },
        { id: 'h2', title: 'The Colonial Period',     description: 'European rule in East Africa',   duration: '16 min', xp: 18, icon: '🗺️', difficulty: 2 },
        { id: 'h3', title: 'Tanzania Independence',  description: 'The journey to Uhuru 1961',       duration: '12 min', xp: 15, icon: '🇹🇿', difficulty: 1 },
    ],
    geography: [
        { id: 'g1', title: 'Maps & Coordinates',      description: 'Reading maps and grid refs',      duration: '14 min', xp: 15, icon: '🗺️', difficulty: 2 },
        { id: 'g2', title: 'Climate & Weather',       description: 'Tanzania\'s climate patterns',   duration: '12 min', xp: 12, icon: '🌦️', difficulty: 2 },
        { id: 'g3', title: 'Population & Settlement', description: 'How people live & move',          duration: '10 min', xp: 12, icon: '🏘️', difficulty: 1 },
    ],
    biology: [
        { id: 'b1', title: 'Cell Biology',            description: 'Animal & plant cell structure',  duration: '16 min', xp: 18, icon: '🔬', difficulty: 3 },
        { id: 'b2', title: 'Genetics & Heredity',     description: 'DNA, genes and inheritance',      duration: '20 min', xp: 25, icon: '🧬', difficulty: 4 },
        { id: 'b3', title: 'Ecosystem & Food Chains', description: 'Living things and their habitat', duration: '14 min', xp: 15, icon: '🌍', difficulty: 2 },
    ],
    chemistry: [
        { id: 'c1', title: 'Atomic Structure',        description: 'Protons, neutrons and electrons', duration: '16 min', xp: 18, icon: '⚛️', difficulty: 3 },
        { id: 'c2', title: 'Acids & Bases',           description: 'pH, reactions and neutralisation',duration: '18 min', xp: 20, icon: '⚗️', difficulty: 3 },
        { id: 'c3', title: 'The Periodic Table',      description: 'Elements and their properties',   duration: '14 min', xp: 15, icon: '📋', difficulty: 2 },
    ],
    physics: [
        { id: 'p1', title: 'Motion & Speed',          description: 'Velocity, distance and time',    duration: '14 min', xp: 15, icon: '🚗', difficulty: 2 },
        { id: 'p2', title: 'Electricity',             description: 'Circuits, current and voltage',  duration: '18 min', xp: 20, icon: '💡', difficulty: 3 },
        { id: 'p3', title: 'Waves & Light',           description: 'Sound, light and reflection',    duration: '16 min', xp: 18, icon: '🌊', difficulty: 3 },
    ],
};

// ─── Concept of the Day ─────────────────────────────────────
const CONCEPTS = [
    { concept: 'Photosynthesis', subject: 'Science', emoji: '🌿', desc: 'The process plants use to convert sunlight into food using chlorophyll.' },
    { concept: 'Simile',         subject: 'English', emoji: '✍️', desc: 'A figure of speech that compares two things using "like" or "as". E.g. "as brave as a lion".' },
    { concept: 'Democracy',      subject: 'Civics',  emoji: '🏛️', desc: 'A system of government where citizens vote for their leaders.' },
    { concept: 'Gravity',        subject: 'Physics', emoji: '⚡', desc: 'The force that pulls objects toward the centre of the Earth. F = mg.' },
    { concept: 'Osmosis',        subject: 'Biology', emoji: '🔬', desc: 'The movement of water through a semi-permeable membrane from low to high concentration.' },
];
const dailyConcept = CONCEPTS[new Date().getDay() % CONCEPTS.length];

// ─── Animated Subject Card ──────────────────────────────────
const SubjectCard = ({ subject, onPress, index }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const curr = useMemo(() => getSubjectCurriculum(subject), [subject]);

    const handlePressIn  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

    return (
        <Animated.View style={{ transform: [{ scale }], width: (width - 48) / 2 - 4 }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <LinearGradient
                    colors={[subject.color + 'DD', subject.color + '88']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.subjectCard}
                >
                    {/* Decorative circle */}
                    <View style={[styles.subjectCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                    
                    {/* Top AI badge */}
                    <View style={styles.aiTeacherBadge}>
                        <Sparkles size={9} color="#FFB800" />
                        <Text style={styles.aiTeacherBadgeText}>AI Teacher</Text>
                    </View>

                    <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    
                    <View style={styles.subjectMeta}>
                        <BookOpen size={11} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.subjectMetaText}>
                            {curr.textbooks.length} Textbooks • {curr.teachers.reduce((acc, t) => acc + t.courses.length, 0)} Courses
                        </Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Recent Lesson Card ─────────────────────────────────────
const RecentLessonCard = ({ lesson, subjectColor, onPress }) => (
    <TouchableOpacity style={styles.recentCard} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.recentIcon, { backgroundColor: subjectColor + '22' }]}>
            <Text style={styles.recentIconText}>{lesson.icon}</Text>
        </View>
        <View style={styles.recentInfo}>
            <Text style={styles.recentTitle} numberOfLines={1}>{lesson.title}</Text>
            <View style={styles.recentMeta}>
                <Clock size={10} color="#7A8FAD" />
                <Text style={styles.recentMetaText}>{lesson.duration}</Text>
                <Star size={10} color="#FFB800" style={{ marginLeft: 8 }} />
                <Text style={[styles.recentMetaText, { color: '#FFB800' }]}>{lesson.xp} XP</Text>
            </View>
        </View>
        <ChevronRight size={16} color="#7A8FAD" />
    </TouchableOpacity>
);

// ─── Main SubjectsScreen ────────────────────────────────────
const SubjectsScreen = ({ navigation: navProp }) => {
    const { colors, gradients } = useTheme();
    const navigation = useNavigation();
    const styles2 = useMemo(() => createStyles(colors), [colors]);

    const [searchQuery, setSearchQuery]   = useState('');
    const [gradeGroup, setGradeGroup]     = useState('secondary'); // 'primary' | 'secondary'
    const [selectedSubject, setSelectedSubject] = useState(null);

    // Load saved grade preference
    useEffect(() => {
        AsyncStorage.getItem('selectedGrade').then(g => {
            if (g && (g === 'primary_low' || g === 'primary_high')) {
                setGradeGroup('primary');
            } else {
                setGradeGroup('secondary');
            }
        });
    }, []);

    const subjectList = SUBJECTS[gradeGroup] || SUBJECTS.secondary;
    const filtered = searchQuery.trim()
        ? subjectList.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : subjectList;

    const recentLessons = useMemo(() => {
        const result = [];
        subjectList.slice(0, 3).forEach(sub => {
            const lessons = SEED_LESSONS[sub.id] || [];
            if (lessons[0]) result.push({ ...lessons[0], subjectColor: sub.color, subjectName: sub.name });
        });
        return result;
    }, [subjectList]);

    const handleSubjectPress = (subject) => {
        navigation.navigate('SubjectDetail', { subject });
    };

    const headerAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                    {/* ── Header ── */}
                    <Animated.View style={[styles.header, {
                        opacity: headerAnim,
                        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }],
                    }]}>
                        <View>
                            <Text style={styles.greeting}>Good morning! 👋</Text>
                            <Text style={styles.headerTitle}>What will you{'\n'}learn today?</Text>
                        </View>
                        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
                            <LinearGradient colors={['#00A86B', '#00C27B']} style={styles.avatarGrad}>
                                <Text style={styles.avatarText}>🦉</Text>
                            </LinearGradient>
                            <View style={styles.xpBadge}>
                                <Text style={styles.xpText}>⚡ 0</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Search ── */}
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Search size={16} color="#7A8FAD" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search subjects..."
                                placeholderTextColor="#7A8FAD"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* ── Concept of the Day ── */}
                    <TouchableOpacity activeOpacity={0.9} style={styles.conceptCard}>
                        <LinearGradient colors={['#0077B6', '#00A86B']} style={styles.conceptGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                            <View style={styles.conceptBadge}>
                                <Zap size={10} color="#FFB800" />
                                <Text style={styles.conceptBadgeText}>CONCEPT OF THE DAY</Text>
                            </View>
                            <View style={styles.conceptRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.conceptTitle}>{dailyConcept.concept}</Text>
                                    <Text style={styles.conceptSubject}>{dailyConcept.subject}</Text>
                                    <Text style={styles.conceptDesc} numberOfLines={2}>{dailyConcept.desc}</Text>
                                </View>
                                <Text style={styles.conceptEmoji}>{dailyConcept.emoji}</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ── Grade Toggle ── */}
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, gradeGroup === 'primary' && styles.toggleBtnActive]}
                            onPress={() => setGradeGroup('primary')}
                        >
                            <Text style={[styles.toggleText, gradeGroup === 'primary' && styles.toggleTextActive]}>
                                🌱 Primary
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, gradeGroup === 'secondary' && styles.toggleBtnActive]}
                            onPress={() => setGradeGroup('secondary')}
                        >
                            <Text style={[styles.toggleText, gradeGroup === 'secondary' && styles.toggleTextActive]}>
                                📘 Secondary
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Subjects Grid ── */}
                    <Text style={styles.sectionTitle}>All Subjects</Text>
                    <View style={styles.subjectGrid}>
                        {filtered.map((subject, index) => (
                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                                index={index}
                                onPress={() => handleSubjectPress(subject)}
                            />
                        ))}
                    </View>

                    {/* ── Start Here Section ── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Start Here</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>
                    {recentLessons.map((lesson) => (
                        <RecentLessonCard
                            key={lesson.id}
                            lesson={lesson}
                            subjectColor={lesson.subjectColor}
                            onPress={() => navigation.navigate('LessonDetail', { lesson, subjectColor: lesson.subjectColor })}
                        />
                    ))}

                    {/* ── Daily Challenge Banner ── */}
                    <TouchableOpacity style={styles.challengeBanner} activeOpacity={0.85}
                        onPress={() => navigation.navigate('Practice')}>
                        <LinearGradient colors={['#FFB800', '#FF8C00']} style={styles.challengeGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                            <View>
                                <Text style={styles.challengeLabel}>🎯 Daily Challenge</Text>
                                <Text style={styles.challengeTitle}>Ready for today's quiz?</Text>
                                <Text style={styles.challengeSub}>Complete it to earn +50 XP bonus!</Text>
                            </View>
                            <Trophy size={44} color="rgba(255,255,255,0.3)" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe:      { flex: 1 },
    scroll:    { paddingHorizontal: 20 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 16,
        marginBottom: 20,
    },
    greeting: { fontSize: 14, color: '#7A8FAD', fontWeight: '500', marginBottom: 4 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#F0F4FF', lineHeight: 32, letterSpacing: -0.5 },
    avatarBtn: { alignItems: 'center' },
    avatarGrad: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 24 },
    xpBadge: {
        marginTop: 4,
        backgroundColor: 'rgba(255,184,0,0.15)',
        borderRadius: 10,
        paddingHorizontal: 8, paddingVertical: 2,
        borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)',
    },
    xpText: { color: '#FFB800', fontSize: 11, fontWeight: '700' },

    // Search
    searchRow: { marginBottom: 16 },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    searchInput: { flex: 1, color: '#F0F4FF', fontSize: 15 },

    // Concept of the Day
    conceptCard: { marginBottom: 20, borderRadius: 20, overflow: 'hidden' },
    conceptGrad: { padding: 20 },
    conceptBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginBottom: 12,
    },
    conceptBadgeText: { color: '#FFB800', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    conceptRow: { flexDirection: 'row', alignItems: 'center' },
    conceptTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
    conceptSubject: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
    conceptDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
    conceptEmoji: { fontSize: 56, marginLeft: 12 },

    // Grade Toggle
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1, paddingVertical: 10,
        borderRadius: 10, alignItems: 'center',
    },
    toggleBtnActive: { backgroundColor: '#00A86B' },
    toggleText: { color: '#7A8FAD', fontSize: 14, fontWeight: '600' },
    toggleTextActive: { color: '#fff' },

    // Section
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#F0F4FF', marginBottom: 12 },
    seeAll: { color: '#00A86B', fontSize: 14, fontWeight: '600' },

    // Subject Grid
    subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
    subjectCard: {
        borderRadius: 18,
        padding: 18,
        minHeight: 120,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    subjectCircle: {
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: 40,
    },
    aiTeacherBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    aiTeacherBadgeText: {
        color: '#FFB800',
        fontSize: 9,
        fontWeight: '800',
    },
    subjectEmoji:    { fontSize: 32, marginBottom: 8 },
    subjectName:     { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 },
    subjectMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    subjectMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

    // Recent Lessons
    recentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    recentIcon: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    recentIconText: { fontSize: 22 },
    recentInfo:     { flex: 1 },
    recentTitle:    { fontSize: 14, fontWeight: '700', color: '#F0F4FF', marginBottom: 4 },
    recentMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
    recentMetaText: { fontSize: 11, color: '#7A8FAD', fontWeight: '500' },

    // Daily Challenge
    challengeBanner: { marginTop: 8, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
    challengeGrad:   {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20,
    },
    challengeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', marginBottom: 4 },
    challengeTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    challengeSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});

const createStyles = (colors) => ({});

export default SubjectsScreen;
