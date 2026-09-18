/**
 * Galaksi — saf kurallar (sunucu ve telefon aynı modülü kullanıyor)
 * =================================================================
 * Tahta, düz tepeli altıgenlerden oluşan bir galaksi. Hücre kimliği,
 * `geometry(radius)` listesindeki sıradır; iki taraf da aynı yarıçaptan aynı
 * listeyi üretir, ağdan yalnızca kimlikler geçer.
 *
 * SİS: bir sektörün türü (boş, gezegen, asteroit, kara delik) sunucuda
 * `secrets` içinde tutulur ve ancak sektör açıldığında gameState'e yazılır.
 * Telefon açılmamış bir sektörün ne olduğunu hiçbir yoldan bilemez.
 */

export type GalaxyKind = 'empty' | 'planet' | 'asteroid' | 'hole';

export interface GalaxyCell {
  id: number;
  q: number;
  r: number;
  name: string;
  /** Yalnızca açılmış sektörlerde dolu; sisli sektörde null. */
  kind: GalaxyKind | null;
  owner: string | null;
  /** Burası kimin ana yıldızı. */
  home: string | null;
  revealed: boolean;
}

export interface GalaxyMove {
  from: number;
  to: number;
}

type Rand = () => number;

export const GALAXY_TIMES = { pick: 25, vote: 10, question: 15, answer: 5, orders: 30, duel: 12, duelReveal: 5 } as const;
export const GALAXY_STEP_MS = 700;

/** Düz tepeli altıgen komşuları, pusula sırasıyla: K, KD, GD, G, GB, KB. */
export const DIRS = [
  { dq: 0, dr: -1, name: 'Kuzey', arrow: '↑' },
  { dq: 1, dr: -1, name: 'Kuzeydoğu', arrow: '↗' },
  { dq: 1, dr: 0, name: 'Güneydoğu', arrow: '↘' },
  { dq: 0, dr: 1, name: 'Güney', arrow: '↓' },
  { dq: -1, dr: 1, name: 'Güneybatı', arrow: '↙' },
  { dq: -1, dr: 0, name: 'Kuzeybatı', arrow: '↖' },
];

const NAMES = [
  'Vega', 'Rigel', 'Lyra', 'Orion', 'Draco', 'Nova', 'Mira', 'Atlas', 'Altair', 'Deneb', 'Sirius', 'Kapella', 'Antares',
  'Polaris', 'Kasiopea', 'Andromeda', 'Pegasus', 'Fenix', 'Hidra', 'Kuzgun', 'Terazi', 'Akrep', 'Aslan', 'Başak', 'Boğa',
  'Kova', 'Balık', 'İkizler', 'Yengeç', 'Oğlak', 'Koç', 'Kartal', 'Yunus', 'Tavşan', 'Kanopus', 'Alfa', 'Beta', 'Gama',
  'Delta', 'Zeta', 'Eta', 'Teta', 'İota', 'Kappa', 'Lamda', 'Mu', 'Nu', 'Ksi', 'Omikron', 'Pi', 'Ro', 'Sigma', 'Tau',
  'Upsilon', 'Fi', 'Ki', 'Psi', 'Omega', 'Aurora', 'Zenit', 'Nadir', 'Arktur', 'Spika', 'Kastor', 'Polluks', 'Regulus',
  'Aldebaran', 'Betelgeuse', 'Bellatrix', 'Mizar', 'Alkor', 'Algol', 'Markab', 'Şedar', 'Kaf', 'Fomalhaut', 'Akernar',
  'Hadar', 'Mimosa', 'Sadr', 'Gienah', 'Alnitak', 'Alnilam', 'Mintaka', 'Saif', 'Elnath', 'Menkar', 'Hamal', 'Alfirk',
  'Enif', 'Merak', 'Dubhe',
];

/* ---------------------------------------------------------------- geometri */

interface Geometry {
  coords: Array<{ q: number; r: number }>;
  /** Hücre id → komşu id'leri (tahta dışı yönler atlanır). */
  neighbors: number[][];
  /** Hücre id → yön indeksi başına komşu id'si ya da null. */
  byDir: Array<Array<number | null>>;
}

const geoCache = new Map<number, Geometry>();

export function geometry(radius: number): Geometry {
  const hit = geoCache.get(radius);
  if (hit) return hit;
  const coords: Array<{ q: number; r: number }> = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) if (Math.abs(q + r) <= radius) coords.push({ q, r });
  }
  const index = new Map(coords.map((c, i) => [`${c.q},${c.r}`, i]));
  const byDir = coords.map((c) => DIRS.map((d) => index.get(`${c.q + d.dq},${c.r + d.dr}`) ?? null));
  const neighbors = byDir.map((row) => row.filter((n): n is number => n !== null));
  const geo = { coords, neighbors, byDir };
  geoCache.set(radius, geo);
  return geo;
}

/** Oyuncu sayısına göre tahta: 4 kişiye kadar 61, üstü 91 sektör. */
export function radiusFor(playerCount: number): number {
  return playerCount <= 4 ? 4 : 5;
}

