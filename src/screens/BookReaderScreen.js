import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Highlighter,
  BookMarked,
  X,
  Send,
  Minus,
  Plus,
  BookOpen,
  Save,
  Copy,
  Check,
  Clock,
  Zap,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { GROQ_API_KEY } from '@env';

const { width } = Dimensions.get('window');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FAST_MODEL = 'llama-3.1-8b-instant';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#FFD700', bg: 'rgba(255,215,0,0.28)', label: 'Focus' },
  { id: 'green',  color: '#00C27B', bg: 'rgba(0,194,123,0.25)', label: 'Got it' },
  { id: 'blue',   color: '#38BDF8', bg: 'rgba(56,189,248,0.25)', label: 'Review' },
  { id: 'pink',   color: '#F472B6', bg: 'rgba(244,114,182,0.25)', label: 'Important' },
];

const generateParagraphs = (book, chapTitle, idx) => {
  const subject = book.subjectName || 'this subject';
  const clean = chapTitle.replace(/^\d+\.\s*/, '');
  return [
    {
      id: `${idx}-0`,
      text: `Welcome to Chapter ${idx + 1}: ${clean}. This chapter forms a fundamental part of the ${book.level} ${subject} curriculum as outlined by the Tanzania Institute of Education (TIE). Mastering the concepts here will prepare you well for NECTA assessments and real-world applications.`,
    },
    {
      id: `${idx}-1`,
      text: `${clean} is a topic that appears frequently in national examinations. Students who invest time in understanding the core definitions, underlying principles, and worked examples tend to score significantly higher in their NECTA papers. Take your time with each paragraph and do not hesitate to use the Bona AI button to get personalised explanations.`,
    },
    {
      id: `${idx}-2`,
      text: `Key Concepts in ${clean}: Every topic in the NECTA syllabus builds upon foundational knowledge. Before proceeding, make sure you understand the terminology introduced in earlier chapters. Cross-referencing between chapters is strongly recommended and will deepen your understanding.`,
    },
    {
      id: `${idx}-3`,
      text: `Learning Objectives: By the end of this chapter, you should be able to (1) define and explain the core concepts of ${clean}, (2) apply these concepts to solve standard NECTA-type questions, (3) relate the topic to real-life situations, and (4) identify common mistakes made in examinations and how to avoid them.`,
    },
    {
      id: `${idx}-4`,
      text: `Worked Example: Consider a typical examination question on ${clean}. The approach involves identifying what is given, what is asked, selecting the correct formula or method, showing all workings, and presenting a clear final answer with proper units where applicable. Marks are awarded for method as well as accuracy.`,
    },
    {
      id: `${idx}-5`,
      text: `Practice is the most effective way to master ${clean}. After reading each section, attempt the practice exercises provided in your workbook. Use Bona AI to check your approach and get step-by-step guidance whenever you are stuck. Remember: asking questions is a sign of intelligence, not weakness.`,
    },
    {
      id: `${idx}-6`,
      text: `Summary of Chapter ${idx + 1}: ${clean} covers important aspects of the ${book.level} ${subject} syllabus. The key takeaways are the definitions, formulas, and problem-solving strategies introduced throughout this chapter. Review your highlights and saved summaries before your examination to consolidate your understanding.`,
    },
  ];
};

const buildChaptersFromBook = (book) => {
  return book.tableOfContents.map((chapTitle, idx) => ({
    id: idx,
    title: chapTitle,
    paragraphs: generateParagraphs(book, chapTitle, idx),
  }));
};

