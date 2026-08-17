/**
 * Trivia Pursuit — tahta geometrisi ve hareket mantigi
 * =====================================================
 * Saf veri + saf fonksiyonlar. React yok, DOM yok — hem pass-and-play hem
 * sunucu tarafi ayni modulu kullanabilsin diye.
 *
 * Tahta klasik Trivial Pursuit duzeni:
 *
 *        dis halka (24 kare)  ·  6 kale (HQ)  ·  6 kol  ·  merkez
 *
 *   - Halka 24 kare. 0, 4, 8, 12, 16, 20 numarali kareler KALE'dir ve her biri
 *     bir kategoriye aittir; dogru cevap orada dilim (wedge) kazandirir.
 *   - Kaleler arasindaki 3 kare normal kategori karesi; bazilari "tekrar at".
 *   - Her kaleden merkeze dogru 3 kareli bir KOL uzanir. Oyuncu tum dilimleri
 *     topladiktan sonra kolu kullanip merkeze yurur.
 *   - Merkez: final sorusu. Dogru bilen oyunu kazanir.
 *
 * Koordinatlar -1..1 birim karesinde; render eden bilesen olceklendirir.
 */
import { TriviaCategory, TRIVIA_CATEGORY_KEYS } from '../types/triviaPursuit';

export const RING_SIZE = 24;
/** Kalelerin halka uzerindeki indeksleri (her 4 karede bir). */
export const HQ_INDICES = [0, 4, 8, 12, 16, 20];
/** Bir kaleden merkeze kadar kac ara kare var. */
export const SPOKE_LENGTH = 3;

export type SpaceKind = 'hq' | 'category' | 'rollAgain' | 'spoke' | 'hub';

export interface BoardSpace {
  kind: SpaceKind;
  category?: TriviaCategory;
  /** -1..1 arasi birim koordinat (0,0 = merkez). */
  x: number;
  y: number;
  /** Kale ise hangi kol numarasina ait (0-5). */
  hq?: number;
}

/** Oyuncunun tahtadaki yeri. */
export type BoardPosition =
  | { track: 'ring'; index: number }
  | { track: 'spoke'; hq: number; step: number } // step 1..SPOKE_LENGTH (merkeze dogru)
  | { track: 'hub' };

const RING_RADIUS = 0.86;
const HUB_RADIUS = 0.16;

/** Halka indeksinin acisi (radyan). 0 numarali kare tam tepede. */
function ringAngle(index: number): number {
  return ((index / RING_SIZE) * 360 - 90) * (Math.PI / 180);
}

export function isHqIndex(index: number): boolean {
  return HQ_INDICES.includes(index);
}

/** Kale indeksi -> kol numarasi (0-5). Kale degilse -1. */
export function hqNumberOf(index: number): number {
  return HQ_INDICES.indexOf(index);
}

/**
 * Kale olmayan halka karelerinin kategorisi. Sabit bir desen kullaniyoruz —
 * her acilista ayni tahta cikmali (sunucu ve istemci ayni sonucu uretmeli,
 * bu yuzden rastgelelik YOK).
 */
function ringCategoryFor(index: number): TriviaCategory {
  return TRIVIA_CATEGORY_KEYS[(index * 5 + 2) % TRIVIA_CATEGORY_KEYS.length];
}

/** Her kalenin ortasindaki kare "tekrar at" olsun (halkada 6 tane). */
function isRollAgain(index: number): boolean {
  return !isHqIndex(index) && index % 4 === 2;
}

/** Dis halkanin 24 karesi. */
export const RING_SPACES: BoardSpace[] = Array.from({ length: RING_SIZE }, (_, i) => {
  const a = ringAngle(i);
  const x = RING_RADIUS * Math.cos(a);
  const y = RING_RADIUS * Math.sin(a);

  if (isHqIndex(i)) {
    const hq = hqNumberOf(i);
    return { kind: 'hq' as const, category: TRIVIA_CATEGORY_KEYS[hq], x, y, hq };
  }
  if (isRollAgain(i)) {
    return { kind: 'rollAgain' as const, x, y };
  }
  return { kind: 'category' as const, category: ringCategoryFor(i), x, y };
});

