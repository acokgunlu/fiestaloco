import { CodenamesCard } from '../data/codenamesWords';

export type CodenamesTeam = 'red' | 'blue';
export type CodenamesRole = 'spymaster' | 'operative';

export interface CodenamesClue {
  id: string;
  team: CodenamesTeam;
  word: string;
  count: number;
  timestamp: number;
}

export interface CodenamesPlayer {
  id: string;
  name: string;
  team: CodenamesTeam;
  role: CodenamesRole;
  avatar: string;
  isReady?: boolean;
  connected?: boolean;
}

export interface CodenamesSettings {
  startingTeam: 'random' | 'red' | 'blue';
  category: string;
  timerSeconds: number; // 0 for unlimited, 60, 90, 120
  aiSpymaster: boolean; // Enables AI Spymaster Clue Generator
}

export interface CodenamesGameState {
  board: CodenamesCard[];
  activeTeam: CodenamesTeam;
  startingTeam: CodenamesTeam;
  phase: 'LOBBY' | 'CLUE_PHASE' | 'GUESS_PHASE' | 'GAME_OVER';
  clues: CodenamesClue[];
  currentClue: CodenamesClue | null;
  guessesRemaining: number;
  winner: CodenamesTeam | null;
  winReason: 'all_agents_found' | 'assassin_triggered' | null;
  redRemaining: number;
  blueRemaining: number;
  timerSeconds: number;
  isTimerRunning: boolean;
  settings: CodenamesSettings;
  redScore: number;
  blueScore: number;
  assassinCardId: string | null;
}

export interface CodenamesRoomState {
  gameType: 'codenames';
  roomCode: string;
  gameState: CodenamesGameState;
  players: CodenamesPlayer[];
  myPlayer?: CodenamesPlayer;
}
