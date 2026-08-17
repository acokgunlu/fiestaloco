export type TriviaCategory =
  | 'geography'
  | 'history'
  | 'science'
  | 'arts'
  | 'sports'
  | 'popculture';

export interface TriviaCategoryMeta {
  id: TriviaCategory;
  name: string;
  label?: string;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  description: string;
}

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  question: string;
  options: string[]; // 4 choices
  correctAnswer: string; // matches one of the options
  explanation: string; // interesting fun fact after answer
  difficulty?: 'easy' | 'medium' | 'hard';
  isWedgeQuestion?: boolean; // questions for a pie piece
}

export type TriviaPursuitPhase =
  | 'LOBBY'
  | 'WHEEL_SPIN'
  | 'QUESTION_ACTIVE'
  | 'ANSWER_REVEAL'
  | 'GRAND_FINALE'
  | 'GAME_OVER';

export interface TriviaPursuitPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  score: number;
  wedges: TriviaCategory[]; // collected pie wedges (max 6)
  currentAnswer?: string | null;
  answeredAt?: number | null; // timestamp for speed bonus
  isCorrect?: boolean | null;
  streak: number;
  totalCorrect: number;
  totalAnswered: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface TriviaPursuitSettings {
  wedgesToWin: number; // 3 to 6 (default: 6)
  turnTimerSec: number; // 15, 20, 30 (default: 20)
  allPlayersAnswer: boolean; // false = only active player takes wedge turn, true = everyone answers for bonus points while active player tries for wedge
  aiDynamicQuestions: boolean; // auto-generate fresh questions if pool runs low
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

export interface TriviaPursuitGameState {
  phase: TriviaPursuitPhase;
  roomCode?: string;
  isOnline?: boolean;
  roundNumber: number;
  activePlayerIndex: number;
  activePlayerId: string | null;
  selectedCategory: TriviaCategory | null;
  currentQuestion: TriviaQuestion | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  wheelRotationDegrees: number;
  isSpinning: boolean;
  winnerPlayerId: string | null;
  settings: TriviaPursuitSettings;
  usedQuestionIds: string[];
  lastRoundAnswerSummary?: {
    correctOption: string;
    explanation: string;
    playerAnswers: Record<string, { answer: string; isCorrect: boolean; earnedWedge: boolean }>;
  };
}

export const TRIVIA_CATEGORIES: Record<TriviaCategory, TriviaCategoryMeta> = {
  geography: {
    id: 'geography',
    name: 'Coğrafya',
    label: 'Coğrafya',
    icon: '🌍',
    color: '#3b82f6', // Blue
    badgeBg: 'bg-blue-500 text-white',
    borderColor: 'border-blue-500',
    description: 'Ülkeler, başkentler, dağlar, haritalar ve doğa harikaları',
  },
  history: {
    id: 'history',
    name: 'Tarih',
    label: 'Tarih',
    icon: '🏛️',
    color: '#eab308', // Yellow / Amber
    badgeBg: 'bg-amber-500 text-white',
    borderColor: 'border-amber-500',
    description: 'Antik çağlar, imparatorluklar, tarihi olaylar ve liderler',
  },
  science: {
    id: 'science',
    name: 'Bilim & Doğa',
    label: 'Bilim',
    icon: '🔬',
    color: '#22c55e', // Green
    badgeBg: 'bg-emerald-500 text-white',
    borderColor: 'border-emerald-500',
    description: 'Fizik, kimya, uzay, biyoloji, icatlar ve canlılar alemi',
  },
  arts: {
    id: 'arts',
    name: 'Sanat & Edebiyat',
    label: 'Sanat',
    icon: '🎨',
    color: '#a855f7', // Purple
    badgeBg: 'bg-purple-500 text-white',
    borderColor: 'border-purple-500',
    description: 'Klasik romanlar, yazarlar, resimler, heykeller ve tiyatro',
  },
  sports: {
    id: 'sports',
    name: 'Spor & Eğlence',
    label: 'Spor',
    icon: '⚽',
    color: '#f97316', // Orange
    badgeBg: 'bg-orange-500 text-white',
    borderColor: 'border-orange-500',
    description: 'Futbol, olimpiyatlar, efsane sporcular, rekorlar ve oyunlar',
  },
  popculture: {
    id: 'popculture',
    name: 'Popüler Kültür',
    label: 'Pop Kültür',
    icon: '🎬',
    color: '#ec4899', // Pink
    badgeBg: 'bg-pink-500 text-white',
    borderColor: 'border-pink-500',
    description: 'Sinema, kült diziler, müzik grupları, çizgi romanlar ve trendler',
  },
};

export const TRIVIA_CATEGORY_KEYS: TriviaCategory[] = [
  'geography',
  'history',
  'science',
  'arts',
  'sports',
  'popculture',
];
