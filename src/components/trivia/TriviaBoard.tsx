import React from 'react';
import { motion } from 'motion/react';
import {
  TRIVIA_CATEGORIES,
  TRIVIA_CATEGORY_KEYS,
  TriviaPursuitPlayer,
} from '../../types/triviaPursuit';
import {
  BoardPosition,
  BoardSpace,
  HQ_INDICES,
  HUB_SPACE,
  MoveOption,
  RING_SPACES,
  SPOKE_SPACES,
  samePosition,
  spaceAt,
} from '../../data/triviaBoard';

interface TriviaBoardProps {
  positions: Record<string, BoardPosition>;
  players: TriviaPursuitPlayer[];
  activePlayerId: string | null;
  moveOptions?: MoveOption[];
  onPickMove?: (option: MoveOption) => void;
  size?: number;
}

/** Ayni karede duran oyunculari birbirinin ustune bindirmemek icin kucuk kaydirma. */
function stackOffset(i: number, total: number, r: number): { dx: number; dy: number } {
  if (total <= 1) return { dx: 0, dy: 0 };
  const a = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
}

/**
 * Oyuncu pulu = mini Trivial Pursuit tekerlegi.
 * Toplanan dilimler renkli dolu, eksikler bos/soluk. Oyunun ikonik detayi.
 */
const TokenWheel: React.FC<{ player: TriviaPursuitPlayer; r: number }> = ({ player, r }) => {
  const slice = 360 / TRIVIA_CATEGORY_KEYS.length;
  const inner = r * 0.34;

  return (
    <g>
      {/* Govde */}
      <circle r={r} fill={player.color} stroke="#0b1020" strokeWidth={r * 0.16} />

      {TRIVIA_CATEGORY_KEYS.map((cat, i) => {
        const has = player.wedges.includes(cat);
        const a0 = ((i * slice - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * slice - 90) * Math.PI) / 180;
        const rr = r * 0.86;
        const x0 = rr * Math.cos(a0);
        const y0 = rr * Math.sin(a0);
        const x1 = rr * Math.cos(a1);
        const y1 = rr * Math.sin(a1);
        return (
          <path
            key={cat}
            d={`M 0 0 L ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1} Z`}
            fill={has ? TRIVIA_CATEGORIES[cat].color : '#0b1020'}
            fillOpacity={has ? 1 : 0.5}
            stroke="#0b1020"
            strokeWidth={r * 0.07}
          />
        );
      })}

      {/* Gobek + parlama */}
      <circle r={inner} fill="#0b1020" stroke="#f5d67b" strokeWidth={r * 0.08} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={inner * 1.5}
        className="pointer-events-none"
      >
        {player.avatar}
      </text>
    </g>
  );
};

