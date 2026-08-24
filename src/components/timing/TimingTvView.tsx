import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Play, RotateCcw, Target, Trophy, Users } from 'lucide-react';
import { TimingGameState, TimingPlayer } from '../../types/timing';
import { formatError, formatSec, modeHint, modeLabel } from '../../data/timingLogic';
import { TimingTimeline } from './TimingTimeline';

interface Props {
  roomCode: string;
  gameState: TimingGameState;
  players: TimingPlayer[];
  onStartGame: () => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  onReturnToHub: () => void;
}

export const TimingTvView: React.FC<Props> = ({
  roomCode, gameState, players, onStartGame, onNextRound, onRestartGame, onReturnToHub,
}) => {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?game=timing&room=${roomCode}`;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [roomCode]);

  const byScore = [...players].sort((a, b) => b.score - a.score);
  const isNoOver = gameState.mode === 'NO_OVER';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onReturnToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-black cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Parti Arenası
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white flex items-center justify-center text-2xl shadow-md border-2 border-white dark:border-slate-700">⏱️</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Tam Zamanında</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Tur {gameState.currentRound}/{gameState.settings.totalRounds} · İçinden say, tam vaktinde bas
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
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs font-bold text-sky-900 dark:text-sky-200 space-y-1">
              <p>⏱️ Her turda bir hedef süre açıklanır — örneğin "tam 10 saniye".</p>
              <p>🚫 Sonra ekranda hiçbir sayaç YOK. Kafandan sayacaksın.</p>
              <p>📱 Süre dolduğunu düşündüğün an telefondaki büyük butona bas.</p>
              <p>🌐 Ağ gecikmen süreden otomatik düşülür — yavaş bağlantı ceza değil.</p>
            </div>
            <button onClick={onStartGame} disabled={players.length < 1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
              <Play className="w-5 h-5" /> BAŞLAT
            </button>
          </div>
        </div>
      )}

      {/* TUR BRİFİNGİ */}
      {gameState.phase === 'BRIEFING' && (
        <div className="py-10 text-center space-y-6">
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-black border-2 ${
            isNoOver
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-400'
              : 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-400'}`}>
            <Target className="w-4 h-4" /> {modeLabel(gameState.mode)} MODU
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Bu turun hedefi</p>
            <div className="text-[7rem] leading-none font-black tabular-nums bg-gradient-to-b from-sky-500 to-indigo-600 bg-clip-text text-transparent">
              {formatSec(gameState.targetMs, 0)}
            </div>
            <p className="text-2xl font-black text-slate-700 dark:text-slate-300 -mt-2">SANİYE</p>
          </div>
          <p className="text-base font-bold text-slate-600 dark:text-slate-300 max-w-xl mx-auto">{modeHint(gameState.mode)}</p>
          <div className="text-4xl font-black text-slate-400 dark:text-slate-500 tabular-nums">{gameState.timerSeconds}</div>
        </div>
      )}

      {/* GERİ SAYIM */}
      {gameState.phase === 'COUNTDOWN' && (
        <div className="py-16 text-center space-y-4">
          <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Hazır ol</p>
          <div className="text-[12rem] leading-none font-black tabular-nums text-amber-500">{gameState.timerSeconds}</div>
          <p className="text-xl font-black text-slate-600 dark:text-slate-300">
            Hedef {formatSec(gameState.targetMs, 0)} saniye · {modeLabel(gameState.mode)}
          </p>
        </div>
      )}

      {/*
        SAYIM (RUNNING)
        =====================================================================
        BU EKRANDA HAREKET EDEN HİÇBİR ŞEY OLMAMALI.
        Nabız gibi atan bir halka, dönen bir çark, ilerleyen bir çubuk —
        hepsinin bir PERİYODU vardır ve oyuncu o periyodu sayarak süreyi
        ölçer. O anda ölçtüğümüz şey zaman hissi olmaktan çıkar, oyun biter.
        Aynı sebeple "kaç kişi bastı" da gösterilmez: sunucu RUNNING boyunca
        basış bilgisini yaymıyor.
      */}
      {gameState.phase === 'RUNNING' && (
        <div className="py-14 text-center space-y-8">
          <div className="inline-block px-8 py-3 rounded-3xl bg-slate-900 dark:bg-slate-950 border-4 border-amber-400">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-400">Hedef</p>
            <div className="text-6xl font-black tabular-nums text-white">
              {formatSec(gameState.targetMs, 0)}<span className="text-2xl text-slate-400 ml-1">sn</span>
            </div>
          </div>
          <div>
            <h3 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white">SAY</h3>
            <p className="text-lg font-bold text-slate-500 dark:text-slate-400 mt-3">
              {isNoOver ? 'Geçersen yanarsın — erken kal.' : 'Vakti geldiğini düşündüğünde bas.'}
            </p>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600">
            Ekranda sayaç yok · saatine bakmak yok
          </p>
        </div>
      )}

      {/* SONUÇ */}
      {(gameState.phase === 'REVEAL' || gameState.phase === 'GAME_OVER') && (
        <div className="space-y-5">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 pb-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tur {gameState.currentRound} · {modeLabel(gameState.mode)} {formatSec(gameState.targetMs, 0)} sn
              </span>
              {(gameState.results || []).length > 0 && (
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {(() => {
                    const w = (gameState.results || []).find((r) => r.rank === 1);
                    if (!w) return 'Herkes yandı — bu turda puan yok';
                    const p = players.find((x) => x.id === w.playerId);
                    return `🥇 ${p?.name} · ${formatError(w.errorMs)}`;
                  })()}
                </span>
              )}
            </div>
            <TimingTimeline
              targetMs={gameState.targetMs}
              results={gameState.results || []}
              players={players}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Bu tur</div>
              <div className="space-y-1.5">
                {(gameState.results || []).map((r) => {
                  const p = players.find((x) => x.id === r.playerId);
                  return (
                    <div key={r.playerId} className={`flex items-center justify-between px-3 py-2 rounded-2xl border ${
                      r.burned ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900'
                               : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
                      <span className="text-sm font-black flex items-center gap-2 min-w-0">
                        <span className="w-5 text-slate-400 tabular-nums">{r.rank || '—'}</span>
                        <span>{p?.avatar}</span>
                        <span className="truncate">{p?.name}</span>
                      </span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                          {formatSec(r.elapsedMs)} sn
                        </span>
                        <span className={`text-xs font-black ${r.burned ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {r.burned ? 'YANDI' : formatError(r.errorMs)}
                        </span>
                        <span className="font-mono font-black text-sm w-10 text-right">+{r.points}</span>
                      </span>
                    </div>
                  );
                })}
                {players.filter((p) => !(gameState.results || []).some((r) => r.playerId === p.id)).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 opacity-60">
                    <span className="text-sm font-black">{p.avatar} {p.name}</span>
                    <span className="text-xs font-black text-slate-500">HİÇ BASMADI · +0</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Toplam</div>
              <div className="space-y-1.5">
                {byScore.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-black">{i + 1}. {p.avatar} {p.name}</span>
                    <span className="flex items-center gap-2">
                      {p.bestErrorMs !== undefined && (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">en iyi {formatSec(p.bestErrorMs)}</span>
                      )}
                      {(p.lastPoints || 0) > 0 && <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">+{p.lastPoints}</span>}
                      <span className="font-mono font-black text-sm">{p.score}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {gameState.phase === 'REVEAL' && (
            <button onClick={onNextRound}
              className="w-full sm:w-auto mx-auto block px-10 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-violet-600 text-white font-black shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer">
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
