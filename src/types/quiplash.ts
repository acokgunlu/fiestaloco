export interface QuiplashPrompt {
  id: string;
  category: string;
  prompt: string;
  safety?: 'family' | 'spicy';
}

export interface QuiplashAnswer {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;
  votes: string[]; // playerIds of voters
  voterNames?: string[];
  pointsEarned?: number;
  isQuiplash?: boolean; // 100% of votes sweep
}

export interface QuiplashMatchup {
  id: string;
  prompt: QuiplashPrompt;
  answer1: QuiplashAnswer;
  answer2: QuiplashAnswer;
  isCompleted?: boolean;
}

export type QuiplashPhase =
  | 'LOBBY'
  | 'WRITING_PROMPTS'
  | 'MATCHUP_INTRO'
  | 'MATCHUP_VOTING'
  | 'MATCHUP_RESULT'
  | 'ROUND_SCORES'
  | 'LAST_LASH_WRITING'
  | 'LAST_LASH_VOTING'
  | 'LAST_LASH_RESULT'
  | 'GAME_OVER';

export interface QuiplashPlayer {
  id: string;
  name: string;
  avatar: string;
  color?: string;
  colorName?: string;
  score: number;
  assignedPrompts?: QuiplashPrompt[];
  submittedPrompts?: Record<string, string>; // promptId -> answerText
  currentVoteAnswerIndex?: 1 | 2;
  lastLashAnswer?: string;
  lastLashVotesGiven?: string[]; // playerIds voted for in last lash
  isReady?: boolean;
  connected?: boolean;
  isHost?: boolean;
}

export interface QuiplashSettings {
  roundCount: number; // usually 2 + Final Round
  writingTimerSec: number; // 60s
  votingTimerSec: number; // 20s
  category: string; // 'all' | 'spicy' | 'everyday' | 'absurd'
}

export interface QuiplashGameState {
  phase: QuiplashPhase;
  currentRound: number;
  totalRounds: number;
  matchups: QuiplashMatchup[];
  currentMatchupIndex: number;
  currentMatchup?: QuiplashMatchup | null;
  lastLashPrompt?: QuiplashPrompt | null;
  lastLashAnswers?: QuiplashAnswer[];
  timerSeconds: number;
  isTimerRunning: boolean;
  roomCode?: string;
  isOnline?: boolean;
  settings: QuiplashSettings;
  submittedPlayerIds?: string[];
  votedPlayerIds?: string[];
  winnerPlayerId?: string | null;
}
