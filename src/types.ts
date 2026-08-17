export interface Player {
  id: string;
  name: string;
  color: string;
  colorName: string;
  avatar: string;
  isImposter: boolean;
  isBot?: boolean;
  score: number;
  connected?: boolean;
  isReady?: boolean;
}

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  playerId: string;
  points: Point[];
  color: string;
  width: number;
  roundNumber: number;
  timestamp: number;
}

export interface WordPair {
  category: string;
  crewWord: string;
  imposterWord: string;
  hint?: string;
}

export type GamePhase =
  | 'LOBBY'
  | 'WORD_REVEAL'
  | 'DRAWING'
  | 'DISCUSSION'
  | 'VOTING'
  | 'IMPOSTER_GUESS'
  | 'RESULTS';

export type GameMode = 'different_word' | 'blind_imposter';

export interface GameSettings {
  roundsPerPlayer: number; // usually 1 or 2 strokes per player
  drawTimeLimitSec: number; // 0 for unlimited, or e.g. 20s
  discussionTimeSec: number; // e.g. 60s
  gameMode: GameMode;
  category: string;
}

export interface RoundResult {
  votedPlayerId: string | null;
  wasImposterCaught: boolean;
  imposterGuessedCorrectly?: boolean;
  imposterGuessWord?: string;
  crewWord: string;
  imposterWord: string;
  imposterId: string;
  crewWinners: string[];
  imposterWon: boolean;
  pointsAwarded: Record<string, number>;
  correctVoterIds?: string[];
  votes?: Record<string, string>;
}

export type ClientRole = 'observer' | 'player';

export interface LiveStrokeState {
  playerId: string;
  points: Point[];
  color: string;
}

export interface RoomState {
  roomCode: string;
  gamePhase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentRoundNumber: number;
  currentDrawingRound: number;
  activePlayerIndex: number;
  strokes: Stroke[];
  liveStroke: LiveStrokeState | null;
  turnTimeRemaining: number;
  discussionTimeRemaining: number;
  votedPlayerIds: string[];
  roundResult: RoundResult | null;
  category: string;
  // Personalized secret word payload for this specific player socket:
  myAssignedWord?: string;
  myIsImposter?: boolean;
  myRoleTitle?: string;
  myRoleDescription?: string;
}

