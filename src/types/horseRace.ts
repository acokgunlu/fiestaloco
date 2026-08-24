/**
 * At Yarışı — tip tanımları
 * ==========================
 * Her oyuncu BİR AT'tır. Tur akışı:
 *
 *   BETTING   → herkes gizlice bir ata bahis koyar (kendi atı dahil)
 *   COUNTDOWN → 3-2-1
 *   RACING    → oyuncular telefonlarına basarak KENDİ atlarını koşturur
 *   RESULT    → sıralama + bahis ödemeleri
 *
 * `totalRaces` tur sonunda en çok parası olan kazanır.
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
export const BET_AMOUNTS = [100, 250, 500] as const;

export interface HorseRaceBet {
  horseId: string;
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
  /** Bu turda kazanılan/kaybedilen net tutar (sonuç ekranı için). */
  lastDelta?: number;
  /** Bu turdaki bahis. Oylama gizliliği için BETTING sırasında dışarı sızmaz. */
  bet?: HorseRaceBet | null;
  /** Kazanılan yarış sayısı (oran hesabı + rozet). */
  wins: number;
  /** Doğru bilinen bahis sayısı. */
  correctBets: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface Horse {
  /** At kimliği = sahibinin oyuncu kimliği. */
  id: string;
  ownerId: string;
  /** Ekranda görünen at adı (oyuncu adından türetilir). */
  name: string;
  emoji: string;
  color: string;
  /** 0..TRACK_LENGTH */
  progress: number;
  /** Bitiş sırası (1 = birinci). Henüz bitirmediyse null. */
  rank: number | null;
  /** Bu yarışta atılan toplam dokunuş (TV'de tempo göstergesi). */
  taps: number;
  /** Bahis oranı — düşük oran = favori. */
  odds: number;
  /**
   * Bu yarışa özel form katsayısı (0.70–1.40). Gerçek at yarışındaki
   * "atın günü" etkisi: aynı oyuncu her yarışta aynı hızda koşmaz.
   * Dengeyi bu sağlıyor — yoksa en hızlı basan HER yarışı kazanıyordu.
   */
  form: number;
}

export interface HorseRaceSettings {
  /** Kaç yarış oynanacak (varsayılan 3). */
  totalRaces: number;
  /** Bahis aşaması süresi (saniye). */
  bettingSeconds: number;
}

export interface HorseRaceGameState {
  phase: HorseRacePhase;
  roomCode?: string;
  isOnline?: boolean;
  currentRace: number;
  settings: HorseRaceSettings;
  horses: Horse[];
  /** BETTING ve COUNTDOWN için geri sayım. */
  timerSeconds: number;
  /** Bahsini vermiş oyuncular (isimler gizli kalır, sadece "verdi" bilgisi). */
  betPlacedPlayerIds: string[];
  /** Yarış bittiğinde sıralama (at kimlikleri, 1.'den sonuncuya). */
  finishOrder: string[];
  /** Sonuç ekranı için tur özeti. */
  lastRaceSummary?: {
    winnerHorseId: string | null;
    payouts: Record<string, { bet: HorseRaceBet | null; won: boolean; delta: number }>;
  };
  winnerPlayerId: string | null;
}
