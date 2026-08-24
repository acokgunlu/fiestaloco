import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Coins, LogOut } from 'lucide-react';
import { BET_AMOUNTS, HorseRaceBet, HorseRaceGameState, HorseRacePlayer, TRACK_LENGTH } from '../../types/horseRace';

interface HorseRaceControllerViewProps {
  roomCode: string;
  myPlayer: HorseRacePlayer | null;
  myBet: HorseRaceBet | null;
  gameState: HorseRaceGameState;
  errorMessage?: string | null;
  onPlaceBet: (horseId: string, amount: number) => void;
  onSendTaps: (count: number) => void;
  onLeave: () => void;
}

/** Dokunuslar bu araliklarla toplu gonderilir (her dokunusta mesaj = gereksiz yuk). */
const TAP_FLUSH_MS = 150;

export const HorseRaceControllerView: React.FC<HorseRaceControllerViewProps> = ({
  roomCode,
  myPlayer,
  myBet,
  gameState,
  errorMessage,
  onPlaceBet,
  onSendTaps,
  onLeave,
}) => {
  const [pickedHorse, setPickedHorse] = useState<string | null>(null);
  const [pickedAmount, setPickedAmount] = useState<number>(BET_AMOUNTS[0]);
  const [localTaps, setLocalTaps] = useState(0);

  const pendingTaps = useRef(0);
  const flushTimer = useRef<number | null>(null);

  const money = (n: number) => n.toLocaleString('tr-TR');
  const myHorse = gameState.horses.find((h) => h.ownerId === myPlayer?.id);
  const racing = gameState.phase === 'RACING';
  const finished = myHorse?.rank != null;

  /** Biriken dokunuslari periyodik olarak yollar. */
  useEffect(() => {
    if (!racing) {
      if (flushTimer.current) {
        clearInterval(flushTimer.current);
        flushTimer.current = null;
      }
      pendingTaps.current = 0;
      return;
    }
    setLocalTaps(0);
    flushTimer.current = window.setInterval(() => {
      if (pendingTaps.current > 0) {
        onSendTaps(pendingTaps.current);
        pendingTaps.current = 0;
      }
    }, TAP_FLUSH_MS);
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      flushTimer.current = null;
    };
  }, [racing, onSendTaps]);

  const handleTap = useCallback(() => {
    if (!racing || finished) return;
    pendingTaps.current += 1;
    setLocalTaps((n) => n + 1);
    // Kisa titresim — dokunusun kaydedildigi hissi
    if (navigator.vibrate) navigator.vibrate(8);
  }, [racing, finished]);

  const myProgress = myHorse ? Math.min(100, (myHorse.progress / TRACK_LENGTH) * 100) : 0;

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4 space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in select-none">
      {/* Üst kart */}
      <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs text-white"
            style={{ backgroundColor: myPlayer?.color || '#10b981' }}
          >
            {myHorse?.emoji || myPlayer?.avatar || '🐎'}
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
            title="Odadan ayrıl"
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

      {/* LOBİ */}
      {gameState.phase === 'LOBBY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-4xl">🏇</div>
          <h3 className="text-lg font-black">Pistesin!</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            TV ekranından yarışın başlaması bekleniyor…
          </p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1 font-medium text-slate-600 dark:text-slate-300">
            <p>1️⃣ Önce gizlice bir ata bahis koy (kendi atın dahil).</p>
            <p>2️⃣ Sonra ekrana hızlıca basarak kendi atını koştur.</p>
            <p>3️⃣ Atının formu her yarışta değişir — dokunmayan da kazanabilir!</p>
          </div>
        </div>
      )}

      {/* BAHİS */}
      {gameState.phase === 'BETTING' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black">Bahsini koy</h3>
            <span className="text-2xl font-black text-amber-500 tabular-nums">{gameState.timerSeconds}</span>
          </div>

          {myBet ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
              <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">BAHSİN ALINDI</p>
              <p className="text-sm font-black">
                {gameState.horses.find((h) => h.id === myBet.horseId)?.emoji}{' '}
                {gameState.horses.find((h) => h.id === myBet.horseId)?.name} · {money(myBet.amount)} ₺
              </p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Diğer oyuncular bekleniyor…
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {gameState.horses.map((h) => {
                  const sel = pickedHorse === h.id;
                  const isMine = h.ownerId === myPlayer?.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setPickedHorse(h.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        sel
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-black">
                        <span className="text-xl">{h.emoji}</span>
                        {h.name}
                        {isMine && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-black">
                            SEN
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">{h.odds}x</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {BET_AMOUNTS.map((amt) => {
                  const afford = (myPlayer?.money || 0) >= amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => setPickedAmount(amt)}
                      disabled={!afford}
                      className={`py-3 rounded-2xl text-sm font-black border-2 transition-all cursor-pointer disabled:opacity-35 ${
                        pickedAmount === amt
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                      }`}
                    >
                      {money(amt)} ₺
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => pickedHorse && onPlaceBet(pickedHorse, pickedAmount)}
                disabled={!pickedHorse}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-base shadow-lg active:scale-95 transition-transform disabled:opacity-40 cursor-pointer"
              >
                BAHSİ ONAYLA
              </button>
            </>
          )}
        </div>
      )}

      {/* GERİ SAYIM */}
      {gameState.phase === 'COUNTDOWN' && (
        <div className="py-10 text-center space-y-2 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 shadow-lg">
          <div className="text-7xl font-black text-amber-500">{gameState.timerSeconds}</div>
          <p className="text-sm font-black">Parmağını hazırla! 👆</p>
        </div>
      )}

      {/* YARIŞ — dev buton */}
      {racing && (
        <div className="space-y-3">
          <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full transition-[width] duration-100 ease-linear"
              style={{ width: `${myProgress}%`, backgroundColor: myPlayer?.color || '#10b981' }}
            />
          </div>

          <button
            onPointerDown={handleTap}
            disabled={finished}
            className={`w-full aspect-square rounded-[2rem] font-black text-white shadow-2xl transition-transform active:scale-95 flex flex-col items-center justify-center gap-3 touch-manipulation cursor-pointer ${
              finished
                ? 'bg-slate-400 dark:bg-slate-700'
                : 'bg-gradient-to-br from-emerald-500 via-lime-500 to-amber-500'
            }`}
          >
            <span className="text-7xl">{finished ? '🏁' : myHorse?.emoji || '🐎'}</span>
            <span className="text-2xl tracking-wider">
              {finished ? `${myHorse?.rank}. BİTİRDİN` : 'BAS! BAS! BAS!'}
            </span>
            {!finished && <span className="text-sm opacity-90">{localTaps} dokunuş</span>}
          </button>
        </div>
      )}

      {/* SONUÇ */}
      {(gameState.phase === 'ROUND_RESULT' || gameState.phase === 'GAME_OVER') && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-5xl">{myHorse?.rank === 1 ? '🥇' : myHorse?.rank === 2 ? '🥈' : myHorse?.rank === 3 ? '🥉' : '🏁'}</div>
          <h3 className="text-lg font-black">{myHorse?.rank}. sırada bitirdin</h3>
          {(() => {
            const pay = gameState.lastRaceSummary?.payouts[myPlayer?.id || ''];
            if (!pay) return null;
            return (
              <p
                className={`text-2xl font-black ${
                  pay.delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : pay.delta < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}
              >
                {pay.delta > 0 ? '+' : ''}
                {money(pay.delta)} ₺
              </p>
            );
          })()}
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Kasan: {money(myPlayer?.money || 0)} ₺
          </p>
          {gameState.phase === 'GAME_OVER' && gameState.winnerPlayerId === myPlayer?.id && (
            <p className="text-sm font-black text-amber-500">🏆 Pistin kralı sensin!</p>
          )}
        </div>
      )}
    </div>
  );
};