const askBonaAI = async (selectedText, bookTitle, subjectName, conversationHistory) => {
  const systemPrompt = `You are "Bona AI" — an expert academic tutor for Tanzanian students aged 7 to 18.
The student is reading: "${bookTitle}" for ${subjectName}.
Selected passage: "${selectedText}"
Tasks: Explain clearly, break down vocabulary, give exam-relevant examples. End with encouragement and a follow-up question. Max 200 words. Academic topics only.`;

  const payload = {
    model: FAST_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.text })),
    ],
    temperature: 0.6,
    max_tokens: 350,
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
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I'm thinking, please try again!";
  } catch (_err) {
    return `📚 Bona AI (Offline Mode)\n\nThe passage you selected discusses an important concept in ${subjectName}.\n\n• Core Idea: Key terminology and principles foundational to this topic.\n• Why It Matters: Understanding this helps you answer NECTA exam questions correctly.\n• Tip: Highlight key terms, write them in your own words, and test yourself with practice questions.\n\nKeep reading! Every paragraph brings you closer to excellence! 🦉✨\n\nWhat part would you like explained further?`;
  }
};

const BookReaderScreen = () => {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { book, subjectColor = '#3B82F6', subjectName = 'Subject' } = params;

  if (!book) {
    navigation.goBack();
    return null;
  }

  const enrichedBook = useMemo(() => ({ ...book, subjectName }), [book, subjectName]);
  const chapters = useMemo(() => buildChaptersFromBook(enrichedBook), [enrichedBook]);

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [highlights, setHighlights] = useState({});
  const [selectedParagraph, setSelectedParagraph] = useState(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);

  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiContext, setAiContext] = useState('');

  const [savedSummaries, setSavedSummaries] = useState([]);
  const [summariesModalVisible, setSummariesModalVisible] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const scrollRef = useRef(null);
  const aiScrollRef = useRef(null);
  const currentChapter = chapters[currentChapterIdx];

  const handleParagraphPress = useCallback((paragraph) => {
    Vibration.vibrate(40);
    setSelectedParagraph(paragraph);
    setToolbarVisible(true);
  }, []);

  const applyHighlight = useCallback((colorEntry) => {
    if (!selectedParagraph) return;
    setHighlights(prev => ({
      ...prev,
      [selectedParagraph.id]: { color: colorEntry.color, bg: colorEntry.bg },
    }));
    setToolbarVisible(false);
  }, [selectedParagraph]);

  const removeHighlight = useCallback(() => {
    if (!selectedParagraph) return;
    setHighlights(prev => {
      const next = { ...prev };
      delete next[selectedParagraph.id];
      return next;
    });
    setToolbarVisible(false);
  }, [selectedParagraph]);

  const askAIAboutSelection = useCallback(async (paragraph) => {
    setToolbarVisible(false);
    setAiContext(paragraph.text);
    setAiMessages([{ id: Date.now(), role: 'assistant', text: 'Let me explain that passage for you! 🦉\n\nLoading...' }]);
    setAiPanelVisible(true);
    setAiLoading(true);
    const explanation = await askBonaAI(paragraph.text, book.title, subjectName, []);
    setAiMessages([{ id: Date.now(), role: 'assistant', text: explanation }]);
    setAiLoading(false);
  }, [currentChapter, book, subjectName]);

  const sendAIMessage = useCallback(async () => {
    const trimmed = aiInput.trim();
    if (!trimmed || aiLoading) return;
    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    const newHistory = [...aiMessages, userMsg];
    setAiMessages(newHistory);
    setAiInput('');
    setAiLoading(true);
    setTimeout(() => aiScrollRef.current?.scrollToEnd({ animated: true }), 100);
    const reply = await askBonaAI(aiContext, book.title, subjectName, newHistory);
    setAiMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }]);
    setAiLoading(false);
    setTimeout(() => aiScrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [aiInput, aiMessages, aiLoading, aiContext, book, subjectName]);

  const saveAsSummary = useCallback(() => {
    if (aiMessages.length === 0) return;
    const lastAI = [...aiMessages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const summary = {
      id: Date.now(),
      bookTitle: book.title,
      chapter: currentChapter.title,
      passage: aiContext.slice(0, 120) + (aiContext.length > 120 ? '...' : ''),
      explanation: lastAI.text,
      savedAt: new Date().toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setSavedSummaries(prev => [summary, ...prev]);
    Alert.alert('Summary Saved', 'This explanation has been saved to your review notes!');
  }, [aiMessages, aiContext, book, currentChapter]);

  const copyParagraph = useCallback(async (paragraph) => {
    await Clipboard.setStringAsync(paragraph.text);
    setCopiedId(paragraph.id);
    setToolbarVisible(false);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const goNextChapter = () => {
    if (currentChapterIdx < chapters.length - 1) {
      setCurrentChapterIdx(c => c + 1);
      setSelectedParagraph(null);
      setToolbarVisible(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goPrevChapter = () => {
    if (currentChapterIdx > 0) {
      setCurrentChapterIdx(c => c - 1);
      setSelectedParagraph(null);
      setToolbarVisible(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const renderAIMessage = (msg) => {
    const isUser = msg.role === 'user';
    return (
      <View key={msg.id} style={[styles.aiBubble, isUser ? styles.aiBubbleUser : styles.aiBubbleAI]}>
        {!isUser && (
          <View style={styles.aiAvatarSmall}>
            <Text style={{ fontSize: 14 }}>🦉</Text>
          </View>
        )}
        <View style={[styles.aiBubbleContent, isUser ? styles.aiBubbleContentUser : styles.aiBubbleContentAI]}>
          <Text style={[styles.aiBubbleText, isUser && styles.aiBubbleTextUser]}>{msg.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[subjectColor, '#0A1628']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <ChevronLeft color="#fff" size={22} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={styles.bookTitleHeader} numberOfLines={1}>{book.title}</Text>
              <Text style={styles.chapterHeaderLabel} numberOfLines={1}>Ch. {currentChapterIdx + 1} · {currentChapter.title}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setSummariesModalVisible(true)} style={styles.headerIconBtn} activeOpacity={0.8}>
                <BookMarked size={20} color={savedSummaries.length > 0 ? '#FFD700' : '#A0B0CC'} />
                {savedSummaries.length > 0 && (
                  <View style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>{savedSummaries.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize(f => Math.max(12, f - 2))} style={styles.headerIconBtn}>
                <Minus size={16} color="#A0B0CC" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize(f => Math.min(24, f + 2))} style={styles.headerIconBtn}>
                <Plus size={16} color="#A0B0CC" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${((currentChapterIdx + 1) / chapters.length) * 100}%`, backgroundColor: subjectColor }]} />
          </View>
          <Text style={styles.progressLabel}>Chapter {currentChapterIdx + 1} of {chapters.length}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={styles.readerScroll} contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
        <View style={styles.chapterTitleContainer}>
          <Text style={[styles.chapterTitleNum, { color: subjectColor }]}>Chapter {currentChapterIdx + 1}</Text>
          <Text style={styles.chapterTitleText}>{currentChapter.title}</Text>
        </View>
        <View style={[styles.chapterDivider, { backgroundColor: subjectColor }]} />

        <View style={styles.selectionHintBanner}>
          <Sparkles size={13} color="#FFD700" />
          <Text style={styles.selectionHintText}>Tap any paragraph to highlight or ask Bona AI for an explanation</Text>
        </View>

        {currentChapter.paragraphs.map((para) => {
          const hl = highlights[para.id];
          const isSelected = selectedParagraph?.id === para.id && toolbarVisible;
          const copied = copiedId === para.id;
          return (
            <TouchableOpacity
              key={para.id}
              activeOpacity={0.85}
              onPress={() => handleParagraphPress(para)}
              style={[
                styles.paragraphWrapper,
                hl ? { backgroundColor: hl.bg, borderLeftColor: hl.color, borderLeftWidth: 3 } : null,
                isSelected ? styles.paragraphSelected : null,
              ]}
            >
              <Text style={[styles.paragraphText, { fontSize }]}>{para.text}</Text>
              {copied && (
                <View style={styles.copiedBadge}>
                  <Check size={12} color="#10B981" />
                  <Text style={styles.copiedBadgeText}>Copied</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.chapterNavRow}>
          <TouchableOpacity onPress={goPrevChapter} disabled={currentChapterIdx === 0} style={[styles.chapterNavBtn, currentChapterIdx === 0 && styles.chapterNavBtnDisabled]}>
            <ChevronLeft size={18} color={currentChapterIdx === 0 ? '#3A4A60' : '#F0F4FF'} />
            <Text style={[styles.chapterNavText, currentChapterIdx === 0 && { color: '#3A4A60' }]}>Prev</Text>
          </TouchableOpacity>
          <View style={styles.chapterDotRow}>
            {chapters.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => { setCurrentChapterIdx(i); scrollRef.current?.scrollTo({ y: 0, animated: true }); }} style={[styles.chapterDot, i === currentChapterIdx && { backgroundColor: subjectColor, width: 18 }]} />
            ))}
          </View>
          <TouchableOpacity onPress={goNextChapter} disabled={currentChapterIdx === chapters.length - 1} style={[styles.chapterNavBtn, currentChapterIdx === chapters.length - 1 && styles.chapterNavBtnDisabled]}>
            <Text style={[styles.chapterNavText, currentChapterIdx === chapters.length - 1 && { color: '#3A4A60' }]}>Next</Text>
            <ChevronRight size={18} color={currentChapterIdx === chapters.length - 1 ? '#3A4A60' : '#F0F4FF'} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toolbarVisible && selectedParagraph && (
        <View style={styles.selectionToolbar}>
          {HIGHLIGHT_COLORS.map(hc => (
            <TouchableOpacity key={hc.id} onPress={() => applyHighlight(hc)} style={[styles.highlightColorBtn, { backgroundColor: hc.bg, borderColor: hc.color }]}>
              <Highlighter size={14} color={hc.color} />
            </TouchableOpacity>
          ))}
          <View style={styles.toolbarDivider} />
          <TouchableOpacity onPress={() => askAIAboutSelection(selectedParagraph)} style={styles.toolbarAskBtn}>
            <Sparkles size={14} color="#FFD700" />
            <Text style={styles.toolbarAskText}>Ask AI</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => copyParagraph(selectedParagraph)} style={styles.toolbarCopyBtn}>
            <Copy size={14} color="#A0B0CC" />
          </TouchableOpacity>
          {highlights[selectedParagraph.id] && (
            <TouchableOpacity onPress={removeHighlight} style={styles.toolbarRemoveBtn}>
              <X size={14} color="#F87171" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setToolbarVisible(false)} style={styles.toolbarDismissBtn}>
            <X size={14} color="#7A8FAD" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={aiPanelVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAiPanelVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.aiPanel}>
            <LinearGradient colors={['#0F2040', '#060E1E']} style={styles.aiPanelHeader}>
              <View style={styles.aiPanelHeaderRow}>
                <View style={styles.aiPanelAvatarRow}>
                  <View style={styles.aiPanelAvatar}>
                    <Text style={{ fontSize: 24 }}>🦉</Text>
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.aiPanelName}>Bona AI</Text>
                    <View style={styles.aiOnlineRow}>
                      <View style={styles.aiOnlineDot} />
                      <Text style={styles.aiOnlineText}>Explaining your selection</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={saveAsSummary} style={styles.aiSaveBtn}>
                    <Save size={16} color="#FFD700" />
                    <Text style={styles.aiSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAiPanelVisible(false)} style={styles.aiPanelCloseBtn}>
                    <X size={18} color="#A0B0CC" />
                  </TouchableOpacity>
                </View>
              </View>
              {aiContext ? (
                <View style={styles.aiContextSnippet}>
                  <BookOpen size={12} color="#7A8FAD" />
                  <Text style={styles.aiContextText} numberOfLines={2}>{aiContext}</Text>
                </View>
              ) : null}
            </LinearGradient>

            <ScrollView ref={aiScrollRef} style={styles.aiMessagesScroll} contentContainerStyle={styles.aiMessagesContent} showsVerticalScrollIndicator={false}>
              {aiMessages.map(renderAIMessage)}
              {aiLoading && (
                <View style={styles.aiTypingRow}>
                  <View style={styles.aiAvatarSmall}>
                    <Text style={{ fontSize: 14 }}>🦉</Text>
                  </View>
                  <View style={styles.aiTypingBubble}>
                    <ActivityIndicator size="small" color="#00C27B" />
                    <Text style={styles.aiTypingText}>Bona AI is thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiInput}
                value={aiInput}
                onChangeText={setAiInput}
                placeholder="Ask a follow-up question..."
                placeholderTextColor="#566478"
                multiline
                returnKeyType="send"
                onSubmitEditing={sendAIMessage}
              />
              <TouchableOpacity onPress={sendAIMessage} disabled={!aiInput.trim() || aiLoading} style={[styles.aiSendBtn, (!aiInput.trim() || aiLoading) && styles.aiSendBtnDisabled]}>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={summariesModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSummariesModalVisible(false)}>
        <SafeAreaView style={styles.summariesModal}>
          <View style={styles.summariesHeader}>
            <Text style={styles.summariesTitle}>My Review Summaries</Text>
            <TouchableOpacity onPress={() => setSummariesModalVisible(false)}>
              <X size={22} color="#A0B0CC" />
            </TouchableOpacity>
          </View>
          {savedSummaries.length === 0 ? (
            <View style={styles.emptySummaries}>
              <BookMarked size={48} color="#1E3A5F" />
              <Text style={styles.emptySummariesText}>No summaries yet</Text>
              <Text style={styles.emptySummariesSub}>Select a paragraph, ask Bona AI, then tap Save to build your review notes</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {savedSummaries.map((s) => (
                <View key={s.id} style={styles.summaryCard}>
                  <View style={styles.summaryCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryBookTitle} numberOfLines={1}>{s.bookTitle}</Text>
                      <Text style={styles.summaryChapter}>{s.chapter}</Text>
                    </View>
                    <View style={styles.summaryDateBadge}>
                      <Clock size={11} color="#7A8FAD" />
                      <Text style={styles.summaryDate}>{s.savedAt}</Text>
                    </View>
                  </View>
                  <View style={styles.summaryPassageBox}>
                    <Text style={styles.summaryPassageText} numberOfLines={2}>{s.passage}</Text>
                  </View>
                  <Text style={styles.summaryExplanation}>{s.explanation}</Text>
                  <TouchableOpacity style={styles.summaryShareBtn} onPress={async () => { await Clipboard.setStringAsync(`${s.chapter}\n\n${s.explanation}`); Alert.alert('Copied', 'Summary copied to clipboard!'); }}>
                    <Zap size={13} color="#00C27B" />
                    <Text style={styles.summaryShareBtnText}>Copy Summary</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060E1E' },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  bookTitleHeader: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  chapterHeaderLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  badgeDot: { position: 'absolute', top: -3, right: -3, backgroundColor: '#FFD700', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeDotText: { color: '#0A1628', fontSize: 9, fontWeight: '900' },
  progressBarContainer: { height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: 3, borderRadius: 2 },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 5, textAlign: 'right' },
  readerScroll: { flex: 1 },
  readerContent: { padding: 20, paddingBottom: 120 },
  chapterTitleContainer: { marginBottom: 8 },
  chapterTitleNum: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  chapterTitleText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  chapterDivider: { height: 2, width: 48, borderRadius: 2, marginVertical: 14 },
  selectionHintBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 10, padding: 10, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,215,0,0.18)' },
  selectionHintText: { color: '#A0B0CC', fontSize: 11, flex: 1 },
  paragraphWrapper: { borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderLeftWidth: 0 },
  paragraphSelected: { backgroundColor: 'rgba(0,194,123,0.08)', borderColor: 'rgba(0,194,123,0.3)', borderWidth: 1 },
  paragraphText: { color: '#D8E4F0', lineHeight: 26, letterSpacing: 0.1 },
  copiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  copiedBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  chapterNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  chapterNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10 },
  chapterNavBtnDisabled: { opacity: 0.35 },
  chapterNavText: { color: '#F0F4FF', fontSize: 13, fontWeight: '700' },
  chapterDotRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chapterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  selectionToolbar: { position: 'absolute', bottom: 30, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0F2040', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, elevation: 10 },
  highlightColorBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  toolbarDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 2 },
  toolbarAskBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  toolbarAskText: { color: '#FFD700', fontSize: 12, fontWeight: '800' },
  toolbarCopyBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  toolbarRemoveBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,113,113,0.12)' },
  toolbarDismissBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  aiPanel: { flex: 1, backgroundColor: '#060E1E' },
  aiPanelHeader: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14 },
  aiPanelHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiPanelAvatarRow: { flexDirection: 'row', alignItems: 'center' },
  aiPanelAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,168,107,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#00C27B' },
  aiPanelName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  aiOnlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  aiOnlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  aiOnlineText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  aiSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  aiSaveBtnText: { color: '#FFD700', fontSize: 12, fontWeight: '800' },
  aiPanelCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  aiContextSnippet: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderLeftWidth: 3, borderLeftColor: '#00C27B' },
  aiContextText: { color: '#7A8FAD', fontSize: 11, flex: 1, lineHeight: 16 },
  aiMessagesScroll: { flex: 1 },
  aiMessagesContent: { padding: 16, paddingBottom: 20, gap: 12 },
  aiBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  aiBubbleUser: { flexDirection: 'row-reverse' },
  aiBubbleAI: {},
  aiAvatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,168,107,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  aiBubbleContent: { maxWidth: width * 0.76, borderRadius: 16, padding: 12 },
  aiBubbleContentAI: { backgroundColor: '#0F2040', borderTopLeftRadius: 4 },
  aiBubbleContentUser: { backgroundColor: '#00A86B', borderTopRightRadius: 4 },
  aiBubbleText: { color: '#D8E4F0', fontSize: 14, lineHeight: 21 },
  aiBubbleTextUser: { color: '#fff' },
  aiTypingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTypingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0F2040', borderRadius: 16, padding: 12 },
  aiTypingText: { color: '#7A8FAD', fontSize: 13 },
  aiInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0A1628', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  aiInput: { flex: 1, color: '#F0F4FF', fontSize: 14, backgroundColor: '#0F2040', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: 100 },
  aiSendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#00A86B', alignItems: 'center', justifyContent: 'center' },
  aiSendBtnDisabled: { backgroundColor: '#1E3A5F' },
  summariesModal: { flex: 1, backgroundColor: '#060E1E' },
  summariesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  summariesTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  emptySummaries: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptySummariesText: { color: '#F0F4FF', fontSize: 18, fontWeight: '800', marginTop: 16 },
  emptySummariesSub: { color: '#7A8FAD', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  summaryCard: { backgroundColor: '#0F2040', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  summaryCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  summaryBookTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  summaryChapter: { color: '#00C27B', fontSize: 11, marginTop: 2, fontWeight: '700' },
  summaryDateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryDate: { color: '#7A8FAD', fontSize: 10 },
  summaryPassageBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: '#3B82F6' },
  summaryPassageText: { color: '#7A8FAD', fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  summaryExplanation: { color: '#D8E4F0', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  summaryShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,194,123,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(0,194,123,0.2)' },
  summaryShareBtnText: { color: '#00C27B', fontSize: 12, fontWeight: '700' },
});

export default BookReaderScreen;
