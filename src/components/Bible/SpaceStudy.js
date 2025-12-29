import React from 'react';
import UserProfileModal from '../UserProfileModal';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, MessageSquare, Heart, Mic, MicOff, MoreHorizontal, X, UserPlus, Info, Calendar, LogOut, Hand, BookOpen, Clock } from 'lucide-react-native';
import { requestRecordingPermissionsAsync, getRecordingPermissionsAsync, AudioModule } from 'expo-audio';
import { SpaceService } from '../../services/SpaceService';
import { UserService } from '../../services/userService';
import AgoraService from '../../services/AgoraService';
import { COLORS, SPACING, GRADIENTS } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BibleService } from '../../services/bibleService';
import SpeechService from '../../services/SpeechService';

// Animated Speaking Indicator Component
const SpeakingIndicator = () => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.ease
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.ease
                })
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={[styles.speakingIndicator, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={GRADIENTS.primary} style={StyleSheet.absoluteFill} />
        </Animated.View>
    );
};

// Animated Hand Raise Indicator
const HandRaiseIndicator = () => {
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const wave = Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.linear
                }),
                Animated.timing(rotateAnim, {
                    toValue: -1,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.linear
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.linear
                })
            ])
        );
        wave.start();
        return () => wave.stop();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-20deg', '20deg']
    });

    return (
        <View style={styles.handRaisedBadge}>
            <Animated.View style={{ transform: [{ rotate }] }}>
                <Hand size={14} color="white" />
            </Animated.View>
        </View>
    );
};

// Floating Heart Animation
const FloatingHeart = ({ id, onComplete, style }) => {
    const anim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
        }).start(() => onComplete(id));
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -200]
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0]
    });

    const scale = anim.interpolate({
        inputRange: [0, 0.2],
        outputRange: [0.5, 1.2] // Pop effect
    });

    const translateX = anim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 20, -20, 20, 0] // Wiggle
    });

    return (
        <Animated.View style={[style, {
            opacity,
            transform: [{ translateY }, { translateX }, { scale }]
        }]}>
            <Heart size={32} color={COLORS.secondary} fill={COLORS.secondary} />
        </Animated.View>
    );
};

