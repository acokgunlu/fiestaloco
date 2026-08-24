/**
 * Tam Zamanında — süre matematiği
 * ================================
 * React yok, DOM yok. Sunucu ve istemci aynı modülü kullanır.
 *
 * =============================================================================
 * 1) NEDEN "GÖRELİ" HATA — mutlak milisaniye değil
 * =============================================================================
 * İnsanın süre tahminindeki hata, tahmin edilen sürenin uzunluğuyla ORANTILI
 * büyür (Weber–Fechner / skalar zamanlama). 5 saniyede 400 ms şaşırmak,
 * 15 saniyede 400 ms şaşırmaktan çok daha zordur.
 *
 * Puanı ham milisaniyeye bağlasaydık kısa turlar imkânsız, uzun turlar
 * bedava olurdu. Bu yüzden hata hedefe BÖLÜNÜP göreli hataya çevriliyor:
 * her tur aynı zorlukta.
 *
 * =============================================================================
 * 2) NEDEN AĞ GECİKMESİ SUNUCUDA DÜŞÜLÜYOR
 * =============================================================================
 * Oyun milisaniyeyle ölçülüyor; telefonun bağlantısı yavaşsa oyuncu kendi
 * suçu olmayan bir cezayla oynar.
 *
 * Zincir şu:
 *   T0                     sunucu "ŞİMDİ" yayınlar
 *   T0 + d_down            telefon mesajı alır  → oyuncu saymaya BURADA başlar
 *   T0 + d_down + E        oyuncu basar (E = gerçek iç süresi)
 *   T0 + d_down + E + d_up sunucu basışı alır
 *
 * Yani  (alınan - T0) = E + d_down + d_up = E + RTT.
 * Dolayısıyla    E = (alınan - T0) − RTT      ← YARIM RTT DEĞİL, TAM RTT.
 * (Hem "başla" işareti hem de basış gecikiyor; ikisi de sayılmalı.)
 *
 * RTT tahmini olarak örneklerin MİNİMUMU kullanılıyor — NTP'nin yaptığı gibi.
 * Ortalama, ağdaki anlık tıkanmaları ve çöp toplayıcı duraklamalarını içine
 * alıp gecikmeyi olduğundan büyük gösterir; minimum ise gerçek ağ tabanına
 * yakınsar.
 *
 * =============================================================================
 * 3) DÜRÜST UYARI — HİLE
 * =============================================================================
 * Telefonun kendi saati var. Tarayıcı konsolunu açan biri
 * `setTimeout(basma, 10000)` yazıp her turu birebir kazanabilir; kronometre
 * uygulaması da aynı kapıya çıkar. Bunun sunucu tarafında SAVUNMASI YOKTUR.
 * Salon oyunu olarak kabul edilmiş bir sınır: bu yüzden ne TV'de ne telefonda
 * çalışan bir saat gösteriliyor, gerisi masadaki sosyal denetime kalıyor.
 */
import { TimingMode, TimingPress } from '../types/timing';

/** Göreli hata bu oranı geçtiğinde puan sıfırlanır. %30 = 10 sn'de 3 sn şaşmak. */
export const TIMING_ZERO_REL = 0.3;

/** Düşülebilecek en büyük gecikme telafisi (ms). */
export const TIMING_MAX_LATENCY_MS = 900;

/**
 * Hedef süre havuzu (ms).
 *
 * Hepsi "yuvarlak" sayı: oyuncunun kafasında kurabileceği bir hedef olmalı.
 * 6.400 ms gibi bir hedef oyunu zamanlama oyunundan aritmetik oyununa çevirir.
 */
export const TIMING_TARGETS_MS = [5000, 7000, 8000, 10000, 12000, 15000];

/** RUNNING fazının en uzun süresi — kimse basmazsa tur burada biter. */
export function maxRunMs(targetMs: number): number {
  return targetMs * 2 + 6000;
}

