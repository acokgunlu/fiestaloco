/**
 * At Yarışı (Ganyan) — saf yarış ve bahis mantığı
 * ================================================
 * React yok, DOM yok, WebSocket yok. Sunucu ve tek-cihaz modu AYNI kuralları
 * kullanır.
 *
 * TEMEL MİMARİ KARARI — "önce dürüst sonuç, sonra animasyon":
 * Yarışın sonucu, bahisler kapandığı anda atların gizli güçlerinden
 * hesaplanır. Ekrandaki koşu bu sonucun canlandırmasıdır. Böylece
 * gösterilen oranlar atın GERÇEK kazanma olasılığından türetilebiliyor —
 * yani kupon dürüst. Tersi (önce animasyon, sonucu ondan okuma) yapılsaydı
 * oranların olasılıkla ilgisi kalmazdı ve bahis bir kumar değil, süs olurdu.
 */
import { HorseRaceBet, PayoutDetail, RaceHorse, TRACK_LENGTH } from '../types/horseRace';

export const TICK_MS = 100;
/** Yarışın ekranda sürdüğü süre (en hızlı at bu civarda bitirir). */
const RACE_BASE_MS = 15_000;
export const MAX_RACE_MS = 30_000;

/** Ödeme çarpanlarındaki kasa payı. 1.0 = tamamen adil. */
const HOUSE_EDGE = 0.92;

const HORSE_POOL = [
  { name: 'Şimşek',   emoji: '🐎', color: '#ef4444' },
  { name: 'Kasırga',  emoji: '🏇', color: '#3b82f6' },
  { name: 'Yıldırım', emoji: '🦄', color: '#a855f7' },
  { name: 'Rüzgar',   emoji: '🐴', color: '#10b981' },
  { name: 'Karayel',  emoji: '🦓', color: '#f59e0b' },
  { name: 'Poyraz',   emoji: '🫏', color: '#ec4899' },
];

export const HORSE_COUNT = HORSE_POOL.length;

/** Yarış sonucundaki rastgelelik. Büyük = daha çok sürpriz. */
const NOISE = 0.42;

/** Bir atın o yarıştaki performansı: gücü + günün formu. */
function rollPerformance(strength: number, rand: () => number): number {
  return strength * (1 + (rand() * 2 - 1) * NOISE);
}

/**
 * Monte Carlo ile her atın kazanma ve ilk-ikiye girme olasılığı.
 * Oranlar buradan türetiliyor — gösterilen oran atın gerçek şansını yansıtır.
 */
export function computeProbabilities(
  strengths: number[],
  runs = 4000,
  rand: () => number = Math.random
): { win: number[]; place: number[]; exacta: number[][] } {
  const n = strengths.length;
  const win = new Array(n).fill(0);
  const place = new Array(n).fill(0);
  // exacta[i][j] = i birinci VE j ikinci olma sayisi.
  // p1*p2 ile TAHMIN EDILEMEZ: A kazandiktan sonra B'nin ikinci olma sansi
  // kosulludur ve p2'den yuksektir. Bu yuzden dogrudan sayiyoruz.
  const exacta: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let r = 0; r < runs; r++) {
    const perf = strengths.map((s) => rollPerformance(s, rand));
    // en iyi iki performansı bul
    let first = 0;
    let second = -1;
    for (let i = 1; i < n; i++) if (perf[i] > perf[first]) first = i;
    for (let i = 0; i < n; i++) {
      if (i === first) continue;
      if (second === -1 || perf[i] > perf[second]) second = i;
    }
    win[first] += 1;
    place[first] += 1;
    if (second >= 0) {
      place[second] += 1;
      exacta[first][second] += 1;
    }
  }

  return {
    win: win.map((c) => c / runs),
    place: place.map((c) => c / runs),
    exacta: exacta.map((row) => row.map((c) => c / runs)),
  };
}

/**
 * Olasılıktan ondalık oran. `max` sıralı ikili için yüksek tutulmalı:
 * tavan düşük olursa nadir kombinasyonlar eksik ödenir ve kasa payı
 * sessizce büyür (ilk ölçümde ikili −%18'e çıkmıştı).
 */
function oddsFromProb(p: number, max = 99): number {
  if (p <= 0.000001) return max;
  return Math.round(Math.max(1.1, Math.min(max, (1 / p) * HOUSE_EDGE)) * 10) / 10;
}

export interface RaceCard {
  horses: RaceHorse[];
  /** exactaOdds[i][j] = i birinci, j ikinci gelirse ödeme çarpanı. */
  exactaOdds: number[][];
}

