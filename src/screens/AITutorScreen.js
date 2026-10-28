import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, Zap, BookOpen, RefreshCw } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GROQ_API_KEY } from '@env';

const { width } = Dimensions.get('window');

// ─── Groq AI Config ──────────────────────────────────────────
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const FAST_MODEL = 'llama-3.1-8b-instant';

// ─── Quick Prompt Starters ───────────────────────────────────
const QUICK_PROMPTS = [
    { label: 'Explain this topic',       icon: '💡', text: 'Can you explain this topic in a simple way?' },
    { label: 'Give me an example',       icon: '📝', text: 'Give me a real-life example to help me understand.' },
    { label: 'What will NECTA ask?',     icon: '📋', text: 'What kind of questions does NECTA usually ask about this?' },
    { label: 'Quiz me!',                 icon: '🎯', text: 'Give me 3 practice questions on this topic.' },
    { label: 'Summarise in Kiswahili',   icon: '🇹🇿', text: 'Summarise the key points of this lesson in Kiswahili.' },
    { label: 'Why does this matter?',    icon: '🌍', text: 'Why is this topic important in real life?' },
];

// ─── System Prompt Builder ───────────────────────────────────
const buildSystemPrompt = (lessonContext) => `
You are "Bona AI" — an expert academic tutor for Tanzanian students aged 7 to 18.
Your role is to help students understand their school subjects through clear, encouraging, and age-appropriate explanations.
${lessonContext ? `The student is currently studying: "${lessonContext}"` : ''}

STRICT RULES:
1. You ONLY discuss academic topics covered in Tanzanian school curricula (NECTA-aligned).
2. If a student asks anything non-academic (social, political, religious, personal), respond with:
   "I'm here to help with your studies! Let's focus on your subjects. What would you like to learn today? 📚"
3. Always explain clearly — use examples, analogies, and step-by-step breakdowns.
4. Prioritise ENGLISH. If asked, you can also explain in Kiswahili.
5. Keep responses concise (3-5 short paragraphs max). Use bullet points and emojis for readability.
6. Always end with an encouraging statement or a follow-up question to keep the student engaged.
7. Use simple language for younger students, more technical language for older ones.
8. NEVER help with cheating in exams or give direct answers to questions clearly meant for an ongoing exam.

You are encouraging, patient, and make learning feel like an adventure. Begin!
`.trim();

// ─── AI Service ─────────────────────────────────────────────
const getBonaTutorResponse = async (messages, lessonContext) => {
    const systemPrompt = buildSystemPrompt(lessonContext);

    const payload = {
        model: FAST_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.text })),
        ],
        temperature: 0.65,
        max_tokens: 500,
    };

    try {
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Groq error: ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "I'm thinking... please ask again!";
    } catch (err) {
        // Fallback for offline mode or network timeouts on emulator/device
        const latestQuery = (messages[messages.length - 1]?.content || '').toLowerCase();
        if (latestQuery.includes('kiswahili') || latestQuery.includes('muhtasari')) {
            return "🇹🇿 **Muhtasari wa Somo (Bona AI Offline):**\n\n• **Lengo Kuu:** Kuelewa misingi ya sarufi na msamiati katika lugha ya Kiingereza kwa mtaala wa NECTA.\n• **Jambo Muhimu:** Kila sentensi inahitaji kiima (subject) na kiarifu (predicate/verb).\n• **Kidokezo:** Jizoeze kusoma vifungu vifupi na kujibu maswali ya ufahamu kila siku ili kuongeza ufaulu wako wa NECTA!\n\nJe, una swali lingine kuhusu somo hili? 🦉";
        }
        if (latestQuery.includes('example') || latestQuery.includes('mfano')) {
            return "📝 **Real-Life Example:**\n\nThink of sentence structure like building a house. The subject is the foundation, and the verb is the roof. Without a verb, the sentence cannot stand on its own!\n\nFor example:\n• *Baraka studies Biology every afternoon.* (Complete)\n• *Baraka every afternoon.* (Incomplete sentence)\n\nWould you like another example?";
        }
        if (latestQuery.includes('necta') || latestQuery.includes('exam')) {
            return "📋 **NECTA Exam Preparation Tip:**\n\nIn Section A and B, NECTA tests:\n1. Identification of correct grammatical tenses.\n2. Reading comprehension and vocabulary in context.\n3. Summary writing (usually 40-50 words).\n\nAlways underline key terms in the exam question before writing your answer! 🌟";
        }
        return "🦉 **Bona AI Study Note:**\n\nGreat question! Make sure to review the core rules and practice at least 3 exercise questions in the Practice tab. Once online, I can generate full customized answers for any specific topic!";
    }
};