/**
 * Hedef seçimi. Önceki turun hedefi tekrar seçilmez: aynı süre üst üste
 * gelirse oyuncular ritmi ezberler ve ölçtüğümüz şey zaman hissi olmaktan
 * çıkar.
 */
export function pickTargetMs(previousMs?: number, rand: () => number = Math.random): number {
  const pool = TIMING_TARGETS_MS.filter((t) => t !== previousMs);
  return pool[Math.floor(rand() * pool.length)];
}

/**
 * Tur modu. İlk tur DAİMA EXACT — kural öğrenilmeden ceza olmasın.
 * Sonrasında ~1/3 ihtimalle NO_OVER.
 */
export function pickMode(round: number, rand: () => number = Math.random): TimingMode {
  if (round <= 1) return 'EXACT';
  return rand() < 0.34 ? 'NO_OVER' : 'EXACT';
}

/**
 * Ölçülen RTT örneklerinden düşülecek telafi.
 * Örnek yoksa 0 döner (telafi yok) — uydurma bir değer, gerçek bir ölçümden
 * daha kötüdür.
 */
export function latencyCorrection(rttMinMs: number | undefined): number {
  if (!rttMinMs || !Number.isFinite(rttMinMs) || rttMinMs < 0) return 0;
  return Math.min(Math.round(rttMinMs), TIMING_MAX_LATENCY_MS);
}

/**
 * Ham sunucu ölçümünden gerçek süreyi çıkarır.
 * Negatife düşemez: telafi ölçümden büyük çıkarsa 0'a kırpılır.
 */
export function correctedElapsedMs(rawMs: number, latencyMs: number): number {
  return Math.max(0, Math.round(rawMs - latencyMs));
}

/**
 * Sapmadan puan.
 *
 *   göreli hata %0  → 100
 *   %3  (10 sn'de 300 ms) → 95
 *   %10 (10 sn'de 1 sn)   → 82
 *   %20 (10 sn'de 2 sn)   → 58
 *   %30 ve üstü           → 0
 *
 * Karekök eğrisi TEPEDE YAYVAN: kıl payı kaçıran neredeyse tam puan alır,
 * ceza uca doğru toplanır. Bu bilerek böyle — turun birincisini ham puan değil
 * sıra bonusu belirlesin, iyi oynayan iki kişi 3 puan farkla ayrılmasın diye.
 */
export function scoreFromError(absErrorMs: number, targetMs: number): number {
  if (targetMs <= 0) return 0;
  const rel = absErrorMs / targetMs;
  const t = Math.max(0, 1 - rel / TIMING_ZERO_REL);
  return Math.round(100 * Math.sqrt(t));
}

/**
 * Sıra bonusu. Herkes birbirine yakın bastığında ham puanlar sıkışır ve turun
 * kazananı belirsizleşir; bonus her turda net bir birinci çıkarır.
 * (Colory ile aynı kademe — iki oyunun puanları aynı ölçekte kalsın.)
 */
export function rankBonus(rank: number): number {
  if (rank === 1) return 30;
  if (rank === 2) return 15;
  if (rank === 3) return 5;
  return 0;
}

export interface RawPress {
  playerId: string;
  rawMs: number;
  latencyMs: number;
}

/**
 * Turu puanlar. Saf fonksiyon — sunucu bunu çağırır, test bunu çağırır.
 *
 * NO_OVER'da hedefi geçen "yanar": puanı 0, sıralamaya girmez. Yanmayan
 * kimse yoksa o turda kimse puan almaz (herkes fazla açgözlü davranmıştır).
 */
