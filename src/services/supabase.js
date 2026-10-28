import AsyncStorage from '@react-native-async-storage/async-storage';

// In case @supabase/supabase-js is loaded, dynamic import or fallback
let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  createClient = null;
}

const SUPABASE_URL_KEY = 'BONA_SUPABASE_URL';
const SUPABASE_ANON_KEY_KEY = 'BONA_SUPABASE_ANON_KEY';

let supabaseClient = null;

// Initialize Supabase Client
export const initSupabase = async (url, anonKey) => {
  if (url && anonKey && createClient) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          storage: AsyncStorage,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
      await AsyncStorage.setItem(SUPABASE_URL_KEY, url);
      await AsyncStorage.setItem(SUPABASE_ANON_KEY_KEY, anonKey);
      return supabaseClient;
    } catch (err) {
      console.warn('Supabase init error:', err);
    }
  }
  return null;
};

// Check if Supabase is connected
export const isSupabaseConnected = () => !!supabaseClient;

// ==========================================
// TANZANIA CURRICULUM SEED DATA (NECTA STANDARDS)
// ==========================================

export const TANZANIA_SUBJECTS = [
  // Primary (Standard 1 - 7)
  {
    id: 'pri-math',
    name: 'Hisabati / Mathematics',
    swahiliName: 'Hisabati',
    level: 'primary',
    grades: ['Std 4', 'Std 5', 'Std 6', 'Std 7'],
    icon: '📐',
    color: '#6366F1',
    gradient: ['#6366F1', '#4F46E5'],
    description: 'Namba, Sehemu, Asilimia, Jiometria na Takwimu kwa shule za msingi.',
    topicsCount: 14,
    questionsCount: 180,
  },
  {
    id: 'pri-science',
    name: 'Sayansi na Teknolojia',
    swahiliName: 'Sayansi',
    level: 'primary',
    grades: ['Std 4', 'Std 5', 'Std 6', 'Std 7'],
    icon: '🔬',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    description: 'Afya ya binadamu, viumbe hai, nishati, mazingira na majaribio ya kisayansi.',
    topicsCount: 12,
    questionsCount: 150,
  },
  {
    id: 'pri-kiswahili',
    name: 'Kiswahili',
    swahiliName: 'Kiswahili',
    level: 'primary',
    grades: ['Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7'],
    icon: '📚',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    description: 'Sarufi, Ufahamu, Utungaji wa Insha, Nahau, Methali na Vitendawili.',
    topicsCount: 16,
    questionsCount: 220,
  },
  {
    id: 'pri-english',
    name: 'English Language',
    swahiliName: 'Kiingereza',
    level: 'primary',
    grades: ['Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7'],
    icon: '🗣️',
    color: '#EC4899',
    gradient: ['#EC4899', '#DB2777'],
    description: 'Grammar, Reading comprehension, Vocabulary, Composition and Phonics.',
    topicsCount: 12,
    questionsCount: 160,
  },
  {
    id: 'pri-social',
    name: 'Maarifa ya Jamii',
    swahiliName: 'Maarifa ya Jamii',
    level: 'primary',
    grades: ['Std 5', 'Std 6', 'Std 7'],
    icon: '🌍',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#0891B2'],
    description: 'Historia ya Tanzania, Jiografia ya Afrika Mashariki na Mazingira yetu.',
    topicsCount: 10,
    questionsCount: 130,
  },
  {
    id: 'pri-civic',
    name: 'Uraia na Maadili',
    swahiliName: 'Uraia na Maadili',
    level: 'primary',
    grades: ['Std 4', 'Std 5', 'Std 6', 'Std 7'],
    icon: '🤝',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
    description: 'Haki za watoto, Katiba ya nchi, Uongozi, Uzalendo na Maadili mema.',
    topicsCount: 8,
    questionsCount: 95,
  },

  // Secondary (O-Level Form 1 - 4)
  {
    id: 'sec-math',
    name: 'Basic Mathematics',
    swahiliName: 'Hesabu za Sekondari',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '📊',
    color: '#6366F1',
    gradient: ['#6366F1', '#4338CA'],
    description: 'Algebra, Trigonometry, Quadratic equations, Coordinate Geometry & NECTA prep.',
    topicsCount: 20,
    questionsCount: 320,
  },
  {
    id: 'sec-biology',
    name: 'Biology',
    swahiliName: 'Biolojia',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '🧬',
    color: '#10B981',
    gradient: ['#10B981', '#047857'],
    description: 'Cell structure, Genetics, Ecology, Human physiology, Nutrition & Reproduction.',
    topicsCount: 18,
    questionsCount: 280,
  },
  {
    id: 'sec-physics',
    name: 'Physics',
    swahiliName: 'Fizikia',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '⚡',
    color: '#F97316',
    gradient: ['#F97316', '#C2410C'],
    description: 'Forces & Motion, Energy, Electricity & Magnetism, Light & Modern Physics.',
    topicsCount: 16,
    questionsCount: 240,
  },
  {
    id: 'sec-chemistry',
    name: 'Chemistry',
    swahiliName: 'Kemia',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '🧪',
    color: '#EC4899',
    gradient: ['#EC4899', '#BE185D'],
    description: 'Atomic structure, Chemical bonding, Acids, Bases & Salts, Organic chemistry.',
    topicsCount: 17,
    questionsCount: 260,
  },
  {
    id: 'sec-geography',
    name: 'Geography',
    swahiliName: 'Jiografia',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '🌋',
    color: '#0EA5E9',
    gradient: ['#0EA5E9', '#0284C7'],
    description: 'Map reading, Climate systems, Plate tectonics, Agriculture & Settlement.',
    topicsCount: 15,
    questionsCount: 210,
  },
  {
    id: 'sec-history',
    name: 'History',
    swahiliName: 'Historia',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '🏛️',
    color: '#EAB308',
    gradient: ['#EAB308', '#A16207'],
    description: 'Evolution of Man, Pre-colonial Africa, Colonial rule & Nationalism in Tanzania.',
    topicsCount: 14,
    questionsCount: 190,
  },
  {
    id: 'sec-civics',
    name: 'Civics',
    swahiliName: 'Uraia',
    level: 'secondary',
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    icon: '⚖️',
    color: '#A855F7',
    gradient: ['#A855F7', '#7E22CE'],
    description: 'Our Constitution, Democracy, Human Rights, Gender and Economic Development.',
    topicsCount: 11,
    questionsCount: 140,
  },
];

