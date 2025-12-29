import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, MapPin, Mail, Phone, Users, UserPlus, Shield } from 'lucide-react-native';
import UserListModal from './UserListModal';
import { COLORS, SPACING, GRADIENTS } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const UserProfileModal = ({ visible, onClose, uid, onSwitchUser }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [relationship, setRelationship] = useState('not_following'); // 'following' | 'requested' | 'not_following'
    const [actionLoading, setActionLoading] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [listType, setListType] = useState('followers'); // 'followers' | 'following'
    const [rewards, setRewards] = useState([]);

    // Helper for Badge Gradients
    const getBadgeColors = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'gold': return ['#FFD700', '#FDB931'];
            case 'silver': return ['#E0E0E0', '#BDBDBD'];
            case 'bronze': return ['#CD7F32', '#A0522D'];
            default: return ['#6c63ff', '#4ade80'];
        }
    };

    useEffect(() => {
        const fetchProfileAndStatus = async () => {
            if (uid) {
                setLoading(true);
                try {
                    const [userData, status] = await Promise.all([
                        UserService.getUserProfile(uid),
                        currentUser ? UserService.checkRelationshipStatus(currentUser.uid, uid) : Promise.resolve('not_following')
                    ]);
                    setProfile(userData);
                    setRelationship(status);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (visible) {
            fetchProfileAndStatus();
        } else {
            setProfile(null);
            setRelationship('not_following');
            setShowListModal(false);
            setRewards([]); // Reset rewards on close
        }
    }, [uid, visible, currentUser]);

    // Separate effect for rewards to keep logic clean
    useEffect(() => {
        if (uid && visible) {
            const unsubscribe = UserService.subscribeToUserRewards(uid, (data) => {
                setRewards(data);
            });
            return () => unsubscribe();
        }
    }, [uid, visible]);

    const handleFollowAction = async () => {
        if (!currentUser || !profile || actionLoading) return;

        setActionLoading(true);
        try {
            if (relationship === 'not_following') {
                await UserService.sendFriendRequest(
                    currentUser.uid,
                    currentUser.displayName || 'Unknown',
                    currentUser.photoURL,
                    uid
                );
                setRelationship('requested');
            } else if (relationship === 'following') {
                // Confirm Unfollow
                Alert.alert(
                    "Unfollow User",
                    `Are you sure you want to unfollow ${profile.username || 'this user'}?`,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => setActionLoading(false)
                        },
                        {
                            text: "Unfollow",
                            style: "destructive",
                            onPress: async () => {
                                try {
                                    await UserService.unfollowUser(currentUser.uid, uid);
                                    setRelationship('not_following');
                                } catch (error) {
                                    console.error("Unfollow failed:", error);
                                } finally {
                                    setActionLoading(false);
                                }
                            }
                        }
                    ]
                );
                return; // Exit here since logic continues in onPress
            } else if (relationship === 'requested') {
                // Cancel Request
                await UserService.cancelFriendRequest(currentUser.uid, uid);
                setRelationship('not_following');
            }
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenList = (type) => {
        setListType(type);
        setShowListModal(true);
    };

    const handleUserSelect = (selectedUid) => {
        setShowListModal(false);
        if (onSwitchUser && selectedUid !== uid) {
            // Give a small delay for modal interaction smoothness
            setTimeout(() => onSwitchUser(selectedUid), 100);
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient colors={GRADIENTS.dark} style={styles.gradientContainer}>

                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X color={COLORS.text} size={24} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.centerContent}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : profile ? (
                            <ScrollView contentContainerStyle={styles.content}>

                                {/* Avatar */}
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={{ uri: profile.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200' }}
                                        style={styles.avatar}
                                    />
                                    {profile.mood && (
                                        <View style={styles.moodBadge}>
                                            <Text style={{ fontSize: 20 }}>{profile.mood.icon}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.name}>{profile.username || profile.displayName || 'Unknown User'}</Text>

                                {/* Demographics (Respecting Privacy) */}
                                {((profile.settings?.ageVisible && profile.age) || (profile.settings?.genderVisible && profile.gender && profile.gender !== 'Unknown') || (currentUser && currentUser.uid === uid && (profile.age || profile.gender))) && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 }}>
                                        {/* Show Gender if Public OR if it's ME */}
                                        {((profile.settings?.genderVisible || (currentUser && currentUser.uid === uid)) && profile.gender && profile.gender !== 'Unknown') && (
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>{profile.gender}</Text>
                                            </View>
                                        )}
                                        {/* Show Age if Public OR if it's ME */}
                                        {((profile.settings?.ageVisible || (currentUser && currentUser.uid === uid)) && profile.age) && (
                                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                                <Text style={{ color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' }}>{profile.age} y/o</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {profile.mood && <Text style={styles.moodLabel}>{profile.mood.label}</Text>}

                                {/* Follow Action Button */}
                                {currentUser && currentUser.uid !== uid && (
                                    <TouchableOpacity
                                        style={[
                                            styles.actionBtn,
                                            relationship === 'following' && styles.followingBtn,
                                            relationship === 'requested' && styles.requestedBtn
                                        ]}
                                        onPress={handleFollowAction}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {relationship === 'following' ? (
                                                    <Users size={20} color={COLORS.text} />
                                                ) : relationship === 'requested' ? (
                                                    <Mail size={20} color="white" />
                                                ) : (
                                                    <UserPlus size={20} color="white" />
                                                )}
                                                <Text style={[
                                                    styles.actionBtnText,
                                                    relationship === 'following' && { color: COLORS.text }
                                                ]}>
                                                    {relationship === 'following' ? 'Following' : relationship === 'requested' ? 'Requested' : 'Follow'}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {/* Stats */}
                                <View style={styles.statsRow}>
                                    <TouchableOpacity style={styles.statItem} onPress={() => handleOpenList('followers')}>
                                        <Text style={styles.statValue}>{profile.followersCount || 0}</Text>
                                        <Text style={styles.statLabel}>Followers</Text>
                                    </TouchableOpacity>
                                    <View style={styles.statDivider} />
                                    <TouchableOpacity style={styles.statItem} onPress={() => handleOpenList('following')}>
                                        <Text style={styles.statValue}>{profile.followingCount || 0}</Text>
                                        <Text style={styles.statLabel}>Following</Text>
                                    </TouchableOpacity>
                                    <View style={[styles.statDivider, { borderLeftWidth: 0 }]} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{profile.stats?.completedPrayers || 0}</Text>
                                        <Text style={styles.statLabel}>Prayers</Text>
                                    </View>
                                </View>

                                {/* Public Rewards Section */}
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { marginBottom: 12, marginLeft: 4, alignSelf: 'flex-start' }]}>Kingdom Journey</Text>

                                    {/* Points Banner */}
                                    <LinearGradient colors={['#FFD700', '#FDB931']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pointsCard}>
                                        <View style={styles.pointsContent}>
                                            <Text style={styles.pointsLabel}>Total Kingdom Points</Text>
                                            <Text style={styles.pointsValue}>{profile.stats?.totalPoints || 0}</Text>
                                        </View>
                                        <Shield size={40} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.2)" />
                                    </LinearGradient>

                                    {/* Rewards Carousel */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4, gap: 12 }}>
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
                                            <Text style={{ color: COLORS.textSecondary, fontStyle: 'italic', marginLeft: 4 }}>No badges earned yet.</Text>
                                        )}
                                    </ScrollView>
                                </View>

                                {/* Info */}
                                <View style={styles.infoCard}>
                                    {/* Email - Show if Public OR if it is ME */}
                                    {(profile.settings?.emailVisible || (currentUser && currentUser.uid === uid)) && (
                                        <View style={styles.infoRow}>
                                            <Mail color={COLORS.primary} size={18} />
                                            <Text style={styles.infoText}>{profile.email || 'Hidden'}</Text>
                                        </View>
                                    )}

                                    {/* Phone - Show if Public OR if it is ME */}
                                    {(profile.settings?.phoneVisible || (currentUser && currentUser.uid === uid)) && (
                                        <View style={styles.infoRow}>
                                            <Phone color={COLORS.primary} size={18} />
                                            <Text style={styles.infoText}>{profile.phoneNumber || 'Hidden'}</Text>
                                        </View>
                                    )}

                                    {!profile.settings?.emailVisible && !profile.settings?.phoneVisible && currentUser?.uid !== uid && (
                                        <Text style={{ color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>Contact info is private.</Text>
                                    )}
                                </View>

                            </ScrollView>
                        ) : (
                            <View style={styles.centerContent}>
                                <Text style={{ color: COLORS.textSecondary }}>User not found.</Text>
                            </View>
                        )}
                    </LinearGradient>
                </View>
            </View>

            {/* List Modal Nested */}
            <UserListModal
                visible={showListModal}
                onClose={() => setShowListModal(false)}
                type={listType}
                uid={uid}
                onUserSelect={handleUserSelect}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    container: { height: '85%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    gradientContainer: { flex: 1 },
    header: { padding: 20, alignItems: 'flex-end' },
    closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    content: { padding: 20, alignItems: 'center' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
    moodBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.surface, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },

    name: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    moodLabel: { color: COLORS.accent, fontSize: 14, fontWeight: '600', marginBottom: 24 },

    statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 30, width: '100%', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20 },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
    statLabel: { color: COLORS.textSecondary, fontSize: 10, textTransform: 'uppercase', marginTop: 4 },

    actionBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
        marginBottom: 32, // More space
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        minWidth: 160,
        alignItems: 'center'
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 0,
        shadowOpacity: 0
    },
    requestedBtn: {
        backgroundColor: COLORS.accent, // Orange/Yellow logic usually
        shadowColor: COLORS.accent
    },
    actionBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5
    },

    statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 30, width: '100%', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20 },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
    statLabel: { color: COLORS.textSecondary, fontSize: 10, textTransform: 'uppercase', marginTop: 4 },

    infoCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, gap: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoText: { color: COLORS.text, fontSize: 14 },

    // Reward Styles
    section: { width: '100%', marginBottom: 24 },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },

    pointsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        width: '100%'
    },
    pointsLabel: { color: 'rgba(50,50,50,0.8)', fontSize: 12, fontWeight: '700', marginBottom: 2 },
    pointsValue: { color: '#000', fontSize: 28, fontWeight: '900' },

    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        paddingRight: 14,
        borderRadius: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    rewardBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardTier: { fontSize: 16, fontWeight: '900', color: '#fff' },
    rewardBook: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
    rewardPoints: { color: COLORS.success, fontSize: 10, fontWeight: '600' }
});

export default UserProfileModal;
