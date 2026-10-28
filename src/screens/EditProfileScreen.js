import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Check, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserService } from '../services/userService';
import { SPACING, GRADIENTS } from '../theme/colors';

const EditProfileScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors, gradients } = useTheme();
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState(user?.fullName || user?.displayName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUri, setAvatarUri] = useState(user?.photoURL);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(true);

    // Initial check to avoid showing error on load
    useEffect(() => {
        if (user?.username === username) setUsernameAvailable(true);
    }, []);

    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "We need access to your photos to update your profile picture.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image.");
        }
    };

    const handleSave = async () => {
        if (!username || username.length < 3) {
            Alert.alert("Invalid Input", "Username must be at least 3 characters.");
            return;
        }

        setLoading(true);
        try {
            let finalPhotoUrl = user.photoURL;

            // Upload new image if changed
            if (avatarUri && avatarUri !== user.photoURL) {
                // Compress first
                const manipResult = await manipulateAsync(
                    avatarUri,
                    [{ resize: { width: 500 } }],
                    { compress: 0.7, format: SaveFormat.JPEG }
                );
                finalPhotoUrl = await UserService.uploadProfileImage(user.uid, manipResult.uri);
            }

            // Update Profile
            await UserService.updateUserProfile(user.uid, {
                fullName,
                username,
                bio,
                photoURL: finalPhotoUrl
            });

            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={colors.text} size={28} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                        {loading ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.content}>

                        {/* Avatar Section */}
                        <View style={styles.avatarSection}>
                            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                                <Image source={{ uri: avatarUri || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                                <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                                    <Camera size={16} color="white" />
                                </View>
                            </TouchableOpacity>
                            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Profile Photo</Text>
                        </View>

                        {/* Fields */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Your Name"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
                                <View>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                                        value={username}
                                        onChangeText={setUsername}
                                        placeholder="username"
                                        placeholderTextColor={colors.textSecondary}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    saveText: { fontSize: 16, fontWeight: '700' },
    content: { padding: SPACING.lg },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
    changePhotoText: { fontSize: 14, fontWeight: '600' },
    form: { gap: 24 },
    inputGroup: { gap: 8 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1 },
    textArea: { height: 100, textAlignVertical: 'top' }
});

export default EditProfileScreen;
