import type { QuizCategoryId } from '../data/quizBank';
import type { GalaxyCell } from '../data/galaxyLogic';
import type { PublicQuestion, QuizPick, QuizVote } from './quizRound';

/**
 * Galaksi — tip tanımları
 * =======================
 * İç kimlik 'fetih' kaldı (yönetim panelindeki gizleme ayarı, maç kayıtları ve
 * oda snapshot'ları bu kimliğe bağlı); oyuncuya görünen ad Galaksi.
 *
 *   LOBBY     → oyuncular giriyor
 *   PICK      → herkes sisli galakside bir ana yıldız seçiyor
 *   VOTE      → 3 kategoriden biri oylanıyor
 *   QUESTION  → soru: doğru 2, yanlış 1 enerji
 *   ANSWER    → doğru cevap ve hamle sırası
 *   ORDERS    → herkes telefondan hamlesini planlıyor (komşu sektörlere)
 *   RESOLVE   → hamleler sırayla oynanıyor
 *   DUEL      → rakip sektörüne girildi: ikisine aynı 4 şıklı soru
 *   GAME_OVER → turlar bitti
 */

export type FetihPhase = 'LOBBY' | 'PICK' | 'VOTE' | 'QUESTION' | 'ANSWER' | 'ORDERS' | 'RESOLVE' | 'DUEL' | 'GAME_OVER';

export interface FetihPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  /** Sektör 1 + gezegen 3 puan — sıralama ve maç kaydı bunu kullanıyor. */
  score: number;
  sectors: number;
  planets: number;
  /** Bu tur harcanabilecek enerji (adım sayısı). */
  energy: number;
  correctCount: number;
  connected?: boolean;
  isHost?: boolean;
}

export type DuelReason = 'only' | 'none' | 'asteroid' | 'faster';

export interface FetihDuel {
  attackerId: string;
  defenderId: string;
  cell: number;
  question: PublicQuestion;
  answeredIds: string[];
  stage: 'question' | 'reveal';
  /** Açıklamada dolu. */
  correct?: number;
  picks?: Array<{ playerId: string; choice: number | null; ms: number | null }>;
  winnerId?: string;
  reason?: DuelReason;
}

/** TV günlüğü — metin istemcide, dile göre kuruluyor. */
export interface FetihLogEntry {
  playerId: string;
  kind: 'capture' | 'hole' | 'duelWin' | 'duelLoss' | 'homeFall' | 'cancel' | 'respawn';
  cell: number;
  otherId?: string;
  count?: number;
}

export interface FetihSettings {
  totalRounds: number;
}

export interface FetihGameState {
  phase: FetihPhase;
  roomCode?: string;
  isOnline?: boolean;
  gameId: number;

  round: number;
  settings: FetihSettings;
  timerSeconds: number;

  radius: number;
  cells: GalaxyCell[];

  vote: QuizVote | null;
  category: QuizCategoryId | null;
  question: PublicQuestion | null;
  answeredIds: string[];
  /** ANSWER fazında: doğru şık ve kim bildi. */
  quiz: { correct: number; fact?: string; picks: QuizPick[] } | null;

  /** Hamle sırası: doğru bilenler hızına göre, sonra kalanlar. */
  initiative: string[];
  submittedIds: string[];
  /** Şu an hamlesi oynanan oyuncu. */
  moverId: string | null;
  /** Son oynanan adım — TV bunu okla gösteriyor. */
  lastMove: { playerId: string; from: number; to: number } | null;
  duel: FetihDuel | null;
  log: FetihLogEntry[];

  winnerPlayerId: string | null;
}
