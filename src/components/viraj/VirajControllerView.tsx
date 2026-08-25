import React from 'react';
import { AlertTriangle, Copy, Flag, LogOut, Play, RotateCcw, Users } from 'lucide-react';
import { VirajGameState, VirajLine, VirajPlayer } from '../../types/viraj';
import { VirajTrackView } from './VirajTrackView';
import { t, withLang } from '../../i18n';

interface Props {
  roomCode: string;
  myPlayer: VirajPlayer | null;
  myLine: VirajLine | null;
  gameState: VirajGameState;
  players: VirajPlayer[];
  trackPath: string;
  errorMessage?: string | null;
  onPickLine: (line: VirajLine) => void;
  onLeave: () => void;
  /** TV YOK modu: bu telefon odayı kurdu, kontroller onda. */
  hostControls?: boolean;
  onStartGame?: () => void;
  onNextRace?: () => void;
  onRestartGame?: () => void;
}

const LINES: Array<{ id: VirajLine; icon: string; label: string; sub: string; cls: string }> = [
  { id: 'SAFE',   icon: '🛡️', label: 'Güvenli',       sub: 'yavaş ama soğutur',  cls: 'from-emerald-500 to-teal-600 border-emerald-300 dark:border-emerald-800' },
  { id: 'NORMAL', icon: '➡️', label: 'Normal',        sub: 'ne kazanç ne kayıp', cls: 'from-slate-500 to-slate-700 border-slate-300 dark:border-slate-700' },
  { id: 'ATTACK', icon: '⚔️', label: 'Dibine kadar',  sub: 'hızlı ama ısıtır',   cls: 'from-rose-500 to-red-700 border-rose-300 dark:border-rose-900' },
];

