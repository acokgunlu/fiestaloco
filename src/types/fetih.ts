import type { QuizCategoryId } from '../data/quizBank';
import type { PublicQuestion, QuizPick, QuizVote } from './quizRound';

/**
 * İl İl Fetih — tip tanımları
 * ===========================
 * Risk ile Catan arası bir Türkiye haritası oyunu. Başlangıç tamamen
 * rastgele: herkese dağınık 3 il, tarafsız illere 1-3 asker ve her ile
 * 2-12 arası bir üretim zarı numarası.
 *
 * Bir tur:
 *   VOTE     → 3 kategoriden biri oylanıyor
 *   QUESTION → doğru bilen asker kazanıyor; en hızlı doğru bilen fazladan
 *              asker, ikinci saldırı hakkı ve ilk hamle önceliği alıyor
 *   ROLL     → iki zar: numarası tutan her il sahibine 1 asker üretiyor
 *              (Catan). 7 gelirse eşkıya baskını.
 *   ORDERS   → herkes gizlice yedek askerini bir iline yerleştiriyor ve
 *              komşu bir ile saldırı emri veriyor
 *   RESOLVE  → emirler öncelik sırasıyla uygulanıyor, zar savaşları (Risk)
 *
 * İlsiz kalan oyuncu elenmiyor: boş bir ilde 3 askerle yeniden doğuyor.
 * Parti oyununda kimse ilk 10 dakikada seyirci kalmamalı.
 */

export type FetihPhase = 'LOBBY' | 'VOTE' | 'QUESTION' | 'ROLL' | 'ORDERS' | 'RESOLVE' | 'GAME_OVER';

export interface FetihPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  /** Sahip olunan il sayısı — sıralama ve maç kaydı bunu kullanıyor. */
  score: number;
  /** Bu tur yerleştirilmeyi bekleyen asker. */
  reserve: number;
  /** Bu tur kullanılabilecek saldırı hakkı. */
  attacks: number;
  correctCount: number;
  respawns: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface FetihTile {
  owner: string | null;
  troops: number;
  /** Üretim numarası (2-12, 7 hariç). */
  token: number;
}

export interface FetihAttackOrder {
  from: number;
  to: number;
}

export interface FetihBattle {
  playerId: string;
  from: number;
  to: number;
  defenderId: string | null;
  attLoss: number;
  defLoss: number;
  conquered: boolean;
  /** Emir uygulanamadı (kaynak il elden çıktı, asker yetmedi…). */
  cancelled: boolean;
}

export interface FetihRoll {
  dice: [number, number];
  /** Oyuncu başına üretilen asker. */
  gains: Record<string, number>;
  /** 7 geldiğinde eşkıyanın asker götürdüğü iller. */
  raided: Array<{ playerId: string; province: number }>;
}

export interface FetihQuizResult {
  correct: number;
  fact?: string;
  picks: QuizPick[];
  fastestId: string | null;
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

  /** İl plakası → durum. */
  tiles: Record<number, FetihTile>;

  vote: QuizVote | null;
  category: QuizCategoryId | null;
  question: PublicQuestion | null;
  answeredIds: string[];
  quiz: FetihQuizResult | null;

  roll: FetihRoll | null;
  /** Emrini gönderenler (emrin içeriği çözülene kadar gizli). */
  submittedIds: string[];
  /** Hamle sırası: en hızlı doğru bilen önce. */
  initiative: string[];
  battles: FetihBattle[];

  winnerPlayerId: string | null;
}
