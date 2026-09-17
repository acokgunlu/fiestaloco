import type { FetihAttackOrder, FetihBattle, FetihTile } from '../types/fetih';
import { TERRITORY_IDS, areNeighbors, neighborsOf } from './fetihMap';

/**
 * Cihan Fatihi — saf kurallar
 * ==========================
 * Sunucu oyunu bu fonksiyonlarla yürütüyor; telefon da aynı fonksiyonlarla
 * "hangi saldırılar mümkün" listesini çiziyor. Fonksiyonların çoğu `tiles`
 * nesnesini YERİNDE değiştiriyor (sunucu odası tek sahip) — değiştirenler
 * adında ve yorumunda belli.
 */

type Rand = () => number;

export const FETIH_TIMES = { vote: 10, question: 15, roll: 7, orders: 30 } as const;

/** Başlangıçta oyuncu başına bölge. */
export const START_PROVINCES = 3;
export const START_TROOPS = 3;
export const RESPAWN_TROOPS = 3;
/** Doğru cevap ödülü (asker). */
export const QUIZ_BONUS = 3;
/** En hızlı doğru cevaba ek ödül. */
export const FASTEST_BONUS = 2;

/**
 * Üretim numaraları, Catan'daki dağılımla: 6 ve 8 sık gelir ama 2 ve 12
 * kadar nadir değil. 7 yok — 7 korsan baskınının sayısı.
 */
const TOKEN_CYCLE = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

