import React from 'react';
import { TriviaCategory, TRIVIA_CATEGORIES, TRIVIA_CATEGORY_KEYS } from '../../types/triviaPursuit';

interface TriviaWedgePieProps {
  wedges: TriviaCategory[];
  size?: number;
  highlightCategory?: TriviaCategory | null;
  className?: string;
  showLabels?: boolean;
}

export const TriviaWedgePie: React.FC<TriviaWedgePieProps> = ({
  wedges = [],
  size = 48,
  highlightCategory = null,
  className = '',
  showLabels = false,
}) => {
  const radius = size / 2;
  const innerRadius = radius * 0.22;
  const wedgeRadius = radius * 0.92;
  const center = radius;
  const totalSlices = TRIVIA_CATEGORY_KEYS.length;
  const anglePerSlice = 360 / totalSlices;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Outer Circular Ring */}
        <circle
          cx={center}
          cy={center}
          r={wedgeRadius}
          fill="#1e1e2e"
          stroke="#475569"
          strokeWidth={Math.max(1.5, size * 0.04)}
          className="shadow-sm"
        />

        {/* 6 Category Slices / Wedges */}
        {TRIVIA_CATEGORY_KEYS.map((catKey, index) => {
          const catInfo = TRIVIA_CATEGORIES[catKey];
          const hasWedge = wedges.includes(catKey);
          const isHighlighted = highlightCategory === catKey;

          const startAngle = (index * anglePerSlice - 90) * (Math.PI / 180);
          const endAngle = ((index + 1) * anglePerSlice - 90) * (Math.PI / 180);

          const x1 = center + wedgeRadius * Math.cos(startAngle);
          const y1 = center + wedgeRadius * Math.sin(startAngle);
          const x2 = center + wedgeRadius * Math.cos(endAngle);
          const y2 = center + wedgeRadius * Math.sin(endAngle);

          const ix1 = center + innerRadius * Math.cos(startAngle);
          const iy1 = center + innerRadius * Math.sin(startAngle);
          const ix2 = center + innerRadius * Math.cos(endAngle);
          const iy2 = center + innerRadius * Math.sin(endAngle);

          // Path drawing standard annular sector wedge
          const pathData = `
            M ${ix1} ${iy1}
            L ${x1} ${y1}
            A ${wedgeRadius} ${wedgeRadius} 0 0 1 ${x2} ${y2}
            L ${ix2} ${iy2}
            A ${innerRadius} ${innerRadius} 0 0 0 ${ix1} ${iy1}
            Z
          `;

          return (
            <g key={catKey}>
              <path
                d={pathData}
                fill={hasWedge ? catInfo.color : '#26283b'}
                stroke="#181825"
                strokeWidth={Math.max(1, size * 0.025)}
                className={`transition-all duration-300 ${
                  hasWedge
                    ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                    : 'opacity-40'
                } ${isHighlighted ? 'filter brightness-125 stroke-yellow-300 stroke-2 animate-pulse' : ''}`}
              />
            </g>
          );
        })}

        {/* Center Hub */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="#0f172a"
          stroke="#e2e8f0"
          strokeWidth={Math.max(1, size * 0.03)}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius * 0.4}
          fill={wedges.length >= 6 ? '#f59e0b' : '#64748b'}
        />
      </svg>

      {showLabels && (
        <span className="ml-2 text-xs font-bold text-slate-300">
          {wedges.length}/6
        </span>
      )}
    </div>
  );
};
