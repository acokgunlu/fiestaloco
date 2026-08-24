import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  SNAPSHOT_INTERVAL_MS,
  deleteRoomSnapshot,
  fetchLeaderboard,
  fetchMatchHistory,
  isPersistenceEnabled,
  loadRoomSnapshots,
  persistenceStatus,
  pruneStaleSnapshots,
  recordMatch,
  saveRoomSnapshots,
  type PersistedGameType,
} from './server/persistence';
import { detectFinishedMatch } from './server/matchResult';
import { getRandomWordPair, DEFAULT_PLAYER_PALETTE } from './src/data/wordPacks';
import { Player, Stroke, WordPair, GamePhase, GameSettings, RoundResult, RoomState, Point } from './src/types';
import { generateCodenamesBoard, CodenamesCard } from './src/data/codenamesWords';
import {
  HorseRaceGameState,
  HorseRacePlayer,
  HorseRaceSettings,
  HorseRaceBet,
  BET_AMOUNTS,
  TRACK_LENGTH,
} from './src/types/horseRace';
import {
  ColoryGameState,
  ColoryGuess,
  ColoryPlayer,
  ColorySettings,
  Hsl,
} from './src/types/colory';
import {
  colorDistance,
  defaultGuess,
  randomTarget,
  rankBonus,
  scoreFromDelta,
} from './src/data/coloryLogic';
import {
  MAX_RACE_MS,
  TICK_MS,
  createRaceCard,
  isValidBet,
  planRace,
  progressAt,
  settleBet,
  type RacePlan,
} from './src/data/horseRaceLogic';
import {
  getMoveOptions as getBoardMoveOptions,
  rollDie as rollBoardDie,
  samePosition as sameBoardPosition,
  spaceAt as boardSpaceAt,
  startingPosition as boardStartingPosition,
  isFinalQuestionTurn as isBoardFinalTurn,
  type BoardPosition,
} from './src/data/triviaBoard';
import {
  CodenamesGameState,
  CodenamesPlayer,
  CodenamesClue,
  CodenamesTeam,
  CodenamesRole,
  CodenamesSettings,
} from './src/types/codenames';
import {
  BombGameState,
  BombPlayer,
  BombPrompt,
  BluffGameState,
  BluffPlayer,
  BluffQuestion,
  BluffAnswerItem,
} from './src/types/partyGames';
import {
  QuiplashGameState,
  QuiplashPlayer,
  QuiplashSettings,
  QuiplashMatchup,
  QuiplashPrompt,
  QuiplashAnswer,
} from './src/types/quiplash';
import {
  TriviaPursuitGameState,
  TriviaPursuitPlayer,
  TriviaPursuitSettings,
  TriviaCategory,
  TriviaQuestion,
  TRIVIA_CATEGORY_KEYS,
} from './src/types/triviaPursuit';
import { INITIAL_TRIVIA_QUESTIONS, getNextTriviaQuestion } from './src/data/triviaPursuitQuestions';
import { BOMB_PROMPTS, getRandomBombPrompt } from './src/data/bombPrompts';
import { BLUFF_QUESTIONS, getRandomBluffQuestion } from './src/data/bluffQuestions';
import {
  QUIPLASH_PROMPTS,
  getRandomQuiplashPrompts,
  getRandomLastLashPrompt,
} from './src/data/quiplashPrompts';

dotenv.config();

interface ConnectedClient {
  ws: WebSocket;
  roomCode?: string;
  role?: 'observer' | 'player';
  playerId?: string;
  gameType?: 'imposter' | 'codenames' | 'bomb' | 'bluff' | 'trivia' | 'quiplash' | 'race' | 'colory';
}

interface ServerRoom {
  code: string;
  hostSocketId?: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: Player[];
  settings: GameSettings;
  gamePhase: GamePhase;
  currentRoundNumber: number;
  currentDrawingRound: number;
  activePlayerIndex: number;
  currentWordPair: WordPair;
  strokes: Stroke[];
  votes: Record<string, string>; // voterId -> targetId
  roundResult: RoundResult | null;
  turnTimer: NodeJS.Timeout | null;
  turnTimeRemaining: number;
  discussionTimer: NodeJS.Timeout | null;
  discussionTimeRemaining: number;
}

interface CodenamesServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: CodenamesPlayer[];
  gameState: CodenamesGameState;
}


interface BombServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: BombPlayer[];
  gameState: BombGameState;
  usedPromptIds: string[];
  bombTimer: NodeJS.Timeout | null;
  fuseRemaining: number;
  initialFuse: number;
}

interface BluffServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: BluffPlayer[];
  gameState: BluffGameState;
  usedQuestionIds: string[];
  roundTimer: NodeJS.Timeout | null;
}

interface TriviaServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: TriviaPursuitPlayer[];
  gameState: TriviaPursuitGameState;
  usedQuestionIds: string[];
  questionPool: TriviaQuestion[];
  roundTimer: NodeJS.Timeout | null;
}

interface QuiplashServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: QuiplashPlayer[];
  gameState: QuiplashGameState;
  usedPromptIds: string[];
  roundTimer: NodeJS.Timeout | null;
}

interface HorseRaceServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: HorseRacePlayer[];
  gameState: HorseRaceGameState;
  /** BETTING/COUNTDOWN geri sayimi. */
  phaseTimer: NodeJS.Timeout | null;
  /** RACING sirasindaki 10 Hz fizik dongusu. */
  raceTimer: NodeJS.Timeout | null;
  /**
   * Yarisin ONCEDEN cozulmus sonucu. gameState'e KONMAZ — icinde bitis
   * siralamasi var, istemciye gitseydi bahis anlamsiz olurdu.
   */
  racePlan: RacePlan | null;
  raceElapsedMs: number;
}

interface ColoryServerRoom {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>; // playerId -> ws
  players: ColoryPlayer[];
  gameState: ColoryGameState;
  phaseTimer: NodeJS.Timeout | null;
}

const rooms = new Map<string, ServerRoom>();
const codenamesRooms = new Map<string, CodenamesServerRoom>();
const bombRooms = new Map<string, BombServerRoom>();
const bluffRooms = new Map<string, BluffServerRoom>();
const triviaRooms = new Map<string, TriviaServerRoom>();
const quiplashRooms = new Map<string, QuiplashServerRoom>();
const raceRooms = new Map<string, HorseRaceServerRoom>();
const coloryRooms = new Map<string, ColoryServerRoom>();
const clientMap = new Map<WebSocket, ConnectedClient>();

// =============================================================================
// DEPLOYMENT CONFIG — frontend (Vercel) ve oyun sunucusu (Railway) ayri origin.
// =============================================================================

/**
 * Izin verilen frontend origin'leri. Virgulle ayrilmis liste, ornek:
 *   ALLOWED_ORIGINS="https://fiestaloco.vercel.app,https://fiestaloco.com"
 * Bos birakilirsa tum origin'lere izin verilir (kolay ilk kurulum icin).
 * Vercel preview deploy'lari icin "*.vercel.app" gibi joker desteklenir.
 */
const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin: string | undefined): boolean {
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (!origin) return false;

  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }

  // localhost her zaman serbest (yerel gelistirme)
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return true;

  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === '*') return true;
    const allowedHost = allowed.replace(/^https?:\/\//, '');
    if (allowedHost.startsWith('*.')) {
      const suffix = allowedHost.slice(1); // ".vercel.app"
      return host === allowedHost.slice(2) || host.endsWith(suffix);
    }
    return host === allowedHost;
  });
}

// =============================================================================
// KALICILIK — leaderboard yazimi + oda snapshot dongusu
// =============================================================================

type AnyServerRoom = {
  code: string;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>;
  players: any[];
  gameState?: any;
  gamePhase?: string;
};

/** gameType -> oda haritasi. Snapshot ve mac kaydi bu kayit uzerinden jenerik calisir. */
const ROOM_REGISTRY: Array<{ gameType: PersistedGameType; map: Map<string, any> }> = [
  { gameType: 'imposter', map: rooms },
  { gameType: 'codenames', map: codenamesRooms },
  { gameType: 'bomb', map: bombRooms },
  { gameType: 'bluff', map: bluffRooms },
  { gameType: 'trivia', map: triviaRooms },
  { gameType: 'quiplash', map: quiplashRooms },
  { gameType: 'race', map: raceRooms },
  { gameType: 'colory', map: coloryRooms },
];

/** Ayni mac sonucunun tekrar tekrar yazilmasini engeller. */
const recordedMatchKeys = new Set<string>();

/**
 * Oda bitmis bir oyun iceriyorsa mac sonucunu kalici olarak yazar.
 * Her broadcast*RoomState() fonksiyonunun sonunda cagrilir; oyunu bloklamaz.
 */
function maybeRecordMatch(gameType: PersistedGameType, room: AnyServerRoom): void {
  if (!isPersistenceEnabled()) return;

  let detected: ReturnType<typeof detectFinishedMatch>;
  try {
    detected = detectFinishedMatch(gameType, room as any);
  } catch (error) {
    console.error('[persistence] detectFinishedMatch hatasi:', error);
    return;
  }
  if (!detected || recordedMatchKeys.has(detected.dedupeKey)) return;

  recordedMatchKeys.add(detected.dedupeKey);
  // Bellek sizintisi olmamasi icin sinirli tut
  if (recordedMatchKeys.size > 5000) {
    const iterator = recordedMatchKeys.values();
    for (let i = 0; i < 1000; i += 1) {
      const next = iterator.next();
      if (next.done) break;
      recordedMatchKeys.delete(next.value);
    }
  }

  void recordMatch(detected.record);
}

function roomPhaseOf(room: AnyServerRoom): string | null {
  return (room.gameState?.phase as string | undefined) ?? room.gamePhase ?? null;
}

/** Tum aktif odalarin state'ini Supabase'e yazar. */
async function snapshotAllRooms(): Promise<void> {
  if (!isPersistenceEnabled()) return;

  const entries: Array<{ gameType: PersistedGameType; roomCode: string; room: unknown; meta: { phase: string | null; playerCount: number } }> = [];

  for (const { gameType, map } of ROOM_REGISTRY) {
    for (const [code, room] of map) {
      // Bos ve LOBBY'de bekleyen odalari yazmaya gerek yok
      const playerCount = Array.isArray(room.players) ? room.players.length : 0;
      if (playerCount === 0 && room.observers.size === 0) continue;
      entries.push({
        gameType,
        roomCode: code,
        room,
        meta: { phase: roomPhaseOf(room), playerCount },
      });
    }
  }

  if (entries.length === 0) return;
  await saveRoomSnapshots(entries);
}

/**
 * Acilista Supabase'deki taze snapshot'lari bellege geri yukler.
 * Socket referanslari ve timer'lar bos baslar; TV ve telefonlar otomatik
 * reconnect edip ayni oda koduna geri girdiginde oyun kaldigi yerden devam eder.
 * Devam eden geri sayimlar sunucu tarafinda yeniden baslatilmaz (host aksiyonuyla devam eder).
 */
async function restoreRoomsFromSnapshots(): Promise<void> {
  if (!isPersistenceEnabled()) return;

  const snapshots = await loadRoomSnapshots();
  if (snapshots.length === 0) {
    console.log('[persistence] Geri yuklenecek oda snapshot\'i yok.');
    return;
  }

  let restored = 0;
  for (const snap of snapshots) {
    const target = ROOM_REGISTRY.find((r) => r.gameType === snap.gameType);
    if (!target || target.map.has(snap.roomCode)) continue;

    try {
      const state = snap.state as Record<string, any>;
      const room: Record<string, any> = {
        ...state,
        code: snap.roomCode,
        observers: new Set<WebSocket>(),
        playerSockets: new Map<string, WebSocket>(),
        players: Array.isArray(state.players)
          ? state.players.map((p: any) => ({ ...p, connected: false }))
          : [],
      };

      // Timer alanlarini temizle ve calisan geri sayimlari durdur
      for (const key of Object.keys(room)) {
        if (/(timer|interval|timeout|handle)$/i.test(key)) room[key] = null;
      }
      if (room.gameState && typeof room.gameState === 'object') {
        room.gameState = { ...room.gameState, isTimerRunning: false };
      }

      target.map.set(snap.roomCode, room);
      restored += 1;
    } catch (error) {
      console.error(`[persistence] Snapshot geri yuklenemedi (${snap.gameType}/${snap.roomCode}):`, error);
    }
  }

  console.log(`[persistence] ${restored}/${snapshots.length} oda snapshot'tan geri yuklendi.`);
}

/** Oda silindiginde snapshot'ini da temizle. */
function forgetRoom(gameType: PersistedGameType, roomCode: string): void {
  if (!isPersistenceEnabled()) return;
  void deleteRoomSnapshot(gameType, roomCode);
}

function createFreshQuiplashGame(settings?: Partial<QuiplashSettings>): QuiplashGameState {
  const fullSettings: QuiplashSettings = {
    roundCount: settings?.roundCount || 2,
    writingTimerSec: settings?.writingTimerSec || 60,
    votingTimerSec: settings?.votingTimerSec || 20,
    category: settings?.category || 'all',
  };

  return {
    phase: 'LOBBY',
    currentRound: 1,
    totalRounds: fullSettings.roundCount,
    matchups: [],
    currentMatchupIndex: 0,
    currentMatchup: null,
    lastLashPrompt: null,
    lastLashAnswers: [],
    timerSeconds: fullSettings.writingTimerSec,
    isTimerRunning: false,
    settings: fullSettings,
    submittedPlayerIds: [],
    votedPlayerIds: [],
    winnerPlayerId: null,
    isOnline: true,
  };
}

function clearQuiplashTimers(room: QuiplashServerRoom) {
  if (room.roundTimer) {
    clearInterval(room.roundTimer);
    room.roundTimer = null;
  }
}

function broadcastQuiplashRoomState(
  room: QuiplashServerRoom,
  eventType: string = 'quiplash:state',
  extraData?: any
) {
  maybeRecordMatch('quiplash', room as any);
  const isReveal =
    room.gameState.phase === 'MATCHUP_RESULT' ||
    room.gameState.phase === 'ROUND_SCORES' ||
    room.gameState.phase === 'LAST_LASH_RESULT' ||
    room.gameState.phase === 'GAME_OVER';

  const sanitizedMatchup: QuiplashMatchup | null = room.gameState.currentMatchup
    ? {
        ...room.gameState.currentMatchup,
        answer1: {
          ...room.gameState.currentMatchup.answer1,
          playerName: isReveal ? room.gameState.currentMatchup.answer1.playerName : 'Cevap 1',
          playerAvatar: isReveal ? room.gameState.currentMatchup.answer1.playerAvatar : '💬',
          votes: isReveal ? room.gameState.currentMatchup.answer1.votes : [],
        },
        answer2: {
          ...room.gameState.currentMatchup.answer2,
          playerName: isReveal ? room.gameState.currentMatchup.answer2.playerName : 'Cevap 2',
          playerAvatar: isReveal ? room.gameState.currentMatchup.answer2.playerAvatar : '🔥',
          votes: isReveal ? room.gameState.currentMatchup.answer2.votes : [],
        },
      }
    : null;

  const tvPayload = JSON.stringify({
    type: eventType,
    gameState: {
      ...room.gameState,
      roomCode: room.code,
      currentMatchup: isReveal ? room.gameState.currentMatchup : sanitizedMatchup,
    },
    players: room.players.map((p) => ({
      ...p,
      submittedPrompts: isReveal ? p.submittedPrompts : undefined,
    })),
    ...extraData,
  });

  room.observers.forEach((obs) => {
    if (obs.readyState === WebSocket.OPEN) {
      try {
        obs.send(tvPayload);
      } catch {}
    }
  });

  room.players.forEach((p) => {
    const ws = room.playerSockets.get(p.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            type: eventType,
            gameState: {
              ...room.gameState,
              roomCode: room.code,
              currentMatchup: isReveal ? room.gameState.currentMatchup : sanitizedMatchup,
            },
            players: room.players.map((pl) => ({
              ...pl,
              submittedPrompts: isReveal ? pl.submittedPrompts : undefined,
            })),
            player: p,
            ...extraData,
          })
        );
      } catch {}
    }
  });
}

function startQuiplashWritingRound(room: QuiplashServerRoom) {
  clearQuiplashTimers(room);

  const numPlayers = room.players.length;
  if (numPlayers === 0) return;

  // Reset round data on players
  room.players.forEach((p) => {
    p.assignedPrompts = [];
    p.submittedPrompts = {};
    p.currentVoteAnswerIndex = undefined;
  });

  // Pick prompts
  // Each prompt is given to 2 players
  // For P players, we need P prompts
  const promptCount = Math.max(numPlayers, 2);
  let prompts = getRandomQuiplashPrompts(promptCount, room.gameState.settings.category);
  prompts = prompts.filter((pr) => !room.usedPromptIds.includes(pr.id));
  if (prompts.length < promptCount) {
    prompts = getRandomQuiplashPrompts(promptCount, room.gameState.settings.category);
  }
  prompts.forEach((pr) => room.usedPromptIds.push(pr.id));

  // Build matchups
  const matchups: QuiplashMatchup[] = [];

  if (numPlayers === 2) {
    const p1 = room.players[0];
    const p2 = room.players[1];

    prompts.slice(0, 2).forEach((prompt, idx) => {
      p1.assignedPrompts?.push(prompt);
      p2.assignedPrompts?.push(prompt);

      matchups.push({
        id: `matchup-${Date.now()}-${idx}`,
        prompt,
        answer1: {
          playerId: p1.id,
          playerName: p1.name,
          playerAvatar: p1.avatar,
          text: '',
          votes: [],
        },
        answer2: {
          playerId: p2.id,
          playerName: p2.name,
          playerAvatar: p2.avatar,
          text: '',
          votes: [],
        },
      });
    });
  } else {
    // 3+ players: circular pairing
    for (let i = 0; i < numPlayers; i++) {
      const p1 = room.players[i];
      const p2 = room.players[(i + 1) % numPlayers];
      const prompt = prompts[i % prompts.length];

      p1.assignedPrompts?.push(prompt);
      p2.assignedPrompts?.push(prompt);

      matchups.push({
        id: `matchup-${Date.now()}-${i}`,
        prompt,
        answer1: {
          playerId: p1.id,
          playerName: p1.name,
          playerAvatar: p1.avatar,
          text: '',
          votes: [],
        },
        answer2: {
          playerId: p2.id,
          playerName: p2.name,
          playerAvatar: p2.avatar,
          text: '',
          votes: [],
        },
      });
    }
  }

  room.gameState.phase = 'WRITING_PROMPTS';
  room.gameState.matchups = matchups;
  room.gameState.currentMatchupIndex = 0;
  room.gameState.currentMatchup = null;
  room.gameState.submittedPlayerIds = [];
  room.gameState.votedPlayerIds = [];
  room.gameState.timerSeconds = room.gameState.settings.writingTimerSec;
  room.gameState.isTimerRunning = true;

  // Send assigned prompts to each player socket
  room.players.forEach((p) => {
    const ws = room.playerSockets.get(p.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            type: 'quiplash:assigned_prompts',
            prompts: p.assignedPrompts || [],
          })
        );
      } catch {}
    }
  });

  broadcastQuiplashRoomState(room);

  // Start countdown timer for writing
  room.roundTimer = setInterval(() => {
    room.gameState.timerSeconds -= 1;
    if (room.gameState.timerSeconds <= 0) {
      clearQuiplashTimers(room);
      fillMissingQuiplashAnswersAndProceed(room);
    } else {
      broadcastQuiplashRoomState(room);
    }
  }, 1000);
}