export function shuffled<T>(arr: T[], rand: Rand = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * RASTGELE BAŞLANGIÇ.
 * Her oyuncuya 3 dağınık bölge ve 3'er asker. Bölgeler mümkün olduğunca başka
 * oyuncuların bölgelerine komşu olmayacak şekilde seçiliyor: ilk turda birinin
 * dibinde doğup hemen yutulmak oyunu daha başlamadan bitirirdi.
 */
export function setupBoard(playerIds: string[], rand: Rand = Math.random): Record<number, FetihTile> {
  const tokens: number[] = [];
  while (tokens.length < TERRITORY_IDS.length) tokens.push(...TOKEN_CYCLE);
  const tokenOrder = shuffled(tokens, rand);

  const tiles: Record<number, FetihTile> = {};
  TERRITORY_IDS.forEach((id, i) => {
    tiles[id] = { owner: null, troops: 1 + Math.floor(rand() * 3), token: tokenOrder[i] };
  });

  const touchesOther = (id: number, pid: string) =>
    neighborsOf(id).some((n) => tiles[n].owner && tiles[n].owner !== pid);

  // Sırayla dağıt (herkes 1, sonra herkes 2…) — ilk seçen avantajlı olmasın.
  for (let k = 0; k < START_PROVINCES; k++) {
    for (const pid of shuffled(playerIds, rand)) {
      const free = TERRITORY_IDS.filter((id) => !tiles[id].owner);
      const calm = free.filter((id) => !touchesOther(id, pid));
      const pool = calm.length > 0 ? calm : free;
      if (pool.length === 0) break;
      const pick = pool[Math.floor(rand() * pool.length)];
      tiles[pick].owner = pid;
      tiles[pick].troops = START_TROOPS;
    }
  }
  return tiles;
}

export function ownedProvinces(tiles: Record<number, FetihTile>, pid: string): number[] {
  return TERRITORY_IDS.filter((id) => tiles[id]?.owner === pid);
}

export function totalTroops(tiles: Record<number, FetihTile>, pid: string): number {
  return ownedProvinces(tiles, pid).reduce((sum, id) => sum + tiles[id].troops, 0);
}

/** Taban gelir: her 4 il için 1 asker, en az 1. */
export function baseIncome(provinceCount: number): number {
  return Math.max(1, Math.floor(provinceCount / 4));
}

export function rollDice(rand: Rand = Math.random): [number, number] {
  return [1 + Math.floor(rand() * 6), 1 + Math.floor(rand() * 6)];
}

/** Numarası zar toplamını tutan her bölge sahibine 1 asker üretir. */
export function production(tiles: Record<number, FetihTile>, sum: number): Record<string, number> {
  const gains: Record<string, number> = {};
  for (const id of TERRITORY_IDS) {
    const t = tiles[id];
    if (t.owner && t.token === sum) gains[t.owner] = (gains[t.owner] || 0) + 1;
  }
  return gains;
}

/**
 * 7 — KORSAN BASKINI (tiles'ı değiştirir).
 * Her oyuncunun en kalabalık bölgesinden, orada 4+ asker varsa, 1 asker gider.
 * Catan'daki "7 gelince eli kalabalık olan kart atar" kuralının karşılığı:
 * askerini tek ilde yığan cezalanıyor.
 */
export function banditRaid(tiles: Record<number, FetihTile>, playerIds: string[]): Array<{ playerId: string; province: number }> {
  const raided: Array<{ playerId: string; province: number }> = [];
  for (const pid of playerIds) {
    const owned = ownedProvinces(tiles, pid);
    if (owned.length === 0) continue;
    const biggest = owned.reduce((a, b) => (tiles[b].troops > tiles[a].troops ? b : a));
    if (tiles[biggest].troops >= 4) {
      tiles[biggest].troops -= 1;
      raided.push({ playerId: pid, province: biggest });
    }
  }
  return raided;
}

/**
 * Risk zar savaşı, sonuna kadar ("blitz"): saldıran en çok 3 zar (kaynakta
 * 1 asker kalmak zorunda), savunan en çok 2 zar. Zarlar büyükten küçüğe
 * eşleşiyor, eşitlikte savunan kazanıyor. Saldıranın 1 askeri kalana ya da
 * savunan tükenene kadar sürüyor.
 */
export function fightBattle(attTroops: number, defTroops: number, rand: Rand = Math.random): { attLoss: number; defLoss: number } {
  let att = attTroops;
  let def = defTroops;
  const die = () => 1 + Math.floor(rand() * 6);
  while (att > 1 && def > 0) {
    const a = Array.from({ length: Math.min(3, att - 1) }, die).sort((x, y) => y - x);
    const d = Array.from({ length: Math.min(2, def) }, die).sort((x, y) => y - x);
    for (let i = 0; i < Math.min(a.length, d.length); i++) {
      if (a[i] > d[i]) def -= 1;
      else att -= 1;
    }
  }
  return { attLoss: attTroops - att, defLoss: defTroops - def };
}

/**
 * Tek zar atışının sonuç olasılıkları (Risk'in bilinen tablosu):
 * [savunan 2 kaybeder, ikisi 1'er kaybeder, saldıran 2 kaybeder] ya da tek
 * karşılaştırmada [savunan kaybeder, saldıran kaybeder].
 */
const EXCHANGE: Record<string, number[]> = {
  '1v1': [15 / 36, 21 / 36],
  '2v1': [125 / 216, 91 / 216],
  '3v1': [855 / 1296, 441 / 1296],
  '1v2': [55 / 216, 161 / 216],
  '2v2': [295 / 1296, 420 / 1296, 581 / 1296],
  '3v2': [2890 / 7776, 2611 / 7776, 2275 / 7776],
};
const winMemo = new Map<string, number>();

/**
 * Telefonda gösterilen kazanma şansı — KESİN olasılık. Önceden benzetimle
 * hesaplanıyordu ve aynı asker sayıları yan yana %61 ile %63 gösteriyordu;
 * oyuncu bunu gerçek bir fark sanıyordu.
 */
export function winChance(attTroops: number, defTroops: number): number {
  if (defTroops <= 0) return 1;
  if (attTroops <= 1) return 0;
  const key = `${attTroops},${defTroops}`;
  const hit = winMemo.get(key);
  if (hit !== undefined) return hit;
  const a = Math.min(3, attTroops - 1);
  const d = Math.min(2, defTroops);
  const p = EXCHANGE[`${a}v${d}`];
  const result = p.length === 2
    ? p[0] * winChance(attTroops, defTroops - 1) + p[1] * winChance(attTroops - 1, defTroops)
    : p[0] * winChance(attTroops, defTroops - 2) + p[1] * winChance(attTroops - 1, defTroops - 1) + p[2] * winChance(attTroops - 2, defTroops);
  winMemo.set(key, result);
  return result;
}

/**
 * Oyuncu renkleri. Fetih'te renk il sahipliğini gösterdiği için iki oyuncu
 * aynı rengi taşıyamaz; seçilen renk alınmışsa sıradaki boş renk veriliyor.
 * İlk 8'i giriş ekranındaki paletle aynı.
 */
export const FETIH_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  '#84CC16', '#92400E', '#1E3A8A', '#64748B',
];

export function uniqueColor(wanted: string, taken: string[]): string {
  const used = new Set(taken.map((c) => c.toLowerCase()));
  if (!used.has(wanted.toLowerCase())) return wanted;
  return FETIH_COLORS.find((c) => !used.has(c.toLowerCase())) ?? wanted;
}

/** Bir bölgeye komşu düşman asker toplamı — "sıcak cephe" ölçüsü. */
export function threatAt(tiles: Record<number, FetihTile>, pid: string, id: number): number {
  return neighborsOf(id)
    .filter((n) => tiles[n].owner !== pid)
    .reduce((sum, n) => sum + (tiles[n].owner ? tiles[n].troops : 0), 0);
}

