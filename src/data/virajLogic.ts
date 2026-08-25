/**
 * Viraj — yarış matematiği
 * =========================
 * React yok, DOM yok. Sunucu ve tek-cihaz modu aynı modülü kullanır.
 *
 * =============================================================================
 * TASARIMIN OMURGASI: ISI
 * =============================================================================
 * Üç çizgi (güvenli / normal / dibine kadar) tek başına dengeli bir oyun
 * yapmaz — saldırı hep daha hızlıysa herkes hep saldırır ve karar diye bir şey
 * kalmaz. Oyunu ayakta tutan şey LASTİK ISISI:
 *
 *   saldırı  -> zaman kazandırır AMA ısıtır
 *   güvenli  -> zaman kaybettirir AMA soğutur
 *   hata ihtimali ısının KARESİYLE büyür
 *
 * SAYILAR SİMÜLASYONLA AYARLANDI. İlk denemede saldırının kazancı virajda
 * ~0,16 sn'ydi ama sıcakken beklenen hata bedeli ~0,9 sn çıkıyordu: saldırı
 * KATI BİÇİMDE kötü bir seçenekti ve 20.000 yarışta "hep normal" %29 ile
 * açık ara kazanıyordu. Heyecanlı seçeneğin kaybeden seçenek olması oyunu
 * öldürürdü. Kazanç %9'a çıkarıldı, hata bedelleri kısıldı; kırılma noktası
 * artık ısı ~72 civarında — yani "3 viraj saldır, sonra soğut" ritmi doğuyor.
 *
 * Kare olması önemli: ısı düşükken saldırı neredeyse bedava, yüksekken
 * intihar. Böylece "ne zaman saldırayım" gerçek bir soru oluyor ve masadaki
 * herkes farklı cevap veriyor. Doğrusal olsaydı optimal strateji sabit bir
 * oran olurdu ve oyun çözülürdü.
 *
 * =============================================================================
 * HATA KADEMELİ — ikili "kaza" DEĞİL
 * =============================================================================
 * Tek bir "kaza = yarış bitti" kuralı, erken hata yapanı 3 dakika seyirciye
 * çevirirdi. Onun yerine dışarı taşma / kilitleme / çakıl var; en kötüsü bile
 * yarışta bırakıyor ama sıralamayı altüst ediyor.
 */
import { VirajCar, VirajLine, VirajMistake } from '../types/viraj';

// --- ÇİZGİ ETKİLERİ ---------------------------------------------------------
/** Viraj taban süresine uygulanan çarpan. */
export const LINE_TIME: Record<VirajLine, number> = {
  SAFE: 1.06,
  NORMAL: 1.0,
  ATTACK: 0.91,
};

/** Virajdan sonra ısıya eklenen (negatif = soğuma). */
export const LINE_HEAT: Record<VirajLine, number> = {
  SAFE: -22,
  NORMAL: -4,
  ATTACK: +22,
};

/** Isı 100'ken o çizginin hata ihtimali. Aradaki değerler KARE ile ölçeklenir. */
export const LINE_RISK: Record<VirajLine, number> = {
  SAFE: 0.015,
  NORMAL: 0.07,
  ATTACK: 0.4,
};

export const MAX_HEAT = 100;

/** Hata büyüklüğüne göre kaybedilen süre (sn). */
export const MISTAKE_COST: Record<VirajMistake, number> = {
  NONE: 0,
  WIDE: 0.4,
  LOCKUP: 1.4,
  OFF: 3.0,
};

/** Slipstream: öndekine bu kadar yakınsan tow alırsın (sn). */
export const TOW_GAP = 0.65;
/** Tow'un kazandırdığı süre (sn). */
export const TOW_GAIN = 0.18;

export function clampHeat(h: number): number {
  return Math.max(0, Math.min(MAX_HEAT, h));
}

/**
 * Hata ihtimali.
 * Isı oranının KARESİ × çizginin risk katsayısı (bkz. dosya başı).
 */
export function mistakeChance(heat: number, line: VirajLine): number {
  const t = clampHeat(heat) / MAX_HEAT;
  return Math.min(0.92, t * t * LINE_RISK[line]);
}

/**
 * Hata çıktıysa büyüklüğü. Isı yükseldikçe ağır hatalar öne çıkar —
 * sıcakken yapılan hata sadece "daha sık" değil, "daha pahalı" da olmalı.
 */
export function rollMistakeSeverity(heat: number, rand: () => number = Math.random): VirajMistake {
  const t = clampHeat(heat) / MAX_HEAT;
  const r = rand();
  const offChance = 0.10 + t * 0.28;
  const lockChance = 0.30 + t * 0.20;
  if (r < offChance) return 'OFF';
  if (r < offChance + lockChance) return 'LOCKUP';
  return 'WIDE';
}

export interface CornerInput {
  playerId: string;
  line: VirajLine;
  heat: number;
  /** Öndeki arabaya olan fark (sn). Yoksa Infinity. */
  gapAhead: number;
}

export interface CornerOutcome {
  playerId: string;
  line: VirajLine;
  /** Bu virajda eklenen süre (sn) — küçük olan kazanır. */
  delta: number;
  heat: number;
  mistake: VirajMistake;
  tow: boolean;
}

/**
 * Bir virajı çözer.
 *
 * @param baseSeconds  virajın taban süresi
 * @param severity     virajın "ödül" çarpanı — hızlı virajlarda saldırı daha
 *                     az kazandırır, yavaş/teknik virajda daha çok
 */
