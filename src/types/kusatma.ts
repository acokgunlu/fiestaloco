import type { QuizCategoryId } from '../data/quizBank';
import type { PublicQuestion, QuizPick, QuizVote } from './quizRound';

/**
 * Kale Kuşatması — tip tanımları
 * ==============================
 * İki takım, iki kale. Her tur oyuncular kategori oylar, soru gelir; doğru
 * cevaplar karşı takımın surundan can götürür. Hızlı cevap daha çok vurur.
 * Her takımın oyun boyunca TEK mancınık hakkı var: kurulduğu turda takımın
 * verdiği hasar iki katına çıkıyor.
 *
 *   LOBBY     → oyuncular giriyor, takım seçiyor
 *   VOTE      → 3 kategoriden biri oylanıyor
 *   QUESTION  → soru, 15 sn
 *   REVEAL    → doğru cevap, hasar, surlar
 *   GAME_OVER → bir sur yıkıldı ya da turlar bitti
 */

export type KusatmaPhase = 'LOBBY' | 'VOTE' | 'QUESTION' | 'REVEAL' | 'GAME_OVER';
export type KusatmaTeam = 'red' | 'blue';

export interface KusatmaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  team: KusatmaTeam;
  /** Oyun boyunca karşı sura verdiği hasar (mancınık çarpanı hariç). */
  score: number;
  correctCount: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface KusatmaSettings {
  totalRounds: number;
}

export interface KusatmaPick extends QuizPick {
  team: KusatmaTeam;
  /** Bu oyuncunun katkısı (takım ortalamasına girmeden önce). */
  damage: number;
}

export interface KusatmaRoundResult {
  correct: number;
  fact?: string;
  picks: KusatmaPick[];
  /** Bu tur takımın KARŞI sura verdiği hasar. */
  damage: Record<KusatmaTeam, number>;
  /** Bu tur mancınık ateşlendi mi. */
  catapult: Record<KusatmaTeam, boolean>;
}

export interface KusatmaGameState {
  phase: KusatmaPhase;
  roomCode?: string;
  isOnline?: boolean;
  /** Her yeni oyunda değişiyor — maç kaydının tekrarını ayırt etmek için. */
  gameId: number;

  round: number;
  settings: KusatmaSettings;
  timerSeconds: number;

  walls: Record<KusatmaTeam, number>;
  catapultUsed: Record<KusatmaTeam, boolean>;
  /** Bu tur için kurulmuş mancınık — açıklamada ateşlenip "kullanıldı"ya dönüyor. */
  catapultArmed: Record<KusatmaTeam, boolean>;

  vote: QuizVote | null;
  category: QuizCategoryId | null;
  question: PublicQuestion | null;
  answeredIds: string[];
  result: KusatmaRoundResult | null;

  winnerTeam: KusatmaTeam | 'draw' | null;
  /** Kazanan takımda en çok hasar veren — maç kaydı için. */
  winnerPlayerId: string | null;
}