export function hexDist(a: { q: number; r: number }, b: { q: number; r: number }): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function shuffle<T>(arr: T[], rand: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------- galaksi üret */

/**
 * Boş (tamamen sisli) hücre listesi ve gizli türler.
 * Kara delikler birbirine değmez ve geçilebilir sektörler tek parça kalır —
 * yoksa bir oyuncu kara deliklerle çevrili bir cepte doğup hiç çıkamazdı.
 */
export function createGalaxy(radius: number, rand: Rand = Math.random): { cells: GalaxyCell[]; secrets: Record<number, GalaxyKind> } {
  const geo = geometry(radius);
  const n = geo.coords.length;
  const ring = (i: number) => Math.max(Math.abs(geo.coords[i].q), Math.abs(geo.coords[i].r), Math.abs(geo.coords[i].q + geo.coords[i].r));
  const holeCount = Math.round(n * 0.05);
  const planetCount = Math.round(n * 0.21);
  const asteroidCount = Math.round(n * 0.15);

  for (let attempt = 0; attempt < 80; attempt++) {
    const kinds: GalaxyKind[] = new Array(n).fill('empty');
    const order = shuffle([...Array(n).keys()], rand);
    let holes = 0;
    for (const i of order) {
      if (holes >= holeCount) break;
      if (ring(i) >= 1 && ring(i) < radius && !geo.neighbors[i].some((j) => kinds[j] === 'hole')) { kinds[i] = 'hole'; holes++; }
    }
    let planets = 0, asteroids = 0;
    for (const i of order) {
      if (kinds[i] !== 'empty') continue;
      if (planets < planetCount) { kinds[i] = 'planet'; planets++; } else if (asteroids < asteroidCount) { kinds[i] = 'asteroid'; asteroids++; }
    }
    const open = [...Array(n).keys()].filter((i) => kinds[i] !== 'hole');
    const seen = new Set([open[0]]);
    const stack = [open[0]];
    while (stack.length) {
      const c = stack.pop()!;
      for (const j of geo.neighbors[c]) if (kinds[j] !== 'hole' && !seen.has(j)) { seen.add(j); stack.push(j); }
    }
    if (seen.size !== open.length) continue;

    const names = shuffle(NAMES, rand);
    const cells: GalaxyCell[] = geo.coords.map((c, i) => ({
      id: i, q: c.q, r: c.r, name: names[i] ?? `Sektör ${i + 1}`, kind: null, owner: null, home: null, revealed: false,
    }));
    const secrets: Record<number, GalaxyKind> = {};
    kinds.forEach((k, i) => { secrets[i] = k; });
    return { cells, secrets };
  }
  throw new Error('Galaksi üretilemedi');
}

/** Bir sektörü açar: türü gameState'e yazılır. */
export function reveal(cells: GalaxyCell[], secrets: Record<number, GalaxyKind>, id: number): void {
  const c = cells[id];
  if (!c || c.revealed) return;
  c.revealed = true;
  c.kind = secrets[id] ?? 'empty';
}

/** Sahipli her sektörün komşularını açar (sis kalkar). */
export function revealAroundOwned(cells: GalaxyCell[], secrets: Record<number, GalaxyKind>, radius: number): void {
  const geo = geometry(radius);
  for (const c of cells) {
    if (!c.owner) continue;
    reveal(cells, secrets, c.id);
    for (const j of geo.neighbors[c.id]) reveal(cells, secrets, j);
  }
}

/* ------------------------------------------------------------- ana yıldız */

export function canPlaceHome(cells: GalaxyCell[], id: number, minDist: number): boolean {
  const c = cells[id];
  if (!c || c.owner) return false;
  if (c.revealed && c.kind === 'hole') return false;
  return cells.every((o) => !o.home || hexDist(o, c) >= minDist);
}

/** Yerleşebilecek bir yer kalmadıysa mesafe şartı gevşer. */
export function homeCandidates(cells: GalaxyCell[]): { ids: number[]; minDist: number } {
  for (const minDist of [3, 2, 1]) {
    const ids = cells.filter((c) => canPlaceHome(cells, c.id, minDist)).map((c) => c.id);
    if (ids.length) return { ids, minDist };
  }
  return { ids: [], minDist: 1 };
}

/* ---------------------------------------------------------------- hamle */

/** Plan sırasında "benim sayılan" sektörler: benim olanlar + planladığım sahipsiz hedefler. */
export function ownish(cells: GalaxyCell[], pid: string, plan: GalaxyMove[]): Set<number> {
  const set = new Set(cells.filter((c) => c.owner === pid).map((c) => c.id));
  for (const m of plan) if (!cells[m.to]?.owner) set.add(m.to);
  return set;
}

export type TargetKind = 'mine' | 'planned' | 'hole' | 'noEnergy' | 'enemy' | 'fog' | 'open';

/** Bir komşuya gidilebilir mi, gidilirse ne olur. */
export function targetState(cells: GalaxyCell[], pid: string, plan: GalaxyMove[], energy: number, toId: number): { ok: boolean; kind: TargetKind } {
  const t = cells[toId];
  if (!t) return { ok: false, kind: 'hole' };
  if (t.owner === pid) return { ok: false, kind: 'mine' };
  if (plan.some((m) => m.to === toId)) return { ok: false, kind: 'planned' };
  if (t.revealed && t.kind === 'hole') return { ok: false, kind: 'hole' };
  if (plan.length >= energy) return { ok: false, kind: 'noEnergy' };
  if (t.owner) return { ok: true, kind: 'enemy' };
  if (!t.revealed) return { ok: true, kind: 'fog' };
  return { ok: true, kind: 'open' };
}

/** Yeni bir adımın plana eklenebilir olup olmadığı (sunucu da aynısını denetliyor). */
export function canQueue(cells: GalaxyCell[], radius: number, pid: string, plan: GalaxyMove[], energy: number, move: GalaxyMove): boolean {
  if (!ownish(cells, pid, plan).has(move.from)) return false;
  if (!geometry(radius).neighbors[move.from]?.includes(move.to)) return false;
  return targetState(cells, pid, plan, energy, move.to).ok;
}

/** Hamle yapılabilecek sektörler (en az bir geçerli komşusu olan). */
export function frontier(cells: GalaxyCell[], radius: number, pid: string, plan: GalaxyMove[], energy: number): number[] {
  const geo = geometry(radius);
  return [...ownish(cells, pid, plan)].filter((id) => geo.neighbors[id].some((j) => targetState(cells, pid, plan, energy, j).ok));
}

/* ---------------------------------------------------------------- puan */

/** Sektör 1, gezegen 3 puan. */
export function scoreOf(cells: GalaxyCell[], pid: string): { sectors: number; planets: number; score: number } {
  let sectors = 0, planets = 0;
  for (const c of cells) {
    if (c.owner !== pid) continue;
    sectors++;
    if (c.kind === 'planet') planets++;
  }
  return { sectors, planets, score: sectors + planets * 2 };
}

/**
 * Ana yıldız düştü: savunanın sektörlerinin yarısı (düşen yıldıza en yakın
 * olanlar) fethedene geçer; savunan kalan bölgesinde, saldırgandan en uzak
 * sektörde yeni ana yıldız kurar. Hiç sektörü kalmazsa boş bir yerde doğar.
 */
export function homeFalls(cells: GalaxyCell[], attackerId: string, defenderId: string, fallenId: number, rand: Rand = Math.random): { transferred: number; newHome: number | null } {
  const fallen = cells[fallenId];
  fallen.home = null;
  const rest = cells.filter((c) => c.owner === defenderId).sort((a, b) => hexDist(a, fallen) - hexDist(b, fallen));
  const give = rest.slice(0, Math.floor(rest.length / 2));
  give.forEach((c) => { c.owner = attackerId; });
  const attHome = cells.find((c) => c.home === attackerId) ?? fallen;
  const remain = cells.filter((c) => c.owner === defenderId);
  let newHome: number | null = null;
  if (remain.length) {
    const nh = remain.sort((a, b) => hexDist(b, attHome) - hexDist(a, attHome))[0];
    nh.home = defenderId;
    newHome = nh.id;
  } else {
    newHome = respawnSpot(cells, rand);
    if (newHome !== null) { cells[newHome].owner = defenderId; cells[newHome].home = defenderId; }
  }
  return { transferred: give.length, newHome };
}

/** Kimsenin olmayan, sahipli sektörlere uzak (açık kara delik olmayan) bir yer. */
export function respawnSpot(cells: GalaxyCell[], rand: Rand = Math.random): number | null {
  const free = cells.filter((c) => !c.owner && !(c.revealed && c.kind === 'hole'));
  const far = free.filter((c) => cells.every((o) => !o.owner || hexDist(o, c) >= 2));
  const pool = far.length ? far : free;
  return pool.length ? pool[Math.floor(rand() * pool.length)].id : null;
}

/* ---------------------------------------------------------------- renkler */

/**
 * Oyuncu renkleri. Galakside renk bölge sahipliğini gösterdiği için iki oyuncu
 * aynı rengi taşıyamaz; seçilen renk alınmışsa sıradaki boş renk veriliyor.
 */
export const GALAXY_COLORS = [
  '#00f5d4', '#ff3cac', '#c6ff00', '#ffb703', '#8b5cf6', '#3b82f6', '#f97316', '#ef4444',
  '#06d6a0', '#f72585', '#4cc9f0', '#e9c46a',
];

export function uniqueColor(wanted: string, taken: string[]): string {
  const used = new Set(taken.map((c) => c.toLowerCase()));
  if (!used.has(wanted.toLowerCase())) return wanted;
  return GALAXY_COLORS.find((c) => !used.has(c.toLowerCase())) ?? wanted;
}
