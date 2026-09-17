import React from 'react';
import { KUSATMA_WALL } from '../../data/kusatmaLogic';

/**
 * Sur çizimi. Can düştükçe mazgallar sırayla kopuyor, çatlaklar beliriyor;
 * sıfırda geriye moloz ve yarım bir kule kalıyor. Hasarın ekranda sayıdan
 * önce OKUNMASI için: TV'ye uzaktan bakan biri çubuğu değil kaleyi görüyor.
 */

/** Mazgalların kopma sırası — ortadan kenarlara değil, dağınık. */
const MERLONS: Array<[number, number, number]> = [
  // [x, y, genişlik]
  [14, 22, 10], [30, 22, 10], [46, 22, 10],
  [64, 52, 11], [84, 52, 11], [104, 52, 11], [124, 52, 11],
  [144, 22, 10], [160, 22, 10], [176, 22, 10],
];
const DROP_ORDER = [5, 1, 8, 3, 6, 0, 9, 4, 2, 7];

export const Castle: React.FC<{ hp: number; color: string; flip?: boolean; shaking?: boolean; label: string }> = ({ hp, color, flip, shaking, label }) => {
  const frac = Math.max(0, Math.min(1, hp / KUSATMA_WALL));
  const visible = new Set(DROP_ORDER.slice(DROP_ORDER.length - Math.round(frac * MERLONS.length)));
  const ink = { stroke: 'var(--sticker-ink)', strokeWidth: 3, strokeLinejoin: 'round' as const };
  const fallen = hp <= 0;

  return (
    <svg viewBox="0 0 200 160" role="img" aria-label={label} className={`w-full max-w-[260px] ${shaking ? 'kusatma-shake' : ''}`}
      style={{ overflow: 'visible' }}>
      <style>{`
        @keyframes kusatma-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px) rotate(-1deg)} 40%{transform:translateX(5px) rotate(1deg)} 60%{transform:translateX(-4px)} 80%{transform:translateX(3px)} }
        .kusatma-shake { animation: kusatma-shake .6s ease-in-out 2; }
        @media (prefers-reduced-motion: reduce) { .kusatma-shake { animation: none; } }
      `}</style>
      {/* Aynalama iç grupta: kök svg'nin transform'u sarsılma animasyonuna ait. */}
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
      {/* zemin */}
      <line x1="0" y1="150" x2="200" y2="150" style={ink} />

      {fallen ? (
        <g>
          <path d="M10 150 L10 95 L22 88 L30 100 L42 84 L60 102 L60 150 Z" style={{ ...ink, fill: color }} />
          <path d="M70 150 Q85 120 100 132 Q115 112 132 130 Q150 118 175 150 Z" style={{ ...ink, fill: color, opacity: 0.85 }} />
          {[[82, 138], [108, 128], [128, 140], [150, 136]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="10" height="8" rx="1.5" transform={`rotate(${i * 23} ${x + 5} ${y + 4})`} style={{ ...ink, strokeWidth: 2, fill: color }} />
          ))}
        </g>
      ) : (
        <g>
          {/* orta sur */}
          <rect x="58" y="62" width="84" height="88" style={{ ...ink, fill: color }} />
          {/* kuleler */}
          <rect x="10" y="32" width="50" height="118" style={{ ...ink, fill: color }} />
          <rect x="140" y="32" width="50" height="118" style={{ ...ink, fill: color }} />
          {/* mazgallar */}
          {MERLONS.map(([x, y, w], i) => visible.has(i) && (
            <rect key={i} x={x} y={y} width={w} height="11" style={{ ...ink, fill: color }} />
          ))}
          {/* kapı ve pencereler */}
          <path d="M84 150 L84 118 Q100 100 116 118 L116 150" style={{ ...ink, fill: 'var(--sticker-ink)' }} />
          <rect x="30" y="58" width="10" height="16" rx="5" style={{ fill: 'var(--sticker-ink)' }} />
          <rect x="160" y="58" width="10" height="16" rx="5" style={{ fill: 'var(--sticker-ink)' }} />
          {/* bayrak */}
          <line x1="35" y1="32" x2="35" y2="2" style={ink} />
          <path d="M35 4 L58 10 L35 17 Z" style={{ ...ink, strokeWidth: 2.5, fill: color }} />
          {/* çatlaklar */}
          {frac < 0.7 && <path d="M150 70 L160 84 L152 96 L164 112" style={{ ...ink, fill: 'none', strokeWidth: 2.5 }} />}
          {frac < 0.45 && <path d="M66 76 L78 90 L70 104 L82 118" style={{ ...ink, fill: 'none', strokeWidth: 2.5 }} />}
          {frac < 0.25 && <path d="M20 96 L32 104 L24 118 L36 132" style={{ ...ink, fill: 'none', strokeWidth: 2.5 }} />}
        </g>
      )}
      </g>
    </svg>
  );
};

export const HpBar: React.FC<{ hp: number; color: string }> = ({ hp, color }) => {
  const pct = Math.max(0, Math.min(100, (hp / KUSATMA_WALL) * 100));
  return (
    <div className="w-full h-5 rounded-full overflow-hidden" style={{ border: '3px solid var(--sticker-ink)', background: 'var(--sticker-paper)' }}
      role="meter" aria-valuemin={0} aria-valuemax={KUSATMA_WALL} aria-valuenow={hp}>
      <div className="h-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: color, borderRight: pct > 0 && pct < 100 ? '3px solid var(--sticker-ink)' : 'none' }} />
    </div>
  );
};
