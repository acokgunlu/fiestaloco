/**
 * Colory — tip tanımları
 * =======================
 * TV bir renk gösterir, kaybolur, herkes telefonundan o rengi hafızasından
 * seçmeye çalışır. En yakın tutturan kazanır.
 *
 *   SHOWING  → hedef renk TV'de tam ekran (birkaç saniye)
 *   GUESSING → renk kaybolur, telefonlarda seçim
 *   REVEAL   → hedef + herkesin tahmini yan yana, en yakından uzağa
 *
 * NOT: Sunucuda tutulan her alan düz obje/dizi olmalı (Set/Map YOK) —
 * serializeRoom() bunları eler.
 */

export type ColoryPhase = 'LOBBY' | 'SHOWING' | 'GUESSING' | 'REVEAL' | 'GAME_OVER';

/** HSL — hem hedef üretimi hem oyuncu seçimi bu uzayda. */
export interface Hsl {
  /** 0-360 */
  h: number;
  /** 0-100 */
  s: number;
  /** 0-100 */
  l: number;
}

export interface ColoryGuess {
  playerId: string;
  hsl: Hsl;
  /** Algısal fark (CIE Lab ΔE76). Küçük = yakın. */
  deltaE: number;
  points: number;
  /** Bu turdaki sıra (1 = en yakın). */
  rank: number;
}

export interface ColoryPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  score: number;
  /** Bu turda kazanılan puan. */
  lastPoints?: number;
  /** Bu turdaki tahmin — GUESSING sırasında başkalarına sızmaz. */
  guess?: Hsl | null;
  /** Kaç turda birinci oldu. */
  roundsWon: number;
  /** En iyi (en düşük) ΔE. */
  bestDeltaE?: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface ColorySettings {
  totalRounds: number;
  /** Hedef rengin ekranda kalma süresi (saniye). */
  showSeconds: number;
  /** Tahmin süresi (saniye). */
  guessSeconds: number;
}

export interface ColoryGameState {
  phase: ColoryPhase;
  roomCode?: string;
  isOnline?: boolean;
  currentRound: number;
  settings: ColorySettings;
  /**
   * Hedef renk. GUESSING sırasında istemciye GÖNDERİLMEZ — gönderilseydi
   * oyuncu konsoldan bakıp birebir tutturabilirdi.
   */
  target?: Hsl | null;
  /** Tahminini vermiş oyuncular (içerik gizli). */
  guessedPlayerIds: string[];
  timerSeconds: number;
  /** REVEAL'da dolu: sıralanmış tahminler. */
  results?: ColoryGuess[];
  winnerPlayerId: string | null;
}
