import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Users, Video, Clock, MessageSquare, Calendar, X, Check, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { auth } from '../services/firebaseConfig';
import { UserService } from '../services/userService';
import { SpaceService } from '../services/SpaceService';
import UserProfileModal from '../components/UserProfileModal';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

const NotificationsScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [notifications, setNotifications] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activeSpaces, setActiveSpaces] = useState([]);
    const [userNotifications, setUserNotifications] = useState([]); // Direct from Firestore

    // Interactive State
    const [selectedUserUid, setSelectedUserUid] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Handlers
    const handleJoinSession = (space) => {
        // Navigate directly to Bible tab with params
        // BibleScreen handles the joinedChannel param in its useEffect
        navigation.navigate('Bible', {
            joinedChannel: space
        });
    };

    const handleAcceptFriend = async (req) => {
        if (!auth.currentUser) return;
        try {
            await UserService.acceptFriendRequest(auth.currentUser.uid, req);
            Alert.alert("Connected", `You are now friends with ${req.name}`);
        } catch (error) {
            console.error("Error accepting:", error);
            Alert.alert("Error", "Could not accept request.");
        }
    };

    const handleRejectFriend = async (reqId) => {
        if (!auth.currentUser) return;
        try {
            await UserService.rejectFriendRequest(auth.currentUser.uid, reqId);
        } catch (error) {
            console.error("Error declining:", error);
        }
    };

    const handleViewProfile = (uid) => {
        if (!uid) return;
        setSelectedUserUid(uid);
        setShowUserModal(true);
    };

    // Subscribe to Data
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const unsubSchedule = UserService.subscribeToPrayerSchedule(user.uid, setSchedule);
                const unsubSpaces = SpaceService.subscribeToActiveSpaces(setActiveSpaces);
                const unsubNotifs = UserService.subscribeToNotifications(user.uid, setUserNotifications);

                return () => {
                    unsubSchedule();
                    unsubSpaces();
                    unsubNotifs();
                };
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Merge and Derive Notifications
    useEffect(() => {
        const newNotifications = [];

        // 1. Live Sessions
        // 1. Live Sessions
        activeSpaces.forEach(space => {
            // Filter out own spaces
            if (space.hostId === auth.currentUser?.uid) return;

            newNotifications.push({
                id: `live-${space.id}`,
                type: 'live',
                title: 'Live Fellowship Started',
                message: `${space.hostName || 'User'} is now live: "${space.topic || 'Bible Study'}"`,
                time: 'Now', // Could calculate from space.createdAt
                read: false,
                action: 'Join Now',
                data: space
            });
        });

        // 2. Direct Notifications (Follower Requests, etc.)
        userNotifications.forEach(notif => {
            newNotifications.push({
                id: notif.id,
                type: notif.type || 'system',
                title: notif.title,
                message: notif.message,
                time: notif.createdAt ? new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                read: notif.read || false,
                isRequest: notif.type === 'fellowship_request' || notif.type === 'friend_request',
                action: notif.actionLabel,
                data: notif
            });
        });

        // 3. Prayer Schedule (Missed & Upcoming)
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr) return -1;
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier) {
                if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            return hours * 60 + minutes;
        };

        schedule.forEach(item => {
            const prayerMinutes = parseTimeToMinutes(item.time);
            // Simple logic: If time passed by > 15 mins and NOT marked done (assuming we check history, but for now just show missed if strict time passed)
            // Note: Simplification - we don't have "isCompleted" check against history here easily without fetching history. 
            // Assuming simplified "Missed" logic if time passed significantly.

            if (prayerMinutes < currentMinutes && (currentMinutes - prayerMinutes) > 15) {
                newNotifications.push({
                    id: `missed-${item.id}`,
                    type: 'prayer',
                    title: 'Missed Prayer reminder',
                    message: `You missed your scheduled "${item.title}" prayer.`,
                    time: item.time,
                    read: false,
                    action: 'Pray Now',
                    data: item
                });
            } else if (prayerMinutes > currentMinutes && (prayerMinutes - currentMinutes) <= 60) {
                newNotifications.push({
                    id: `upcoming-${item.id}`,
                    type: 'prayer',
                    title: 'Upcoming Prayer',
                    message: `"${item.title}" is starting in ${prayerMinutes - currentMinutes} minutes.`,
                    time: item.time,
                    read: false,
                    action: 'Prepare',
                    data: item
                });
            }
        });

        // Sort roughly (Live first, then by implicit time or just concat)
        // For better sorting we need real timestamps on everything.
        // Putting Live first is usually good.
        setNotifications(newNotifications);

    }, [activeSpaces, userNotifications, schedule]);

    // Mark as read when list updates
    useEffect(() => {
        if (!auth.currentUser) return;

        // 1. Mark real database notifications as read
        const unreadRealIds = userNotifications.filter(n => !n.read).map(n => n.id);
        if (unreadRealIds.length > 0) {
            UserService.markNotificationsRead(auth.currentUser.uid, unreadRealIds);
        }

        // 2. Update global "viewed" timestamp to clear derived alerts (badge)
        UserService.updateUserProfile(auth.currentUser.uid, {
            lastNotificationViewedAt: new Date().toISOString()
        });

    }, [userNotifications, schedule, activeSpaces]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'live': return <Video size={20} color={colors.primary} />;
            case 'fellowship': return <Users size={20} color={colors.secondary} />;
            case 'prayer': return <Clock size={20} color={colors.error} />;
            case 'event': return <Calendar size={20} color={colors.accent} />;
            default: return <Bell size={20} color={colors.textSecondary} />;
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            "Clear Notifications",
            "Are you sure you want to delete all notifications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        if (!auth.currentUser) return;

                        // 1. Filter only real database notifications (exclude derived ones like 'active-space')
                        // Derived ones usually have custom prefixes like 'live-' or 'missed-' but check logic.
                        // Actually, 'userNotifications' from DB are the ones we can delete.
                        const dbNotificationIds = userNotifications.map(n => n.id);

                        if (dbNotificationIds.length > 0) {
                            await UserService.deleteAllNotifications(auth.currentUser.uid, dbNotificationIds);
                        }

                        // 2. Clear derived state locally if needed, though they re-derive.
                        // For derived ones (Missed/Upcoming), we can't 'delete' them easily unless we mark them as 'dismissed' in user preferences.
                        // But strictly clearing the LIST usually means just the DB ones or hiding them.
                        // For now this deletes DB notifications.
                    }
                }
            ]
        );
    };

    const renderNotification = ({ item }) => (
        <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    {getTypeIcon(item.type)}
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.notifMessage}>{item.message}</Text>

                    {item.isRequest ? (
                        <View style={styles.requestActions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAcceptFriend(item.data)}>
                                <Check size={16} color="white" />
                                <Text style={styles.actionBtnText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleRejectFriend(item.id)}>
                                <X size={16} color={colors.textSecondary} />
                                <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={() => handleViewProfile(item.data.fromUid)}>
                                <Users size={16} color={colors.primary} />
                                <Text style={[styles.actionBtnText, { color: colors.primary }]}>View</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        item.action && (
                            <TouchableOpacity
                                style={styles.singleActionBtn}
                                onPress={() => {
                                    if (item.type === 'live') handleJoinSession(item.data);
                                    // Add other handlers here if needed (e.g., 'prayer' -> Navigate to PrayerScreen)
                                }}
                            >
                                <Text style={styles.singleActionText}>{item.action}</Text>
                                <ArrowRight size={14} color={colors.primary} />
                            </TouchableOpacity>
                        )
                    )}
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={handleClearAll}>
                    <Text style={styles.markReadText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <Text style={styles.sectionTitle}>Recent Updates</Text>
                        <Text style={styles.subTitle}>You have {notifications.filter(n => !n.read).length} new notifications</Text>
                    </View>
                )}
            />

            <UserProfileModal
                visible={showUserModal}
                onClose={() => setShowUserModal(false)}
                uid={selectedUserUid}
            />
        </SafeAreaView>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: colors.background
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    markReadText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    listContent: { padding: 20, paddingBottom: 100 },
    listHeader: { marginBottom: 25 },
    sectionTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
    subTitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
    notificationCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    unreadCard: {
        borderColor: 'rgba(108, 99, 255, 0.2)', // Keeping RGBA for alpha, but checking against Primary
        backgroundColor: 'rgba(108, 99, 255, 0.05)',
    },
    cardHeader: { flexDirection: 'row', position: 'relative' },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    contentContainer: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    notifTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    notifTime: { color: colors.textSecondary, fontSize: 12 },
    notifMessage: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
    unreadDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.surface
    },
    requestActions: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6
    },
    acceptBtn: { backgroundColor: colors.primary },
    declineBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
    actionBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
    singleActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    singleActionText: { color: colors.primary, fontSize: 14, fontWeight: '700' }
});

export default NotificationsScreen;
