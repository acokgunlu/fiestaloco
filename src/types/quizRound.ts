import type { QuizCategoryId } from '../data/quizBank';

/**
 * Kale Kuşatması ile İl İl Fetih'in ORTAK soru turu parçaları.
 * Her iki oyunda da tur aynı iki adımla açılıyor: kategori oylaması, soru.
 */

/** Oylama: 3 kategori, oyuncu başına tek oy. Oylar açık — TV sayıları canlı gösteriyor. */
export interface QuizVote {
  options: QuizCategoryId[];
  votes: Record<string, QuizCategoryId>;
}

/** Soru sırasında herkese giden hali — doğru şık YOK. */
export interface PublicQuestion {
  id: string;
  category: QuizCategoryId;
  q: string;
  o: string[];
}

/** Bir oyuncunun cevabı. `ms` sorunun açılışından cevaba geçen süre. */
export interface QuizPick {
  playerId: string;
  choice: number | null;
  ms: number | null;
  correct: boolean;
}
