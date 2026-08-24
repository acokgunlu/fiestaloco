/**
 * At Yarışı (Ganyan) — tip tanımları
 * ===================================
 * Klasik bahis oyunu: atlar KENDİ koşar, oyuncular yalnızca bahis oynar.
 * Dokunma/refleks yok — bildiğin ganyan.
 *
 *   BETTING   → herkes gizlice kuponunu doldurur (ganyan / plase / ikili)
 *   COUNTDOWN → 3-2-1
 *   RACING    → yarış TV'de akar
 *   RESULT    → ödemeler
 *
 * `totalRaces` tur sonunda kasası en kalabalık olan kazanır.
 *
 * NOT: Sunucuda tutulan her alan düz obje/dizi olmalı (Set/Map YOK) —
 * serializeRoom() bunları eler ve restart dayanıklılığı bozulur.
 */

export type HorseRacePhase =
  | 'LOBBY'
  | 'BETTING'
  | 'COUNTDOWN'
  | 'RACING'
  | 'ROUND_RESULT'
  | 'GAME_OVER';

/** Pistin uzunluğu (ilerleme birimi). */
export const TRACK_LENGTH = 100;

/** Seçilebilir bahis miktarları. */
export const BET_AMOUNTS = [100, 250, 500, 1000] as const;

/**
 * Bahis türleri — gerçek ganyan kuponundaki gibi.
 *  ganyan : birinci gelecek atı bil          (yüksek risk, yüksek ödeme)
 *  plase  : ilk İKİ'ye girecek atı bil       (düşük risk, düşük ödeme)
 *  ikili  : birinci VE ikinciyi sırayla bil  (çok yüksek ödeme)
 */
export type BetKind = 'ganyan' | 'plase' | 'ikili';

export interface HorseRaceBet {
  kind: BetKind;
  /** ganyan/plase için 1 at, ikili için sırayla 2 at. */
  horseIds: string[];
  amount: number;
}

export interface HorseRacePlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  /** Kümülatif para — oyunun skoru budur. */
  money: number;
  /** Bu turda kazanılan/kaybedilen net tutar. */
  lastDelta?: number;
  /** Bu turdaki kupon. BETTING sırasında başkalarına sızmaz. */
  bet?: HorseRaceBet | null;
  /** Tutan kupon sayısı. */
  correctBets: number;
  /** En büyük tek kazanç (rozet/övünme için). */
  biggestWin: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface RaceHorse {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /**
   * GİZLİ gerçek güç (0.80–1.25). İstemciye GÖNDERİLMEZ — gönderilseydi
   * favoriyi hesaplamak bahsi anlamsız kılardı. Oyuncu bunu yalnızca
   * oranlardan ve form çizelgesinden okur.
   */
  strength: number;
  /** Ganyan oranı (birinci gelirse ödeme çarpanı). */
  odds: number;
  /** Plase oranı (ilk ikiye girerse). */
  placeOdds: number;
  /** Önceki yarışlardaki dereceler — form çizelgesi. */
  form: number[];
  /** 0..TRACK_LENGTH */
  progress: number;
  /** Bitiş sırası (1 = birinci). */
  rank: number | null;
}

export interface HorseRaceSettings {
  totalRaces: number;
  bettingSeconds: number;
}

export interface PayoutDetail {
  bet: HorseRaceBet | null;
  won: boolean;
  delta: number;
  /** Ödeme çarpanı (kazandıysa). */
  multiplier?: number;
}

export interface HorseRaceGameState {
  phase: HorseRacePhase;
  roomCode?: string;
  isOnline?: boolean;
  currentRace: number;
  settings: HorseRaceSettings;
  horses: RaceHorse[];
  /** exactaOdds[i][j] = i birinci, j ikinci gelirse ikili ödeme çarpanı. */
  exactaOdds: number[][];
  timerSeconds: number;
  /** Kuponunu vermiş oyuncular (içeriği gizli). */
  betPlacedPlayerIds: string[];
  /** Yarış sonunda sıralama (at kimlikleri, 1.'den sonuncuya). */
  finishOrder: string[];
  lastRaceSummary?: {
    firstId: string | null;
    secondId: string | null;
    payouts: Record<string, PayoutDetail>;
  };
  winnerPlayerId: string | null;
}
