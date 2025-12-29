import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Send, Sparkles, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { ChatService } from '../services/ChatService';
import { AIService } from '../services/aiService';
import { UserService } from '../services/userService';
import NotificationBell from '../components/NotificationBell';

const TherapyScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        if (user) {
            initializeChat();
            loadUserProfile();
        }
    }, [user]);

    useEffect(() => {
        if (route.params?.initialMessage) {
            setInputText(route.params.initialMessage);
        }
    }, [route.params?.initialMessage]);

    const initializeChat = async () => {
        try {
            const sid = await ChatService.initializeSession(user.uid);
            setSessionId(sid);

            // Subscribe to real-time messages
            const unsubscribe = ChatService.subscribeToMessages(user.uid, sid, (msgs) => {
                setMessages(msgs);
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const loadUserProfile = async () => {
        const profile = await UserService.getUserProfile(user.uid);
        setUserProfile(profile);
    };

    const handleSend = async () => {
        if (!inputText.trim() || !sessionId || sending) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            // 1. Save User Message
            await ChatService.sendMessage(user.uid, sessionId, text, 'user');

            // 2. Get AI Response
            const history = messages.slice(-5).map(m => ({ text: m.text, sender: m.sender }));

            const context = {
                userName: user.displayName || 'Friend',
                mood: userProfile?.mood?.label || userProfile?.mood || 'Neutral',
                history
            };

            const response = await AIService.getTherapyResponse(text, context);

            // 3. Save AI Message
            await ChatService.sendMessage(user.uid, sessionId, response.text, 'bot');

        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.messageUserRow : styles.messageBotRow]}>
                {!isUser && (
                    <View style={styles.botAvatar}>
                        <Sparkles size={16} color="white" />
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                        {item.text}
                    </Text>
                    <Text style={styles.timestamp}>
                        {item.createdAt?.toLocaleTimeString ? item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Beloved Companion</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusText}>Based on your mood: {userProfile?.mood?.label || userProfile?.mood || 'Neutral'}</Text>
                    </View>
                </View>
                <NotificationBell color={COLORS.textSecondary} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListEmptyComponent={
                    !loading && <Text style={{ textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 }}>Start a conversation...</Text>
                }
                ListFooterComponent={sending ? (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>Thinking...</Text>
                    </View>
                ) : null}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Talk to your spiritual companion..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? <ActivityIndicator color="white" size="small" /> : <Send color="white" size={20} />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 },
    statusText: { color: COLORS.textSecondary, fontSize: 12 },

    listContent: { padding: SPACING.lg, paddingBottom: 100 },
    messageRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end' },
    messageUserRow: { justifyContent: 'flex-end' },
    messageBotRow: { justifyContent: 'flex-start' },

    botAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 8, marginBottom: 4
    },

    bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
    userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    botBubble: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

    messageText: { fontSize: 16, lineHeight: 22 },
    userText: { color: 'white' },
    botText: { color: COLORS.text },

    timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, alignSelf: 'flex-end' },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
        marginBottom: Platform.OS === 'ios' ? 0 : 20
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.text,
        maxHeight: 100,
        marginRight: 10
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center'
    },
    typingIndicator: { padding: 10, marginLeft: 40 },
    typingText: { color: COLORS.textSecondary, fontStyle: 'italic', fontSize: 12 }
});

export default TherapyScreen;
