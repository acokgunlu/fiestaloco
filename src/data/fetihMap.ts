/**
 * İl İl Fetih — altıgen Türkiye haritası
 * ======================================
 * 81 il gerçek enlem/boylamından en yakın BOŞ altıgene oturtuluyor. Harita
 * bir sınır çizimi değil, "hangi il nerede, kime komşu" sorusunu cevaplayan
 * bir oyun tahtası. Altıgen seçildi çünkü her hücrenin komşuluğu net (en çok
 * 6) ve gerçek il sınırlarını çizmeye gerek kalmıyor.
 *
 * Yerleşim DETERMİNİSTİK: sunucu komşuluğu, TV ve telefon çizimi aynı
 * modülden aynı sonucu üretiyor; ağdan harita geçmiyor, yalnızca il
 * numaraları geçiyor.
 *
 * Tek kural düzeltmesi: yerleşim sonunda grafın tek parça olduğu garanti
 * ediliyor. Bir il altıgen düzeninde komşusuz kalırsa ona en yakın ilden
 * köprü kuruluyor — yoksa o il ne fethedilebilir ne oradan çıkılabilir.
 */

export interface FetihProvince {
  /** Plaka kodu — aynı zamanda il kimliği. */
  id: number;
  name: string;
  /** Altıgen merkezi (harita koordinatı). */
  x: number;
  y: number;
}

/** [plaka, ad, enlem, boylam] */
const PROV: Array<[number, string, number, number]> = [
  [1, 'Adana', 37.0, 35.32], [2, 'Adıyaman', 37.76, 38.28], [3, 'Afyonkarahisar', 38.76, 30.54], [4, 'Ağrı', 39.72, 43.05],
  [5, 'Amasya', 40.65, 35.83], [6, 'Ankara', 39.93, 32.86], [7, 'Antalya', 36.89, 30.71], [8, 'Artvin', 41.18, 41.82],
  [9, 'Aydın', 37.85, 27.85], [10, 'Balıkesir', 39.65, 27.88], [11, 'Bilecik', 40.14, 29.98], [12, 'Bingöl', 38.88, 40.5],
  [13, 'Bitlis', 38.4, 42.11], [14, 'Bolu', 40.74, 31.61], [15, 'Burdur', 37.72, 30.29], [16, 'Bursa', 40.18, 29.06],
  [17, 'Çanakkale', 40.15, 26.41], [18, 'Çankırı', 40.6, 33.62], [19, 'Çorum', 40.55, 34.95], [20, 'Denizli', 37.78, 29.09],
  [21, 'Diyarbakır', 37.91, 40.22], [22, 'Edirne', 41.68, 26.56], [23, 'Elazığ', 38.67, 39.22], [24, 'Erzincan', 39.75, 39.49],
  [25, 'Erzurum', 39.9, 41.27], [26, 'Eskişehir', 39.78, 30.52], [27, 'Gaziantep', 37.07, 37.38], [28, 'Giresun', 40.91, 38.39],
  [29, 'Gümüşhane', 40.46, 39.48], [30, 'Hakkari', 37.58, 43.74], [31, 'Hatay', 36.2, 36.16], [32, 'Isparta', 37.76, 30.55],
  [33, 'Mersin', 36.8, 34.64], [34, 'İstanbul', 41.01, 28.98], [35, 'İzmir', 38.42, 27.14], [36, 'Kars', 40.6, 43.1],
  [37, 'Kastamonu', 41.38, 33.78], [38, 'Kayseri', 38.73, 35.49], [39, 'Kırklareli', 41.73, 27.22], [40, 'Kırşehir', 39.15, 34.17],
  [41, 'Kocaeli', 40.77, 29.92], [42, 'Konya', 37.87, 32.48], [43, 'Kütahya', 39.42, 29.98], [44, 'Malatya', 38.35, 38.31],
  [45, 'Manisa', 38.61, 27.43], [46, 'Kahramanmaraş', 37.58, 36.94], [47, 'Mardin', 37.31, 40.74], [48, 'Muğla', 37.22, 28.36],
  [49, 'Muş', 38.74, 41.49], [50, 'Nevşehir', 38.62, 34.72], [51, 'Niğde', 37.97, 34.68], [52, 'Ordu', 40.98, 37.88],
  [53, 'Rize', 41.03, 40.52], [54, 'Sakarya', 40.69, 30.44], [55, 'Samsun', 41.29, 36.33], [56, 'Siirt', 37.93, 41.94],
  [57, 'Sinop', 42.03, 35.15], [58, 'Sivas', 39.75, 37.02], [59, 'Tekirdağ', 40.98, 27.51], [60, 'Tokat', 40.31, 36.55],
  [61, 'Trabzon', 41.0, 39.72], [62, 'Tunceli', 39.11, 39.55], [63, 'Şanlıurfa', 37.16, 38.8], [64, 'Uşak', 38.68, 29.41],
  [65, 'Van', 38.5, 43.38], [66, 'Yozgat', 39.82, 34.81], [67, 'Zonguldak', 41.46, 31.8], [68, 'Aksaray', 38.37, 34.03],
  [69, 'Bayburt', 40.26, 40.23], [70, 'Karaman', 37.18, 33.22], [71, 'Kırıkkale', 39.85, 33.51], [72, 'Batman', 37.89, 41.13],
  [73, 'Şırnak', 37.52, 42.46], [74, 'Bartın', 41.63, 32.34], [75, 'Ardahan', 41.11, 42.7], [76, 'Iğdır', 39.92, 44.05],
  [77, 'Yalova', 40.66, 29.27], [78, 'Karabük', 41.2, 32.62], [79, 'Kilis', 36.72, 37.12], [80, 'Osmaniye', 37.07, 36.25],
  [81, 'Düzce', 40.84, 31.16],
];