export const VirajControllerView: React.FC<Props> = ({
  roomCode, myPlayer, myLine, gameState, players, trackPath, errorMessage,
  onPickLine, onLeave, hostControls = false, onStartGame, onNextRace, onRestartGame,
}) => {
  const gs = gameState;
  const myCar = gs.cars.find((c) => c.playerId === myPlayer?.id);
  const leader = gs.cars.length ? Math.min(...gs.cars.map((c) => c.elapsed)) : 0;
  const byScore = [...players].sort((a, b) => b.score - a.score);
  const shareUrl = typeof window === 'undefined'
    ? ''
    : withLang(`${window.location.origin}${window.location.pathname}?game=viraj&room=${roomCode}`);

  /** Isıya göre uyarı — kararın tek gerçek girdisi bu. */
  const heat = myCar?.heat ?? 0;
  const heatColor = heat > 70 ? 'text-rose-600 dark:text-rose-400' : heat > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="w-full max-w-md mx-auto px-3 py-4 space-y-3 text-slate-900 dark:text-slate-100 animate-fade-in">
      <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg text-white" style={{ backgroundColor: myPlayer?.color || '#ef4444' }}>🏎️</div>
          <div>
            <div className="font-black text-sm truncate max-w-[130px]">{myPlayer?.name}</div>
            <div className="text-xs font-mono font-black text-rose-700 dark:text-rose-400">{t('{a} puan', { a: myPlayer?.score || 0 })}</div>
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

      {gs.phase === 'LOBBY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-4xl">🏎️</div>
          {hostControls ? (
            <>
              <h3 className="text-lg font-black">{t('Oda hazır — arkadaşlarını çağır')}</h3>
              <div className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-950 border-2 border-amber-400">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">{t('ODA KODU')}</p>
                <p className="font-mono font-black text-3xl tracking-[0.3em] text-white">{roomCode}</p>
              </div>
              <button onClick={() => { try { navigator.clipboard?.writeText(shareUrl); } catch { /* izin yok */ } }}
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black flex items-center justify-center gap-2 cursor-pointer">
                <Copy className="w-3.5 h-3.5" /> {t('Bağlantıyı Kopyala')}
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-black">{t('Hazırsın!')}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Odayı kuranın başlatması bekleniyor…')}</p>
            </>
          )}

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" /> {t('Oyuncular ({a})', { a: players.length })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {players.map((p) => (
                <span key={p.id} className="px-2.5 py-1 rounded-xl text-xs font-black border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-left text-xs space-y-1 font-medium text-rose-900 dark:text-rose-200">
            <p>{t('1️⃣ Her virajda üç çizgiden birini seç — herkes aynı anda, gizlice.')}</p>
            <p>{t('2️⃣ Saldırmak hızlandırır ama lastikleri ısıtır.')}</p>
            <p>{t('3️⃣ Isı yükseldikçe hata ihtimali hızla büyür. Ne zaman soğutacağın sana kalmış.')}</p>
          </div>

          {hostControls && (
            <button onClick={onStartGame} disabled={players.length < 1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white font-black text-base shadow-xl active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
              <Play className="w-5 h-5" /> {t('BAŞLAT')}
            </button>
          )}
        </div>
      )}

      {gs.phase === 'GRID' && (
        <div className="py-10 text-center space-y-2 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 shadow-lg">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{t('Başlangıç ızgarası')}</p>
          <h3 className="text-2xl font-black">{gs.trackName}</h3>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('{a} viraj · {b} tur', { a: gs.cornerCount, b: gs.settings.laps })}
          </p>
          <div className="text-5xl font-black text-amber-500 tabular-nums">{gs.timerSeconds}</div>
        </div>
      )}

      {/*
        Yaris SIRASINDA katilan oyuncunun bu yarista arabasi yok — sunucu
        ortadan araba eklemiyor (siralamayi ve isi ekonomisini bozardi).
        Ona ayri bir ekran gosteriliyor; yoksa asagidaki `myCar?.lastMistake
        !== 'NONE'` kontrolu undefined icin DOGRU donuyor ve adam hic
        yarismadigi halde "Disari tastin!" mesaji aliyordu.
      */}
      {(gs.phase === 'CORNER' || gs.phase === 'RESOLVE') && !myCar && (
        <div className="p-8 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-center space-y-2">
          <p className="text-4xl">🏁</p>
          <p className="text-lg font-black">{t('Yarış sürüyor')}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Sonraki yarıştan itibaren pistesin.')}</p>
        </div>
      )}

      {(gs.phase === 'CORNER' || gs.phase === 'RESOLVE') && myCar && (
        <div className="space-y-3">
          {/* Isı + konum — kararın iki girdisi, en üstte */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('Lastik ısısı')}</p>
              <p className={`text-3xl font-black tabular-nums ${heatColor}`}>{Math.round(heat)}</p>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${heat}%`,
                  backgroundColor: heat > 70 ? '#ef4444' : heat > 40 ? '#f59e0b' : '#22c55e',
                }} />
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('Sıran')}</p>
              <p className="text-3xl font-black tabular-nums">{myCar?.position || '—'}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                {myCar && myCar.position === 1 ? t('lider') : myCar ? `+${(myCar.elapsed - leader).toFixed(2)}` : ''}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800">
            <VirajTrackView path={trackPath} cars={gs.cars} players={players} highlightPlayerId={myPlayer?.id} compact />
          </div>

          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('Viraj {a}/{b}', { a: gs.cornerIndex, b: gs.cornerCount })} · {t('Tur {a}/{b}', { a: gs.lap, b: gs.settings.laps })}
            </p>
            <h3 className="text-xl font-black">{t(gs.cornerLabel)}</h3>
          </div>

          {gs.phase === 'CORNER' ? (
            myLine ? (
              <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-800 text-center space-y-1">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">{t('SEÇİMİN ALINDI')}</p>
                <p className="text-3xl">{LINES.find((l) => l.id === myLine)?.icon}</p>
                <p className="text-sm font-black">{t(LINES.find((l) => l.id === myLine)?.label || '')}</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t('Diğerleri bekleniyor…')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {LINES.map((l) => (
                  <button key={l.id} onClick={() => onPickLine(l.id)}
                    className={`w-full py-4 px-4 rounded-2xl bg-gradient-to-r ${l.cls} text-white font-black shadow-lg active:scale-95 transition-transform border-2 cursor-pointer flex items-center justify-between`}>
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">{l.icon}</span>
                      <span className="text-left">
                        <span className="block text-base">{t(l.label)}</span>
                        <span className="block text-[11px] font-bold opacity-80">{t(l.sub)}</span>
                      </span>
                    </span>
                    <span className="text-2xl font-black tabular-nums opacity-70">{gs.timerSeconds}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className={`p-5 rounded-3xl border-2 text-center space-y-1 ${
              myCar.lastMistake !== 'NONE'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
              <p className="text-3xl">{myCar.line ? LINES.find((l) => l.id === myCar.line)?.icon : '➡️'}</p>
              {myCar.lastMistake !== 'NONE' ? (
                <>
                  <p className="text-lg font-black text-rose-700 dark:text-rose-300">
                    {t(myCar.lastMistake === 'OFF' ? 'Çakıla düştün!' : myCar.lastMistake === 'LOCKUP' ? 'Tekerlek kilitledin!' : 'Dışarı taştın!')}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Isı yükselmişti — risk buydu.')}</p>
                </>
              ) : (
                <p className="text-lg font-black">{t('Temiz viraj')}{myCar.lastTow ? ' 💨' : ''}</p>
              )}
            </div>
          )}
        </div>
      )}

      {(gs.phase === 'FINISH' || gs.phase === 'GAME_OVER') && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <Flag className="w-8 h-8 mx-auto text-slate-400" />
          {(() => {
            const mine = (gs.results || []).find((r) => r.playerId === myPlayer?.id);
            if (!mine) return <p className="text-sm font-black text-slate-500">{t('Bu yarışta yoktun')}</p>;
            return (
              <>
                <p className="text-4xl font-black tabular-nums">{t('{a}.', { a: mine.rank })}</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{mine.points}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">{mine.totalTime.toFixed(2)}s</p>
              </>
            );
          })()}

          <div className="pt-1 space-y-1 text-left">
            {byScore.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black ${
                p.id === myPlayer?.id ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <span className="flex items-center gap-1.5">{i + 1}. <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}</span>
                <span className="font-mono">{p.score}</span>
              </div>
            ))}
          </div>

          {hostControls && gs.phase === 'FINISH' && (
            <button onClick={onNextRace}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black shadow-lg active:scale-95 transition-transform cursor-pointer">
              {t('SONRAKİ YARIŞ →')}
            </button>
          )}
          {hostControls && gs.phase === 'GAME_OVER' && (
            <button onClick={onRestartGame}
              className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-sm shadow-lg active:scale-95 transition-transform inline-flex items-center justify-center gap-2 cursor-pointer">
              <RotateCcw className="w-4 h-4" /> {t('YENİDEN OYNA')}
            </button>
          )}
          {gs.phase === 'GAME_OVER' && gs.winnerPlayerId === myPlayer?.id && (
            <p className="text-sm font-black text-amber-500">{t('🏆 Şampiyon sensin!')}</p>
          )}
        </div>
      )}
    </div>
  );
};
