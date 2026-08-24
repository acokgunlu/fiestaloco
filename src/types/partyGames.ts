export type PartyGameType = 'imposter' | 'codenames' | 'bluff' | 'bomb' | 'trivia_pursuit' | 'quiplash' | 'race' | 'colory' | 'timing';

// ==========================================
// 1. YALAN USTASI (BLUFF TRIVIA / FIBBAGE)
// ==========================================

export interface BluffQuestion {
  id: string;
  category: string;
  prompt: string; // e.g. "18. yüzyılda İngiltere'de zenginler bahçelerine süs olsun diye canlı [...] kiralıyordu."
  realAnswer: string; // e.g. "Keşiş (İnzivacı)"
  defaultFakes: string[]; // Fallback fake answers
}

export type BluffPhase =
  | 'LOBBY'
  | 'QUESTION_PREVIEW'
  | 'WRITING_BLUFF'
  | 'VOTING'
  | 'ROUND_RESULT'
  | 'GAME_OVER';

export interface BluffPlayer {
  id: string;
  name: string;
  avatar: string;
  color?: string;
  colorName?: string;
  score: number;
  currentBluff?: string;
  votedAnswerId?: string;
  votedAnswerText?: string;
  roundScoreEarned?: number;
  foolsCount?: number; // how many people fell for their bluff
  truthsFound?: number; // how many real answers they found
  isReady?: boolean;
  connected?: boolean;
  isHost?: boolean;
}

export interface BluffAnswerItem {
  id: string;
  text: string;
  authorPlayerId?: string; // undefined if it's the real answer or canned fake
  authorName?: string;
  /** Ayni yalani yazan TUM oyuncular (birlestirilmis secenekler icin). */
  authorPlayerIds?: string[];
  isReal: boolean;
  chosenByPlayerIds: string[];
  chosenByNames?: string[];
}

export interface BluffGameState {
  phase: BluffPhase;
  currentRound: number;
  totalRounds: number;
  currentQuestion: BluffQuestion | null;
  answers: BluffAnswerItem[];
  timerSeconds: number;
  category: string;
  roomCode?: string;
  isOnline?: boolean;
  submittedPlayerIds?: string[];
  votedPlayerIds?: string[];
  revealIndex?: number; // for step-by-step answer reveals on TV
}

// ==========================================
// 2. SAATLİ BOMBA (BOMBA RÁPIDA / PASS THE BOMB)
// ==========================================

export interface BombPrompt {
  id: string;
  category: string;
  ruleType: 'contains' | 'starts_with' | 'category';
  prompt: string; // e.g. "İçinde 'KA' hecesi geçen bir kelime"
  exampleWords?: string[];
}

export type BombPhase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'TICKING'
  | 'EXPLODED'
  | 'GAME_OVER';

export interface BombPlayer {
  id: string;
  name: string;
  avatar: string;
  color?: string;
  colorName?: string;
  lives: number; // starts at 3
  wordsUsed: string[];
  isAlive: boolean;
  isReady?: boolean;
  connected?: boolean;
  isHost?: boolean;
}

export interface BombGameState {
  phase: BombPhase;
  currentRound: number;
  currentPrompt: BombPrompt | null;
  activePlayerIndex: number;
  activePlayerId?: string | null;
  bombTimeRemaining: number; // internal hidden countdown
  visualTimerFraction: number; // 0 to 1 for bomb size animation
  usedWords: string[];
  explodedPlayerId: string | null;
  winnerPlayerId: string | null;
  roomCode?: string;
  isOnline?: boolean;
  lastWordSubmitted?: { word: string; playerName: string; playerId: string };
}

// ==========================================
// 3. KİM YAPAR? / MAHKEME (PICANTE VERDICT)
// ==========================================





