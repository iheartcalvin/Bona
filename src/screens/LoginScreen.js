import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GRADIENTS, SPACING } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ClickPesaService } from '../services/ClickPesaService';

const LoginScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [identifier, setIdentifier] = useState(''); // Email or Username
    const [password, setPassword] = useState('');
    const { signIn, resetPassword, signInWithGoogle } = useAuth();

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        let loginEmail = identifier;

        // Check if input is NOT an email (simple check)
        const isEmail = identifier.includes('@');

        if (!isEmail) {
            // Assume it's a username, resolve to email
            try {
                const user = await UserService.getUserByUsername(identifier.toLowerCase());
                if (!user) {
                    Alert.alert('Error', 'Username not found.');
                    return;
                }
                loginEmail = user.email;
            } catch (error) {
                console.error("Username lookup error:", error);
                Alert.alert('Error', 'Login failed during username lookup.');
                return;
            }
        }

        try {
            const result = await signIn(loginEmail, password);
            if (result && result.user && !result.user.emailVerified) {
                // We let them in for now as per plan, but RootNavigator will handle blocking if needed
                // Or we can alert them here
                Alert.alert('Verify Email', 'Please verify your email to access all features.');
            }
        } catch (error) {
            let message = 'Failed to sign in. Please check your credentials.';
            if (error.code === 'auth/user-not-found') message = 'Account not found';
            if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
            if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
            Alert.alert('Login Error', message);
        }
    };

    const handleForgotPassword = async () => {
        if (!identifier) {
            Alert.alert('Error', 'Please enter your email or username first.');
            return;
        }

        let resetEmail = identifier;
        const isEmail = identifier.includes('@');

        if (!isEmail) {
            try {
                const user = await UserService.getUserByUsername(identifier.toLowerCase());
                if (!user) {
                    Alert.alert('Error', 'Username not found.');
                    return;
                }
                resetEmail = user.email;
            } catch (error) {
                Alert.alert('Error', 'Could not resolve username.');
                return;
            }
        }

        try {
            // Manual check for existence via Firestore
            // Note: This requires firestore.rules to allow 'list' access on users collection
            const usersRef = collection(db, 'users');
            // We use limit(1) to satisfy strict security rules for unauthenticated queries
            const q = query(usersRef, where('email', '==', resetEmail.toLowerCase().trim()), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert('Error', 'Account not found');
                return;
            }

            await resetPassword(resetEmail);
            Alert.alert('Success', `Password reset email sent to ${resetEmail}! Check your inbox.`);
        } catch (error) {
            console.log('Reset Password Error:', error.code, error.message);
            let message = 'Could not send reset email. Please try again.';
            if (error.code === 'auth/user-not-found') {
                message = 'Account not found';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many requests. Please try again later.';
            } else if (error.code === 'permission-denied') {
                message = 'Unable to check account. Please try again.';
            }
            Alert.alert('Error', message);
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'center', padding: SPACING.xl }}
                >
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={{ width: 150, height: 50, resizeMode: 'contain', marginBottom: 30 }}
                        />
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIcon}>
                                <Mail size={20} color={colors.primary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Email or Username"
                                placeholderTextColor={colors.textSecondary}
                                value={identifier}
                                onChangeText={setIdentifier}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIcon}>
                                <Lock size={20} color={colors.primary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                            <LinearGradient colors={GRADIENTS.primary} style={styles.loginBtnGradient}>
                                <Text style={styles.loginBtnText}>Login</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.googleBtn} onPress={async () => {
                            try {
                                await signInWithGoogle();
                            } catch (error) {
                                Alert.alert('Error', error.message);
                            }
                        }}>
                            <View style={styles.googleIconContainer}>
                                <Text style={styles.googleLetter}>G</Text>
                            </View>
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerLink}
                            onPress={() => navigation.navigate('SignUp')}
                        >
                            <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerTextBold}>Register</Text></Text>
                        </TouchableOpacity>


                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: colors.textSecondary, fontSize: 18, fontWeight: '500' },
    form: { width: '100%' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: SPACING.md,
        height: 60,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    inputIcon: { marginRight: SPACING.sm },
    input: { flex: 1, color: colors.text, fontSize: 16 },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotPasswordText: { color: colors.primary, fontWeight: '600' },
    loginBtn: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    loginBtnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
    loginBtnText: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { color: colors.textSecondary, marginHorizontal: 16, fontSize: 14, fontWeight: '600' },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        height: 60,
        borderRadius: 16,
        gap: 12
    },
    googleIconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center'
    },
    googleLetter: { fontSize: 24, fontWeight: '900', color: '#4285F4' },
    googleBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
    registerLink: { marginTop: 24, alignItems: 'center' },
    registerText: { color: colors.textSecondary, fontSize: 15 },
    registerTextBold: { color: colors.primary, fontWeight: '700' }
});

export default LoginScreen;
