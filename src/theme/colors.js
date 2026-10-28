// ============================================================
// BONA — Tanzania Student Learning Platform
// Brand Color System
// ============================================================

const PALETTE = {
  // Brand Greens (Primary)
  green600:   '#00A86B', // Bona Emerald — primary brand
  green500:   '#00C27B', // Lighter green for hover/accent
  green400:   '#34D399', // Soft green for highlights
  green900:   '#003D27', // Deep forest for dark surfaces

  // Brand Yellows (Secondary / Energy)
  gold500:    '#FFB800', // Bona Gold — achievement, XP, badges
  gold400:    '#FFD034', // Bright gold
  gold600:    '#E09800', // Deep gold for text on light

  // Brand Blues (Accent / Focus)
  teal600:    '#0077B6', // Ocean teal — classroom, live features
  teal400:    '#00B4D8', // Bright teal
  teal800:    '#023E58', // Deep teal for surfaces

  // Backgrounds (Dark Mode — default)
  navy950:    '#060E1E', // OLED deep navy
  navy900:    '#0A1628', // App background
  navy800:    '#0F2040', // Surface / card
  navy700:    '#162952', // Elevated card
  navy600:    '#1E3A6B', // Separator / border

  // Neutrals
  slate50:    '#F0F4FF',
  slate100:   '#E2E8F4',
  slate300:   '#A0B0CC',
  slate400:   '#7A8FAD',
  slate500:   '#566478',

  // Light Mode Backgrounds
  cream50:    '#FAFBF7',
  cream100:   '#F3F6EE',

  // Semantic
  white:      '#FFFFFF',
  black:      '#000000',
  success:    '#10B981',
  error:      '#EF4444',
  warning:    '#F59E0B',
  coral:      '#FF6B6B', // Energy / urgency

  // Subject Colors (each subject gets its own identity)
  mathBlue:   '#3B82F6',
  engOrange:  '#F97316',
  sciGreen:   '#10B981',
  histAmber:  '#D97706',
  geoTeal:    '#0891B2',
  kisPurple:  '#8B5CF6',
  bioLime:    '#65A30D',
  chemPink:   '#EC4899',
  phyIndigo:  '#4F46E5',
  civicRed:   '#DC2626',
};

// ─── Legacy alias kept for backward compatibility ───────────
export const COLORS = {
  primary:       PALETTE.green600,
  secondary:     PALETTE.green500,
  accent:        PALETTE.gold500,
  background:    PALETTE.navy900,
  surface:       PALETTE.navy800,
  text:          PALETTE.slate50,
  textSecondary: PALETTE.slate400,
  success:       PALETTE.success,
  error:         PALETTE.error,
  warning:       PALETTE.warning,
};

// ─── Dark Theme (Default for Bona) ─────────────────────────
export const DARK_THEME = {
  mode: 'dark',
  primary:        PALETTE.green600,
  primaryLight:   PALETTE.green500,
  primaryDark:    PALETTE.green900,
  secondary:      PALETTE.gold500,
  secondaryLight: PALETTE.gold400,
  accent:         PALETTE.teal600,
  accentLight:    PALETTE.teal400,
  coral:          PALETTE.coral,

  background:     PALETTE.navy900,
  backgroundDeep: PALETTE.navy950,
  surface:        PALETTE.navy800,
  surfaceAlt:     PALETTE.navy700,
  border:         PALETTE.navy600,

  text:           PALETTE.slate50,
  textSecondary:  PALETTE.slate400,
  textMuted:      PALETTE.slate500,

  success:        PALETTE.success,
  error:          PALETTE.error,
  warning:        PALETTE.warning,

  cardBorder:     'rgba(0, 168, 107, 0.15)',
  inputBg:        'rgba(255,255,255,0.05)',
  statusBar:      'light',

  // Subject colors (shared between themes)
  subjects: {
    mathematics: PALETTE.mathBlue,
    english:     PALETTE.engOrange,
    science:     PALETTE.sciGreen,
    history:     PALETTE.histAmber,
    geography:   PALETTE.geoTeal,
    kiswahili:   PALETTE.kisPurple,
    biology:     PALETTE.bioLime,
    chemistry:   PALETTE.chemPink,
    physics:     PALETTE.phyIndigo,
    civics:      PALETTE.civicRed,
  },
};

