import React, { useMemo } from 'react';
import { DIRS, geometry, type GalaxyCell } from '../../data/galaxyLogic';
import type { FetihPlayer } from '../../types/fetih';
import { t } from '../../i18n';

/**
 * Galaksi tahtası. Sisli sektörler soru işaretli; açılanlarda gezegen,
 * asteroit ya da kara delik. Bir oyuncunun bölgesi hafif renkli dolgu ve
 * yalnızca DIŞ kenarlarında neon çizgiyle gösteriliyor — sınır tek parça bir
 * tüp gibi okunuyor.
 */

const S = 30;
const SQ3 = Math.sqrt(3);
const INK = '#1c1917';
const PLANET_COLORS = ['#ffd166', '#06d6a0', '#ef476f', '#4cc9f0', '#f78c6b'];

const center = (q: number, r: number, s = S): [number, number] => [s * 1.5 * q, s * SQ3 * (r + q / 2)];
const corner = (x: number, y: number, s: number, k: number): [number, number] => {
  const a = (Math.PI / 180) * 60 * k;
  return [x + s * Math.cos(a), y + s * Math.sin(a)];
};
export const hexPts = (x: number, y: number, s: number) =>
  Array.from({ length: 6 }, (_, k) => corner(x, y, s, k).map((v) => v.toFixed(1)).join(',')).join(' ');

export const GLOW_DEFS = (
  <defs>
    <filter id="galaxy-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.6" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

export const Planet: React.FC<{ x: number; y: number; color: string; scale?: number }> = ({ x, y, color, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse rx="14" ry="4.2" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity=".75" transform="rotate(-18)" />
    <circle r="8" fill={color} stroke={INK} strokeWidth="1.6" />
    <circle cx="-2.6" cy="-2.6" r="2.2" fill="#ffffff" opacity=".6" />
  </g>
);

export const Asteroid: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <polygon points="-10,-2 -5,-9 4,-8 10,-1 6,8 -6,8" fill="#9a8c98" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="-2" cy="0" r="2" fill="#6d6875" />
    <circle cx="4" cy="4" r="1.5" fill="#6d6875" />
  </g>
);

export const BlackHole: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse rx="14" ry="5.5" fill="none" stroke="#ff9e00" strokeWidth="2.4" transform="rotate(12)" />
    <circle r="7" fill="#000000" stroke="#ffd166" strokeWidth="1.1" />
  </g>
);

export const Sun: React.FC<{ x: number; y: number; color: string; scale?: number }> = ({ x, y, color, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} filter="url(#galaxy-glow)">
    {Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI / 4) * i;
      return <line key={i} x1={11 * Math.cos(a)} y1={11 * Math.sin(a)} x2={15 * Math.cos(a)} y2={15 * Math.sin(a)} stroke={color} strokeWidth="2.4" strokeLinecap="round" />;
    })}
    <circle r="8.5" fill={color} />
    <circle r="4" fill="#ffffff" />
  </g>
);

export const planetColor = (id: number) => PLANET_COLORS[id % PLANET_COLORS.length];

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t2 = Math.imul(a ^ (a >>> 15), 1 | a);
    t2 = (t2 + Math.imul(t2 ^ (t2 >>> 7), 61 | t2)) ^ t2;
    return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BoardArrow {
  from: number;
  to: number;
  color?: string;
  dashed?: boolean;
}

interface Props {
  cells: GalaxyCell[];
  radius: number;
  players: FetihPlayer[];
  /** Dokunulabilir sektörler (ana yıldız seçimi, kaynak seçimi). */
  tappable?: Set<number>;
  /** Kesik çizgili davet halkası çizilecek sektörler. */
  invite?: Set<number>;
  onCellClick?: (id: number) => void;
  focus?: number | null;
  arrows?: BoardArrow[];
  /** Düello sektörü. */
  highlight?: number | null;
  showStars?: boolean;
  className?: string;
}

