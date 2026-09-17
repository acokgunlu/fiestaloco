import React, { useEffect, useMemo, useState } from 'react';
import { TERRITORY_IDS, territoryName } from '../../data/fetihMap';
import { WORLD_SEA_LINKS } from '../../data/worldTerritories';
import type { FetihAttackOrder, FetihBattle, FetihPlayer, FetihTile } from '../../types/fetih';
import { getLang, t } from '../../i18n';

/**
 * Dünya haritası. Her bölge sahibinin renginde; bölgenin içinde asker
 * rozeti, rozetin köşesinde küçük üretim numarası. Deniz geçitleri kesik
 * çizgi — oyuncu "buradan oraya gidilir mi" sorusunun cevabını haritada
 * görüyor.
 *
 * Çizim verisi (~100 KB) ayrı bir parçada: oyun açılmadan indirilmiyor.
 */

interface Shape { d: string; ax: number; ay: number; lx: number; ly: number }
interface WorldShapes {
  viewBox: { x: number; y: number; w: number; h: number };
  background: string;
  shapes: Record<string, Shape>;
}

let cache: WorldShapes | null = null;
let loading: Promise<WorldShapes> | null = null;
function loadShapes(): Promise<WorldShapes> {
  if (!loading) loading = import('../../data/worldShapes.json').then((m) => (cache = (m.default ?? m) as WorldShapes));
  return loading;
}

interface Props {
  tiles: Record<number, FetihTile>;
  players: FetihPlayer[];
  /** Zar toplamı — numarası tutan bölgeleri vurgula. */
  rolled?: number | null;
  battles?: FetihBattle[];
  /** Telefonda planlanan hamleler. */
  plannedPlace?: number | null;
  plannedAttacks?: FetihAttackOrder[];
  /** Bu oyuncunun bölgeleri kalın konturla. */
  focusPlayerId?: string | null;
  showTokens?: boolean;
  /** Lobide harita henüz dağıtılmadı: asker sayısı gösterilmiyor. */
  showTroops?: boolean;
  /** Saldırı kaynağı olarak seçili bölge. */
  selectedFrom?: number | null;
  /** Seçili kaynaktan gidilebilecek bölgeler — yalnızca bunlar vurgulu. */
  targets?: number[];
  /** Verilirse harita bu bölgelere yakınlaşır. */
  zoomIds?: number[] | null;
  onTerritoryClick?: (id: number) => void;
  className?: string;
}

const BADGE_R = 8;

