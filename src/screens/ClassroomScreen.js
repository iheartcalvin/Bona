import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  BookOpen,
  Send,
  Plus,
  CheckCircle,
  HelpCircle,
  Clock,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { ACADEMIC_CLASSROOMS } from '../services/supabase';

const ClassroomScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [classrooms, setClassrooms] = useState(ACADEMIC_CLASSROOMS);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [discussionModalVisible, setDiscussionModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'Secondary' | 'Primary'

  // Academic Discussion State
  const [newQuestionText, setNewQuestionText] = useState('');
  const [questionsList, setQuestionsList] = useState([
    {
      id: 'q1',
      studentName: 'Amina S.',
      grade: 'Form 2',
      school: 'Canossa High',
      timeAgo: '12m ago',
      question: 'How do stomata regulate water loss through transpiration in xerophytes?',
      questionSw: 'Vipi stomata hudhibiti upotevu wa maji kwenye mimea ya maeneo kame?',
      answersCount: 2,
      aiVerified: true,
      aiAnswer:
        'In xerophytes (e.g. cactus), stomata are sunken in pits and often close during daytime to minimize water vapor diffusion gradient.',
      replies: [
        {
          author: 'Mwl. Mrema (Teacher)',
          role: 'Instructor',
          text: 'Excellent question Amina! Also remember thick waxy cuticles play a major defensive role against water loss.',
        },
      ],
    },
    {
      id: 'q2',
      studentName: 'Kelvin M.',
      grade: 'Std 7',
      school: 'Olympic Primary',
      timeAgo: '25m ago',
      question: 'Jinsi ya kutafuta mzingo wa nusu duara (Perimeter of a semicircle) kama kipenyo ni sm 14?',
      questionSw: 'Tafuta mzingo wa nusu duara kama d = 14 cm.',
      answersCount: 1,
      aiVerified: true,
      aiAnswer:
        'Mzingo wa nusu duara = (π × r) + d. Kwa r = 7cm: (22/7 × 7) + 14 = 22 + 14 = 36 sm.',
      replies: [],
    },
  ]);

  const openClassroom = (room) => {
    setSelectedClassroom(room);
    setDiscussionModalVisible(true);
  };

  const handlePostQuestion = () => {
    if (!newQuestionText.trim()) return;

    const newQ = {
      id: 'q-' + Date.now(),
      studentName: 'Baraka Juma (You)',
      grade: 'Form 2',
      school: 'Azania Sec',
      timeAgo: 'Just now',
      question: newQuestionText.trim(),
      answersCount: 1,
      aiVerified: true,
      aiAnswer:
        'Bona AI Tutor is reviewing this syllabus question and preparing a step-by-step breakdown...',
      replies: [],
    };

    setQuestionsList([newQ, ...questionsList]);
    setNewQuestionText('');
  };

  const filteredRooms = classrooms.filter((r) => {
    if (selectedFilter === 'All') return true;
    return r.level === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>COLLABORATIVE PEER LEARNING</Text>
            <Text style={styles.headerTitle}>Classroom & Halls 🏫</Text>
          </View>
          <TouchableOpacity
            style={styles.askAiButton}
            onPress={() => navigation.navigate('AITutor')}
          >
            <Text style={{ fontSize: 16 }}>🦉</Text>
            <Text style={styles.askAiText}>Ask AI Tutor</Text>
          </TouchableOpacity>
        </View>

        {/* Strictly Academic Guardrail Notice Banner */}
        <View style={styles.guardrailCard}>
          <ShieldCheck size={20} color="#10B981" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guardrailTitle}>Strictly Academic Space</Text>
            <Text style={styles.guardrailDesc}>
              Conversations are moderated for syllabus study only. Non-academic content is blocked.
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['All', 'Secondary', 'Primary'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f === 'All' ? '🌟 All Study Rooms' : f === 'Secondary' ? '📘 Form 1 - 4' : '📗 Std 1 - 7'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Study Circles */}
        <Text style={styles.sectionHeading}>Live Academic Circles</Text>
        <View style={styles.roomList}>
          {filteredRooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              activeOpacity={0.85}
              style={styles.roomCard}
              onPress={() => openClassroom(room)}
            >
              <View style={styles.roomHeader}>
                <View style={styles.roomPill}>
                  <Text style={styles.roomPillText}>{room.subject}</Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{room.activeLearners} Active</Text>
                </View>
              </View>

              <Text style={styles.roomTitle}>{room.title}</Text>
              <Text style={styles.roomDesc}>{room.description}</Text>

              <View style={styles.roomFooter}>
                <View style={styles.moderatorRow}>
                  <ShieldCheck size={14} color="#10B981" />
                  <Text style={styles.moderatorText}>{room.moderator}</Text>
                </View>
                <View style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Enter Hall ➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* DISCUSSION ROOM MODAL */}
      <Modal
        visible={discussionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDiscussionModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: colors.background }]}>
          {selectedClassroom && (
            <View style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSub}>{selectedClassroom.subject} Study Circle</Text>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedClassroom.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setDiscussionModalVisible(false)}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Close</Text>
                </TouchableOpacity>
              </View>

              {/* Questions Stream */}
              <ScrollView
                style={{ flex: 1, paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {questionsList.map((item) => (
                  <View key={item.id} style={styles.questionCard}>
                    {/* Author Row */}
                    <View style={styles.questionAuthorRow}>
                      <View style={styles.authorAvatar}>
                        <Text style={{ fontSize: 16 }}>🧑🏾‍🎓</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.authorName}>{item.studentName}</Text>
                        <Text style={styles.authorMeta}>
                          {item.grade} • {item.school} • {item.timeAgo}
                        </Text>
                      </View>
                    </View>

                    {/* Question Content */}
                    <Text style={styles.questionBody}>{item.question}</Text>
                    {item.questionSw && (
                      <Text style={styles.questionBodySw}>🇹🇿 {item.questionSw}</Text>
                    )}

                    {/* Bona AI Verified Answer Box */}
                    {item.aiVerified && (
                      <View style={styles.aiVerifiedBox}>
                        <View style={styles.aiVerifiedHeader}>
                          <Sparkles size={14} color="#10B981" />
                          <Text style={styles.aiVerifiedLabel}>Bona AI Verified Solution</Text>
                        </View>
                        <Text style={styles.aiVerifiedText}>{item.aiAnswer}</Text>
                      </View>
                    )}

                    {/* Replies */}
                    {item.replies.map((reply, rIdx) => (
                      <View key={rIdx} style={styles.replyBox}>
                        <Text style={styles.replyAuthor}>{reply.author}:</Text>
                        <Text style={styles.replyText}>{reply.text}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>

              {/* Input Bar */}
              <View style={[styles.inputBar, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Ask a syllabus question (e.g. solve 2x + 5 = 15)..."
                  placeholderTextColor={colors.textSecondary}
                  value={newQuestionText}
                  onChangeText={setNewQuestionText}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !newQuestionText.trim() && { opacity: 0.4 },
                  ]}
                  disabled={!newQuestionText.trim()}
                  onPress={handlePostQuestion}
                >
                  <Send size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 16,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 1.2,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginTop: 2,
    },
    askAiButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '18',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
    },
    askAiText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 12,
      marginLeft: 6,
    },
    guardrailCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B98115',
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#10B98135',
      marginBottom: 16,
    },
    guardrailTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#10B981',
      marginBottom: 2,
    },
    guardrailDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    sectionHeading: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
    },
    roomList: {
      gap: 14,
    },
    roomCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    roomHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    roomPill: {
      backgroundColor: colors.primary + '18',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    roomPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B98115',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    liveText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#10B981',
    },
    roomTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    roomDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 16,
    },
    roomFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: 12,
    },
    moderatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    moderatorText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    joinButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    joinButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    modalSafeArea: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    modalSub: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginTop: 2,
    },
    closeBtn: {
      padding: 8,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginTop: 14,
    },
    questionAuthorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    authorAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(150,150,150,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    authorName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    authorMeta: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    questionBody: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 6,
    },
    questionBodySw: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 12,
    },
    aiVerifiedBox: {
      backgroundColor: '#10B98112',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#10B98130',
      marginBottom: 10,
    },
    aiVerifiedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    aiVerifiedLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#10B981',
      marginLeft: 4,
    },
    aiVerifiedText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    replyBox: {
      backgroundColor: 'rgba(150,150,150,0.08)',
      padding: 10,
      borderRadius: 10,
      marginTop: 6,
    },
    replyAuthor: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    replyText: {
      fontSize: 12,
      color: colors.text,
      lineHeight: 16,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    textInput: {
      flex: 1,
      height: 42,
      backgroundColor: 'rgba(150,150,150,0.1)',
      borderRadius: 21,
      paddingHorizontal: 16,
      fontSize: 14,
      marginRight: 10,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default ClassroomScreen;