export const GalaxyBoard: React.FC<Props> = ({
  cells, radius, players, tappable, invite, onCellClick, focus = null, arrows = [], highlight = null, showStars = true, className = '',
}) => {
  const colorOf = useMemo(() => new Map(players.map((p) => [p.id, p.color])), [players]);
  const geo = geometry(radius);
  const vbW = S * 1.5 * radius + S + 10;
  const vbH = S * SQ3 * (radius + 0.5) + 10;

  const stars = useMemo(() => {
    const rnd = mulberry32(radius * 977);
    return Array.from({ length: 70 + radius * 18 }, (_, i) => (
      <circle key={i} cx={(-vbW + rnd() * 2 * vbW).toFixed(0)} cy={(-vbH + rnd() * 2 * vbH).toFixed(0)}
        r={(0.4 + rnd() * 1.3).toFixed(1)} fill="#ffffff" opacity={(0.2 + rnd() * 0.6).toFixed(2)} />
    ));
  }, [radius, vbW, vbH]);

  // Bölge sınırı: sahibi farklı komşuya bakan kenarlar
  const borderLines: React.ReactNode[] = [];
  for (const c of cells) {
    if (!c.owner) continue;
    const col = colorOf.get(c.owner) || '#ffffff';
    const [x, y] = center(c.q, c.r);
    for (let k = 0; k < 6; k++) {
      const nId = geo.byDir[c.id]?.[(k + 2) % 6];
      const n = nId === null || nId === undefined ? null : cells[nId];
      if (n && n.owner === c.owner) continue;
      const [x1, y1] = corner(x, y, S * 0.96, k);
      const [x2, y2] = corner(x, y, S * 0.96, k + 1);
      borderLines.push(
        <g key={`${c.id}-${k}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="3.4" strokeLinecap="round" filter="url(#galaxy-glow)" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity=".7" />
        </g>,
      );
    }
  }

  return (
    <svg viewBox={`${-vbW} ${-vbH} ${2 * vbW} ${2 * vbH}`} className={`block w-full h-auto select-none ${className}`} role="img" aria-label={t('Galaksi tahtası')}>
      {GLOW_DEFS}
      {showStars && stars}

      {cells.map((c) => {
        const [x, y] = center(c.q, c.r);
        const canTap = !!tappable?.has(c.id) && !!onCellClick;
        const col = c.owner ? colorOf.get(c.owner) : null;
        return (
          <g key={c.id} onClick={canTap ? () => onCellClick!(c.id) : undefined}
            role={canTap ? 'button' : undefined} tabIndex={canTap ? 0 : undefined} aria-label={canTap ? c.name : undefined}
            onKeyDown={canTap ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCellClick!(c.id); } } : undefined}
            style={{ cursor: canTap ? 'pointer' : undefined }}>
            <title>{c.name}</title>
            {!c.revealed ? (
              <>
                <polygon points={hexPts(x, y, S * 0.96)} fill="#130c2e" stroke="#2a2060" strokeWidth="1.4" />
                <text x={x} y={y + 6} textAnchor="middle" style={{ font: "800 16px 'Baloo 2', sans-serif" }} fill="#3a2d78">?</text>
              </>
            ) : (
              <>
                <polygon points={hexPts(x, y, S * 0.96)} fill={col || '#1d1545'} fillOpacity={col ? 0.22 : 1} stroke="#3b2f82" strokeWidth="1.4" />
                {c.kind === 'planet' && <Planet x={x} y={y} color={planetColor(c.id)} />}
                {c.kind === 'asteroid' && <Asteroid x={x} y={y} />}
                {c.kind === 'hole' && <BlackHole x={x} y={y} />}
              </>
            )}
            {invite?.has(c.id) && (
              <polygon points={hexPts(x, y, S * 0.74)} fill="none" stroke="#00f5d4" strokeWidth="2.4" strokeDasharray="5 4" filter="url(#galaxy-glow)" />
            )}
            {focus === c.id && <polygon points={hexPts(x, y, S * 0.8)} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeDasharray="5 4" />}
          </g>
        );
      })}

      {borderLines}

      {cells.filter((c) => c.home).map((c) => {
        const [x, y] = center(c.q, c.r);
        return <Sun key={`h${c.id}`} x={x} y={y} color={colorOf.get(c.home!) || '#ffffff'} />;
      })}

      {arrows.map((a, i) => {
        const A = cells[a.from], B = cells[a.to];
        if (!A || !B) return null;
        const [ax, ay] = center(A.q, A.r);
        const [bx, by] = center(B.q, B.r);
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        const hx = bx - ux * 10, hy = by - uy * 10;
        const col = a.color || '#ffffff';
        return (
          <g key={`a${i}`} filter="url(#galaxy-glow)" style={{ pointerEvents: 'none' }}>
            <line x1={ax + ux * 8} y1={ay + uy * 8} x2={hx - ux * 5} y2={hy - uy * 5} stroke={col} strokeWidth="3.2" strokeLinecap="round" strokeDasharray={a.dashed ? '5 4' : undefined} />
            <polygon points={`${hx},${hy} ${hx - ux * 9 - uy * 6},${hy - uy * 9 + ux * 6} ${hx - ux * 9 + uy * 6},${hy - uy * 9 - ux * 6}`} fill={col} />
          </g>
        );
      })}

      {highlight !== null && cells[highlight] && (() => {
        const [x, y] = center(cells[highlight].q, cells[highlight].r);
        return <polygon points={hexPts(x, y, S * 0.84)} fill="none" stroke="#ffd93d" strokeWidth="3" strokeDasharray="5 4" filter="url(#galaxy-glow)" />;
      })()}
    </svg>
  );
};

/* ------------------------------------------------------ telefon: komşuluk pusulası */

export interface FlowerOption {
  id: number | null;
  ok: boolean;
  label: string;
  sub?: string;
  kind: 'mine' | 'planned' | 'hole' | 'noEnergy' | 'enemy' | 'fog' | 'open' | 'edge';
}

/**
 * Pusula = bulunduğun sektörün 6 komşusu. Her yönde orada ne olduğu yazıyor;
 * dokununca o yöne ilerliyorsun. Yön sırası tahtayla aynı (K, KD, GD, G, GB, KB).
 */
export const NeighborCompass: React.FC<{
  center: GalaxyCell;
  options: FlowerOption[];
  cells: GalaxyCell[];
  colorOf: (pid: string) => string;
  onPick: (id: number) => void;
  myColor: string;
}> = ({ center: mid, options, cells, colorOf, onPick, myColor }) => {
  const s = 34;
  return (
    <svg viewBox="-92 -98 184 196" className="block w-full max-w-[290px] mx-auto" role="group" aria-label={t('Komşuluk pusulası')}>
      {GLOW_DEFS}
      {DIRS.map((d, i) => {
        const [x, y] = center(d.dq, d.dr, s);
        const o = options[i];
        if (!o || o.kind === 'edge' || o.id === null) {
          return (
            <g key={i}>
              <polygon points={hexPts(x, y, s * 0.95)} fill="none" stroke="#2a2060" strokeWidth="1.5" strokeDasharray="3 4" />
              <text x={x} y={y + 4} textAnchor="middle" style={{ font: '900 8.5px Nunito, sans-serif' }} fill="#4a3b9a">{t('kenar')}</text>
            </g>
          );
        }
        const n = cells[o.id];
        const col = n.owner ? colorOf(n.owner) : null;
        const enemy = o.kind === 'enemy';
        return (
          <g key={i} onClick={o.ok ? () => onPick(o.id!) : undefined} role="button" tabIndex={o.ok ? 0 : -1}
            aria-disabled={!o.ok} aria-label={`${t(d.name)}: ${o.label}`} opacity={o.ok ? 1 : 0.45}
            onKeyDown={o.ok ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(o.id!); } } : undefined}
            style={{ cursor: o.ok ? 'pointer' : 'not-allowed' }}>
            {!n.revealed ? (
              <>
                <polygon points={hexPts(x, y, s * 0.95)} fill="#130c2e" stroke="#6a5cc0" strokeWidth="2" />
                <text x={x} y={y - 2} textAnchor="middle" style={{ font: "800 18px 'Baloo 2', sans-serif" }} fill="#8d7fe0">?</text>
              </>
            ) : (
              <>
                <polygon points={hexPts(x, y, s * 0.95)} fill={col || '#1d1545'} fillOpacity={col ? 0.3 : 1}
                  stroke={enemy && col ? col : '#6a5cc0'} strokeWidth={enemy ? 3 : 2} filter={enemy ? 'url(#galaxy-glow)' : undefined} />
                {n.kind === 'planet' && <Planet x={x} y={y - 6} color={planetColor(n.id)} scale={0.65} />}
                {n.kind === 'asteroid' && <Asteroid x={x} y={y - 6} scale={0.65} />}
                {n.kind === 'hole' && <BlackHole x={x} y={y - 6} scale={0.6} />}
              </>
            )}
            <text x={x - 19} y={y - 12} textAnchor="middle" style={{ font: "800 12px 'Baloo 2', sans-serif" }} fill="#ffffff" opacity=".8">{d.arrow}</text>
            <text x={x} y={y + 12} textAnchor="middle" style={{ font: '900 8.5px Nunito, sans-serif' }} fill="#ffffff">{o.label}</text>
            {o.sub && <text x={x} y={y + 21} textAnchor="middle" style={{ font: '800 7.5px Nunito, sans-serif' }} fill="#b9a8ff">{o.sub}</text>}
          </g>
        );
      })}
      <polygon points={hexPts(0, 0, s * 0.95)} fill={myColor} fillOpacity=".28" stroke={myColor} strokeWidth="3" filter="url(#galaxy-glow)" />
      <text x="0" y="-3" textAnchor="middle" style={{ font: '900 9.5px Nunito, sans-serif' }} fill="#ffffff">{t('BURADASIN')}</text>
      <text x="0" y="11" textAnchor="middle" style={{ font: '800 9.5px Nunito, sans-serif' }} fill="#e6fff9">{mid.name}</text>
    </svg>
  );
};
