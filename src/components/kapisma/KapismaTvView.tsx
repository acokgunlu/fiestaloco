import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Flag, Play, RotateCcw, Trophy, Users } from 'lucide-react';
import { KapismaGameState, KapismaPlayer } from '../../types/kapisma';
import { PistCanvas } from './PistCanvas';
import { generateTrack, MAX_SPEED } from '../../data/pistLogic';
import { t, withLang } from '../../i18n';
import { T } from '../../i18n/T';

interface Props {
  roomCode: string;
  gameState: KapismaGameState;
  players: KapismaPlayer[];
  onStartGame: () => void;
  onNextRace: () => void;
  onRestartGame: () => void;
  onReturnToHub: () => void;
}

export const KapismaTvView: React.FC<Props> = ({
  roomCode, gameState, players, onStartGame, onNextRace, onRestartGame, onReturnToHub,
}) => {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = withLang(`${window.location.origin}${window.location.pathname}?game=kapisma&room=${roomCode}`);
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [roomCode]);

  const gs = gameState;
  const racing = gs.phase === 'RACING';

  /**
   * KAMERA YOK.
   *
   * Pistin tamamı 1000x620'lik dünya kutusunda ve tuval bu kutunun tamamını
   * gösteriyor. Sonsuz yol sürümünde takip kamerası vardı ve beraberinde bir
   * hata sınıfı getiriyordu: kamera lidere yetişemiyor, sekme arka plana
   * düşünce requestAnimationFrame durduğu için kamera olduğu yerde donuyor ve
   * arabalar ekranın kilometrelerce dışında kalıp hiç çizilmiyordu. Kapalı
   * devrede bunların hiçbiri yok — çizim de PistCanvas'ın kendi döngüsünde.
   *
   * TV yalnızca tohumu biliyor; devreyi kendisi üretiyor.
   */
  const track = useMemo(() => generateTrack(gs.seed), [gs.seed]);
  const lider = gs.cars.length
    ? gs.cars.reduce((a, b) => (b.progress > a.progress ? b : a))
    : null;
  const turBasi = track.points.length;

  const byPos = [...gs.cars].sort((a, b) => a.position - b.position);
  const nameOf = (id: string) => players.find((p) => p.id === id);
  const byScore = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onReturnToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-black cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> {t('Parti Arenası')}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 via-red-500 to-amber-400 text-white flex items-center justify-center text-2xl shadow-md border-2 border-white dark:border-slate-700">🏁</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t('Kapışma')}</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('Yarış {a}/{b} · {c} · {d} tur', {
                  a: gs.currentRace, b: gs.settings.totalRaces, c: t(track.name), d: gs.settings.laps,
                })}
              </p>
            </div>
          </div>
        </div>
        <span className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 font-mono font-black text-2xl tracking-[0.3em] border-2 border-amber-400">
          {roomCode}
        </span>
      </div>

      {gs.phase === 'LOBBY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col items-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">{t('Telefondan Katılın')}</h3>
            {qr ? <img src={qr} alt="QR" className="w-48 h-48 rounded-2xl" />
                : <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-3">
              <T k="Kamerayla okutun veya {host} adresine girip {code} yazın."
                v={{
                  host: <strong className="text-slate-900 dark:text-white">{window.location.host}</strong>,
                  code: <strong className="text-amber-500">{roomCode}</strong>,
                }} />
            </p>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Users className="w-4 h-4" /> {t('Oyuncular ({a})', { a: players.length })}
              </div>
              {players.length === 0 ? (
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 italic py-6 text-center">{t('Bekleniyor…')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <span key={p.id} className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />{p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-900 dark:text-rose-200 space-y-1">
              <p>{t('🏁 Herkes kendi telefonunda GERÇEKTEN araba sürüyor — parmağını kaydırarak direksiyon kırıyor.')}</p>
              <p>{t('🛣️ Pist herkese aynı: tek bir tohumdan üretiliyor, aynı virajlar herkeste.')}</p>
              <p>{t('📺 Bu ekran seyirci ekranı. Sürenler telefonuna, kalan herkes buraya bakar.')}</p>
            </div>
            <button onClick={onStartGame} disabled={players.length < 1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 text-white font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
              <Play className="w-5 h-5" /> {t('BAŞLAT')}
            </button>
          </div>
        </div>
      )}

      {gs.phase === 'COUNTDOWN' && (
        <div className="py-16 text-center space-y-3">
          <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{t('Parmaklar hazır')}</p>
          <div className="text-[10rem] leading-none font-black tabular-nums text-amber-500">{gs.timerSeconds}</div>
        </div>
      )}

      {racing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-2 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-800 shadow-xl">
            <PistCanvas
              seed={gs.seed}
              cars={gs.cars}
              players={players}
              focusPlayerId={lider?.playerId}
            />
          </div>
          <div className="lg:col-span-4 space-y-3">
            <div className="p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t('Sıralama')}</div>
              <div className="space-y-1.5">
                {byPos.map((c) => {
                  const p = nameOf(c.playerId);
                  const toplam = turBasi * gs.settings.laps;
                  const gapPct = Math.min(100, (c.progress / Math.max(1, toplam)) * 100);
                  // Fark, merkez çizgi indeksinden dünya birimine çevriliyor —
                  // "-40" gibi bir sayı oyuncuya indeks olarak hiçbir şey
                  // anlatmaz, mesafe olarak anlatır.
                  const behind = lider
                    ? Math.round(((lider.progress - c.progress) / turBasi) * track.length)
                    : 0;
                  return (
                    <div key={c.playerId} className="px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black flex items-center gap-1.5 min-w-0">
                          <span className="w-4 tabular-nums text-slate-400">{c.position}</span>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p?.color }} />
                          <span className="truncate">{p?.name}</span>
                          {c.finishRank > 0 && <Flag className="w-3 h-3 text-emerald-500" />}
                          {c.offRoad && <span className="text-[10px] text-rose-500 font-black">{t('ÇİMDE')}</span>}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] text-slate-500 dark:text-slate-400">
                          {c.finishRank > 0 ? `${c.finishTime.toFixed(1)}s`
                            : c.position === 1
                              ? t('TUR {a}/{b}', { a: Math.min(c.lap + 1, gs.settings.laps), b: gs.settings.laps })
                              : `-${behind}`}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${gapPct}%`, backgroundColor: p?.color }} />
                      </div>
                      <div className="mt-0.5 text-[9px] font-black tabular-nums text-slate-400">
                        {Math.round((c.speed / MAX_SPEED) * 260)} km/s
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {(gs.phase === 'FINISH' || gs.phase === 'GAME_OVER') && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Flag className="w-4 h-4" /> {t('Yarış sonucu')}
            </div>
            <div className="space-y-1.5">
              {(gs.results || []).map((r) => {
                const p = nameOf(r.playerId);
                const win = (gs.results || [])[0];
                return (
                  <div key={r.playerId} className={`flex items-center justify-between px-3 py-2 rounded-2xl border ${
                    r.rank === 1 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
                    <span className="text-sm font-black flex items-center gap-2 min-w-0">
                      <span className="w-6 tabular-nums text-slate-400">{r.rank}.</span>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p?.color }} />
                      <span className="truncate">{p?.name}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                        {r.rank === 1 ? `${r.time.toFixed(2)}s` : `+${(r.time - win.time).toFixed(2)}`}
                      </span>
                      <span className="font-mono font-black text-sm w-8 text-right">+{r.points}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t('Şampiyona')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {byScore.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-black flex items-center gap-2">
                    {i + 1}. <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}
                  </span>
                  <span className="flex items-center gap-2">
                    {(p.lastPoints || 0) > 0 && <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">+{p.lastPoints}</span>}
                    <span className="font-mono font-black text-sm">{p.score}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {gs.phase === 'FINISH' && (
            <button onClick={onNextRace}
              className="w-full sm:w-auto mx-auto block px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer">
              {t('SONRAKİ YARIŞ →')}
            </button>
          )}
          {gs.phase === 'GAME_OVER' && (
            <div className="text-center space-y-3 py-2">
              <Trophy className="w-12 h-12 mx-auto text-amber-500" />
              <h3 className="text-2xl font-black">{t('{a} kazandı!', { a: nameOf(gs.winnerPlayerId || '')?.name || '' })}</h3>
              <button onClick={onRestartGame}
                className="px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-sm shadow-xl hover:scale-105 transition-transform inline-flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-4 h-4" /> {t('YENİDEN OYNA')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