export const FetihMap: React.FC<Props> = ({
  tiles, players, rolled = null, battles = [], plannedPlace = null, plannedAttacks = [], focusPlayerId = null,
  showTokens = true, showTroops = true, selectedFrom = null, targets = [], zoomIds = null, onTerritoryClick, className = '',
}) => {
  const [world, setWorld] = useState<WorldShapes | null>(cache);
  useEffect(() => {
    if (!world) loadShapes().then(setWorld).catch(() => setWorld(null));
  }, [world]);

  const colorOf = useMemo(() => new Map(players.map((p) => [p.id, p.color])), [players]);
  const nameOf = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players]);
  const targetSet = useMemo(() => new Set(targets), [targets]);
  const lang = getLang();

  const viewBox = useMemo(() => {
    if (!world) return '0 0 1012 448';
    const full = world.viewBox;
    if (!zoomIds || zoomIds.length === 0) return `${full.x} ${full.y} ${full.w} ${full.h}`;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of zoomIds) {
      const s = world.shapes[id];
      if (!s) continue;
      for (const [x, y] of [[s.ax, s.ay], [s.lx, s.ly]]) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
    if (!Number.isFinite(x0)) return `${full.x} ${full.y} ${full.w} ${full.h}`;
    const pad = 34;
    let w = Math.max(x1 - x0 + 2 * pad, 200);
    let h = Math.max(y1 - y0 + 2 * pad, 110);
    // Haritanın en-boy oranını koru: telefonda kutu boyu değişmesin
    const ratio = full.w / full.h;
    if (w / h > ratio) h = w / ratio; else w = h * ratio;
    w = Math.min(w, full.w); h = Math.min(h, full.h);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const x = Math.max(full.x, Math.min(full.x + full.w - w, cx - w / 2));
    const y = Math.max(full.y, Math.min(full.y + full.h - h, cy - h / 2));
    return `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  }, [world, zoomIds]);

  if (!world) {
    return <div className={`w-full aspect-[2.26/1] rounded-xl ${className}`} style={{ background: 'var(--sticker-paper)' }} aria-busy="true" />;
  }

  const shapeOf = (id: number) => world.shapes[id];
  const selecting = selectedFrom !== null;
  const interactive = !!onTerritoryClick;
  const W = world.viewBox.w;

  /** Harita kenarından taşan geçit (Bering): iki uçtan kenara doğru kısa çizgi. */
  const seaLine = (a: number, b: number, key: string) => {
    const A = shapeOf(a), B = shapeOf(b);
    if (!A || !B) return null;
    const style = { stroke: 'var(--sticker-ink-soft)', strokeWidth: 1, strokeDasharray: '3 2.5', fill: 'none', opacity: 0.8 } as const;
    if (Math.abs(A.ax - B.ax) > W / 2) {
      const left = A.ax < B.ax ? A : B, right = A.ax < B.ax ? B : A;
      return (
        <g key={key}>
          <line x1={left.ax} y1={left.ay} x2={world.viewBox.x + 2} y2={left.ay - 6} style={style} />
          <line x1={right.ax} y1={right.ay} x2={world.viewBox.x + W - 2} y2={right.ay - 6} style={style} />
        </g>
      );
    }
    return <line key={key} x1={A.ax} y1={A.ay} x2={B.ax} y2={B.ay} style={style} />;
  };

  const arrow = (from: number, to: number, color: string, kind: 'won' | 'lost' | 'plan', key: string) => {
    const A = shapeOf(from), B = shapeOf(to);
    if (!A || !B || Math.abs(A.lx - B.lx) > W / 2) return null;
    const dx = B.lx - A.lx, dy = B.ly - A.ly;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const x1 = A.lx + ux * (BADGE_R + 1), y1 = A.ly + uy * (BADGE_R + 1);
    const x2 = B.lx - ux * (BADGE_R + 5), y2 = B.ly - uy * (BADGE_R + 5);
    // Hafif kavis: karşılıklı saldırılar üst üste binmesin
    const mx = (x1 + x2) / 2 - uy * len * 0.12, my = (y1 + y2) / 2 + ux * len * 0.12;
    const hx = x2 + ux * 5, hy = y2 + uy * 5;
    const head = `${hx},${hy} ${x2 - uy * 3.6},${y2 + ux * 3.6} ${x2 + uy * 3.6},${y2 - ux * 3.6}`;
    const fill = kind === 'plan' ? '#ff6b6b' : color;
    return (
      <g key={key} style={{ pointerEvents: 'none', opacity: kind === 'lost' ? 0.8 : 1 }}>
        <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} style={{ fill: 'none', stroke: 'var(--sticker-ink)', strokeWidth: 4.4, strokeLinecap: 'round' }} />
        <polygon points={head} style={{ fill: 'var(--sticker-ink)', stroke: 'var(--sticker-ink)', strokeWidth: 2, strokeLinejoin: 'round' }} />
        <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} style={{ fill: 'none', stroke: fill, strokeWidth: 2.4, strokeLinecap: 'round', strokeDasharray: kind === 'lost' ? '3 2' : undefined }} />
        <polygon points={head} style={{ fill }} />
      </g>
    );
  };

  return (
    <svg viewBox={viewBox} className={`w-full h-auto select-none ${className}`} role="img" aria-label={t('Dünya haritası')}>
      {world.background && <path d={world.background} style={{ fill: 'var(--sticker-ink-faint)', opacity: 0.35 }} />}

      {/* Bölgeler */}
      {TERRITORY_IDS.map((id) => {
        const s = shapeOf(id);
        const tile = tiles[id];
        if (!s || !tile) return null;
        const owner = tile.owner;
        const isTarget = targetSet.has(id);
        const dim = selecting && id !== selectedFrom && !isTarget;
        const fill = owner ? colorOf.get(owner) || '#a8a29e' : 'var(--sticker-paper)';
        const hot = rolled !== null && tile.token === rolled;
        const strong = (focusPlayerId !== null && owner === focusPlayerId) || id === selectedFrom || isTarget;
        return (
          <path key={id} d={s.d}
            onClick={interactive ? () => onTerritoryClick!(id) : undefined}
            style={{
              fill, opacity: dim ? 0.35 : 1,
              stroke: hot ? '#ffd93d' : isTarget ? '#ff6b6b' : 'var(--sticker-ink)',
              strokeWidth: hot ? 2.6 : isTarget ? 2.2 : strong ? 1.4 : 0.6,
              strokeLinejoin: 'round', cursor: interactive ? 'pointer' : undefined,
            }}>
            <title>{`${territoryName(id, lang)}${owner ? ` — ${nameOf.get(owner) ?? ''}` : ` — ${t('tarafsız')}`} · ${tile.troops} ${t('asker')}`}</title>
          </path>
        );
      })}

      {/* Deniz geçitleri */}
      {WORLD_SEA_LINKS.map(([a, b]) => seaLine(a, b, `sea-${a}-${b}`))}

      {/* Rozetler */}
      {showTroops && TERRITORY_IDS.map((id) => {
        const s = shapeOf(id);
        const tile = tiles[id];
        if (!s || !tile) return null;
        const owner = tile.owner;
        const isTarget = targetSet.has(id);
        const dim = selecting && id !== selectedFrom && !isTarget;
        const moved = Math.hypot(s.lx - s.ax, s.ly - s.ay) > 5;
        const hot = rolled !== null && tile.token === rolled;
        return (
          <g key={`b${id}`} onClick={interactive ? () => onTerritoryClick!(id) : undefined}
            style={{ opacity: dim ? 0.35 : 1, cursor: interactive ? 'pointer' : undefined }}>
            {moved && <line x1={s.ax} y1={s.ay} x2={s.lx} y2={s.ly} style={{ stroke: 'var(--sticker-ink)', strokeWidth: 0.7 }} />}
            {(id === selectedFrom || plannedPlace === id) && (
              <circle cx={s.lx} cy={s.ly} r={BADGE_R + 3.5} style={{ fill: 'none', stroke: 'var(--sticker-ink)', strokeWidth: 1.6, strokeDasharray: id === selectedFrom ? undefined : '2.5 2' }} />
            )}
            {isTarget && <circle cx={s.lx} cy={s.ly} r={BADGE_R + 3.5} style={{ fill: 'none', stroke: '#ff6b6b', strokeWidth: 2 }} />}
            <circle cx={s.lx} cy={s.ly} r={BADGE_R}
              style={{ fill: owner ? colorOf.get(owner) || '#a8a29e' : 'var(--sticker-surface)', stroke: 'var(--sticker-ink)', strokeWidth: 1.3 }} />
            <text x={s.lx} y={s.ly + 3.4} textAnchor="middle"
              style={{
                fontFamily: "'Baloo 2', system-ui, sans-serif", fontWeight: 800, fontSize: 10,
                fill: owner ? '#ffffff' : 'var(--sticker-ink)', stroke: owner ? '#1c1917' : 'none', strokeWidth: owner ? 2 : 0,
                paintOrder: 'stroke', pointerEvents: 'none',
              }}>
              {tile.troops}
            </text>
            {showTokens && tile.token > 0 && (
              <g style={{ pointerEvents: 'none' }}>
                <circle cx={s.lx + 7} cy={s.ly - 7} r={4.2} style={{ fill: hot ? '#ffd93d' : 'var(--sticker-surface)', stroke: 'var(--sticker-ink)', strokeWidth: 0.8 }} />
                <text x={s.lx + 7} y={s.ly - 5.3} textAnchor="middle"
                  style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 900, fontSize: 4.8, fill: hot ? '#1c1917' : 'var(--sticker-ink)' }}>
                  {tile.token}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Savaş ve plan okları */}
      {battles.filter((b) => !b.cancelled).map((b, i) => arrow(b.from, b.to, colorOf.get(b.playerId) || '#1c1917', b.conquered ? 'won' : 'lost', `bt${i}`))}
      {plannedAttacks.map((a, i) => arrow(a.from, a.to, '#ff6b6b', 'plan', `pl${i}`))}
    </svg>
  );
};