function fillMissingQuiplashAnswersAndProceed(room: QuiplashServerRoom) {
  clearQuiplashTimers(room);

  const fallbackQuotes = [
    'Söyleyecek söz bulamadım!',
    'Mizahım tıkandı!',
    'Cevabım yok ama havam yerinde!',
    'En azından denedim...',
    'Bu soru beni aştı!',
  ];

  room.gameState.matchups.forEach((m) => {
    if (!m.answer1.text.trim()) {
      const p = room.players.find((pl) => pl.id === m.answer1.playerId);
      m.answer1.text = p?.submittedPrompts?.[m.prompt.id] || fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    }
    if (!m.answer2.text.trim()) {
      const p = room.players.find((pl) => pl.id === m.answer2.playerId);
      m.answer2.text = p?.submittedPrompts?.[m.prompt.id] || fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    }
  });

  startQuiplashMatchupVoting(room, 0);
}

function startQuiplashMatchupVoting(room: QuiplashServerRoom, matchupIndex: number) {
  clearQuiplashTimers(room);

  if (matchupIndex >= room.gameState.matchups.length) {
    // All matchups done for this round!
    room.gameState.phase = 'ROUND_SCORES';
    room.gameState.isTimerRunning = false;
    broadcastQuiplashRoomState(room);
    return;
  }

  const currentM = room.gameState.matchups[matchupIndex];
  room.gameState.currentMatchupIndex = matchupIndex;
  room.gameState.currentMatchup = currentM;
  room.gameState.phase = 'MATCHUP_VOTING';
  room.gameState.votedPlayerIds = [];
  room.gameState.timerSeconds = room.gameState.settings.votingTimerSec;
  room.gameState.isTimerRunning = true;

  // Reset player current votes
  room.players.forEach((p) => {
    p.currentVoteAnswerIndex = undefined;
  });

  broadcastQuiplashRoomState(room);

  room.roundTimer = setInterval(() => {
    room.gameState.timerSeconds -= 1;
    if (room.gameState.timerSeconds <= 0) {
      clearQuiplashTimers(room);
      resolveCurrentMatchup(room);
    } else {
      broadcastQuiplashRoomState(room);
    }
  }, 1000);
}

function resolveCurrentMatchup(room: QuiplashServerRoom) {
  clearQuiplashTimers(room);

  const m = room.gameState.currentMatchup;
  if (!m) return;

  const totalVotes = m.answer1.votes.length + m.answer2.votes.length;
  const roundMultiplier = room.gameState.currentRound === 2 ? 2 : 1;

  const ptsPerVote = 150 * roundMultiplier;
  const sweepBonus = 400 * roundMultiplier;

  let pts1 = m.answer1.votes.length * ptsPerVote;
  let pts2 = m.answer2.votes.length * ptsPerVote;

  // Quiplash bonus (100% sweep with at least 1 vote)
  if (totalVotes >= 1 && m.answer1.votes.length === totalVotes) {
    pts1 += sweepBonus;
    m.answer1.isQuiplash = true;
  } else if (totalVotes >= 1 && m.answer2.votes.length === totalVotes) {
    pts2 += sweepBonus;
    m.answer2.isQuiplash = true;
  }

  m.answer1.pointsEarned = pts1;
  m.answer2.pointsEarned = pts2;
  m.isCompleted = true;

  // Add voter names for reveal
  m.answer1.voterNames = m.answer1.votes
    .map((vid) => room.players.find((pl) => pl.id === vid)?.name || 'Oyuncu')
    .filter(Boolean);
  m.answer2.voterNames = m.answer2.votes
    .map((vid) => room.players.find((pl) => pl.id === vid)?.name || 'Oyuncu')
    .filter(Boolean);

  // Award to player records
  const p1 = room.players.find((pl) => pl.id === m.answer1.playerId);
  if (p1) p1.score += pts1;

  const p2 = room.players.find((pl) => pl.id === m.answer2.playerId);
  if (p2) p2.score += pts2;

  room.gameState.phase = 'MATCHUP_RESULT';
  room.gameState.isTimerRunning = false;

  broadcastQuiplashRoomState(room);
}

function startLastLashWriting(room: QuiplashServerRoom) {
  clearQuiplashTimers(room);

  const finalPrompt = getRandomLastLashPrompt();
  room.gameState.lastLashPrompt = finalPrompt;
  room.gameState.lastLashAnswers = [];
  room.gameState.phase = 'LAST_LASH_WRITING';
  room.gameState.submittedPlayerIds = [];
  room.gameState.votedPlayerIds = [];
  room.gameState.timerSeconds = 45;
  room.gameState.isTimerRunning = true;

  room.players.forEach((p) => {
    p.lastLashAnswer = '';
    p.lastLashVotesGiven = [];
  });

  broadcastQuiplashRoomState(room);

  room.roundTimer = setInterval(() => {
    room.gameState.timerSeconds -= 1;
    if (room.gameState.timerSeconds <= 0) {
      clearQuiplashTimers(room);
      fillMissingLastLashAndProceedToVote(room);
    } else {
      broadcastQuiplashRoomState(room);
    }
  }, 1000);
}

function fillMissingLastLashAndProceedToVote(room: QuiplashServerRoom) {
  clearQuiplashTimers(room);

  const fallback = 'Şampiyonluk benim hakkım!';
  room.players.forEach((p) => {
    if (!p.lastLashAnswer?.trim()) {
      p.lastLashAnswer = fallback;
    }
  });

  const answers: QuiplashAnswer[] = room.players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    playerAvatar: p.avatar,
    text: p.lastLashAnswer || fallback,
    votes: [],
  }));

  // Shuffle answers for voting screen anonymity
  room.gameState.lastLashAnswers = answers.sort(() => Math.random() - 0.5);
  room.gameState.phase = 'LAST_LASH_VOTING';
  room.gameState.votedPlayerIds = [];
  room.gameState.timerSeconds = 30;
  room.gameState.isTimerRunning = true;

  broadcastQuiplashRoomState(room);

  room.roundTimer = setInterval(() => {
    room.gameState.timerSeconds -= 1;
    if (room.gameState.timerSeconds <= 0) {
      clearQuiplashTimers(room);
      resolveLastLash(room);
    } else {
      broadcastQuiplashRoomState(room);
    }
  }, 1000);
}

function resolveLastLash(room: QuiplashServerRoom) {
  clearQuiplashTimers(room);

  // Each vote received in last lash earns 300 pts (Triple points)
  (room.gameState.lastLashAnswers || []).forEach((ans) => {
    const pts = ans.votes.length * 300;
    ans.pointsEarned = pts;
    const p = room.players.find((pl) => pl.id === ans.playerId);
    if (p) p.score += pts;
  });

  // Determine winner
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  room.gameState.winnerPlayerId = sorted[0]?.id || null;
  room.gameState.phase = 'GAME_OVER';
  room.gameState.isTimerRunning = false;

  broadcastQuiplashRoomState(room);
}

function createFreshTriviaGame(settings?: Partial<TriviaPursuitSettings>): TriviaPursuitGameState {
  const fullSettings: TriviaPursuitSettings = {
    wedgesToWin: settings?.wedgesToWin || 6,
    turnTimerSec: settings?.turnTimerSec || 20,
    allPlayersAnswer: settings?.allPlayersAnswer ?? true,
    aiDynamicQuestions: settings?.aiDynamicQuestions ?? true,
    difficulty: settings?.difficulty || 'all',
  };

  return {
    phase: 'LOBBY',
    roundNumber: 1,
    activePlayerIndex: 0,
    activePlayerId: null,
    selectedCategory: null,
    currentQuestion: null,
    timerSeconds: fullSettings.turnTimerSec,
    isTimerRunning: false,
    wheelRotationDegrees: 0,
    isSpinning: false,
    winnerPlayerId: null,
    settings: fullSettings,
    usedQuestionIds: [],
    isOnline: true,
    boardPositions: {},
    dieRoll: null,
    moveOptions: [],
    landedOnHq: false,
    landedOnHub: false,
  };
}

function clearTriviaTimers(room: TriviaServerRoom) {
  if (room.roundTimer) {
    clearInterval(room.roundTimer);
    room.roundTimer = null;
  }
}

/** Tahtada inilen kareye gore soru asamasini baslatir. */
function startTriviaQuestion(room: TriviaServerRoom, category: TriviaCategory): boolean {
  const q = getNextTriviaQuestion(category, room.usedQuestionIds, room.questionPool);
  if (!q) return false;
  room.usedQuestionIds.push(q.id);
  room.gameState.selectedCategory = category;
  room.gameState.currentQuestion = q;
  room.gameState.phase = 'QUESTION_ACTIVE';
  room.players.forEach((p) => {
    p.currentAnswer = undefined;
    p.isCorrect = undefined;
  });
  broadcastTriviaRoomState(room, 'trivia:question_active');
  startTriviaTurnTimer(room);
  return true;
}

function broadcastTriviaRoomState(
  room: TriviaServerRoom,
  eventType: string = 'trivia:state',
  extraData?: any
) {
  maybeRecordMatch('trivia', room as any);
  const isRevealPhase =
    room.gameState.phase === 'ANSWER_REVEAL' ||
    room.gameState.phase === 'GRAND_FINALE' ||
    room.gameState.phase === 'GAME_OVER';

  const sanitizedQuestion: TriviaQuestion | null = room.gameState.currentQuestion
    ? {
        ...room.gameState.currentQuestion,
        correctAnswer: isRevealPhase ? room.gameState.currentQuestion.correctAnswer : '',
        explanation: isRevealPhase ? room.gameState.currentQuestion.explanation : '',
      }
    : null;

  const tvPayload = JSON.stringify({
    type: eventType,
    gameState: {
      ...room.gameState,
      roomCode: room.code,
      currentQuestion: sanitizedQuestion,
    },
    players: room.players.map((p) => ({
      ...p,
      currentAnswer: isRevealPhase ? p.currentAnswer : undefined,
    })),
    ...extraData,
  });

  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(tvPayload);
    }
  });

  room.players.forEach((player) => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: eventType,
          gameState: {
            ...room.gameState,
            roomCode: room.code,
            currentQuestion: sanitizedQuestion,
          },
          players: room.players.map((p) => ({
            ...p,
            currentAnswer: isRevealPhase || p.id === player.id ? p.currentAnswer : undefined,
          })),
          myPlayer: player,
          myAnswer: player.currentAnswer,
          ...extraData,
        })
      );
    }
  });
}

function resolveTriviaQuestionRound(room: TriviaServerRoom) {
  clearTriviaTimers(room);

  const q = room.gameState.currentQuestion;
  if (!q) return;

  const activePlayer = room.players[room.gameState.activePlayerIndex];
  const correctOpt = q.correctAnswer;
  const category = q.category;

  const playerAnswersSummary: Record<string, { answer: string; isCorrect: boolean; earnedWedge: boolean }> = {};
  let someoneWon = false;
  let winnerId: string | null = null;

  room.players.forEach((p) => {
    const playerAns = p.currentAnswer || '';
    const isCorrect = playerAns === correctOpt;
    p.isCorrect = isCorrect;
    p.totalAnswered = (p.totalAnswered || 0) + 1;

    let earnedWedge = false;
    if (isCorrect) {
      p.score += 100;
      p.totalCorrect = (p.totalCorrect || 0) + 1;
      p.streak = (p.streak || 0) + 1;

      // Dilim YALNIZCA kale karesinde kazanilir (klasik Trivial Pursuit).
      // Normal kategori karesinde dogru cevap sadece puan + tekrar zar hakki verir.
      if (activePlayer && p.id === activePlayer.id && room.gameState.landedOnHq) {
        if (!p.wedges.includes(category)) {
          p.wedges.push(category);
          earnedWedge = true;
        }
      }

      // Kazanma sarti: tum dilimler toplanmis VE merkeze varilmisken dogru cevap.
      if (
        activePlayer &&
        p.id === activePlayer.id &&
        room.gameState.landedOnHub &&
        p.wedges.length >= room.gameState.settings.wedgesToWin
      ) {
        someoneWon = true;
        winnerId = p.id;
      }
    } else {
      p.streak = 0;
    }

    playerAnswersSummary[p.id] = {
      answer: playerAns,
      isCorrect,
      earnedWedge,
    };
  });

  room.gameState.phase = someoneWon ? 'GAME_OVER' : 'ANSWER_REVEAL';
  room.gameState.isTimerRunning = false;
  if (someoneWon) {
    room.gameState.winnerPlayerId = winnerId;
  }

  room.gameState.lastRoundAnswerSummary = {
    correctOption: correctOpt,
    explanation: q.explanation,
    playerAnswers: playerAnswersSummary,
  };

  broadcastTriviaRoomState(room);
}

function startTriviaTurnTimer(room: TriviaServerRoom) {
  clearTriviaTimers(room);
  room.gameState.timerSeconds = room.gameState.settings.turnTimerSec;
  room.gameState.isTimerRunning = true;

  room.roundTimer = setInterval(() => {
    room.gameState.timerSeconds -= 1;
    if (room.gameState.timerSeconds <= 0) {
      clearTriviaTimers(room);
      resolveTriviaQuestionRound(room);
    } else {
      broadcastTriviaRoomState(room);
    }
  }, 1000);
}

function createFreshBluffGame(totalRounds: number = 3): BluffGameState {
  return {
    phase: 'LOBBY',
    currentRound: 1,
    totalRounds,
    currentQuestion: null,
    answers: [],
    timerSeconds: 45,
    category: 'Genel',
    submittedPlayerIds: [],
    votedPlayerIds: [],
    isOnline: true,
  };
}

function clearBluffTimers(room: BluffServerRoom) {
  if (room.roundTimer) {
    clearInterval(room.roundTimer);
    room.roundTimer = null;
  }
}

function broadcastBluffRoomState(
  room: BluffServerRoom,
  eventType: string = 'bluff:state',
  extraData?: any
) {
  maybeRecordMatch('bluff', room as any);
  const isRevealPhase =
    room.gameState.phase === 'ROUND_RESULT' || room.gameState.phase === 'GAME_OVER';

  const sanitizedAnswersForVoting = room.gameState.answers.map((a) => ({
    id: a.id,
    text: a.text,
    isReal: false,
    authorPlayerId: undefined,
    authorName: undefined,
    chosenByPlayerIds: [],
    chosenByNames: [],
  }));

  const publicAnswers = isRevealPhase ? room.gameState.answers : sanitizedAnswersForVoting;

  const tvPayload = JSON.stringify({
    type: eventType,
    gameState: {
      ...room.gameState,
      roomCode: room.code,
      answers: publicAnswers,
    },
    players: room.players.map((p) => ({
      ...p,
      currentBluff: isRevealPhase ? p.currentBluff : undefined,
      votedAnswerId: isRevealPhase ? p.votedAnswerId : undefined,
      votedAnswerText: isRevealPhase ? p.votedAnswerText : undefined,
    })),
    ...extraData,
  });

  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(tvPayload);
    }
  });

  room.players.forEach((player) => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: eventType,
          gameState: {
            ...room.gameState,
            roomCode: room.code,
            answers: publicAnswers,
          },
          players: room.players.map((p) => ({
            ...p,
            currentBluff: isRevealPhase || p.id === player.id ? p.currentBluff : undefined,
            votedAnswerId: isRevealPhase || p.id === player.id ? p.votedAnswerId : undefined,
            votedAnswerText: isRevealPhase || p.id === player.id ? p.votedAnswerText : undefined,
          })),
          myPlayer: player,
          mySubmittedBluff: player.currentBluff,
          myVotedAnswerId: player.votedAnswerId,
          ...extraData,
        })
      );
    }
  });
}

function compileAndStartBluffVoting(room: BluffServerRoom) {
  clearBluffTimers(room);

  const q = room.gameState.currentQuestion;
  if (!q) return;

  const rawAnswers: BluffAnswerItem[] = [];

  // 1. Real answer
  rawAnswers.push({
    id: `real_${room.gameState.currentRound}`,
    text: normalizeBluffDisplay(q.realAnswer),
    isReal: true,
    chosenByPlayerIds: [],
    chosenByNames: [],
  });

  // 2. Player bluffs — AYNI yalani yazanlar tek secenekte birlesir.
  // Onceden iki ozdes satir gorunuyordu; bu hem dogruyu ele veren bir isaret
  // hem de puanlamada haksizlikti (oylar bolunuyordu).
  const bluffByKey = new Map<string, BluffAnswerItem>();
  room.players.forEach((p) => {
    if (!p.currentBluff || !p.currentBluff.trim()) return;
    const text = normalizeBluffDisplay(p.currentBluff);
    const key = bluffCompareKey(text);
    const existing = bluffByKey.get(key);
    if (existing) {
      existing.authorPlayerIds!.push(p.id);
      existing.authorName = `${existing.authorName} & ${p.name}`;
      return;
    }
    const item: BluffAnswerItem = {
      id: `bluff_${p.id}`,
      text,
      authorPlayerId: p.id,
      authorPlayerIds: [p.id],
      authorName: p.name,
      isReal: false,
      chosenByPlayerIds: [],
      chosenByNames: [],
    };
    bluffByKey.set(key, item);
    rawAnswers.push(item);
  });

  // 3. Fallback default fakes if needed
  if (rawAnswers.length < 4 && q.defaultFakes && q.defaultFakes.length > 0) {
    const needed = 4 - rawAnswers.length;
    // Oyuncularin yazdigi yalanlarla cakisan ev yalanlarini ele
    const takenKeys = new Set(rawAnswers.map((a) => bluffCompareKey(a.text)));
    // Hep ilk N degil, RASTGELE N — ayni soru tekrar geldiginde ayni
    // secenekler cikmasin, ezberlenmesin.
    const pool = [...q.defaultFakes];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool
      .filter((f) => !takenKeys.has(bluffCompareKey(f)))
      .slice(0, needed)
      .forEach((fake, idx) => {
      rawAnswers.push({
        id: `fake_${idx}`,
        text: normalizeBluffDisplay(fake),
        isReal: false,
        chosenByPlayerIds: [],
        chosenByNames: [],
      });
    });
  }

  // Shuffle answers randomly
  for (let i = rawAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rawAnswers[i], rawAnswers[j]] = [rawAnswers[j], rawAnswers[i]];
  }

  // Kimlikleri OPAK yap. Onceden id'ler `real_1` / `bluff_<oyuncuId>` / `fake_0`
  // seklindeydi ve oylama sirasinda istemciye aynen gidiyordu — tarayici
  // konsolunu acan biri dogru cevabi hicbir sey bilmeden gorebiliyordu.
  // Karistirmadan SONRA yeniden adlandiriliyor ki sira da ipucu vermesin.
  rawAnswers.forEach((a, idx) => {
    a.id = `opt_${room.gameState.currentRound}_${idx}`;
  });

  room.gameState.answers = rawAnswers;
  room.gameState.phase = 'VOTING';
  room.gameState.votedPlayerIds = [];
  room.gameState.timerSeconds = 30;

  broadcastBluffRoomState(room, 'bluff:voting_started');

  room.roundTimer = setInterval(() => {
    const currentRoom = bluffRooms.get(room.code);
    if (!currentRoom || currentRoom.gameState.phase !== 'VOTING') {
      if (currentRoom) clearBluffTimers(currentRoom);
      return;
    }

    currentRoom.gameState.timerSeconds -= 1;

    if (currentRoom.gameState.timerSeconds <= 0) {
      clearBluffTimers(currentRoom);
      calculateAndRevealBluffScores(currentRoom);
    } else {
      broadcastBluffRoomState(currentRoom);
    }
  }, 1000);
}

