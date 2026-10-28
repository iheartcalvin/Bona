import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronLeft, Star, CheckCircle, PlayCircle,
    MessageSquare, BookOpen, Zap, Award,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─── Rich lesson content seeded per subject + lesson ────────
const LESSON_CONTENT = {
    e1: {
        sections: [
            {
                heading: 'What are Parts of Speech?',
                body: `Every word in the English language belongs to a category called a **Part of Speech**. Understanding these categories helps you speak and write correctly — and is essential for NECTA English exams!\n\nThere are **8 main parts of speech** you must know:`,
                type: 'intro',
            },
            {
                heading: '1. Noun — the naming word',
                body: `A **noun** is the name of a person, place, thing, or idea.\n\n🔹 **Examples:**\n• Person: *teacher, student, mother*\n• Place: *Tanzania, Dar es Salaam, school*\n• Thing: *book, pen, table*\n• Idea: *freedom, love, education*\n\n💡 **Tip:** Ask yourself — "Can I put 'the' or 'a' in front of this word?" If yes, it's probably a noun.`,
                type: 'content',
            },
            {
                heading: '2. Verb — the action word',
                body: `A **verb** shows an action or a state of being.\n\n🔹 **Action verbs:** *run, write, study, eat, laugh*\n🔹 **State verbs:** *is, are, was, were, seem, appear*\n\n📝 **Example sentence:**\n"The student **writes** in her notebook every day."\n\nHere, **writes** is the verb — it shows the action.`,
                type: 'content',
            },
            {
                heading: '3. Adjective — the describing word',
                body: `An **adjective** describes or modifies a noun.\n\n🔹 **Examples:**\n• *The **tall** student won the prize.*\n• *Tanzania has **beautiful** landscapes.*\n• *She is a **hardworking** girl.*\n\n🎯 **NECTA Exam Tip:** Adjectives usually come **before** the noun they describe, or after a linking verb (is, are, was).`,
                type: 'content',
            },
            {
                heading: '4. Adverb — modifies verbs',
                body: `An **adverb** describes how, when, where, or how much an action happens. Many adverbs end in **-ly**.\n\n🔹 **Examples:**\n• *She studied **quickly** for the exam.*\n• *He arrived **early** at school.*\n• *They spoke **loudly** in class.*\n\n🔹 Common adverbs: *very, always, never, often, well, hard*`,
                type: 'content',
            },
            {
                heading: 'Quick Summary',
                body: `Here are the 8 parts of speech:\n\n| Part of Speech | Role | Example |\n|---|---|---|\n| Noun | Name | *Tanzania* |\n| Pronoun | Replaces noun | *she, they, it* |\n| Verb | Action/State | *runs, is* |\n| Adjective | Describes noun | *beautiful* |\n| Adverb | Describes verb | *quickly* |\n| Preposition | Shows relation | *in, on, at* |\n| Conjunction | Joins words | *and, but, or* |\n| Interjection | Expresses emotion | *Wow!, Oh!* |`,
                type: 'summary',
            },
        ],
        quiz: [
            {
                q: 'In the sentence "The clever student passed her exams", what part of speech is "clever"?',
                options: ['Noun', 'Verb', 'Adjective', 'Adverb'],
                correct: 2,
                explanation: '"Clever" describes the noun "student" — making it an adjective.',
            },
            {
                q: 'Which of these words is a VERB?',
                options: ['beautiful', 'Tanzania', 'study', 'quickly'],
                correct: 2,
                explanation: '"Study" shows an action — it is a verb. "Beautiful" is an adjective, "Tanzania" is a noun, and "quickly" is an adverb.',
            },
            {
                q: 'What is the noun in: "The tall teacher explained the lesson clearly"?',
                options: ['tall', 'teacher', 'explained', 'clearly'],
                correct: 1,
                explanation: '"Teacher" is the noun — it is the name of a person.',
            },
        ],
    },
    m1: {
        sections: [
            {
                heading: 'Fractions — What Are They?',
                body: `A **fraction** represents a part of a whole. It has two parts:\n\n• **Numerator** (top number) — how many parts you have\n• **Denominator** (bottom number) — total parts the whole is divided into\n\n🔹 Example: ¾ means you have **3 out of 4** equal parts.`,
                type: 'intro',
            },
            {
                heading: 'Adding Fractions',
                body: `**Same denominator:** Simply add the numerators.\n\n   1/5 + 2/5 = 3/5 ✅\n\n**Different denominators:** Find the LCM first.\n\n   1/3 + 1/4\n   LCM of 3 and 4 = 12\n   = 4/12 + 3/12\n   = 7/12 ✅\n\n💡 **Tip:** Always simplify your answer if possible.`,
                type: 'content',
            },
            {
                heading: 'Converting Fractions to Decimals',
                body: `Simply **divide** the numerator by the denominator.\n\n🔹 1/4 = 1 ÷ 4 = **0.25**\n🔹 3/5 = 3 ÷ 5 = **0.6**\n🔹 7/8 = 7 ÷ 8 = **0.875**\n\nRemember: Decimals and fractions represent the **same value** in different forms.`,
                type: 'content',
            },
        ],
        quiz: [
            {
                q: 'What is 2/6 simplified to its lowest form?',
                options: ['1/3', '2/4', '1/2', '2/3'],
                correct: 0,
                explanation: 'Both 2 and 6 are divisible by 2. 2÷2=1, 6÷2=3. So 2/6 = 1/3.',
            },
            {
                q: 'What is 1/4 as a decimal?',
                options: ['0.14', '0.4', '0.25', '4.0'],
                correct: 2,
                explanation: '1 ÷ 4 = 0.25. You can also think of it as 25 cents out of 1 shilling.',
            },
        ],
    },
};