/**
 * Kollar: [kol numarasi][adim-1] -> kare.
 * adim 1 kaleye en yakin, adim SPOKE_LENGTH merkeze en yakin.
 */
export const SPOKE_SPACES: BoardSpace[][] = HQ_INDICES.map((ringIndex, hq) => {
  const a = ringAngle(ringIndex);
  return Array.from({ length: SPOKE_LENGTH }, (_, s) => {
    // Kaleden merkeze dogru esit araliklarla
    const t = (s + 1) / (SPOKE_LENGTH + 1);
    const r = RING_RADIUS + (HUB_RADIUS - RING_RADIUS) * t;
    return {
      kind: 'spoke' as const,
      category: TRIVIA_CATEGORY_KEYS[(hq + s + 1) % TRIVIA_CATEGORY_KEYS.length],
      x: r * Math.cos(a),
      y: r * Math.sin(a),
      hq,
    };
  });
});

export const HUB_SPACE: BoardSpace = { kind: 'hub', x: 0, y: 0 };

/** Bir pozisyondaki kareyi dondurur. */
export function spaceAt(pos: BoardPosition): BoardSpace {
  if (pos.track === 'hub') return HUB_SPACE;
  if (pos.track === 'ring') return RING_SPACES[pos.index];
  return SPOKE_SPACES[pos.hq][pos.step - 1];
}

/** Iki pozisyon ayni mi? */
export function samePosition(a: BoardPosition, b: BoardPosition): boolean {
  if (a.track !== b.track) return false;
  if (a.track === 'hub') return true;
  if (a.track === 'ring' && b.track === 'ring') return a.index === b.index;
  if (a.track === 'spoke' && b.track === 'spoke') return a.hq === b.hq && a.step === b.step;
  return false;
}

export interface MoveOption {
  to: BoardPosition;
  /** Kullaniciya gosterilecek kisa aciklama. */
  label: string;
}

/**
 * Zar `roll` geldiginde gidilebilecek yerler.
 *
 * Kurallar:
 *  - Halkada saat yonu VEYA tersi, tam `roll` kare.
 *  - Oyuncu bir KALE uzerindeyse ve gerekli tum dilimleri topladiysa, kolu
 *    kullanip merkeze dogru ilerleyebilir. Merkeze ulasmak icin tam sayi
 *    gerekmez — fazlasi merkezde durur (oyunu kilitlememek icin).
 *  - Kol uzerindeyken tek yon vardir: merkeze dogru.
 *
 * Ayni kareye cikan secenekler teklenir (orn. roll 12 iken iki yon de ayni yer).
 */
export function getMoveOptions(
  pos: BoardPosition,
  roll: number,
  hasAllWedges: boolean
): MoveOption[] {
  const options: MoveOption[] = [];

  if (pos.track === 'hub') return options; // merkezde hareket yok

  if (pos.track === 'spoke') {
    const step = pos.step + roll;
    if (step > SPOKE_LENGTH) {
      options.push({ to: { track: 'hub' }, label: 'Merkeze!' });
    } else {
      options.push({ to: { track: 'spoke', hq: pos.hq, step }, label: 'Merkeze doğru' });
    }
    return options;
  }

  // Halka: iki yon
  const cw = (pos.index + roll) % RING_SIZE;
  const ccw = (pos.index - roll + RING_SIZE * 2) % RING_SIZE;
  options.push({ to: { track: 'ring', index: cw }, label: 'Saat yönü ↻' });
  if (ccw !== cw) {
    options.push({ to: { track: 'ring', index: ccw }, label: 'Ters yön ↺' });
  }

  // Kaledeysen ve tum dilimler tamamsa kola girebilirsin
  if (hasAllWedges && isHqIndex(pos.index)) {
    const hq = hqNumberOf(pos.index);
    if (roll >= SPOKE_LENGTH + 1) {
      options.push({ to: { track: 'hub' }, label: 'Merkeze! 🏆' });
    } else {
      options.push({ to: { track: 'spoke', hq, step: roll }, label: 'Kola gir →' });
    }
  }

  return options;
}

/** Zar at (1-6). */
export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/** Baslangic pozisyonu: merkeze en yakin degil, halkanin tepesi. */
export function startingPosition(): BoardPosition {
  return { track: 'ring', index: 0 };
}
