import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Lock,
  PlayCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getSubjectCurriculum } from '../data/learningCatalog';

const { width } = Dimensions.get('window');

const SubjectDetailScreen = () => {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const subject = params.subject || { id: 'mathematics', name: 'Mathematics', emoji: '📐', color: '#3B82F6' };
  
  const curriculum = useMemo(() => getSubjectCurriculum(subject), [subject]);
  const [activeTab, setActiveTab] = useState('courses'); // 'ai' | 'courses' | 'syllabus' | 'textbooks'
  
  // Selected textbook preview modal state
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [purchasedBooks, setPurchasedBooks] = useState({});

  // Teacher course session click
  const openSession = (session, course, teacher) => {
    navigation.navigate('LessonDetail', {
      lesson: {
        ...session,
        subjectId: subject.id,
        subjectName: subject.name,
        description: `${course.title} · ${teacher.name} (${teacher.school})`,
      },
      subjectColor: subject.color,
      course,
      teacher,
    });
  };

  // Launch Bona AI Tutor with tailored subject context
  const launchAITutor = (prompt) => {
    const contextPrompt = prompt || `${subject.name} (Tanzania NECTA Syllabus). Help me master this subject with step-by-step guidance!`;
    navigation.navigate('AITutor', {
      context: contextPrompt,
      subjectId: subject.id,
      subjectName: subject.name,
      aiTeacher: curriculum.aiTeacher,
    });
  };

  // Handle Textbook Access / Purchase
  const handleBookAction = (book) => {
    if (book.isFree || purchasedBooks[book.id]) {
      // Open in-app eBook reader
      navigation.navigate('BookReader', {
        book,
        subjectColor: subject.color || '#3B82F6',
        subjectName: subject.name,
      });
      setBookModalVisible(false);
    } else {
      Alert.alert(
        'Unlock Textbook',
        `Would you like to unlock "${book.title}" for ${book.price} via ClickPesa (M-Pesa / TigoPesa / AirtelMoney)?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Pay ${book.price}`,
            onPress: () => {
              setPurchasedBooks((prev) => ({ ...prev, [book.id]: true }));
              Alert.alert('Payment Successful', `"${book.title}" is now in your library! Tap Open Full Book to start reading.`);
            },
          },
        ]
      );
    }
  };

  // Open reader directly for unlocked books from card
  const openBookReader = (book) => {
    const isUnlocked = book.isFree || purchasedBooks[book.id];
    if (isUnlocked) {
      navigation.navigate('BookReader', {
        book,
        subjectColor: subject.color || '#3B82F6',
        subjectName: subject.name,
      });
    } else {
      setSelectedBook(book);
      setBookModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* ─── Hero Header ─── */}
      <LinearGradient
        colors={[subject.color || '#3B82F6', '#0A1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Tanzania NECTA Syllabus</Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroEmojiBox}>
              <Text style={styles.heroEmoji}>{subject.emoji || '📚'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.heroTitle}>{subject.name}</Text>
              <Text style={styles.heroSubtitle}>
                AI Specialist, Accredited Teachers & Curated Textbooks
              </Text>
            </View>
          </View>

          {/* Quick AI Tutor Banner in Hero */}
          <TouchableOpacity
            style={styles.heroAIBanner}
            onPress={() => launchAITutor()}
            activeOpacity={0.9}
          >
            <View style={styles.aiAvatarCircle}>
              <Text style={{ fontSize: 22 }}>🦉</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.aiNameText}>{curriculum.aiTeacher.name}</Text>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
              <Text style={styles.aiSpecialtyText} numberOfLines={1}>
                {curriculum.aiTeacher.specialty}
              </Text>
            </View>
            <View style={styles.askAiChip}>
              <Sparkles size={14} color="#00A86B" />
              <Text style={styles.askAiChipText}>Ask AI</Text>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* ─── Interactive Section Tabs ─── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            onPress={() => setActiveTab('courses')}
            style={[styles.tabItem, activeTab === 'courses' && styles.tabItemActive]}
          >
            <PlayCircle size={15} color={activeTab === 'courses' ? '#00C27B' : '#7A8FAD'} />
            <Text style={[styles.tabLabel, activeTab === 'courses' && styles.tabLabelActive]}>
              Teachers & Courses ({curriculum.teachers.reduce((acc, t) => acc + t.courses.length, 0)})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('textbooks')}
            style={[styles.tabItem, activeTab === 'textbooks' && styles.tabItemActive]}
          >
            <BookOpen size={15} color={activeTab === 'textbooks' ? '#00C27B' : '#7A8FAD'} />
            <Text style={[styles.tabLabel, activeTab === 'textbooks' && styles.tabLabelActive]}>
              Textbooks ({curriculum.textbooks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('ai')}
            style={[styles.tabItem, activeTab === 'ai' && styles.tabItemActive]}
          >
            <Sparkles size={15} color={activeTab === 'ai' ? '#00C27B' : '#7A8FAD'} />
            <Text style={[styles.tabLabel, activeTab === 'ai' && styles.tabLabelActive]}>
              AI Teacher
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('syllabus')}
            style={[styles.tabItem, activeTab === 'syllabus' && styles.tabItemActive]}
          >
            <ShieldCheck size={15} color={activeTab === 'syllabus' ? '#00C27B' : '#7A8FAD'} />
            <Text style={[styles.tabLabel, activeTab === 'syllabus' && styles.tabLabelActive]}>
              Syllabus Topics
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── Tab Content ─── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══════════════ TAB 1: TEACHERS & ACCREDITED COURSES ══════════════ */}
        {activeTab === 'courses' && (
          <View>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionHeading}>Registered Real Teachers</Text>
                <Text style={styles.sectionSubtitle}>
                  Accredited educators following the official {subject.name} NECTA syllabus
                </Text>
              </View>
            </View>

            {curriculum.teachers.map((teacher) => (
              <View key={teacher.id} style={styles.teacherContainer}>
                {/* Teacher Profile Card */}
                <View style={styles.teacherHeader}>
                  <View style={styles.teacherAvatar}>
                    <Text style={{ fontSize: 24 }}>👨🏾‍🏫</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.teacherName}>{teacher.name}</Text>
                      {teacher.verified && (
                        <ShieldCheck size={15} color="#10B981" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                    <Text style={styles.teacherSchool}>{teacher.school}</Text>
                    <View style={styles.teacherMetaRow}>
                      <Star size={12} color="#F59E0B" />
                      <Text style={styles.teacherMetaText}>{teacher.rating} rating</Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Users size={12} color="#7A8FAD" />
                      <Text style={styles.teacherMetaText}>{teacher.studentsCount} students</Text>
                    </View>
                  </View>
                  <View style={styles.teacherExpBadge}>
                    <Text style={styles.teacherExpText}>{teacher.experience.split(' ')[0]} yrs</Text>
                  </View>
                </View>

                {/* Courses Offered By This Teacher */}
                <Text style={styles.coursesOfferedTitle}>Courses Offered Following Syllabus:</Text>
                {teacher.courses.map((course) => (
                  <View key={course.id} style={styles.courseCard}>
                    <View style={styles.courseCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <View style={styles.courseLevelPill}>
                            <Text style={styles.courseLevelText}>{course.level}</Text>
                          </View>
                          <View
                            style={[
                              styles.priceBadge,
                              course.isFree ? styles.priceBadgeFree : styles.priceBadgePaid,
                            ]}
                          >
                            <Text
                              style={[
                                styles.priceBadgeText,
                                course.isFree ? styles.priceTextFree : styles.priceTextPaid,
                              ]}
                            >
                              {course.price}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.courseTitle}>{course.title}</Text>
                      </View>
                    </View>

                    <Text style={styles.courseDesc}>{course.description}</Text>

                    <View style={styles.syllabusTagRow}>
                      <ShieldCheck size={12} color="#00C27B" />
                      <Text style={styles.syllabusTagText}>Aligned: {course.syllabusCoverage}</Text>
                    </View>

                    {/* Sessions Breakdown */}
                    <View style={styles.sessionsWrapper}>
                      {course.sessions.map((session, idx) => (
                        <TouchableOpacity
                          key={session.id}
                          style={styles.sessionRow}
                          onPress={() => openSession(session, course, teacher)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.sessionIdxCircle}>
                            <Text style={styles.sessionIdxText}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.sessionTitle}>{session.title}</Text>
                            <Text style={styles.sessionMeta}>
                              {session.duration} • {session.exerciseCount} practice exercises
                            </Text>
                          </View>
                          <View style={styles.xpMiniBadge}>
                            <Zap size={11} color="#F59E0B" />
                            <Text style={styles.xpMiniText}>+{session.xp} XP</Text>
                          </View>
                          <ChevronRight size={18} color="#7A8FAD" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* Future Teacher Registration Callout */}
            <View style={styles.futureTeacherCard}>
              <View style={styles.futureTeacherIcon}>
                <Award size={24} color="#FFB800" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.futureTeacherTitle}>Are you a verified Teacher?</Text>
                <Text style={styles.futureTeacherDesc}>
                  Register your credentials and publish accredited courses tailored to the NECTA syllabus for Tanzanian students nationwide.
                </Text>
                <TouchableOpacity
                  style={styles.joinTeacherBtn}
                  onPress={() => Alert.alert('Teacher Portal', 'Teacher accreditation portal is open. Contact administration to register your curriculum!')}
                >
                  <Text style={styles.joinTeacherBtnText}>Register As Verified Teacher</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════ TAB 2: TEXTBOOKS (FREE & PAID) ══════════════ */}
        {activeTab === 'textbooks' && (
          <View>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionHeading}>Official & Revision Textbooks</Text>
                <Text style={styles.sectionSubtitle}>
                  TIE official school books (Free) & comprehensive NECTA revision manuals
                </Text>
              </View>
            </View>

            {curriculum.textbooks.map((book) => {
              const isUnlocked = book.isFree || purchasedBooks[book.id];
              return (
                <View key={book.id} style={styles.bookCard}>
                  <View style={styles.bookCardTop}>
                    <View style={styles.bookIconContainer}>
                      <FileText size={26} color="#00C27B" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <View style={styles.bookBadge}>
                          <Text style={styles.bookBadgeText}>{book.badge}</Text>
                        </View>
                        <View style={[styles.bookPriceBadge, isUnlocked ? styles.priceBadgeFree : styles.priceBadgePaid]}>
                          <Text style={[styles.priceBadgeText, isUnlocked ? styles.priceTextFree : styles.priceTextPaid]}>
                            {isUnlocked ? 'FREE ACCESS' : book.price}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookPublisher}>
                        {book.publisher} • {book.level}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.bookDesc}>{book.description}</Text>

                  {/* Book Metadata Bar */}
                  <View style={styles.bookStatsRow}>
                    <Text style={styles.bookStatText}>📖 {book.pages} pages</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.bookStatText}>⭐ {book.rating} rating</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.bookStatText}>📥 {book.downloads} students</Text>
                  </View>

                  {/* Chapter Previews */}
                  <View style={styles.tocBox}>
                    <Text style={styles.tocHeader}>Table of Contents Preview:</Text>
                    <View style={styles.tocPillRow}>
                      {book.tableOfContents.map((chap, i) => (
                        <View key={i} style={styles.tocPill}>
                          <Text style={styles.tocPillText}>{chap}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.bookActionsRow}>
                    <TouchableOpacity
                      style={styles.previewBtn}
                      onPress={() => openBookReader(book)}
                    >
                      <BookOpen size={16} color="#F0F4FF" />
                      <Text style={styles.previewBtnText}>{isUnlocked ? 'Read Book' : 'Preview'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.buyBtn, isUnlocked && styles.accessBtn]}
                      onPress={() => handleBookAction(book)}
                    >
                      {isUnlocked ? (
                        <>
                          <CheckCircle size={16} color="#fff" />
                          <Text style={styles.buyBtnText}>Open Full Book</Text>
                        </>
                      ) : (
                        <>
                          <Lock size={16} color="#fff" />
                          <Text style={styles.buyBtnText}>Unlock for {book.price}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ══════════════ TAB 3: DEDICATED AI TEACHER ══════════════ */}
        {activeTab === 'ai' && (
          <View>
            <View style={styles.aiTeacherCard}>
              <LinearGradient
                colors={['#0F2040', '#060E1E']}
                style={styles.aiTeacherCardGrad}
              >
                <View style={styles.aiProfileRow}>
                  <View style={styles.aiBigAvatar}>
                    <Text style={{ fontSize: 40 }}>🦉</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={styles.aiBadgeLine}>
                      <View style={styles.liveDot} />
                      <Text style={styles.aiLiveBadge}>Bona Intelligent Academic Tutor</Text>
                    </View>
                    <Text style={styles.aiMainName}>{curriculum.aiTeacher.name}</Text>
                    <Text style={styles.aiMainTitle}>{curriculum.aiTeacher.title}</Text>
                  </View>
                </View>

                <View style={styles.aiGreetingBox}>
                  <Text style={styles.aiGreetingText}>
                    "{curriculum.aiTeacher.greeting}"
                  </Text>
                </View>

                {/* Socratic Capabilities */}
                <View style={styles.aiCapsList}>
                  <View style={styles.aiCapItem}>
                    <CheckCircle size={16} color="#00C27B" />
                    <Text style={styles.aiCapText}>
                      Strictly NECTA-aligned answers for Primary & Secondary syllabus
                    </Text>
                  </View>
                  <View style={styles.aiCapItem}>
                    <CheckCircle size={16} color="#00C27B" />
                    <Text style={styles.aiCapText}>
                      Bilingual instruction: Explains effortlessly in English or Kiswahili
                    </Text>
                  </View>
                  <View style={styles.aiCapItem}>
                    <CheckCircle size={16} color="#00C27B" />
                    <Text style={styles.aiCapText}>
                      Socratic method: Never gives direct cheating answers, teaches how to solve!
                    </Text>
                  </View>
                </View>

                {/* Quick Prompts */}
                <Text style={styles.quickPromptHeader}>Tap a question to ask your AI Teacher:</Text>
                <View style={styles.promptsContainer}>
                  {curriculum.aiTeacher.samplePrompts.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.promptPill}
                      onPress={() => launchAITutor(prompt)}
                      activeOpacity={0.8}
                    >
                      <Sparkles size={14} color="#FFB800" style={{ marginRight: 8 }} />
                      <Text style={styles.promptPillText}>{prompt}</Text>
                      <ChevronRight size={14} color="#7A8FAD" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.startAiChatBtn}
                  onPress={() => launchAITutor()}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#00A86B', '#0077B6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startAiChatGrad}
                  >
                    <Sparkles size={18} color="#fff" />
                    <Text style={styles.startAiChatText}>Start Private Session with {curriculum.aiTeacher.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* ══════════════ TAB 4: SYLLABUS BREAKDOWN ══════════════ */}
        {activeTab === 'syllabus' && (
          <View>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionHeading}>{subject.name} Syllabus Breakdown</Text>
                <Text style={styles.sectionSubtitle}>
                  Tanzania Institute of Education official competence topics
                </Text>
              </View>
            </View>

            {curriculum.syllabus.map((syl, i) => (
              <View key={syl.id} style={styles.syllabusCard}>
                <View style={styles.syllabusIndexBadge}>
                  <Text style={styles.syllabusIndexText}>0{i + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.syllabusCode}>{syl.nectaCode}</Text>
                    <Text style={styles.syllabusLevel}>{syl.level}</Text>
                  </View>
                  <Text style={styles.syllabusTopic}>{syl.topic}</Text>
                </View>
                <TouchableOpacity
                  style={styles.sylActionBtn}
                  onPress={() => launchAITutor(`Teach me topic: ${syl.topic} (${syl.level}) according to the NECTA syllabus.`)}
                >
                  <Sparkles size={14} color="#00C27B" />
                  <Text style={styles.sylActionText}>Study</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ─── Textbook Preview Modal ─── */}
      <Modal
        visible={bookModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBookModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          {selectedBook && (
            <View style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setBookModalVisible(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle} numberOfLines={1}>Textbook Preview</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView contentContainerStyle={styles.modalContent}>
                <View style={styles.bookCoverPreview}>
                  <FileText size={48} color="#00C27B" />
                  <Text style={styles.previewBookTitle}>{selectedBook.title}</Text>
                  <Text style={styles.previewBookPublisher}>{selectedBook.publisher}</Text>
                  <View style={styles.previewPricePill}>
                    <Text style={styles.previewPriceText}>{selectedBook.isFree ? 'FREE ACCESS' : selectedBook.price}</Text>
                  </View>
                </View>

                <Text style={styles.previewSectionHeader}>Overview & Syllabus Alignment</Text>
                <Text style={styles.previewBodyText}>{selectedBook.description}</Text>

                <Text style={styles.previewSectionHeader}>Chapter Breakdown</Text>
                {selectedBook.tableOfContents.map((chap, idx) => (
                  <View key={idx} style={styles.previewChapterRow}>
                    <Text style={styles.previewChapNum}>Chapter {idx + 1}</Text>
                    <Text style={styles.previewChapTitle}>{chap}</Text>
                  </View>
                ))}

                <View style={{ marginTop: 24 }}>
                  <TouchableOpacity
                    style={[styles.buyBtn, (selectedBook.isFree || purchasedBooks[selectedBook.id]) && styles.accessBtn]}
                    onPress={() => handleBookAction(selectedBook)}
                  >
                    <Text style={styles.buyBtnText}>
                      {selectedBook.isFree || purchasedBooks[selectedBook.id] ? 'Read Full Textbook' : `Purchase Access for ${selectedBook.price}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060E1E' },
  hero: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 22 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroBadgeText: { color: '#F0F4FF', fontSize: 12, fontWeight: '700' },
  heroContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroEmojiBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 32 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 4, lineHeight: 18 },

  heroAIBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 14, 30, 0.7)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  aiAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,168,107,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiNameText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginLeft: 6, marginRight: 4 },
  onlineText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  aiSpecialtyText: { color: '#A0B0CC', fontSize: 11, marginTop: 2 },
  askAiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,168,107,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  askAiChipText: { color: '#00C27B', fontSize: 12, fontWeight: '800' },

  // Tabs
  tabBar: { backgroundColor: '#0A1628', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tabScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabItemActive: {
    backgroundColor: 'rgba(0,168,107,0.15)',
    borderColor: '#00C27B',
  },
  tabLabel: { color: '#7A8FAD', fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#00C27B', fontWeight: '800' },

  scrollContent: { padding: 18, paddingBottom: 110 },
  sectionHeadingRow: { marginBottom: 16 },
  sectionHeading: { color: '#F0F4FF', fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: '#7A8FAD', fontSize: 12, marginTop: 4, lineHeight: 17 },

  // Teacher Container
  teacherContainer: {
    backgroundColor: '#0F2040',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  teacherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  teacherAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  teacherSchool: { color: '#A0B0CC', fontSize: 12, marginTop: 2 },
  teacherMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  teacherMetaText: { color: '#7A8FAD', fontSize: 11, fontWeight: '600' },
  dotSeparator: { color: '#566478', fontSize: 12 },
  teacherExpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,168,107,0.15)',
  },
  teacherExpText: { color: '#00C27B', fontSize: 11, fontWeight: '800' },

  coursesOfferedTitle: { color: '#A0B0CC', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  courseCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  courseCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseLevelPill: {
    backgroundColor: 'rgba(0,119,182,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  courseLevelText: { color: '#38BDF8', fontSize: 11, fontWeight: '800' },
  priceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priceBadgeFree: { backgroundColor: 'rgba(16,185,129,0.18)' },
  priceBadgePaid: { backgroundColor: 'rgba(245,158,11,0.18)' },
  priceBadgeText: { fontSize: 11, fontWeight: '800' },
  priceTextFree: { color: '#10B981' },
  priceTextPaid: { color: '#F59E0B' },
  courseTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 4 },
  courseDesc: { color: '#A0B0CC', fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 10 },
  syllabusTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,168,107,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  syllabusTagText: { color: '#00C27B', fontSize: 11, fontWeight: '700' },

  sessionsWrapper: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 8 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  sessionIdxCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIdxText: { color: '#F0F4FF', fontSize: 12, fontWeight: '800' },
  sessionTitle: { color: '#F0F4FF', fontSize: 13, fontWeight: '700' },
  sessionMeta: { color: '#7A8FAD', fontSize: 11, marginTop: 2 },
  xpMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  xpMiniText: { color: '#F59E0B', fontSize: 10, fontWeight: '800' },

  // Future Teacher Card
  futureTeacherCard: {
    flexDirection: 'row',
    backgroundColor: '#0A1628',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
    marginTop: 8,
  },
  futureTeacherIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,184,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureTeacherTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  futureTeacherDesc: { color: '#A0B0CC', fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 10 },
  joinTeacherBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTeacherBtnText: { color: '#060E1E', fontSize: 12, fontWeight: '800' },

  // Book Card
  bookCard: {
    backgroundColor: '#0F2040',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bookCardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,168,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookBadgeText: { color: '#A0B0CC', fontSize: 10, fontWeight: '700' },
  bookPriceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bookTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 4 },
  bookPublisher: { color: '#7A8FAD', fontSize: 12, marginTop: 2 },
  bookDesc: { color: '#A0B0CC', fontSize: 12, lineHeight: 17, marginTop: 10, marginBottom: 10 },
  bookStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  bookStatText: { color: '#7A8FAD', fontSize: 11, fontWeight: '600' },
  tocBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  tocHeader: { color: '#7A8FAD', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  tocPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tocPill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tocPillText: { color: '#E2E8F4', fontSize: 11 },

  bookActionsRow: { flexDirection: 'row', gap: 10 },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  buyBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFB800',
    paddingVertical: 12,
    borderRadius: 12,
  },
  accessBtn: { backgroundColor: '#00A86B' },
  buyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // AI Tab
  aiTeacherCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,168,107,0.25)' },
  aiTeacherCardGrad: { padding: 20 },
  aiProfileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  aiBigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,168,107,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981', marginRight: 6 },
  aiLiveBadge: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  aiMainName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  aiMainTitle: { color: '#A0B0CC', fontSize: 13, marginTop: 2 },
  aiGreetingBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00C27B',
  },
  aiGreetingText: { color: '#E2E8F4', fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  aiCapsList: { gap: 8, marginBottom: 18 },
  aiCapItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiCapText: { color: '#F0F4FF', fontSize: 12, flex: 1, lineHeight: 17 },

  quickPromptHeader: { color: '#A0B0CC', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  promptsContainer: { gap: 8, marginBottom: 20 },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  promptPillText: { color: '#F0F4FF', fontSize: 13, fontWeight: '600', flex: 1 },
  startAiChatBtn: { borderRadius: 14, overflow: 'hidden' },
  startAiChatGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  startAiChatText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Syllabus Tab
  syllabusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2040',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  syllabusIndexBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,168,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syllabusIndexText: { color: '#00C27B', fontSize: 13, fontWeight: '800' },
  syllabusCode: { color: '#7A8FAD', fontSize: 11, fontWeight: '700' },
  syllabusLevel: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  syllabusTopic: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 3 },
  sylActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,168,107,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sylActionText: { color: '#00C27B', fontSize: 12, fontWeight: '700' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: '#0A1628' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalCloseBtn: { padding: 6 },
  modalCloseText: { color: '#00C27B', fontSize: 16, fontWeight: '700' },
  modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  modalContent: { padding: 20 },
  bookCoverPreview: {
    alignItems: 'center',
    backgroundColor: '#0F2040',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewBookTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  previewBookPublisher: { color: '#7A8FAD', fontSize: 13, marginTop: 4 },
  previewPricePill: {
    backgroundColor: 'rgba(0,168,107,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
  },
  previewPriceText: { color: '#00C27B', fontSize: 12, fontWeight: '800' },
  previewSectionHeader: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  previewBodyText: { color: '#A0B0CC', fontSize: 13, lineHeight: 20 },
  previewChapterRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  previewChapNum: { color: '#00C27B', fontSize: 12, fontWeight: '700', width: 90 },
  previewChapTitle: { color: '#F0F4FF', fontSize: 13, flex: 1 },
});

export default SubjectDetailScreen;
