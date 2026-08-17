import React, { useState, useEffect } from 'react';
import { Player, Stroke, WordPair, GameSettings } from '../types';
import { CanvasBoard } from './CanvasBoard';
import { MessageSquare, Clock, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { playClickSound, playTimerTick, playBuzzer, playTurnSound } from '../utils/audio';

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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-lg text-slate-900">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black mb-1.5 shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tartışma & İnceleme Aşaması</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sahtekâr Kim? Çizgileri İnceleyin!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Kimin çizgisi anlamsız veya uyumsuz görünüyor? Oyuncuların çizgilerini vurgulamak için alttaki butonlara tıklayın.
          </p>
        </div>

        {/* Timer */}
        {settings.discussionTimeSec > 0 && (
          <div
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-mono font-black text-sm border shadow-xs ${
              timerSec <= 10
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800'
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
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Çizgi Analizi (Vurgulamak için seçin):</span>
          </div>
          {highlightPlayerId && (
            <button
              onClick={() => setHighlightPlayerId(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Tüm Çizgileri Göster
            </button>
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
                    ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs shadow-xs border border-white shrink-0"
                  style={{ backgroundColor: player.color }}
                >
                  <span>{player.avatar}</span>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{player.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {playerStrokeCount} çizgi
                  </div>
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
          <span>SAHTEKÂR OYLAMASINA GEÇ (VOTE)</span>
        </button>
      </div>
    </div>
  );
};
