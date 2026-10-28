# 🎓 Bona — Tanzania Student Learning Platform
### Master Blueprint & Build Plan

---

## 1. Executive Summary

**Bona** is a mobile-first AI-powered educational platform built for Tanzanian students aged **7–18 years**. It replaces the Beloved app's Bible/prayer infrastructure with the **Tanzania national syllabus** (NECTA-aligned) and transforms every feature into a deeply engaging, age-appropriate online school experience.

The name **Bona** means *"see / look"* in Swahili — representing clarity, discovery, and the joy of learning.

> **Core promise:** _"Jifunze kwa furaha"_ — Learn with joy.

---

## 2. What We're Reusing From Beloved (& What We Replace)

| Beloved Feature | Bona Equivalent | Status |
|---|---|---|
| Bible Screen | **Textbook Reader** (PDF/chapter per subject) | Replace |
| Prayer Screen | **Daily Lesson / Study Session** | Replace |
| Prayer Analytics | **Study Streak & Progress Analytics** | Repurpose |
| Spaces (Live Audio) | **Live Study Rooms** (teacher-led or peer) | Keep + Enhance |
| Chat / Companion | **Bona AI Tutor** (age-aware, Swahili/English) | Replace |
| Events / Donations | **School Events & Competitions** | Repurpose |
| Profile + Social | **Student Profile + Leaderboard** | Repurpose |
| Notifications | **Lesson Reminders + Achievement Alerts** | Keep |
| Auth (Firebase) | **Student Auth + Parent/Teacher Gate** | Enhance |
| Groq AI | **AI Tutor powered by Groq (llama-3.x)** | Keep + Enhance |
| Agora (Live Audio) | **Live Classroom Audio/Video** | Keep |
| ClickPesa | **School Fee / Resource Payments (TZS)** | Keep |
| Word of the Day | **Concept of the Day / Neno la Leo** | Replace |

---

## 3. Brand Identity

| Item | Value |
|---|---|
| App Name | **Bona** |
| Tagline | "Jifunze kwa furaha" · Learn with Joy |
| Target | Tanzania students aged 7–18 |
| Languages | Swahili 🇹🇿 + English |
| Tone | Warm, encouraging, fun — like a great teacher |
| Colors | Vibrant green, golden yellow, deep teal (Tanzania national palette) |
| Typography | Rounded, friendly — Nunito / Outfit |
| Mascot (future) | "Bona Bora" — a curious owl with Tanzanian clothing |

### Color Palette
```js
// Bona Design System
const BONA_COLORS = {
  primary:    '#00A86B', // Tanzanian emerald green
  secondary:  '#FFB800', // Golden yellow (like sunflower)
  accent:     '#0077B6', // Deep ocean teal
  coral:      '#FF6B6B', // Energetic coral (for alerts/badges)
  background: '#0A1628', // Deep navy (dark mode base)
  surface:    '#132036', // Card surface
  text:       '#F0F4FF', // Near white
  textSub:    '#94A3B8', // Muted slate
  success:    '#10B981',
  warning:    '#F59E0B',
  error:      '#EF4444',
};
```

---

## 4. Age Groups & Learning Levels

| Group | Ages | Tanzania Level | Tab Experience |
|---|---|---|---|
| **Watoto** (Little Ones) | 7–10 | Standard 1–4 | Big icons, Swahili-first, gamified |
| **Wanafunzi** (Students) | 11–13 | Standard 5–7 | Balanced bilingual, quizzes |
| **Vijana** (Teens) | 14–18 | Form 1–6 | English-heavy, exam-focused |

The app asks age on signup and **adapts the UI, language, and content difficulty** accordingly.

---

## 5. Tanzania Syllabus Coverage

### Primary School (Shule ya Msingi) — Ages 7–13
- Kiswahili
- English Language
- Mathematics (Hisabati)
- Science & Technology (Sayansi na Teknolojia)
- Social Studies (Maarifa ya Jamii)
- Civics & Moral Education
- Vocational Skills

### Secondary School (Shule ya Sekondari) — Ages 14–18
- Kiswahili
- English Language
- Mathematics
- Physics (Fizikia)
- Chemistry (Kemia)
- Biology (Biolojia)
- History (Historia)
- Geography (Jiografia)
- Civics (Uraia)
- Commerce
- Book Keeping / Accounts
- Computer Science / ICT