/** Altıgen yarıçapı (harita birimi). */
export const HEX_R = 10;
const HW = Math.sqrt(3) * HEX_R;
/** Boylam/enlemi harita birimine çeviren ölçek — Türkiye'nin en-boy oranı korunuyor. */
const KX = 0.82 * HW;
const KY = 1.29 * KX;

/**
 * Önce büyük şehirler yerleşiyor: en kalabalık bölgelerde (Marmara, Ege)
 * hücreler çabuk doluyor ve sonra gelen il biraz kayıyor. Tanınan şehirler
 * kaymasın, küçük komşuları kaysın.
 */
const ANCHORS = [34, 6, 35, 1, 7, 16, 21, 42, 61, 65, 55, 25];

const center = (c: number, r: number): [number, number] => [HW * (c + 0.5 * (r & 1)), 1.5 * HEX_R * r];

const cells = new Map<string, { id: number; c: number; r: number }>();
const provinces = new Map<number, FetihProvince & { c: number; r: number }>();

{
  const anchor = new Set(ANCHORS);
  const order = [...PROV].sort((a, b) => Number(anchor.has(b[0])) - Number(anchor.has(a[0])) || a[0] - b[0]);
  for (const [id, name, lat, lon] of order) {
    const tx = (lon - 25.5) * KX;
    const ty = (42.3 - lat) * KY;
    const r0 = Math.round(ty / (1.5 * HEX_R));
    let best: { c: number; r: number; x: number; y: number; d: number } | null = null;
    for (let dr = -4; dr <= 4; dr++) {
      const r = r0 + dr;
      if (r < 0) continue;
      const c0 = Math.round(tx / HW - 0.5 * (r & 1));
      for (let dc = -4; dc <= 4; dc++) {
        const c = c0 + dc;
        if (c < 0 || cells.has(`${c},${r}`)) continue;
        const [x, y] = center(c, r);
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (!best || d < best.d) best = { c, r, x, y, d };
      }
    }
    if (!best) throw new Error(`fetihMap: ${name} için hücre bulunamadı`);
    cells.set(`${best.c},${best.r}`, { id, c: best.c, r: best.r });
    provinces.set(id, { id, name, x: best.x, y: best.y, c: best.c, r: best.r });
  }
}

const adjacency = new Map<number, Set<number>>();
for (const p of provinces.values()) {
  const odd = p.r & 1;
  const d = odd
    ? [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]]
    : [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]];
  const set = new Set<number>();
  for (const [dc, dr] of d) {
    const n = cells.get(`${p.c + dc},${p.r + dr}`);
    if (n) set.add(n.id);
  }
  adjacency.set(p.id, set);
}

// Tek parça garantisi: ana gövdeye bağlı olmayan her parçayı en yakın ile köprüle.
{
  const component = (start: number): Set<number> => {
    const seen = new Set([start]);
    const q = [start];
    while (q.length) {
      const cur = q.shift()!;
      for (const n of adjacency.get(cur)!) if (!seen.has(n)) { seen.add(n); q.push(n); }
    }
    return seen;
  };
  for (let guard = 0; guard < 81; guard++) {
    const main = component(34);
    if (main.size === provinces.size) break;
    let best: { a: number; b: number; d: number } | null = null;
    for (const a of provinces.values()) {
      if (main.has(a.id)) continue;
      for (const bId of main) {
        const b = provinces.get(bId)!;
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (!best || d < best.d) best = { a: a.id, b: bId, d };
      }
    }
    if (!best) break;
    adjacency.get(best.a)!.add(best.b);
    adjacency.get(best.b)!.add(best.a);
  }
}

export const FETIH_PROVINCES: FetihProvince[] = [...provinces.values()]
  .map(({ id, name, x, y }) => ({ id, name, x, y }))
  .sort((a, b) => a.id - b.id);

export const FETIH_PROVINCE_IDS: number[] = FETIH_PROVINCES.map((p) => p.id);

const nameById = new Map(FETIH_PROVINCES.map((p) => [p.id, p.name]));

export function provinceName(id: number): string {
  return nameById.get(id) ?? `#${id}`;
}

export function neighborsOf(id: number): number[] {
  return [...(adjacency.get(id) ?? [])].sort((a, b) => a - b);
}

export function areNeighbors(a: number, b: number): boolean {
  return adjacency.get(a)?.has(b) ?? false;
}

/** SVG viewBox — bütün altıgenler ve kenar payı. */
export const FETIH_VIEWBOX = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of FETIH_PROVINCES) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const pad = HEX_R + 4;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + 2 * pad, h: maxY - minY + 2 * pad };
})();

/** Sivri tepeli altıgenin köşeleri (SVG `points`). */
export function hexPoints(x: number, y: number, scale = 0.97): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(x + HEX_R * scale * Math.cos(a)).toFixed(1)},${(y + HEX_R * scale * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}
