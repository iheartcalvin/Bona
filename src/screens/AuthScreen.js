import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Lock, Phone, Calendar, Heart, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GRADIENTS, SPACING } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const AuthScreen = ({ navigation }) => {
    const { colors, theme, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        dob: '',
        gender: null
    });
    const [isUsernameValid, setIsUsernameValid] = useState(null); // null, true, false
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { signUp, signInWithGoogle } = useAuth();

    // Debounce username check
    React.useEffect(() => {
        const checkUsername = async () => {
            if (formData.username.length < 3) {
                setIsUsernameValid(null);
                return;
            }
            setCheckingUsername(true);
            try {
                const available = await UserService.checkUsernameAvailability(formData.username);
                setIsUsernameValid(available);
            } catch (error) {
                console.error("Check username error", error);
            } finally {
                setCheckingUsername(false);
            }
        };

        const timer = setTimeout(() => {
            if (formData.username) checkUsername();
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.username]);

    const handleRegister = async () => {
        if (!formData.email || !formData.password || !formData.username) {
            alert('Please fill in all fields');
            return;
        }
        if (formData.username.length < 3) {
            alert('Username must be at least 3 characters');
            return;
        }
        if (isUsernameValid === false) {
            alert('Username is already taken');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const result = await signUp(formData.email, formData.password);

            // Create user profile in Firestore
            if (result && result.user) {
                // Calculate Age from DOB
                let age = null;
                if (formData.dob) {
                    const birthDate = new Date(formData.dob);
                    const today = new Date();
                    age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                }

                await UserService.createUserProfile(result.user.uid, {
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username.toLowerCase(),
                    phone: formData.phone,
                    dob: formData.dob,
                    age: age, // Calculated age
                    gender: formData.gender // 'male' or 'female'
                });

                alert('Verification email sent! Please check your inbox before logging in.');
                navigation.navigate('Login');
            }
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                alert('That email address is already in use!');
            }
            if (error.code === 'auth/invalid-email') {
                alert('That email address is invalid!');
            }
            console.error(error);
        }
    };

    const renderInput = (placeholder, icon, key, isPassword = false, keyboardType = 'default', autoCapitalize = 'sentences', textContentType = 'none') => (
        <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
                {icon}
            </View>
            <TextInput
                style={[styles.input, isPassword && { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                value={formData[key]}
                onChangeText={(text) => {
                    // For username, restrict characters if needed, e.g. no spaces
                    if (key === 'username') text = text.replace(/\s/g, '').toLowerCase();
                    setFormData({ ...formData, [key]: text })
                }}
                secureTextEntry={isPassword}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                textContentType={textContentType}
                autoCorrect={!isPassword}
            />
            {key === 'username' && formData.username.length >= 3 && (
                <View style={{ marginRight: 8 }}>
                    {checkingUsername ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Checking...</Text>
                    ) : isUsernameValid ? (
                        <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>Available</Text>
                    ) : (
                        <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700' }}>Taken</Text>
                    )}
                </View>
            )}
        </View>
    );

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const dateStr = selectedDate.toLocaleDateString('en-US'); // mm/dd/yyyy typically or system locale
            // Ideally ensure format matches what backend expects: mm/dd/yyyy based on placeholder
            const month = selectedDate.getMonth() + 1;
            const day = selectedDate.getDate();
            const year = selectedDate.getFullYear();
            const formatted = `${month}/${day}/${year}`;
            setFormData({ ...formData, dob: formatted });
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 120, height: 40, resizeMode: 'contain', marginBottom: 20 }}
                            />
                            <Text style={styles.title}>Create a Profile</Text>
                            <Text style={styles.subtitle}>Make Session</Text>
                        </View>

                        <View style={styles.form}>
                            {renderInput('First Name', <User size={20} color={colors.primary} />, 'firstName')}
                            {renderInput('Last Name', <User size={20} color={colors.primary} />, 'lastName')}
                            {renderInput('Username', <User size={20} color={colors.primary} />, 'username', false, 'default', 'none')}

                            <View style={styles.phoneInputContainer}>
                                <View style={styles.countryCode}>
                                    <Text style={styles.countryCodeText}>TZ</Text>
                                </View>
                                <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
                                    <View style={styles.inputIcon}>
                                        <Phone size={20} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="07XXXXXXXXXX"
                                        placeholderTextColor={colors.textSecondary}
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {renderInput('Email', <Mail size={20} color={colors.primary} />, 'email', false, 'email-address', 'none', 'emailAddress')}
                            {renderInput('Password', <Lock size={20} color={colors.primary} />, 'password', true, 'default', 'none', 'newPassword')}
                            {renderInput('Confirm Password', <Lock size={20} color={colors.primary} />, 'confirmPassword', true, 'default', 'none', 'newPassword')}

                            <View style={styles.row}>
                                <View style={styles.dobContainer}>
                                    <Text style={styles.label}>Date of birth</Text>
                                    <TouchableOpacity style={styles.dobInput} onPress={() => setShowDatePicker(true)}>
                                        <Calendar size={18} color={colors.primary} style={{ marginRight: 8 }} />
                                        <Text style={[styles.inputSmall, !formData.dob && { color: 'rgba(255,255,255,0.4)' }]}>
                                            {formData.dob || "mm/dd/yy"}
                                        </Text>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={new Date()}
                                            mode="date"
                                            display="default"
                                            onChange={onDateChange}
                                            maximumDate={new Date()}
                                        />
                                    )}
                                </View>

                                <View style={styles.genderContainer}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.genderOptions}>
                                        <TouchableOpacity
                                            style={styles.checkboxRow}
                                            onPress={() => setFormData({ ...formData, gender: 'male' })}
                                        >
                                            <View style={[styles.checkbox, formData.gender === 'male' && styles.checkboxActive]} />
                                            <Text style={styles.checkboxLabel}>Male</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.checkboxRow}
                                            onPress={() => setFormData({ ...formData, gender: 'female' })}
                                        >
                                            <View style={[styles.checkbox, formData.gender === 'female' && styles.checkboxActive]} />
                                            <Text style={styles.checkboxLabel}>Female</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
                                <LinearGradient colors={GRADIENTS.primary} style={styles.registerBtnGradient}>
                                    <Text style={styles.registerBtnText}>Register</Text>
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
                                    console.error('Google Sign Up Error:', error);
                                    alert(error.message);
                                }
                            }}>
                                <View style={styles.googleIconContainer}>
                                    <Text style={styles.googleLetter}>G</Text>
                                </View>
                                <Text style={styles.googleBtnText}>Sign up with Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.loginText}>Already have an account? <Text style={styles.loginTextBold}>Login</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};



const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: SPACING.xl, paddingBottom: 60 },
    header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
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
    phoneInputContainer: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    countryCode: {
        backgroundColor: colors.surface,
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    countryCodeText: { color: colors.textSecondary, fontWeight: '700', fontSize: 16 },
    row: { flexDirection: 'row', gap: 20, marginBottom: 30 },
    label: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 12 },
    dobContainer: { flex: 1 },
    dobInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    inputSmall: { flex: 1, color: colors.text, fontSize: 14 },
    genderContainer: { flex: 1 },
    genderOptions: { gap: 12 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary
    },
    checkboxActive: { backgroundColor: colors.primary },
    checkboxLabel: { color: colors.text, fontSize: 16, fontWeight: '500' },
    registerBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    registerBtnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
    registerBtnText: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 1 },

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
    googleLetter: { fontSize: 24, fontWeight: '900', color: '#4285F4' }, // Google Blue
    googleBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },

    loginLink: { marginTop: 24, alignItems: 'center' },
    loginText: { color: colors.textSecondary, fontSize: 15 },
    loginTextBold: { color: colors.primary, fontWeight: '700' }
});

export default AuthScreen;