// ─── Message Bubble ─────────────────────────────────────────
const MessageBubble = ({ message, isLatest }) => {
    const isBot  = message.role === 'assistant';
    const fadeIn = useRef(new Animated.Value(isLatest ? 0 : 1)).current;

    useEffect(() => {
        if (isLatest) {
            Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        }
    }, []);

    return (
        <Animated.View
            style={[
                styles.bubbleRow,
                isBot ? styles.bubbleRowBot : styles.bubbleRowUser,
                { opacity: fadeIn, transform: [{ translateY: fadeIn.interpolate({ inputRange:[0,1], outputRange:[12,0] }) }] }
            ]}
        >
            {isBot && (
                <View style={styles.botAvatar}>
                    <Text style={{ fontSize: 18 }}>🦉</Text>
                </View>
            )}
            <View style={[
                styles.bubble,
                isBot ? styles.bubbleBot : styles.bubbleUser,
            ]}>
                <Text style={[styles.bubbleText, !isBot && styles.bubbleTextUser]}>
                    {message.text}
                </Text>
                {message.xp && (
                    <View style={styles.xpPill}>
                        <Text style={styles.xpPillText}>+{message.xp} XP</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

// ─── Typing Indicator ────────────────────────────────────────
const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot, delay) => Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(dot, { toValue: -6, duration: 250, useNativeDriver: true }),
                Animated.timing(dot, { toValue: 0,  duration: 250, useNativeDriver: true }),
                Animated.delay(600),
            ])
        ).start();
        animate(dot1, 0); animate(dot2, 150); animate(dot3, 300);
    }, []);

    const Dot = ({ anim }) => (
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: anim }] }]} />
    );

    return (
        <View style={styles.bubbleRow}>
            <View style={styles.botAvatar}><Text>🦉</Text></View>
            <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <Dot anim={dot1} />
                <Dot anim={dot2} />
                <Dot anim={dot3} />
            </View>
        </View>
    );
};