// Interactive Practice Quizzes
export const PRACTICE_CHALLENGES = [
  {
    id: 'daily-blitz-1',
    title: 'Daily Mind Sparks ⚡',
    subtitle: '5 Fast Academic Questions',
    level: 'all',
    xpReward: 50,
    timeMinutes: 4,
    questions: [
      {
        id: 'q1',
        subject: 'Biolojia',
        question: 'Which organelle is universally known as the powerhouse of the cell?',
        questionSw: 'Ni sehemu gani ya chembehai inayojulikana kama kituo kikuu cha kuzalisha nishati?',
        options: ['Ribosome', 'Mitochondria', 'Chloroplast', 'Nucleus'],
        correctIndex: 1,
        explanation: 'Mitochondria produce ATP through cellular respiration, powering the cell! (Mitochondria huzalisha nishati ya ATP).',
      },
      {
        id: 'q2',
        subject: 'Hisabati',
        question: 'What is the value of x if 3x + 9 = 24?',
        questionSw: 'Thamani ya x ni ngapi iwapo 3x + 9 = 24?',
        options: ['3', '5', '7', '8'],
        correctIndex: 1,
        explanation: '3x = 24 - 9 => 3x = 15 => x = 5.',
      },
      {
        id: 'q3',
        subject: 'Jiografia',
        question: 'Which is the highest peak in Africa, located in Tanzania?',
        questionSw: 'Kilele cha juu zaidi barani Afrika kilichopo Tanzania kinaitwaje?',
        options: ['Mount Meru', 'Mount Kenya', 'Uhuru Peak (Kilimanjaro)', 'Rungwe Peak'],
        correctIndex: 2,
        explanation: 'Uhuru Peak on Mount Kilimanjaro reaches 5,895 meters above sea level.',
      },
      {
        id: 'q4',
        subject: 'Kiswahili',
        question: 'Kamilisha methali hii: "Mchumia juani..."',
        questionSw: 'Kamilisha methali hii: "Mchumia juani..."',
        options: ['...hula kivulini', '...hapati kitu', '...huingia gizani', '...haoni taabu'],
        correctIndex: 0,
        explanation: '"Mchumia juani hula kivulini" inasisitiza kufanya kazi kwa bidii ili upate mafanikio baadaye.',
      },
      {
        id: 'q5',
        subject: 'Physics',
        question: 'What is the SI unit of electric current?',
        questionSw: 'Kipimo rasmi cha kimataifa (SI Unit) cha mkondo wa umeme ni kipi?',
        options: ['Volt (V)', 'Ampere (A)', 'Ohm (Ω)', 'Watt (W)'],
        correctIndex: 1,
        explanation: 'Electric current is measured in Amperes (A) named after André-Marie Ampère.',
      },
    ],
  },
  {
    id: 'necta-csee-bio',
    title: 'NECTA CSEE Biology Warmup 🧬',
    subtitle: 'Form 2 & 4 Standard Revision',
    level: 'secondary',
    xpReward: 80,
    timeMinutes: 7,
    questions: [
      {
        id: 'nq1',
        subject: 'Biology',
        question: 'Photosynthesis produces which two essential outputs?',
        questionSw: 'Mchakato wa usanisinuru (photosynthesis) huzalisha nini?',
        options: ['Glucose and Oxygen', 'Carbon dioxide and Water', 'Nitrogen and Glucose', 'Oxygen and Carbon dioxide'],
        correctIndex: 0,
        explanation: '6CO2 + 6H2O + light -> C6H12O6 (glucose) + 6O2 (oxygen).',
      },
      {
        id: 'nq2',
        subject: 'Biology',
        question: 'Deficiency of Vitamin C leads to which deficiency disease?',
        questionSw: 'Upungufu wa Vitamini C mwilini husababisha ugonjwa gani?',
        options: ['Rickets', 'Beriberi', 'Scurvy (Kuharibika fizi)', 'Kwashiorkor'],
        correctIndex: 2,
        explanation: 'Scurvy causes bleeding gums and skin spots due to lack of ascorbic acid (Vitamin C).',
      },
      {
        id: 'nq3',
        subject: 'Biology',
        question: 'Which blood vessel carries oxygenated blood from the lungs to the heart?',
        questionSw: 'Mshipa gani hupeleka damu yenye oksijeni kutoka mapafuni hadi moyoni?',
        options: ['Pulmonary Artery', 'Pulmonary Vein', 'Aorta', 'Vena Cava'],
        correctIndex: 1,
        explanation: 'The pulmonary vein is unique because it carries oxygen-rich blood back to the left atrium of the heart.',
      },
    ],
  },
  {
    id: 'psle-math-challenge',
    title: 'PSLE Hisabati Sprint 📐',
    subtitle: 'Primary Standard 6 & 7 Exam Practice',
    level: 'primary',
    xpReward: 70,
    timeMinutes: 5,
    questions: [
      {
        id: 'pq1',
        subject: 'Hisabati',
        question: 'Tafuta eneo la mstatili wenye urefu wa sm 12 na upana wa sm 7:',
        questionSw: 'Tafuta eneo la mstatili wenye urefu wa sm 12 na upana wa sm 7:',
        options: ['19 sm²', '84 sm²', '38 sm²', '72 sm²'],
        correctIndex: 1,
        explanation: 'Eneo la mstatili = Urefu × Upana = 12 sm × 7 sm = 84 sm².',
      },
      {
        id: 'pq2',
        subject: 'Hisabati',
        question: 'Badili sehemu 3/5 kuwa asilimia (%):',
        questionSw: 'Badili sehemu 3/5 kuwa asilimia (%):',
        options: ['30%', '45%', '60%', '75%'],
        correctIndex: 2,
        explanation: '(3 / 5) × 100% = 60%.',
      },
    ],
  },
];