export const TriviaBoard: React.FC<TriviaBoardProps> = ({
  positions,
  players,
  activePlayerId,
  moveOptions = [],
  onPickMove,
  size = 520,
}) => {
  const c = size / 2;
  const scale = c * 0.88;
  const px = (x: number) => c + x * scale;
  const py = (y: number) => c + y * scale;

  const spaceR = size * 0.032;
  const hqR = size * 0.052;
  const tokenR = size * 0.036;

  const optionFor = (pos: BoardPosition): MoveOption | undefined =>
    moveOptions.find((o) => samePosition(o.to, pos));

  const renderSpace = (space: BoardSpace, pos: BoardPosition, key: string) => {
    const opt = optionFor(pos);
    const isHq = space.kind === 'hq';
    const r = isHq ? hqR : spaceR;
    const cat = space.category ? TRIVIA_CATEGORIES[space.category] : null;
    const base = space.kind === 'rollAgain' ? '#243049' : cat ? cat.color : '#2b3752';
    const cx = px(space.x);
    const cy = py(space.y);

    return (
      <g
        key={key}
        onClick={opt && onPickMove ? () => onPickMove(opt) : undefined}
        style={{ cursor: opt ? 'pointer' : 'default' }}
      >
        {/* Kalelerin altinda kategori renginde hafif hale */}
        {isHq && cat && <circle cx={cx} cy={cy} r={r * 1.75} fill={cat.color} opacity="0.18" />}

        {/* Oturma golgesi — kareler tahtaya gomulu dursun */}
        <ellipse cx={cx} cy={cy + r * 0.28} rx={r * 0.95} ry={r * 0.85} fill="#000" opacity="0.35" />

        {/* Kubbe govde */}
        <circle cx={cx} cy={cy} r={r} fill={base} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#dome)`} />

        {/* Cerceve: kaleler altin, digerleri ince koyu */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={isHq ? 'url(#gold)' : '#0b1020'}
          strokeWidth={isHq ? r * 0.24 : r * 0.14}
        />

        {isHq && cat && (
          <text
            x={cx}
            y={cy + r * 0.04}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={r * 1.05}
            className="pointer-events-none"
          >
            {cat.icon}
          </text>
        )}
        {space.kind === 'rollAgain' && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={r * 1.35}
            fill="#f5d67b"
            fontWeight="bold"
            className="pointer-events-none"
          >
            ↻
          </text>
        )}

        {/* Secilebilir hedef: altin nabiz halkasi */}
        {opt && (
          <g className="animate-pulse">
            <circle cx={cx} cy={cy} r={r + size * 0.018} fill="none" stroke="#fbbf24" strokeWidth="3" />
            <circle cx={cx} cy={cy} r={r + size * 0.032} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.55" />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="select-none max-w-full h-auto"
      style={{ filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.55))' }}
    >
      <defs>
        {/* Kece/ahsap tahta yuzeyi */}
        <radialGradient id="felt" cx="50%" cy="42%" r="72%">
          <stop offset="0%" stopColor="#1b3b32" />
          <stop offset="60%" stopColor="#122a24" />
          <stop offset="100%" stopColor="#08140f" />
        </radialGradient>

        {/* Dokusal grain — tahtanin duz plastik gorunmesini engeller */}
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n" />
          <feColorMatrix type="saturate" values="0" in="n" result="ng" />
          <feComponentTransfer in="ng" result="na">
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
          <feComposite in="na" in2="SourceGraphic" operator="atop" />
        </filter>

        {/* Altin bizel */}
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbeaa7" />
          <stop offset="25%" stopColor="#d4a017" />
          <stop offset="50%" stopColor="#8a6508" />
          <stop offset="75%" stopColor="#e8c766" />
          <stop offset="100%" stopColor="#9c7412" />
        </linearGradient>

        {/* Kubbe parlamasi — kareler yuvarlak/kabartma dursun */}
        <radialGradient id="dome" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </radialGradient>

        {/* Merkez isigi */}
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* --- Tahta govdesi: dis altin bizel + kece yuzey --- */}
      <circle cx={c} cy={c} r={c - 1} fill="url(#gold)" />
      <circle cx={c} cy={c} r={c - size * 0.028} fill="#0b1020" />
      <circle cx={c} cy={c} r={c - size * 0.038} fill="url(#felt)" filter="url(#grain)" />

      {/* Sektor golgeleri — 6 dilim hafifce ayrissin */}
      {HQ_INDICES.map((_, i) => {
        const a0 = ((i * 60 - 90 - 30) * Math.PI) / 180;
        const a1 = (((i + 1) * 60 - 90 - 30) * Math.PI) / 180;
        const R = c - size * 0.038;
        return (
          <path
            key={`sector-${i}`}
            d={`M ${c} ${c} L ${c + R * Math.cos(a0)} ${c + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${
              c + R * Math.cos(a1)
            } ${c + R * Math.sin(a1)} Z`}
            fill={TRIVIA_CATEGORIES[TRIVIA_CATEGORY_KEYS[i]].color}
            opacity={i % 2 === 0 ? 0.07 : 0.03}
          />
        );
      })}

      {/* --- Kollar: oyuk kanal --- */}
      {HQ_INDICES.map((ringIndex, hq) => {
        const from = RING_SPACES[ringIndex];
        return (
          <g key={`spoke-line-${hq}`}>
            <line
              x1={px(from.x)}
              y1={py(from.y)}
              x2={c}
              y2={c}
              stroke="#000"
              strokeWidth={size * 0.032}
              strokeLinecap="round"
              opacity="0.45"
            />
            <line
              x1={px(from.x)}
              y1={py(from.y)}
              x2={c}
              y2={c}
              stroke="#1d3a31"
              strokeWidth={size * 0.024}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* --- Halka rayi: oyuk kanal --- */}
      <circle cx={c} cy={c} r={0.86 * scale} fill="none" stroke="#000" strokeWidth={size * 0.038} opacity="0.45" />
      <circle cx={c} cy={c} r={0.86 * scale} fill="none" stroke="#1d3a31" strokeWidth={size * 0.03} />

      {/* --- Kareler --- */}
      {RING_SPACES.map((s, i) => renderSpace(s, { track: 'ring', index: i }, `ring-${i}`))}
      {SPOKE_SPACES.map((spoke, hq) =>
        spoke.map((s, si) => renderSpace(s, { track: 'spoke', hq, step: si + 1 }, `spoke-${hq}-${si}`))
      )}

      {/* --- Merkez kaidesi --- */}
      {(() => {
        const opt = optionFor({ track: 'hub' });
        const R = size * 0.085;
        return (
          <g
            onClick={opt && onPickMove ? () => onPickMove(opt) : undefined}
            style={{ cursor: opt ? 'pointer' : 'default' }}
          >
            <circle cx={c} cy={c} r={R * 2.1} fill="url(#hubGlow)" />
            <ellipse cx={c} cy={c + R * 0.22} rx={R * 1.02} ry={R * 0.95} fill="#000" opacity="0.45" />
            <circle cx={c} cy={c} r={R} fill="url(#gold)" />
            <circle cx={c} cy={c} r={R * 0.82} fill="#0b1020" />
            <circle cx={c} cy={c} r={R * 0.82} fill="url(#dome)" />
            <text
              x={c}
              y={c + R * 0.06}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={R * 0.95}
              className="pointer-events-none"
            >
              🏆
            </text>
            {opt && (
              <circle
                cx={c}
                cy={c}
                r={R * 1.28}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                className="animate-pulse"
              />
            )}
          </g>
        );
      })()}

      {/* --- Oyuncu pullari --- */}
      {players.map((p) => {
        const pos = positions[p.id];
        if (!pos) return null;
        const space = spaceAt(pos);

        const sameSpace = players.filter((o) => {
          const op = positions[o.id];
          return op && samePosition(op, pos);
        });
        const idx = sameSpace.findIndex((o) => o.id === p.id);
        const { dx, dy } = stackOffset(idx, sameSpace.length, tokenR * 0.85);
        const isActive = p.id === activePlayerId;

        return (
          <motion.g
            key={`token-${p.id}`}
            initial={false}
            animate={{ x: px(space.x) + dx, y: py(space.y) + dy }}
            transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          >
            {/* Yere dusen golge */}
            <ellipse cy={tokenR * 0.95} rx={tokenR * 0.9} ry={tokenR * 0.32} fill="#000" opacity="0.45" />

            {/* Sirasi gelen oyuncu: altin hale + hafif zipla */}
            {isActive && (
              <motion.g
                animate={{ y: [0, -tokenR * 0.35, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <circle r={tokenR * 1.42} fill="#fbbf24" opacity="0.2" />
                <circle r={tokenR * 1.2} fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                <TokenWheel player={p} r={tokenR} />
              </motion.g>
            )}
            {!isActive && <TokenWheel player={p} r={tokenR * 0.88} />}
          </motion.g>
        );
      })}
    </svg>
  );
};
