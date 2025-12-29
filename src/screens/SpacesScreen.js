import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, X, Search, ChevronRight, MessageSquare, Clock, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { SpaceService } from '../services/SpaceService';
import { UserService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import SpaceStudy from '../components/Bible/SpaceStudy';
import BibleTopicSelector from '../components/Bible/BibleTopicSelector';

const SpacesScreen = () => {
    const { user } = useAuth();
    const [availableChannels, setAvailableChannels] = useState([]);
    const [showSpace, setShowSpace] = useState(false);
    const [currentChannelId, setCurrentChannelId] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [showGroupSetup, setShowGroupSetup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', topic: '', description: '', agenda: '' });
    const [showBiblePicker, setShowBiblePicker] = useState(false);

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

    const handleJoinSpace = async (channel) => {
        if (!user) {
            Alert.alert("Login Required", "Please login to join a space.");
            return;
        }

        try {
            await SpaceService.joinSpace(channel.id, user);
            setSelectedChannel(channel);
            setCurrentChannelId(channel.id);
            setShowSpace(true);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to join space.");
        }
    };

    const handleCreateSpace = async () => {
        if (!user) {
            Alert.alert("Login Required", "Please login to host a space.");
            return;
        }

        if (!newGroupData.name || !newGroupData.topic) {
            Alert.alert("Missing Information", "Please provide a name and topic for your space.");
            return;
        }

        setLoading(true);
        try {
            const channelData = {
                name: newGroupData.name,
                topic: newGroupData.topic,
                description: newGroupData.description,
                agenda: newGroupData.agenda?.split(',').map(s => s.trim()) || [],
                hostName: user.displayName || 'Anonymous',
                hostAvatar: user.photoURL,
                isActive: true
            };
            const cid = await SpaceService.createSpace(user.uid, channelData);
            setCurrentChannelId(cid);
            setShowSpace(true);
            setShowGroupSetup(false);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to create space.");
        } finally {
            setLoading(false);
        }
    };

    if (showSpace && currentChannelId) {
        return (
            <SpaceStudy
                channelId={currentChannelId}
                user={user}
                channelName={selectedChannel?.name || newGroupData.name || 'Bible Study'}
                description={selectedChannel?.description || newGroupData.description}
                topic={selectedChannel?.topic || newGroupData.topic}
                hostId={selectedChannel?.hostId || user.uid}
                agenda={selectedChannel?.agenda || (newGroupData.agenda ? newGroupData.agenda.split(',') : [])}
                onLeave={async () => {
                    if (currentChannelId && user) {
                        await SpaceService.leaveSpace(currentChannelId, user.uid);
                    }
                    setShowSpace(false);
                    setCurrentChannelId(null);
                    setSelectedChannel(null);
                }}
            />
        );
    }

    return (
        <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>Beloved Spaces</Text>
                    <Text style={styles.subtitle}>Join live group Bible studies</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Groups</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{availableChannels.length} Live</Text>
                        </View>
                    </View>

                    {availableChannels.length > 0 ? (
                        availableChannels.map((channel) => (
                            <TouchableOpacity
                                key={channel.id}
                                style={styles.channelCard}
                                onPress={() => handleJoinSpace(channel)}
                            >
                                <View style={styles.channelInfo}>
                                    <Text style={styles.channelName}>{channel.name}</Text>
                                    <View style={styles.topicBadge}>
                                        <Text style={styles.topicText}>{channel.topic}</Text>
                                    </View>
                                    <Text style={styles.hostName}>Host: {channel.hostName}</Text>
                                </View>
                                <View style={styles.channelRight}>
                                    <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                                        {channel.expiresAt && (() => {
                                            const time = getTimeRemaining(channel.expiresAt);
                                            return (
                                                <View style={styles.timerBadge}>
                                                    <Clock size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                                                    <Text style={styles.timerText}>{time.minutes}m left</Text>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={styles.participantCount}>
                                            <Users size={16} color={COLORS.textSecondary} />
                                            <Text style={styles.participantText}>{Math.max(0, channel.participantsCount || 0)}</Text>
                                        </View>
                                        <ChevronRight color={COLORS.textSecondary} size={20} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <MessageSquare size={48} color={COLORS.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <Text style={styles.emptyText}>No active spaces right now.</Text>
                            <Text style={styles.emptySubtext}>Why not host one yourself?</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.hostButton}
                        onPress={() => setShowGroupSetup(true)}
                    >
                        <LinearGradient colors={GRADIENTS.primary} style={styles.hostBtnGradient}>
                            <Plus color="white" size={24} style={{ marginRight: 8 }} />
                            <Text style={styles.hostBtnText}>Host a New Space</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Group Setup Modal */}
                <Modal visible={showGroupSetup} animationType="slide" transparent={false}>
                    <LinearGradient colors={GRADIENTS.dark} style={styles.setupContainer}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <View style={styles.setupHeader}>
                                <TouchableOpacity onPress={() => setShowGroupSetup(false)}>
                                    <X color={COLORS.text} size={28} />
                                </TouchableOpacity>
                                <Text style={styles.setupTitle}>Host a Space</Text>
                                <View style={{ width: 28 }} />
                            </View>

                            <ScrollView contentContainerStyle={styles.setupContent}>
                                <Text style={styles.setupInstructions}>Create a space for others to join you in Bible study and fellowship.</Text>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Space Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Morning Grace Study"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
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
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={newGroupData.topic}
                                            onChangeText={(text) => setNewGroupData({ ...newGroupData, topic: text })}
                                        />
                                        <TouchableOpacity
                                            style={styles.inputIconBtn}
                                            onPress={() => setShowBiblePicker(true)}
                                        >
                                            <BookOpen color={COLORS.primary} size={20} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Short Description</Text>
                                    <TextInput
                                        style={[styles.input, { height: 80, paddingTop: 12 }]}
                                        multiline
                                        placeholder="What will this study be about?"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={newGroupData.description}
                                        onChangeText={(text) => setNewGroupData({ ...newGroupData, description: text })}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Agenda (comma separated)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Prayer, Reading, Discussion"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={newGroupData.agenda}
                                        onChangeText={(text) => setNewGroupData({ ...newGroupData, agenda: text })}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleCreateSpace}
                                    disabled={loading}
                                >
                                    <LinearGradient colors={GRADIENTS.primary} style={styles.submitBtnGradient}>
                                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Launch Space</Text>}
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.xl, paddingTop: SPACING.lg },
    title: { color: COLORS.text, fontSize: 32, fontWeight: '800' },
    subtitle: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
    scrollContent: { padding: SPACING.xl, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, gap: 12 },
    sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
    badge: { backgroundColor: 'rgba(78, 205, 196, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#4ECDC4', fontSize: 12, fontWeight: '700' },
    channelCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    channelInfo: { flex: 1 },
    channelName: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
    topicBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    topicText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
    hostName: { color: COLORS.textSecondary, fontSize: 13 },
    channelRight: { alignItems: 'flex-end', gap: 10 },
    participantCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    participantText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { color: COLORS.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
    emptySubtext: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.xl, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
    hostButton: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    hostBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    hostBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    // Setup Modal
    setupContainer: { flex: 1 },
    setupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: 40 },
    setupTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    setupContent: { padding: SPACING.xl },
    setupInstructions: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 30, lineHeight: 24 },
    inputWrapper: { marginBottom: 24 },
    inputLabel: { color: COLORS.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    inputWithIconContainer: { position: 'relative' },
    inputIconBtn: { position: 'absolute', right: 12, top: 12, padding: 6, zIndex: 10 },
    submitButton: { borderRadius: 16, overflow: 'hidden', marginTop: 20 },
    submitBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6
    },
    timerText: { color: '#FF6B6B', fontSize: 11, fontWeight: '700' }
});

export default SpacesScreen;