/**
 * Fibbage yazim tekbicimi.
 *
 * Gercek cevap elle kuratorlu ("Cilt kremi"), oyuncu yalanlari ham girdi
 * ("cilt kremi", "CILT KREMI ", "cilt kremi."). Bu fark tek basina dogruyu
 * ele veriyordu — hicbir sey bilmeden bicimden bulunabiliyordu.
 * Tum secenekler ayni bicimde gosteriliyor.
 */
function normalizeBluffDisplay(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;]+$/, '')
    .toLocaleUpperCase('tr-TR');
}

/** Karsilastirma anahtari: buyuk-kucuk, aksan ve noktalama farkini yok sayar. */
function bluffCompareKey(text: string): string {
  return normalizeBluffDisplay(text)
    .replace(/[İI]/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/[^A-Z0-9 ]/g, '');
}

function calculateAndRevealBluffScores(room: BluffServerRoom) {
  clearBluffTimers(room);

  room.players.forEach((p) => {
    p.roundScoreEarned = 0;
  });

  const answersMap = new Map<string, BluffAnswerItem>();
  room.gameState.answers.forEach((ans) => {
    ans.chosenByPlayerIds = [];
    ans.chosenByNames = [];
    answersMap.set(ans.id, ans);
  });

  room.players.forEach((voter) => {
    if (!voter.votedAnswerId) return;
    const chosenAns = answersMap.get(voter.votedAnswerId);
    if (!chosenAns) return;

    chosenAns.chosenByPlayerIds.push(voter.id);
    chosenAns.chosenByNames.push(voter.name);

    if (chosenAns.isReal) {
      voter.score += 1000;
      voter.roundScoreEarned = (voter.roundScoreEarned || 0) + 1000;
      voter.truthsFound = (voter.truthsFound || 0) + 1;
    } else {
      // Birlesmis yalanlarda yazarlarin HEPSI puan alir (kendine oy veren haric)
      const authorIds = chosenAns.authorPlayerIds || (chosenAns.authorPlayerId ? [chosenAns.authorPlayerId] : []);
      authorIds
        .filter((id) => id !== voter.id)
        .forEach((id) => {
          const author = room.players.find((p) => p.id === id);
          if (author) {
            author.score += 500;
            author.roundScoreEarned = (author.roundScoreEarned || 0) + 500;
            author.foolsCount = (author.foolsCount || 0) + 1;
          }
        });
    }
  });

  room.gameState.phase = 'ROUND_RESULT';
  room.gameState.revealIndex = 0;
  broadcastBluffRoomState(room, 'bluff:round_results');
}

function createFreshBombGame(): BombGameState {
  const prompt = getRandomBombPrompt([]);
  return {
    phase: 'LOBBY',
    currentRound: 1,
    currentPrompt: prompt,
    activePlayerIndex: 0,
    activePlayerId: null,
    bombTimeRemaining: 25,
    visualTimerFraction: 1,
    usedWords: [],
    explodedPlayerId: null,
    winnerPlayerId: null,
    isOnline: true,
  };
}

function clearBombTimers(room: BombServerRoom) {
  if (room.bombTimer) {
    clearInterval(room.bombTimer);
    room.bombTimer = null;
  }
}

function broadcastBombRoomState(
  room: BombServerRoom,
  eventType: string = 'bomb:state',
  extraData?: any
) {
  maybeRecordMatch('bomb', room as any);
  const activePlayer = room.players[room.gameState.activePlayerIndex] || null;
  const payload = JSON.stringify({
    type: eventType,
    gameState: {
      ...room.gameState,
      roomCode: room.code,
      activePlayerId: activePlayer?.id || null,
    },
    players: room.players,
    ...extraData,
  });

  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });

  room.players.forEach((player) => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: eventType,
          gameState: {
            ...room.gameState,
            roomCode: room.code,
            activePlayerId: activePlayer?.id || null,
          },
          players: room.players,
          myPlayer: player,
          isMyTurn: activePlayer?.id === player.id,
          ...extraData,
        })
      );
    }
  });
}

function startBombServerTicker(room: BombServerRoom) {
  clearBombTimers(room);

  room.bombTimer = setInterval(() => {
    const currentRoom = bombRooms.get(room.code);
    if (!currentRoom || currentRoom.gameState.phase !== 'TICKING') {
      if (currentRoom) clearBombTimers(currentRoom);
      return;
    }

    currentRoom.fuseRemaining -= 0.5;
    currentRoom.gameState.bombTimeRemaining = Math.max(0, currentRoom.fuseRemaining);
    currentRoom.gameState.visualTimerFraction = Math.max(
      0,
      currentRoom.fuseRemaining / currentRoom.initialFuse
    );

    // Check if exploded
    if (currentRoom.fuseRemaining <= 0) {
      clearBombTimers(currentRoom);

      const victim = currentRoom.players[currentRoom.gameState.activePlayerIndex];
      if (victim) {
        victim.lives = Math.max(0, victim.lives - 1);
        if (victim.lives <= 0) {
          victim.isAlive = false;
        }
      }

      const alivePlayers = currentRoom.players.filter((p) => p.isAlive);

      if (alivePlayers.length <= 1) {
        currentRoom.gameState.phase = 'GAME_OVER';
        currentRoom.gameState.explodedPlayerId = victim ? victim.id : null;
        currentRoom.gameState.winnerPlayerId = alivePlayers[0]
          ? alivePlayers[0].id
          : victim?.id || null;
        broadcastBombRoomState(currentRoom, 'bomb:exploded', {
          victimId: victim?.id,
          isGameOver: true,
        });
      } else {
        currentRoom.gameState.phase = 'EXPLODED';
        currentRoom.gameState.explodedPlayerId = victim ? victim.id : null;
        broadcastBombRoomState(currentRoom, 'bomb:exploded', {
          victimId: victim?.id,
          isGameOver: false,
        });
      }
    } else {
      broadcastBombRoomState(currentRoom);
    }
  }, 500);
}



function createFreshCodenamesGame(settings?: Partial<CodenamesSettings>): CodenamesGameState {
  const fullSettings: CodenamesSettings = {
    startingTeam: settings?.startingTeam || 'random',
    category: settings?.category || 'all',
    timerSeconds: settings?.timerSeconds || 0,
    aiSpymaster: settings?.aiSpymaster ?? true,
  };

  let starting: CodenamesTeam =
    fullSettings.startingTeam === 'random'
      ? Math.random() > 0.5
        ? 'red'
        : 'blue'
      : fullSettings.startingTeam;

  const board = generateCodenamesBoard(starting, fullSettings.category);
  const redCount = board.filter((c) => c.type === 'red').length;
  const blueCount = board.filter((c) => c.type === 'blue').length;

  return {
    board,
    activeTeam: starting,
    startingTeam: starting,
    // Oda acilinca oyun HEMEN baslamaz: once lobi. Oyuncular telefondan
    // katilip takim/rol secer, host `codenames:start_game` ile baslatir.
    phase: 'LOBBY',
    clues: [],
    currentClue: null,
    guessesRemaining: 0,
    winner: null,
    winReason: null,
    redRemaining: redCount,
    blueRemaining: blueCount,
    timerSeconds: fullSettings.timerSeconds,
    isTimerRunning: fullSettings.timerSeconds > 0,
    settings: fullSettings,
    redScore: 0,
    blueScore: 0,
    assassinCardId: null,
  };
}

function broadcastCodenamesRoomState(room: CodenamesServerRoom) {
  maybeRecordMatch('codenames', room as any);
  // 1. Broadcast to Observers (TV Screen):
  // We send the full board so that revealed cards show real agent artwork, and when flipped it animations trigger smoothly
  const observerPayload = JSON.stringify({
    type: 'codenames:state',
    gameState: room.gameState,
    players: room.players,
  });

  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(observerPayload);
    }
  });

  // 2. Broadcast to each Player (Mobile):
  room.players.forEach((player) => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'codenames:state',
          gameState: room.gameState,
          players: room.players,
          myPlayer: player,
        })
      );
    }
  });
}


const ROOM_CODE_WORDS = [
  'LION', 'BEAR', 'WOLF', 'FROG', 'DUCK', 'FISH', 'BIRD', 'STAR', 'MOON',
  'ROSE', 'PINE', 'LEAF', 'SNOW', 'RAIN', 'FIRE', 'WAVE', 'PEAK', 'CAVE',
  'DEER', 'HAWK', 'SEAL', 'CRAB', 'FOX', 'CAT', 'DOG', 'BEE', 'OWL',
];

// =============================================================================
// AT YARIŞI — oyun motoru
// =============================================================================

function createFreshHorseRaceGame(settings?: Partial<HorseRaceSettings>): HorseRaceGameState {
  const full: HorseRaceSettings = {
    totalRaces: Math.max(1, Math.min(9, settings?.totalRaces || 4)),
    bettingSeconds: Math.max(5, Math.min(90, settings?.bettingSeconds || 20)),
  };
  return {
    phase: 'LOBBY',
    currentRace: 1,
    settings: full,
    horses: [],
    exactaOdds: [],
    timerSeconds: 0,
    betPlacedPlayerIds: [],
    finishOrder: [],
    winnerPlayerId: null,
    isOnline: true,
  };
}

function clearHorseRaceTimers(room: HorseRaceServerRoom) {
  if (room.phaseTimer) {
    clearInterval(room.phaseTimer);
    room.phaseTimer = null;
  }
  if (room.raceTimer) {
    clearInterval(room.raceTimer);
    room.raceTimer = null;
  }
}

/**
 * Durum yayini.
 *
 * IKI SEY ISTEMCIYE GITMEZ:
 *  1. Atlarin gizli `strength` degeri — gonderilseydi favori hesaplanip
 *     bahis anlamsiz kalirdi.
 *  2. BETTING/COUNTDOWN sirasinda baskalarinin kuponu; yalnizca "verdi"
 *     bilgisi paylasilir, kendi kuponun sana `myBet` ile ayrica gelir.
 */
function broadcastHorseRaceRoomState(room: HorseRaceServerRoom, eventType = 'race:state') {
  maybeRecordMatch('race', room as any);
  const hideBets = room.gameState.phase === 'BETTING' || room.gameState.phase === 'COUNTDOWN';

  const publicHorses = room.gameState.horses.map(({ strength, ...rest }) => rest);
  const publicPlayers = room.players.map((p) => ({
    ...p,
    bet: hideBets ? null : p.bet ?? null,
  }));

  const base = {
    gameState: { ...room.gameState, horses: publicHorses, roomCode: room.code },
    players: publicPlayers,
  };

  const tvPayload = JSON.stringify({ type: eventType, ...base });
  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(tvPayload);
  });

  room.players.forEach((player) => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: eventType,
          ...base,
          myPlayer: { ...player, bet: player.bet ?? null },
          myBet: player.bet ?? null,
        })
      );
    }
  });
}

/** Yeni yaris karti + bahis geri sayimi. */
function startBettingPhase(room: HorseRaceServerRoom) {
  clearHorseRaceTimers(room);

  const card = createRaceCard(room.gameState.horses.length ? room.gameState.horses : undefined);
  room.gameState.horses = card.horses;
  room.gameState.exactaOdds = card.exactaOdds;
  room.racePlan = null;

  room.players.forEach((p) => {
    p.bet = null;
    p.lastDelta = 0;
  });
  room.gameState.betPlacedPlayerIds = [];
  room.gameState.finishOrder = [];
  room.gameState.lastRaceSummary = undefined;
  room.gameState.phase = 'BETTING';
  room.gameState.timerSeconds = room.gameState.settings.bettingSeconds;

  broadcastHorseRaceRoomState(room, 'race:betting_started');

  room.phaseTimer = setInterval(() => {
    const current = raceRooms.get(room.code);
    if (!current || current.gameState.phase !== 'BETTING') {
      if (current) clearHorseRaceTimers(current);
      return;
    }
    current.gameState.timerSeconds -= 1;
    if (current.gameState.timerSeconds <= 0) {
      startCountdownPhase(current);
    } else {
      broadcastHorseRaceRoomState(current);
    }
  }, 1000);
}

function startCountdownPhase(room: HorseRaceServerRoom) {
  clearHorseRaceTimers(room);
  room.gameState.phase = 'COUNTDOWN';
  room.gameState.timerSeconds = 3;
  broadcastHorseRaceRoomState(room, 'race:countdown');

  room.phaseTimer = setInterval(() => {
    const current = raceRooms.get(room.code);
    if (!current || current.gameState.phase !== 'COUNTDOWN') {
      if (current) clearHorseRaceTimers(current);
      return;
    }
    current.gameState.timerSeconds -= 1;
    if (current.gameState.timerSeconds <= 0) {
      startRacingPhase(current);
    } else {
      broadcastHorseRaceRoomState(current);
    }
  }, 1000);
}

/**
 * Yarisi baslat. Sonuc BURADA belirlenir (planRace), ekrandaki kosu onun
 * canlandirmasidir — boylece gosterilen oranlar gercek olasiliga dayanir.
 */
function startRacingPhase(room: HorseRaceServerRoom) {
  clearHorseRaceTimers(room);
  room.racePlan = planRace(room.gameState.horses);
  room.gameState.phase = 'RACING';
  room.gameState.timerSeconds = 0;
  room.raceElapsedMs = 0;
  broadcastHorseRaceRoomState(room, 'race:started');

  room.raceTimer = setInterval(() => {
    const current = raceRooms.get(room.code);
    if (!current || current.gameState.phase !== 'RACING' || !current.racePlan) {
      if (current) clearHorseRaceTimers(current);
      return;
    }

    current.raceElapsedMs += TICK_MS;
    const t = current.raceElapsedMs;
    const plan = current.racePlan;

    current.gameState.horses.forEach((h) => {
      h.progress = progressAt(t, plan.finishAt[h.id], plan.style[h.id], plan.phase[h.id]);
      if (h.rank === null && t >= plan.finishAt[h.id]) {
        h.rank = plan.order.indexOf(h.id) + 1;
        current.gameState.finishOrder.push(h.id);
      }
    });

    const allDone = current.gameState.horses.every((h) => h.rank !== null);
    if (allDone || t >= MAX_RACE_MS) {
      if (!allDone) {
        // Guvenlik agi: sure dolduysa plani uygula
        current.gameState.horses.forEach((h) => {
          if (h.rank === null) h.rank = plan.order.indexOf(h.id) + 1;
          h.progress = TRACK_LENGTH;
        });
        current.gameState.finishOrder = [...plan.order];
      }
      finishRace(current);
    } else {
      broadcastHorseRaceRoomState(current);
    }
  }, TICK_MS);
}

/** Yarisi kapatir: kuponlari oder, formu gunceller. */
function finishRace(room: HorseRaceServerRoom) {
  clearHorseRaceTimers(room);

  const ordered = [...room.gameState.horses].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const firstId = ordered[0]?.id ?? null;
  const secondId = ordered[1]?.id ?? null;
  room.gameState.finishOrder = ordered.map((h) => h.id);

  const payouts: Record<string, any> = {};
  room.players.forEach((p) => {
    const result = settleBet(p.bet ?? null, room.gameState.horses, firstId, secondId, room.gameState.exactaOdds);
    p.money = Math.max(0, p.money + result.delta);
    p.lastDelta = result.delta;
    if (result.won) {
      p.correctBets = (p.correctBets || 0) + 1;
      p.biggestWin = Math.max(p.biggestWin || 0, result.delta);
    }
    payouts[p.id] = result;
  });

  // Form cizelgesi: bir sonraki yaris icin oyuncular okusun
  room.gameState.horses.forEach((h) => {
    h.form = [...(h.form || []), h.rank || 0].slice(-5);
  });

  room.gameState.lastRaceSummary = { firstId, secondId, payouts };

  const isLast = room.gameState.currentRace >= room.gameState.settings.totalRaces;
  if (isLast) {
    const richest = [...room.players].sort((a, b) => b.money - a.money)[0];
    room.gameState.winnerPlayerId = richest?.id || null;
    room.gameState.phase = 'GAME_OVER';
  } else {
    room.gameState.phase = 'ROUND_RESULT';
  }

  broadcastHorseRaceRoomState(room, 'race:results');
}

// =============================================================================
// COLORY — renk hafizasi oyunu
// =============================================================================

function createFreshColoryGame(settings?: Partial<ColorySettings>): ColoryGameState {
  return {
    phase: 'LOBBY',
    currentRound: 1,
    settings: {
      totalRounds: Math.max(1, Math.min(15, settings?.totalRounds || 5)),
      showSeconds: Math.max(2, Math.min(15, settings?.showSeconds || 5)),
      guessSeconds: Math.max(5, Math.min(60, settings?.guessSeconds || 20)),
    },
    target: null,
    guessedPlayerIds: [],
    timerSeconds: 0,
    winnerPlayerId: null,
    isOnline: true,
  };
}

function clearColoryTimer(room: ColoryServerRoom) {
  if (room.phaseTimer) {
    clearInterval(room.phaseTimer);
    room.phaseTimer = null;
  }
}

/**
 * Durum yayini.
 *
 * HEDEF RENK GIZLILIGI: `target` yalnizca SHOWING ve REVEAL fazlarinda
 * gonderilir. GUESSING sirasinda gonderilseydi oyuncu tarayici konsolundan
 * bakip birebir tutturabilirdi — oyunun tamami anlamsiz kalirdi.
 * Ayni sekilde baskalarinin tahmini de GUESSING'de sizmaz.
 */
function broadcastColoryRoomState(room: ColoryServerRoom, eventType = 'colory:state') {
  maybeRecordMatch('colory', room as any);
  const hideTarget = room.gameState.phase === 'GUESSING';
  const hideGuesses = room.gameState.phase !== 'REVEAL' && room.gameState.phase !== 'GAME_OVER';

  const publicState = {
    ...room.gameState,
    roomCode: room.code,
    target: hideTarget ? null : room.gameState.target ?? null,
  };
  const publicPlayers = room.players.map((p) => ({
    ...p,
    guess: hideGuesses ? null : p.guess ?? null,
  }));

  const base = { gameState: publicState, players: publicPlayers };
  const tvPayload = JSON.stringify({ type: eventType, ...base });
  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(tvPayload);
  });

  room.players.forEach((player) => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: eventType,
          ...base,
          myPlayer: { ...player, guess: player.guess ?? null },
          myGuess: player.guess ?? null,
        })
      );
    }
  });
}

/** Hedefi uret ve TV'de goster. */
function startColoryShowing(room: ColoryServerRoom) {
  clearColoryTimer(room);
  room.gameState.target = randomTarget();
  room.gameState.guessedPlayerIds = [];
  room.gameState.results = undefined;
  room.players.forEach((p) => {
    p.guess = null;
    p.lastPoints = 0;
  });
  room.gameState.phase = 'SHOWING';
  room.gameState.timerSeconds = room.gameState.settings.showSeconds;
  broadcastColoryRoomState(room, 'colory:showing');

  room.phaseTimer = setInterval(() => {
    const cur = coloryRooms.get(room.code);
    if (!cur || cur.gameState.phase !== 'SHOWING') {
      if (cur) clearColoryTimer(cur);
      return;
    }
    cur.gameState.timerSeconds -= 1;
    if (cur.gameState.timerSeconds <= 0) startColoryGuessing(cur);
    else broadcastColoryRoomState(cur);
  }, 1000);
}

function startColoryGuessing(room: ColoryServerRoom) {
  clearColoryTimer(room);
  room.gameState.phase = 'GUESSING';
  room.gameState.timerSeconds = room.gameState.settings.guessSeconds;
  broadcastColoryRoomState(room, 'colory:guessing');

  room.phaseTimer = setInterval(() => {
    const cur = coloryRooms.get(room.code);
    if (!cur || cur.gameState.phase !== 'GUESSING') {
      if (cur) clearColoryTimer(cur);
      return;
    }
    cur.gameState.timerSeconds -= 1;
    if (cur.gameState.timerSeconds <= 0) revealColory(cur);
    else broadcastColoryRoomState(cur);
  }, 1000);
}

