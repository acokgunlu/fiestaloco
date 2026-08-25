import React, { useEffect } from 'react';
import { AlertTriangle, Check, LogOut, Target } from 'lucide-react';
import { TimingGameState, TimingPlayer } from '../../types/timing';
import { formatError, formatSec, modeHint, modeLabel } from '../../data/timingLogic';
import { TimingTimeline } from './TimingTimeline';

import { t } from '../../i18n';
interface Props {
  roomCode: string;
  myPlayer: TimingPlayer | null;
  myPressed: boolean;
  gameState: TimingGameState;
  players: TimingPlayer[];
  errorMessage?: string | null;
  onPress: () => void;
  onLeave: () => void;
}

export const TimingControllerView: React.FC<Props> = ({
  roomCode, myPlayer, myPressed, gameState, players, errorMessage, onPress, onLeave,
}) => {
  const isNoOver = gameState.mode === 'NO_OVER';
  const myResult = gameState.results?.find((r) => r.playerId === myPlayer?.id);
  const byScore = [...players].sort((a, b) => b.score - a.score);
  const inRound = !myPlayer || gameState.activePlayerIds.length === 0
    ? true
    : gameState.activePlayerIds.includes(myPlayer.id);

  /**
   * Başlangıç işareti olarak titreşim.
   * Ekran güncellemesinden farklı olarak dokunma anlıktır; oyuncunun süreyi
   * hangi ana göre saydığı netleşir ve ölçüm tutarlı olur. Tek seferlik —
   * periyodik bir titreşim metronom olurdu.
   */
  useEffect(() => {
    if (gameState.phase !== 'RUNNING') return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(70);
      }
    } catch {
      /* tarayici desteklemiyor */
    }
  }, [gameState.phase, gameState.currentRound]);

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4 space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in">
      <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white" style={{ backgroundColor: myPlayer?.color || '#0ea5e9' }}>
            {myPlayer?.avatar || '⏱️'}
          </div>
          <div>
            <div className="font-black text-sm truncate max-w-[140px]">{myPlayer?.name}</div>
            <div className="text-xs font-mono font-black text-sky-700 dark:text-sky-400">{t('{a} puan', { a: myPlayer?.score || 0 })}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">{roomCode}</span>
          <button onClick={onLeave} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black">
          <AlertTriangle className="w-4 h-4 shrink-0" />{t(errorMessage)}
        </div>
      )}

      {gameState.phase === 'LOBBY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-4xl">⏱️</div>
          <h3 className="text-lg font-black">{t('Hazırsın!')}</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('TV ekranından başlaması bekleniyor…')}</p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1 font-medium text-slate-600 dark:text-slate-300">
            <p>{t('1️⃣ Bir hedef süre açıklanır — "tam 10 saniye" gibi.')}</p>
            <p>{t('2️⃣ Geri sayım biter, telefon titrer. Hiçbir yerde sayaç YOK.')}</p>
            <p>{t('3️⃣ Vakti geldi dediğin an butona bas. En yakın basan turu alır.')}</p>
            <p className="text-slate-400 dark:text-slate-500">{t('Ağ gecikmen otomatik düşülür — yavaş bağlantı ceza değil.')}</p>
          </div>
        </div>
      )}

      {gameState.phase === 'BRIEFING' && (
        <div className={`p-6 rounded-3xl border-2 shadow-lg text-center space-y-3 ${
          isNoOver ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                   : 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-800'}`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 dark:bg-slate-950 text-amber-400 text-[11px] font-black">
            <Target className="w-3.5 h-3.5" /> {t('{a} MODU', { a: modeLabel(gameState.mode) })}</div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('Hedef')}</p>
            <div className="text-6xl font-black tabular-nums text-sky-600 dark:text-sky-400">{formatSec(gameState.targetMs, 0)}</div>
            <p className="text-sm font-black text-slate-600 dark:text-slate-300">{t('SANİYE')}</p>
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{modeHint(gameState.mode)}</p>
          <div className="text-2xl font-black text-slate-400 tabular-nums">{gameState.timerSeconds}</div>
        </div>
      )}

      {gameState.phase === 'COUNTDOWN' && (
        <div className="py-12 text-center space-y-2 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{t('Hazır ol')}</p>
          <div className="text-8xl font-black tabular-nums text-amber-500">{gameState.timerSeconds}</div>
          <p className="text-sm font-black text-slate-600 dark:text-slate-300">
            {t('{a} saniye · {b}', { a: formatSec(gameState.targetMs, 0), b: modeLabel(gameState.mode) })}</p>
        </div>
      )}

      {/*
        SAYIM — telefonda da hareketli/periyodik hiçbir şey yok.
        Basıldıktan sonra süre GÖSTERİLMEZ: oyuncu telefonunu yanındakine
        gösterip "şu an 9,4 saniye" diye tüyo veremesin diye.
      */}
      {gameState.phase === 'RUNNING' && (
        <div className="space-y-3">
          {!inRound ? (
            <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-center space-y-2">
              <p className="text-lg font-black">{t('Bu tura yetişemedin')}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Sonraki turdan itibaren oynuyorsun.')}</p>
            </div>
          ) : myPressed ? (
            <div className="p-10 rounded-[2rem] bg-emerald-50 dark:bg-emerald-950/50 border-4 border-emerald-400 dark:border-emerald-700 text-center space-y-3">
              <Check className="w-14 h-14 mx-auto text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
              <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{t('KİLİTLENDİ')}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('Süren turun sonunda açıklanacak. Kimseye tüyo verme.')}</p>
            </div>
          ) : (
            <>
              <button
                onClick={onPress}
                className={`w-full rounded-[2rem] text-white font-black shadow-2xl active:scale-95 cursor-pointer border-4 ${
                  isNoOver
                    ? 'bg-gradient-to-b from-rose-500 to-rose-700 border-rose-300 dark:border-rose-900'
                    : 'bg-gradient-to-b from-sky-500 to-indigo-700 border-sky-300 dark:border-sky-900'}`}
                style={{ height: '46vh', minHeight: 260 }}
              >
                <span className="block text-6xl">{t('ŞİMDİ')}</span>
                <span className="block text-sm font-bold opacity-80 mt-3 tabular-nums">
                  {t('hedef {a} sn', { a: formatSec(gameState.targetMs, 0) })}</span>
              </button>
              <p className="text-center text-xs font-black text-slate-500 dark:text-slate-400">
                {isNoOver ? t('🚫 Geçersen yanarsın — erken kal.') : t('Vakti geldiğinde bas.')}
              </p>
            </>
          )}
        </div>
      )}

      {(gameState.phase === 'REVEAL' || gameState.phase === 'GAME_OVER') && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          {myResult ? (
            <>
              <div className="space-y-0.5">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('Senin süren')}</p>
                <div className={`text-5xl font-black tabular-nums ${myResult.burned ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                  {formatSec(myResult.elapsedMs)}
                </div>
                <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                  {myResult.burned ? t('YANDIN — hedefi geçtin') : formatError(myResult.errorMs)}
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-1">
                <span className="text-lg font-black">{myResult.rank ? `${myResult.rank}. sıra` : t('sıralama dışı')}</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">+{myResult.points}</span>
              </div>
              {myResult.latencyMs > 0 && (
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {t('ham ölçüm {a} · ağ gecikmesi {b} ms düşüldü', { a: formatSec(myResult.rawMs), b: myResult.latencyMs })}</p>
              )}
            </>
          ) : (
            <p className="text-sm font-black text-slate-500 dark:text-slate-400">{t('Bu turda basmadın · +0')}</p>
          )}

          {(gameState.results || []).length > 1 && (
            <div className="-mx-3">
              <TimingTimeline
                targetMs={gameState.targetMs}
                results={gameState.results || []}
                players={players}
                highlightPlayerId={myPlayer?.id}
                compact
              />
            </div>
          )}

          <div className="pt-1 space-y-1 text-left">
            {byScore.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black ${
                p.id === myPlayer?.id ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <span>{i + 1}. {p.avatar} {p.name}</span>
                <span className="font-mono">{p.score}</span>
              </div>
            ))}
          </div>

          {gameState.phase === 'GAME_OVER' && gameState.winnerPlayerId === myPlayer?.id && (
            <p className="text-sm font-black text-amber-500">{t('🏆 Zaman senin işine bakıyor!')}</p>
          )}
        </div>
      )}
    </div>
  );
};
