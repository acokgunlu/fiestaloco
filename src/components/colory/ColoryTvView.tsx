import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Eye, Play, RotateCcw, Trophy, Users } from 'lucide-react';
import { ColoryGameState, ColoryPlayer } from '../../types/colory';
import { hslToHex } from '../../data/coloryLogic';

interface Props {
  roomCode: string;
  gameState: ColoryGameState;
  players: ColoryPlayer[];
  onStartGame: () => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  onReturnToHub: () => void;
}

export const ColoryTvView: React.FC<Props> = ({
  roomCode, gameState, players, onStartGame, onNextRound, onRestartGame, onReturnToHub,
}) => {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?game=colory&room=${roomCode}`;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [roomCode]);

  const target = gameState.target;
  const targetHex = target ? hslToHex(target) : '#334155';
  const byScore = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onReturnToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-black cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Parti Arenası
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-amber-400 to-cyan-400 text-white flex items-center justify-center text-2xl shadow-md border-2 border-white dark:border-slate-700">🎨</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Colory</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Tur {gameState.currentRound}/{gameState.settings.totalRounds} · Rengi hatırla, en yakını bul
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
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Telefondan Katılın</h3>
            {qr ? <img src={qr} alt="QR" className="w-48 h-48 rounded-2xl" />
                : <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-3">
              Kamerayla okutun veya <strong className="text-slate-900 dark:text-white">{window.location.host}</strong> adresine girip <strong className="text-amber-500">{roomCode}</strong> yazın.
            </p>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Users className="w-4 h-4" /> Oyuncular ({players.length})
              </div>
              {players.length === 0 ? (
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 italic py-6 text-center">Bekleniyor…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <span key={p.id} className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black flex items-center gap-1.5">
                      <span>{p.avatar}</span>{p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-900 text-xs font-bold text-fuchsia-900 dark:text-fuchsia-200 space-y-1">
              <p>🎨 Ekranda bir renk {gameState.settings.showSeconds} saniye görünür, sonra kaybolur.</p>
              <p>📱 Telefonunuzdan o rengi hafızanızdan seçin. En yakın tutturan turu alır.</p>
              <p>👁️ Yakınlık göze göre ölçülür (CIE Lab), RGB sayılarına göre değil.</p>
            </div>
            <button onClick={onStartGame} disabled={players.length < 1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 text-white font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
              <Play className="w-5 h-5" /> BAŞLAT
            </button>
          </div>
        </div>
      )}

      {/* RENK GÖSTERİMİ */}
      {gameState.phase === 'SHOWING' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> İYİ BAK
            </p>
            <div className="text-6xl font-black text-slate-900 dark:text-white tabular-nums">{gameState.timerSeconds}</div>
          </div>
          {/*
            Duz div — motion.div DEGIL. Sunucu saniyede bir durum yayinliyor,
            her yayin yeniden render tetikliyordu ve initial={{opacity:0}}
            animasyonu her seferinde bastan basliyordu: renk paneli sürekli
            soluk kaliyor, oyuncu rengi dogru goremiyordu.
          */}
          <div
            className="w-full rounded-[2rem] border-8 border-white dark:border-slate-800 shadow-2xl"
            style={{ backgroundColor: targetHex, height: '46vh' }}
          />
        </div>
      )}

      {/* TAHMİN */}
      {gameState.phase === 'GUESSING' && (
        <div className="space-y-5 py-6">
          <div className="text-center space-y-1">
            <div className="text-6xl font-black text-amber-500 tabular-nums">{gameState.timerSeconds}</div>
            <h3 className="text-2xl font-black">Telefonlardan seçin!</h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Renk kayboldu — hafızanıza güvenin</p>
          </div>
          <div className="w-full rounded-[2rem] border-8 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center" style={{ height: '28vh' }}>
            <span className="text-7xl opacity-30">❓</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => {
              const done = gameState.guessedPlayerIds.includes(p.id);
              return (
                <span key={p.id} className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                  done ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                       : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                  {p.avatar} {p.name} {done ? '✔' : '…'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* SONUÇ */}
      {(gameState.phase === 'REVEAL' || gameState.phase === 'GAME_OVER') && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Doğru renk</p>
              <div className="w-full rounded-3xl border-8 border-white dark:border-slate-800 shadow-2xl" style={{ backgroundColor: targetHex, height: '22vh' }} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Tahminler — en yakından uzağa</p>
              <div className="grid grid-cols-2 gap-2">
                <AnimatePresence>
                  {(gameState.results || []).map((g) => {
                    const p = players.find((x) => x.id === g.playerId);
                    return (
                      <motion.div key={g.playerId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-700 shadow shrink-0" style={{ backgroundColor: hslToHex(g.hsl) }} />
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{g.rank}. {p?.name}</div>
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">ΔE {g.deltaE} · +{g.points}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Toplam</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {byScore.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black">{i + 1}. {p.avatar} {p.name}</span>
                  <span className="flex items-center gap-2">
                    {(p.lastPoints || 0) > 0 && <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">+{p.lastPoints}</span>}
                    <span className="font-mono font-black text-sm">{p.score}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {gameState.phase === 'REVEAL' && (
            <button onClick={onNextRound}
              className="w-full sm:w-auto mx-auto block px-10 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-black shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer">
              SONRAKİ TUR →
            </button>
          )}
          {gameState.phase === 'GAME_OVER' && (
            <div className="text-center space-y-3 py-2">
              <Trophy className="w-12 h-12 mx-auto text-amber-500" />
              <h3 className="text-2xl font-black">{players.find((p) => p.id === gameState.winnerPlayerId)?.name} kazandı!</h3>
              <button onClick={onRestartGame}
                className="px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-sm shadow-xl hover:scale-105 transition-transform inline-flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-4 h-4" /> YENİDEN OYNA
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
