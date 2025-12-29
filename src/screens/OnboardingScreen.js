import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    FlatList,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: '1',
        title: 'Connect with God',
        description: 'Explore a peaceful sanctuary for your daily prayers and reflections.',
        image: require('../../assets/onboarding/onboarding1.png'),
    },
    {
        id: '2',
        title: 'Daily Bible Insights',
        description: 'Receive personalized Bible verses and insights to guide your journey.',
        image: require('../../assets/onboarding/onboarding2.png'),
    },
    {
        id: '3',
        title: 'Community Support',
        description: 'Join a loving community that prays and grows together in faith.',
        image: require('../../assets/onboarding/onboarding3.png'),
    },
];

const OnboardingScreen = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const navigation = useNavigation();

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            await AsyncStorage.setItem('onboardingCompleted', 'true');
            navigation.navigate('SignUp');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        navigation.navigate('SignUp');
    };

    const renderItem = ({ item }) => (
        <View style={styles.slide}>
            <Image source={item.image} style={styles.image} resizeMode="contain" />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>

                <FlatList
                    ref={flatListRef}
                    data={ONBOARDING_DATA}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    keyExtractor={(item) => item.id}
                />

                <View style={styles.footer}>
                    <View style={styles.pagination}>
                        {ONBOARDING_DATA.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentIndex === index && styles.activeDot,
                                ]}
                            />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            style={styles.nextButtonGradient}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    image: {
        width: width * 0.8,
        height: width * 0.8,
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#334155',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: '#6366F1',
    },
    nextButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    nextButtonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 1,
    },
    skipText: {
        color: '#94A3B8',
        fontSize: 16,
    },
});

export default OnboardingScreen;