// Leaderboard Mock (Dar es Salaam / National)
export const LEADERBOARD_STUDENTS = [
  { rank: 1, name: 'Neema Mwamba', grade: 'Form 2', school: 'Feza Girls, Dar', xp: 2450, streak: 18, avatar: '👩🏾‍🎓', badge: 'Diamond Scholar' },
  { rank: 2, name: 'Baraka Juma (You)', grade: 'Form 2', school: 'Azania Secondary', xp: 2120, streak: 12, avatar: '🦉', badge: 'Math Champion' },
  { rank: 3, name: 'Amina Selemani', grade: 'Form 3', school: 'Canossa High', xp: 1980, streak: 15, avatar: '👧🏾', badge: 'Science Ace' },
  { rank: 4, name: 'Kelvin Mushi', grade: 'Std 7', school: 'Olympic Primary, Arusha', xp: 1750, streak: 9, avatar: '👦🏾', badge: 'Quiz Master' },
  { rank: 5, name: 'Salma Rashid', grade: 'Form 1', school: 'Jangwani Secondary', xp: 1620, streak: 11, avatar: '👩🏾', badge: 'Fast Thinker' },
  { rank: 6, name: 'Joshua Peter', grade: 'Std 6', school: 'Uhuru Mchanganyiko', xp: 1490, streak: 7, avatar: '🧒🏾', badge: 'Curious Mind' },
  { rank: 7, name: 'Faith Kimaro', grade: 'Form 2', school: 'St. Mary’s Mbezi', xp: 1380, streak: 6, avatar: '👧🏽', badge: 'Bookworm' },
];