> All content is NECTA-aligned (National Examinations Council of Tanzania)

---

## 6. App Architecture — Screen Map

### 6.1 Navigation Structure

```
RootNavigator
├── Onboarding (age + grade selection)
├── Auth (Login / SignUp / Google)
│   ├── Parent/Guardian mode
│   └── Student mode (under 13 = parent approval)
├── UsernameSetup
├── VerificationPending
├── Banned
└── Main (Tab Navigator)
    ├── 📚 Learn      → SubjectsScreen / LessonScreen
    ├── 🎯 Practice   → QuizScreen / ExercisesScreen
    ├── 🏫 Classroom  → Live Study Rooms (Spaces)
    ├── 🏆 Progress   → StreakScreen / LeaderboardScreen
    └── 👤 Profile    → StudentProfile / Badges / Settings
    
Stack Screens (from Root):
├── LessonReaderScreen      (replaces BibleScreen)
├── AITutorChatScreen       (replaces ChatScreen)
├── NotificationsScreen
├── CompetitionScreen       (replaces EventsScreen)
├── HelpScreen
├── LegalScreen
├── PaymentScreen
└── ParentDashboardScreen   (new!)
```

### 6.2 Core Screens Breakdown

#### 📚 Learn Tab — `SubjectsScreen`
Mirrors the old Bible tab but for academic content:
- Grid of subjects with subject-specific color coding
- Each subject → chapters/topics (like Bible books → chapters)
- Topic content loaded from Firestore + local cache
- Text-to-speech for young learners (reuse `SpeechService`)
- Highlight & bookmark key concepts (reuse highlight system)
- Track reading progress per topic (reuse progress tracking)
- AI "Explain This" button beside any paragraph
- **"Dhana ya Leo"** (Concept of the Day) — replaces Word of Day

#### 🎯 Practice Tab — `PracticeScreen`
Replaces PrayerScreen with study sessions:
- Daily practice challenges per subject
- AI-generated quiz questions (replaces AI prayer generation)
- Schedule study sessions (replaces prayer scheduling)
- Completion marking → awards XP/stars (replaces prayer completion)
- **Study Streak** analytics (direct port of PrayerAnalyticsScreen)
- Missed practice warnings
- NECTA past paper questions

#### 🏫 Classroom Tab — `ClassroomScreen`
Direct evolution of SpacesScreen:
- Live study rooms (teacher-led or peer-led)
- Subject-tagged rooms (e.g., "Form 3 Chemistry — Acids & Bases")
- Host = Teacher, Speakers = Active students
- Live whiteboard sync (text broadcast, like Bible reading sync)
- **Strictly academic only** — AI moderation blocks off-topic chat
- Raise hand to ask questions
- Auto-expire after 90 mins (extended from 40)
- Max room size by grade group

#### 🏆 Progress Tab — `ProgressScreen`
Replaces PrayerAnalytics with full gamification:
- XP points system
- Subject-level progress bars
- Weekly/monthly study streaks
- Badge achievements (NECTA-ready, Subject Star, 7-Day Streak, etc.)
- **Leaderboard** — school, region, national (new!)
- NECTA readiness score per subject