const FALLBACK_CONTENT = {
    sections: [
        {
            heading: 'Introduction',
            body: `Welcome to this lesson! This content is being prepared by our team and will be available soon.\n\nIn the meantime, you can:\n\n🤖 **Ask Bona AI** to explain this topic\n📝 **Take the quiz** to test what you already know\n🏫 **Join a Study Room** with classmates`,
            type: 'intro',
        },
    ],
    quiz: [
        {
            q: 'How many months are in a year?',
            options: ['10', '11', '12', '13'],
            correct: 2,
            explanation: 'There are 12 months in a year.',
        },
    ],
};

// ─── Section Renderer ────────────────────────────────────────
const Section = ({ section, index, colors }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1, duration: 400, delay: index * 120,
            useNativeDriver: true,
        }).start();
    }, []);

    const bgColor = section.type === 'intro'   ? 'rgba(0,168,107,0.1)'
                  : section.type === 'summary'  ? 'rgba(0,119,182,0.1)'
                  : 'rgba(255,255,255,0.04)';

    const borderColor = section.type === 'intro'   ? 'rgba(0,168,107,0.3)'
                      : section.type === 'summary'  ? 'rgba(0,119,182,0.3)'
                      : 'rgba(255,255,255,0.08)';

    // Simple markdown-like renderer for bold **text**
    const renderBody = (text) => {
        const parts = text.split(/\*\*(.+?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1
                ? <Text key={i} style={styles.bold}>{part}</Text>
                : <Text key={i}>{part}</Text>
        );
    };

    return (
        <Animated.View style={[styles.section, { backgroundColor: bgColor, borderColor, opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [12, 0] }) }]
        }]}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{renderBody(section.body)}</Text>
        </Animated.View>
    );
};

