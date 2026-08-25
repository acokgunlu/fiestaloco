import React from 'react';
import { motion } from 'motion/react';
import { TimingPlayer, TimingPress } from '../../types/timing';
import { buildTimeline, formatSec } from '../../data/timingLogic';

import { t } from '../../i18n';
interface Props {
  targetMs: number;
  results: TimingPress[];
  players: TimingPlayer[];
  /** Vurgulanacak oyuncu (telefonda kendisi). */
  highlightPlayerId?: string;
  compact?: boolean;
}

/**
 * Turun zaman çizgisi: kim hedefin ne kadar önüne/arkasına düştü.
 *
 * Ölçek en geç basana göre kurulur (buildTimeline), böylece "20 saniyeyi bulan
 * adam" çizginin dışında kalıp görünmez olmaz — turun en komik verisi odur.
 * Giriş animasyonu bilerek REVEAL'a özel: RUNNING sırasında ekranda periyodik
 * hiçbir şey oynamamalı, yoksa metronom görevi görür.
 */
export const TimingTimeline: React.FC<Props> = ({
  targetMs, results, players, highlightPlayerId, compact = false,
}) => {
  if (results.length === 0) return null;

  const tl = buildTimeline(targetMs, results, compact ? 14 : 9);
  const laneH = compact ? 38 : 46;
  // Nisan kutusunun yuksekligi — raya inen baglanti bunun altindan baslar.
  const chipH = compact ? 24 : 26;
  const nameOf = (id: string) => players.find((p) => p.id === id);

  // Saniye çizgileri — çizginin ölçeğini okunur kılar
  const tickStep = tl.maxMs > 20000 ? 5000 : tl.maxMs > 10000 ? 2000 : 1000;
  const ticks: number[] = [];
  for (let t = tickStep; t < tl.maxMs; t += tickStep) ticks.push(t);

  return (
    <div className="w-full px-10 sm:px-12 pt-2 pb-1 select-none">
      <div className="relative w-full" style={{ height: tl.laneCount * laneH + 46 }}>
        {/* Ray */}
        <div
          className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"
          style={{ top: tl.laneCount * laneH + 14 }}
        />

        {/* Saniye işaretleri */}
        {ticks.map((t) => (
          <div key={t} className="absolute" style={{ left: `${(t / tl.maxMs) * 100}%`, top: tl.laneCount * laneH + 8 }}>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-auto" />
            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 -translate-x-1/2 mt-0.5 tabular-nums">
              {Math.round(t / 1000)}
            </div>
          </div>
        ))}

        {/* HEDEF çizgisi */}
        <div className="absolute" style={{ left: `${tl.targetPct}%`, top: 0, height: tl.laneCount * laneH + 20 }}>
          <div className="w-0.5 h-full bg-amber-400 dark:bg-amber-400" style={{ boxShadow: '0 0 12px rgba(251,191,36,0.7)' }} />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black tabular-nums shadow">
            {t('HEDEF {a}', { a: formatSec(targetMs, 0) })}</div>
        </div>

        {/* Oyuncu nişanları */}
        {tl.items.map((item, i) => {
          const p = nameOf(item.playerId);
          const res = results.find((r) => r.playerId === item.playerId)!;
          const mine = item.playerId === highlightPlayerId;
          return (
            <motion.div
              key={item.playerId}
              /*
                OPAKLIK ANIMASYONA DAHIL DEGIL — BILEREK.
                Sekme arka plana dustugunde requestAnimationFrame durur ve
                animasyon oldugu yerde kalir. Opakligi de animasyona koysaydik
                (ilk denemede oyleydi) nisan %11 opaklikta donup kaliyordu:
                turun tek onemli gorseli goze gorunmez oluyordu. Simdi en kotu
                ihtimalle biraz kucuk/kaymis gorunur — ama HER ZAMAN okunur.
              */
              initial={{ y: -14, scale: 0.82 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ delay: i * 0.13, type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${item.pct}%`, top: item.lane * laneH }}
            >
              <div
                className={`flex items-center gap-1 px-1.5 py-1 rounded-xl border-2 shadow-md whitespace-nowrap ${
                  res.burned
                    ? 'bg-rose-50 dark:bg-rose-950 border-rose-400 dark:border-rose-700'
                    : res.rank === 1
                      ? 'bg-amber-50 dark:bg-amber-950 border-amber-400'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                } ${mine ? 'ring-2 ring-sky-400' : ''}`}
              >
                <span className={compact ? 'text-xs' : 'text-sm'}>{p?.avatar || '⏱️'}</span>
                {!compact && (
                  <span className="text-[10px] font-black max-w-[64px] truncate">{p?.name}</span>
                )}
                <span className={`text-[10px] font-black tabular-nums ${
                  res.burned ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {res.burned ? 'YANDI' : formatSec(res.elapsedMs)}
                </span>
              </div>
              {/* Raya inen bağlantı */}
              <div
                className={`w-px ${res.burned ? 'bg-rose-400' : res.rank === 1 ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`}
                style={{ height: Math.max(4, (tl.laneCount - item.lane) * laneH + 12 - chipH) }}
              />
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow ${
                  res.burned ? 'bg-rose-500' : res.rank === 1 ? 'bg-amber-400' : ''}`}
                style={!res.burned && res.rank !== 1 ? { backgroundColor: p?.color || '#64748b' } : undefined}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
