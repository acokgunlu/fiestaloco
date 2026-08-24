/**
 * Tam Zamanında — tip tanımları
 * ==============================
 * TV "ŞİMDİ" der ve sayaç GİZLENİR. Herkes içinden sayar ve hedef süre
 * dolduğunu düşündüğü an telefonundaki tek butona basar. Sapma milisaniye
 * cinsinden ölçülür; en yakın basan turu alır.
 *
 *   LOBBY     → oyuncular giriyor
 *   BRIEFING  → turun modu + hedef süre duyurulur ("TAM 10 SANİYE")
 *   COUNTDOWN → 3 · 2 · 1
 *   RUNNING   → sayaç gizli, herkes basıyor  (EKRANDA HİÇBİR ŞEY OYNAMAZ)
 *   REVEAL    → zaman çizgisi: kim nereye düştü
 *   GAME_OVER
 *
 * NOT: Sunucuda tutulan her alan düz obje/dizi olmalı (Set/Map YOK) —
 * serializeRoom() bunları eler.
 */

export type TimingPhase =
  | 'LOBBY'
  | 'BRIEFING'
  | 'COUNTDOWN'
  | 'RUNNING'
  | 'REVEAL'
  | 'GAME_OVER';

/**
 * Tur modu.
 *   EXACT   — hedefe en yakın kazanır (erken ya da geç fark etmez)
 *   NO_OVER — hedefi GEÇEN yanar; geçmeyenler arasında en yakın kazanır
 *
 * İki mod aynı beceriyi farklı yönde bükiyor: EXACT'ta ortalamaya oynarsın,
 * NO_OVER'da bilerek erken kalman gerekir. Aynı turların tekrarı
 * gibi hissettirmemesinin tek sebebi bu.
 */
export type TimingMode = 'EXACT' | 'NO_OVER';

export interface TimingPress {
  playerId: string;
  /** Gecikme telafisi UYGULANMIŞ gerçek süre (ms). Puanlama bunu kullanır. */
  elapsedMs: number;
  /** Sunucunun ham ölçümü — telafi öncesi (ms). Şeffaflık için tutulur. */
  rawMs: number;
  /** Düşülen gidiş-dönüş gecikmesi (ms). */
  latencyMs: number;
  /** elapsedMs - targetMs. Negatif = erken bastı. */
  errorMs: number;
  absErrorMs: number;
  /** NO_OVER modunda hedefi geçtiyse true — puan almaz. */
  burned: boolean;
  points: number;
  /** 1 = en yakın. 0 = sıralamaya girmedi (yandı ya da hiç basmadı). */
  rank: number;
}

export interface TimingPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  score: number;
  lastPoints?: number;
  /** Bu turda bastı mı. RUNNING sırasında BAŞKALARINA sızmaz. */
  pressed?: boolean;
  /** Kaç turda birinci oldu. */
  roundsWon: number;
  /** En iyi (en düşük) mutlak sapma — ms. */
  bestErrorMs?: number;
  connected?: boolean;
  isHost?: boolean;
}

export interface TimingSettings {
  totalRounds: number;
  /** Hedefin duyurulduğu ekranın süresi (saniye). */
  briefingSeconds: number;
  /** 3-2-1 geri sayımı (saniye). */
  countdownSeconds: number;
}

export interface TimingGameState {
  phase: TimingPhase;
  roomCode?: string;
  isOnline?: boolean;
  currentRound: number;
  settings: TimingSettings;

  /** Bu turun modu. */
  mode: TimingMode;
  /** Bu turun hedef süresi (ms). Gizli değil — oyuncu bilmek zorunda. */
  targetMs: number;

  /** BRIEFING / COUNTDOWN geri sayımı. RUNNING'de HER ZAMAN 0. */
  timerSeconds: number;

  /** Bu tura dahil olan oyuncular (COUNTDOWN anında bağlı olanlar). */
  activePlayerIds: string[];
  /**
   * Basmış oyuncular. RUNNING sırasında istemciye BOŞ gönderilir:
   * "3 kişi bastı" bilgisi tek başına bir saat gibi çalışır ve geç basanlara
   * haksız avantaj verir.
   */
  pressedPlayerIds: string[];

  /** REVEAL'da dolu: en yakından uzağa sıralı. */
  results?: TimingPress[];
  winnerPlayerId: string | null;
}
