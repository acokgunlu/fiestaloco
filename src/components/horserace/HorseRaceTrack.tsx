import React from 'react';
import { RaceHorse, TRACK_LENGTH } from '../../types/horseRace';

import { t } from '../../i18n';
interface HorseRaceTrackProps {
  horses: RaceHorse[];
  /** Vurgulanacak at (telefonda kendi atın). */
  highlightHorseId?: string | null;
  /** Küçük yerleşim (telefon) — şeritler incelir. */
  compact?: boolean;
}

/**
 * Yarış pisti. Saf CSS/flex — SVG'ye gerek yok, at emojisi şeridin içinde
 * soldan sağa kayıyor. Konum geçişi `transition` ile yumuşatılıyor; sunucu
 * 10 Hz yayın yapıyor, araya giren 100 ms CSS geçişi hareketi akıcı gösteriyor.
 */
export const HorseRaceTrack: React.FC<HorseRaceTrackProps> = ({
  horses,
  highlightHorseId = null,
  compact = false,
}) => {
  // Yarış sırasında öndeki üstte görünsün — heyecanı okumak kolaylaşır
  const ordered = [...horses].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return b.progress - a.progress;
  });

  const laneH = compact ? 'h-9' : 'h-14';
  const emojiSize = compact ? 'text-xl' : 'text-3xl';

  return (
    <div className="w-full space-y-2">
      {ordered.map((h) => {
        const pct = Math.min(100, (h.progress / TRACK_LENGTH) * 100);
        const isMe = highlightHorseId === h.id;
        const done = h.rank !== null;

        return (
          <div key={h.id} className="flex items-center gap-2">
            {/* Sıra rozeti */}
            <div
              className={`shrink-0 ${compact ? 'w-6 text-[10px]' : 'w-8 text-xs'} text-center font-black ${
                h.rank === 1
                  ? 'text-amber-500'
                  : h.rank
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-transparent'
              }`}
            >
              {h.rank ? `${h.rank}.` : '—'}
            </div>

            {/* Şerit */}
            <div
              className={`relative flex-1 ${laneH} rounded-xl overflow-hidden border ${
                isMe
                  ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40'
                  : 'border-slate-300 dark:border-slate-700'
              } bg-[repeating-linear-gradient(90deg,#e2e8f0_0_18px,#f1f5f9_18px_36px)] dark:bg-[repeating-linear-gradient(90deg,#1e293b_0_18px,#0f172a_18px_36px)]`}
            >
              {/* Kat edilen mesafe gölgesi */}
              <div
                className="absolute inset-y-0 left-0 opacity-25 transition-[width] duration-100 ease-linear"
                style={{ width: `${pct}%`, backgroundColor: h.color }}
              />

              {/* At */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-100 ease-linear"
                style={{ left: `calc(${pct}% - ${compact ? 10 : 16}px)` }}
              >
                <span className={`${emojiSize} drop-shadow-sm ${done ? '' : 'animate-pulse'}`}>
                  {h.emoji}
                </span>
              </div>

              {/* Bitiş çizgisi */}
              <div className="absolute inset-y-0 right-0 w-1.5 bg-[repeating-linear-gradient(0deg,#000_0_6px,#fff_6px_12px)]" />
            </div>

            {/* İsim + oran */}
            <div className={`shrink-0 ${compact ? 'w-20' : 'w-32'} text-left`}>
              <div
                className={`${compact ? 'text-[11px]' : 'text-sm'} font-black truncate ${
                  isMe ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {h.name}
              </div>
              {!compact && (
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {t('oran {a}{b}', { a: h.odds, b: h.form.length > 0 ? ` · form ${h.form.slice(-3).join('-')}` : '' })}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
