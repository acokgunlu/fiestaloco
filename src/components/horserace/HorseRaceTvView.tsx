import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, Trophy, Users, Coins } from 'lucide-react';
import { HorseRaceGameState, HorseRacePlayer } from '../../types/horseRace';
import { HorseRaceTrack } from './HorseRaceTrack';

interface HorseRaceTvViewProps {
  roomCode: string;
  gameState: HorseRaceGameState;
  players: HorseRacePlayer[];
  onStartGame: () => void;
  onNextRace: () => void;
  onRestartGame: () => void;
  onReturnToHub: () => void;
}

export const HorseRaceTvView: React.FC<HorseRaceTvViewProps> = ({
  roomCode,
  gameState,
  players,
  onStartGame,
  onNextRace,
  onRestartGame,
  onReturnToHub,
}) => {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?game=race&room=${roomCode}`;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [roomCode]);

  const money = (n: number) => n.toLocaleString('tr-TR');
  const sortedByMoney = [...players].sort((a, b) => b.money - a.money);
  const summary = gameState.lastRaceSummary;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Üst bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Parti Arenası
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-lime-500 to-amber-400 text-white flex items-center justify-center text-2xl shadow-md border-2 border-white dark:border-slate-700">
              🏇
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                At Yarışı
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Yarış {gameState.currentRace}/{gameState.settings.totalRaces} · Ganyan · Plase · İkili
              </p>
            </div>
          </div>
        </div>

        <span className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 font-mono font-black text-2xl tracking-[0.3em] border-2 border-amber-400">
          {roomCode}
        </span>
      </div>

      {/* LOBİ */}
      {gameState.phase === 'LOBBY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
              Telefondan Katılın
            </h3>
            {qr ? (
              <img src={qr} alt="Katılım QR kodu" className="w-48 h-48 rounded-2xl" />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-3">
              Kamerayla okutun veya{' '}
              <strong className="text-slate-900 dark:text-white">{window.location.host}</strong>{' '}
              adresine girip <strong className="text-amber-500">{roomCode}</strong> yazın.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Users className="w-4 h-4" />
                Bahisçiler ({players.length})
              </div>
              {players.length === 0 ? (
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 italic py-6 text-center">
                  İlk bahisçinin katılması bekleniyor…
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <span
                      key={p.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black flex items-center gap-1.5"
                    >
                      <span>{p.avatar}</span>
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-900 dark:text-emerald-200 space-y-1">
              <p>🎫 Telefonlar gişe: Ganyan (birinci), Plase (ilk iki), İkili (1-2 sırayla).</p>
              <p>💰 Herkes 1000 ₺ ile başlar. {gameState.settings.totalRaces} yarış sonunda kasası en kalabalık olan kazanır.</p>
            </div>

            <button
              onClick={onStartGame}
              disabled={players.length < 1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5" />
              YARIŞI BAŞLAT
            </button>
          </div>
        </div>
      )}

      {/* BAHİS */}
      {gameState.phase === 'BETTING' && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="text-5xl font-black text-amber-500 tabular-nums">{gameState.timerSeconds}</div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">BAHİSLER AÇIK</h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Telefonlarınızdan kuponunuzu doldurun
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {gameState.horses.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md text-center"
              >
                <div className="text-4xl mb-1">{h.emoji}</div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate">{h.name}</div>
                <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black border border-amber-300 dark:border-amber-800">
                  {h.odds}x
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => {
              const done = gameState.betPlacedPlayerIds.includes(p.id);
              return (
                <span
                  key={p.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                    done
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {p.avatar} {p.name} {done ? '✔' : '…'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* GERİ SAYIM */}
      {gameState.phase === 'COUNTDOWN' && (
        <div className="py-16 text-center space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.timerSeconds}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              className="text-[8rem] leading-none font-black text-amber-500"
            >
              {gameState.timerSeconds}
            </motion.div>
          </AnimatePresence>
          <p className="text-lg font-black text-slate-600 dark:text-slate-300">
            Telefonları hazırlayın… 🐎
          </p>
        </div>
      )}

      {/* YARIŞ + SONUÇ */}
      {(gameState.phase === 'RACING' ||
        gameState.phase === 'ROUND_RESULT' ||
        gameState.phase === 'GAME_OVER') && (
        <div className="space-y-5">
          {gameState.phase === 'RACING' && (
            <h3 className="text-center text-2xl font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
              🏁 YARIŞ SÜRÜYOR!
            </h3>
          )}

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <HorseRaceTrack horses={gameState.horses} />
          </div>

          {/* Tur sonucu / ödemeler */}
          {summary && gameState.phase !== 'RACING' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Coins className="w-4 h-4" />
                Kasa
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortedByMoney.map((p) => {
                  const pay = summary.payouts[p.id];
                  const delta = pay?.delta ?? 0;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                    >
                      <span className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <span className="text-lg">{p.avatar}</span>
                        {p.name}
                        {pay?.won && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black">
                            BAHİS TUTTU
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black ${
                            delta > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : delta < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {delta > 0 ? '+' : ''}
                          {money(delta)}
                        </span>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {money(p.money)} ₺
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gameState.phase === 'ROUND_RESULT' && (
            <button
              onClick={onNextRace}
              className="w-full sm:w-auto mx-auto block px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              SONRAKİ YARIŞ →
            </button>
          )}

          {gameState.phase === 'GAME_OVER' && (
            <div className="text-center space-y-4 py-4">
              <Trophy className="w-14 h-14 mx-auto text-amber-500" />
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {players.find((p) => p.id === gameState.winnerPlayerId)?.name} kazandı!
              </h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {money(players.find((p) => p.id === gameState.winnerPlayerId)?.money || 0)} ₺ ile pistin kralı
              </p>
              <button
                onClick={onRestartGame}
                className="px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-sm shadow-xl hover:scale-105 transition-transform inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                YENİDEN OYNA
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
