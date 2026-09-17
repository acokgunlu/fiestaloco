import type { ContentLang } from './contentLang';
import { WORLD_NEIGHBORS, WORLD_SEA_LINKS, WORLD_TERRITORIES } from './worldTerritories';

/**
 * Cihan Fatihi — dünya haritası tahtası
 * =====================================
 * Bölgeler, adları ve komşuluk scripts/buildWorldMap.ts ile Natural Earth
 * ülke sınırlarından üretiliyor (src/data/worldTerritories.ts). Bu modül
 * sunucuda da çalıştığı için çizim verisi BURADA DEĞİL: çizim
 * worldShapes.json'da ve yalnızca istemci onu tembel yüklüyor.
 *
 * Komşuluk = kara sınırı ya da bilinen kısa deniz geçidi. Saldırı ve emir
 * doğrulaması yalnızca bu listeye bakıyor; komşu olmayan bir bölgeye hiçbir
 * yoldan gidilemiyor.
 */

export const TERRITORY_IDS: number[] = WORLD_TERRITORIES.map((t) => t.id);

const byId = new Map(WORLD_TERRITORIES.map((t) => [t.id, t]));
const adjacency = new Map<number, Set<number>>(
  Object.entries(WORLD_NEIGHBORS).map(([k, v]) => [Number(k), new Set(v)]),
);
const sea = new Set(WORLD_SEA_LINKS.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));

export function territoryName(id: number, lang: ContentLang = 'tr'): string {
  const t = byId.get(id);
  if (!t) return `#${id}`;
  return lang === 'en' ? t.en : t.tr;
}

export function neighborsOf(id: number): number[] {
  return [...(adjacency.get(id) ?? [])];
}

export function areNeighbors(a: number, b: number): boolean {
  return adjacency.get(a)?.has(b) ?? false;
}

/** Komşuluk kara sınırı değil deniz geçidi mi (haritada kesik çizgi). */
export function isSeaLink(a: number, b: number): boolean {
  return sea.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
}
