import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, Edit2, Share2, Lock, Unlock, Mail, Phone, Heart, X, Check, UserCircle, Shield, ExternalLink, Smile, CheckCircle, UserPlus, HelpCircle, FileText, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';

import { useAuth } from '../context/AuthContext';
import { UserService } from '../services/userService';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import UserProfileModal from '../components/UserProfileModal';
import UserListModal from '../components/UserListModal';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showMoodModal, setShowMoodModal] = useState(false);

    // User data is now fully managed by AuthContext via Firestore subscription
    const { user, signOut, resetPassword } = useAuth();

    // Rewards State
    const [rewards, setRewards] = useState([]);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = UserService.subscribeToUserRewards(user.uid, (data) => {
                setRewards(data);
            });
            return () => unsubscribe();
        }
    }, [user?.uid]);

    // Helper for Badge Gradients
    const getBadgeColors = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'gold': return ['#FFD700', '#FDB931'];
            case 'silver': return ['#E0E0E0', '#BDBDBD'];
            case 'bronze': return ['#CD7F32', '#A0522D'];
            default: return ['#6c63ff', '#4ade80'];
        }
    };

    const [mood, setMood] = useState(user?.mood || { icon: '🙏', label: 'Blessed' });

    // Sync local mood state when user data updates from Firestore
    useEffect(() => {
        if (user?.mood) {
            setMood(user.mood);
        }
    }, [user?.mood]);

    // Update mood in Firestore
    const handleMoodChange = async (newMood) => {
        setMood(newMood);
        setShowMoodModal(false);
        if (user?.uid) {
            await UserService.updateUserMood(user.uid, newMood);
        }
    };

    // Identity & Contact Editing State
    const [newUsername, setNewUsername] = useState(user?.username || '');
    const [newPhone, setNewPhone] = useState(user?.phoneNumber || '');
    const [newAge, setNewAge] = useState(user?.age ? user.age.toString() : '');
    const [newGender, setNewGender] = useState(user?.gender || 'Unknown');

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState('available');

    // Reset form when modal opens
    useEffect(() => {
        if (showEditModal && user) {
            setNewUsername(user.username || '');
            setNewPhone(user.phoneNumber || '');
            setNewAge(user.age ? user.age.toString() : '');
            setNewGender(user.gender || 'Unknown');
        }
    }, [showEditModal, user]);

    const handleUsernameChange = (val) => {
        setNewUsername(val);
        if (val.length < 3) {
            setUsernameStatus('taken');
            return;
        }
        setUsernameStatus('checking');
        setIsCheckingUsername(true);
        // TODO: Implement real username availability check in UserService
        setTimeout(() => {
            setIsCheckingUsername(false);
            setUsernameStatus('available');
        }, 1000);
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

    // --- Fellowship Logic ---
    const [requests, setRequests] = useState([]);
    const [selectedUserUid, setSelectedUserUid] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = UserService.subscribeToFriendRequests(user.uid, (data) => {
                setRequests(data);
            });
            return () => unsubscribe();
        }
    }, [user?.uid]);

    const handleAcceptRequest = async (req) => {
        try {
            await UserService.acceptFriendRequest(user.uid, req);
            Alert.alert("Connected!", `You are now friends with ${req.name}`);
        } catch (error) {
            Alert.alert("Error", "Could not accept request.");
        }
    };

    const handleRejectRequest = async (reqId) => {
        try {
            await UserService.rejectFriendRequest(user.uid, reqId);
        } catch (error) {
            Alert.alert("Error", "Could not reject request.");
        }
    };

    // Dynamic Counts State
    const [counts, setCounts] = useState({
        followers: user?.followersCount || 0,
        following: user?.followingCount || 0
    });

    // Subscribe to fresh counts in real-time
    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = UserService.subscribeToUserCounts(user.uid, (freshCounts) => {
                setCounts(freshCounts);
            });
            return () => unsubscribe();
        }
    }, [user?.uid]);

    const handleViewProfile = (uid) => {
        setSelectedUserUid(uid);
        setShowUserModal(true);
    };

    // User List Modal Logic
    const [showListModal, setShowListModal] = useState(false);
    const [listType, setListType] = useState('followers'); // 'followers' | 'following'

    const handleViewList = (type) => {
        setListType(type);
        setShowListModal(true);
    };

    const handleSelectUserFromList = (uid) => {
        setShowListModal(false);
        setTimeout(() => {
            handleViewProfile(uid);
        }, 500); // Small delay for smooth transition
    };

    const moods = [
        { icon: '🙏', label: 'Blessed' },
        { icon: '😊', label: 'Joyful' },
        { icon: '📖', label: 'Studious' },
        { icon: '🕊️', label: 'Peaceful' },
        { icon: '💪', label: 'Inspired' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettingsModal(true)}>
                        <Settings color={COLORS.text} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Profile Identity Section */}
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop' }}
                            style={styles.avatar}
                        />
                        <LinearGradient colors={GRADIENTS.primary} style={styles.avatarRing} />
                        <TouchableOpacity style={styles.moodBadge} onPress={() => setShowMoodModal(true)}>
                            <Text style={styles.moodIcon}>{mood.icon}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.fullName || user?.displayName || 'Beloved User'}</Text>
                    <Text style={styles.userHandle}>@{user?.username || 'user'}</Text>

                    {/* Demographics Badge */}
                    {Boolean(user?.age || (user?.gender && user.gender !== 'Unknown')) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            {Boolean(user?.gender && user.gender !== 'Unknown') && (
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>{user.gender}</Text>
                                </View>
                            )}
                            {Boolean(user?.age) && (
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                    <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>{user.age} y/o</Text>
                                </View>
                            )}
                        </View>
                    )}
                    <TouchableOpacity style={styles.moodDisplay} onPress={() => setShowMoodModal(true)}>
                        <Text style={styles.moodText}>Mood: <Text style={styles.moodLabel}>{mood.label}</Text></Text>
                        <Edit2 size={12} color={COLORS.accent} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statItem} onPress={() => handleViewList('followers')}>
                        <Text style={styles.statValue}>{counts.followers}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.statItem, styles.statDivider]} onPress={() => handleViewList('following')}>
                        <Text style={styles.statValue}>{counts.following}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user?.stats?.completedPrayers || 0}</Text>
                        <Text style={styles.statLabel}>Prayers</Text>
                    </View>
                </View>

                {/* NEW: My Journey & Rewards */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>My Journey</Text>

                    {/* Points Banner */}
                    <LinearGradient colors={['#FFD700', '#FDB931']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pointsCard}>
                        <View style={styles.pointsContent}>
                            <Text style={styles.pointsLabel}>Total Kingdom Points</Text>
                            <Text style={styles.pointsValue}>{user?.stats?.totalPoints || 0}</Text>
                        </View>
                        <Shield size={48} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.2)" />
                    </LinearGradient>

                    {/* Verses & Badges */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 12 }}>
                        {/* Verses Stat Card */}
                        <View style={styles.verseCard}>
                            <Text style={styles.verseCount}>{user?.stats?.versesReflected || 0}</Text>
                            <Text style={styles.verseLabel}>Verses Read</Text>
                        </View>

                        {/* Real Rewards List */}
                        {rewards.length > 0 ? (
                            rewards.map((reward, idx) => (
                                <View key={idx} style={styles.rewardCard}>
                                    <LinearGradient colors={getBadgeColors(reward.tier)} style={styles.rewardBadge}>
                                        <Text style={styles.rewardTier}>{reward.tier?.[0]}</Text>
                                    </LinearGradient>
                                    <View>
                                        <Text style={styles.rewardBook}>{reward.book}</Text>
                                        <Text style={styles.rewardPoints}>+{reward.points} pts</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            // Empty State Placeholder
                            <View style={[styles.rewardCard, { opacity: 0.5, borderStyle: 'dashed' }]}>
                                <View style={[styles.rewardBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Shield size={20} color={COLORS.textSecondary} />
                                </View>
                                <View>
                                    <Text style={[styles.rewardBook, { fontSize: 13 }]}>Start Reading</Text>
                                    <Text style={[styles.rewardPoints, { color: COLORS.textSecondary }]}>to earn badges</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Manage Invitations & Requests */}
                {requests.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Fellowship Requests</Text>
                            <View style={styles.notifBadge}><Text style={styles.notifText}>{requests.length}</Text></View>
                        </View>
                        <View style={styles.requestsContainer}>
                            {requests.map(req => (
                                <TouchableOpacity key={req.id} style={styles.requestCard} onPress={() => handleViewProfile(req.fromUid)}>
                                    <View style={styles.requestLeft}>
                                        <View style={styles.avatarSmallContainer}>
                                            <Image source={{ uri: req.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200' }} style={styles.avatarSmall} />
                                            <View style={[styles.reqIconContainer, { backgroundColor: COLORS.primary }]}>
                                                <UserPlus size={8} color="white" />
                                            </View>
                                        </View>
                                        <View>
                                            <Text style={styles.reqName}>{req.name}</Text>
                                            <Text style={styles.reqType}>{req.type} {req.status === 'pending' ? '• Pending' : ''}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.reqActions}>
                                        <TouchableOpacity style={[styles.reqBtn, styles.acceptBtn]} onPress={() => handleAcceptRequest(req)}>
                                            <Check size={16} color={COLORS.text} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.reqBtn, styles.declineBtn]} onPress={() => handleRejectRequest(req.id)}>
                                            <X size={16} color={COLORS.text} />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Account Management */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Contact & Info</Text>
                    <View style={styles.infoCard}>
                        {/* Address Removed */}
                        <View style={styles.infoRow}>
                            <Mail color={COLORS.primary} size={20} />
                            <Text style={styles.infoText}>{user?.email || 'No email connected'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Phone color={COLORS.primary} size={20} />
                            <Text style={styles.infoText}>{user?.phoneNumber || 'Set your phone number'}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <LogOut size={20} color={COLORS.secondary} style={{ marginRight: 10 }} />
                    <Text style={styles.logoutText}>Log Out Account</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Settings Modal (Moved from Profile Body) */}
            <Modal visible={showSettingsModal} animationType="slide" transparent={false}>
                <LinearGradient colors={GRADIENTS.dark} style={styles.modalContainer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                                <X color={COLORS.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>App Settings</Text>
                            <View style={{ width: 28 }} />
                        </View>
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <Text style={styles.settingsGroupTitle}>Account Security</Text>
                            <View style={styles.mgmtCard}>
                                <TouchableOpacity style={styles.mgmtRow} onPress={() => {
                                    setShowSettingsModal(false);
                                    setShowEditModal(true);
                                }}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <UserCircle size={20} color={COLORS.primary} />
                                        <Text style={styles.mgmtText}>Edit Profile Username</Text>
                                    </View>
                                    <View style={styles.availabilityMini}>
                                        <Text style={styles.currentVal}>@{user?.username}</Text>
                                        <Edit2 size={14} color={COLORS.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.mgmtDivider} />
                                <TouchableOpacity style={styles.mgmtRow} onPress={handlePasswordReset}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Shield size={20} color={COLORS.primary} />
                                        <Text style={styles.mgmtText}>Update Password via Email</Text>
                                    </View>
                                    <ExternalLink size={14} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.settingsGroupTitle, { marginTop: 24 }]}>Preferences</Text>
                            <View style={styles.mgmtCard}>
                                {/* Email Privacy */}
                                <View style={styles.mgmtRow}>
                                    <View style={styles.mgmtLabelGroup}>
                                        <Mail size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Email</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your email</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.primary }}
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
                                        <Phone size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Phone</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your number</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.primary }}
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
                                        <UserCircle size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Age</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your age</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.primary }}
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
                                        <UserCircle size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.mgmtText}>Public Gender</Text>
                                            <Text style={styles.mgmtSubText}>Allow others to see your gender</Text>
                                        </View>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.primary }}
                                        thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
                                        onValueChange={async (val) => {
                                            const newSettings = { ...user?.settings, genderVisible: val };
                                            await UserService.updateUserSettings(user.uid, newSettings);
                                        }}
                                        value={user?.settings?.genderVisible === true}
                                    />
                                </View>
                            </View>

                            <View style={styles.settingsGroup}>
                                <Text style={styles.settingsGroupTitle}>Support & Legal</Text>

                                <TouchableOpacity
                                    style={styles.mgmtRow}
                                    onPress={() => {
                                        setShowSettingsModal(false);
                                        navigation.navigate('Help');
                                    }}
                                >
                                    <View style={styles.mgmtLabelGroup}>
                                        <HelpCircle size={20} color={COLORS.primary} />
                                        <Text style={styles.mgmtText}>User Help & FAQ</Text>
                                    </View>
                                    <ChevronRight size={14} color={COLORS.textSecondary} />
                                </TouchableOpacity>

                                <View style={styles.mgmtDivider} />

                                <TouchableOpacity
                                    style={styles.mgmtRow}
                                    onPress={() => {
                                        setShowSettingsModal(false);
                                        navigation.navigate('Legal');
                                    }}
                                >
                                    <View style={styles.mgmtLabelGroup}>
                                        <FileText size={20} color={COLORS.primary} />
                                        <Text style={styles.mgmtText}>Legal Regulations</Text>
                                    </View>
                                    <ChevronRight size={14} color={COLORS.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.logoutButtonSettings, { marginTop: 16, backgroundColor: 'rgba(108, 99, 255, 0.1)', borderColor: COLORS.primary }]}
                                    onPress={() => {
                                        setShowSettingsModal(false);
                                        navigation.navigate('Support');
                                    }}
                                >
                                    <Heart size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.logoutText, { color: COLORS.primary }]}>Support Our Engineers</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.logoutButtonSettings} onPress={signOut}>
                                <LogOut size={20} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <Text style={styles.logoutText}>Log Out Account</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

            {/* Edit Profile Modal with Availability Check */}
            <Modal visible={showEditModal} animationType="slide" transparent={false}>
                <LinearGradient colors={GRADIENTS.dark} style={styles.modalContainer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                    <X color={COLORS.text} size={28} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Update Identity</Text>
                                <View style={{ width: 28 }} />
                            </View>
                            <ScrollView contentContainerStyle={styles.modalContent}>
                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.inputLabel}>New Username</Text>
                                        {usernameStatus === 'checking' && <Text style={styles.checkingText}>Checking availability...</Text>}
                                        {usernameStatus === 'available' && newUsername !== user?.username && <Text style={styles.availableText}>Username is available!</Text>}
                                        {usernameStatus === 'taken' && <Text style={styles.takenText}>Username is already taken</Text>}
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                usernameStatus === 'taken' && styles.inputError,
                                                usernameStatus === 'available' && newUsername !== user?.username && styles.inputSuccess
                                            ]}
                                            value={newUsername}
                                            onChangeText={handleUsernameChange}
                                            placeholder="Enter new username"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            autoCapitalize="none"
                                        />
                                        <View style={styles.inputIconPos}>
                                            {usernameStatus === 'checking' && <Smile size={20} color={COLORS.textSecondary} />}
                                            {usernameStatus === 'available' && newUsername !== user?.username && <CheckCircle size={20} color={COLORS.success} />}
                                            {usernameStatus === 'taken' && <X size={20} color={COLORS.error} />}
                                        </View>
                                    </View>
                                    <Text style={styles.inputHint}>Your username must be unique and contain at least 3 characters.</Text>
                                </View>

                                {/* Added Contact Fields */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newPhone}
                                        onChangeText={setNewPhone}
                                        placeholder="+1 234 567 890"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                {/* Gender Selection */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Gender</Text>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[
                                                    { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
                                                    newGender === g && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                                ]}
                                                onPress={() => setNewGender(g)}
                                            >
                                                <Text style={[{ color: COLORS.textSecondary, fontWeight: '600' }, newGender === g && { color: 'white' }]}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Age Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Age</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={newAge}
                                        onChangeText={(text) => setNewAge(text.replace(/[^0-9]/g, ''))}
                                        placeholder="Enter your age (e.g. 25)"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        keyboardType="number-pad"
                                        maxLength={3}
                                    />
                                </View>

                                {/* Removed Address Input as per request */}

                                <TouchableOpacity
                                    style={[
                                        styles.saveBtn,
                                        ((usernameStatus !== 'available') || (newUsername === user?.username && newPhone === user?.phoneNumber)) && { opacity: 0.5 }
                                    ]}
                                    onPress={async () => {
                                        // Allow save if: Username is valid AND (Username changed OR Phone changed)
                                        const isUsernameValid = usernameStatus === 'available';
                                        const hasChanges = newUsername !== user?.username || newPhone !== user?.phoneNumber;

                                        if (isUsernameValid && hasChanges && user?.uid) {
                                            try {
                                                await UserService.updateUserProfile(user.uid, {
                                                    username: newUsername,
                                                    phoneNumber: newPhone,
                                                    gender: newGender,
                                                    age: newAge ? parseInt(newAge) : null
                                                });
                                                Alert.alert("Success", "Profile updated successfully!");
                                                setShowEditModal(false);
                                            } catch (error) {
                                                Alert.alert("Error", "Failed to update profile.");
                                            }
                                        }
                                    }}
                                    disabled={(usernameStatus !== 'available') || (newUsername === user?.username && newPhone === user?.phoneNumber)}
                                >
                                    <LinearGradient colors={GRADIENTS.primary} style={styles.saveBtnGradient}>
                                        <Text style={styles.saveBtnText}>Save Changes</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>

            {/* Mood Modal */}
            <Modal visible={showMoodModal} animationType="fade" transparent={true}>
                <View style={styles.moodModalOverlay}>
                    <View style={styles.moodModalContent}>
                        <Text style={styles.moodModalTitle}>Manage Mood Status</Text>
                        <View style={styles.moodGrid}>
                            {moods.map((m, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.moodItem, mood.label === m.label && styles.moodItemActive]}
                                    onPress={() => {
                                        setMood(m);
                                        setShowMoodModal(false);
                                    }}
                                >
                                    <Text style={styles.moodItemIcon}>{m.icon}</Text>
                                    <Text style={styles.moodItemLabel}>{m.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.closeMoodBtn} onPress={() => setShowMoodModal(false)}>
                            <Text style={styles.closeMoodText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* View User Profile Modal */}
            <UserProfileModal
                visible={showUserModal}
                onClose={() => setShowUserModal(false)}
                uid={selectedUserUid}
                onSwitchUser={setSelectedUserUid}
            />

            {/* View User List Modal */}
            <UserListModal
                visible={showListModal}
                onClose={() => setShowListModal(false)}
                type={listType}
                uid={user?.uid}
                onUserSelect={handleSelectUserFromList}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SPACING.md },
    settingsButton: { padding: SPACING.sm },
    profileInfo: { alignItems: 'center', marginBottom: SPACING.xl },
    avatarContainer: { position: 'relative', width: 120, height: 120, marginBottom: SPACING.md },
    avatar: { width: 120, height: 120, borderRadius: 60, zIndex: 1 },
    avatarRing: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 65,
        opacity: 0.8
    },
    userName: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: SPACING.xs },
    userHandle: { color: COLORS.primary, fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm },
    moodBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.background,
        zIndex: 2
    },
    moodIcon: { fontSize: 18 },
    moodDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    moodText: { color: COLORS.textSecondary, fontSize: 12 },
    moodLabel: { color: COLORS.accent, fontWeight: '700' },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    statItem: { alignItems: 'center' },
    statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: SPACING.lg },
    statValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
    statLabel: { color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase', marginTop: 4 },

    section: { marginBottom: SPACING.xl },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
    notifBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    notifText: { color: COLORS.text, fontSize: 10, fontWeight: '800' },

    // Rewards Styles
    pointsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
    },
    pointsLabel: { color: 'rgba(50,50,50,0.8)', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    pointsValue: { color: '#000', fontSize: 32, fontWeight: '900' },

    verseCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    verseCount: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    verseLabel: { color: COLORS.textSecondary, fontSize: 10, marginTop: 4 },

    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        paddingRight: 16,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    rewardBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    rewardTier: { fontSize: 18, fontWeight: '900', color: '#fff' },
    rewardBook: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
    rewardPoints: { color: COLORS.success, fontSize: 11, fontWeight: '600' },

    // Requests Styles
    requestsContainer: { gap: 12 },
    requestCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    requestLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarSmallContainer: { position: 'relative' },
    avatarSmall: { width: 44, height: 44, borderRadius: 22 },
    reqIconContainer: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.background
    },
    reqName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
    reqType: { color: COLORS.textSecondary, fontSize: 12 },
    reqActions: { flexDirection: 'row', gap: 8 },
    reqBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    acceptBtn: { backgroundColor: COLORS.primary },
    declineBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },

    // Management Styles
    mgmtCard: { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    mgmtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
    mgmtLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    mgmtText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    mgmtSubText: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
    mgmtDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

    infoCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: SPACING.lg, gap: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: 4 },
    infoText: { color: COLORS.text, fontSize: 15 },

    logoutButton: {
        flexDirection: 'row',
        padding: SPACING.lg,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
        backgroundColor: 'rgba(239,68,68,0.05)'
    },
    logoutText: { color: COLORS.secondary, fontWeight: '700', fontSize: 16 },

    // Modal Styles
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: 40 },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
    modalContent: { padding: SPACING.lg },
    inputGroup: { marginBottom: 20 },
    inputLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
    input: {
        backgroundColor: COLORS.surface,
        height: 54,
        borderRadius: 12,
        paddingHorizontal: 16,
        color: COLORS.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    saveBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    saveBtnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: COLORS.text, fontSize: 18, fontWeight: '800' },

    // Mood Modal Styles
    moodModalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    moodModalContent: { backgroundColor: COLORS.surface, width: '100%', borderRadius: 30, padding: 24, alignItems: 'center' },
    moodModalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 24 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    moodItem: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    moodItemActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(108, 99, 255, 0.1)' },
    moodItemIcon: { fontSize: 28, marginBottom: 4 },
    moodItemLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
    closeMoodBtn: { marginTop: 24, padding: 12 },
    // Security & Settings Styles
    settingsGroup: { marginTop: 24 },
    settingsGroupTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
    availabilityMini: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    currentVal: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },

    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
    checkingText: { color: COLORS.textSecondary, fontSize: 11, fontStyle: 'italic' },
    availableText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
    takenText: { color: COLORS.error, fontSize: 11, fontWeight: '700' },

    inputWrapper: { position: 'relative' },
    inputError: { borderColor: COLORS.error, backgroundColor: 'rgba(239,68,68,0.05)' },
    inputSuccess: { borderColor: COLORS.success, backgroundColor: 'rgba(16,185,129,0.05)' },
    inputIconPos: { position: 'absolute', right: 16, top: 17 },
    inputHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 18 },

    logoutButtonSettings: {
        flexDirection: 'row',
        padding: SPACING.lg,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
        backgroundColor: 'rgba(239,68,68,0.05)'
    },
    closeMoodText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' }
});

export default ProfileScreen;
