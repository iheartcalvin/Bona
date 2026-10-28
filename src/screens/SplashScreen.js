import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// ─── Floating Particle ────────────────────────────────────────
const Particle = ({ delay, startX, emoji, size }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 3000 + Math.random() * 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 3000 + Math.random() * 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.Text
            style={{
                position: 'absolute',
                left: startX,
                top: height * 0.15 + Math.random() * (height * 0.6),
                fontSize: size,
                opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] }),
                transform: [{
                    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }),
                }],
            }}
        >
            {emoji}
        </Animated.Text>
    );
};

// ─── Splash Screen ────────────────────────────────────────────
const BonasSplashScreen = () => {
    // Animations
    const glowAnim    = useRef(new Animated.Value(0)).current;
    const logoAnim    = useRef(new Animated.Value(0)).current;
    const textAnim    = useRef(new Animated.Value(0)).current;
    const taglineAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim   = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Sequence: glow → logo → wordmark → tagline → idle pulse
        Animated.sequence([
            Animated.timing(glowAnim, {
                toValue: 1, duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(logoAnim, {
                toValue: 1, duration: 700,
                easing: Easing.out(Easing.back(1.3)),
                useNativeDriver: true,
            }),
            Animated.timing(textAnim, {
                toValue: 1, duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(taglineAnim, {
                toValue: 1, duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Gentle idle pulse on the logo
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.06, duration: 1200,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1, duration: 1200,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    const PARTICLES = [
        { emoji: '✏️', startX: width * 0.05, size: 18, delay: 0 },
        { emoji: '📚', startX: width * 0.15, size: 22, delay: 300 },
        { emoji: '⭐', startX: width * 0.75, size: 16, delay: 150 },
        { emoji: '💡', startX: width * 0.85, size: 20, delay: 500 },
        { emoji: '🔬', startX: width * 0.60, size: 18, delay: 700 },
        { emoji: '📐', startX: width * 0.30, size: 16, delay: 400 },
        { emoji: '🌍', startX: width * 0.70, size: 20, delay: 200 },
        { emoji: '🏆', startX: width * 0.45, size: 17, delay: 600 },
    ];

    return (
        <LinearGradient
            colors={['#060E1E', '#0A1628', '#0F2040']}
            style={styles.container}
        >
            <StatusBar style="light" />

            {/* Floating background particles */}
            {PARTICLES.map((p, i) => (
                <Particle key={i} {...p} />
            ))}

            {/* Radial glow behind logo */}
            <Animated.View
                style={[styles.glowRing, {
                    opacity: glowAnim,
                    transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                }]}
            />

            {/* Logo */}
            <Animated.View
                style={{
                    opacity: logoAnim,
                    transform: [
                        { scale: Animated.multiply(
                            logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                            pulseAnim
                        )},
                        { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                    ],
                }}
            >
                <Image
                    source={require('../../assets/bona_logo.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Wordmark */}
            <Animated.Text
                style={[styles.wordmark, {
                    opacity: textAnim,
                    transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }]}
            >
                Bona
            </Animated.Text>

            {/* Tagline */}
            <Animated.Text
                style={[styles.tagline, {
                    opacity: taglineAnim,
                    transform: [{ translateY: taglineAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                }]}
            >
                Learn with Joy 🌟
            </Animated.Text>

            {/* Bottom badge */}
            <Animated.View style={[styles.bottomBadge, { opacity: taglineAnim }]}>
                <Text style={styles.bottomText}>Tanzania's #1 Learning App</Text>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: 340,
        height: 340,
        borderRadius: 170,
        backgroundColor: 'rgba(0, 168, 107, 0.08)',
        shadowColor: '#00A86B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 80,
        elevation: 20,
    },
    logo: {
        width: 180,
        height: 180,
        borderRadius: 36,
    },
    wordmark: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 16,
        textShadowColor: 'rgba(0, 168, 107, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    tagline: {
        fontSize: 17,
        color: '#FFB800',
        fontWeight: '600',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    bottomBadge: {
        position: 'absolute',
        bottom: 56,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 168, 107, 0.3)',
        backgroundColor: 'rgba(0, 168, 107, 0.08)',
    },
    bottomText: {
        color: 'rgba(240, 244, 255, 0.6)',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 1,
    },
});

export default BonasSplashScreen;
