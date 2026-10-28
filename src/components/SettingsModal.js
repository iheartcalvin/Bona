import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, LogOut, Edit2, Shield, ExternalLink, Mail, Phone, Heart, X, UserCircle, HelpCircle, FileText, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserService } from '../services/userService';
import { SPACING } from '../theme/colors';

const SettingsModal = ({ visible, onClose }) => {
    const { user, signOut, resetPassword } = useAuth();
    const { colors, gradients, theme, setTheme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();


    // Handle Profile Picture Update
    // Handle Profile Picture Update
    const handleUpdateProfilePicture = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Need photo access to update profile picture.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                // Compress to ensured adherence to Firestore 1MB limit for Base64
                const manipResult = await manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 500 } }],
                    { compress: 0.5, format: SaveFormat.JPEG }
                );

                Alert.alert("Uploading...", "Updating profile picture...");

                // 1. Convert to Base64 (UserService handles this now)
                const base64Url = await UserService.uploadProfileImage(user.uid, manipResult.uri);

                // 2. Update Firestore Document
                await UserService.updateUserProfile(user.uid, { photoURL: base64Url });

                Alert.alert("Success", "Profile picture updated!");
            }
        } catch (error) {
            console.error("Profile picture update error:", error);
            Alert.alert("Error", `Failed to upload image: ${error.message}`);
        }
    };

    const handlePasswordReset = async () => {
        if (user?.email) {
            try {
                await resetPassword(user.email);
                Alert.alert("Check your email", `We sent a password reset link to ${user.email}`);
            } catch (error) {
                Alert.alert("Error", error.message);
            }
        } else {
            Alert.alert("Error", "No email associated with this account.");
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        modalContainer: { flex: 1 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
        modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
        modalContent: { padding: SPACING.lg },

        mgmtContent: { marginBottom: 24 },
        mgmtCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
        mgmtRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
        mgmtDivider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 52 },
        mgmtLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
        mgmtText: { color: colors.text, fontSize: 16, fontWeight: '600' },
        mgmtSubText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

        settingsGroupTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
        settingsGroup: { marginBottom: 32 },

        logoutButtonSettings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 32 },
        logoutText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' }
    }), [colors]);

    // Force delayed render to fix Android Modal scroll freeze
    const [isReady, setIsReady] = useState(false);

    React.useEffect(() => {
        if (visible) {
            // Reset check
            setIsReady(false);
            // Wait for modal animation frame
            const timer = setTimeout(() => setIsReady(true), 150);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <LinearGradient colors={gradients.background} style={styles.modalContainer}>
                <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }} collapsable={false}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.text} size={28} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>App Settings</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {isReady && (
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={[styles.modalContent, { flexGrow: 1, paddingBottom: 100 }]}
                            removeClippedSubviews={false}
                            nestedScrollEnabled={true}
                        >
                            <View style={styles.mgmtContent}>
                                <TouchableOpacity style={styles.mgmtRow} onPress={handleUpdateProfilePicture}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Image
                                            source={{ uri: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200' }}
                                            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                                        />
                                        <View>
                                            <Text style={styles.mgmtText}>Change Profile Picture</Text>
                                            <Text style={styles.mgmtSubText}>Tap to select a new photo</Text>
                                        </View>
                                    </View>
                                    <Edit2 size={16} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.settingsGroupTitle, { marginTop: 24 }]}>Account Security</Text>
                            <View style={styles.mgmtCard}>
                                <TouchableOpacity style={styles.mgmtRow} onPress={() => {
                                    onClose();
                                    navigation.navigate('EditProfile');
                                }}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <UserCircle size={20} color={colors.primary} />
                                        <Text style={styles.mgmtText}>Edit Profile</Text>
                                    </View>
                                    <Edit2 size={14} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <View style={styles.mgmtDivider} />
                                <TouchableOpacity style={styles.mgmtRow} onPress={handlePasswordReset}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Shield size={20} color={colors.primary} />
                                        <Text style={styles.mgmtText}>Update Password via Email</Text>
                                    </View>
                                    <ExternalLink size={14} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.settingsGroupTitle, { marginTop: 24 }]}>Preferences</Text>
                            <View style={styles.mgmtCard}>
                                {/* Notifications Toggle */}
                                <View style={styles.mgmtRow}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Shield size={20} color={colors.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Enable Notifications</Text>
                                            <Text style={styles.mgmtSubText}>Receive prayer alerts and updates</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: colors.primary }}
                                        thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
                                        onValueChange={async (val) => {
                                            const newSettings = { ...user?.settings, notifications: val };
                                            await UserService.updateUserSettings(user.uid, newSettings);
                                        }}
                                        value={user?.settings?.notifications !== false} // Default to true if undefined
                                    />
                                </View>
                                <View style={styles.mgmtDivider} />

                                {/* Email Privacy */}
                                <View style={styles.mgmtRow}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Mail size={20} color={colors.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Email</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your email</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: colors.primary }}
                                        thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
                                        onValueChange={async (val) => {
                                            const newSettings = { ...user?.settings, emailVisible: val };
                                            await UserService.updateUserSettings(user.uid, newSettings);
                                        }}
                                        value={user?.settings?.emailVisible === true}
                                    />
                                </View>
                                <View style={styles.mgmtDivider} />

                                {/* Phone Privacy */}
                                <View style={styles.mgmtRow}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Phone size={20} color={colors.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Phone</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your number</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: colors.primary }}
                                        thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
                                        onValueChange={async (val) => {
                                            const newSettings = { ...user?.settings, phoneVisible: val };
                                            await UserService.updateUserSettings(user.uid, newSettings);
                                        }}
                                        value={user?.settings?.phoneVisible === true}
                                    />
                                </View>
                                <View style={styles.mgmtDivider} />

                                {/* Age Privacy */}
                                <View style={styles.mgmtRow}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <UserCircle size={20} color={colors.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Age</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your age</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: colors.primary }}
                                        thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
                                        onValueChange={async (val) => {
                                            const newSettings = { ...user?.settings, ageVisible: val };
                                            await UserService.updateUserSettings(user.uid, newSettings);
                                        }}
                                        value={user?.settings?.ageVisible === true}
                                    />
                                </View>
                                <View style={styles.mgmtDivider} />

                                {/* Gender Privacy */}
                                <View style={styles.mgmtRow}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <UserCircle size={20} color={colors.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Gender</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your gender</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: colors.primary }}
                                        thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
                                        onValueChange={async (val) => {
                                            const newSettings = { ...user?.settings, genderVisible: val };
                                            await UserService.updateUserSettings(user.uid, newSettings);
                                        }}
                                        value={user?.settings?.genderVisible === true}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.settingsGroupTitle, { marginTop: 24 }]}>Appearance</Text>
                            <View style={[styles.mgmtCard, { backgroundColor: colors.surface }]}>
                                <View style={{ flexDirection: 'row', padding: 8, backgroundColor: colors.inputBg, borderRadius: 12, margin: 12 }}>
                                    {['system', 'light', 'dark'].map((mode) => (
                                        <TouchableOpacity
                                            key={mode}
                                            style={[
                                                { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
                                                theme === mode && { backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
                                            ]}
                                            onPress={() => setTheme(mode)}
                                        >
                                            <Text style={[{ fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }, theme === mode ? { color: colors.text } : { color: colors.textSecondary }]}>{mode}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.settingsGroup}>
                                <Text style={[styles.settingsGroupTitle, { marginTop: 24 }]}>Support & Legal</Text>
                                <View style={styles.mgmtCard}>
                                    <TouchableOpacity
                                        style={styles.mgmtRow}
                                        onPress={() => {
                                            onClose();
                                            navigation.navigate('Help');
                                        }}
                                    >
                                        <View style={styles.mgmtLabelGroup}>
                                            <HelpCircle size={20} color={colors.primary} />
                                            <Text style={styles.mgmtText}>User Help & FAQ</Text>
                                        </View>
                                        <ChevronRight size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>

                                    <View style={styles.mgmtDivider} />

                                    <TouchableOpacity
                                        style={styles.mgmtRow}
                                        onPress={() => {
                                            onClose();
                                            navigation.navigate('Legal');
                                        }}
                                    >
                                        <View style={styles.mgmtLabelGroup}>
                                            <FileText size={20} color={colors.primary} />
                                            <Text style={styles.mgmtText}>Legal Regulations</Text>
                                        </View>
                                        <ChevronRight size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.logoutButtonSettings, { marginTop: 16, backgroundColor: 'rgba(108, 99, 255, 0.1)', borderColor: colors.primary }]}
                                    onPress={() => {
                                        onClose();
                                        navigation.navigate('Payment', {
                                            title: 'Support Engineers',
                                            description: 'Your contribution supports the technical team behind Beloved.',
                                            referencePrefix: 'SUPPORT-',
                                        });
                                    }}
                                >
                                    <Heart size={20} color={colors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.logoutText, { color: colors.primary }]}>Support Our Engineers</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.logoutButtonSettings} onPress={signOut}>
                                <LogOut size={20} color={colors.secondary} style={{ marginRight: 10 }} />
                                <Text style={styles.logoutText}>Log Out Account</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </LinearGradient>
        </Modal >
    );
};

export default SettingsModal;
