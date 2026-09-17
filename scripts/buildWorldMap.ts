/**
 * Cihan Fatihi — dünya haritası üreticisi
 * =======================================
 *   npx tsx scripts/buildWorldMap.ts
 *
 * Natural Earth 1:110m ülke sınırlarından (world-atlas) oyun bölgelerini,
 * komşuluklarını ve SVG çizimlerini üretir. Çıktılar derlenmiş halde depoya
 * giriyor; oyun çalışırken bu betik ve bağımlılıkları (world-atlas,
 * topojson-client, d3-geo, polylabel) KULLANILMIYOR — hepsi devDependency.
 *
 *   src/data/worldTerritories.ts  sunucu + istemci: adlar ve komşuluk
 *   src/data/worldShapes.json     yalnızca istemci: çizim (tembel yükleniyor)
 *
 * KOMŞULUK KURALI: iki bölge ancak kara sınırı paylaşıyorsa (topoloji aynı
 * sınır çizgisini paylaşıyor) ya da aşağıdaki DENİZ GEÇİTLERİ listesinde
 * birbirine bağlanmışsa komşu. Başka hiçbir yere gidilemez.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as topojson from 'topojson-client';
import { geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo';
import polylabel from 'polylabel';

const ROOT = resolve(import.meta.dirname, '..');
const topology: any = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/world-atlas/countries-110m.json'), 'utf8'));

/**
 * [anahtar, Türkçe ad, İngilizce ad, üye ülkeler (world-atlas adı)]
 * Küçük ülkeler bölge olarak gruplanıyor: TV'de okunabilmesi ve telefonda
 * dokunulabilmesi için bir bölgenin en az birkaç derece genişliğinde olması
 * gerekiyor. Tartışmalı ya da çok küçük topraklar (Kıbrıs, Tayvan, Falkland,
 * Doğu Timor, Sri Lanka…) hiçbir bölgeye verilmiyor, gri kara olarak çiziliyor.
 */
