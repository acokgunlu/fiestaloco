import React, { useState, useEffect } from 'react';
import { Player, Stroke, WordPair, GameSettings } from '../types';
import { CanvasBoard } from './CanvasBoard';
import { MessageSquare, Clock, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { playClickSound, playTimerTick, playBuzzer, playTurnSound } from '../utils/audio';

import { t } from '../i18n';
interface DiscussionViewProps {
  players: Player[];
  strokes: Stroke[];
  wordPair: WordPair;
  settings: GameSettings;
  onProceedToVoting: () => void;
}

export const DiscussionView: React.FC<DiscussionViewProps> = ({
  players,
  strokes,
  wordPair,
  settings,
  onProceedToVoting,
}) => {
  const [highlightPlayerId, setHighlightPlayerId] = useState<string | null>(null);
  const [timerSec, setTimerSec] = useState<number>(settings.discussionTimeSec || 60);

  // Discussion countdown timer
  useEffect(() => {
    if (settings.discussionTimeSec === 0) return;

    const interval = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          playBuzzer();
          return 0;
        }
        if (prev <= 5) {
          playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.discussionTimeSec]);

  const toggleHighlight = (playerId: string) => {
    playClickSound();
    setHighlightPlayerId((prev) => (prev === playerId ? null : playerId));
  };

  return (
    <div id="discussion-view" className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg text-slate-900 dark:text-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-black mb-1.5 shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('Tartışma & İnceleme Aşaması')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t('Sahtekâr Kim? Çizgileri İnceleyin!')}</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {t('Kimin çizgisi anlamsız veya uyumsuz görünüyor? Oyuncuların çizgilerini vurgulamak için alttaki butonlara tıklayın.')}</p>
        </div>

        {/* Timer */}
        {settings.discussionTimeSec > 0 && (
          <div
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-mono font-black text-sm border shadow-xs ${
              timerSec <= 10
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{timerSec}s</span>
          </div>
        )}
      </div>

      {/* Main Canvas with Replay & Inspection */}
      <CanvasBoard
        strokes={strokes}
        players={players}
        isDrawingEnabled={false}
        highlightPlayerId={highlightPlayerId}
        showAttribution={true}
        allowReplay={true}
      />

      {/* Player Stroke Filter Buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('Çizgi Analizi (Vurgulamak için seçin):')}</span>
          </div>
          {highlightPlayerId && (
            <button
              onClick={() => setHighlightPlayerId(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold cursor-pointer"
            >
              {t('Tüm Çizgileri Göster')}</button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {players.map((player) => {
            const isSelected = highlightPlayerId === player.id;
            const playerStrokeCount = strokes.filter((s) => s.playerId === player.id).length;

            return (
              <button
                key={player.id}
                id={`inspect-player-${player.id}`}
                onClick={() => toggleHighlight(player.id)}
                className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs shadow-xs border border-white shrink-0"
                  style={{ backgroundColor: player.color }}
                >
                  <span>{player.avatar}</span>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{player.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    {t('{a} çizgi', { a: playerStrokeCount })}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action to proceed to voting */}
      <div className="pt-2 flex justify-center">
        <button
          id="btn-proceed-voting"
          onClick={() => {
            playTurnSound();
            onProceedToVoting();
          }}
          className="w-full sm:w-auto min-w-[300px] px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-base font-black rounded-2xl shadow-2xl shadow-rose-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>{t('SAHTEKÂR OYLAMASINA GEÇ (VOTE)')}</span>
        </button>
      </div>
    </div>
  );
};