// ─── Quiz Section ─────────────────────────────────────────────
const QuizSection = ({ quiz, xp, onComplete }) => {
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const q = quiz[current];

    const handleSelect = (i) => {
        if (selected !== null) return;
        setSelected(i);
        const correct = i === q.correct;
        if (correct) {
            setScore(s => s + 1);
        } else {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start();
        }
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (current < quiz.length - 1) {
            setCurrent(c => c + 1);
            setSelected(null);
            setShowExplanation(false);
        } else {
            setDone(true);
            onComplete(score + (selected === q.correct ? 1 : 0));
        }
    };

    if (done) {
        const finalScore = score + (selected === q.correct ? 1 : 0);
        const perfect = finalScore === quiz.length;
        return (
            <View style={styles.quizDone}>
                <Text style={styles.quizDoneEmoji}>{perfect ? '🏆' : '⭐'}</Text>
                <Text style={styles.quizDoneTitle}>{perfect ? 'Perfect Score!' : 'Well done!'}</Text>
                <Text style={styles.quizDoneScore}>{finalScore} / {quiz.length} correct</Text>
                <Text style={styles.quizXpEarned}>+{finalScore * Math.floor(xp / quiz.length)} XP earned</Text>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.quizCard, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={styles.quizProgress}>
                <Text style={styles.quizProgressText}>Question {current + 1} of {quiz.length}</Text>
                <View style={styles.quizProgressBar}>
                    <View style={[styles.quizProgressFill, { width: `${((current) / quiz.length) * 100}%` }]} />
                </View>
            </View>

            <Text style={styles.quizQuestion}>{q.q}</Text>

            {q.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.06)';
                let border = 'rgba(255,255,255,0.1)';
                if (selected !== null) {
                    if (i === q.correct) { bg = 'rgba(0,168,107,0.2)'; border = '#00A86B'; }
                    else if (i === selected) { bg = 'rgba(239,68,68,0.2)'; border = '#EF4444'; }
                }
                return (
                    <TouchableOpacity key={i} onPress={() => handleSelect(i)}
                        style={[styles.quizOption, { backgroundColor: bg, borderColor: border }]}
                        disabled={selected !== null}>
                        <Text style={styles.quizOptionLetter}>{String.fromCharCode(65 + i)}.</Text>
                        <Text style={styles.quizOptionText}>{opt}</Text>
                        {selected !== null && i === q.correct && <CheckCircle size={16} color="#00A86B" />}
                    </TouchableOpacity>
                );
            })}

            {showExplanation && (
                <View style={styles.explanation}>
                    <Text style={styles.explanationTitle}>
                        {selected === q.correct ? '✅ Correct!' : '❌ Not quite...'}
                    </Text>
                    <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
            )}

            {selected !== null && (
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <LinearGradient colors={['#00A86B', '#00C27B']} style={styles.nextBtnGrad} start={{x:0}} end={{x:1}}>
                        <Text style={styles.nextBtnText}>
                            {current < quiz.length - 1 ? 'Next Question →' : 'Finish Quiz 🏁'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

// ─── Main LessonDetail Screen ─────────────────────────────────
const LessonDetailScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    const { lesson, subjectColor = '#00A86B', course } = route.params || {};

    const [activeTab, setActiveTab] = useState('lesson'); // 'lesson' | 'quiz'
    const [quizComplete, setQuizComplete] = useState(false);
    const scrollRef = useRef(null);

    const content = LESSON_CONTENT[lesson?.id] || FALLBACK_CONTENT;

    const handleQuizComplete = (score) => {
        setQuizComplete(true);
    };

    const handleVideo = () => {
        if (!lesson?.videoUrl) {
            Alert.alert('Teacher video coming soon', 'This session is ready with reading material and exercises. Add a licensed teacher video URL in the course catalog to publish the video lesson.');
            return;
        }
        Linking.openURL(lesson.videoUrl);
    };

    return (
        <View style={styles.container}>
            {/* Hero Header */}
            <LinearGradient
                colors={[subjectColor + 'DD', subjectColor + '44', '#0A1628']}
                style={styles.hero}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.heroNav}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.heroMeta}>
                            <Star size={12} color="#FFB800" />
                            <Text style={styles.heroXP}>{lesson?.xp || 15} XP</Text>
                        </View>
                    </View>
                    <Text style={styles.heroEmoji}>{lesson?.icon || '📚'}</Text>
                    <Text style={styles.heroTitle}>{lesson?.title || 'Lesson'}</Text>
                    <Text style={styles.heroDesc}>{lesson?.description || ''}</Text>
                    {course && <Text style={styles.courseLabel}>{course.title} · {course.teacher}</Text>}
                    <View style={styles.heroBadges}>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>⏱ {lesson?.duration || '15 min'}</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>{'★'.repeat(lesson?.difficulty || 2)}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Tab Toggle */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'lesson' && styles.tabActive]}
                    onPress={() => setActiveTab('lesson')}>
                    <BookOpen size={15} color={activeTab === 'lesson' ? '#00A86B' : '#7A8FAD'} />
                    <Text style={[styles.tabText, activeTab === 'lesson' && styles.tabTextActive]}>Lesson</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'quiz' && styles.tabActive]}
                    onPress={() => setActiveTab('quiz')}>
                    <Zap size={15} color={activeTab === 'quiz' ? '#FFB800' : '#7A8FAD'} />
                    <Text style={[styles.tabText, activeTab === 'quiz' && styles.tabTextActive]}>Quiz</Text>
                    {quizComplete && <Award size={12} color="#FFB800" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
            </View>

            <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
                {activeTab === 'lesson' ? (
                    <View style={styles.lessonContent}>
                        {course && (
                            <TouchableOpacity style={styles.videoCard} onPress={handleVideo}>
                                <View style={styles.videoIcon}><PlayCircle size={25} color="#00C27B" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.videoTitle}>{lesson?.videoUrl ? 'Watch teacher chapter' : 'Teacher chapter being prepared'}</Text>
                                    <Text style={styles.videoMeta}>{lesson?.duration || '15 min'} video · {lesson?.exerciseCount || content.quiz.length} exercises after the lesson</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        {content.sections.map((sec, i) => (
                            <Section key={i} section={sec} index={i} colors={colors} />
                        ))}

                        {/* Ask AI Button */}
                        <TouchableOpacity
                            style={styles.askAIBtn}
                            onPress={() => navigation.navigate('AITutor', { context: lesson?.title })}
                        >
                            <LinearGradient colors={['#0077B6', '#0099D4']} style={styles.askAIGrad} start={{x:0}} end={{x:1}}>
                                <MessageSquare size={18} color="#fff" />
                                <Text style={styles.askAIText}>Ask Bona AI about this lesson</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.startQuizBtn} onPress={() => { setActiveTab('quiz'); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}>
                            <LinearGradient colors={['#FFB800', '#FF8C00']} style={styles.startQuizGrad} start={{x:0}} end={{x:1}}>
                                <Text style={styles.startQuizText}>Take the Quiz → +{lesson?.xp || 15} XP</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.lessonContent}>
                        <QuizSection quiz={content.quiz} xp={lesson?.xp || 15} onComplete={handleQuizComplete} />
                    </View>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A1628' },

    // Hero
    hero:     { paddingBottom: 20, paddingHorizontal: 20 },
    heroNav:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    backBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    heroXP:   { color: '#FFB800', fontSize: 13, fontWeight: '700' },
    heroEmoji: { fontSize: 48, marginBottom: 8 },
    heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
    heroDesc:  { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
    courseLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '600', marginTop: -5, marginBottom: 12 },
    heroBadges: { flexDirection: 'row', gap: 8 },
    heroBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    },
    heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 20, marginVertical: 12,
        borderRadius: 14, padding: 4,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 10, gap: 6,
    },
    tabActive:     { backgroundColor: 'rgba(255,255,255,0.08)' },
    tabText:       { color: '#7A8FAD', fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: '#F0F4FF' },

    // Content
    scroll:        { flex: 1 },
    lessonContent: { paddingHorizontal: 20, paddingTop: 8 },
    videoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,168,107,0.10)', borderWidth: 1, borderColor: 'rgba(0,194,123,0.28)', borderRadius: 16, padding: 14, marginBottom: 14 },
    videoIcon: { height: 44, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,194,123,0.12)' },
    videoTitle: { color: '#F0F4FF', fontSize: 14, fontWeight: '800' },
    videoMeta: { color: '#A0B0CC', fontSize: 12, marginTop: 4 },

    // Section
    section: {
        borderRadius: 16, borderWidth: 1,
        padding: 18, marginBottom: 14,
    },
    sectionHeading: { fontSize: 17, fontWeight: '800', color: '#F0F4FF', marginBottom: 10 },
    sectionBody:    { fontSize: 14, color: '#A0B0CC', lineHeight: 22 },
    bold:           { color: '#F0F4FF', fontWeight: '700' },

    // Buttons
    askAIBtn:    { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
    askAIGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52 },
    askAIText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
    startQuizBtn:  { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    startQuizGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
    startQuizText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    // Quiz
    quizCard:    { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    quizProgress:{ marginBottom: 20 },
    quizProgressText: { color: '#7A8FAD', fontSize: 12, fontWeight: '600', marginBottom: 8 },
    quizProgressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
    quizProgressFill: { height: 4, backgroundColor: '#00A86B', borderRadius: 2 },
    quizQuestion: { fontSize: 16, fontWeight: '700', color: '#F0F4FF', lineHeight: 24, marginBottom: 16 },
    quizOption: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 10,
    },
    quizOptionLetter: { color: '#7A8FAD', fontSize: 13, fontWeight: '700', width: 20 },
    quizOptionText:   { flex: 1, color: '#F0F4FF', fontSize: 14, fontWeight: '500' },
    explanation: {
        backgroundColor: 'rgba(0,168,107,0.1)', borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: 'rgba(0,168,107,0.2)', marginTop: 8, marginBottom: 12,
    },
    explanationTitle: { color: '#F0F4FF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    explanationText:  { color: '#A0B0CC', fontSize: 13, lineHeight: 20 },
    nextBtn:     { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    nextBtnGrad: { height: 52, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    // Quiz Done
    quizDone:      { alignItems: 'center', padding: 32 },
    quizDoneEmoji: { fontSize: 64, marginBottom: 12 },
    quizDoneTitle: { fontSize: 26, fontWeight: '900', color: '#F0F4FF', marginBottom: 8 },
    quizDoneScore: { fontSize: 18, color: '#7A8FAD', marginBottom: 8 },
    quizXpEarned:  { fontSize: 20, fontWeight: '800', color: '#FFB800' },
});

export default LessonDetailScreen;
