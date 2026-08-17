import React from 'react';
import { motion } from 'motion/react';
import { TriviaCategory, TRIVIA_CATEGORIES, TriviaPursuitPlayer } from '../../types/triviaPursuit';
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
  /** Oyuncu id -> tahtadaki yeri */
  positions: Record<string, BoardPosition>;
  players: TriviaPursuitPlayer[];
  activePlayerId: string | null;
  /** Zar atildiktan sonra secilebilecek hedefler (bos = secim yok) */
  moveOptions?: MoveOption[];
  onPickMove?: (option: MoveOption) => void;
  size?: number;
}

const CENTER_ICON = '🏆';

/** Ayni karede duran oyunculari birbirinin ustune bindirmemek icin kucuk kaydirma. */
function stackOffset(i: number, total: number): { dx: number; dy: number } {
  if (total <= 1) return { dx: 0, dy: 0 };
  const a = (i / total) * Math.PI * 2;
  return { dx: Math.cos(a) * 9, dy: Math.sin(a) * 9 };
}

export const TriviaBoard: React.FC<TriviaBoardProps> = ({
  positions,
  players,
  activePlayerId,
  moveOptions = [],
  onPickMove,
  size = 520,
}) => {
  const c = size / 2;
  // Birim koordinati (-1..1) piksele cevir. Kenarda token tasmasin diye pay birak.
  const scale = c * 0.9;
  const px = (x: number) => c + x * scale;
  const py = (y: number) => c + y * scale;

  const spaceR = size * 0.035;
  const hqR = size * 0.05;

  /** Bir karenin hedef secenegi olup olmadigini bul. */
  const optionFor = (pos: BoardPosition): MoveOption | undefined =>
    moveOptions.find((o) => samePosition(o.to, pos));

  const renderSpace = (space: BoardSpace, pos: BoardPosition, key: string) => {
    const opt = optionFor(pos);
    const isHq = space.kind === 'hq';
    const r = isHq ? hqR : spaceR;
    const cat = space.category ? TRIVIA_CATEGORIES[space.category] : null;

    const fill =
      space.kind === 'rollAgain' ? '#1e293b' : cat ? cat.color : '#334155';

    return (
      <g
        key={key}
        onClick={opt && onPickMove ? () => onPickMove(opt) : undefined}
        style={{ cursor: opt ? 'pointer' : 'default' }}
      >
        {/* Secilebilir hedef halkasi */}
        {opt && (
          <circle
            cx={px(space.x)}
            cy={py(space.y)}
            r={r + 7}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            className="animate-pulse"
          />
        )}

        <circle
          cx={px(space.x)}
          cy={py(space.y)}
          r={r}
          fill={fill}
          stroke={isHq ? '#fbbf24' : '#0f172a'}
          strokeWidth={isHq ? 3 : 1.5}
        />

        {/* Kale: kategori ikonu. Normal kare: sade. Tekrar at: ok. */}
        {isHq && cat && (
          <text
            x={px(space.x)}
            y={py(space.y)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={hqR * 1.1}
            className="pointer-events-none"
          >
            {cat.icon}
          </text>
        )}
        {space.kind === 'rollAgain' && (
          <text
            x={px(space.x)}
            y={py(space.y)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={spaceR * 1.2}
            fill="#fbbf24"
            fontWeight="bold"
            className="pointer-events-none"
          >
            ↻
          </text>
        )}
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
      {/* Tahta zemini */}
      <defs>
        <radialGradient id="boardBg" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={c - 2} fill="url(#boardBg)" stroke="#fbbf24" strokeWidth="3" opacity="0.95" />

      {/* Kollar (once cizilsin ki kareler ustte kalsin) */}
      {HQ_INDICES.map((ringIndex, hq) => {
        const from = RING_SPACES[ringIndex];
        return (
          <line
            key={`spoke-line-${hq}`}
            x1={px(from.x)}
            y1={py(from.y)}
            x2={px(HUB_SPACE.x)}
            y2={py(HUB_SPACE.y)}
            stroke="#334155"
            strokeWidth={size * 0.022}
            strokeLinecap="round"
          />
        );
      })}

      {/* Halka rayi */}
      <circle
        cx={c}
        cy={c}
        r={0.86 * scale}
        fill="none"
        stroke="#334155"
        strokeWidth={size * 0.028}
      />

      {/* Halka kareleri */}
      {RING_SPACES.map((s, i) => renderSpace(s, { track: 'ring', index: i }, `ring-${i}`))}

      {/* Kol kareleri */}
      {SPOKE_SPACES.map((spoke, hq) =>
        spoke.map((s, si) =>
          renderSpace(s, { track: 'spoke', hq, step: si + 1 }, `spoke-${hq}-${si}`)
        )
      )}

      {/* Merkez */}
      {(() => {
        const opt = optionFor({ track: 'hub' });
        return (
          <g
            onClick={opt && onPickMove ? () => onPickMove(opt) : undefined}
            style={{ cursor: opt ? 'pointer' : 'default' }}
          >
            {opt && (
              <circle
                cx={c}
                cy={c}
                r={size * 0.105}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                className="animate-pulse"
              />
            )}
            <circle
              cx={c}
              cy={c}
              r={size * 0.08}
              fill="#0f172a"
              stroke="#fbbf24"
              strokeWidth="3"
            />
            <text
              x={c}
              y={c}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.07}
              className="pointer-events-none"
            >
              {CENTER_ICON}
            </text>
          </g>
        );
      })()}

      {/* Oyuncu pullari */}
      {players.map((p) => {
        const pos = positions[p.id];
        if (!pos) return null;
        const space = spaceAt(pos);

        const sameSpace = players.filter((o) => {
          const op = positions[o.id];
          return op && samePosition(op, pos);
        });
        const idx = sameSpace.findIndex((o) => o.id === p.id);
        const { dx, dy } = stackOffset(idx, sameSpace.length);

        const isActive = p.id === activePlayerId;
        const tokenR = size * 0.028;

        return (
          <motion.g
            key={`token-${p.id}`}
            // initial={false}: ilk render'da (0,0)'dan animasyon baslatma —
            // pul tahtanin disinda belirip iceri kayiyordu.
            initial={false}
            animate={{ x: px(space.x) + dx, y: py(space.y) + dy }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            <circle
              r={tokenR + (isActive ? 3 : 0)}
              fill={p.color}
              stroke={isActive ? '#fbbf24' : '#0f172a'}
              strokeWidth={isActive ? 3 : 2}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={tokenR * 1.3}
              className="pointer-events-none"
            >
              {p.avatar}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
};
