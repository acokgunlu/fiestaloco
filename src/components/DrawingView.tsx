import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Stroke, WordPair, GameSettings, Point } from '../types';
import { CanvasBoard } from './CanvasBoard';
import { playTurnSound, playTimerTick, playBuzzer, playGongSound } from '../utils/audio';
import { Clock, Palette, Bot, Paintbrush, RefreshCw, UserCheck, Sparkles } from 'lucide-react';

interface DrawingViewProps {
  players: Player[];
  wordPair: WordPair;
  settings: GameSettings;
  strokes: Stroke[];
  onAddStroke: (stroke: Stroke) => void;
  onDrawingFinished: () => void;
}

export const DrawingView: React.FC<DrawingViewProps> = ({
  players,
  wordPair,
  settings,
  strokes,
  onAddStroke,
  onDrawingFinished,
}) => {
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1); // 1 or 2
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [turnTimerSec, setTurnTimerSec] = useState<number>(settings.drawTimeLimitSec || 30);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showOrderRotatedNotice, setShowOrderRotatedNotice] = useState(false);

  // Compute active drawing order for this cycle so the turn order rotates dynamically!
  // In cycle 1: order is standard [0, 1, 2, 3...]
  // In cycle 2+: order shifts by 1 each cycle so starting drawer changes!
  const getCycleOrder = (cycleNum: number): Player[] => {
    if (players.length <= 1) return players;
    const shift = (cycleNum - 1) % players.length;
    return [...players.slice(shift), ...players.slice(0, shift)];
  };

  const currentCyclePlayers = getCycleOrder(currentRoundNumber);
  const activePlayer = currentCyclePlayers[currentPlayerIndex] || players[0];
  const nextPlayerIndex = (currentPlayerIndex + 1) % currentCyclePlayers.length;
  const isLastPlayerInCycle = currentPlayerIndex === currentCyclePlayers.length - 1;
  const maxRounds = settings.roundsPerPlayer || 2;
  const hasMoreRoundsAfterCycle = currentRoundNumber < maxRounds;
  
  // Next player preview
  const nextCyclePlayers = hasMoreRoundsAfterCycle && isLastPlayerInCycle ? getCycleOrder(currentRoundNumber + 1) : currentCyclePlayers;
  const nextPlayer = isLastPlayerInCycle && !hasMoreRoundsAfterCycle 
    ? null 
    : isLastPlayerInCycle 
    ? nextCyclePlayers[0] 
    : currentCyclePlayers[nextPlayerIndex];

  const totalTurnsInGame = players.length * maxRounds;
  const turnsCompleted = (currentRoundNumber - 1) * players.length + currentPlayerIndex;

  // Turn announcement sound & timer reset
  useEffect(() => {
    playTurnSound();
    setTurnTimerSec(settings.drawTimeLimitSec || 30);
  }, [currentPlayerIndex, currentRoundNumber, settings.drawTimeLimitSec]);

  // Stable callback for advancing turn
  const isAdvancingRef = useRef(false);

  const advanceTurn = useCallback(() => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    if (currentPlayerIndex < currentCyclePlayers.length - 1) {
      setCurrentPlayerIndex((prev) => prev + 1);
    } else {
      // Completed a round cycle
      if (currentRoundNumber < maxRounds) {
        setCurrentRoundNumber((prev) => prev + 1);
        setCurrentPlayerIndex(0);
        setShowOrderRotatedNotice(true);
        setTimeout(() => setShowOrderRotatedNotice(false), 3000);
      } else {
        // All rounds complete! Proceed to discussion
        playGongSound();
        onDrawingFinished();
      }
    }

    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 300);
  }, [currentPlayerIndex, currentCyclePlayers.length, currentRoundNumber, maxRounds, onDrawingFinished]);

  const handleStrokeComplete = (stroke: Stroke) => {
    onAddStroke(stroke);
    advanceTurn();
  };

  const handleSkipOrAutoFinish = useCallback(() => {
    advanceTurn();
  }, [advanceTurn]);

  // AI Bot drawing behavior
  useEffect(() => {
    if (activePlayer?.isBot) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        generateBotStroke();
        setIsBotThinking(false);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [activePlayer?.id, activePlayer?.isBot]);

  const generateBotStroke = () => {
    const startX = 100 + Math.random() * 280;
    const startY = 80 + Math.random() * 200;

    const points: Point[] = [{ x: startX, y: startY }];
    const steps = 14 + Math.floor(Math.random() * 10);

    let curX = startX;
    let curY = startY;
    const angleBase = Math.random() * Math.PI * 2;

    for (let i = 0; i < steps; i++) {
      const angle = angleBase + i * 0.35;
      const dist = 12 + Math.random() * 10;
      curX += Math.cos(angle) * dist;
      curY += Math.sin(angle) * dist;
      const clampedX = Math.max(20, Math.min(460, curX));
      const clampedY = Math.max(20, Math.min(340, curY));
      points.push({ x: clampedX, y: clampedY });
    }

    const botStroke: Stroke = {
      id: `bot-stroke-${Date.now()}`,
      playerId: activePlayer.id,
      points,
      color: activePlayer.color,
      width: 6,
      roundNumber: currentRoundNumber,
      timestamp: Date.now(),
    };

    handleStrokeComplete(botStroke);
  };

  // Turn timer countdown with safe tick interval
  useEffect(() => {
    if (!settings.drawTimeLimitSec || settings.drawTimeLimitSec <= 0) return;

    const interval = setInterval(() => {
      setTurnTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playBuzzer();
          handleSkipOrAutoFinish();
          return 0;
        }
        if (prev <= 5) {
          playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayerIndex, currentRoundNumber, settings.drawTimeLimitSec, handleSkipOrAutoFinish]);

  return (
    <div id="drawing-view" className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Dynamic Rotation Alert Notice */}
      {showOrderRotatedNotice && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3 text-center animate-scale-in flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
          <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
            🔄 Sıra Döndü! {currentRoundNumber}. Çizim Turunda ilk çizen: <strong className="text-indigo-900 dark:text-indigo-200 underline">{activePlayer.name}</strong>
          </span>
        </div>
      )}

      {/* PERSISTENT TURN INDICATOR CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active Drawer (Şu An Çizen) */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white relative shrink-0 ring-4 ring-indigo-500/20 animate-pulse"
              style={{ backgroundColor: activePlayer?.color }}
            >
              <span>{activePlayer?.avatar}</span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900 flex items-center gap-1.5 shadow-xs">
                  <Paintbrush className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Şu An Çizen</span>
                </span>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-xs"
                  style={{ backgroundColor: activePlayer?.color }}
                >
                  {activePlayer?.colorName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-1 flex items-center gap-2">
                <span>{activePlayer?.name}</span>
                {activePlayer?.isBot && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">(AI Bot)</span>}
              </h2>
            </div>
          </div>

          {/* Up Next & Timer */}
          <div className="flex items-center gap-3">
            {/* Up Next Drawer Card */}
            {nextPlayer ? (
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Sıradaki:
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs text-white shadow-xs font-bold"
                    style={{ backgroundColor: nextPlayer.color }}
                  >
                    {nextPlayer.avatar}
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                    {nextPlayer.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-black px-3 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Son Çizgi!</span>
              </div>
            )}

            {/* Turn timer */}
            {settings.drawTimeLimitSec > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-mono font-black text-base border shadow-xs ${
                  turnTimerSec <= 5
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{turnTimerSec}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Rotating Turn Progression Queue */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-black">
                <RefreshCw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Tur {currentRoundNumber} / {maxRounds}</span>
              </span>
              <span>•</span>
              <span>Toplam Çizgi: {turnsCompleted + 1} / {totalTurnsInGame}</span>
            </div>
            {nextPlayer && (
              <span className="sm:hidden text-[11px] text-slate-500 dark:text-slate-400">
                Sırada: <strong className="text-slate-800 dark:text-slate-200">{nextPlayer.name}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {currentCyclePlayers.map((p, idx) => {
              const isCurrent = idx === currentPlayerIndex;
              const isPast = idx < currentPlayerIndex;
              const isNext = idx === nextPlayerIndex;

              return (
                <div
                  key={`${p.id}-${idx}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20 text-indigo-950 font-black shadow-xs'
                      : isPast
                      ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60 text-slate-500 dark:text-slate-400'
                      : isNext
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs truncate max-w-[80px] sm:max-w-[110px]">{p.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white font-black rounded-md animate-pulse">
                      Çiziyor
                    </span>
                  )}
                  {isPast && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">✓</span>}
                  {isNext && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black">Sırada</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bot Thinking State */}
      {isBotThinking && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900 text-xs font-bold flex items-center justify-center gap-2 animate-pulse shadow-xs">
          <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{activePlayer?.name} çizgisini planlıyor...</span>
        </div>
      )}

      {/* Main Collaborative Canvas */}
      <CanvasBoard
        strokes={strokes}
        players={players}
        activePlayer={activePlayer}
        isDrawingEnabled={!activePlayer?.isBot}
        onStrokeComplete={handleStrokeComplete}
        currentRoundNumber={currentRoundNumber}
      />

      {/* Footer tips & pass turn button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            Parmağınızı / farenizi kaldırmadan <strong className="text-slate-900 dark:text-slate-100">1 sürekli çizgi</strong> çizin!
          </span>
        </div>
        <button
          id="btn-skip-stroke"
          onClick={handleSkipOrAutoFinish}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold underline underline-offset-2 ml-2 cursor-pointer transition-colors"
        >
          Sırayı Pas Geç
        </button>
      </div>
    </div>
  );
};