// ─── Light Theme ────────────────────────────────────────────
export const LIGHT_THEME = {
  mode: 'light',
  primary:        PALETTE.green600,
  primaryLight:   PALETTE.green500,
  primaryDark:    PALETTE.green900,
  secondary:      PALETTE.gold600,
  secondaryLight: PALETTE.gold500,
  accent:         PALETTE.teal600,
  accentLight:    PALETTE.teal400,
  coral:          PALETTE.coral,

  background:     PALETTE.cream50,
  backgroundDeep: PALETTE.cream100,
  surface:        PALETTE.white,
  surfaceAlt:     PALETTE.cream100,
  border:         PALETTE.slate100,

  text:           '#0A1628',
  textSecondary:  '#566478',
  textMuted:      '#7A8FAD',

  success:        '#059669',
  error:          '#DC2626',
  warning:        '#D97706',

  cardBorder:     'rgba(0, 168, 107, 0.12)',
  inputBg:        'rgba(0,0,0,0.03)',
  statusBar:      'dark',

  subjects: {
    mathematics: PALETTE.mathBlue,
    english:     PALETTE.engOrange,
    science:     PALETTE.sciGreen,
    history:     PALETTE.histAmber,
    geography:   PALETTE.geoTeal,
    kiswahili:   PALETTE.kisPurple,
    biology:     PALETTE.bioLime,
    chemistry:   PALETTE.chemPink,
    physics:     PALETTE.phyIndigo,
    civics:      PALETTE.civicRed,
  },
};

// ─── Gradient Presets ───────────────────────────────────────
export const GRADIENTS = {
  primary:    [PALETTE.green600,  PALETTE.green500],
  gold:       [PALETTE.gold500,   PALETTE.gold400],
  teal:       [PALETTE.teal600,   PALETTE.teal400],
  dark:       [PALETTE.navy900,   PALETTE.navy800],
  light:      [PALETTE.cream50,   PALETTE.cream100],
  hero:       [PALETTE.navy950,   PALETTE.navy800],
  success:    [PALETTE.green600,  PALETTE.teal600],
  warmth:     [PALETTE.gold500,   PALETTE.coral],
  background: [PALETTE.navy950,   PALETTE.navy900],
};

// ─── Spacing ────────────────────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── Subject Data ───────────────────────────────────────────
export const SUBJECTS = {
  primary: [
    { id: 'english',      name: 'English',             emoji: '🔤', color: PALETTE.engOrange, grades: ['Std 1','Std 2','Std 3','Std 4','Std 5','Std 6','Std 7'] },
    { id: 'mathematics',  name: 'Mathematics',          emoji: '➕', color: PALETTE.mathBlue,  grades: ['Std 1','Std 2','Std 3','Std 4','Std 5','Std 6','Std 7'] },
    { id: 'kiswahili',    name: 'Kiswahili',            emoji: '🗣️', color: PALETTE.kisPurple, grades: ['Std 1','Std 2','Std 3','Std 4','Std 5','Std 6','Std 7'] },
    { id: 'science',      name: 'Science & Technology', emoji: '🔬', color: PALETTE.sciGreen,  grades: ['Std 3','Std 4','Std 5','Std 6','Std 7'] },
    { id: 'social',       name: 'Social Studies',       emoji: '🌍', color: PALETTE.histAmber, grades: ['Std 1','Std 2','Std 3','Std 4','Std 5','Std 6','Std 7'] },
    { id: 'civics',       name: 'Civics & Moral',       emoji: '⚖️', color: PALETTE.civicRed,  grades: ['Std 5','Std 6','Std 7'] },
  ],
  secondary: [
    { id: 'english',      name: 'English Language',    emoji: '🔤', color: PALETTE.engOrange, grades: ['Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'] },
    { id: 'mathematics',  name: 'Mathematics',          emoji: '📐', color: PALETTE.mathBlue,  grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'kiswahili',    name: 'Kiswahili',            emoji: '🗣️', color: PALETTE.kisPurple, grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'biology',      name: 'Biology',              emoji: '🧬', color: PALETTE.bioLime,   grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'chemistry',    name: 'Chemistry',            emoji: '⚗️', color: PALETTE.chemPink,  grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'physics',      name: 'Physics',              emoji: '⚡', color: PALETTE.phyIndigo, grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'history',      name: 'History',              emoji: '📜', color: PALETTE.histAmber, grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'geography',    name: 'Geography',            emoji: '🗺️', color: PALETTE.geoTeal,   grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'civics',       name: 'Civics',               emoji: '🏛️', color: PALETTE.civicRed,  grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'commerce',     name: 'Commerce',             emoji: '💼', color: PALETTE.gold500,   grades: ['Form 1','Form 2','Form 3','Form 4'] },
    { id: 'ict',          name: 'ICT / Computer',       emoji: '💻', color: PALETTE.teal600,   grades: ['Form 1','Form 2','Form 3','Form 4'] },
  ],
};
