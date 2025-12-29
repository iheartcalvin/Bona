import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';

import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { signIn, signInWithGoogle } = useAuth();

    const handleLogin = async () => {
        if (!formData.email || !formData.password) {
            alert('Please enter email and password');
            return;
        }
        try {
            await signIn(formData.email, formData.password);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert('Invalid email or password');
            } else {
                alert(error.message);
            }
        }
    };

    return (
        <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <ChevronLeft size={28} color={COLORS.text} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <View style={styles.securityBadge}>
                                <ShieldCheck size={40} color={COLORS.primary} strokeWidth={2.5} />
                            </View>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Secure access to your session</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Mail size={20} color={COLORS.primary} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIcon}>
                                    <Lock size={20} color={COLORS.primary} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={formData.password}
                                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity style={styles.forgotPass}>
                                <Text style={styles.forgotPassText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                                <LinearGradient colors={GRADIENTS.primary} style={styles.loginBtnGradient}>
                                    <Text style={styles.loginBtnText}>Login</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or continue with</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity style={styles.googleBtn} onPress={async () => {
                                try {
                                    await signInWithGoogle();
                                } catch (error) {
                                    console.error('Google Login Error:', error);
                                    alert(error.message);
                                }
                            }}>
                                <View style={styles.googleIconContainer}>
                                    <Text style={styles.googleLetter}>G</Text>
                                </View>
                                <Text style={styles.googleBtnText}>Continue with Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.signupLink}
                                onPress={() => navigation.navigate('SignUp')}
                            >
                                <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: SPACING.xl, flex: 1, justifyContent: 'center' },
    backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 10 },
    header: { alignItems: 'center', marginBottom: 40 },
    securityBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(108, 99, 255, 0.2)'
    },
    title: { color: COLORS.text, fontSize: 32, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: COLORS.textSecondary, fontSize: 16, textAlign: 'center' },
    form: { width: '100%' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: SPACING.md,
        height: 60,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    inputIcon: { marginRight: SPACING.sm },
    input: { flex: 1, color: COLORS.text, fontSize: 16 },
    forgotPass: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotPassText: { color: COLORS.primary, fontWeight: '600' },
    loginBtn: { borderRadius: 16, overflow: 'hidden', elevation: 8 },
    loginBtnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
    loginBtnText: { color: 'white', fontSize: 20, fontWeight: '800' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { color: COLORS.textSecondary, marginHorizontal: 16, fontSize: 14 },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        height: 60,
        borderRadius: 16,
        gap: 12
    },
    googleIconContainer: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    googleLetter: { fontSize: 24, fontWeight: '900', color: '#4285F4' },
    googleBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
    signupLink: { marginTop: 30, alignItems: 'center' },
    signupText: { color: COLORS.textSecondary, fontSize: 15 },
    signupTextBold: { color: COLORS.primary, fontWeight: '700' }
});

export default LoginScreen;
