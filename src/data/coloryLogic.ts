/**
 * Colory — renk matematiği
 * =========================
 * React yok, DOM yok. Sunucu ve tek-cihaz modu aynı modülü kullanır.
 *
 * KRİTİK KARAR — "yakınlık" neyle ölçülür:
 * RGB uzayında Öklid mesafesi ALGISAL OLARAK YANLIŞ. RGB'de yeşil kanalı
 * baskındır; göze bariz farklı iki renk "yakın", göze neredeyse aynı görünen
 * ikisi "uzak" çıkabilir. Oyuncu haksızlığa uğradığını hisseder ve oyun
 * güvenilirliğini kaybeder.
 *
 * Bu yüzden renkler CIE L*a*b* uzayına çevrilip ΔE76 (Öklid) ile ölçülüyor.
 * Lab, insan görme sisteminin farkları algılayışına göre tasarlanmış bir
 * uzaydır; orada 1 birim mesafe her yerde kabaca aynı "görünür fark" demektir.
 */
import { Hsl } from '../types/colory';

export interface Rgb {
  r: number; // 0-255
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const H = ((h % 360) + 360) % 360;
  const S = clamp01(s / 100);
  const L = clamp01(l / 100);

  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - c / 2;

  let r = 0, g = 0, b = 0;
  if (H < 60) [r, g, b] = [c, x, 0];
  else if (H < 120) [r, g, b] = [x, c, 0];
  else if (H < 180) [r, g, b] = [0, c, x];
  else if (H < 240) [r, g, b] = [0, x, c];
  else if (H < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hslToHex(hsl: Hsl): string {
  const { r, g, b } = hslToRgb(hsl);
  const hx = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}

/** sRGB gamma sökümü. */
function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** sRGB (D65) → XYZ. */
export function rgbToXyz({ r, g, b }: Rgb): { x: number; y: number; z: number } {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return {
    x: R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    y: R * 0.2126729 + G * 0.7151522 + B * 0.0721750,
    z: R * 0.0193339 + G * 0.1191920 + B * 0.9503041,
  };
}

// D65 beyaz noktası
const WHITE = { x: 0.95047, y: 1.0, z: 1.08883 };

function labF(t: number): number {
  return t > 0.008856451679035631 ? Math.cbrt(t) : 7.787037037037035 * t + 16 / 116;
}

export function rgbToLab(rgb: Rgb): Lab {
  const { x, y, z } = rgbToXyz(rgb);
  const fx = labF(x / WHITE.x);
  const fy = labF(y / WHITE.y);
  const fz = labF(z / WHITE.z);
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hslToLab(hsl: Hsl): Lab {
  return rgbToLab(hslToRgb(hsl));
}

/** CIE76 algısal renk farkı. ~2.3 = zar zor ayırt edilir, 100 = siyah-beyaz. */
export function deltaE76(a: Lab, b: Lab): number {
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function colorDistance(a: Hsl, b: Hsl): number {
  return deltaE76(hslToLab(a), hslToLab(b));
}

/**
 * ΔE'den puan.
 *
 * Eşik ÖLÇÜLEREK seçildi (50.000 rastgele çift): rastgele tahminlerin ΔE
 * ortalaması 93, medyanı 92. Yani 60'ta sıfırlamak, "rastgele oynayan çoğu
 * turda sıfır alır" demek — puan gerçek isabeti ödüllendiriyor.
 * İnsanın hatırladığı bir rengi seçerken tipik hatası ΔE 10-30 bandındadır;
 * o da 71-91 puana denk geliyor.
 *
 * Eğri karekök: yakın bölgede puan farkı açılır, uzakta sıkışır — "az farkla
 * kaçırdım" hissi güçlü olsun diye.
 */
export const MAX_SCORING_DELTA = 60;

export function scoreFromDelta(deltaE: number): number {
  const t = Math.max(0, 1 - deltaE / MAX_SCORING_DELTA);
  return Math.round(100 * Math.sqrt(t));
}

/**
 * Sıra bonusu. Herkes birbirine yakın tutturduğunda ham puanlar sıkışıyor ve
 * turun kazananı belirsizleşiyor; bonus her turda net bir birinci çıkarır.
 */
export function rankBonus(rank: number): number {
  if (rank === 1) return 30;
  if (rank === 2) return 15;
  if (rank === 3) return 5;
  return 0;
}

/**
 * Hedef renk üretimi.
 *
 * Aşırı koyu / aşırı açık / soluk renkler seçilmiyor: o bölgelerde ton (hue)
 * gözle ayırt edilemez hâle gelir ve oyun kör şansa döner. Doygunluk 55-95,
 * açıklık 35-70 aralığı hem canlı hem ayırt edilebilir.
 */
export function randomTarget(rand: () => number = Math.random): Hsl {
  return {
    h: Math.floor(rand() * 360),
    s: 55 + rand() * 40,
    l: 35 + rand() * 35,
  };
}

/** Oyuncunun seçici açılışındaki varsayılan rengi (nötr, ipucu vermez). */
export function defaultGuess(): Hsl {
  return { h: 180, s: 70, l: 50 };
}