#### 👤 Profile Tab — `StudentProfileScreen`
Evolution of ProfileScreen:
- Student card (grade, school, avatar)
- XP level + rank display
- Subject badges earned
- Study stats (hours, topics, streak)
- Followers/following (classmates/study partners)
- **Parent view toggle** (parent sees child's progress)
- Settings, language toggle (Swahili/English)

---

## 7. AI Tutor — "Bona AI" 

This is the heart of the new app. Replaces the Beloved Companion.

### 7.1 Persona
**Name:** Bona AI (or "Mwalimu Bona" — Teacher Bona)  
**Personality:** Patient, encouraging, never condescending. Uses age-appropriate language. Explains in Swahili when asked, English when in exam prep mode.

### 7.2 Capabilities

```js
// New AIService methods for Bona:

AIService.explainConcept(topic, gradeLevel, language)
// → "Explain photosynthesis to a Standard 5 student in Swahili"

AIService.generateQuizQuestion(subject, topic, difficulty)
// → Returns question + 4 choices + correct answer + explanation

AIService.checkAnswer(question, studentAnswer, correctAnswer)
// → Gives feedback, explains why wrong/right

AIService.generateStudyPlan(weakSubjects, examDate, availableHours)
// → Returns a week-by-week plan

AIService.tutorChat(message, context)
// Context includes: grade, subject, recent topic, language preference
// STRICT: Returns "Swali hili si la masomo" if off-topic

AIService.generateConceptOfDay(grade, subjects)
// → Daily concept with explanation and example (replaces Word of Day)
```

### 7.3 Content Guardrails
The AI tutor is **strictly academic**:
- System prompt explicitly rejects non-academic conversations
- Returns a friendly redirect: _"Ninaelewa! Lakini mimi ni mwalimu tu. Una swali la masomo?"_
- No emotional support / therapy mode (this is a school, not a companion)
- No social/political discussions
- No religious content
- Reports repeated off-topic attempts to parent dashboard

---

## 8. Data Model (Firestore)

### `users/{uid}`
```
- firstName, lastName, username, email
- gradeLevel: "Form 2" | "Standard 5" | etc.
- ageGroup: "watoto" | "wanafunzi" | "vijana"
- schoolName (optional)
- languagePreference: "sw" | "en"
- parentEmail (for under-13)
- xp: number
- level: number
- streakDays: number
- pushToken
- isBanned
- createdAt

Subcollections:
- studyHistory/{sessionId}
- practiceSessions/{sessionId}  
- notifications/{notifId}
- achievements/{badgeId}
- bookmarks/{topicId}
- chat_sessions/{sessionId}    ← AI Tutor chats
```

### `subjects/{subjectId}`
```
- name: "Mathematics"
- nameSwahili: "Hisabati"
- gradeLevel: ["Standard 5", "Standard 6", "Standard 7"]
- color: "#00A86B"
- icon: "calculator"
- totalTopics: 24

Subcollections:
- topics/{topicId}
  - title, titleSwahili
  - content (rich text / markdown)
  - audioUrl (TTS pre-generated)
  - estimatedMinutes
  - difficulty: 1-5
  - NECTAWeightage: high | medium | low
```

### `channels/{channelId}`  (Study Rooms)
```
Same as Beloved channels but adds:
- subject: "Chemistry"
- gradeFilter: ["Form 3", "Form 4"]
- isTeacherLed: boolean
- moderationLevel: "strict"
- whiteboard: { currentText, updatedAt }
```

### `competitions/{compId}`
```
- title: "Hisabati Mashindano - Form 2"
- subject, gradeLevel
- startDate, endDate
- prizeDescription
- participants: []
- leaderboard: []
```

### `daily_concept/{dateId}`
```
- concept: "Photosynthesis"
- explanation (short)
- example
- subject, gradeLevel
- generatedAt
```

---

## 9. What We Build — Phase Plan

### Phase 1 — Foundation (Weeks 1-3)
> Rebrand + Core Auth + Learn Tab

- [ ] Rebrand: new colors, new splash screen ("Bona"), new app icon
- [ ] Update `package.json` → `"name": "bona"`, bundle ID `com.bona.learn`
- [ ] New onboarding (age group + grade selection + language preference)
- [ ] Auth — add `gradeLevel`, `ageGroup`, `languagePreference` fields
- [ ] `SubjectsScreen` — subject grid with Tanzania syllabus
- [ ] `LessonReaderScreen` — port of BibleScreen, adapted for textbook content
- [ ] New `ThemeContext` with Bona color palette
- [ ] `ConceptOfDayService` — port of WordOfDayService

### Phase 2 — AI Tutor + Practice (Weeks 4-6)
> The learning engine

- [ ] New `AIService` — Bona-specific prompts, academic guardrails
- [ ] `AITutorChatScreen` — replaces ChatScreen, academic-only
- [ ] `PracticeScreen` — daily challenges, AI quiz generation
- [ ] `StudyScheduleScreen` — port of ScheduledPrayersScreen
- [ ] `StudyAnalyticsScreen` — port of PrayerAnalyticsScreen
- [ ] XP + Gamification system in `UserService`

### Phase 3 — Live Classroom + Social (Weeks 7-9)
> Community learning

- [ ] `ClassroomScreen` — port of SpacesScreen + subject tagging + moderation
- [ ] `LeaderboardScreen` — new screen showing class/region rankings
- [ ] `StudentProfileScreen` — evolution of ProfileScreen
- [ ] `NotificationsScreen` — lesson reminders + achievement alerts
- [ ] Peer study partner follow/unfollow system

### Phase 4 — Competitions + Payments (Weeks 10-12)
> Engagement + Monetization

- [ ] `CompetitionScreen` — port of EventsScreen with academic competitions
- [ ] NECTA past paper content loading
- [ ] ClickPesa integration for premium content / school fees (TZS)
- [ ] Parent Dashboard screen
- [ ] Push notification system for study reminders

### Phase 5 — Polish + Launch (Weeks 13-14)
> Production ready

- [ ] Swahili translations for all UI strings
- [ ] Age-adaptive UI (Watoto mode = larger text, more animations)
- [ ] Offline mode for lesson content
- [ ] App store assets, screenshots
- [ ] Firebase security rules review
- [ ] Production build (EAS)

---

## 10. Key Technical Decisions

### 10.1 Content Delivery
- **Phase 1-2:** Content stored in Firestore (structured JSON/markdown per topic)
- **Phase 3+:** Option to serve content from Firebase Storage as PDFs / audio files
- Use existing `SpeechService` (UnrealSpeech) for TTS — rebranded as "Sikiliza" (Listen) button

### 10.2 AI Model
- Keep **Groq + llama-3.1-8b-instant** — it's fast and cheap
- Add **`llama-3.3-70b-versatile`** for complex explanation requests
- Add Swahili-specific system prompts
- Implement **conversation memory** (last 10 messages) for coherent tutoring sessions

### 10.3 Live Classrooms
- Keep **Agora** for audio/video
- Add text-based whiteboard sync through Firestore (like the Bible reading sync)
- Implement teacher token type vs student token type in the Cloud Function

### 10.4 Gamification Engine
```js
// XP Awards
const XP_REWARDS = {
  completeTopic: 10,
  perfectQuiz: 25,
  studyStreak3: 15,
  studyStreak7: 50,
  attendLiveClass: 20,
  helpPeer: 10,
  completePastPaper: 40,
};
```

### 10.5 Parental Controls (Under-13)
- Parent email required on signup for Watoto group
- Parent receives weekly progress email (Cloud Function)
- Parent can view all AI tutor conversations
- Parent can restrict certain subjects or features

---

## 11. New Cloud Functions Needed

| Function | Purpose |
|---|---|
| `generateAgoraToken` | Keep as-is from Beloved |
| `sendClassroomNotification` | Port of sendSpaceNotification |
| `generateConceptOfDay` | Scheduled daily — generates NECTA-aligned concept |
| `weeklyParentReport` | Sends parent a PDF progress report |
| `moderateAIResponse` | Secondary check that AI response is academic-only |
| `updateLeaderboard` | Recalculates XP rankings daily |
| `clickPesaWebhook` | Keep as-is |

---

## 12. Monetization Strategy

| Stream | Description | Price |
|---|---|---|
| **Free Tier** | Standard 1-4 subjects, 5 AI questions/day | Free |
| **Bona Plus** | All subjects, unlimited AI, audio lessons | TZS 5,000/month |
| **School License** | Teacher dashboard, class management, analytics | TZS 50,000/month |
| **NECTA Prep Pack** | Past papers 2015-2024 + AI analysis | TZS 10,000 one-time |
| **Competition Entry** | Optional paid competitions with prizes | TZS 1,000-3,000 |

---

## 13. What Makes Bona Different

1. **Tanzania-specific** — Not a generic edtech app. Built for NECTA, in Swahili.
2. **Age-adaptive** — The app literally changes how it looks and speaks based on the child's age.
3. **AI Tutor that stays in lane** — Strictly academic. No rabbit holes. Parents can trust it.
4. **Live study rooms** — Real-time peer learning without needing a formal school setup.
5. **Gamified but purposeful** — XP and badges tied to real academic milestones.
6. **Parent visibility** — Parents always know what their child is learning.
7. **Affordable** — Priced for Tanzania (TZS, not USD).

---

## 14. Immediate Next Steps

1. **Confirm**: Do you want to start fresh or modify the existing Beloved codebase in-place?
2. **Assets needed**: New Bona logo / splash / app icon (we can generate these)
3. **Content**: Do you have any existing Tanzania syllabus content (PDFs, notes) to seed the app?
4. **Firebase**: Should we create a new Firebase project for Bona, or reuse Beloved's?
5. **First screen to build**: Shall we start with the new onboarding + auth, or the Learn tab?

---

*Blueprint version 1.0 — Created 2026-10-20 · Bona Learning Platform*
