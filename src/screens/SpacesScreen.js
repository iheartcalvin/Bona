import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Image, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, X, Search, ChevronRight, MessageSquare, Clock, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, SPACING } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';
import { SpaceService } from '../services/SpaceService';
import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import SpaceStudy from '../components/Bible/SpaceStudy';
import BibleTopicSelector from '../components/Bible/BibleTopicSelector';
import { useAppRole } from '../context/AppRoleContext';

const SpacesScreen = () => {
    const { user } = useAuth();
    const { isTeacher } = useAppRole();
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [availableChannels, setAvailableChannels] = useState([]);
    const [showSpace, setShowSpace] = useState(false);
    const [currentChannelId, setCurrentChannelId] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [showGroupSetup, setShowGroupSetup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', topic: '', description: '', agenda: '' });

    const [showBiblePicker, setShowBiblePicker] = useState(false);
    const [joiningChannelId, setJoiningChannelId] = useState(null);

    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        // Trigger self-healing cleanup of stale/ghost sessions
        SpaceService.cleanupStaleSpaces();

        const unsub = SpaceService.subscribeToActiveSpaces((channels) => {
            const now = Date.now();
            const filtered = channels.filter(c => {
                const countValid = (c.participantsCount || 0) > 0;
                const timeValid = !c.expiresAt || c.expiresAt.toMillis() > now;
                return countValid && timeValid;
            });
            setAvailableChannels(filtered);
        });

        const timer = setInterval(() => setCurrentTime(Date.now()), 60000);

        return () => {
            unsub();
            clearInterval(timer);
        };
    }, []);

    const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const remainingMs = expiresAt.toMillis() - currentTime;
        const minutes = Math.floor(remainingMs / 60000);
        const date = expiresAt.toDate();
        const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return { minutes: Math.max(0, minutes), endTime: timeStr };
    };

    const handleJoinSpace = React.useCallback(async (channel) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to join a space.");
            return;
        }

        if (joiningChannelId) return; // Prevent double-tap

        setJoiningChannelId(channel.id);
        try {
            await SpaceService.joinSpace(channel.id, user);
            setSelectedChannel(channel);
            setCurrentChannelId(channel.id);
            setShowSpace(true);
        } catch (e) {
            console.error(e);
            Alert.alert("Failed to Join", "Could not join this space. It may depend on your connection or the room is full.");
        } finally {
            setJoiningChannelId(null);
        }
    }, [user, joiningChannelId]);

    const handleCreateSpace = React.useCallback(async () => {
        if (!newGroupData.name || !newGroupData.topic) {
            Alert.alert("Missing Fields", "Please provide at least a name and topic.");
            return;
        }

        setLoading(true);
        try {
            const spaceId = await SpaceService.createSpace(user.uid, {
                ...newGroupData,
                hostName: user?.displayName || 'Anonymous', // Safe access
                hostAvatar: user?.photoURL,
                hostRole: isTeacher ? 'teacher' : 'host',
                spaceType: isTeacher ? 'teaching' : 'study',
            });

            setShowGroupSetup(false);
            setNewGroupData({ name: '', topic: '', description: '', agenda: '' });

            // Auto join the newly created space
            // We construct a temporary object to join immediately without waiting for subscription update
            const newSpaceObj = {
                id: spaceId,
                name: newGroupData.name,
                hostName: user?.displayName || 'Anonymous',
                topic: newGroupData.topic,
                hostRole: isTeacher ? 'teacher' : 'host',
                spaceType: isTeacher ? 'teaching' : 'study',
                participantsCount: 1 // We are the first one
            };
            handleJoinSpace(newSpaceObj);

        } catch (error) {
            console.error("Create space error:", error);
            Alert.alert("Error", "Failed to create space. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [newGroupData, user, handleJoinSpace, isTeacher]);

    const renderChannelItem = React.useCallback(({ item: channel }) => (
        <TouchableOpacity
            style={styles.channelCard}
            onPress={() => handleJoinSpace(channel)}
        >
            <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <View style={styles.topicBadge}>
                    <Text style={styles.topicText}>{channel.topic}</Text>
                </View>
                <Text style={styles.hostName}>{channel.hostRole === 'teacher' ? '👩🏾‍🏫 Teacher: ' : 'Host: '}{channel.hostName}</Text>
                {channel.spaceType === 'teaching' && <View style={styles.teachingBadge}><Text style={styles.teachingBadgeText}>LIVE CLASS</Text></View>}
            </View>
            <View style={styles.channelRight}>
                <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                    {channel.expiresAt && (() => {
                        const time = getTimeRemaining(channel.expiresAt);
                        return time ? (
                            <View style={styles.timerBadge}>
                                <Clock size={12} color={colors.accent} style={{ marginRight: 4 }} />
                                <Text style={styles.timerText}>{time.minutes}m left</Text>
                            </View>
                        ) : null;
                    })()}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.participantCount}>
                        <Users size={16} color={colors.textSecondary} />
                        <Text style={styles.participantText}>{Math.max(0, channel.participantsCount || 0)}</Text>
                    </View>
                    {joiningChannelId === channel.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <ChevronRight color={colors.textSecondary} size={20} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    ), [colors, handleJoinSpace, joiningChannelId, currentTime]); // Depends on currentTime for timer updates

    // ... (rest of component)

    return (
        <LinearGradient colors={gradients.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>{isTeacher ? 'Teaching Spaces' : 'Learning Spaces'}</Text>
                    <Text style={styles.subtitle}>{isTeacher ? 'Host a live class and facilitate student discussion' : 'Join live study rooms and teacher-led classes'}</Text>
                </View>

                <React.Fragment>
                    <FlatList
                        style={{ flex: 1 }}
                        data={availableChannels}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, minHeight: '100%' }]}
                        removeClippedSubviews={false}
                        ListHeaderComponent={
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Active Groups</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{availableChannels.length} Live</Text>
                                </View>
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MessageSquare size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                                <Text style={styles.emptyText}>No active spaces right now.</Text>
                                <Text style={styles.emptySubtext}>Why not host one yourself?</Text>
                            </View>
                        }
                        renderItem={renderChannelItem}
                    />
                </React.Fragment>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.hostButton}
                        onPress={() => setShowGroupSetup(true)}
                    >
                        <LinearGradient colors={gradients.primary} style={styles.hostBtnGradient}>
                            <Plus color="white" size={24} style={{ marginRight: 8 }} />
                            <Text style={styles.hostBtnText}>Host a New Space</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Group Setup Modal */}
                <Modal visible={showGroupSetup} animationType="slide" transparent={false}>
                    <LinearGradient colors={gradients.background} style={styles.setupContainer}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <View style={styles.setupHeader}>
                                <TouchableOpacity onPress={() => setShowGroupSetup(false)}>
                                    <X color={colors.text} size={28} />
                                </TouchableOpacity>
                            <Text style={styles.setupTitle}>{isTeacher ? 'Launch a Teaching Space' : 'Host a Space'}</Text>
                                <View style={{ width: 28 }} />
                            </View>

                            <ScrollView contentContainerStyle={styles.setupContent}>
                                <Text style={styles.setupInstructions}>{isTeacher ? 'Create a live class where you facilitate discussion, invite students, and guide the lesson.' : 'Create a space for others to join you in study and fellowship.'}</Text>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Space Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Morning Grace Study"
                                        placeholderTextColor={colors.textSecondary}
                                        value={newGroupData.name}
                                        onChangeText={(text) => setNewGroupData({ ...newGroupData, name: text })}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Topic / Scripture Focus</Text>
                                    <View style={styles.inputWithIconContainer}>
                                        <TextInput
                                            style={[styles.input, { paddingRight: 50, flex: 1, marginBottom: 0 }]}
                                            placeholder="e.g. Proverbs 3:5-6"
                                            placeholderTextColor={colors.textSecondary}
                                            value={newGroupData.topic}
                                            onChangeText={(text) => setNewGroupData({ ...newGroupData, topic: text })}
                                        />
                                        <TouchableOpacity
                                            style={styles.inputIconBtn}
                                            onPress={() => setShowBiblePicker(true)}
                                        >
                                            <BookOpen color={colors.primary} size={20} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Short Description</Text>
                                    <TextInput
                                        style={[styles.input, { height: 80, paddingTop: 12 }]}
                                        multiline
                                        placeholder="What will this study be about?"
                                        placeholderTextColor={colors.textSecondary}
                                        value={newGroupData.description}
                                        onChangeText={(text) => setNewGroupData({ ...newGroupData, description: text })}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Agenda (comma separated)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Prayer, Reading, Discussion"
                                        placeholderTextColor={colors.textSecondary}
                                        value={newGroupData.agenda}
                                        onChangeText={(text) => setNewGroupData({ ...newGroupData, agenda: text })}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleCreateSpace}
                                    disabled={loading}
                                >
                                    <LinearGradient colors={gradients.primary} style={styles.submitBtnGradient}>
                                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>{isTeacher ? 'Launch Teaching Space' : 'Launch Space'}</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        </SafeAreaView>
                    </LinearGradient>
                    {/* Bible Topic Selector Nested */}
                    <BibleTopicSelector
                        visible={showBiblePicker}
                        onClose={() => setShowBiblePicker(false)}
                        onSelect={(selection) => {
                            setNewGroupData(prev => ({ ...prev, topic: selection }));
                        }}
                    />
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
};