/** Tahminleri olcup puanla, sirala, goster. */
function revealColory(room: ColoryServerRoom) {
  clearColoryTimer(room);
  const target = room.gameState.target;
  if (!target) return;

  const scored: ColoryGuess[] = room.players
    .filter((p) => !!p.guess)
    .map((p) => {
      const d = colorDistance(target, p.guess as Hsl);
      return {
        playerId: p.id,
        hsl: p.guess as Hsl,
        deltaE: Math.round(d * 10) / 10,
        points: scoreFromDelta(d),
        rank: 0,
      };
    })
    .sort((a, b) => a.deltaE - b.deltaE);

  scored.forEach((g, i) => {
    g.rank = i + 1;
    g.points += rankBonus(g.rank);
    const player = room.players.find((p) => p.id === g.playerId);
    if (player) {
      player.score += g.points;
      player.lastPoints = g.points;
      if (g.rank === 1) player.roundsWon = (player.roundsWon || 0) + 1;
      player.bestDeltaE =
        player.bestDeltaE === undefined ? g.deltaE : Math.min(player.bestDeltaE, g.deltaE);
    }
  });

  // Tahmin vermeyenler 0 alir
  room.players.forEach((p) => {
    if (!p.guess) p.lastPoints = 0;
  });

  room.gameState.results = scored;

  const isLast = room.gameState.currentRound >= room.gameState.settings.totalRounds;
  if (isLast) {
    const best = [...room.players].sort((a, b) => b.score - a.score)[0];
    room.gameState.winnerPlayerId = best?.id || null;
    room.gameState.phase = 'GAME_OVER';
  } else {
    room.gameState.phase = 'REVEAL';
  }
  broadcastColoryRoomState(room, 'colory:reveal');
}

function generateRoomCode(): string {
  for (let i = 0; i < 30; i++) {
    const word = ROOM_CODE_WORDS[Math.floor(Math.random() * ROOM_CODE_WORDS.length)];
    const code = `${word}${Math.floor(10 + Math.random() * 90)}`;
    if (
      !rooms.has(code) &&
      !bluffRooms.has(code) &&
      !bombRooms.has(code) &&
      !codenamesRooms.has(code) &&
      !triviaRooms.has(code) &&
      !raceRooms.has(code) &&
      !coloryRooms.has(code)
    ) {
      return code;
    }
  }
  return `ROOM${Math.floor(1000 + Math.random() * 9000)}`;
}

function cleanString(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getSanitizedRoomState(room: ServerRoom, forPlayerId?: string): RoomState {
  const isShowdownOrResults = room.gamePhase === 'IMPOSTER_GUESS' || room.gamePhase === 'RESULTS';
  
  // Observers and players only see isImposter after results
  const sanitizedPlayers = room.players.map((p) => ({
    ...p,
    isImposter: isShowdownOrResults ? p.isImposter : p.id === forPlayerId ? p.isImposter : false,
    connected: p.isBot ? true : room.playerSockets.has(p.id),
  }));

  let myAssignedWord: string | undefined = undefined;
  let myIsImposter: boolean | undefined = undefined;
  let myRoleTitle: string | undefined = undefined;
  let myRoleDescription: string | undefined = undefined;

  if (forPlayerId) {
    const player = room.players.find((p) => p.id === forPlayerId);
    if (player) {
      myIsImposter = player.isImposter;
      if (player.isImposter) {
        myRoleTitle = 'SAHTEKÂR (IMPOSTER)';
        myAssignedWord = 'SAHTEKÂR (IMPOSTER)';
        myRoleDescription = 'Gizli kelimeyi bilmiyorsun! Diğer oyuncuların çizgilerini dikkatle izle, onlara uyum sağla ve yakalanma!';
      } else {
        myRoleTitle = 'MASUM RESSAM (CREW)';
        myAssignedWord = room.currentWordPair.crewWord;
        myRoleDescription = 'Gizli kelimeyi biliyorsun. Çok bariz olmadan kelimeyi yansıtacak 1 çizgi çiz!';
      }
    }
  }

  return {
    roomCode: room.code,
    gamePhase: room.gamePhase,
    players: sanitizedPlayers,
    settings: room.settings,
    currentRoundNumber: room.currentRoundNumber,
    currentDrawingRound: room.currentDrawingRound,
    activePlayerIndex: room.activePlayerIndex,
    strokes: room.strokes,
    liveStroke: null,
    turnTimeRemaining: room.turnTimeRemaining,
    discussionTimeRemaining: room.discussionTimeRemaining,
    votedPlayerIds: Object.keys(room.votes),
    roundResult: room.roundResult,
    category: '', // Category hidden to prevent spoiler leaks
    myAssignedWord,
    myIsImposter,
    myRoleTitle,
    myRoleDescription,
  };
}

function broadcastRoomState(room: ServerRoom) {
  maybeRecordMatch('imposter', room as any);
  // 1. Broadcast to observers (Big Screen / TV)
  const observerState = getSanitizedRoomState(room);
  const observerPayload = JSON.stringify({ type: 'room:state', state: observerState });
  room.observers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(observerPayload);
    }
  });

  // 2. Broadcast to each player with their own secret card info
  room.playerSockets.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      const playerState = getSanitizedRoomState(room, playerId);
      ws.send(JSON.stringify({ type: 'room:state', state: playerState }));
    }
  });
}

function broadcastLiveStroke(room: ServerRoom, payload: any, senderWs?: WebSocket) {
  const msg = JSON.stringify({ type: 'stroke:live', ...payload });
  room.observers.forEach((ws) => {
    if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
  room.playerSockets.forEach((ws) => {
    if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function clearRoomTimers(room: ServerRoom) {
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }
  if (room.discussionTimer) {
    clearInterval(room.discussionTimer);
    room.discussionTimer = null;
  }
}

function startTurnTimer(room: ServerRoom) {
  clearRoomTimers(room);
  if (room.settings.drawTimeLimitSec <= 0) {
    room.turnTimeRemaining = 0;
    return;
  }

  room.turnTimeRemaining = room.settings.drawTimeLimitSec;
  room.turnTimer = setInterval(() => {
    room.turnTimeRemaining -= 1;
    if (room.turnTimeRemaining <= 0) {
      clearRoomTimers(room);
      advanceDrawingTurn(room);
    } else {
      // Broadcast timer tick update
      const msg = JSON.stringify({
        type: 'timer:tick',
        phase: 'DRAWING',
        timeRemaining: room.turnTimeRemaining,
      });
      room.observers.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(msg));
      room.playerSockets.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(msg));
    }
  }, 1000);
}

function startDiscussionTimer(room: ServerRoom) {
  clearRoomTimers(room);
  if (room.settings.discussionTimeSec <= 0) {
    room.discussionTimeRemaining = 0;
    return;
  }

  room.discussionTimeRemaining = room.settings.discussionTimeSec;
  room.discussionTimer = setInterval(() => {
    room.discussionTimeRemaining -= 1;
    if (room.discussionTimeRemaining <= 0) {
      clearRoomTimers(room);
      // Auto advance to voting if timer expires
      transitionToVoting(room);
    } else {
      const msg = JSON.stringify({
        type: 'timer:tick',
        phase: 'DISCUSSION',
        timeRemaining: room.discussionTimeRemaining,
      });
      room.observers.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(msg));
      room.playerSockets.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(msg));
    }
  }, 1000);
}

function advanceDrawingTurn(room: ServerRoom) {
  // Clear any existing turn timers immediately to prevent double-firing and player skipping
  clearRoomTimers(room);

  // Broadcast an empty live stroke to wipe any in-flight ghost drawing indicators on observers/phones
  broadcastLiveStroke(room, {
    playerId: null,
    points: [],
    color: '#000000',
  });

  const maxRounds = room.settings.roundsPerPlayer || 2;
  if (room.activePlayerIndex < room.players.length - 1) {
    room.activePlayerIndex += 1;
  } else {
    // Completed this cycle
    if (room.currentDrawingRound < maxRounds) {
      room.currentDrawingRound += 1;
      room.activePlayerIndex = 0;
      // Continuously rotate player order for subsequent passes so starting player changes
      if (room.players.length > 1) {
        const [first, ...rest] = room.players;
        room.players = [...rest, first];
      }
    } else {
      // All drawing rounds completed! Transition to Discussion
      room.gamePhase = 'DISCUSSION';
      startDiscussionTimer(room);
      broadcastRoomState(room);
      return;
    }
  }

  startTurnTimer(room);
  broadcastRoomState(room);

  // If next player is an AI bot, generate procedural stroke automatically
  const nextPlayer = room.players[room.activePlayerIndex];
  if (nextPlayer?.isBot) {
    setTimeout(() => {
      generateBotStroke(room, nextPlayer);
    }, 1500);
  }
}

function generateBotStroke(room: ServerRoom, botPlayer: Player) {
  if (room.gamePhase !== 'DRAWING') return;
  const startX = 100 + Math.random() * 280;
  const startY = 80 + Math.random() * 200;
  const points: Point[] = [{ x: startX, y: startY }];
  const steps = 15 + Math.floor(Math.random() * 10);

  let curX = startX;
  let curY = startY;
  const angleBase = Math.random() * Math.PI * 2;

  for (let i = 0; i < steps; i++) {
    const angle = angleBase + i * 0.35;
    const dist = 12 + Math.random() * 12;
    curX += Math.cos(angle) * dist;
    curY += Math.sin(angle) * dist;
    points.push({
      x: Math.max(20, Math.min(460, curX)),
      y: Math.max(20, Math.min(340, curY)),
    });
  }

  const botStroke: Stroke = {
    id: `bot-stroke-${Date.now()}`,
    playerId: botPlayer.id,
    points,
    color: botPlayer.color,
    width: 5,
    roundNumber: room.currentDrawingRound,
    timestamp: Date.now(),
  };

  room.strokes.push(botStroke);
  advanceDrawingTurn(room);
}

function transitionToVoting(room: ServerRoom) {
  clearRoomTimers(room);
  room.gamePhase = 'VOTING';
  room.votes = {};

  // Auto cast votes for any bots
  room.players.forEach((p) => {
    if (p.isBot) {
      const candidates = room.players.filter((c) => c.id !== p.id);
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      if (target) {
        room.votes[p.id] = target.id;
      }
    }
  });

  broadcastRoomState(room);
}