// Academic Classroom Study Circles
export const ACADEMIC_CLASSROOMS = [
  {
    id: 'room-bio-photosynthesis',
    title: '🌿 Form 2 Biology: Photosynthesis & Respiration',
    subject: 'Biology',
    level: 'Secondary',
    activeLearners: 14,
    moderator: 'Bona AI Tutor 🦉 + Mwl. Mrema',
    description: 'Peer study circle solving diagram questions and leaf structure.',
    status: 'Active Study Room',
    tags: ['NECTA', 'Form 2', 'Biolojia'],
  },
  {
    id: 'room-std7-math',
    title: '📐 Std 7 Hisabati: NECTA Past Papers Sprint',
    subject: 'Mathematics',
    level: 'Primary',
    activeLearners: 22,
    moderator: 'Bona Academic Bot 🤖',
    description: 'Solving speed math, word problems, and fractions together.',
    status: 'Live Discussion',
    tags: ['PSLE', 'Std 7', 'Hisabati'],
  },
  {
    id: 'room-sec-chem',
    title: '🧪 Form 3 Chemistry: Chemical Equations & Bonding',
    subject: 'Chemistry',
    level: 'Secondary',
    activeLearners: 9,
    moderator: 'Bona AI Tutor 🦉',
    description: 'Balancing chemical reactions without memorization headaches.',
    status: 'Active Study Room',
    tags: ['Form 3', 'Kemia'],
  },
  {
    id: 'room-english-writing',
    title: '✍️ English Essay & Grammar Workshop',
    subject: 'English',
    level: 'All Grades',
    activeLearners: 17,
    moderator: 'Mwl. Grace & Bona Bot',
    description: 'Constructing essays, correct tenses, and scoring high in NECTA Paper 1.',
    status: 'Active Study Room',
    tags: ['Grammar', 'Insha & Essays'],
  },
];

// Supabase API Facade
export const BonaAPI = {
  // Get subjects list
  async getSubjects(level = null) {
    if (supabaseClient) {
      try {
        let query = supabaseClient.from('subjects').select('*');
        if (level && level !== 'all') {
          query = query.eq('level', level);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local curriculum:', e);
      }
    }
    // Fallback local data
    if (!level || level === 'all') return TANZANIA_SUBJECTS;
    return TANZANIA_SUBJECTS.filter((s) => s.level === level);
  },

  // Get practice challenges
  async getPracticeChallenges() {
    return PRACTICE_CHALLENGES;
  },

  // Get leaderboard
  async getLeaderboard() {
    return LEADERBOARD_STUDENTS;
  },

  // Get academic classrooms
  async getClassrooms() {
    return ACADEMIC_CLASSROOMS;
  },

  // Student progress
  async getStudentStats() {
    try {
      const statsJson = await AsyncStorage.getItem('bona_student_stats');
      if (statsJson) return JSON.parse(statsJson);
    } catch (e) {
      // fallback
    }
    return {
      name: 'Baraka Juma',
      grade: 'Form 2',
      school: 'Azania Secondary',
      level: 'Secondary',
      xp: 2120,
      streak: 12,
      lessonsCompleted: 14,
      quizzesPassed: 28,
      accuracyRate: '88%',
      hoursLearned: '16.5 hrs',
      badges: [
        { id: 'b1', name: 'NECTA Ready', icon: '🏆', desc: 'Completed 10 past paper drills' },
        { id: 'b2', name: 'Owl Night', icon: '🦉', desc: 'Studied with Bona AI past 8pm' },
        { id: 'b3', name: 'Streak Hero', icon: '🔥', desc: 'Studied 7 days consecutively' },
        { id: 'b4', name: 'Math Prodigy', icon: '📐', desc: 'Scored 100% on Algebra quiz' },
      ],
    };
  },

  // Save student XP
  async addXP(points) {
    const current = await this.getStudentStats();
    current.xp += points;
    await AsyncStorage.setItem('bona_student_stats', JSON.stringify(current));
    return current;
  },
};