// ─── Main AITutor Screen ─────────────────────────────────────
const AITutorScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const lessonContext = route.params?.context || null;

    const [messages, setMessages] = useState([
        {
            id: '0',
            role: 'assistant',
            text: `Hi there! I'm **Bona AI** 🦉 — your personal tutor.\n\n${lessonContext
                ? `I see you're studying **${lessonContext}**. Great choice! Ask me anything about it.`
                : "I can help you with any subject from the Tanzania school curriculum. What would you like to learn today?"}\n\nTip: Use the quick buttons below to get started! 🚀`,
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const scrollRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || isLoading) return;

        setInput('');
        setShowQuickPrompts(false);
        setIsLoading(true);

        const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);

        const history = [...messages, userMsg].slice(-12); // keep last 12 for context
        const reply = await getBonaTutorResponse(history, lessonContext);

        setIsLoading(false);
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString() + 'ai', role: 'assistant', text: reply, xp: 2 },
        ]);
    }, [input, isLoading, messages, lessonContext]);

    const handleQuickPrompt = (text) => sendMessage(text);

    const clearChat = () => {
        setMessages([{
            id: '0', role: 'assistant',
            text: "Chat cleared! What would you like to learn next? 📚",
        }]);
        setShowQuickPrompts(true);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0A1628', '#0F2040']} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft size={22} color="#F0F4FF" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerName}>Bona AI 🦉</Text>
                            <View style={styles.onlineRow}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineText}>Academic Tutor · Online</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
                            <RefreshCw size={16} color="#7A8FAD" />
                        </TouchableOpacity>
                    </View>
                    {lessonContext && (
                        <View style={styles.contextBanner}>
                            <BookOpen size={12} color="#00A86B" />
                            <Text style={styles.contextText}>Studying: {lessonContext}</Text>
                        </View>
                    )}
                </SafeAreaView>
            </LinearGradient>

            {/* Messages */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messages}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg, i) => (
                        <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
                    ))}
                    {isLoading && <TypingIndicator />}

                    {/* Quick prompts */}
                    {showQuickPrompts && !isLoading && (
                        <View style={styles.quickPrompts}>
                            <Text style={styles.quickTitle}>Quick questions:</Text>
                            <View style={styles.quickGrid}>
                                {QUICK_PROMPTS.map((qp, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.quickBtn}
                                        onPress={() => handleQuickPrompt(qp.text)}
                                    >
                                        <Text style={styles.quickBtnIcon}>{qp.icon}</Text>
                                        <Text style={styles.quickBtnText}>{qp.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Ask Bona anything about your studies..."
                            placeholderTextColor="#566478"
                            multiline
                            maxLength={500}
                            returnKeyType="send"
                            onSubmitEditing={() => sendMessage()}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                        onPress={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                    >
                        <LinearGradient
                            colors={input.trim() && !isLoading ? ['#00A86B', '#00C27B'] : ['#1E3A6B', '#1E3A6B']}
                            style={styles.sendBtnGrad}
                        >
                            <Send size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#0A1628' }} />
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A1628' },

    // Header
    header: { paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
    backBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerCenter: { flex: 1 },
    headerName:   { fontSize: 17, fontWeight: '800', color: '#F0F4FF' },
    onlineRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    onlineDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00A86B' },
    onlineText:   { color: '#7A8FAD', fontSize: 12 },
    clearBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    contextBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,168,107,0.1)', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: 'rgba(0,168,107,0.2)',
    },
    contextText: { color: '#00A86B', fontSize: 12, fontWeight: '600' },

    // Messages
    messages:        { flex: 1 },
    messagesContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    bubbleRow:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
    bubbleRowBot:  { justifyContent: 'flex-start' },
    bubbleRowUser: { justifyContent: 'flex-end' },
    botAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,168,107,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    bubble:        { maxWidth: width * 0.75, borderRadius: 18, padding: 14 },
    bubbleBot:     { backgroundColor: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    bubbleUser:    { backgroundColor: '#00A86B', borderBottomRightRadius: 4 },
    bubbleText:    { color: '#D0DCF0', fontSize: 14, lineHeight: 22 },
    bubbleTextUser:{ color: '#fff' },
    xpPill:        { marginTop: 8, backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    xpPillText:    { color: '#FFB800', fontSize: 11, fontWeight: '700' },

    // Typing
    typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 18 },
    typingDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7A8FAD' },

    // Quick Prompts
    quickPrompts: { marginTop: 12, marginBottom: 8 },
    quickTitle:   { color: '#7A8FAD', fontSize: 12, fontWeight: '600', marginBottom: 10 },
    quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    quickBtn:     {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    quickBtnIcon: { fontSize: 13 },
    quickBtnText: { color: '#A0B0CC', fontSize: 12, fontWeight: '600' },

    // Input Bar
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 16, paddingVertical: 12, gap: 10,
        backgroundColor: '#0A1628',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
    },
    inputWrap: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        minHeight: 46, maxHeight: 120, justifyContent: 'center',
    },
    input:     { color: '#F0F4FF', fontSize: 15, lineHeight: 22 },
    sendBtn:   { borderRadius: 22, overflow: 'hidden' },
    sendBtnDisabled: { opacity: 0.6 },
    sendBtnGrad: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
});

export default AITutorScreen;
