import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Zap,
  Target,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { PRACTICE_CHALLENGES, BonaAPI } from '../services/supabase';

const { width } = Dimensions.get('window');

const PracticeScreen = ({ navigation }) => {
  const { colors, gradients } = useTheme();
  const styles = getStyles(colors);

  const [activeTab, setActiveTab] = useState('challenges'); // 'challenges' | 'necta'
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);

  // Quiz active state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
    setEarnedXP(0);
    setQuizModalVisible(true);
  };

  const handleSelectOption = (index) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswerIndex(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIndex === null) return;
    setIsAnswerSubmitted(true);
    const currentQ = selectedQuiz.questions[currentQuestionIndex];
    if (selectedAnswerIndex === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex + 1 < selectedQuiz.questions.length) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      // Completed quiz
      const finalScore = score + (selectedAnswerIndex === selectedQuiz.questions[currentQuestionIndex].correctIndex ? 1 : 0);
      const totalQ = selectedQuiz.questions.length;
      const ratio = finalScore / totalQ;
      const gainedXP = Math.round(selectedQuiz.xpReward * (ratio >= 0.5 ? 1 : 0.4));
      setEarnedXP(gainedXP);
      setQuizCompleted(true);
      await BonaAPI.addXP(gainedXP);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>TANZANIA SYLLABUS PRACTICE</Text>
            <Text style={styles.headerTitle}>Practice Arena 🎯</Text>
          </View>
          <View style={styles.streakBadge}>
            <Zap size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.streakText}>12 Days Streak</Text>
          </View>
        </View>

        {/* Daily Mind Sparks Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => startQuiz(PRACTICE_CHALLENGES[0])}
          style={styles.dailyCardWrapper}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5', '#312E81']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dailyCard}
          >
            <View style={styles.dailyCardContent}>
              <View style={styles.dailyPill}>
                <Sparkles size={12} color="#FDE047" />
                <Text style={styles.dailyPillText}>DAILY CHALLENGE</Text>
              </View>
              <Text style={styles.dailyTitle}>Daily Mind Sparks ⚡</Text>
              <Text style={styles.dailyDesc}>
                5 quick academic questions from Math, Science, Kiswahili & Geo.
              </Text>
              <View style={styles.dailyFooter}>
                <View style={styles.rewardTag}>
                  <Award size={14} color="#FCD34D" />
                  <Text style={styles.rewardText}>+50 XP Reward</Text>
                </View>
                <View style={styles.timeTag}>
                  <Clock size={14} color="#E0E7FF" />
                  <Text style={styles.timeText}>~4 mins</Text>
                </View>
                <View style={styles.playButtonCircle}>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Practice Categories */}
        <View style={styles.categoryToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'challenges' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('challenges')}
          >
            <Text style={[styles.toggleBtnText, activeTab === 'challenges' && styles.toggleBtnTextActive]}>
              🔥 Popular Drills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'necta' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('necta')}
          >
            <Text style={[styles.toggleBtnText, activeTab === 'necta' && styles.toggleBtnTextActive]}>
              📜 NECTA Past Exam Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Practice Cards List */}
        <View style={styles.cardList}>
          {PRACTICE_CHALLENGES.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              activeOpacity={0.8}
              style={styles.quizCard}
              onPress={() => startQuiz(quiz)}
            >
              <View style={styles.quizCardLeft}>
                <View style={styles.quizIconBubble}>
                  <Target size={22} color={colors.primary} />
                </View>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <Text style={styles.quizSubtitle}>{quiz.subtitle}</Text>
                  <View style={styles.quizMetaRow}>
                    <Text style={styles.quizMetaText}>{quiz.questions.length} Questions</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={[styles.quizMetaText, { color: '#F59E0B', fontWeight: '700' }]}>
                      +{quiz.xpReward} XP
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.startBtnSmall}>
                <Text style={styles.startBtnText}>Start</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Tutor Assistant Hint Card */}
        <TouchableOpacity
          style={styles.aiHelperBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AITutor')}
        >
          <LinearGradient
            colors={['#10B98125', '#05966915']}
            style={styles.aiHelperInner}
          >
            <Text style={{ fontSize: 28, marginRight: 12 }}>🦉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiHelperTitle}>Need help solving tough questions?</Text>
              <Text style={styles.aiHelperSubtitle}>
                Bona AI Instructor breaks down step-by-step methods in English & Kiswahili.
              </Text>
            </View>
            <ArrowRight size={18} color="#10B981" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* QUIZ INTERACTIVE MODAL */}
      <Modal
        visible={quizModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setQuizModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {selectedQuiz && !quizCompleted ? (
            <View style={{ flex: 1, padding: 20 }}>
              {/* Modal Top Bar */}
              <View style={styles.modalTopBar}>
                <TouchableOpacity onPress={() => setQuizModalVisible(false)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Exit</Text>
                </TouchableOpacity>
                <Text style={styles.questionCounter}>
                  Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
                </Text>
                <View style={styles.modalXPBadge}>
                  <Award size={14} color="#F59E0B" />
                  <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>
                    +{selectedQuiz.xpReward} XP
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100}%`,
                    },
                  ]}
                />
              </View>

              {/* Question Box */}
              <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.subjectPill}>
                    <Text style={styles.subjectPillText}>
                      {selectedQuiz.questions[currentQuestionIndex].subject}
                    </Text>
                  </View>

                  <Text style={styles.questionText}>
                    {selectedQuiz.questions[currentQuestionIndex].question}
                  </Text>

                  {selectedQuiz.questions[currentQuestionIndex].questionSw && (
                    <Text style={styles.questionSwahili}>
                      🇹🇿 {selectedQuiz.questions[currentQuestionIndex].questionSw}
                    </Text>
                  )}

                  {/* Options */}
                  <View style={{ marginTop: 20 }}>
                    {selectedQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = selectedAnswerIndex === idx;
                      const isCorrect = idx === selectedQuiz.questions[currentQuestionIndex].correctIndex;

                      let optionStyle = styles.optionItem;
                      let textStyle = styles.optionText;

                      if (isAnswerSubmitted) {
                        if (isCorrect) {
                          optionStyle = [styles.optionItem, styles.optionCorrect];
                          textStyle = [styles.optionText, { color: '#10B981', fontWeight: '700' }];
                        } else if (isSelected && !isCorrect) {
                          optionStyle = [styles.optionItem, styles.optionWrong];
                          textStyle = [styles.optionText, { color: '#EF4444', fontWeight: '700' }];
                        }
                      } else if (isSelected) {
                        optionStyle = [styles.optionItem, styles.optionSelected];
                        textStyle = [styles.optionText, { color: colors.primary, fontWeight: '700' }];
                      }

                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          style={optionStyle}
                          onPress={() => handleSelectOption(idx)}
                        >
                          <View style={styles.optionLetterBox}>
                            <Text style={styles.optionLetter}>
                              {String.fromCharCode(65 + idx)}
                            </Text>
                          </View>
                          <Text style={[textStyle, { flex: 1 }]}>{option}</Text>
                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 size={20} color="#10B981" />
                          )}
                          {isAnswerSubmitted && isSelected && !isCorrect && (
                            <XCircle size={20} color="#EF4444" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Explanation after submit */}
                  {isAnswerSubmitted && (
                    <View style={styles.explanationBox}>
                      <Text style={styles.explanationTitle}>💡 Explanation & Concept:</Text>
                      <Text style={styles.explanationText}>
                        {selectedQuiz.questions[currentQuestionIndex].explanation}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>

              {/* Bottom Action Button */}
              <View style={styles.modalBottomBar}>
                {!isAnswerSubmitted ? (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      selectedAnswerIndex === null && styles.actionBtnDisabled,
                    ]}
                    disabled={selectedAnswerIndex === null}
                    onPress={handleSubmitAnswer}
                  >
                    <Text style={styles.actionBtnText}>Check Answer</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={handleNextQuestion}
                  >
                    <Text style={styles.actionBtnText}>
                      {currentQuestionIndex + 1 < selectedQuiz.questions.length
                        ? 'Next Question ➔'
                        : 'See Results 🏆'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : quizCompleted ? (
            /* Quiz Results Screen */
            <View style={styles.resultContainer}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
              <Text style={styles.resultTitle}>Great Job, Scholar!</Text>
              <Text style={styles.resultSubtitle}>
                You scored {score} / {selectedQuiz.questions.length} on {selectedQuiz.title}
              </Text>

              <View style={styles.scoreCard}>
                <View style={styles.scoreItem}>
                  <Award size={28} color="#F59E0B" />
                  <Text style={styles.scoreItemValue}>+{earnedXP} XP</Text>
                  <Text style={styles.scoreItemLabel}>Earned</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreItem}>
                  <Target size={28} color="#6366F1" />
                  <Text style={styles.scoreItemValue}>
                    {Math.round((score / selectedQuiz.questions.length) * 100)}%
                  </Text>
                  <Text style={styles.scoreItemLabel}>Accuracy</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setQuizModalVisible(false)}
              >
                <Text style={styles.doneBtnText}>Back to Arena</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
      marginBottom: 20,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginTop: 2,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F59E0B20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#F59E0B40',
    },
    streakText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#F59E0B',
      marginLeft: 5,
    },
    dailyCardWrapper: {
      marginBottom: 20,
      borderRadius: 24,
      overflow: 'hidden',
      elevation: 4,
    },
    dailyCard: {
      padding: 22,
    },
    dailyCardContent: {},
    dailyPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 10,
    },
    dailyPillText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#FDE047',
      marginLeft: 4,
      letterSpacing: 0.8,
    },
    dailyTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: 6,
    },
    dailyDesc: {
      fontSize: 13,
      color: '#E0E7FF',
      lineHeight: 18,
      marginBottom: 16,
    },
    dailyFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rewardTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      marginRight: 8,
    },
    rewardText: {
      color: '#FCD34D',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
    timeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      marginRight: 'auto',
    },
    timeText: {
      color: '#E0E7FF',
      fontSize: 12,
      marginLeft: 4,
    },
    playButtonCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    toggleBtnActive: {
      backgroundColor: colors.primary,
    },
    toggleBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    toggleBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    cardList: {
      gap: 12,
      marginBottom: 20,
    },
    quizCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    quizCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    quizIconBubble: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    quizInfo: {
      flex: 1,
    },
    quizTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 3,
    },
    quizSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    quizMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quizMetaText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    metaDot: {
      marginHorizontal: 6,
      color: colors.textSecondary,
    },
    startBtnSmall: {
      backgroundColor: colors.primary + '18',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    startBtnText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13,
    },
    aiHelperBanner: {
      borderRadius: 18,
      overflow: 'hidden',
      marginTop: 4,
    },
    aiHelperInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#10B98135',
    },
    aiHelperTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 3,
    },
    aiHelperSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    modalContainer: {
      flex: 1,
    },
    modalTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    questionCounter: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    modalXPBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F59E0B20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.surface,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 20,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    subjectPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 12,
    },
    subjectPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    questionText: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 26,
      marginBottom: 8,
    },
    questionSwahili: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      marginBottom: 12,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    optionCorrect: {
      borderColor: '#10B981',
      backgroundColor: '#10B98115',
    },
    optionWrong: {
      borderColor: '#EF4444',
      backgroundColor: '#EF444415',
    },
    optionLetterBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(150,150,150,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    optionLetter: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
    },
    explanationBox: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginTop: 8,
      marginBottom: 20,
    },
    explanationTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#10B981',
      marginBottom: 4,
    },
    explanationText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    modalBottomBar: {
      paddingTop: 12,
    },
    actionBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
    },
    actionBtnDisabled: {
      opacity: 0.4,
    },
    actionBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    resultContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    resultTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 8,
    },
    resultSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
    },
    scoreCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      width: '100%',
      justifyContent: 'space-around',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 32,
    },
    scoreItem: {
      alignItems: 'center',
    },
    scoreItemValue: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
      marginTop: 6,
    },
    scoreItemLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scoreDivider: {
      width: 1,
      backgroundColor: colors.cardBorder,
    },
    doneBtn: {
      backgroundColor: colors.primary,
      width: '100%',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    doneBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
  });

export default PracticeScreen;