export function scoreRound(
  presses: RawPress[],
  targetMs: number,
  mode: TimingMode
): TimingPress[] {
  const scored: TimingPress[] = presses.map((p) => {
    const elapsedMs = correctedElapsedMs(p.rawMs, p.latencyMs);
    const errorMs = elapsedMs - targetMs;
    const burned = mode === 'NO_OVER' && errorMs > 0;
    return {
      playerId: p.playerId,
      elapsedMs,
      rawMs: Math.round(p.rawMs),
      latencyMs: Math.round(p.latencyMs),
      errorMs,
      absErrorMs: Math.abs(errorMs),
      burned,
      points: 0,
      rank: 0,
    };
  });

  const valid = scored.filter((s) => !s.burned).sort((a, b) => a.absErrorMs - b.absErrorMs);
  valid.forEach((s, i) => {
    s.rank = i + 1;
    s.points = scoreFromError(s.absErrorMs, targetMs) + rankBonus(s.rank);
  });

  // Yanıklar en sona, kendi aralarında en az taşandan çoğa
  const burned = scored.filter((s) => s.burned).sort((a, b) => a.absErrorMs - b.absErrorMs);
  return [...valid, ...burned];
}

// =============================================================================
// ZAMAN ÇİZGİSİ YERLEŞİMİ (REVEAL görseli)
// =============================================================================

export interface TimelineItem {
  playerId: string;
  /** Çizgi üzerindeki konum, %0-100. */
  pct: number;
  /** Üst üste binmesin diye atanan şerit (0 = en üst). */
  lane: number;
}

export interface Timeline {
  /** Çizginin sağ ucu (ms). */
  maxMs: number;
  /** Hedef çizgisinin konumu, %. */
  targetPct: number;
  items: TimelineItem[];
  laneCount: number;
}

/**
 * Sonuçları yatay bir zaman çizgisine yerleştirir.
 *
 * Ölçek hedefe göre değil EN GEÇ BASANA göre belirlenir — yoksa 25 saniyede
 * basan biri çizginin dışında kalır ve "en kötü kim" görünmez, ki turun en
 * komik anı odur.
 */
export function buildTimeline(
  targetMs: number,
  results: Array<{ playerId: string; elapsedMs: number }>,
  minGapPct = 9
): Timeline {
  const slowest = results.reduce((m, r) => Math.max(m, r.elapsedMs), 0);
  const maxMs = Math.max(targetMs * 1.45, slowest * 1.08, 1);
  const targetPct = (targetMs / maxMs) * 100;

  // Şerit atama: artan konumda ilerle, son öğesi yeterince geride kalan ilk
  // şeride koy. Basit ve kararlı (aynı girdi → aynı çıktı).
  const lastInLane: number[] = [];
  const items: TimelineItem[] = [...results]
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
    .map((r) => {
      const pct = Math.max(0, Math.min(100, (r.elapsedMs / maxMs) * 100));
      let lane = lastInLane.findIndex((last) => pct - last >= minGapPct);
      if (lane === -1) lane = lastInLane.length;
      lastInLane[lane] = pct;
      return { playerId: r.playerId, pct, lane };
    });

  return { maxMs, targetPct, items, laneCount: Math.max(1, lastInLane.length) };
}

// =============================================================================
// BİÇİMLENDİRME
// =============================================================================

/** 10340 → "10,34" (Türkçe ondalık virgülü). */
export function formatSec(ms: number, digits = 2): string {
  return (ms / 1000).toFixed(digits).replace('.', ',');
}

/** İşaretli sapma: -420 → "0,42 sn erken". */
export function formatError(errorMs: number): string {
  const s = formatSec(Math.abs(errorMs));
  if (errorMs === 0) return 'tam isabet';
  return `${s} sn ${errorMs < 0 ? 'erken' : 'geç'}`;
}

export function modeLabel(mode: TimingMode): string {
  return mode === 'NO_OVER' ? 'GEÇMEDEN' : 'TAM';
}

export function modeHint(mode: TimingMode): string {
  return mode === 'NO_OVER'
    ? 'Hedefi GEÇEN yanar. Geçmeyenler arasında en yakın kazanır.'
    : 'Erken ya da geç fark etmez — hedefe en yakın basan kazanır.';
}