/** Emir vermeyen oyuncunun yedeği: en sıcak cepheye, eşitse en kalabalık bölgeye. */
export function autoPlacement(tiles: Record<number, FetihTile>, pid: string): number | null {
  const owned = ownedProvinces(tiles, pid);
  if (owned.length === 0) return null;
  const border = owned.filter((id) => neighborsOf(id).some((n) => tiles[n].owner !== pid));
  const pool = border.length > 0 ? border : owned;
  return pool.reduce((best, id) => {
    const tb = threatAt(tiles, pid, best);
    const ti = threatAt(tiles, pid, id);
    if (ti !== tb) return ti > tb ? id : best;
    return tiles[id].troops > tiles[best].troops ? id : best;
  });
}

export interface AttackOption {
  from: number;
  to: number;
  fromTroops: number;
  toTroops: number;
  owner: string | null;
}

/**
 * Yerleştirme HESABA KATILARAK mümkün saldırılar. Telefon bunu tek dokunuşluk
 * liste olarak çiziyor; en elverişli oranlar üstte.
 */
export function attackOptions(
  tiles: Record<number, FetihTile>,
  pid: string,
  placeAt: number | null,
  reserve: number,
): AttackOption[] {
  const out: AttackOption[] = [];
  for (const from of ownedProvinces(tiles, pid)) {
    const fromTroops = tiles[from].troops + (placeAt === from ? reserve : 0);
    if (fromTroops < 2) continue;
    for (const to of neighborsOf(from)) {
      const t = tiles[to];
      if (t.owner === pid) continue;
      out.push({ from, to, fromTroops, toTroops: t.troops, owner: t.owner });
    }
  }
  return out.sort((a, b) => b.fromTroops / b.toTroops - a.fromTroops / a.toTroops || a.toTroops - b.toTroops);
}

export interface FetihOrderInput {
  place: number | null;
  attacks: FetihAttackOrder[];
}

/**
 * Emirleri uygular (tiles'ı değiştirir) ve savaş günlüğünü döndürür.
 *
 * Önce BÜTÜN yerleştirmeler, sonra saldırılar öncelik sırasıyla. Emirler
 * aynı anda ve gizli verildiği için uygulandığı anda artık geçersiz olabilir
 * (kaynak il bu tur elden çıktı, asker kalmadı, hedef zaten ele geçti) —
 * öyle emirler "iptal" olarak günlüğe düşüyor, sessizce yutulmuyor.
 */
export function resolveOrders(
  tiles: Record<number, FetihTile>,
  initiative: string[],
  orders: Record<string, FetihOrderInput | undefined>,
  reserves: Record<string, number>,
  attackLimits: Record<string, number>,
  rand: Rand = Math.random,
): FetihBattle[] {
  for (const pid of initiative) {
    const reserve = reserves[pid] || 0;
    if (reserve <= 0) continue;
    const wanted = orders[pid]?.place ?? null;
    const place = wanted !== null && tiles[wanted]?.owner === pid ? wanted : autoPlacement(tiles, pid);
    if (place !== null) tiles[place].troops += reserve;
  }

  const battles: FetihBattle[] = [];
  for (const pid of initiative) {
    const list = (orders[pid]?.attacks || []).slice(0, attackLimits[pid] || 0);
    for (const { from, to } of list) {
      const src = tiles[from];
      const dst = tiles[to];
      const base = { playerId: pid, from, to, defenderId: dst?.owner ?? null, attLoss: 0, defLoss: 0, conquered: false };
      if (!src || !dst || src.owner !== pid || dst.owner === pid || src.troops < 2 || !areNeighbors(from, to)) {
        battles.push({ ...base, cancelled: true });
        continue;
      }
      const { attLoss, defLoss } = fightBattle(src.troops, dst.troops, rand);
      src.troops -= attLoss;
      dst.troops -= defLoss;
      const conquered = dst.troops <= 0;
      if (conquered) {
        dst.owner = pid;
        dst.troops = src.troops - 1;
        src.troops = 1;
      }
      battles.push({ ...base, attLoss, defLoss, conquered, cancelled: false });
    }
  }
  return battles;
}

/** Toprağı kalmayanları boş bir bölgede yeniden doğurur (tiles'ı değiştirir). */
export function respawnEliminated(tiles: Record<number, FetihTile>, playerIds: string[], rand: Rand = Math.random): string[] {
  const respawned: string[] = [];
  for (const pid of playerIds) {
    if (ownedProvinces(tiles, pid).length > 0) continue;
    const neutral = TERRITORY_IDS.filter((id) => !tiles[id].owner);
    if (neutral.length === 0) continue;
    const pick = neutral[Math.floor(rand() * neutral.length)];
    tiles[pick].owner = pid;
    tiles[pick].troops = RESPAWN_TROOPS;
    respawned.push(pid);
  }
  return respawned;
}