const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.xl, paddingTop: SPACING.lg },
    title: { color: colors.text, fontSize: 32, fontWeight: '800' },
    subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 4 },
    scrollContent: { padding: SPACING.xl, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, gap: 12 },
    sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
    badge: { backgroundColor: colors.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.success },
    badgeText: { color: colors.success, fontSize: 12, fontWeight: '700' },
    channelCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    channelInfo: { flex: 1 },
    channelName: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
    topicBadge: { alignSelf: 'flex-start', backgroundColor: colors.inputBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    topicText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
    hostName: { color: colors.textSecondary, fontSize: 13 },
    teachingBadge: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: 'rgba(139,92,246,0.18)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    teachingBadgeText: { color: '#A78BFA', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    channelRight: { alignItems: 'flex-end', gap: 10 },
    participantCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    participantText: { color: colors.text, fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
    emptySubtext: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.cardBorder },
    hostButton: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    hostBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    hostBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    // Setup Modal
    setupContainer: { flex: 1 },
    setupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: 40 },
    setupTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
    setupContent: { padding: SPACING.xl },
    setupInstructions: { color: colors.textSecondary, fontSize: 16, marginBottom: 30, lineHeight: 24 },
    inputWrapper: { marginBottom: 24 },
    inputLabel: { color: colors.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    input: { backgroundColor: colors.inputBg, borderRadius: 12, padding: 16, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.cardBorder },
    inputWithIconContainer: { position: 'relative' },
    inputIconBtn: { position: 'absolute', right: 12, top: 12, padding: 6, zIndex: 10 },
    submitButton: { borderRadius: 16, overflow: 'hidden', marginTop: 20 },
    submitBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.error
    },
    timerText: { color: colors.error, fontSize: 11, fontWeight: '700' }
});

export default SpacesScreen;