/** Yeni yarış kartı. `prev` verilirse aynı atlar form geçmişiyle sürer. */
export function createRaceCard(prev?: RaceHorse[], rand: () => number = Math.random): RaceCard {
  const horses: RaceHorse[] = HORSE_POOL.map((h, i) => {
    const old = prev?.[i];
    return {
      id: `h${i}`,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      // Güç her yarışta hafifçe kayar — form tutmayan at diriliyor, favori düşüyor
      strength: old
        ? clamp(old.strength + (rand() * 2 - 1) * 0.08, 0.8, 1.25)
        : 0.85 + rand() * 0.4,
      odds: 3,
      placeOdds: 1.6,
      form: old ? [...old.form] : [],
      progress: 0,
      rank: null,
    };
  });

  const { win, place, exacta } = computeProbabilities(horses.map((h) => h.strength), 6000, rand);
  horses.forEach((h, i) => {
    h.odds = oddsFromProb(win[i]);
    h.placeOdds = oddsFromProb(place[i]);
  });
  const exactaOdds = exacta.map((row) => row.map((p) => oddsFromProb(p, 400)));
  return { horses, exactaOdds };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export interface RacePlan {
  /** at id -> bitiş anı (ms) */
  finishAt: Record<string, number>;
  /** at id -> animasyon dalgalanması için faz */
  phase: Record<string, number>;
  order: string[];
}

/**
 * Yarışı ÖNCEDEN çöz: kim kaçıncı bitirecek ve ne zaman.
 * Animasyon bunu takip eder; sıralama tick gürültüsüne bırakılmaz.
 */
export function planRace(horses: RaceHorse[], rand: () => number = Math.random): RacePlan {
  const perf = horses.map((h) => ({ id: h.id, p: rollPerformance(h.strength, rand) }));
  perf.sort((a, b) => b.p - a.p);

  const best = perf[0].p;
  const finishAt: Record<string, number> = {};
  const phase: Record<string, number> = {};

  perf.forEach((entry, idx) => {
    // En iyi at RACE_BASE_MS'de bitirir; diğerleri performans oranınca geride
    const ratio = entry.p / best;
    finishAt[entry.id] = Math.min(MAX_RACE_MS - 500, RACE_BASE_MS / Math.max(0.55, ratio));
    // Aynı anda bitmesinler — sıralama net okunsun
    finishAt[entry.id] += idx * 120;
    phase[entry.id] = rand() * Math.PI * 2;
  });

  return { finishAt, phase, order: perf.map((e) => e.id) };
}

/**
 * Bir atın `t` anındaki ilerlemesi.
 * Erken safhada dalgalanma var (lider değişimi = heyecan), bitişe doğru
 * dalgalanma sönüyor ki nihai sıralama plana sadık kalsın.
 */
export function progressAt(t: number, finishAt: number, phase: number): number {
  if (t >= finishAt) return TRACK_LENGTH;
  const x = t / finishAt;                       // 0..1
  const wobble = Math.sin(x * 9 + phase) * 6 * (1 - x) * (1 - x);
  const base = Math.pow(x, 0.92) * TRACK_LENGTH;
  return clamp(base + wobble, 0, TRACK_LENGTH - 0.5);
}

/** Kuponun geçerli olup olmadığı (sunucu bunu ayrıca doğrular). */
export function isValidBet(bet: HorseRaceBet, horseIds: string[]): boolean {
  const uniq = new Set(bet.horseIds);
  if (bet.horseIds.some((id) => !horseIds.includes(id))) return false;
  if (bet.kind === 'ikili') return bet.horseIds.length === 2 && uniq.size === 2;
  return bet.horseIds.length === 1;
}

/** Kuponun ödemesi. */
/**
 * Kuponun ödemesi.
 *
 * `delta` NET değişimdir. Oranlar ondalık (decimal) oran mantığındadır:
 * kazanınca geri gelen toplam = bahis × oran, dolayısıyla NET KÂR
 * bahis × (oran − 1). Bunu bahis × oran diye yazmak ana parayı iki kez
 * saydırıyor ve oyunu oyuncu lehine (+%9) çeviriyordu.
 */
export function settleBet(
  bet: HorseRaceBet | null,
  horses: RaceHorse[],
  firstId: string | null,
  secondId: string | null,
  exactaOdds?: number[][]
): PayoutDetail {
  if (!bet) return { bet: null, won: false, delta: 0 };

  const horse = (id: string) => horses.find((h) => h.id === id);
  const idx = (id: string) => horses.findIndex((h) => h.id === id);

  let won = false;
  let mult = 1;

  if (bet.kind === 'ganyan') {
    won = firstId === bet.horseIds[0];
    mult = horse(bet.horseIds[0])?.odds ?? 3;
  } else if (bet.kind === 'plase') {
    won = bet.horseIds[0] === firstId || bet.horseIds[0] === secondId;
    mult = horse(bet.horseIds[0])?.placeOdds ?? 1.6;
  } else {
    won = bet.horseIds[0] === firstId && bet.horseIds[1] === secondId;
    const i = idx(bet.horseIds[0]);
    const j = idx(bet.horseIds[1]);
    mult = exactaOdds?.[i]?.[j] ?? 20;
  }

  return {
    bet,
    won,
    multiplier: mult,
    delta: won ? Math.round(bet.amount * (mult - 1)) : -bet.amount,
  };
}

/** İnsan tarafından okunabilir kupon açıklaması. */
export function describeBet(bet: HorseRaceBet, horses: RaceHorse[]): string {
  const nm = (id: string) => horses.find((h) => h.id === id)?.name || '?';
  if (bet.kind === 'ganyan') return `Ganyan · ${nm(bet.horseIds[0])}`;
  if (bet.kind === 'plase') return `Plase · ${nm(bet.horseIds[0])}`;
  return `İkili · ${nm(bet.horseIds[0])} → ${nm(bet.horseIds[1])}`;
}
