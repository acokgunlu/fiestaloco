import React, { useState } from 'react';
import { AlertTriangle, Coins, LogOut, Ticket } from 'lucide-react';
import {
  BET_AMOUNTS,
  BetKind,
  HorseRaceBet,
  HorseRaceGameState,
  HorseRacePlayer,
} from '../../types/horseRace';
import { describeBet } from '../../data/horseRaceLogic';
import { HorseRaceTrack } from './HorseRaceTrack';

import { t } from '../../i18n';
interface Props {
  roomCode: string;
  players: HorseRacePlayer[];
  myPlayer: HorseRacePlayer | null;
  myBet: HorseRaceBet | null;
  gameState: HorseRaceGameState;
  errorMessage?: string | null;
  onPlaceBet: (kind: BetKind, horseIds: string[], amount: number) => void;
  onLeave: () => void;
}

const KIND_INFO: Record<BetKind, { label: string; hint: string }> = {
  ganyan: { label: 'Ganyan', hint: 'Birinci geleni bil' },
  plase: { label: 'Plase', hint: 'İlk ikiye gireni bil' },
  ikili: { label: 'İkili', hint: '1. ve 2.’yi sırayla bil' },
};

export const HorseRaceControllerView: React.FC<Props> = ({
  roomCode,
  players,
  myPlayer,
  myBet,
  gameState,
  errorMessage,
  onPlaceBet,
  onLeave,
}) => {
  const [kind, setKind] = useState<BetKind>('ganyan');
  const [picks, setPicks] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(BET_AMOUNTS[0]);

  const money = (n: number) => n.toLocaleString('tr-TR');
  const need = kind === 'ikili' ? 2 : 1;
  const ready = picks.length === need;

  const togglePick = (id: string) => {
    setPicks((prev) => {
      if (kind !== 'ikili') return [id];
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return prev.length >= 2 ? [prev[1], id] : [...prev, id];
    });
  };

  const changeKind = (k: BetKind) => {
    setKind(k);
    setPicks([]);
  };

  /** Seçili kuponun ödeme çarpanı — oyuncu ne kazanacağını görsün. */
  const previewMultiplier = (): number | null => {
    if (!ready) return null;
    const h = (id: string) => gameState.horses.find((x) => x.id === id);
    if (kind === 'ganyan') return h(picks[0])?.odds ?? null;
    if (kind === 'plase') return h(picks[0])?.placeOdds ?? null;
    const i = gameState.horses.findIndex((x) => x.id === picks[0]);
    const j = gameState.horses.findIndex((x) => x.id === picks[1]);
    return gameState.exactaOdds?.[i]?.[j] ?? null;
  };
  const mult = previewMultiplier();

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4 space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in">
      {/* Üst kart */}
      <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white"
            style={{ backgroundColor: myPlayer?.color || '#10b981' }}
          >
            {myPlayer?.avatar || '🎫'}
          </div>
          <div>
            <div className="font-black text-sm truncate max-w-[140px]">{myPlayer?.name}</div>
            <div className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {money(myPlayer?.money || 0)} ₺
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
            {roomCode}
          </span>
          <button
            onClick={onLeave}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {gameState.phase === 'LOBBY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-4xl">🎫</div>
          <h3 className="text-lg font-black">{t('Gişe açıldı!')}</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {t('TV ekranından yarışın başlaması bekleniyor…')}</p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1 font-medium text-slate-600 dark:text-slate-300">
            <p><strong>{t('Ganyan')}</strong>  {t('— birinci geleni bil, en yüksek ödeme.')}</p>
            <p><strong>{t('Plase')}</strong>  {t('— ilk ikiye gireni bil, garantici oyun.')}</p>
            <p><strong>{t('İkili')}</strong>  {t('— 1. ve 2.’yi sırayla bil, kasayı patlat.')}</p>
            <p className="pt-1 text-slate-500 dark:text-slate-400">
              {t('Oranlar atların gerçek şansından hesaplanır. Form çizelgesini oku, ucuz kalanı yakala.')}</p>
          </div>
        </div>
      )}

      {gameState.phase === 'BETTING' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black flex items-center gap-1.5">
              <Ticket className="w-4 h-4" />  {t('Kuponun')}</h3>
            <span className="text-2xl font-black text-amber-500 tabular-nums">{gameState.timerSeconds}</span>
          </div>

          {/*
            SIRALAMA — kuponu doldururken görünmeli.
            Ölçümde turnuva stratejisi (geride yüksek varyans, önde korumacı)
            düz oynamaya karşı %54-%45 üstünlük veriyor. Ama oyuncu kimin
            önde olduğunu görmezse bu beceriyi kullanamıyordu; şans oyununa
            dönüşüyordu. Bilgi olmadan strateji olmaz.
          */}
          {(() => {
            const sorted = [...players].sort((a, b) => b.money - a.money);
            const lead = sorted[0]?.money ?? 0;
            const mine = myPlayer?.money ?? 0;
            const gap = lead - mine;
            const lastRace = gameState.currentRace >= gameState.settings.totalRaces;
            return (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {sorted.map((p, i) => (
                    <span
                      key={p.id}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black border ${
                        p.id === myPlayer?.id
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {i + 1}. {p.name} {money(p.money)}₺
                    </span>
                  ))}
                </div>
                {gap > 0 && (
                  <p className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                    Liderden {money(gap)} ₺ geridesin
                    {lastRace ? t(' · son yarış, riski yükseltmezsen yetişemezsin') : ''}
                  </p>
                )}
                {gap === 0 && players.length > 1 && (
                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    Lidersin{lastRace ? t(' · korumaya çekilmek mantıklı (plase)') : ''}
                  </p>
                )}
              </div>
            );
          })()}

          {myBet ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
              <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">{t('KUPON ALINDI')}</p>
              <p className="text-sm font-black">{describeBet(myBet, gameState.horses)}</p>
              <p className="text-sm font-black text-amber-600 dark:text-amber-400">{money(myBet.amount)} ₺</p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {t('Gişe kapanması bekleniyor…')}</p>
            </div>
          ) : (
            <>
              {/* Kupon türü */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(KIND_INFO) as BetKind[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => changeKind(k)}
                    className={`py-2.5 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer ${
                      kind === k
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    {KIND_INFO[k].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center -mt-1">
                {KIND_INFO[kind].hint}
                {kind === 'ikili' && picks.length < 2 && ` · ${picks.length}/2 seçildi`}
              </p>

              {/* "8.8x" tek başına anlaşılmıyordu — ne olduğunu yazıyoruz. */}
              <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>{t('At')}</span>
                <span>{t('Oran · paranın kaç katı')}</span>
              </div>

              {/* Atlar */}
              <div className="space-y-2">
                {gameState.horses.map((h) => {
                  const pos = picks.indexOf(h.id);
                  const sel = pos >= 0;
                  const shown = kind === 'plase' ? h.placeOdds : h.odds;
                  return (
                    <button
                      key={h.id}
                      onClick={() => togglePick(h.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        sel
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-black">
                        <span className="text-xl">{h.emoji}</span>
                        {h.name}
                        {kind === 'ikili' && sel && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black">
                            {pos + 1}.
                          </span>
                        )}
                        {h.form.length > 0 && (
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                            {h.form.slice(-3).join('-')}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">{shown}x</span>
                    </button>
                  );
                })}
              </div>

              {/* Miktar */}
              <div className="grid grid-cols-4 gap-2">
                {BET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    disabled={(myPlayer?.money || 0) < a}
                    className={`py-3 rounded-2xl text-xs font-black border-2 transition-all cursor-pointer disabled:opacity-35 ${
                      amount === a
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    {a >= 1000 ? `${a / 1000}K` : a}
                  </button>
                ))}
              </div>

              {mult && (
                <p className="text-center text-xs font-black text-slate-600 dark:text-slate-300">
                  Tutarsa: <span className="text-emerald-600 dark:text-emerald-400">
                    +{money(Math.round(amount * (mult - 1)))} ₺
                  </span>{' '}
                  <span className="text-slate-400">({mult}x)</span>
                </p>
              )}

              <button
                onClick={() => ready && onPlaceBet(kind, picks, amount)}
                disabled={!ready}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-base shadow-lg active:scale-95 transition-transform disabled:opacity-40 cursor-pointer"
              >
                {t('KUPONU YATIR')}</button>
            </>
          )}
        </div>
      )}

      {gameState.phase === 'COUNTDOWN' && (
        <div className="py-10 text-center space-y-2 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 shadow-lg">
          <div className="text-7xl font-black text-amber-500">{gameState.timerSeconds}</div>
          <p className="text-sm font-black">{t('Gişe kapandı — atlar çıkıyor! 🐎')}</p>
        </div>
      )}

      {gameState.phase === 'RACING' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
          <p className="text-center text-sm font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
            {t("🏁 Yarış sürüyor — TV'ye bak!")}</p>
          <HorseRaceTrack horses={gameState.horses} compact highlightHorseId={myBet?.horseIds[0] || null} />
        </div>
      )}

      {(gameState.phase === 'ROUND_RESULT' || gameState.phase === 'GAME_OVER') && (() => {
        const pay = gameState.lastRaceSummary?.payouts[myPlayer?.id || ''];
        return (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
            <div className="text-5xl">{pay?.won ? '🎉' : '💸'}</div>
            <h3 className="text-lg font-black">{pay?.won ? 'KUPON TUTTU!' : t('Kupon yattı')}</h3>
            {pay?.bet && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {describeBet(pay.bet, gameState.horses)} · {money(pay.bet.amount)} ₺
              </p>
            )}
            <p className={`text-3xl font-black ${
              (pay?.delta || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400'
              : (pay?.delta || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
            }`}>
              {(pay?.delta || 0) > 0 ? '+' : ''}{money(pay?.delta || 0)} ₺
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Kasan: {money(myPlayer?.money || 0)} ₺
            </p>
            {gameState.phase === 'GAME_OVER' && gameState.winnerPlayerId === myPlayer?.id && (
              <p className="text-sm font-black text-amber-500">{t('🏆 Gecenin kralı sensin!')}</p>
            )}
          </div>
        );
      })()}
    </div>
  );
};
