/**
 * Kapışma — tip tanımları
 * ========================
 * ÜSTTEN BAKIŞLI kapalı devre yarışı. Herkes kendi telefonunda direksiyon
 * kırıyor, TV seyirci ekranı. Pistin TAMAMI ekranda olduğu için kamera yok:
 * ne telefonda ne TV'de takip kamerası gerekiyor.
 *
 * MİMARİ — neden araba telefonda simüle ediliyor:
 * Arabayı sunucuda simüle edip TV'den sürdürmek, direksiyon ile tepki arasına
 * ağ gecikmesi sokar ve sürüş hissi ölür. Araba KENDİ telefonunda simüle
 * edilince oyuncunun girdisi ile arabanın tepkisi arasında sıfır gecikme olur;
 * telefon yalnızca konumunu saniyede ~15 kez sunucuya bildirir, sunucu da
 * TV'ye aktarır. TV 100 ms geride kalır ve bu hiç sorun değildir — TV'den
 * kimse sürmüyor.
 *
 * Bedeli: araba konumunda telefon yetkili, yani hile teorik olarak mümkün.
 * Sunucu makul hız sınırıyla kaba hileyi eliyor (bkz. pistLogic.isPlausible).
 *
 *   LOBBY     → oyuncular giriyor
 *   COUNTDOWN → 3-2-1, yol tohumu dağıtıldı
 *   RACING    → herkes sürüyor
 *   FINISH    → sıralama
 *   GAME_OVER → şampiyona bitti
 */

export type KapismaPhase = 'LOBBY' | 'COUNTDOWN' | 'RACING' | 'FINISH' | 'GAME_OVER';

export interface KapismaCar {
  playerId: string;
  /** Dünya konumu — pist 1000x620'lik sabit bir kutuda. */
  x: number;
  y: number;
  /** Burnun baktığı yön (radyan). TV arabayı buna göre döndürür. */
  heading: number;
  speed: number;
  /** Asfaltın dışında mı — TV'de toz efekti için. */
  offRoad: boolean;
  /** Tamamlanan tur. */
  lap: number;
  /** Merkez çizgi üzerindeki en yakın nokta indeksi. */
  idx: number;
  /**
   * SIRALAMA ANAHTARI: lap * noktaSayısı + idx.
   * Tek sayıya indirgenmiş ilerleme — iki arabayı karşılaştırmak için hem
   * turu hem tur içindeki konumu ayrı ayrı kıyaslamak gerekmiyor.
   */
  progress: number;
  /** Bitirdiyse süre (sn), yoksa 0. */
  finishTime: number;
  finishRank: number;
  position: number;
}

export interface KapismaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  score: number;
  lastPoints?: number;
  racesWon: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface KapismaSettings {
  totalRaces: number;
  /** Yarışın tur sayısı. */
  laps: number;
}

export interface KapismaGameState {
  phase: KapismaPhase;
  roomCode?: string;
  isOnline?: boolean;

  currentRace: number;
  settings: KapismaSettings;

  /**
   * Pist tohumu. HERKESE AYNI gönderilir — devre bundan türetildiği için
   * bütün oyuncular ve TV birebir aynı pisti çizer ve sürer. Adalet buna
   * bağlı; pistin kendisi ağdan geçmiyor, yalnızca tek bir sayı geçiyor.
   */
  seed: number;
  /** Yarışın sunucu saatiyle başladığı an (ms). */
  startedAt: number;

  timerSeconds: number;
  cars: KapismaCar[];
  results?: Array<{ playerId: string; rank: number; time: number; points: number }>;
  winnerPlayerId: string | null;
}
