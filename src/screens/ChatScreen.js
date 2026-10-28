import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { ChatService } from '../services/ChatService';
import { AIService } from '../services/aiService';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';

const ChatScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

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
            // Simplify history for context (last 5 messages)
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
            // Optionally add a local error message bubble
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
                        {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradients.background} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft color={colors.text} size={24} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Beloved Companion</Text>
                            <Text style={styles.headerSubtitle}>Always here to listen</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListFooterComponent={sending ? (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>Beloved is thinking...</Text>
                    </View>
                ) : null}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Share your heart..."
                        placeholderTextColor={colors.textSecondary}
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
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingBottom: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: 10 },
    backBtn: { marginRight: 16, padding: 4 },
    headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
    headerSubtitle: { color: colors.accent, fontSize: 12 },

    listContent: { padding: SPACING.lg, paddingBottom: 20 },
    messageRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end' },
    messageUserRow: { justifyContent: 'flex-end' },
    messageBotRow: { justifyContent: 'flex-start' },

    botAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 8, marginBottom: 4
    },

    bubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
    userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    botBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

    messageText: { fontSize: 16, lineHeight: 22 },
    userText: { color: 'white' },
    botText: { color: colors.text },

    timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, alignSelf: 'flex-end' },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: colors.text,
        maxHeight: 100,
        marginRight: 10
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center'
    },
    typingIndicator: { padding: 10, marginLeft: 40 },
    typingText: { color: colors.textSecondary, fontStyle: 'italic', fontSize: 12 }
});

export default ChatScreen;