const SpaceStudy = ({ channelId, user, onLeave, channelName, description, agenda, topic, hostId }) => {
    const navigation = useNavigation();
    const [showDetails, setShowDetails] = React.useState(false);
    const [participants, setParticipants] = React.useState([]);
    const [myRole, setMyRole] = React.useState('listener');
    const [isMuted, setIsMuted] = React.useState(true);
    const [isHandRaised, setIsHandRaised] = React.useState(false);
    const [hearts, setHearts] = React.useState([]);
    const [remainingTime, setRemainingTime] = React.useState(null);
    const [expiresAt, setExpiresAt] = React.useState(null);
    const participantsLayout = React.useRef({}); // Store layout for each user
    const scrollRef = React.useRef(null);
    const [scrollOffset, setScrollOffset] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [selectedParticipant, setSelectedParticipant] = React.useState(null);
    const [permissionResponse, setPermissionResponse] = React.useState(null);

    const requestPermission = async () => {
        try {
            const response = await requestRecordingPermissionsAsync();
            setPermissionResponse(response);
            return response;
        } catch (error) {
            console.error("Error requesting permission:", error);
            return null;
        }
    };

    React.useEffect(() => {
        getRecordingPermissionsAsync().then(setPermissionResponse).catch(console.error);
    }, []);

    const onParticipantLayout = (uid, event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        // Store relative to the grid. We will add visual offsets + scroll adjustments.
        // Since we are inside a ScrollView, we need to be careful.
        // A simpler way for "floating up" is just getting the center of the avatar.
        participantsLayout.current[uid] = { x, y, width, height };
    };

    const addHeart = () => {
        const myLayout = participantsLayout.current[user.uid];
        let startX = 20 + Math.random() * 60; // Default random if not found
        let startY = 100; // Default bottom offset

        if (myLayout) {
            // Calculate roughly where it is on screen. 
            // Note: The heart container is absolute fill. The participant is inside a ScrollView.
            // We need to account for scroll offset if we want exact positioning, 
            // OR we can just try to approximate. 
            // Since 'hearts' are rendered in an absolute view covering the screen, 
            // we need the absolute page Y of the avatar.
            // We'll trust the 'optimistic' heart is from 'Me' (bottom right usually) or my avatar.
            // Let's use my avatar if visible.
            // Wait, scrollOffset is needed.
            // Let's assume the grid starts at some Y offset. This is getting complex to measure perfectly.
            // SIMPLIFICATION: If I am reacting, it often looks good coming from "Me" (the button) or my avatar.
            // Let's stick to the button/bottom for 'Me' for now as the user requested "user icons" which implies distinct sources.
            // Okay, let's try to map it.
        }

        SpaceService.sendReaction(channelId, user.uid, 'heart');
    };

    const removeHeart = (id) => {
        setHearts(current => current.filter(h => h.id !== id));
    };

    // Listen for reactions from others
    React.useEffect(() => {
        const unsubscribe = SpaceService.subscribeToReactions(channelId, (reaction) => {
            const fromUid = reaction.fromUid;
            const layout = participantsLayout.current[fromUid];

            let startPosition = {};

            if (layout) {
                // Approximate screen position
                // We need to know where the Grid starts. Rough guess: Header is ~100px.
                // ScrollView offset needs to be subtracted.
                // This is header (120) + content padding (20).
                const HEADER_HEIGHT = 160;
                const GRID_OFFSET_Y = layout.y + HEADER_HEIGHT - scrollOffset;

                // If it's the second grid (Listeners), we need to add that offset too? 
                // No, layout.y is relative to the parent VIEW (participantsGrid).
                // Ah, we have two grids. This makes it harder.
                // Let's just use a ref for the *ParticipantItem* itself? measure() is async.

                // FALLBACK: Random X at bottom if not visible.
                // BUT, user explicitly wants "from the user icons".

                // Let's try to set the heart's "right" or "left" style based on finding the user.
                // If we can't find them, default to random.

                // Actually, let's use a simpler trick: Render the heart INSIDE the avatar wrapper?
                // No, it needs to float UP over everything.

                // Let's update the 'hearts' state to include x/y and render them absolutely.
                // We will rely on 'layout' captured.

                // HACK: To get accurate positions without complex measure(), 
                // we can just use the indexes or assume a grid layout.
                // Better: onLayout gives x,y inside the wrapping View.

                // For now, let's try using the captured layout + a rough offset.
                // X matches the avatar center.
                // Y matches the avatar top.

                // Note: floating hearts usually go purely UP. 
                // So we just need the correct Left/Right position.

                // Check if speaker or listener to identify which grid? 
                // Actually, let's just make onLayout set the GLOBAL x/y by using refs.
                // But we have many refs.

                startPosition = {
                    left: layout.pageX || (layout.x + 20), // We don't have pageX from onLayout
                    bottom: undefined,
                    top: undefined
                };
            }

            // Re-think: React Native's measure() is the standard way.
            // But we can't call it on every reaction easily for every user.
            // Let's store refs to the *views*, then measure on reaction.
        });
        return () => unsubscribe();
    }, [channelId]);

    // Ref registry
    const avatarRefs = React.useRef({});

    const triggerHeartFromUser = (uid) => {
        const ref = avatarRefs.current[uid];
        if (ref) {
            ref.measure((x, y, width, height, pageX, pageY) => {
                // Add heart at pageX, pageY
                setHearts(current => [...current, {
                    id: Date.now() + Math.random(),
                    x: pageX + width / 2 - 16, // Center heart (32px)
                    y: pageY,
                    fromAvatar: true
                }]);
            });
        } else {
            // Fallback
            setHearts(current => [...current, {
                id: Date.now() + Math.random(),
                x: 20 + Math.random() * 300,
                y: 500, // Roughly bottom
                fromAvatar: false
            }]);
        }
    };

    // Modified useEffect
    React.useEffect(() => {
        const unsubscribe = SpaceService.subscribeToReactions(channelId, (reaction) => {
            triggerHeartFromUser(reaction.fromUid);
        });
        return () => unsubscribe();
    }, [channelId]);

    // robust host check
    const isRealHost = (hostId && user.uid === hostId) || myRole === 'host';

    React.useEffect(() => {
        if (!channelId) return;

        // Initialize Agora
        const initAgora = async () => {
            const AGORA_APP_ID = 'f030f1e1148e42f384acd498648ae67b';

            try {
                // Ensure Expo Audio is configured for live communication
                if (AudioModule) {
                    await AudioModule.setAudioModeAsync({
                        allowsRecordingIOS: true,
                        playsInSilentModeIOS: true,
                        staysActiveInBackground: true,
                        shouldDuckAndroid: true,
                        playThroughEarpieceAndroid: false
                    });
                }
            } catch (e) {
                console.warn('Expo Audio Mode Error:', e);
            }

            await AgoraService.initialize(AGORA_APP_ID);
            // Join - Using empty token as project is in Test Mode
            await AgoraService.joinChannel(channelId, user.uid, isRealHost ? 'host' : 'listener', '');
        };

        initAgora();

        // Subscribe to real-time participants
        const unsubscribe = SpaceService.subscribeToParticipants(channelId, (data) => {
            setParticipants(data);
            const me = data.find(p => p.uid === user.uid);
            if (me) {
                setMyRole(me.role);
                setIsMuted(me.isMuted);
                setIsHandRaised(me.isHandRaised);

                // Update Agora Role based on Firestore Role
                AgoraService.setRole(me.role);
                // Sync Agora Mute State
                // Note: We only mute local stream. If remote says we are muted, we mute ourselves.
                AgoraService.toggleMute(me.isMuted);

            } else if (isRealHost) {
                // Fallback if host not yet in participants list
                setMyRole('host');
                setIsMuted(false);
                AgoraService.setRole('host');
                AgoraService.toggleMute(false);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            AgoraService.leaveChannel();
        };
    }, [channelId, user.uid, isRealHost]);

    // Separate cleanup for Space deactivation/leaving to avoid re-runs on state changes
    React.useEffect(() => {
        return () => {
            if (channelId && user?.uid) {
                SpaceService.leaveSpace(channelId, user.uid);
            }
        };
    }, [channelId, user?.uid]);

    // Host Notification for Hand Raises
    const prevParticipantsRef = React.useRef([]);

    React.useEffect(() => {
        if (!isRealHost) return;

        participants.forEach(p => {
            const prevP = prevParticipantsRef.current.find(prev => prev.uid === p.uid);
            // If hand was NOT raised before, and IS raised now
            if (p.isHandRaised && (!prevP || !prevP.isHandRaised)) {
                Alert.alert(
                    "Request to Speak",
                    `${p.name} requested to speak.`,
                    [
                        { text: "Ignore", style: "cancel" },
                        {
                            text: "Allow",
                            onPress: async () => {
                                await SpaceService.promoteToSpeaker(channelId, p.uid);
                                await SpaceService.toggleMute(channelId, p.uid, false); // Optional: unmute automatically
                            }
                        }
                    ]
                );
            }
        });

        prevParticipantsRef.current = participants;
    }, [participants, isRealHost, channelId]);

    const handleMicPress = async () => {
        if (isRealHost && myRole === 'listener') {
            // Host wanting to speak from audience -> Promote & Unmute
            await SpaceService.promoteToSpeaker(channelId, user.uid);
            await SpaceService.toggleMute(channelId, user.uid, false);
            return;
        }

        if (myRole === 'listener' && !isRealHost) {
            // Request to speak logic
            if (isHandRaised) {
                await SpaceService.cancelRequestToSpeak(channelId, user.uid);
            } else {
                // Check permissions first
                if (permissionResponse?.status !== 'granted') {
                    const { status } = await requestPermission();
                    if (status !== 'granted') {
                        Alert.alert("Permission Required", "Microphone access is needed to speak.");
                        return;
                    }
                }
                await SpaceService.requestToSpeak(channelId, user.uid);
                Alert.alert("Request Sent", "Waiting for host to approve.");
            }
        } else {
            // Toggle Mute logic for speakers/hosts
            await SpaceService.toggleMute(channelId, user.uid, !isMuted);
        }
    };

    const handleParticipantPress = (participant) => {
        // If clicking self, do nothing
        if (participant.uid === user.uid) return;

        // If Host clicking others -> Show Action Sheet (Profile + Manage)
        if (isRealHost) {
            Alert.alert(
                `Manage ${participant.name}`,
                "Choose an action:",
                [
                    { text: "View Profile", onPress: () => setSelectedParticipant(participant.uid) },
                    participant.role === 'listener'
                        ? { text: "Invite to Speak", onPress: () => SpaceService.promoteToSpeaker(channelId, participant.uid) }
                        : { text: "Move to Audience", style: 'destructive', onPress: () => SpaceService.demoteToListener(channelId, participant.uid) },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } else {
            // If regular user clicking others -> Show Profile directly
            setSelectedParticipant(participant.uid);
        }
    };

    // Track last sync to avoid loops
    const lastSyncRef = React.useRef(null);

    // Listen for Space status & Reading Sync
    React.useEffect(() => {
        if (!channelId) return;

        const unsubscribe = SpaceService.subscribeToSpace(channelId, async (spaceData) => {
            if (!spaceData) return;

            // 1. Handle Space End
            if (spaceData.isActive === false) {
                if (!isRealHost) {
                    Alert.alert("Space Ended", "The host has ended this fellowship session.");
                }
                onLeave();
                return;
            }

            if (spaceData.expiresAt) {
                setExpiresAt(spaceData.expiresAt);
            }

            // 2. Handle Reading Sync
            const sync = spaceData.readingSync;
            if (sync && !isRealHost) { // Only sync for participants
                const syncId = `${sync.book}-${sync.chapter}-${sync.isSpeaking}`;

                if (lastSyncRef.current !== syncId) {
                    lastSyncRef.current = syncId;

                    if (sync.isSpeaking) {
                        try {
                            const data = await BibleService.getChapter(sync.book, sync.chapter);
                            if (data) {
                                SpeechService.speak(data.text, {
                                    onDone: () => { }, // Handled by host sync
                                    onStopped: () => { }
                                });
                            }
                        } catch (e) {
                            console.error("Sync Speech Error:", e);
                        }
                    } else {
                        SpeechService.stop();
                    }
                }
            }
        });

        return () => {
            unsubscribe();
            SpeechService.stop(); // Clean up on leave
        };
    }, [channelId, isRealHost]);

    // Countdown Timer Logic
    React.useEffect(() => {
        if (!expiresAt) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const end = expiresAt.toMillis();
            const diffInSeconds = Math.floor((end - now) / 1000);

            if (diffInSeconds <= 0) {
                clearInterval(timer);
                setRemainingTime(0);
                Alert.alert("Session Ended", "This space session has reached its 40-minute limit.");
                onLeave();
            } else {
                setRemainingTime(diffInSeconds);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    const formatRemainingTime = (seconds) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLeave = () => {
        Alert.alert(
            isRealHost ? "End Space?" : "Leave Space?",
            isRealHost
                ? "Are you sure you want to end this session for everyone?"
                : "Are you sure you want to exit this fellowship? You can join back later if the channel is still active.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: isRealHost ? "End Session" : "Leave",
                    style: "destructive",
                    onPress: async () => {
                        if (isRealHost) {
                            await SpaceService.endSpace(channelId);
                        }
                        onLeave();
                    }
                }
            ]
        );
    };

    const groupDescription = description || "A deep dive into the practical applications of faith in our daily lives.";
    const groupAgenda = agenda || [
        "Opening Prayer",
        "Verse Reading & Breakdown",
        "Open Discussion",
        "Closing Prayer"
    ];

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
                <SafeAreaView edges={['top']} style={{ paddingBottom: 16 }}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.iconButton} onPress={handleLeave}>
                            <LogOut color="white" size={20} style={{ marginLeft: 2 }} />
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <Text style={styles.title} numberOfLines={1}>{channelName || 'Group Study'}</Text>
                            <View style={styles.headerSub}>
                                {isRealHost && (
                                    <View style={styles.hostBadge}>
                                        <Text style={styles.hostBadgeText}>HOST</Text>
                                    </View>
                                )}
                                <View style={styles.listenerCount}>
                                    <Users size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.listenerText}>{participants.length} listening</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => navigation.navigate('Bible', { channelId })}
                            >
                                <BookOpen color="white" size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setShowDetails(true)}>
                                <MoreHorizontal color="white" size={24} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {remainingTime !== null && (
                        <View style={styles.sessionTimer}>
                            <Clock color={remainingTime < 300 ? "#FF6B6B" : "white"} size={14} />
                            <Text style={[styles.timerText, remainingTime < 300 && { color: '#FF6B6B' }]}>
                                {formatRemainingTime(remainingTime)}
                            </Text>
                        </View>
                    )}

                </SafeAreaView>
            </LinearGradient >

            <ScrollView style={styles.content}>
                <View style={styles.verseFocus}>
                    <Text style={styles.verseRef}>{topic || "Scripture Focus"}</Text>
                    <Text style={styles.verseText}>{description || "Join the discussion..."}</Text>
                </View>

                <Text style={styles.sectionTitle}>Speakers</Text>
                <View style={styles.participantsGrid}>
                    {/* Filter to show only speakers/hosts */}
                    {participants.filter(p => p.role !== 'listener').map((p) => (
                        <TouchableOpacity
                            key={p.id}
                            style={styles.participantItem}
                            onPress={() => handleParticipantPress(p)}
                            ref={el => avatarRefs.current[p.uid] = el}
                            collapsable={false} // Important for measure() on Android
                        >
                            <View style={styles.avatarWrapper}>
                                <Image source={p.avatar ? { uri: p.avatar } : { uri: 'https://via.placeholder.com/150' }} style={styles.avatar} />
                                {!p.isMuted && (
                                    <SpeakingIndicator />
                                )}
                                {p.isMuted && <View style={styles.mutedBadge}><MicOff size={12} color="white" /></View>}
                            </View>
                            <Text style={styles.participantName}>{p.name}</Text>
                            <Text style={styles.participantRole}>
                                {p.role === 'host' ? 'Host' : 'Speaker'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {participants.filter(p => p.role === 'listener').length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Listeners</Text>
                        <View style={styles.participantsGrid}>
                            {participants.filter(p => p.role === 'listener').map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.participantItem}
                                    onPress={() => handleParticipantPress(p)}
                                    ref={el => avatarRefs.current[p.uid] = el}
                                    collapsable={false}
                                >
                                    <View style={styles.avatarWrapper}>
                                        <Image source={p.avatar ? { uri: p.avatar } : { uri: 'https://via.placeholder.com/150' }} style={styles.avatar} />
                                        {p.isHandRaised && (
                                            <HandRaiseIndicator />
                                        )}
                                    </View>
                                    <Text style={styles.participantName}>{p.name}</Text>
                                    <Text style={styles.participantRole}>Listener</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Floating Hearts Container */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {hearts.map(heart => (
                    <FloatingHeart
                        key={heart.id}
                        id={heart.id}
                        onComplete={removeHeart}
                        style={{
                            position: 'absolute',
                            left: heart.x || 0,
                            top: heart.y,
                            bottom: heart.y ? undefined : 100, // Fallback if no Y
                            right: heart.x ? undefined : (heart.right || 20), // Fallback
                        }}
                    />
                ))}
            </View>

            {/* Profile Modal */}
            <UserProfileModal
                visible={!!selectedParticipant}
                onClose={() => setSelectedParticipant(null)}
                uid={selectedParticipant}
                currentUserId={user.uid}
                onSwitchUser={setSelectedParticipant}
            />

            <BlurView intensity={20} tint="dark" style={styles.footer}>
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={[styles.footerIcon, (myRole !== 'listener' && !isMuted) && styles.micActive]}
                        onPress={handleMicPress}
                    >
                        {myRole === 'listener' && !isRealHost ? (
                            isHandRaised ? <Hand color={COLORS.primary} size={28} /> : <Mic color={COLORS.text} size={28} />
                        ) : (
                            isMuted ? <MicOff color={COLORS.textSecondary} size={28} /> : <Mic color="white" size={28} />
                        )}
                        <Text style={[styles.footerIconText, (myRole !== 'listener' && !isMuted) && { color: 'white' }]}>
                            {myRole === 'listener' && !isRealHost ? (isHandRaised ? 'Requested' : 'Request') : (isMuted ? 'Start Talking' : 'Mute')}
                        </Text>
                    </TouchableOpacity>



                    {isRealHost && myRole !== 'listener' ? (
                        <TouchableOpacity
                            style={styles.footerIcon}
                            onPress={async () => {
                                await SpaceService.toggleMute(channelId, user.uid, true);
                                await SpaceService.demoteToListener(channelId, user.uid);
                            }}
                        >
                            <LogOut color={COLORS.secondary} size={28} style={{ transform: [{ rotate: '90deg' }] }} />
                            <Text style={styles.footerIconText}>Finished</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.footerIcon}
                            onPress={addHeart}
                        >
                            <Heart color={COLORS.secondary} size={28} />
                            <Text style={styles.footerIconText}>React</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>

            <Modal visible={showDetails} animationType="slide" transparent={false}>
                <LinearGradient colors={GRADIENTS.dark} style={styles.detailsModal}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowDetails(false)}>
                                <X color={COLORS.text} size={28} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Group Details</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <View style={styles.detailSection}>
                                <View style={styles.sectionHead}>
                                    <Info size={20} color={COLORS.accent} />
                                    <Text style={styles.sectionLabel}>Description</Text>
                                </View>
                                <Text style={styles.descriptionText}>{groupDescription}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                <View style={styles.sectionHead}>
                                    <Calendar size={20} color={COLORS.accent} />
                                    <Text style={styles.sectionLabel}>Today's Agenda</Text>
                                </View>
                                {groupAgenda.map((item, idx) => (
                                    <View key={idx} style={styles.agendaItem}>
                                        <View style={styles.agendaDot} />
                                        <Text style={styles.agendaText}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.detailSection}>
                                <View style={styles.sectionHead}>
                                    <Users size={20} color={COLORS.accent} />
                                    <Text style={styles.sectionLabel}>Members ({participants.length})</Text>
                                </View>
                                {participants.map((member) => (
                                    <View key={member.id} style={styles.memberRow}>
                                        <View style={styles.memberLeft}>
                                            <Image source={{ uri: member.avatar }} style={styles.memberAvatarSmall} />
                                            <Text style={styles.memberNick}>{member.name}</Text>
                                        </View>
                                        {member.uid !== user.uid && (
                                            <TouchableOpacity
                                                style={styles.addFriendBtn}
                                                onPress={() => {
                                                    UserService.sendFriendRequest(
                                                        user.uid,
                                                        user.displayName || 'Unknown',
                                                        user.photoURL,
                                                        member.uid
                                                    ).then(() => {
                                                        Alert.alert("Request Sent", `Friend request sent to ${member.name}`);
                                                    }).catch(err => {
                                                        Alert.alert("Error", "Could not send request.");
                                                    });
                                                }}
                                            >
                                                <UserPlus size={18} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.modalLeaveBtn} onPress={handleLeave}>
                                <LogOut size={20} color={COLORS.secondary} style={{ marginRight: 8 }} />
                                <Text style={styles.modalLeaveText}>Leave Fellowship</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>
        </LinearGradient >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50 },
    headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 10 },
    headerRight: { flexDirection: 'row', gap: 8 },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    leaveText: { color: 'white', fontWeight: '700', fontSize: 14 },
    title: { color: 'white', fontSize: 18, fontWeight: '800' },
    hostBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    hostBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
    listenerCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    listenerText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
    headerSub: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 4
    },
    sessionTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12
    },
    timerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
        fontVariant: ['tabular-nums']
    },
    content: { flex: 1, padding: SPACING.lg },
    verseFocus: {
        backgroundColor: COLORS.surface,
        padding: SPACING.xl,
        borderRadius: 24,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    verseRef: { color: COLORS.accent, fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
    verseText: { color: COLORS.text, fontSize: 18, fontStyle: 'italic', lineHeight: 26 },
    sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: SPACING.lg },
    participantsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xl, justifyContent: 'center' },
    participantItem: { alignItems: 'center', width: 80 },
    avatarWrapper: { position: 'relative', marginBottom: 8 },
    avatar: { width: 64, height: 64, borderRadius: 32 },
    speakingIndicator: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 36,
        zIndex: -1,
        opacity: 0.8
    },
    mutedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 4
    },
    handRaisedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 4
    },
    micActive: {
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 50,
        marginBottom: 10
    },
    participantName: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
    participantRole: { color: COLORS.textSecondary, fontSize: 10 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 40, paddingTop: 20, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
    footerActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    footerIcon: { alignItems: 'center', gap: 4 },
    footerIconText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },

    // Details Modal Styles
    detailsModal: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, marginTop: 60 },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
    modalContent: { padding: SPACING.lg, paddingBottom: 60 },
    detailSection: { marginBottom: 32 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    sectionLabel: { color: COLORS.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    descriptionText: { color: COLORS.text, fontSize: 16, lineHeight: 24, opacity: 0.8 },
    agendaItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    agendaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    agendaText: { color: COLORS.text, fontSize: 16 },
    memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, marginBottom: 8 },
    memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    memberAvatarSmall: { width: 40, height: 40, borderRadius: 20 },
    memberNick: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    addFriendBtn: { padding: 8, backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: 8 },
    modalLeaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 71, 87, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 71, 87, 0.2)'
    },
    modalLeaveText: { color: COLORS.secondary, fontSize: 16, fontWeight: '700' }
});

// Mock BlurView for simplicity if expo-blur isn't installed
const BlurView = ({ children, style }) => <View style={style}>{children}</View>;

export default SpaceStudy;