const TERRITORIES: Array<[string, string, string, string[]]> = [
  // Kuzey ve Orta Amerika
  ['kanada', 'Kanada', 'Canada', ['Canada']],
  ['abd', 'ABD', 'USA', ['United States of America']],
  ['meksika', 'Meksika', 'Mexico', ['Mexico']],
  ['gronland', 'Grönland', 'Greenland', ['Greenland']],
  ['ortaamerika', 'Orta Amerika', 'Central America', ['Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama']],
  ['karayipler', 'Karayipler', 'Caribbean', ['Cuba', 'Haiti', 'Dominican Rep.', 'Jamaica', 'Puerto Rico', 'Bahamas', 'Trinidad and Tobago']],
  // Güney Amerika
  ['kolombiya', 'Kolombiya–Ekvador', 'Colombia & Ecuador', ['Colombia', 'Ecuador']],
  ['venezuela', 'Venezuela', 'Venezuela', ['Venezuela']],
  ['guyanalar', 'Guyanalar', 'The Guianas', ['Guyana', 'Suriname', 'France@guiana']],
  ['peru', 'Peru', 'Peru', ['Peru']],
  ['bolivya', 'Bolivya–Paraguay', 'Bolivia & Paraguay', ['Bolivia', 'Paraguay']],
  ['brezilya', 'Brezilya', 'Brazil', ['Brazil']],
  ['uruguay', 'Uruguay', 'Uruguay', ['Uruguay']],
  ['arjantin', 'Arjantin', 'Argentina', ['Argentina']],
  ['sili', 'Şili', 'Chile', ['Chile']],
  // Avrupa
  ['izlanda', 'İzlanda', 'Iceland', ['Iceland']],
  ['britanya', 'Britanya ve İrlanda', 'UK & Ireland', ['United Kingdom', 'Ireland']],
  ['iskandinavya', 'İskandinavya', 'Nordics', ['Norway', 'Sweden', 'Denmark', 'Finland']],
  ['baltik', 'Baltık', 'Baltics', ['Estonia', 'Latvia', 'Lithuania']],
  ['polonya', 'Polonya', 'Poland', ['Poland']],
  ['almanya', 'Almanya', 'Germany', ['Germany']],
  ['benelux', 'Benelüks', 'Benelux', ['Belgium', 'Netherlands', 'Luxembourg']],
  ['fransa', 'Fransa', 'France', ['France@europe']],
  ['iberya', 'İber Yarımadası', 'Iberia', ['Spain', 'Portugal']],
  ['italya', 'İtalya', 'Italy', ['Italy']],
  ['ortaavrupa', 'Orta Avrupa', 'Central Europe', ['Switzerland', 'Austria', 'Czechia', 'Slovakia', 'Hungary', 'Slovenia']],
  ['balkanlar', 'Balkanlar', 'Balkans', ['Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Macedonia', 'Albania', 'Kosovo', 'Bulgaria']],
  ['yunanistan', 'Yunanistan', 'Greece', ['Greece']],
  ['romanya', 'Romanya–Moldova', 'Romania & Moldova', ['Romania', 'Moldova']],
  ['ukrayna', 'Ukrayna', 'Ukraine', ['Ukraine']],
  ['belarus', 'Belarus', 'Belarus', ['Belarus']],
  ['rusya', 'Rusya', 'Russia', ['Russia']],
  ['turkiye', 'Türkiye', 'Türkiye', ['Turkey']],
  ['kafkasya', 'Kafkasya', 'Caucasus', ['Georgia', 'Armenia', 'Azerbaijan']],
  // Orta Doğu ve Asya
  ['doguakdeniz', 'Doğu Akdeniz', 'Levant', ['Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan']],
  ['irak', 'Irak', 'Iraq', ['Iraq']],
  ['iran', 'İran', 'Iran', ['Iran']],
  ['arabistan', 'Arap Yarımadası', 'Arabia', ['Saudi Arabia', 'Kuwait', 'Qatar', 'United Arab Emirates']],
  ['yemen', 'Yemen–Umman', 'Yemen & Oman', ['Yemen', 'Oman']],
  ['kazakistan', 'Kazakistan', 'Kazakhstan', ['Kazakhstan']],
  ['ortaasya', 'Orta Asya', 'Central Asia', ['Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan']],
  ['afganistan', 'Afganistan', 'Afghanistan', ['Afghanistan']],
  ['pakistan', 'Pakistan', 'Pakistan', ['Pakistan']],
  ['hindistan', 'Hindistan', 'India', ['India']],
  ['nepal', 'Nepal', 'Nepal', ['Nepal']],
  ['banglades', 'Bangladeş', 'Bangladesh', ['Bangladesh']],
  ['cin', 'Çin', 'China', ['China']],
  ['mogolistan', 'Moğolistan', 'Mongolia', ['Mongolia']],
  ['kore', 'Kore Yarımadası', 'Korea', ['North Korea', 'South Korea']],
  ['japonya', 'Japonya', 'Japan', ['Japan']],
  ['myanmar', 'Myanmar', 'Myanmar', ['Myanmar']],
  ['tayland', 'Tayland', 'Thailand', ['Thailand']],
  ['hindicini', 'Hindiçini', 'Indochina', ['Laos', 'Vietnam', 'Cambodia']],
  ['malezya', 'Malezya', 'Malaysia', ['Malaysia', 'Brunei']],
  ['endonezya', 'Endonezya', 'Indonesia', ['Indonesia']],
  ['filipinler', 'Filipinler', 'Philippines', ['Philippines']],
  // Okyanusya
  ['avustralya', 'Avustralya', 'Australia', ['Australia']],
  ['yenizelanda', 'Yeni Zelanda', 'New Zealand', ['New Zealand']],
  ['papua', 'Papua Yeni Gine', 'Papua New Guinea', ['Papua New Guinea']],
  // Afrika
  ['fas', 'Fas', 'Morocco', ['Morocco']],
  ['moritanya', 'Batı Sahra–Moritanya', 'W. Sahara & Mauritania', ['W. Sahara', 'Mauritania']],
  ['cezayir', 'Cezayir', 'Algeria', ['Algeria']],
  ['libya', 'Libya–Tunus', 'Libya & Tunisia', ['Libya', 'Tunisia']],
  ['misir', 'Mısır', 'Egypt', ['Egypt']],
  ['mali', 'Mali', 'Mali', ['Mali']],
  ['nijer', 'Nijer', 'Niger', ['Niger']],
  ['cad', 'Çad', 'Chad', ['Chad']],
  ['sudan', 'Sudan', 'Sudan', ['Sudan']],
  ['ortaafrika', 'Orta Afrika', 'Central Africa', ['Central African Rep.', 'S. Sudan']],
  ['batiafrika', 'Batı Afrika', 'West Africa', ['Senegal', 'Gambia', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', "Côte d'Ivoire"]],
  ['ginekorfezi', 'Gine Körfezi', 'Gulf of Guinea', ['Burkina Faso', 'Ghana', 'Togo', 'Benin']],
  ['nijerya', 'Nijerya', 'Nigeria', ['Nigeria']],
  ['kamerun', 'Kamerun–Gabon', 'Cameroon & Gabon', ['Cameroon', 'Eq. Guinea', 'Gabon', 'Congo']],
  ['kongo', 'Kongo DC', 'DR Congo', ['Dem. Rep. Congo']],
  ['boynuz', 'Afrika Boynuzu', 'Horn of Africa', ['Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Somaliland']],
  ['doguafrika', 'Doğu Afrika', 'East Africa', ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania']],
  ['angola', 'Angola', 'Angola', ['Angola']],
  ['zambiya', 'Zambiya–Zimbabve', 'Zambia & Zimbabwe', ['Zambia', 'Zimbabwe']],
  ['mozambik', 'Mozambik–Malavi', 'Mozambique & Malawi', ['Mozambique', 'Malawi']],
  ['namibya', 'Namibya–Botsvana', 'Namibia & Botswana', ['Namibia', 'Botswana']],
  ['guneyafrika', 'Güney Afrika', 'South Africa', ['South Africa', 'Lesotho', 'eSwatini']],
  ['madagaskar', 'Madagaskar', 'Madagascar', ['Madagascar']],
];

/**
 * DENİZ GEÇİTLERİ — kara sınırı olmayan ama gerçekte kısa bir denizle ayrılan
 * bölgeler. Yalnızca gerçek, bilinen geçitler: Manş, Cebelitarık, Bering,
 * Bab-ül Mendep… Adalar (İzlanda, Japonya, Madagaskar, Yeni Zelanda) ancak
 * bunlarla oyuna bağlanıyor.
 */
const SEA_LINKS: Array<[string, string]> = [
  ['kanada', 'gronland'],        // Nares Boğazı
  ['gronland', 'izlanda'],       // Danimarka Boğazı
  ['izlanda', 'britanya'],
  ['britanya', 'fransa'],        // Manş
  ['britanya', 'iskandinavya'],  // Kuzey Denizi
  ['iskandinavya', 'baltik'],    // Finlandiya Körfezi
  ['abd', 'rusya'],              // Bering Boğazı
  ['abd', 'karayipler'],         // Florida Boğazı
  ['meksika', 'karayipler'],     // Yucatán Kanalı
  ['karayipler', 'venezuela'],
  ['iberya', 'fas'],             // Cebelitarık
  ['italya', 'libya'],           // Sicilya Kanalı
  ['italya', 'yunanistan'],      // Otranto
  ['misir', 'arabistan'],        // Akabe Körfezi
  ['yemen', 'boynuz'],           // Bab-ül Mendep
  ['arabistan', 'iran'],         // Basra Körfezi
  ['madagaskar', 'mozambik'],    // Mozambik Kanalı
  ['japonya', 'kore'],           // Kore Boğazı
  ['japonya', 'rusya'],          // La Pérouse (Sahalin)
  ['filipinler', 'malezya'],
  ['filipinler', 'endonezya'],
  ['endonezya', 'avustralya'],   // Timor Denizi
  ['papua', 'avustralya'],       // Torres Boğazı
  ['avustralya', 'yenizelanda'], // Tasman Denizi
];

// --- 1) Her ülkeyi çokgenlerine ayır, çokgenleri bölgelere ata --------------
const keyOf = new Map<string, number>();
TERRITORIES.forEach(([key], i) => keyOf.set(key, i + 1));
const memberOf = new Map<string, number>();
TERRITORIES.forEach(([, , , members], i) => members.forEach((m) => memberOf.set(m, i + 1)));

type PolyObj = { type: 'Polygon'; arcs: number[][]; territory: number | null; country: string };
const polys: PolyObj[] = [];
const usedMembers = new Set<string>();

for (const g of topology.objects.countries.geometries) {
  const name: string = g.properties.name;
  if (name === 'Antarctica' || name === 'Fr. S. Antarctic Lands') continue;
  const parts: number[][][] = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  for (const arcs of parts) {
    let member = name;
    if (name === 'France') {
      const [lon] = geoCentroid(topojson.feature(topology, { type: 'Polygon', arcs } as any) as any);
      member = lon < -20 ? 'France@guiana' : 'France@europe';
    }
    const territory = memberOf.get(member) ?? null;
    if (territory) usedMembers.add(member);
    polys.push({ type: 'Polygon', arcs, territory, country: name });
  }
}
for (const m of memberOf.keys()) if (!usedMembers.has(m)) throw new Error(`Haritada bulunamayan üye: ${m}`);

// --- 2) Kara komşulukları: aynı sınır çizgisini paylaşan çokgenler ----------
const N = TERRITORIES.length;
const neighbors = new Map<number, Set<number>>();
for (let i = 1; i <= N; i++) neighbors.set(i, new Set());
const polyNeighbors = topojson.neighbors(polys as any);
polyNeighbors.forEach((list, i) => {
  const a = polys[i].territory;
  if (!a) return;
  for (const j of list) {
    const b = polys[j].territory;
    if (b && b !== a) {
      neighbors.get(a)!.add(b);
      neighbors.get(b)!.add(a);
    }
  }
});
const land = new Map([...neighbors].map(([k, v]) => [k, new Set(v)]));
for (const [a, b] of SEA_LINKS) {
  const ia = keyOf.get(a), ib = keyOf.get(b);
  if (!ia || !ib) throw new Error(`Deniz geçidinde bilinmeyen bölge: ${a}–${b}`);
  if (land.get(ia)!.has(ib)) console.warn(`uyarı: ${a}–${b} zaten kara komşusu, geçit gereksiz`);
  neighbors.get(ia)!.add(ib);
  neighbors.get(ib)!.add(ia);
}

// Tek parça mı?
{
  const seen = new Set([1]);
  const q = [1];
  while (q.length) for (const n of neighbors.get(q.shift()!)!) if (!seen.has(n)) { seen.add(n); q.push(n); }
  const lost = TERRITORIES.filter((_, i) => !seen.has(i + 1)).map(([k]) => k);
  if (lost.length) throw new Error(`Bağlantısız bölgeler: ${lost.join(', ')}`);
}

// --- 3) Çizim -------------------------------------------------------------
const WIDTH = 1000;
const landFeature = topojson.merge(topology, polys as any);
const projection = geoNaturalEarth1().fitWidth(WIDTH, landFeature as any);
const path = geoPath(projection).digits(1);
const [[bx0, by0], [bx1, by1]] = path.bounds(landFeature as any);
const PAD = 6;
const viewBox = { x: Math.floor(bx0 - PAD), y: Math.floor(by0 - PAD), w: Math.ceil(bx1 - bx0 + 2 * PAD), h: Math.ceil(by1 - by0 + 2 * PAD) };

const background = path(topojson.merge(topology, polys.filter((p) => !p.territory) as any) as any) || '';

type Shape = { d: string; ax: number; ay: number; lx: number; ly: number };
const shapes: Record<number, Shape> = {};
for (let id = 1; id <= N; id++) {
  const merged = topojson.merge(topology, polys.filter((p) => p.territory === id) as any) as any;
  const d = path(merged) || '';
  // Etiket: en büyük çokgenin "erişilmezlik kutbu" — ince ülkelerde (Şili,
  // İtalya) ağırlık merkezi sınırın DIŞINA düşebiliyor; bu nokta hep içeride.
  let best: { area: number; rings: number[][][] } | null = null;
  for (const coords of merged.coordinates as number[][][][]) {
    const rings = coords.map((ring) => ring.map((pt) => projection(pt as [number, number])!).filter(Boolean));
    const outer = rings[0];
    if (!outer || outer.length < 3) continue;
    let area = 0;
    for (let k = 0, m = outer.length - 1; k < outer.length; m = k++) area += (outer[m][0] + outer[k][0]) * (outer[m][1] - outer[k][1]);
    area = Math.abs(area / 2);
    if (!best || area > best.area) best = { area, rings };
  }
  const p = polylabel(best!.rings as any, 0.5);
  shapes[id] = { d, ax: +p[0].toFixed(1), ay: +p[1].toFixed(1), lx: +p[0].toFixed(1), ly: +p[1].toFixed(1) };
}

/**
 * Rozet çakışması: Avrupa'da bölgeler sık. Birbirine R'den yakın rozetler
 * birkaç tur boyunca birbirinden itiliyor; asıl noktasından belirgin kayan
 * rozet çizimde ince bir çizgiyle bölgesine bağlanıyor.
 */
const BADGE_GAP = 19;
for (let iter = 0; iter < 200; iter++) {
  let moved = false;
  for (let i = 1; i <= N; i++) {
    for (let j = i + 1; j <= N; j++) {
      const a = shapes[i], b = shapes[j];
      const dx = b.lx - a.lx, dy = b.ly - a.ly;
      const dist = Math.hypot(dx, dy) || 0.01;
      if (dist < BADGE_GAP) {
        const push = (BADGE_GAP - dist) / 2 + 0.05;
        const ux = dx / dist, uy = dy / dist;
        a.lx -= ux * push; a.ly -= uy * push;
        b.lx += ux * push; b.ly += uy * push;
        moved = true;
      }
    }
  }
  // Rozetler asıl noktalarına hafifçe geri çekilsin, haritanın dışına taşmasın
  for (let i = 1; i <= N; i++) {
    const s = shapes[i];
    s.lx += (s.ax - s.lx) * 0.02;
    s.ly += (s.ay - s.ly) * 0.02;
  }
  if (!moved) break;
}
for (const s of Object.values(shapes)) { s.lx = +s.lx.toFixed(1); s.ly = +s.ly.toFixed(1); }

const seaLinks = SEA_LINKS.map(([a, b]) => [keyOf.get(a)!, keyOf.get(b)!]);

// --- 4) Yaz ---------------------------------------------------------------
const header = `/* OTOMATİK ÜRETİLDİ — scripts/buildWorldMap.ts. Elle düzenleme; betiği değiştirip yeniden çalıştır. */\n`;
const ts = `${header}
export interface WorldTerritory {
  id: number;
  key: string;
  tr: string;
  en: string;
}

export const WORLD_TERRITORIES: WorldTerritory[] = ${JSON.stringify(TERRITORIES.map(([key, tr, en], i) => ({ id: i + 1, key, tr, en })), null, 2)};

/** Komşuluk: kara sınırı ya da deniz geçidi. Başka hiçbir bölgeye gidilemez. */
export const WORLD_NEIGHBORS: Record<number, number[]> = ${JSON.stringify(Object.fromEntries([...neighbors].map(([k, v]) => [k, [...v].sort((x, y) => x - y)])))};

/** Kara sınırı olmayan, deniz geçidiyle bağlı çiftler (haritada kesik çizgi). */
export const WORLD_SEA_LINKS: Array<[number, number]> = ${JSON.stringify(seaLinks)};
`;
writeFileSync(resolve(ROOT, 'src/data/worldTerritories.ts'), ts);
writeFileSync(resolve(ROOT, 'src/data/worldShapes.json'), JSON.stringify({ viewBox, background, shapes }));

const degrees = [...neighbors.values()].map((s) => s.size);
console.log(`${N} bölge · komşu sayısı min ${Math.min(...degrees)} / ort ${(degrees.reduce((a, b) => a + b, 0) / N).toFixed(1)} / max ${Math.max(...degrees)}`);
console.log(`viewBox ${JSON.stringify(viewBox)} · shapes ${(JSON.stringify(shapes).length / 1024).toFixed(0)} KB · background ${(background.length / 1024).toFixed(0)} KB`);
console.log('atanmayan (gri) ülkeler:', [...new Set(polys.filter((p) => !p.territory).map((p) => p.country))].join(', '));
const name = (i: number) => TERRITORIES[i - 1][0];
for (const k of ['turkiye', 'rusya', 'abd', 'misir', 'japonya', 'izlanda', 'fransa', 'hindistan', 'kanada']) {
  const i = keyOf.get(k)!;
  console.log(`  ${k}: ${[...neighbors.get(i)!].map(name).join(', ')}`);
}
