/**
 * Viraj — tip tanımları
 * ======================
 * Tepeden görünen bir pistte gerçek zamanlı yarış. Her virajda HERKES AYNI
 * ANDA ve gizlice bir çizgi seçer; sonuçlar hep birlikte açılır.
 *
 *   LOBBY     → oyuncular giriyor
 *   GRID      → başlangıç ızgarası, tur/pist tanıtımı
 *   CORNER    → viraj kararı (herkes aynı anda seçiyor)
 *   RESOLVE   → seçimler açılıyor, arabalar viraja giriyor
 *   FINISH    → yarış bitti, sıralama
 *   GAME_OVER → şampiyona bitti
 *
 * NOT: Sunucuda tutulan her alan düz obje/dizi olmalı (Set/Map YOK) —
 * serializeRoom() bunları eler.
 */

export type VirajPhase = 'LOBBY' | 'GRID' | 'CORNER' | 'RESOLVE' | 'FINISH' | 'GAME_OVER';

/** Viraja giriş çizgisi. */
export type VirajLine = 'SAFE' | 'NORMAL' | 'ATTACK';

/** Hata büyüklüğü — ikili "kaza" değil, kademeli. */
export type VirajMistake = 'NONE' | 'WIDE' | 'LOCKUP' | 'OFF';

export interface VirajCar {
  playerId: string;
  /** Yarış başından beri geçen süre (sn). Küçük = önde. */
  elapsed: number;
  /** Lastik/fren ısısı 0-100. Yükseldikçe hata ihtimali kare olarak artar. */
  heat: number;
  /** Bu virajdaki seçim — RESOLVE'a kadar başkalarına SIZMAZ. */
  line?: VirajLine | null;
  /** Son virajda ne oldu. */
  lastMistake: VirajMistake;
  /** Son virajda kazanılan/kaybedilen süre (sn, negatif = kazanç). */
  lastDelta: number;
  /** Slipstream aldı mı (görsel geri bildirim için). */
  lastTow: boolean;
  /** Pist üzerindeki konum 0-1 (TV çizimi için). */
  progress: number;
  /** Anlık sıra (1 = lider). */
  position: number;
  /** Yarışı bitirdiği sıra; 0 = henüz bitmedi. */
  finishRank: number;
}

export interface VirajPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  /** Şampiyona puanı (yarış sonu sıralamasından). */
  score: number;
  lastPoints?: number;
  racesWon: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface VirajSettings {
  /** Şampiyonadaki yarış sayısı. */
  totalRaces: number;
  /** Yarış başına tur. */
  laps: number;
  /** Viraj kararı için verilen süre (saniye). */
  decideSeconds: number;
}

export interface VirajGameState {
  phase: VirajPhase;
  roomCode?: string;
  isOnline?: boolean;

  currentRace: number;
  settings: VirajSettings;

  /** Pistin adı ve viraj sayısı — her yarışta değişir. */
  trackName: string;
  cornerCount: number;
  /** Kaçıncı turdayız (1..laps). */
  lap: number;
  /** Bu turun kaçıncı virajı (1..cornerCount). */
  cornerIndex: number;
  /** Bu virajın adı/karakteri — kararı renklendirir. */
  cornerLabel: string;
  /** Bu viraj ne kadar "ödüllü": saldırının kazandıracağı süre çarpanı. */
  cornerSeverity: number;

  timerSeconds: number;

  /** Seçimini yapmış oyuncular (İÇERİK gizli). */
  decidedPlayerIds: string[];

  cars: VirajCar[];
  /** FINISH'te dolu: bitiş sırası. */
  results?: Array<{ playerId: string; rank: number; totalTime: number; points: number; mistakes: number }>;
  winnerPlayerId: string | null;
}
