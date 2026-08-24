import React from 'react';
import { TriviaCategory, TRIVIA_CATEGORIES, TRIVIA_CATEGORY_KEYS } from '../../types/triviaPursuit';
import { motion } from 'motion/react';
import { Sparkles, Disc } from 'lucide-react';

import { t } from '../../i18n';
interface TriviaCategoryWheelProps {
  rotationDegrees: number;
  isSpinning: boolean;
  selectedCategory: TriviaCategory | null;
  onSpinClick?: () => void;
  canSpin?: boolean;
  size?: number;
  onSelectCategoryDirectly?: (cat: TriviaCategory) => void;
}

export const TriviaCategoryWheel: React.FC<TriviaCategoryWheelProps> = ({
  rotationDegrees,
  isSpinning,
  selectedCategory,
  onSpinClick,
  canSpin = false,
  size = 320,
  onSelectCategoryDirectly,
}) => {
  const center = size / 2;
  const radius = size * 0.45;
  const totalSlices = TRIVIA_CATEGORY_KEYS.length;
  const anglePerSlice = 360 / totalSlices;

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Top Pointer Arrow */}
      <div className="relative z-20 flex flex-col items-center -mb-4">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(251,191,36,0.6)] animate-bounce" />
      </div>

      {/* Wheel Wrapper */}
      <div
        className="relative rounded-full shadow-2xl p-2 bg-gradient-to-b from-slate-800 to-slate-950 border-4 border-amber-400/40"
        style={{ width: size + 16, height: size + 16 }}
      >
        {/* Outer Glowing Ring with decorative studs */}
        <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />

        {/* Rotating SVG Disc */}
        <motion.div
          animate={{ rotate: rotationDegrees }}
          transition={{
            duration: isSpinning ? 2.5 : 0.4,
            ease: isSpinning ? [0.25, 1, 0.5, 1] : 'easeOut',
          }}
          style={{ width: size, height: size }}
          className="relative rounded-full overflow-hidden"
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <g transform={`translate(${center}, ${center})`}>
              {TRIVIA_CATEGORY_KEYS.map((catKey, index) => {
                const cat = TRIVIA_CATEGORIES[catKey];
                const startAngle = (index * anglePerSlice - 90) * (Math.PI / 180);
                const endAngle = ((index + 1) * anglePerSlice - 90) * (Math.PI / 180);

                const x1 = radius * Math.cos(startAngle);
                const y1 = radius * Math.sin(startAngle);
                const x2 = radius * Math.cos(endAngle);
                const y2 = radius * Math.sin(endAngle);

                const textAngle = index * anglePerSlice + anglePerSlice / 2 - 90;
                const textRad = (textAngle * Math.PI) / 180;
                const textDist = radius * 0.62;
                const tx = textDist * Math.cos(textRad);
                const ty = textDist * Math.sin(textRad);

                // Yazi yaricap boyunca hizalanir. Cemberin alt yarisinda bu aci
                // 90-270 araligina dusup metni BAS ASAGI cevirir; o dilimlerde
                // 180 derece geri cevirip okunur tutuyoruz. Ikon da ayni anda
                // donuyor, bu yuzden etiketin dis tarafinda kalmasi icin
                // y isaretini ters ceviriyoruz.
                const rawRotation = textAngle + 90;
                const isUpsideDown = rawRotation > 90 && rawRotation < 270;
                const textRotation = isUpsideDown ? rawRotation - 180 : rawRotation;
                const iconOffsetY = isUpsideDown ? 16 : -16;

                return (
                  <g key={catKey} className="group cursor-pointer">
                    {/* Slice path */}
                    <path
                      d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                      fill={cat.color}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      className="transition-opacity hover:opacity-95"
                    />

                    {/* Text & Icon in Slice */}
                    <g transform={`translate(${tx}, ${ty}) rotate(${textRotation})`}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize={Math.max(12, size * 0.045)}
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                      >
                        {cat.label}
                      </text>
                      <text
                        y={iconOffsetY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.max(14, size * 0.05)}
                        className="pointer-events-none"
                      >
                        {cat.icon}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Inner Rim */}
              <circle r={radius * 0.28} fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
            </g>
          </svg>
        </motion.div>

        {/* Center Spin Button / Action Hub */}
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full flex flex-col items-center justify-center z-10">
          {canSpin ? (
            <button
              onClick={onSpinClick}
              disabled={isSpinning}
              className={`w-20 h-20 rounded-full font-black text-xs tracking-wider uppercase text-white shadow-xl transition-all transform active:scale-95 flex flex-col items-center justify-center border-2 border-amber-300 ${
                isSpinning
                  ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-br from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 hover:scale-105 animate-pulse'
              }`}
            >
              <Disc className={`w-5 h-5 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'ÇEVRİLİYOR' : 'ÇEVİR!'}</span>
            </button>
          ) : (
            <div className="w-18 h-18 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400 flex flex-col items-center justify-center text-[10px] font-bold text-center px-1">
              <Disc className="w-4 h-4 mb-0.5 text-amber-400" />
              <span>{t('TRIVIA')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Category Pick Chips (Optional fallback / Host control) */}
      {onSelectCategoryDirectly && !isSpinning && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md">
          {TRIVIA_CATEGORY_KEYS.map((catKey) => {
            const cat = TRIVIA_CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => onSelectCategoryDirectly(catKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? 'border-white bg-white/20 text-white scale-105 shadow-md ring-2 ring-amber-400'
                    : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