function tallyRoomVotes(room: ServerRoom) {
  clearRoomTimers(room);
  const voteCounts: Record<string, number> = {};
  room.players.forEach((p) => (voteCounts[p.id] = 0));
  Object.values(room.votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  let highestVotes = -1;
  let votedPlayerId: string | null = null;
  Object.entries(voteCounts).forEach(([pId, count]) => {
    if (count > highestVotes) {
      highestVotes = count;
      votedPlayerId = pId;
    }
  });

  const imposter = room.players.find((p) => p.isImposter) || room.players[0];
  const wasImposterCaught = votedPlayerId === imposter.id;

  // Identify players who accurately voted for the imposter (+50 points)
  const correctVoterIds = room.players
    .filter((p) => !p.isImposter && room.votes[p.id] === imposter.id)
    .map((p) => p.id);

  if (wasImposterCaught) {
    // Transition to Imposter Showdown Guess
    room.roundResult = {
      votedPlayerId,
      wasImposterCaught: true,
      crewWord: room.currentWordPair.crewWord,
      imposterWord: room.currentWordPair.imposterWord,
      imposterId: imposter.id,
      crewWinners: room.players.filter((p) => !p.isImposter).map((p) => p.id),
      imposterWon: false,
      pointsAwarded: {},
      correctVoterIds,
      votes: { ...room.votes },
    };
    room.gamePhase = 'IMPOSTER_GUESS';

    // If imposter is a Bot, auto guess after short delay
    if (imposter.isBot) {
      setTimeout(() => {
        handleImposterGuessSubmission(room, 'Random Guess');
      }, 2000);
    }
  } else {
    // Imposter fooled the crew! Imposter wins 100 points
    // Players who correctly identified the imposter STILL earn +50 points!
    const pointsMap: Record<string, number> = {};
    room.players.forEach((p) => {
      if (p.isImposter) {
        pointsMap[p.id] = 100;
      } else if (room.votes[p.id] === imposter.id) {
        pointsMap[p.id] = 50; // +50 pts for correctly voting for the imposter
      } else {
        pointsMap[p.id] = 0;
      }
      p.score += pointsMap[p.id];
    });

    room.roundResult = {
      votedPlayerId,
      wasImposterCaught: false,
      crewWord: room.currentWordPair.crewWord,
      imposterWord: room.currentWordPair.imposterWord,
      imposterId: imposter.id,
      crewWinners: [],
      imposterWon: true,
      pointsAwarded: pointsMap,
      correctVoterIds,
      votes: { ...room.votes },
    };
    room.gamePhase = 'RESULTS';
  }

  broadcastRoomState(room);
}

function handleImposterGuessSubmission(room: ServerRoom, guessWord: string) {
  const imposter = room.players.find((p) => p.isImposter) || room.players[0];
  const actualClean = cleanString(room.currentWordPair.crewWord);
  const guessClean = cleanString(guessWord);

  const isCorrect =
    actualClean === guessClean ||
    (guessClean.length >= 3 && actualClean.includes(guessClean)) ||
    (actualClean.length >= 3 && guessClean.includes(actualClean));

  const correctVoterIds = room.roundResult?.correctVoterIds || [];

  const pointsMap: Record<string, number> = {};
  if (isCorrect) {
    // Imposter guessed secret word! Imposter gets 100 pts.
    // Detectives who voted for the imposter KEEP their +50 pts detective reward!
    room.players.forEach((p) => {
      if (p.isImposter) {
        pointsMap[p.id] = 100;
      } else if (correctVoterIds.includes(p.id)) {
        pointsMap[p.id] = 50; // +50 pts for correctly identifying the imposter
      } else {
        pointsMap[p.id] = 0;
      }
      p.score += pointsMap[p.id];
    });
  } else {
    // Imposter failed! Crew wins!
    // Detectives who voted for imposter get 50 (imposter detection) + 50 (crew win) = 100 pts!
    // Other innocent crew get 50 pts (crew win).
    room.players.forEach((p) => {
      if (p.isImposter) {
        pointsMap[p.id] = 0;
      } else if (correctVoterIds.includes(p.id)) {
        pointsMap[p.id] = 100; // 50 detection + 50 victory
      } else {
        pointsMap[p.id] = 50; // 50 victory
      }
      p.score += pointsMap[p.id];
    });
  }

  room.roundResult = {
    votedPlayerId: room.roundResult?.votedPlayerId || null,
    wasImposterCaught: true,
    imposterGuessedCorrectly: isCorrect,
    imposterGuessWord: guessWord,
    crewWord: room.currentWordPair.crewWord,
    imposterWord: room.currentWordPair.imposterWord,
    imposterId: imposter.id,
    crewWinners: isCorrect ? [] : room.players.filter((p) => !p.isImposter).map((p) => p.id),
    imposterWon: isCorrect,
    pointsAwarded: pointsMap,
    correctVoterIds,
    votes: room.roundResult?.votes || {},
  };

  room.gamePhase = 'RESULTS';
  broadcastRoomState(room);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  // ---------------------------------------------------------------------------
  // CORS — frontend Vercel'de, bu sunucu Railway'de: farkli origin'ler.
  // ALLOWED_ORIGINS bos ise tum origin'lere izin verilir (kolay ilk kurulum).
  // ---------------------------------------------------------------------------
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (ALLOWED_ORIGINS.length === 0) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    const totals = {
      imposter: rooms.size,
      codenames: codenamesRooms.size,
      bomb: bombRooms.size,
      bluff: bluffRooms.size,
      trivia: triviaRooms.size,
      quiplash: quiplashRooms.size,
      race: raceRooms.size,
      colory: coloryRooms.size,
    };
    res.json({
      status: 'ok',
      game: 'FiestaLoco',
      uptimeSeconds: Math.round(process.uptime()),
      connectedClients: clientMap.size,
      activeRooms: Object.values(totals).reduce((a, b) => a + b, 0),
      rooms: totals,
      persistence: persistenceStatus(),
    });
  });

  // ---------------------------------------------------------------------------
  // Leaderboard & mac gecmisi (Supabase)
  // ---------------------------------------------------------------------------
  app.get('/api/leaderboard', async (req, res) => {
    if (!isPersistenceEnabled()) {
      res.json({ enabled: false, players: [] });
      return;
    }
    const limit = Number(req.query.limit) || 100;
    res.json({ enabled: true, players: await fetchLeaderboard(limit) });
  });

  app.get('/api/match-history', async (req, res) => {
    if (!isPersistenceEnabled()) {
      res.json({ enabled: false, matches: [] });
      return;
    }
    const limit = Number(req.query.limit) || 50;
    const gameType = typeof req.query.gameType === 'string' ? req.query.gameType : undefined;
    res.json({ enabled: true, matches: await fetchMatchHistory(limit, gameType) });
  });

  // Query Room Info endpoint (for quick pre-check on join)
  app.get('/api/room/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
      code: room.code,
      playerCount: room.players.length,
      gamePhase: room.gamePhase,
      category: room.currentWordPair.category,
    });
  });

  // AI Word Pair Generation
  app.post('/api/generate-words', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { category, difficulty } = req.body || {};

      if (!apiKey) {
        return res.status(200).json({
          fallback: true,
          message: 'No GEMINI_API_KEY configured, using rich local word bank.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a party game master for a drawing imposter game.
Generate 5 distinct, fun, and balanced word pairs for the game "Imposter Line".
Category requested: "${category || 'General / Party'}". Difficulty: "${difficulty || 'balanced'}".

Rules for the pair:
1. "crewWord": The secret word given to the majority (innocent players). Must be easy/fun to draw piece-by-piece with single line strokes.
2. "imposterWord": The sneaky word given to the 1 imposter. It must be closely related enough that the imposter might accidentally draw something that fits both, or easily bluff, but distinct enough to detect (e.g. "Cat" vs "Fox", "Pizza" vs "Pie", "Bicycle" vs "Motorcycle", "Castle" vs "House", "Shark" vs "Dolphin", "Sunglasses" vs "Goggles").
3. "category": A broad category hint shown to all players (e.g. "Vehicles", "Animals", "Food", "Places", "Everyday Objects").
4. "hint": A subtle clue about why they are tricky.

Return strictly JSON in the following schema:
[
  {
    "category": "string",
    "crewWord": "string",
    "imposterWord": "string",
    "hint": "string"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, pairs: parsed });
      }
      return res.status(200).json({ fallback: true });
    } catch (err: any) {
      console.error('Gemini word generation error:', err?.message || err);
      return res.status(200).json({ fallback: true, error: err?.message });
    }
  });

  // Codenames AI Spymaster Clue Generation
  app.post('/api/codenames/ai-clue', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { activeTeam, teamCards, enemyCards, bystanderCards, assassinCard } = req.body || {};

      if (!apiKey) {
        return res.status(200).json({
          fallback: true,
          clueWord: 'STRATEJİ',
          clueCount: 2,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an elite Spymaster (Ajan Lideri) in the party board game Codenames (Gizli Ajanlar).
Active Team: "${activeTeam === 'red' ? 'Kırmızı Takım' : 'Mavi Takım'}".

Your team's unrevealed secret agent words: ${JSON.stringify(teamCards || [])}
Opponent team's words (AVOID THESE): ${JSON.stringify(enemyCards || [])}
Neutral civilian words (AVOID THESE): ${JSON.stringify(bystanderCards || [])}
DANGEROUS ASSASSIN WORD (DO NOT HINT AT THIS AT ALL COSTS): "${assassinCard || ''}"

Instructions:
1. Find a single, creative Turkish word ("clueWord") that conceptually connects 2 or 3 of your team's words.
2. The clue must be strictly ONE Turkish word in UPPERCASE (no spaces, no punctuation).
3. The clue MUST NOT be on the board or be a direct morphological root of any board word.
4. The clue must be safe from hinting at the assassin word or enemy words.
5. Specify the number of cards ("clueCount": 2 or 3).
6. Provide a short explanation ("reasoning").

Return strictly JSON:
{
  "clueWord": "string",
  "clueCount": 2,
  "targetWords": ["word1", "word2"],
  "reasoning": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json({ success: true, ...parsed });
      }
      return res.status(200).json({ fallback: true, clueWord: 'GİZEM', clueCount: 2 });
    } catch (err: any) {
      console.error('Gemini Codenames clue error:', err?.message || err);
      return res.status(200).json({ fallback: true, clueWord: 'HEDEF', clueCount: 2 });
    }
  });

  // Trivia Pursuit Dynamic AI Question Generator (Non-repeating)
  app.post('/api/trivia-pursuit/generate-questions', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { category, count = 6, difficulty = 'balanced' } = req.body || {};

      if (!apiKey) {
        // Return fallback fresh questions from built-in pool
        const shuffled = [...INITIAL_TRIVIA_QUESTIONS]
          .sort(() => Math.random() - 0.5)
          .slice(0, count)
          .map((q) => ({
            ...q,
            id: `ai-gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          }));
        return res.json({ success: true, fallback: true, questions: shuffled });
      }

      const ai = new GoogleGenAI({ apiKey });
      const categoryPrompt = category
        ? `Specific category requested: "${category}".`
        : `Include a balanced mix across these 6 classic Trivia categories: 'geography', 'history', 'science', 'arts', 'sports', 'popculture'.`;

      const prompt = `You are a Trivia Master creating dynamic, fun, culturally rich, and completely unique Turkish trivia questions for a Trivial Pursuit style game.
${categoryPrompt}
Number of questions needed: ${count}.
Difficulty: ${difficulty}.

Requirements for each question:
1. "category": Must be one of ['geography', 'history', 'science', 'arts', 'sports', 'popculture'].
2. "question": An engaging, clear, and unambiguous Turkish trivia question.
3. "options": An array of EXACTLY 4 plausible Turkish choices.
4. "correctAnswer": The EXACT string matching one of the 4 options.
5. "explanation": A 1-2 sentence fun fact or trivia tidbit explaining why this is the answer.
6. "isWedgeQuestion": boolean (true for major milestone questions).

Return strictly a JSON array matching this schema:
[
  {
    "category": "geography",
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "string",
    "isWedgeQuestion": true
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        const formatted = (Array.isArray(parsed) ? parsed : []).map((q: any, idx: number) => ({
          id: `ai-gemini-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          category: q.category || category || 'science',
          question: q.question,
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
          correctAnswer: q.correctAnswer || (q.options && q.options[0]) || 'A',
          explanation: q.explanation || 'Harika bir trivia bilgisi!',
          isWedgeQuestion: q.isWedgeQuestion ?? true,
        }));
        return res.json({ success: true, questions: formatted });
      }

      return res.status(200).json({ fallback: true, questions: [] });
    } catch (err: any) {
      console.error('Gemini Trivia generation error:', err?.message || err);
      // Return safe fallback
      const fallbackQuestions = [...INITIAL_TRIVIA_QUESTIONS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .map((q) => ({
          ...q,
          id: `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        }));
      return res.status(200).json({ fallback: true, questions: fallbackQuestions });
    }
  });

  // ---------------------------------------------------------------------------
  // Frontend servisi
  //   dev            -> Vite middleware (tek komutla calisan yerel gelistirme)
  //   prod + dist/   -> statik dosyalar (tek host'ta calistirmak isteyenler icin)
  //   prod, dist yok -> salt API + WebSocket sunucusu (Vercel + Railway split)
  // SERVE_STATIC=false ile statik servis tamamen kapatilabilir.
  // ---------------------------------------------------------------------------
  const distPath = path.join(process.cwd(), 'dist');
  const wantsStatic = process.env.SERVE_STATIC !== 'false';
  const canServeStatic = IS_PRODUCTION && wantsStatic && fs.existsSync(path.join(distPath, 'index.html'));

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (canServeStatic) {
    console.log('[server] Statik frontend serviste:', distPath);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[server] Salt API + WebSocket modu (frontend ayri host\'ta).');
    app.get('/', (req, res) => {
      res.json({
        service: 'FiestaLoco game server',
        mode: 'api+websocket',
        health: '/api/health',
      });
    });
  }

  // Create HTTP & WebSocket server
  const server = http.createServer(app);
  const wss = new WebSocketServer({
    server,
    // Yalnizca izin verilen frontend origin'lerinden gelen WS baglantilarini kabul et.
    verifyClient: ({ origin }, done) => {
      if (isOriginAllowed(origin)) {
        done(true);
        return;
      }
      console.warn('[server] WS baglantisi reddedildi, izinsiz origin:', origin);
      done(false, 403, 'Forbidden origin');
    },
  });

  wss.on('connection', (ws: WebSocket) => {
    clientMap.set(ws, { ws });

    ws.on('message', (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type } = data;

        // =====================================================================
        // COLORY DISPATCHER
        // =====================================================================

        if (type === 'colory:create_room') {
          const roomCode = generateRoomCode();
          const newRoom: ColoryServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: createFreshColoryGame(data.settings),
            phaseTimer: null,
          };
          coloryRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'colory' });
          ws.send(
            JSON.stringify({
              type: 'colory:room_created',
              roomCode,
              gameState: newRoom.gameState,
              players: newRoom.players,
            })
          );
        }

        else if (type === 'colory:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = coloryRooms.get(roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'colory:error', message: `Oda bulunamadi: "${roomCode}"` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';
          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'colory' });
            ws.send(
              JSON.stringify({
                type: 'colory:room_joined',
                roomCode,
                role: 'observer',
                gameState: room.gameState,
                players: room.players,
              })
            );
            return;
          }

          // Gec katilim serbest: yeni oyuncu siradaki turdan itibaren oynar.
          const playerId = data.playerId || `cl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          let player = room.players.find((p) => p.id === playerId);
          if (!player) {
            player = {
              id: playerId,
              name: (data.playerName || data.name || 'Oyuncu').trim().substring(0, 18),
              avatar: data.avatar || '\u{1F3A8}',
              color: data.color || '#8b5cf6',
              colorName: data.colorName || 'Mor',
              score: 0,
              roundsWon: 0,
              guess: null,
              connected: true,
              isHost: room.players.length === 0,
            };
            room.players.push(player);
          } else {
            player.connected = true;
          }

          room.playerSockets.set(player.id, ws);
          clientMap.set(ws, { ws, roomCode, role: 'player', playerId: player.id, gameType: 'colory' });
          ws.send(
            JSON.stringify({
              type: 'colory:room_joined',
              roomCode,
              role: 'player',
              playerId: player.id,
              player,
              gameState: room.gameState,
              players: room.players,
            })
          );
          broadcastColoryRoomState(room);
        }

        else if (type === 'colory:start_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = coloryRooms.get(client.roomCode);
          if (!room) return;
          if (room.players.length < 1) {
            ws.send(JSON.stringify({ type: 'colory:error', message: 'En az 1 oyuncu gerekli.' }));
            return;
          }
          room.players.forEach((p) => {
            p.score = 0;
            p.roundsWon = 0;
            p.guess = null;
            p.lastPoints = 0;
            p.bestDeltaE = undefined;
          });
          room.gameState.currentRound = 1;
          room.gameState.winnerPlayerId = null;
          startColoryShowing(room);
        }

        else if (type === 'colory:submit_guess') {
          const client = clientMap.get(ws);
          if (!client?.roomCode || !client.playerId) return;
          const room = coloryRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'GUESSING') return;

          const player = room.players.find((p) => p.id === client.playerId);
          if (!player) return;

          // Istemciye guvenme: HSL araligi disi deger gelirse kirp
          const g = data.hsl || {};
          const hsl: Hsl = {
            h: ((Number(g.h) % 360) + 360) % 360 || 0,
            s: Math.max(0, Math.min(100, Number(g.s))),
            l: Math.max(0, Math.min(100, Number(g.l))),
          };
          if (!Number.isFinite(hsl.h) || !Number.isFinite(hsl.s) || !Number.isFinite(hsl.l)) return;

          player.guess = hsl;
          if (!room.gameState.guessedPlayerIds.includes(player.id)) {
            room.gameState.guessedPlayerIds.push(player.id);
          }

          // Herkes verdiyse beklemeye gerek yok
          const connected = room.players.filter((p) => p.connected !== false);
          if (connected.length > 0 && connected.every((p) => !!p.guess)) {
            revealColory(room);
          } else {
            broadcastColoryRoomState(room);
          }
        }

        else if (type === 'colory:next_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = coloryRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'REVEAL') return;
          room.gameState.currentRound += 1;
          startColoryShowing(room);
        }

        else if (type === 'colory:restart_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = coloryRooms.get(client.roomCode);
          if (!room) return;
          clearColoryTimer(room);
          room.players.forEach((p) => {
            p.score = 0;
            p.roundsWon = 0;
            p.guess = null;
            p.lastPoints = 0;
            p.bestDeltaE = undefined;
          });
          room.gameState = createFreshColoryGame(room.gameState.settings);
          broadcastColoryRoomState(room);
        }

        // =====================================================================
        // AT YARIŞI / HORSE RACE DISPATCHER
        // =====================================================================

        else if (type === 'race:create_room') {
          const roomCode = generateRoomCode();
          const newRoom: HorseRaceServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: createFreshHorseRaceGame(data.settings),
            phaseTimer: null,
            raceTimer: null,
            racePlan: null,
            raceElapsedMs: 0,
          };
          raceRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'race' });
          ws.send(
            JSON.stringify({
              type: 'race:room_created',
              roomCode,
              gameState: newRoom.gameState,
              players: newRoom.players,
            })
          );
        }

        else if (type === 'race:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = raceRooms.get(roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'race:error', message: `Oda bulunamadi: "${roomCode}"` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';
          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'race' });
            ws.send(
              JSON.stringify({
                type: 'race:room_joined',
                roomCode,
                role: 'observer',
                gameState: room.gameState,
                players: room.players,
              })
            );
            return;
          }

          const playerId = data.playerId || `hr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          let player = room.players.find((p) => p.id === playerId);

          // Ganyan oyununda gec katilim SERBEST: oyuncu at degil bahisci,
          // kadroyu bozmaz. Kasasiyla gelir, siradaki bahis turundan itibaren
          // oynar. (Parmak yarisi surumunde kadro sabit oldugu icin engelliydi.)

          if (!player) {
            player = {
              id: playerId,
              name: (data.playerName || data.name || 'Oyuncu').trim().substring(0, 18),
              avatar: data.avatar || '\u{1F98A}',
              color: data.color || '#f59e0b',
              colorName: data.colorName || 'Sari',
              money: 1000,
              correctBets: 0,
              biggestWin: 0,
              bet: null,
              connected: true,
              isHost: room.players.length === 0,
            };
            room.players.push(player);
          } else {
            player.connected = true;
          }

          room.playerSockets.set(player.id, ws);
          clientMap.set(ws, { ws, roomCode, role: 'player', playerId: player.id, gameType: 'race' });
          ws.send(
            JSON.stringify({
              type: 'race:room_joined',
              roomCode,
              role: 'player',
              playerId: player.id,
              player,
              gameState: room.gameState,
              players: room.players,
            })
          );
          broadcastHorseRaceRoomState(room);
        }

        else if (type === 'race:start_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = raceRooms.get(client.roomCode);
          if (!room) return;
          if (room.players.length < 1) {
            ws.send(JSON.stringify({ type: 'race:error', message: 'En az 1 oyuncu gerekli.' }));
            return;
          }
          room.players.forEach((p) => {
            p.money = 1000;
            p.correctBets = 0;
            p.biggestWin = 0;
            p.bet = null;
            p.lastDelta = 0;
          });
          room.gameState.currentRace = 1;
          room.gameState.winnerPlayerId = null;
          startBettingPhase(room);
        }

        else if (type === 'race:place_bet') {
          const client = clientMap.get(ws);
          if (!client?.roomCode || !client.playerId) return;
          const room = raceRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'BETTING') return;

          const player = room.players.find((p) => p.id === client.playerId);
          if (!player) return;

          // Istemciye GUVENME: kupon turu gecerli mi, atlar pistte mi,
          // miktar izinli mi, oyuncunun parasi yetiyor mu?
          const kind = String(data.kind || 'ganyan');
          const horseIds: string[] = Array.isArray(data.horseIds)
            ? data.horseIds.map((x: any) => String(x))
            : [];
          const amount = Number(data.amount);
          const bet = { kind, horseIds, amount } as HorseRaceBet;

          const kindOk = kind === 'ganyan' || kind === 'plase' || kind === 'ikili';
          const amountOk = (BET_AMOUNTS as readonly number[]).includes(amount);
          const allIds = room.gameState.horses.map((h) => h.id);

          if (!kindOk || !amountOk || amount > player.money || !isValidBet(bet, allIds)) {
            ws.send(JSON.stringify({ type: 'race:bet_rejected', message: 'Gecersiz kupon.' }));
            return;
          }

          player.bet = bet;
          if (!room.gameState.betPlacedPlayerIds.includes(player.id)) {
            room.gameState.betPlacedPlayerIds.push(player.id);
          }

          const connected = room.players.filter((p) => p.connected !== false);
          if (connected.length > 0 && connected.every((p) => !!p.bet)) {
            startCountdownPhase(room);
          } else {
            broadcastHorseRaceRoomState(room);
          }
        }

        else if (type === 'race:next_race') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = raceRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'ROUND_RESULT') return;
          room.gameState.currentRace += 1;
          startBettingPhase(room);
        }

        else if (type === 'race:restart_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = raceRooms.get(client.roomCode);
          if (!room) return;
          clearHorseRaceTimers(room);
          room.players.forEach((p) => {
            p.money = 1000;
            p.correctBets = 0;
            p.biggestWin = 0;
            p.bet = null;
            p.lastDelta = 0;
          });
          room.gameState = createFreshHorseRaceGame(room.gameState.settings);
          broadcastHorseRaceRoomState(room);
        }

        // =====================================================================
        // SAATLİ BOMBA / WORD BOMB MULTIPLAYER WEBSOCKET DISPATCHER
        // =====================================================================

        // 1. CREATE BOMB ROOM (TV / Observer Host)
        else if (type === 'bomb:create_room') {
          const roomCode = generateRoomCode();
          const initialGameState = createFreshBombGame();

          const newRoom: BombServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: initialGameState,
            usedPromptIds: [initialGameState.currentPrompt?.id || 'bomb_1'],
            bombTimer: null,
            fuseRemaining: 25,
            initialFuse: 25,
          };

          bombRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'bomb' });

          ws.send(
            JSON.stringify({
              type: 'bomb:room_created',
              roomCode,
              gameState: newRoom.gameState,
              players: newRoom.players,
            })
          );
        }

        // 2. JOIN BOMB ROOM (Mobile Phone Controller or Observer TV)
        else if (type === 'bomb:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = bombRooms.get(roomCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: `Oda bulunamadı: "${roomCode}"` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';

          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'bomb' });
            ws.send(
              JSON.stringify({
                type: 'bomb:room_joined',
                role: 'observer',
                roomCode,
                gameState: room.gameState,
                players: room.players,
              })
            );
          } else {
            const playerId =
              data.playerId || `bp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            let player = room.players.find((p) => p.id === playerId);

            const paletteIdx = room.players.length % DEFAULT_PLAYER_PALETTE.length;
            const pal = DEFAULT_PLAYER_PALETTE[paletteIdx];

            if (!player) {
              player = {
                id: playerId,
                name: data.playerName?.trim() || `Bombacı ${room.players.length + 1}`,
                avatar: data.avatar || pal.avatar,
                color: data.color || pal.color,
                colorName: data.colorName || pal.name,
                lives: 3,
                wordsUsed: [],
                isAlive: true,
                connected: true,
                isHost: room.players.length === 0,
              };
              room.players.push(player);
            } else {
              player.connected = true;
              if (data.playerName) player.name = data.playerName.trim();
              if (data.avatar) player.avatar = data.avatar;
              if (data.color) player.color = data.color;
            }

            room.playerSockets.set(playerId, ws);
            clientMap.set(ws, { ws, roomCode, role: 'player', playerId, gameType: 'bomb' });

            ws.send(
              JSON.stringify({
                type: 'bomb:room_joined',
                role: 'player',
                roomCode,
                player,
                gameState: room.gameState,
                players: room.players,
              })
            );
            broadcastBombRoomState(room);
          }
        }

        // 3. START BOMB ROUND (Host or Player triggers)
        else if (type === 'bomb:start_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bombRooms.get(client.roomCode);
          if (!room) return;

          const alivePlayers = room.players.filter((p) => p.isAlive);
          if (alivePlayers.length <= 1) {
            // Reset lives if needed
            room.players.forEach((p) => {
              p.lives = 3;
              p.isAlive = true;
              p.wordsUsed = [];
            });
          }

          const prompt = getRandomBombPrompt(room.usedPromptIds);
          room.usedPromptIds.push(prompt.id);

          const randomFuse = Math.floor(18 + Math.random() * 14);
          room.initialFuse = randomFuse;
          room.fuseRemaining = randomFuse;

          let firstAliveIdx = room.players.findIndex((p) => p.isAlive);
          if (firstAliveIdx < 0) firstAliveIdx = 0;

          room.gameState.phase = 'TICKING';
          room.gameState.currentPrompt = prompt;
          room.gameState.activePlayerIndex = firstAliveIdx;
          room.gameState.bombTimeRemaining = randomFuse;
          room.gameState.visualTimerFraction = 1;
          room.gameState.usedWords = [];
          room.gameState.explodedPlayerId = null;
          room.gameState.winnerPlayerId = null;
          room.gameState.lastWordSubmitted = undefined;

          broadcastBombRoomState(room, 'bomb:round_started');
          startBombServerTicker(room);
        }

        // 4. SUBMIT WORD / PASS BOMB
        else if (type === 'bomb:submit_word' || type === 'bomb:pass_turn') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bombRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'TICKING') return;

          const activePlayer = room.players[room.gameState.activePlayerIndex];
          const isSenderActive = !client.playerId || client.playerId === activePlayer?.id;
          if (!isSenderActive && client.role !== 'observer') {
            return;
          }

          const rawWord = (data.word || '').trim();
          const submittedWord = rawWord || '✓ Pas Verildi';

          if (activePlayer) {
            activePlayer.wordsUsed.push(submittedWord);
            room.gameState.usedWords.push(submittedWord);
            room.gameState.lastWordSubmitted = {
              word: submittedWord,
              playerName: activePlayer.name,
              playerId: activePlayer.id,
            };
          }

          // Advance to next alive player
          let nextIndex = (room.gameState.activePlayerIndex + 1) % room.players.length;
          let loops = 0;
          while (!room.players[nextIndex]?.isAlive && loops < room.players.length) {
            nextIndex = (nextIndex + 1) % room.players.length;
            loops++;
          }

          room.gameState.activePlayerIndex = nextIndex;

          broadcastBombRoomState(room, 'bomb:word_passed', {
            lastWord: submittedWord,
            passedByPlayerId: activePlayer?.id,
            nextPlayerId: room.players[nextIndex]?.id,
          });
        }

        // 5. NEXT ROUND (After an explosion)
        else if (type === 'bomb:next_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bombRooms.get(client.roomCode);
          if (!room) return;

          clearBombTimers(room);

          const alivePlayers = room.players.filter((p) => p.isAlive);
          if (alivePlayers.length <= 1) {
            room.gameState.phase = 'GAME_OVER';
            room.gameState.winnerPlayerId = alivePlayers[0]?.id || null;
            broadcastBombRoomState(room);
            return;
          }

          room.gameState.currentRound += 1;
          const prompt = getRandomBombPrompt(room.usedPromptIds);
          room.usedPromptIds.push(prompt.id);

          const randomFuse = Math.floor(18 + Math.random() * 14);
          room.initialFuse = randomFuse;
          room.fuseRemaining = randomFuse;

          let nextAliveIdx = (room.gameState.activePlayerIndex + 1) % room.players.length;
          let loops = 0;
          while (!room.players[nextAliveIdx]?.isAlive && loops < room.players.length) {
            nextAliveIdx = (nextAliveIdx + 1) % room.players.length;
            loops++;
          }

          room.gameState.phase = 'TICKING';
          room.gameState.currentPrompt = prompt;
          room.gameState.activePlayerIndex = nextAliveIdx;
          room.gameState.bombTimeRemaining = randomFuse;
          room.gameState.visualTimerFraction = 1;
          room.gameState.usedWords = [];
          room.gameState.explodedPlayerId = null;
          room.gameState.lastWordSubmitted = undefined;

          broadcastBombRoomState(room, 'bomb:round_started');
          startBombServerTicker(room);
        }

        // 6. RESTART BOMB GAME / RESET LIVES
        else if (type === 'bomb:restart_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bombRooms.get(client.roomCode);
          if (!room) return;

          clearBombTimers(room);
          room.players.forEach((p) => {
            p.lives = 3;
            p.isAlive = true;
            p.wordsUsed = [];
          });

          room.gameState = createFreshBombGame();
          broadcastBombRoomState(room);
        }

        // =====================================================================
        // YALAN USTASI (BLUFF TRIVIA / FIBBAGE) WEBSOCKET DISPATCHER
        // =====================================================================

        // 1. CREATE BLUFF ROOM (TV / Observer Host)
        else if (type === 'bluff:create_room') {
          const roomCode = generateRoomCode();
          const initialGameState = createFreshBluffGame(data?.totalRounds || 3);

          const newRoom: BluffServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: initialGameState,
            usedQuestionIds: [],
            roundTimer: null,
          };

          bluffRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'bluff' });

          ws.send(
            JSON.stringify({
              type: 'bluff:created',
              roomCode,
              gameState: {
                ...initialGameState,
                roomCode,
              },
              players: newRoom.players,
            })
          );
        }

        // 2. JOIN BLUFF ROOM (Phone Controller or TV Screen)
        else if (type === 'bluff:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = bluffRooms.get(roomCode);

          if (!room) {
            ws.send(
              JSON.stringify({
                type: 'bluff:error',
                message: `Oda bulunamadı: ${roomCode}`,
              })
            );
            return;
          }

          if (data.role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'bluff' });
            ws.send(
              JSON.stringify({
                type: 'bluff:created',
                roomCode,
                role: 'observer',
                gameState: {
                  ...room.gameState,
                  roomCode,
                },
                players: room.players,
              })
            );
            return;
          }

          const playerId =
            data.playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          let player = room.players.find((p) => p.id === playerId || p.name === data.name);

          if (player) {
            player.connected = true;
            player.avatar = data.avatar || player.avatar;
            player.color = data.color || player.color;
            player.colorName = data.colorName || player.colorName;
            if (data.name) player.name = data.name.trim();
          } else {
            const isFirst = room.players.length === 0;
            player = {
              id: playerId,
              name: data.name?.trim() || `Oyuncu ${room.players.length + 1}`,
              avatar: data.avatar || '🦊',
              color: data.color || '#3b82f6',
              colorName: data.colorName || 'Mavi',
              score: 0,
              connected: true,
              isHost: isFirst,
              foolsCount: 0,
              truthsFound: 0,
            };
            room.players.push(player);
          }

          room.playerSockets.set(player.id, ws);
          clientMap.set(ws, {
            ws,
            roomCode,
            role: 'player',
            playerId: player.id,
            gameType: 'bluff',
          });

          ws.send(
            JSON.stringify({
              type: 'bluff:joined',
              roomCode,
              role: 'player',
              playerId: player.id,
              player,
              gameState: {
                ...room.gameState,
                roomCode,
              },
              players: room.players,
            })
          );

          broadcastBluffRoomState(room, 'bluff:player_joined', { newPlayer: player });
        }

        // 3. START BLUFF GAME / FIRST ROUND
        else if (type === 'bluff:start_game' || type === 'bluff:start_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          clearBluffTimers(room);

          const q = getRandomBluffQuestion(room.usedQuestionIds);
          room.usedQuestionIds.push(q.id);

          room.players.forEach((p) => {
            p.currentBluff = undefined;
            p.votedAnswerId = undefined;
            p.votedAnswerText = undefined;
            p.roundScoreEarned = 0;
          });

          room.gameState.phase = 'QUESTION_PREVIEW';
          room.gameState.currentQuestion = q;
          room.gameState.category = q.category;
          room.gameState.answers = [];
          room.gameState.submittedPlayerIds = [];
          room.gameState.votedPlayerIds = [];
          room.gameState.timerSeconds = 10;
          room.gameState.revealIndex = 0;

          broadcastBluffRoomState(room, 'bluff:round_started');

          // Preview timer (10s), then transition to WRITING_BLUFF
          room.roundTimer = setInterval(() => {
            const currentRoom = bluffRooms.get(room.code);
            if (!currentRoom || currentRoom.gameState.phase !== 'QUESTION_PREVIEW') {
              if (currentRoom) clearBluffTimers(currentRoom);
              return;
            }

            currentRoom.gameState.timerSeconds -= 1;

            if (currentRoom.gameState.timerSeconds <= 0) {
              clearBluffTimers(currentRoom);
              // Auto transition to writing bluffs
              currentRoom.gameState.phase = 'WRITING_BLUFF';
              currentRoom.gameState.timerSeconds = 45;
              broadcastBluffRoomState(currentRoom, 'bluff:writing_started');

              // Start writing timer (45s)
              currentRoom.roundTimer = setInterval(() => {
                const writingRoom = bluffRooms.get(room.code);
                if (!writingRoom || writingRoom.gameState.phase !== 'WRITING_BLUFF') {
                  if (writingRoom) clearBluffTimers(writingRoom);
                  return;
                }

                writingRoom.gameState.timerSeconds -= 1;

                if (writingRoom.gameState.timerSeconds <= 0) {
                  clearBluffTimers(writingRoom);
                  compileAndStartBluffVoting(writingRoom);
                } else {
                  broadcastBluffRoomState(writingRoom);
                }
              }, 1000);
            } else {
              broadcastBluffRoomState(currentRoom);
            }
          }, 1000);
        }

        // 4. MANUAL ADVANCE TO WRITING BLUFF
        else if (type === 'bluff:start_writing') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          clearBluffTimers(room);
          room.gameState.phase = 'WRITING_BLUFF';
          room.gameState.timerSeconds = 45;
          broadcastBluffRoomState(room, 'bluff:writing_started');

          room.roundTimer = setInterval(() => {
            const writingRoom = bluffRooms.get(room.code);
            if (!writingRoom || writingRoom.gameState.phase !== 'WRITING_BLUFF') {
              if (writingRoom) clearBluffTimers(writingRoom);
              return;
            }

            writingRoom.gameState.timerSeconds -= 1;

            if (writingRoom.gameState.timerSeconds <= 0) {
              clearBluffTimers(writingRoom);
              compileAndStartBluffVoting(writingRoom);
            } else {
              broadcastBluffRoomState(writingRoom);
            }
          }, 1000);
        }

        // 5. SUBMIT BLUFF (Phone Controller)
        else if (type === 'bluff:submit_bluff') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          const playerId = client.playerId || data.playerId;
          const player = room.players.find((p) => p.id === playerId);
          const rawBluff = (data.bluffText || '').trim();

          if (!player || !rawBluff) return;

          // Check if user accidentally wrote the exact real answer!
          const realAns = room.gameState.currentQuestion?.realAnswer || '';
          if (bluffCompareKey(rawBluff) === bluffCompareKey(realAns)) {
            ws.send(
              JSON.stringify({
                type: 'bluff:bluff_rejected',
                reason: 'Vay canına, bu zaten GERÇEK cevap! Başka bir yalan uydur.',
              })
            );
            return;
          }

          player.currentBluff = rawBluff;

          if (!room.gameState.submittedPlayerIds) {
            room.gameState.submittedPlayerIds = [];
          }
          if (!room.gameState.submittedPlayerIds.includes(player.id)) {
            room.gameState.submittedPlayerIds.push(player.id);
          }

          // If all connected players submitted, advance immediately to voting!
          const activePlayers = room.players.filter((p) => p.connected !== false);
          const allSubmitted = activePlayers.every(
            (p) => room.gameState.submittedPlayerIds?.includes(p.id)
          );

          if (allSubmitted && activePlayers.length > 0) {
            compileAndStartBluffVoting(room);
          } else {
            broadcastBluffRoomState(room, 'bluff:bluff_submitted', {
              submittedPlayerId: player.id,
            });
          }
        }

        // 6. VOTE ANSWER (Phone Controller)
        else if (type === 'bluff:vote_answer') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          const playerId = client.playerId || data.playerId;
          const player = room.players.find((p) => p.id === playerId);
          const answerId = data.answerId;

          if (!player || !answerId) return;

          // Prevent voting for self bluff
          const chosenAnswer = room.gameState.answers.find((a) => a.id === answerId);
          // Birlesmis yalanlarda YAZARLARIN HICBIRI kendi seceneğine oy veremez
          const chosenAuthorIds =
            chosenAnswer?.authorPlayerIds ||
            (chosenAnswer?.authorPlayerId ? [chosenAnswer.authorPlayerId] : []);
          if (chosenAuthorIds.includes(player.id)) {
            ws.send(
              JSON.stringify({
                type: 'bluff:vote_rejected',
                reason: 'Kendi uydurduğun yalana oy veremezsin!',
              })
            );
            return;
          }

          player.votedAnswerId = answerId;
          player.votedAnswerText = chosenAnswer?.text || '';

          if (!room.gameState.votedPlayerIds) {
            room.gameState.votedPlayerIds = [];
          }
          if (!room.gameState.votedPlayerIds.includes(player.id)) {
            room.gameState.votedPlayerIds.push(player.id);
          }

          // If all active players voted, advance to results immediately!
          const activePlayers = room.players.filter((p) => p.connected !== false);
          const allVoted = activePlayers.every(
            (p) => room.gameState.votedPlayerIds?.includes(p.id)
          );

          if (allVoted && activePlayers.length > 0) {
            calculateAndRevealBluffScores(room);
          } else {
            broadcastBluffRoomState(room, 'bluff:vote_submitted', {
              voterPlayerId: player.id,
            });
          }
        }

        // 7. NEXT REVEAL CARD STEP
        else if (type === 'bluff:next_reveal') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          room.gameState.revealIndex = (room.gameState.revealIndex || 0) + 1;
          broadcastBluffRoomState(room);
        }

        // 8. NEXT ROUND OR GAME OVER
        else if (type === 'bluff:next_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          clearBluffTimers(room);

          if (room.gameState.currentRound >= room.gameState.totalRounds) {
            room.gameState.phase = 'GAME_OVER';
            broadcastBluffRoomState(room, 'bluff:game_over');
          } else {
            room.gameState.currentRound += 1;
            const q = getRandomBluffQuestion(room.usedQuestionIds);
            room.usedQuestionIds.push(q.id);

            room.players.forEach((p) => {
              p.currentBluff = undefined;
              p.votedAnswerId = undefined;
              p.votedAnswerText = undefined;
              p.roundScoreEarned = 0;
            });

            room.gameState.phase = 'QUESTION_PREVIEW';
            room.gameState.currentQuestion = q;
            room.gameState.category = q.category;
            room.gameState.answers = [];
            room.gameState.submittedPlayerIds = [];
            room.gameState.votedPlayerIds = [];
            room.gameState.timerSeconds = 10;
            room.gameState.revealIndex = 0;

            broadcastBluffRoomState(room, 'bluff:round_started');

            room.roundTimer = setInterval(() => {
              const currentRoom = bluffRooms.get(room.code);
              if (!currentRoom || currentRoom.gameState.phase !== 'QUESTION_PREVIEW') {
                if (currentRoom) clearBluffTimers(currentRoom);
                return;
              }

              currentRoom.gameState.timerSeconds -= 1;

              if (currentRoom.gameState.timerSeconds <= 0) {
                clearBluffTimers(currentRoom);
                currentRoom.gameState.phase = 'WRITING_BLUFF';
                currentRoom.gameState.timerSeconds = 45;
                broadcastBluffRoomState(currentRoom, 'bluff:writing_started');

                currentRoom.roundTimer = setInterval(() => {
                  const writingRoom = bluffRooms.get(room.code);
                  if (!writingRoom || writingRoom.gameState.phase !== 'WRITING_BLUFF') {
                    if (writingRoom) clearBluffTimers(writingRoom);
                    return;
                  }

                  writingRoom.gameState.timerSeconds -= 1;

                  if (writingRoom.gameState.timerSeconds <= 0) {
                    clearBluffTimers(writingRoom);
                    compileAndStartBluffVoting(writingRoom);
                  } else {
                    broadcastBluffRoomState(writingRoom);
                  }
                }, 1000);
              } else {
                broadcastBluffRoomState(currentRoom);
              }
            }, 1000);
          }
        }

        // 9. RESTART BLUFF GAME
        else if (type === 'bluff:restart_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = bluffRooms.get(client.roomCode);
          if (!room) return;

          clearBluffTimers(room);
          room.players.forEach((p) => {
            p.score = 0;
            p.foolsCount = 0;
            p.truthsFound = 0;
            p.currentBluff = undefined;
            p.votedAnswerId = undefined;
            p.votedAnswerText = undefined;
            p.roundScoreEarned = 0;
          });

          room.gameState = createFreshBluffGame(room.gameState.totalRounds);
          broadcastBluffRoomState(room);
        }

        // =====================================================================
        // TRIVIA PURSUIT MULTIPLAYER WEBSOCKET DISPATCHER
        // =====================================================================

        // 1. CREATE TRIVIA ROOM (TV Screen / Observer Host)
        else if (type === 'trivia:create_room') {
          const roomCode = generateRoomCode();
          const initialGameState = createFreshTriviaGame(data.settings);
          initialGameState.roomCode = roomCode;

          const newRoom: TriviaServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: initialGameState,
            usedQuestionIds: [],
            questionPool: [...INITIAL_TRIVIA_QUESTIONS],
            roundTimer: null,
          };

          triviaRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'trivia' });

          ws.send(
            JSON.stringify({
              type: 'trivia:room_created',
              roomCode,
              gameState: newRoom.gameState,
              players: newRoom.players,
            })
          );
        }

        // 2. JOIN TRIVIA ROOM (Mobile Phone Controller or Secondary Observer)
        else if (type === 'trivia:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = triviaRooms.get(roomCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: `Oda bulunamadı: "${roomCode}"` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';

          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'trivia' });
            ws.send(
              JSON.stringify({
                type: 'trivia:room_joined',
                role: 'observer',
                roomCode,
                gameState: room.gameState,
                players: room.players,
              })
            );
          } else {
            const playerId = data.playerId || `tp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            let player = room.players.find((p) => p.id === playerId);

            const isFirst = room.players.length === 0;
            const paletteIdx = room.players.length % DEFAULT_PLAYER_PALETTE.length;
            const pal = DEFAULT_PLAYER_PALETTE[paletteIdx];

            if (player) {
              player.connected = true;
              if (data.playerName) player.name = data.playerName.trim();
              if (data.avatar) player.avatar = data.avatar;
              if (data.color) player.color = data.color;
            } else {
              player = {
                id: playerId,
                name: data.playerName?.trim() || `Bilgin ${room.players.length + 1}`,
                avatar: data.avatar || pal.avatar,
                color: data.color || pal.color,
                colorName: data.colorName || pal.name,
                score: 0,
                wedges: [],
                streak: 0,
                totalCorrect: 0,
                totalAnswered: 0,
                connected: true,
                isHost: isFirst,
              };
              room.players.push(player);
            }

            room.playerSockets.set(player.id, ws);
            clientMap.set(ws, {
              ws,
              roomCode,
              role: 'player',
              playerId: player.id,
              gameType: 'trivia',
            });

            ws.send(
              JSON.stringify({
                type: 'trivia:room_joined',
                roomCode,
                role: 'player',
                playerId: player.id,
                player,
                gameState: {
                  ...room.gameState,
                  roomCode,
                },
                players: room.players,
              })
            );

            broadcastTriviaRoomState(room);
          }
        }

        // 3. START TRIVIA GAME
        else if (type === 'trivia:start_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room) return;

          clearTriviaTimers(room);
          room.players.forEach((p) => {
            p.score = 0;
            p.wedges = [];
            p.streak = 0;
            p.totalCorrect = 0;
            p.totalAnswered = 0;
            p.currentAnswer = undefined;
          });

          room.gameState.phase = 'WHEEL_SPIN';
          room.gameState.roundNumber = 1;
          room.gameState.activePlayerIndex = 0;
          room.gameState.activePlayerId = room.players[0]?.id || null;
          room.gameState.winnerPlayerId = null;
          room.gameState.selectedCategory = null;
          room.gameState.currentQuestion = null;

          // Tahta: herkes baslangic karesinde
          const startPositions: Record<string, BoardPosition> = {};
          room.players.forEach((p) => {
            startPositions[p.id] = boardStartingPosition();
          });
          room.gameState.boardPositions = startPositions;
          room.gameState.dieRoll = null;
          room.gameState.moveOptions = [];
          room.gameState.landedOnHq = false;
          room.gameState.landedOnHub = false;

          broadcastTriviaRoomState(room, 'trivia:game_started');
        }

        // 4a. ZAR AT (tahta modu) — yalnizca sirasi gelen oyuncu veya TV/host
        else if (type === 'trivia:roll_die') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'WHEEL_SPIN') return;
          // Zaten atilmis ve hamle bekleniyorsa tekrar atma
          if ((room.gameState.moveOptions?.length || 0) > 0) return;

          const activePlayer = room.players[room.gameState.activePlayerIndex];
          if (!activePlayer) return;
          // Sadece sirasi gelen oyuncu (telefondan) ya da TV/host atabilir
          if (client.role === 'player' && client.playerId !== activePlayer.id) return;

          const pos =
            room.gameState.boardPositions?.[activePlayer.id] || boardStartingPosition();

          // MERKEZDE zar atilmaz: sira dogrudan final sorusudur. Onceden burada
          // getMoveOptions bos dizi donuyor, ekran yine "ZAR AT" gosteriyor ve
          // oyuncu sonsuz zar dongusunde kiliteniyordu (oyun bitirilemiyordu).
          if (isBoardFinalTurn(pos)) {
            room.gameState.dieRoll = null;
            room.gameState.moveOptions = [];
            room.gameState.landedOnHq = false;
            room.gameState.landedOnHub = true;
            const finalCat =
              TRIVIA_CATEGORY_KEYS[Math.floor(Math.random() * TRIVIA_CATEGORY_KEYS.length)];
            startTriviaQuestion(room, finalCat);
            return;
          }

          const roll = rollBoardDie();
          const needed = room.gameState.settings.wedgesToWin || 6;
          const hasAll = activePlayer.wedges.length >= needed;

          room.gameState.dieRoll = roll;
          room.gameState.moveOptions = getBoardMoveOptions(pos, roll, hasAll);

          broadcastTriviaRoomState(room, 'trivia:die_rolled');
        }

        // 4b. HAMLE SEC (tahta modu)
        else if (type === 'trivia:pick_move') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'WHEEL_SPIN') return;

          const activePlayer = room.players[room.gameState.activePlayerIndex];
          if (!activePlayer) return;
          if (client.role === 'player' && client.playerId !== activePlayer.id) return;

          // Istemciye guvenme: hedef gercekten sunulan seceneklerden biri mi?
          const target = data.to as BoardPosition | undefined;
          const options = room.gameState.moveOptions || [];
          if (!target || !options.some((o) => sameBoardPosition(o.to as BoardPosition, target))) {
            return;
          }

          room.gameState.boardPositions = {
            ...(room.gameState.boardPositions || {}),
            [activePlayer.id]: target,
          };
          room.gameState.moveOptions = [];

          const space = boardSpaceAt(target);
          room.gameState.landedOnHq = space.kind === 'hq';
          room.gameState.landedOnHub = space.kind === 'hub';

          // "Tekrar at" karesi: soru sorulmaz, ayni oyuncu yeniden atar
          if (space.kind === 'rollAgain') {
            room.gameState.dieRoll = null;
            broadcastTriviaRoomState(room, 'trivia:roll_again');
            return;
          }

          const chosenCategory: TriviaCategory =
            space.kind === 'hub'
              ? TRIVIA_CATEGORY_KEYS[Math.floor(Math.random() * TRIVIA_CATEGORY_KEYS.length)]
              : (space.category as TriviaCategory);

          startTriviaQuestion(room, chosenCategory);
        }

        // 4. SPIN CATEGORY WHEEL
        else if (type === 'trivia:spin_wheel') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'WHEEL_SPIN' || room.gameState.isSpinning) return;

          const activePlayer = room.players[room.gameState.activePlayerIndex];
          // Bias towards missing wedges so game is dynamic and thrilling
          const missingWedges = TRIVIA_CATEGORY_KEYS.filter((c) => !activePlayer?.wedges.includes(c));
          const chosenCategory: TriviaCategory =
            missingWedges.length > 0 && Math.random() < 0.75
              ? missingWedges[Math.floor(Math.random() * missingWedges.length)]
              : TRIVIA_CATEGORY_KEYS[Math.floor(Math.random() * TRIVIA_CATEGORY_KEYS.length)];

          const catIndex = TRIVIA_CATEGORY_KEYS.indexOf(chosenCategory);
          const segmentAngle = 360 / TRIVIA_CATEGORY_KEYS.length;
          const targetOffset = 360 - catIndex * segmentAngle - segmentAngle / 2;
          const spins = 5 + Math.floor(Math.random() * 3);
          const finalRotation = room.gameState.wheelRotationDegrees + spins * 360 + targetOffset;

          room.gameState.isSpinning = true;
          room.gameState.selectedCategory = chosenCategory;
          room.gameState.wheelRotationDegrees = finalRotation;

          broadcastTriviaRoomState(room, 'trivia:spinning');

          setTimeout(() => {
            const currentRoom = triviaRooms.get(room.code);
            if (!currentRoom) return;

            currentRoom.gameState.isSpinning = false;
            const q = getNextTriviaQuestion(
              chosenCategory,
              currentRoom.usedQuestionIds,
              currentRoom.questionPool
            );

            if (q) {
              currentRoom.usedQuestionIds.push(q.id);
              currentRoom.gameState.currentQuestion = q;
              currentRoom.gameState.phase = 'QUESTION_ACTIVE';
              currentRoom.players.forEach((p) => {
                p.currentAnswer = undefined;
                p.isCorrect = undefined;
              });

              broadcastTriviaRoomState(currentRoom, 'trivia:question_active');
              startTriviaTurnTimer(currentRoom);
            }
          }, 2600);
        }

        // 5. SELECT CATEGORY DIRECTLY
        else if (type === 'trivia:select_category') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'WHEEL_SPIN') return;

          const chosenCategory: TriviaCategory = data.category || 'geography';
          room.gameState.selectedCategory = chosenCategory;

          const q = getNextTriviaQuestion(
            chosenCategory,
            room.usedQuestionIds,
            room.questionPool
          );

          if (q) {
            room.usedQuestionIds.push(q.id);
            room.gameState.currentQuestion = q;
            room.gameState.phase = 'QUESTION_ACTIVE';
            room.players.forEach((p) => {
              p.currentAnswer = undefined;
              p.isCorrect = undefined;
            });

            broadcastTriviaRoomState(room, 'trivia:question_active');
            startTriviaTurnTimer(room);
          }
        }

        // 6. SUBMIT ANSWER (Phone controller or active player)
        else if (type === 'trivia:submit_answer') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room || room.gameState.phase !== 'QUESTION_ACTIVE') return;

          const targetPlayerId = client.playerId || data.playerId;
          const player = room.players.find((p) => p.id === targetPlayerId);
          if (!player) return;

          player.currentAnswer = (data.answer || '').trim();
          player.answeredAt = Date.now();

          ws.send(
            JSON.stringify({
              type: 'trivia:answer_confirmed',
              answer: player.currentAnswer,
            })
          );

          // Check if active player (or everyone in allPlayersAnswer mode) has submitted
          const activePlayer = room.players[room.gameState.activePlayerIndex];
          const activeAnswered = !!activePlayer?.currentAnswer;
          const connectedPlayers = room.players.filter((p) => p.connected !== false);
          const allAnswered = connectedPlayers.length > 0 && connectedPlayers.every((p) => !!p.currentAnswer);

          if (room.gameState.settings.allPlayersAnswer ? allAnswered : activeAnswered) {
            resolveTriviaQuestionRound(room);
          } else {
            broadcastTriviaRoomState(room);
          }
        }

        // 7. NEXT ROUND
        else if (type === 'trivia:next_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room) return;

          clearTriviaTimers(room);

          // Klasik kural: dogru cevap veren ayni oyuncu tekrar zar atar.
          const prevActive = room.players[room.gameState.activePlayerIndex];
          const keepTurn = prevActive?.isCorrect === true;

          room.gameState.roundNumber += 1;
          if (!keepTurn) {
            room.gameState.activePlayerIndex =
              (room.gameState.activePlayerIndex + 1) % (room.players.length || 1);
            room.gameState.activePlayerId =
              room.players[room.gameState.activePlayerIndex]?.id || null;
          }
          room.gameState.phase = 'WHEEL_SPIN';
          room.gameState.selectedCategory = null;
          room.gameState.currentQuestion = null;
          room.gameState.dieRoll = null;
          room.gameState.moveOptions = [];
          room.gameState.landedOnHq = false;
          room.gameState.landedOnHub = false;
          room.players.forEach((p) => {
            p.currentAnswer = undefined;
            p.isCorrect = undefined;
          });

          broadcastTriviaRoomState(room);
        }

        // 8. RESTART TRIVIA GAME
        else if (type === 'trivia:restart_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room) return;

          clearTriviaTimers(room);
          room.players.forEach((p) => {
            p.score = 0;
            p.wedges = [];
            p.streak = 0;
            p.totalCorrect = 0;
            p.totalAnswered = 0;
            p.currentAnswer = undefined;
          });

          room.gameState = createFreshTriviaGame(room.gameState.settings);
          broadcastTriviaRoomState(room);
        }

        // 9. DYNAMICALLY ADD QUESTIONS (AI Question Generation)
        else if (type === 'trivia:add_questions') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = triviaRooms.get(client.roomCode);
          if (!room || !Array.isArray(data.questions)) return;

          room.questionPool.push(...data.questions);
        }

        // =====================================================================
        // QUIPLASH MULTIPLAYER WEBSOCKET DISPATCHER
        // =====================================================================

        // 1. CREATE QUIPLASH ROOM (TV Screen / Observer Host)
        else if (type === 'quiplash:create_room') {
          const roomCode = generateRoomCode();
          const initialGameState = createFreshQuiplashGame(data.settings);

          const newRoom: QuiplashServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: initialGameState,
            usedPromptIds: [],
            roundTimer: null,
          };

          quiplashRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'quiplash' });

          ws.send(
            JSON.stringify({
              type: 'quiplash:room_created',
              roomCode,
              gameState: newRoom.gameState,
              players: newRoom.players,
            })
          );
        }

        // 2. JOIN QUIPLASH ROOM (Mobile Phone Controller or Secondary TV Screen)
        else if (type === 'quiplash:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = quiplashRooms.get(roomCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: `Oda bulunamadı: "${roomCode}"` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';

          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'quiplash' });
            ws.send(
              JSON.stringify({
                type: 'quiplash:room_joined',
                role: 'observer',
                roomCode,
                gameState: room.gameState,
                players: room.players,
              })
            );
          } else {
            const playerId =
              data.playerId || `qp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            let player = room.players.find((p) => p.id === playerId);

            const paletteIdx = room.players.length % DEFAULT_PLAYER_PALETTE.length;
            const pal = DEFAULT_PLAYER_PALETTE[paletteIdx];

            if (!player) {
              player = {
                id: playerId,
                name: data.playerName?.trim() || `Oyuncu ${room.players.length + 1}`,
                avatar: data.avatar || pal.avatar,
                color: data.color || pal.color,
                colorName: data.colorName || pal.name,
                score: 0,
                connected: true,
                isHost: room.players.length === 0,
              };
              room.players.push(player);
            } else {
              player.connected = true;
              if (data.playerName) player.name = data.playerName.trim();
              if (data.avatar) player.avatar = data.avatar;
              if (data.color) player.color = data.color;
            }

            room.playerSockets.set(playerId, ws);
            clientMap.set(ws, { ws, roomCode, role: 'player', playerId, gameType: 'quiplash' });

            ws.send(
              JSON.stringify({
                type: 'quiplash:room_joined',
                role: 'player',
                roomCode,
                player,
                gameState: room.gameState,
                players: room.players,
              })
            );
            broadcastQuiplashRoomState(room);
          }
        }

        // 3. START GAME (Round 1 Writing Phase)
        else if (type === 'quiplash:start_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room) return;

          room.gameState.currentRound = 1;
          startQuiplashWritingRound(room);
        }

        // 4. SUBMIT PROMPT ANSWERS (From Mobile Controller)
        else if (type === 'quiplash:submit_answers') {
          const client = clientMap.get(ws);
          if (!client?.roomCode || !client.playerId) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room || !data.answers) return;

          const player = room.players.find((p) => p.id === client.playerId);
          if (!player) return;

          player.submittedPrompts = {
            ...(player.submittedPrompts || {}),
            ...data.answers,
          };

          // Update matchup texts
          room.gameState.matchups.forEach((m) => {
            if (m.answer1.playerId === player.id && data.answers[m.prompt.id]) {
              m.answer1.text = data.answers[m.prompt.id];
            }
            if (m.answer2.playerId === player.id && data.answers[m.prompt.id]) {
              m.answer2.text = data.answers[m.prompt.id];
            }
          });

          if (!room.gameState.submittedPlayerIds?.includes(player.id)) {
            room.gameState.submittedPlayerIds = [
              ...(room.gameState.submittedPlayerIds || []),
              player.id,
            ];
          }

          // Check if all connected players submitted
          const connectedPlayers = room.players.filter((p) => p.connected !== false);
          if (room.gameState.submittedPlayerIds.length >= connectedPlayers.length) {
            fillMissingQuiplashAnswersAndProceed(room);
          } else {
            broadcastQuiplashRoomState(room);
          }
        }

        // 5. VOTE MATCHUP ANSWER (From Mobile Controller)
        else if (type === 'quiplash:vote_matchup') {
          const client = clientMap.get(ws);
          if (!client?.roomCode || !client.playerId) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room || !room.gameState.currentMatchup) return;

          const player = room.players.find((p) => p.id === client.playerId);
          if (!player) return;

          const m = room.gameState.currentMatchup;
          const answerIndex = Number(data.answerIndex);

          if (answerIndex === 1 || answerIndex === 2) {
            // Remove previous vote from both if already voted
            m.answer1.votes = m.answer1.votes.filter((vid) => vid !== player.id);
            m.answer2.votes = m.answer2.votes.filter((vid) => vid !== player.id);

            if (answerIndex === 1) {
              m.answer1.votes.push(player.id);
            } else {
              m.answer2.votes.push(player.id);
            }

            player.currentVoteAnswerIndex = answerIndex as 1 | 2;

            if (!room.gameState.votedPlayerIds?.includes(player.id)) {
              room.gameState.votedPlayerIds = [
                ...(room.gameState.votedPlayerIds || []),
                player.id,
              ];
            }

            // In Quiplash, authors of this matchup don't vote (unless only 2 players exist)
            const eligibleVoters = room.players.filter(
              (p) =>
                p.connected !== false &&
                (room.players.length <= 2 || (p.id !== m.answer1.playerId && p.id !== m.answer2.playerId))
            );

            if (room.gameState.votedPlayerIds.length >= eligibleVoters.length && eligibleVoters.length > 0) {
              resolveCurrentMatchup(room);
            } else {
              broadcastQuiplashRoomState(room);
            }
          }
        }

        // 6. NEXT MATCHUP
        else if (type === 'quiplash:next_matchup') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room) return;

          startQuiplashMatchupVoting(room, room.gameState.currentMatchupIndex + 1);
        }

        // 7. NEXT ROUND (Round 2 or Last Lash)
        else if (type === 'quiplash:next_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room) return;

          if (room.gameState.currentRound < room.gameState.totalRounds) {
            room.gameState.currentRound += 1;
            startQuiplashWritingRound(room);
          } else {
            startLastLashWriting(room);
          }
        }

        // 8. SUBMIT LAST LASH ANSWER (Final Round)
        else if (type === 'quiplash:submit_last_lash_answer') {
          const client = clientMap.get(ws);
          if (!client?.roomCode || !client.playerId) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room) return;

          const player = room.players.find((p) => p.id === client.playerId);
          if (!player) return;

          player.lastLashAnswer = data.answer || '';

          if (!room.gameState.submittedPlayerIds?.includes(player.id)) {
            room.gameState.submittedPlayerIds = [
              ...(room.gameState.submittedPlayerIds || []),
              player.id,
            ];
          }

          const connectedPlayers = room.players.filter((p) => p.connected !== false);
          if (room.gameState.submittedPlayerIds.length >= connectedPlayers.length) {
            fillMissingLastLashAndProceedToVote(room);
          } else {
            broadcastQuiplashRoomState(room);
          }
        }

        // 9. VOTE LAST LASH (Medals)
        else if (type === 'quiplash:vote_last_lash') {
          const client = clientMap.get(ws);
          if (!client?.roomCode || !client.playerId) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room || !Array.isArray(data.votedPlayerIds)) return;

          const player = room.players.find((p) => p.id === client.playerId);
          if (!player) return;

          player.lastLashVotesGiven = data.votedPlayerIds;

          data.votedPlayerIds.forEach((targetId: string) => {
            const ans = room.gameState.lastLashAnswers?.find((a) => a.playerId === targetId);
            if (ans && !ans.votes.includes(player.id)) {
              ans.votes.push(player.id);
            }
          });

          if (!room.gameState.votedPlayerIds?.includes(player.id)) {
            room.gameState.votedPlayerIds = [
              ...(room.gameState.votedPlayerIds || []),
              player.id,
            ];
          }

          const connectedPlayers = room.players.filter((p) => p.connected !== false);
          if (room.gameState.votedPlayerIds.length >= connectedPlayers.length) {
            resolveLastLash(room);
          } else {
            broadcastQuiplashRoomState(room);
          }
        }

        // 10. RESTART QUIPLASH GAME
        else if (type === 'quiplash:restart_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = quiplashRooms.get(client.roomCode);
          if (!room) return;

          clearQuiplashTimers(room);
          room.players.forEach((p) => {
            p.score = 0;
            p.assignedPrompts = [];
            p.submittedPrompts = {};
            p.currentVoteAnswerIndex = undefined;
            p.lastLashAnswer = '';
            p.lastLashVotesGiven = [];
          });

          room.gameState = createFreshQuiplashGame(room.gameState.settings);
          broadcastQuiplashRoomState(room);
        }

        // =====================================================================
        // CODENAMES MULTIPLAYER WEBSOCKET DISPATCHER
        // =====================================================================

        // 1. CREATE CODENAMES ROOM (TV / Observer Host)
        else if (type === 'codenames:create_room') {
          const roomCode = generateRoomCode();
          const initialGameState = createFreshCodenamesGame(data.settings);

          const newRoom: CodenamesServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [],
            gameState: initialGameState,
          };

          codenamesRooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'codenames' });

          ws.send(
            JSON.stringify({
              type: 'codenames:room_created',
              roomCode,
              gameState: newRoom.gameState,
              players: newRoom.players,
            })
          );
        }

        // 2. JOIN CODENAMES ROOM (Mobile Phone Controller or Secondary Observer)
        else if (type === 'codenames:join_room') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = codenamesRooms.get(roomCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: `Oda bulunamadı: "${roomCode}"` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';

          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer', gameType: 'codenames' });
            ws.send(
              JSON.stringify({
                type: 'codenames:room_joined',
                role: 'observer',
                roomCode,
                gameState: room.gameState,
                players: room.players,
              })
            );
          } else {
            const playerId = data.playerId || `cp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            let player = room.players.find((p) => p.id === playerId);

            if (!player) {
              player = {
                id: playerId,
                name: data.playerName?.trim() || `Ajan ${room.players.length + 1}`,
                team: data.team || 'red',
                role: data.role || 'operative',
                avatar: data.team === 'red' ? '🔴' : '🔵',
                connected: true,
              };
              room.players.push(player);
            } else {
              player.team = data.team || player.team;
              player.role = data.role || player.role;
              if (data.playerName) player.name = data.playerName.trim();
            }

            room.playerSockets.set(playerId, ws);
            clientMap.set(ws, { ws, roomCode, role: 'player', playerId, gameType: 'codenames' });

            ws.send(
              JSON.stringify({
                type: 'codenames:room_joined',
                role: 'player',
                roomCode,
                player,
                gameState: room.gameState,
                players: room.players,
              })
            );
            broadcastCodenamesRoomState(room);
          }
        }

        // 3. UPDATE PLAYER PROFILE / ROLE
        else if (type === 'codenames:update_player') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = codenamesRooms.get(client.roomCode);
          if (!room) return;

          const player = room.players.find((p) => p.id === data.playerId);
          if (player) {
            if (data.team) player.team = data.team;
            if (data.role) player.role = data.role;
            if (data.name) player.name = data.name.trim();
            broadcastCodenamesRoomState(room);
          }
        }

        // 3b. START GAME (host / TV ekrani) — lobiden ipucu asamasina gecis
        else if (type === 'codenames:start_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = codenamesRooms.get(client.roomCode);
          if (!room) return;

          if (room.gameState.phase !== 'LOBBY') return; // zaten basladi

          // Her iki takimda da en az bir lider ve bir ajan olmali, yoksa
          // oyun oynanamaz (lider ipucu veremez / ajan tahmin edemez).
          const redTeam = room.players.filter((p) => p.team === 'red');
          const blueTeam = room.players.filter((p) => p.team === 'blue');
          const problems: string[] = [];
          for (const [label, team] of [
            ['Kırmızı', redTeam],
            ['Mavi', blueTeam],
          ] as const) {
            if (!team.some((p) => p.role === 'spymaster')) problems.push(`${label} takımın lideri yok`);
            if (!team.some((p) => p.role === 'operative')) problems.push(`${label} takımda ajan yok`);
          }

          if (problems.length > 0) {
            ws.send(
              JSON.stringify({
                type: 'codenames:start_rejected',
                message: problems.join(' · '),
              })
            );
            return;
          }

          room.gameState.phase = 'CLUE_PHASE';
          broadcastCodenamesRoomState(room);
        }

        // 4. GIVE CLUE (Spymaster)
        else if (type === 'codenames:give_clue') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = codenamesRooms.get(client.roomCode);
          if (!room || room.gameState.winner) return;

          const { word, count } = data;
          if (!word) return;

          const newClue: CodenamesClue = {
            id: `clue-${Date.now()}`,
            team: room.gameState.activeTeam,
            word: word.trim().toUpperCase(),
            count: Number(count) || 1,
            timestamp: Date.now(),
          };

          room.gameState.currentClue = newClue;
          room.gameState.clues = [newClue, ...room.gameState.clues];
          room.gameState.guessesRemaining = (Number(count) || 1) + 1; // +1 Bonus guess

          broadcastCodenamesRoomState(room);
        }

        // 5. REVEAL CARD (Operative or TV Click)
        else if (type === 'codenames:reveal_card') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = codenamesRooms.get(client.roomCode);
          if (!room || room.gameState.winner) return;

          const { cardId } = data;
          const card = room.gameState.board.find((c) => c.id === cardId);
          if (!card || card.revealed) return;

          card.revealed = true;
          card.revealedBy = room.gameState.activeTeam;

          const newRedRemaining = room.gameState.board.filter((c) => c.type === 'red' && !c.revealed).length;
          const newBlueRemaining = room.gameState.board.filter((c) => c.type === 'blue' && !c.revealed).length;
          room.gameState.redRemaining = newRedRemaining;
          room.gameState.blueRemaining = newBlueRemaining;

          const activeTeam = room.gameState.activeTeam;
          const otherTeam: CodenamesTeam = activeTeam === 'red' ? 'blue' : 'red';

          // A) Assassin clicked -> instant loss
          if (card.type === 'assassin') {
            room.gameState.winner = otherTeam;
            room.gameState.winReason = 'assassin_triggered';
            room.gameState.phase = 'GAME_OVER';
            room.gameState.assassinCardId = card.id;
          }
          // B) Red agents all cleared
          else if (card.type === 'red' && newRedRemaining === 0) {
            room.gameState.winner = 'red';
            room.gameState.winReason = 'all_agents_found';
            room.gameState.phase = 'GAME_OVER';
          }
          // C) Blue agents all cleared
          else if (card.type === 'blue' && newBlueRemaining === 0) {
            room.gameState.winner = 'blue';
            room.gameState.winReason = 'all_agents_found';
            room.gameState.phase = 'GAME_OVER';
          }
          // D) Active team card found
          else if (card.type === activeTeam) {
            room.gameState.guessesRemaining -= 1;
            if (room.gameState.guessesRemaining <= 0) {
              room.gameState.activeTeam = otherTeam;
              room.gameState.currentClue = null;
              room.gameState.guessesRemaining = 0;
            }
          }
          // E) Opponent card or Civilian clicked
          else {
            room.gameState.activeTeam = otherTeam;
            room.gameState.currentClue = null;
            room.gameState.guessesRemaining = 0;
          }

          broadcastCodenamesRoomState(room);
        }

        // 6. END TURN (Operative pass)
        else if (type === 'codenames:end_turn') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = codenamesRooms.get(client.roomCode);
          if (!room || room.gameState.winner) return;

          const otherTeam: CodenamesTeam = room.gameState.activeTeam === 'red' ? 'blue' : 'red';
          room.gameState.activeTeam = otherTeam;
          room.gameState.currentClue = null;
          room.gameState.guessesRemaining = 0;

          broadcastCodenamesRoomState(room);
        }

        // 7. NEW GAME / NEXT ROUND
        else if (type === 'codenames:new_game') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = codenamesRooms.get(client.roomCode);
          if (!room) return;

          const freshState = createFreshCodenamesGame(data.settings || room.gameState.settings);
          room.gameState = freshState;
          broadcastCodenamesRoomState(room);
        }

        // =====================================================================
        // IMPOSTER LINE MULTIPLAYER WEBSOCKET DISPATCHER
        // =====================================================================

        // CREATE ROOM (Host / Observer Screen)
        else if (type === 'room:create') {
          const roomCode = generateRoomCode();
          const initialPair = getRandomWordPair();
          const newRoom: ServerRoom = {
            code: roomCode,
            observers: new Set([ws]),
            playerSockets: new Map(),
            players: [
              {
                id: 'player-host',
                name: data.hostName || 'Player 1',
                color: DEFAULT_PLAYER_PALETTE[0].color,
                colorName: DEFAULT_PLAYER_PALETTE[0].name,
                avatar: DEFAULT_PLAYER_PALETTE[0].avatar,
                isImposter: false,
                score: 0,
              },
            ],
            settings: {
              roundsPerPlayer: data.settings?.roundsPerPlayer || 2,
              drawTimeLimitSec: data.settings?.drawTimeLimitSec ?? 25,
              discussionTimeSec: data.settings?.discussionTimeSec ?? 60,
              gameMode: data.settings?.gameMode || 'different_word',
              category: data.settings?.category || 'all',
            },
            gamePhase: 'LOBBY',
            currentRoundNumber: 1,
            currentDrawingRound: 1,
            activePlayerIndex: 0,
            currentWordPair: initialPair,
            strokes: [],
            votes: {},
            roundResult: null,
            turnTimer: null,
            turnTimeRemaining: 25,
            discussionTimer: null,
            discussionTimeRemaining: 60,
          };

          rooms.set(roomCode, newRoom);
          clientMap.set(ws, { ws, roomCode, role: 'observer' });

          ws.send(
            JSON.stringify({
              type: 'room:created',
              roomCode,
              state: getSanitizedRoomState(newRoom),
            })
          );
        }

        // JOIN ROOM (as Observer or Player)
        else if (type === 'room:join') {
          const roomCode = (data.roomCode || '').toUpperCase().trim();
          const room = rooms.get(roomCode);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: `Room "${roomCode}" was not found.` }));
            return;
          }

          const role = data.role === 'observer' ? 'observer' : 'player';

          if (role === 'observer') {
            room.observers.add(ws);
            clientMap.set(ws, { ws, roomCode, role: 'observer' });
            ws.send(
              JSON.stringify({
                type: 'room:joined',
                role: 'observer',
                roomCode,
                state: getSanitizedRoomState(room),
              })
            );
            broadcastRoomState(room);
          } else {
            // Join as player
            let playerId = data.playerId;
            let existingPlayer = playerId ? room.players.find((p) => p.id === playerId) : undefined;

            if (!existingPlayer) {
              if (room.gamePhase !== 'LOBBY') {
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Game is currently in progress. You can spectate as an observer!',
                  })
                );
                return;
              }

              if (room.players.length >= 8) {
                ws.send(JSON.stringify({ type: 'error', message: 'Room is full (max 8 players).' }));
                return;
              }

              const paletteIdx = room.players.length % DEFAULT_PLAYER_PALETTE.length;
              const palette = DEFAULT_PLAYER_PALETTE[paletteIdx];
              playerId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              existingPlayer = {
                id: playerId,
                name: data.playerName?.trim() || `Player ${room.players.length + 1}`,
                color: data.playerColor || palette.color,
                colorName: data.colorName || palette.name,
                avatar: data.avatar || palette.avatar,
                isImposter: false,
                score: 0,
              };
              room.players.push(existingPlayer);
            } else {
              // Reconnect existing player
              if (data.playerName) existingPlayer.name = data.playerName;
              if (data.playerColor) existingPlayer.color = data.playerColor;
            }

            room.playerSockets.set(playerId, ws);
            clientMap.set(ws, { ws, roomCode, role: 'player', playerId });

            ws.send(
              JSON.stringify({
                type: 'room:joined',
                role: 'player',
                roomCode,
                playerId,
                state: getSanitizedRoomState(room, playerId),
              })
            );
            broadcastRoomState(room);
          }
        }

        // UPDATE PLAYER PROFILE
        else if (type === 'player:update') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          const player = room.players.find((p) => p.id === data.playerId);
          if (player) {
            if (data.name) player.name = data.name.trim();
            if (data.color) player.color = data.color;
            if (data.colorName) player.colorName = data.colorName;
            if (data.avatar) player.avatar = data.avatar;
            broadcastRoomState(room);
          }
        }

        // ADD BOT OR REMOVE PLAYER
        else if (type === 'lobby:add_bot') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'LOBBY' || room.players.length >= 8) return;

          const botIdx = room.players.filter((p) => p.isBot).length + 1;
          const paletteIdx = room.players.length % DEFAULT_PLAYER_PALETTE.length;
          const palette = DEFAULT_PLAYER_PALETTE[paletteIdx];
          const botPlayer: Player = {
            id: `bot-${Date.now()}-${botIdx}`,
            name: `Bot ${botIdx}`,
            color: palette.color,
            colorName: palette.name,
            avatar: '🤖',
            isImposter: false,
            isBot: true,
            score: 0,
          };
          room.players.push(botPlayer);
          broadcastRoomState(room);
        } else if (type === 'lobby:remove_player') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'LOBBY' || room.players.length <= 3) return;

          room.players = room.players.filter((p) => p.id !== data.playerId);
          room.playerSockets.delete(data.playerId);
          broadcastRoomState(room);
        }

        // UPDATE SETTINGS
        else if (type === 'settings:update') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          room.settings = { ...room.settings, ...data.settings };
          broadcastRoomState(room);
        }

        // START GAME ROUND
        else if (type === 'game:start') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          clearRoomTimers(room);
          const pair = data.customPair || getRandomWordPair(room.settings.category);
          room.currentWordPair = pair;
          room.strokes = [];
          room.votes = {};
          room.roundResult = null;
          room.activePlayerIndex = 0;
          room.currentDrawingRound = 1;

          // Pick 1 random imposter
          const imposterIndex = Math.floor(Math.random() * room.players.length);
          room.players = room.players.map((p, idx) => ({
            ...p,
            isImposter: idx === imposterIndex,
          }));

          room.gamePhase = 'WORD_REVEAL';
          broadcastRoomState(room);
        }

        // COMPLETE WORD REVEAL (Advance to Drawing)
        else if (type === 'game:start_drawing') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          clearRoomTimers(room);
          room.gamePhase = 'DRAWING';
          room.activePlayerIndex = 0;
          room.currentDrawingRound = 1;
          broadcastLiveStroke(room, { playerId: null, points: [], color: '#000000' });
          startTurnTimer(room);
          broadcastRoomState(room);

          // If starting player is a Bot, draw stroke
          const firstPlayer = room.players[0];
          if (firstPlayer?.isBot) {
            setTimeout(() => generateBotStroke(room, firstPlayer), 1500);
          }
        }

        // LIVE DRAWING STREAMING (Sub-16ms WebSocket broadcast to observer & players)
        else if (type === 'stroke:live_point') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'DRAWING') return;

          broadcastLiveStroke(room, {
            playerId: data.playerId,
            points: data.points,
            color: data.color,
          }, ws);
        }

        // COMMIT SINGLE STROKE
        else if (type === 'stroke:commit') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'DRAWING') return;

          const activePlayer = room.players[room.activePlayerIndex];
          // Validate that the sender is the active player or the observer host
          if (client.role === 'player' && client.playerId !== activePlayer?.id) {
            return;
          }

          const stroke: Stroke = data.stroke;
          if (stroke && stroke.points && stroke.points.length > 0) {
            room.strokes.push(stroke);
          }
          advanceDrawingTurn(room);
        }

        // SKIP / PASS TURN
        else if (type === 'turn:skip') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'DRAWING') return;

          const activePlayer = room.players[room.activePlayerIndex];
          if (client.role === 'player' && client.playerId !== activePlayer?.id) {
            return;
          }

          advanceDrawingTurn(room);
        }

        // PROCEED FROM DISCUSSION TO VOTING
        else if (type === 'discussion:proceed_to_voting') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          transitionToVoting(room);
        }

        // SUBMIT SECRET BALLOT VOTE
        else if (type === 'vote:submit') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'VOTING') return;

          const { voterId, targetId } = data;
          if (voterId && targetId && voterId !== targetId) {
            room.votes[voterId] = targetId;

            // Check if all active non-bot and bot players have voted
            const allVoted = room.players.every((p) => Boolean(room.votes[p.id]));
            if (allVoted) {
              tallyRoomVotes(room);
            } else {
              broadcastRoomState(room);
            }
          }
        }

        // FORCE TALLY VOTES (if host wants to conclude voting early)
        else if (type === 'vote:force_tally') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'VOTING') return;

          tallyRoomVotes(room);
        }

        // IMPOSTER SHOWDOWN GUESS
        else if (type === 'imposter:guess') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room || room.gamePhase !== 'IMPOSTER_GUESS') return;

          handleImposterGuessSubmission(room, data.guessWord || '');
        }

        // PING / HEARTBEAT
        else if (type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        }

        // NEXT ROUND
        else if (type === 'game:next_round') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          clearRoomTimers(room);
          room.currentRoundNumber += 1;
          const pair = getRandomWordPair(room.settings.category);
          room.currentWordPair = pair;
          room.strokes = [];
          room.votes = {};
          room.roundResult = null;
          room.activePlayerIndex = 0;
          room.currentDrawingRound = 1;

          // Rotate player order by 1 for the new round so the starting drawer continuously changes
          if (room.players.length > 1) {
            const [first, ...rest] = room.players;
            room.players = [...rest, first];
          }

          const imposterIndex = Math.floor(Math.random() * room.players.length);
          room.players = room.players.map((p, idx) => ({
            ...p,
            isImposter: idx === imposterIndex,
          }));

          room.gamePhase = 'WORD_REVEAL';
          broadcastRoomState(room);
        }

        // RETURN TO LOBBY
        else if (type === 'game:back_to_lobby') {
          const client = clientMap.get(ws);
          if (!client?.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          clearRoomTimers(room);
          room.gamePhase = 'LOBBY';
          room.strokes = [];
          room.votes = {};
          room.roundResult = null;
          room.activePlayerIndex = 0;
          room.currentDrawingRound = 1;
          broadcastRoomState(room);
        }
      } catch (err: any) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      const client = clientMap.get(ws);
      if (client?.roomCode) {
        if (client.gameType === 'colory') {
          const room = coloryRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastColoryRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = coloryRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearColoryTimer(current);
                  coloryRooms.delete(client.roomCode!);
                  forgetRoom('colory', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else if (client.gameType === 'race') {
          const room = raceRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastHorseRaceRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = raceRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearHorseRaceTimers(current);
                  raceRooms.delete(client.roomCode!);
                  forgetRoom('race', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else if (client.gameType === 'bomb') {
          const room = bombRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastBombRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = bombRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearBombTimers(current);
                  bombRooms.delete(client.roomCode!);
                  forgetRoom('bomb', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else if (client.gameType === 'bluff') {
          const room = bluffRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastBluffRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = bluffRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearBluffTimers(current);
                  bluffRooms.delete(client.roomCode!);
                  forgetRoom('bluff', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else if (client.gameType === 'quiplash') {
          const room = quiplashRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastQuiplashRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = quiplashRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearQuiplashTimers(current);
                  quiplashRooms.delete(client.roomCode!);
                  forgetRoom('quiplash', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else if (client.gameType === 'trivia') {
          const room = triviaRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastTriviaRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = triviaRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearTriviaTimers(current);
                  triviaRooms.delete(client.roomCode!);
                  forgetRoom('trivia', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else if (client.gameType === 'codenames') {
          const room = codenamesRooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
              const p = room.players.find((pl) => pl.id === client.playerId);
              if (p) p.connected = false;
            }
            broadcastCodenamesRoomState(room);

            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = codenamesRooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  codenamesRooms.delete(client.roomCode!);
                  forgetRoom('codenames', client.roomCode!);
                }
              }, 180000);
            }
          }
        } else {
          const room = rooms.get(client.roomCode);
          if (room) {
            if (client.role === 'observer') {
              room.observers.delete(ws);
            } else if (client.playerId) {
              room.playerSockets.delete(client.playerId);
            }

            // Broadcast state so other players know connection status without kicking player
            broadcastRoomState(room);

            // Grace period: Only delete room if truly empty for 3 continuous minutes
            if (room.observers.size === 0 && room.playerSockets.size === 0) {
              setTimeout(() => {
                const current = rooms.get(client.roomCode!);
                if (current && current.observers.size === 0 && current.playerSockets.size === 0) {
                  clearRoomTimers(current);
                  rooms.delete(client.roomCode!);
                  forgetRoom('imposter', client.roomCode!);
                }
              }, 180000);
            }
          }
        }
      }
      clientMap.delete(ws);
    });
  });

  // Keep-alive heartbeat: proxy/load balancer'larin bosta kalan WS baglantisini
  // dusurmesini engeller (Railway, Cloud Run, Vercel edge — hepsinde gerekli).
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({ type: 'heartbeat' }));
        } catch {}
      }
    });
  }, 20000);

  // ---------------------------------------------------------------------------
  // Kalicilik: acilista geri yukle, periyodik snapshot al
  // ---------------------------------------------------------------------------
  await restoreRoomsFromSnapshots();

  let snapshotInterval: NodeJS.Timeout | null = null;
  let pruneInterval: NodeJS.Timeout | null = null;

  if (isPersistenceEnabled() && SNAPSHOT_INTERVAL_MS > 0) {
    snapshotInterval = setInterval(() => {
      void snapshotAllRooms();
    }, SNAPSHOT_INTERVAL_MS);

    // Saatte bir 12 saatten eski snapshot'lari temizle
    pruneInterval = setInterval(() => {
      void pruneStaleSnapshots(12);
    }, 60 * 60 * 1000);

    console.log(`[persistence] Snapshot dongusu aktif (her ${SNAPSHOT_INTERVAL_MS / 1000}s).`);
  }

  // ---------------------------------------------------------------------------
  // Graceful shutdown — deploy sirasinda state'i kaydet, istemcileri reconnect'e yolla
  // ---------------------------------------------------------------------------
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] ${signal} alindi, kapanis basliyor...`);

    clearInterval(heartbeatInterval);
    if (snapshotInterval) clearInterval(snapshotInterval);
    if (pruneInterval) clearInterval(pruneInterval);

    try {
      await snapshotAllRooms();
      console.log('[server] Son snapshot alindi.');
    } catch (error) {
      console.error('[server] Kapanis snapshot hatasi:', error);
    }

    // Istemcilere "yeniden baglan" sinyali gonder ve baglantilari kapat
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({ type: 'server:restarting' }));
          client.close(1012, 'Server restarting');
        } catch {}
      }
    });

    server.close(() => {
      console.log('[server] HTTP sunucusu kapandi.');
      process.exit(0);
    });

    // Zorla cikis emniyeti
    setTimeout(() => process.exit(0), 8000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`FiestaLoco game server calisiyor: http://0.0.0.0:${PORT}`);
    console.log(
      `[server] mod=${IS_PRODUCTION ? 'production' : 'development'} | ` +
        `izinli origin=${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : '(hepsi)'} | ` +
        `kalicilik=${isPersistenceEnabled() ? 'acik' : 'kapali'}`,
    );
  });
}

startServer();
