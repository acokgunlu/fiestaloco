/**
 * At Yarışı — saf yarış mantığı
 * ==============================
 * React yok, DOM yok, WebSocket yok. Sunucu ve tek-cihaz modu AYNI kuralları
 * kullansın diye ayrı modül (triviaBoard.ts ile aynı yaklaşım).
 */
import {
  Horse,
  HorseRaceBet,
  HorseRacePlayer,
  TRACK_LENGTH,
} from '../types/horseRace';

/** Yarış motoru saniyede kaç kez ilerler. */
export const TICK_MS = 100;
/** Tur başına en fazla süre — kimse bitiremezse yarış burada kesilir. */
export const MAX_RACE_MS = 45_000;

/**
 * Hız ayarları. Hedef: dokunmayan bir oyuncu bile ~27 sn'de bitirsin (kimse
 * ekranda asılı kalmasın), hızlı basan ~12 sn'de. Aradaki fark belirleyici
 * ama rastgelelik sayesinde yavaş oyuncunun da şansı var.
 */
/*
 * DENGE NOTU — bu sayilar 600 yarislik simulasyonla secildi.
 * Ilk denemede (base .20 / tap .55 / jitter .35, form yok) en hizli basan
 * yarislarin %100'unu kaziniyordu: kimsenin sansi yoktu ve bahis anlamsizdi.
 * Simdiki degerlerle kazanma oranlari — dokunmayan %10, yavas %15, orta %29,
 * hizli %47; ortalama yaris 17 sn. Emek belirleyici ama herkes umutlu.
 */
const BASE_PER_TICK = 0.28;      // dokunmasan bile ilerlersin
const TAP_VALUE = 0.16;          // her dokunuş
const JITTER_MAX = 0.80;         // tick başına rastgele katkı
/** Yarış başına at formu — "atın günü". */
const FORM_MIN = 0.70;
const FORM_MAX = 1.40;
/** Tek tick'te sayılacak en fazla dokunuş (otomatik tıklayıcıya karşı). */
export const MAX_TAPS_PER_TICK = 10;
/** Tek mesajda kabul edilecek en fazla dokunuş (istemci ~150 ms'de bir yollar). */
export const MAX_TAPS_PER_MESSAGE = 20;

const HORSE_EMOJIS = ['🐎', '🏇', '🦄', '🐴', '🫏', '🦓', '🐫', '🦌'];

/** Oyuncudan at üretir. Emoji ve renk oyuncuya bağlı, isim ondan türetilir. */
export function makeHorse(
  player: HorseRacePlayer,
  index: number,
  odds = 3,
  rand: () => number = Math.random
): Horse {
  return {
    id: player.id,
    ownerId: player.id,
    name: `${player.name}`,
    emoji: HORSE_EMOJIS[index % HORSE_EMOJIS.length],
    color: player.color,
    progress: 0,
    rank: null,
    taps: 0,
    odds,
    form: FORM_MIN + rand() * (FORM_MAX - FORM_MIN),
  };
}

/**
 * Bahis oranları. Çok kazanan at favorileşir (oran düşer), hiç kazanamayan
 * sürpriz adayı olur (oran yükselir). Böylece bahis aşaması gerçek bir karar
 * hâline gelir: favoriye oynamak güvenli ama az kazandırır.
 */
export function computeOdds(player: HorseRacePlayer, racesPlayed: number): number {
  if (racesPlayed <= 0) return 3;
  const winRate = player.wins / racesPlayed;
  // winRate 0 -> 5.0 ·  0.5 -> 2.6 ·  1.0 -> 1.4
  const odds = 5.0 - winRate * 3.6;
  return Math.round(Math.max(1.4, Math.min(6, odds)) * 10) / 10;
}

/**
 * Bir tick ilerlet. Biten atlara sıra numarası verir.
 * `tapsSinceLastTick` her at için bu tick'te sayılacak dokunuş sayısı.
 * DÖNÜŞ: bu tick'te bitiş çizgisini geçen atların kimlikleri.
 */
export function advanceRace(
  horses: Horse[],
  tapsSinceLastTick: Record<string, number>,
  rand: () => number = Math.random
): string[] {
  const justFinished: string[] = [];
  let nextRank = horses.filter((h) => h.rank !== null).length + 1;

  for (const horse of horses) {
    if (horse.rank !== null) continue; // bitirmiş

    const taps = Math.min(tapsSinceLastTick[horse.id] || 0, MAX_TAPS_PER_TICK);
    const step = BASE_PER_TICK + taps * TAP_VALUE + rand() * JITTER_MAX;
    horse.progress += step * (horse.form || 1);

    if (horse.progress >= TRACK_LENGTH) {
      horse.progress = TRACK_LENGTH;
      horse.rank = nextRank++;
      justFinished.push(horse.id);
    }
  }

  return justFinished;
}

/** Süre dolduğunda bitirmemiş atları mevcut mesafeye göre sıralar. */
export function finalizeUnfinished(horses: Horse[]): void {
  const remaining = horses
    .filter((h) => h.rank === null)
    .sort((a, b) => b.progress - a.progress);
  let rank = horses.filter((h) => h.rank !== null).length + 1;
  for (const h of remaining) h.rank = rank++;
}

/** Sıra numarasına göre yarış primi. */
export function racePrize(rank: number): number {
  if (rank === 1) return 300;
  if (rank === 2) return 150;
  if (rank === 3) return 50;
  return 0;
}

export interface PayoutResult {
  bet: HorseRaceBet | null;
  won: boolean;
  /** Bahis + yarış priminin NET toplamı. */
  delta: number;
}

/**
 * Bir oyuncunun tur sonu kazancı.
 *  - Doğru bahis: +miktar × oran (bahis geri gelir + kâr)
 *  - Yanlış bahis: −miktar
 *  - Ayrıca kendi atının derecesine göre prim
 */
export function settlePlayer(
  player: HorseRacePlayer,
  horses: Horse[],
  winnerHorseId: string | null
): PayoutResult {
  const bet = player.bet || null;
  let delta = 0;
  let won = false;

  if (bet) {
    if (winnerHorseId && bet.horseId === winnerHorseId) {
      const horse = horses.find((h) => h.id === bet.horseId);
      const odds = horse?.odds ?? 3;
      won = true;
      delta += Math.round(bet.amount * odds);
    } else {
      delta -= bet.amount;
    }
  }

  const own = horses.find((h) => h.ownerId === player.id);
  if (own?.rank) delta += racePrize(own.rank);

  return { bet, won, delta };
}
