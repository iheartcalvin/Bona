import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// ─── Grade Options ──────────────────────────────────────────
const GRADE_GROUPS = [
    { id: 'primary_low',  label: 'Standard 1 – 4',  ages: '7–10 years',    emoji: '🌱', color: '#10B981' },
    { id: 'primary_high', label: 'Standard 5 – 7',  ages: '11–13 years',   emoji: '🌿', color: '#00A86B' },
    { id: 'secondary_o',  label: 'Form 1 – 4',      ages: '14–17 years',   emoji: '📘', color: '#0077B6' },
    { id: 'secondary_a',  label: 'Form 5 – 6',      ages: '17–18 years',   emoji: '🎓', color: '#FFB800' },
];

// ─── Onboarding Slides ──────────────────────────────────────
const SLIDES = [
    {
        id: '1',
        emoji: '🎓',
        title: 'Welcome to Bona!',
        subtitle: 'Your personal AI tutor — built for Tanzania students.',
        description: 'Learn every NECTA subject at your own pace, with lessons designed to make hard topics easy and fun.',
        bg:   ['#060E1E', '#0A2440'],
        glow: '#00A86B',
    },
    {
        id: '2',
        emoji: '🤖',
        title: 'Meet Your AI Tutor',
        subtitle: 'Ask anything. Get real answers. In English.',
        description: 'Bona AI explains concepts step by step, generates quizzes, checks your work, and encourages you — just like a great teacher would.',
        bg:   ['#060E1E', '#0A1E3A'],
        glow: '#0077B6',
    },
    {
        id: '3',
        emoji: '🏆',
        title: 'Learn. Practice. Win.',
        subtitle: 'Earn XP, badges, and climb the leaderboard.',
        description: 'Complete daily challenges, build study streaks, and compete with students across Tanzania. Learning has never been this exciting.',
        bg:   ['#060E1E', '#1A1000'],
        glow: '#FFB800',
    },
    {
        id: '4',
        emoji: '📚',
        title: 'What grade are you in?',
        subtitle: 'We\'ll personalise your experience.',
        description: null,   // Grade picker slide
        bg:   ['#060E1E', '#001A0E'],
        glow: '#00A86B',
        isGradePicker: true,
    },
];

// ─── Slide Component ────────────────────────────────────────
const Slide = ({ item, selectedGrade, onGradeSelect }) => {
    const glowAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1.15, duration: 2000, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <LinearGradient colors={item.bg} style={styles.slide}>
            {/* Glow orb */}
            <Animated.View style={[
                styles.glowOrb,
                { backgroundColor: item.glow + '18', transform: [{ scale: glowAnim }] }
            ]} />

            {/* Emoji hero */}
            <Text style={styles.heroEmoji}>{item.emoji}</Text>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={[styles.slideSubtitle, { color: item.glow }]}>{item.subtitle}</Text>

            {item.isGradePicker ? (
                <View style={styles.gradeGrid}>
                    {GRADE_GROUPS.map(g => (
                        <TouchableOpacity
                            key={g.id}
                            style={[
                                styles.gradeCard,
                                selectedGrade === g.id && { borderColor: g.color, backgroundColor: g.color + '22' }
                            ]}
                            onPress={() => onGradeSelect(g.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.gradeEmoji}>{g.emoji}</Text>
                            <Text style={[styles.gradeLabel, selectedGrade === g.id && { color: g.color }]}>
                                {g.label}
                            </Text>
                            <Text style={styles.gradeAges}>{g.ages}</Text>
                            {selectedGrade === g.id && (
                                <View style={[styles.gradeBadge, { backgroundColor: g.color }]}>
                                    <Text style={styles.gradeBadgeText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <Text style={styles.slideDescription}>{item.description}</Text>
            )}
        </LinearGradient>
    );
};

// ─── Main Onboarding ────────────────────────────────────────
const OnboardingScreen = () => {
    const navigation = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const flatListRef = useRef(null);

    const isLast = currentIndex === SLIDES.length - 1;
    const currentSlide = SLIDES[currentIndex];

    const handleNext = async () => {
        if (!isLast) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            // Save grade and complete onboarding
            if (selectedGrade) {
                await AsyncStorage.setItem('selectedGrade', selectedGrade);
            }
            await AsyncStorage.setItem('onboardingCompleted', 'true');
            navigation.navigate('Main');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        navigation.navigate('Main');
    };

    const canProceed = !isLast || selectedGrade !== null;

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={styles.container}>
            {/* Skip button */}
            {!isLast && (
                <SafeAreaView style={styles.skipContainer}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item }) => (
                    <Slide
                        item={item}
                        selectedGrade={selectedGrade}
                        onGradeSelect={setSelectedGrade}
                    />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={!isLast || !!selectedGrade}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                keyExtractor={(item) => item.id}
            />

            {/* Footer */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                {/* Dots */}
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                currentIndex === i && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    style={[styles.ctaBtn, !canProceed && styles.ctaBtnDisabled]}
                    onPress={handleNext}
                    disabled={!canProceed}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={canProceed ? ['#00A86B', '#00C27B'] : ['#1E3A6B', '#1E3A6B']}
                        style={styles.ctaGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.ctaText}>
                            {isLast
                                ? (selectedGrade ? "Let's Start Learning! 🚀" : 'Pick your grade first')
                                : (currentIndex === 0 ? "Get Started →" : "Next →")
                            }
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {isLast && (
                    <TouchableOpacity onPress={handleSkip} style={styles.laterBtn}>
                        <Text style={styles.laterText}>I'll set this up later</Text>
                    </TouchableOpacity>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#060E1E',
    },
    skipContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        paddingRight: 20,
        paddingTop: 8,
    },
    skipBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    skipText: {
        color: 'rgba(240,244,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    // ── Slide ──
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 80,
        paddingBottom: 20,
    },
    glowOrb: {
        position: 'absolute',
        top: height * 0.15,
        width: 280,
        height: 280,
        borderRadius: 140,
    },
    heroEmoji: {
        fontSize: 90,
        marginBottom: 24,
    },
    slideTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#F0F4FF',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    slideSubtitle: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    slideDescription: {
        fontSize: 15,
        color: '#7A8FAD',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
    },
    // ── Grade Picker ──
    gradeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
        gap: 12,
    },
    gradeCard: {
        width: (width - 28 * 2 - 12) / 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    gradeEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    gradeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F0F4FF',
        textAlign: 'center',
        marginBottom: 4,
    },
    gradeAges: {
        fontSize: 12,
        color: '#7A8FAD',
        textAlign: 'center',
    },
    gradeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradeBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
    },
    // ── Footer ──
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 8,
        backgroundColor: '#060E1E',
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        width: 28,
        borderRadius: 4,
        backgroundColor: '#00A86B',
    },
    ctaBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#00A86B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    ctaBtnDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    ctaGradient: {
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    laterBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    laterText: {
        color: 'rgba(240,244,255,0.4)',
        fontSize: 13,
    },
});

export default OnboardingScreen;