export function resolveCorner(
  inputs: CornerInput[],
  baseSeconds: number,
  severity: number,
  rand: () => number = Math.random
): CornerOutcome[] {
  return inputs.map((inp) => {
    const line = inp.line;

    // Cizgi carpani severity ile olceklenir: NORMAL her zaman 1.0 kalir,
    // sapma severity kadar buyur/kuculur.
    const raw = LINE_TIME[line];
    const scaled = 1 + (raw - 1) * severity;
    let delta = baseSeconds * scaled;

    // Slipstream: yalniz gercekten yakinsan, ve saldirmiyorsan bile gecerli.
    const tow = inp.gapAhead <= TOW_GAP;
    if (tow) delta -= TOW_GAIN;

    // Hata — ISIYI KARARDAN ONCEKI haliyle degerlendiriyoruz: viraja
    // girerken lastigin durumu neyse risk odur, virajdan sonraki degil.
    let mistake: VirajMistake = 'NONE';
    if (rand() < mistakeChance(inp.heat, line)) {
      mistake = rollMistakeSeverity(inp.heat, rand);
      delta += MISTAKE_COST[mistake];
    }

    const heat = clampHeat(inp.heat + LINE_HEAT[line]);
    return { playerId: inp.playerId, line, delta, heat, mistake, tow };
  });
}

// =============================================================================
// PIST ÜRETİMİ
// =============================================================================

export interface VirajCorner {
  /** Görünen ad — kararı renklendirir. */
  label: string;
  /** Taban süre (sn). */
  base: number;
  /** Saldırının ne kadar kazandıracağı (0.6 = az, 1.4 = çok). */
  severity: number;
}

export interface VirajTrack {
  name: string;
  corners: VirajCorner[];
  /** SVG yolu — TV'de pist bu eğriyle çizilir. */
  path: string;
}

const CORNER_KINDS: Array<{ label: string; base: number; severity: number }> = [
  { label: 'Hızlı Sağ', base: 3.2, severity: 0.65 },
  { label: 'Hızlı Sol', base: 3.1, severity: 0.65 },
  { label: 'Firkete', base: 5.6, severity: 1.4 },
  { label: 'Şikan', base: 4.4, severity: 1.15 },
  { label: 'Uzun Viraj', base: 5.0, severity: 1.0 },
  { label: 'Kör Viraj', base: 4.6, severity: 1.25 },
  { label: 'Fren Noktası', base: 4.0, severity: 1.3 },
  { label: 'Banked Viraj', base: 3.6, severity: 0.8 },
];

const TRACK_NAMES = [
  'Kanyon Pisti', 'Liman Devresi', 'Kuzey Ormanı', 'Çöl Halkası',
  'Eski Havaalanı', 'Dağ Geçidi', 'Sahil Yolu', 'Fabrika Bölgesi',
];

/**
 * Pist üretimi.
 *
 * Viraj sayısı 5-7: altından az olursa tur çok kısa ve karar sayısı yetersiz,
 * üstünde olursa aynı kararı üst üste vermek sıkıcı hâle geliyor.
 */
export function generateTrack(rand: () => number = Math.random, previousName?: string): VirajTrack {
  const pool = TRACK_NAMES.filter((n) => n !== previousName);
  const name = pool[Math.floor(rand() * pool.length)];
  const count = 5 + Math.floor(rand() * 3);

  const corners: VirajCorner[] = [];
  for (let i = 0; i < count; i++) {
    const k = CORNER_KINDS[Math.floor(rand() * CORNER_KINDS.length)];
    corners.push({ ...k });
  }
  // En az bir firkete olsun — turun bir yerinde büyük ödül/risk anı olmalı
  if (!corners.some((c) => c.severity >= 1.3)) {
    corners[Math.floor(rand() * corners.length)] = { ...CORNER_KINDS[2] };
  }

  return { name, corners, path: trackPath(count, rand) };
}

/**
 * Pistin SVG yolu. Viraj sayısına göre kapalı, organik bir devre üretir.
 * Deterministik değil ama yalnızca ÇİZİM için — oyun sonucuna etkisi yok.
 */
export function trackPath(cornerCount: number, rand: () => number = Math.random): string {
  const cx = 300;
  const cy = 170;
  const pts: Array<[number, number]> = [];
  const n = Math.max(6, cornerCount * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rx = 210 + (rand() - 0.5) * 70;
    const ry = 110 + (rand() - 0.5) * 55;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  // Catmull-Rom -> kübik Bezier (kapalı eğri)
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

// =============================================================================
// SIRALAMA VE PUAN
// =============================================================================

/** Yarış sonu şampiyona puanı — F1 benzeri, ilk sıralar arası fark belirgin. */
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export function pointsForRank(rank: number): number {
  return RACE_POINTS[rank - 1] ?? 0;
}

/** Arabaları anlık sıraya dizer (küçük elapsed = önde). */
export function rankCars<T extends { playerId: string; elapsed: number }>(cars: T[]): string[] {
  return [...cars].sort((a, b) => a.elapsed - b.elapsed).map((c) => c.playerId);
}

/** Bir arabanın öndekine farkı (sn). Lider için Infinity. */
export function gapToAhead(car: VirajCar, cars: VirajCar[]): number {
  let best = Infinity;
  for (const o of cars) {
    if (o.playerId === car.playerId) continue;
    const d = car.elapsed - o.elapsed;
    if (d > 0 && d < best) best = d;
  }
  return best;
}

/** İki ondalıklı, Türkçe/İngilizce ayrımı çağıranda yapılır. */
export function formatGap(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  return seconds.toFixed(2);
}
