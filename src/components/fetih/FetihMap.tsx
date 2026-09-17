import React, { useMemo } from 'react';
import { FETIH_PROVINCES, FETIH_VIEWBOX, hexPoints } from '../../data/fetihMap';
import type { FetihAttackOrder, FetihBattle, FetihPlayer, FetihTile } from '../../types/fetih';
import { t } from '../../i18n';

/**
 * Altıgen Türkiye haritası. Her il: sahibinin rengi, ortada asker sayısı,
 * altında küçük üretim numarası. Zar atıldığında numarası tutan iller
 * sarı halkayla, çözüm anında savaşlar oklarla işaretleniyor.
 */

const byId = new Map(FETIH_PROVINCES.map((p) => [p.id, p]));

interface Props {
  tiles: Record<number, FetihTile>;
  players: FetihPlayer[];
  /** Zar toplamı — numarası tutan illeri halkala. */
  rolled?: number | null;
  battles?: FetihBattle[];
  /** Telefonda planlanan hamleler. */
  plannedPlace?: number | null;
  plannedAttacks?: FetihAttackOrder[];
  /** Bu oyuncunun illeri kalın konturla. */
  focusPlayerId?: string | null;
  showTokens?: boolean;
  /** Lobide harita henüz dağıtılmadı: asker sayısı gösterilmiyor. */
  showTroops?: boolean;
  className?: string;
}

/**
 * Komşu iki ilin merkezleri yalnızca ~17 birim uzakta. Ok merkezden merkeze
 * çizilirse iki ildeki asker sayısının üstüne biner; bu yüzden ok ortak kenarın
 * iki yanında kısa bir parça olarak çiziliyor (yolun %28'inden %78'ine).
 */
function arrowSegment(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  return { x1: ax + dx * 0.28, y1: ay + dy * 0.28, x2: ax + dx * 0.78, y2: ay + dy * 0.78, ux: dx / (Math.hypot(dx, dy) || 1), uy: dy / (Math.hypot(dx, dy) || 1) };
}

export const FetihMap: React.FC<Props> = ({
  tiles, players, rolled = null, battles = [], plannedPlace = null, plannedAttacks = [], focusPlayerId = null, showTokens = true, showTroops = true, className = '',
}) => {
  const colorOf = useMemo(() => new Map(players.map((p) => [p.id, p.color])), [players]);
  const nameOf = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players]);
  const vb = FETIH_VIEWBOX;

  const arrows: Array<{ key: string; from: number; to: number; color: string; kind: 'won' | 'lost' | 'plan' }> = [
    ...battles.filter((b) => !b.cancelled).map((b, i) => ({
      key: `b${i}`, from: b.from, to: b.to, color: colorOf.get(b.playerId) || '#1c1917', kind: (b.conquered ? 'won' : 'lost') as 'won' | 'lost',
    })),
    ...plannedAttacks.map((a, i) => ({ key: `p${i}`, from: a.from, to: a.to, color: '#1c1917', kind: 'plan' as const })),
  ];

  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={`w-full h-auto ${className}`} role="img" aria-label={t('Türkiye il haritası')}>

      {FETIH_PROVINCES.map((p) => {
        const tile = tiles[p.id];
        if (!tile) return null;
        const owner = tile.owner;
        const fill = owner ? colorOf.get(owner) || '#a8a29e' : 'var(--sticker-surface)';
        const hot = rolled !== null && tile.token === rolled;
        const focus = focusPlayerId !== null && owner === focusPlayerId;
        const placed = plannedPlace === p.id;
        return (
          <g key={p.id}>
            <title>{`${p.name}${owner ? ` — ${nameOf.get(owner) ?? ''}` : ` — ${t('tarafsız')}`} · ${tile.troops} ${t('asker')}${tile.token ? ` · ${t('üretim')} ${tile.token}` : ''}`}</title>
            <polygon points={hexPoints(p.x, p.y)}
              style={{ fill, stroke: 'var(--sticker-ink)', strokeWidth: focus || placed ? 2.2 : 1.1, strokeLinejoin: 'round' }} />
            {hot && <polygon points={hexPoints(p.x, p.y, 0.72)} style={{ fill: 'none', stroke: '#ffd93d', strokeWidth: 2.4 }} />}
            {placed && <polygon points={hexPoints(p.x, p.y, 0.72)} style={{ fill: 'none', stroke: 'var(--sticker-ink)', strokeWidth: 1.6, strokeDasharray: '2 1.5' }} />}
            {showTroops && <text x={p.x} y={p.y + (showTokens && tile.token ? 1 : 2.4)} textAnchor="middle"
              style={{
                fontFamily: "'Baloo 2', system-ui, sans-serif", fontWeight: 800, fontSize: 7.2,
                fill: owner ? '#ffffff' : 'var(--sticker-ink)', stroke: owner ? '#1c1917' : 'none', strokeWidth: owner ? 1.6 : 0,
                paintOrder: 'stroke', pointerEvents: 'none',
              }}>
              {tile.troops}
            </text>}
            {showTokens && tile.token > 0 && (
              <text x={p.x} y={p.y + 6.6} textAnchor="middle"
                style={{
                  fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 900, fontSize: 3.6,
                  fill: owner ? '#ffffff' : 'var(--sticker-ink-soft)', stroke: owner ? '#1c1917' : 'none', strokeWidth: owner ? 0.9 : 0,
                  paintOrder: 'stroke', pointerEvents: 'none',
                }}>
                {tile.token}
              </text>
            )}
          </g>
        );
      })}

      {arrows.map((a) => {
        const A = byId.get(a.from);
        const B = byId.get(a.to);
        if (!A || !B) return null;
        const { x1, y1, x2, y2, ux, uy } = arrowSegment(A.x, A.y, B.x, B.y);
        // Ok başı: uçta, yöne dik 2,6 birim genişliğinde üçgen
        const hx = x2 + ux * 3.2, hy = y2 + uy * 3.2;
        const head = `${hx},${hy} ${x2 - uy * 2.6},${y2 + ux * 2.6} ${x2 + uy * 2.6},${y2 - ux * 2.6}`;
        const fill = a.kind === 'plan' ? 'var(--sticker-paper)' : a.color;
        return (
          <g key={a.key} style={{ pointerEvents: 'none', opacity: a.kind === 'lost' ? 0.75 : 1 }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: 'var(--sticker-ink)', strokeWidth: 3.4, strokeLinecap: 'round' }} />
            <polygon points={head} style={{ fill: 'var(--sticker-ink)', stroke: 'var(--sticker-ink)', strokeWidth: 1.4, strokeLinejoin: 'round' }} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: fill, strokeWidth: 1.8, strokeLinecap: 'round', strokeDasharray: a.kind === 'lost' ? '1.6 1.2' : undefined }} />
            <polygon points={head} style={{ fill }} />
          </g>
        );
      })}
    </svg>
  );
};
