import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Stroke, Player, LiveStrokeState } from '../types';
import { playStrokeStartSound, playStrokeEndSound, playPopSound } from '../utils/audio';
import {
  RotateCcw,
  Check,
  Download,
  Play,
  Pause,
  Radio,
  Sparkles,
  FastForward,
  Paintbrush,
  Zap,
  Sliders,
} from 'lucide-react';
import { LiveReactionsOverlay } from './LiveReactionsOverlay';

import { t } from '../i18n';
interface CanvasBoardProps {
  strokes: Stroke[];
  players: Player[];
  activePlayer?: Player;
  isDrawingEnabled?: boolean;
  onStrokeComplete?: (stroke: Stroke) => void;
  onLivePointsUpdate?: (points: Point[]) => void;
  liveRemoteStroke?: LiveStrokeState | null;
  currentRoundNumber?: number;
  highlightPlayerId?: string | null;
  showAttribution?: boolean;
  className?: string;
  allowReplay?: boolean;
  allowReactions?: boolean;
  onSendReaction?: (emoji: string) => void;
}

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 600;

export type BrushStyle = 'classic' | 'neon' | 'felt';

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  strokes,
  players,
  activePlayer,
  isDrawingEnabled = false,
  onStrokeComplete,
  onLivePointsUpdate,
  liveRemoteStroke,
  currentRoundNumber = 1,
  highlightPlayerId,
  showAttribution = false,
  className = '',
  allowReplay = false,
  allowReactions = true,
  onSendReaction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [strokeFinished, setStrokeFinished] = useState(false);

  // Brush settings
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('classic');
  const [strokeThickness, setStrokeThickness] = useState<number>(7);

  // Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStrokeIndex, setReplayStrokeIndex] = useState<number>(strokes.length);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 1x, 2x, 4x
  const replayTimerRef = useRef<number | null>(null);

  // Cleanly reset transient drawing and replay states when active player or drawing state changes
  useEffect(() => {
    setCurrentPoints([]);
    setStrokeFinished(false);
    setIsPointerDown(false);
  }, [activePlayer?.id, currentRoundNumber, isDrawingEnabled]);

  useEffect(() => {
    if (strokes.length === 0) {
      setIsReplaying(false);
      setReplayStrokeIndex(0);
      setCurrentPoints([]);
      setStrokeFinished(false);
      setIsPointerDown(false);
    } else {
      setReplayStrokeIndex(strokes.length);
    }
  }, [strokes.length]);

  // Clean up replay timer on unmount
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
      }
    };
  }, []);

  // Resize canvas according to container
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
      redrawAll();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [updateCanvasSize]);

  // Helper to draw smooth stroke with different brush effects
  const drawStrokePath = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    width: number,
    isDimmed: boolean = false,
    isHighlighted: boolean = false,
    isLive: boolean = false,
    style: BrushStyle = 'classic'
  ) => {
    if (!points || points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    if (isDimmed) {
      ctx.globalAlpha = 0.12;
    } else if (isHighlighted) {
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.lineWidth = width + 4;
    } else if (isLive) {
      ctx.globalAlpha = 0.98;
      if (style === 'neon') {
        ctx.shadowColor = color;
        ctx.shadowBlur = 22;
        ctx.lineWidth = width + 3;
      } else {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }
    } else {
      if (style === 'neon') {
        ctx.globalAlpha = 0.95;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
      } else if (style === 'felt') {
        ctx.globalAlpha = 0.88;
        ctx.lineWidth = width + 2;
      } else {
        ctx.globalAlpha = 0.95;
      }
    }

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length > 1) {
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    }

    ctx.stroke();

    // If Neon style, draw a white core inner highlight for 3D neon beam effect
    if ((style === 'neon' || isHighlighted) && points.length > 1 && !isDimmed) {
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2, width * 0.35);
      ctx.globalAlpha = 0.85;
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();
    }

    // Draw pulsating indicator on live tip
    if (isLive && points.length > 0) {
      const lastPoint = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, width * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, width * 2.8, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Main redraw routine in virtual 800x600 space
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / VIRTUAL_WIDTH;
    const scaleY = rect.height / VIRTUAL_HEIGHT;

    ctx.save();
    ctx.scale(dpr * scaleX, dpr * scaleY);

    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Draw clean textured paper background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Subtle artist grid dots
    ctx.fillStyle = '#E2E8F0';
    const dotSpacing = 32;
    for (let x = dotSpacing; x < VIRTUAL_WIDTH; x += dotSpacing) {
      for (let y = dotSpacing; y < VIRTUAL_HEIGHT; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Studio watermark in corner
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#CBD5E1';
    ctx.textAlign = 'right';
    ctx.fillText('Imposter Line Studio 🎨', VIRTUAL_WIDTH - 20, VIRTUAL_HEIGHT - 16);

    // Render completed strokes up to replay limit
    const visibleStrokes = isReplaying ? strokes.slice(0, replayStrokeIndex) : strokes;

    visibleStrokes.forEach((stroke) => {
      const isHighlighted = highlightPlayerId === stroke.playerId;
      const isDimmed = Boolean(highlightPlayerId && highlightPlayerId !== stroke.playerId);
      drawStrokePath(
        ctx,
        stroke.points,
        stroke.color,
        stroke.width || 6,
        isDimmed,
        isHighlighted,
        false,
        'classic'
      );
    });

    // Render local active drawing stroke
    if (currentPoints.length > 0 && activePlayer) {
      drawStrokePath(
        ctx,
        currentPoints,
        activePlayer.color,
        strokeThickness,
        false,
        false,
        true,
        brushStyle
      );
    }

    // Render remote live stroke (from observer or other players)
    if (liveRemoteStroke && liveRemoteStroke.points && liveRemoteStroke.points.length > 0) {
      drawStrokePath(
        ctx,
        liveRemoteStroke.points,
        liveRemoteStroke.color,
        7,
        false,
        false,
        true,
        'classic'
      );
    }

    ctx.restore();
  }, [
    strokes,
    isReplaying,
    replayStrokeIndex,
    highlightPlayerId,
    currentPoints,
    activePlayer,
    liveRemoteStroke,
    brushStyle,
    strokeThickness,
  ]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  // Pointer event handlers with coordinate normalization to 800x600
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: (rawX / rect.width) * VIRTUAL_WIDTH,
      y: (rawY / rect.height) * VIRTUAL_HEIGHT,
      pressure: e.pressure || 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingEnabled || strokeFinished || !activePlayer) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const point = getNormalizedPoint(e);
    setIsPointerDown(true);
    const newPts = [point];
    setCurrentPoints(newPts);
    if (onLivePointsUpdate) onLivePointsUpdate(newPts);
    playStrokeStartSound();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown || !isDrawingEnabled || strokeFinished) return;
    const point = getNormalizedPoint(e);
    setCurrentPoints((prev) => {
      const updated = [...prev, point];
      if (onLivePointsUpdate && updated.length % 2 === 0) {
        onLivePointsUpdate(updated);
      }
      return updated;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown || !isDrawingEnabled || strokeFinished) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsPointerDown(false);

    if (currentPoints.length > 1) {
      setStrokeFinished(true);
      if (onLivePointsUpdate) onLivePointsUpdate(currentPoints);
      playStrokeEndSound();
    } else {
      setCurrentPoints([]);
      if (onLivePointsUpdate) onLivePointsUpdate([]);
    }
  };

  const handleUndo = () => {
    playPopSound();
    setCurrentPoints([]);
    setStrokeFinished(false);
    setIsPointerDown(false);
    if (onLivePointsUpdate) onLivePointsUpdate([]);
  };

  const handleConfirmStroke = () => {
    if (!activePlayer || currentPoints.length < 2 || !onStrokeComplete) return;

    const newStroke: Stroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      playerId: activePlayer.id,
      points: currentPoints,
      color: activePlayer.color,
      width: strokeThickness,
      roundNumber: currentRoundNumber,
      timestamp: Date.now(),
    };

    onStrokeComplete(newStroke);
    setCurrentPoints([]);
    setStrokeFinished(false);
    if (onLivePointsUpdate) onLivePointsUpdate([]);
  };

  const startReplay = (speedMultiplier = replaySpeed) => {
    setIsReplaying(true);
    setReplayStrokeIndex(0);
    let step = 0;
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);

    const intervalMs = Math.max(150, Math.floor(600 / speedMultiplier));
    replayTimerRef.current = window.setInterval(() => {
      step++;
      if (step > strokes.length) {
        clearInterval(replayTimerRef.current!);
        setIsReplaying(false);
        setReplayStrokeIndex(strokes.length);
      } else {
        setReplayStrokeIndex(step);
      }
    }, intervalMs);
  };

  const toggleReplay = () => {
    if (isReplaying) {
      setIsReplaying(false);
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    } else {
      startReplay();
    }
  };

  const toggleReplaySpeed = () => {
    const nextSpeed = replaySpeed === 1 ? 2 : replaySpeed === 2 ? 4 : 1;
    setReplaySpeed(nextSpeed);
    if (isReplaying) {
      startReplay(nextSpeed);
    }
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `imposter-line-artwork-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={`relative flex flex-col items-center w-full ${className}`}>
      {/* Canvas Frame with Bezel & Spotlight Glow */}
      <div
        ref={containerRef}
        id="game-canvas-container"
        className={`relative w-full aspect-[4/3] max-h-[58vh] bg-white dark:bg-slate-900 rounded-3xl shadow-xl border-4 overflow-hidden touch-none select-none transition-all ${
          isDrawingEnabled && !strokeFinished
            ? 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-indigo-500/10'
            : 'border-slate-200 dark:border-slate-800 ring-1 ring-slate-200'
        }`}
      >
        <canvas
          ref={canvasRef}
          id="imposter-line-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full h-full block ${
            isDrawingEnabled && !strokeFinished ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Floating Reactions on Canvas */}
        <LiveReactionsOverlay onSendReaction={onSendReaction} />

        {/* Remote Live Drawing Active Indicator */}
        {liveRemoteStroke && liveRemoteStroke.points.length > 0 && !isDrawingEnabled && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-200 text-xs px-3.5 py-1.5 rounded-full font-black shadow-lg flex items-center gap-2 border border-slate-200 dark:border-slate-800 animate-pulse z-10">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-ping" />
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: liveRemoteStroke.color }}
            />
            <span>{t('Canlı Çizim Yayını...')}</span>
          </div>
        )}

        {/* Drawing guideline banner when active player is up */}
        {isDrawingEnabled && !strokeFinished && !isPointerDown && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-xs sm:text-sm px-4 py-2 rounded-full font-black shadow-lg pointer-events-none flex items-center gap-2.5 border border-slate-800 z-10 animate-bounce">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: activePlayer?.color }}
            />
            <span>{t('Parmağınızı kaldırmadan TEK bir sürekli çizgi çizin!')}</span>
          </div>
        )}

        {/* In-stroke active drawing tracker badge */}
        {isPointerDown && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white text-xs px-3.5 py-1.5 rounded-full font-black animate-pulse shadow-md z-10 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('Çiziliyor ({a} nokta)...', { a: currentPoints.length })}</span>
          </div>
        )}

        {/* Controls Overlay when Stroke is drawn */}
        {isDrawingEnabled && strokeFinished && (
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 px-4 z-20 animate-fade-in">
            <button
              id="btn-undo-stroke"
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{t('Yeniden Çiz')}</span>
            </button>
            <button
              id="btn-confirm-stroke"
              onClick={handleConfirmStroke}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm sm:text-base font-black rounded-2xl shadow-xl ring-4 ring-emerald-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{t('Çizgiyi Onayla & Gönder')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Gamified Brush Style & Thickness Toolbar (Visible during active drawing) */}
      {isDrawingEnabled && !strokeFinished && (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">{t('Fırça Stili:')}</span>
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setBrushStyle('classic');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                brushStyle === 'classic'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>{t('Klasik')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPopSound();
                setBrushStyle('neon');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                brushStyle === 'neon'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs neon-glow-indigo'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('Neon Işık')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPopSound();
                setBrushStyle('felt');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                brushStyle === 'felt'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span>{t('🖋️ Keçeli')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">{t('Kalınlık:')}</span>
            {[5, 7, 11].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  playPopSound();
                  setStrokeThickness(w);
                }}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  strokeThickness === w
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span
                  className={strokeThickness === w ? 'rounded-full bg-white' : 'rounded-full bg-slate-600'}
                  style={{ width: `${w - 1}px`, height: `${w - 1}px` }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action & Replay Bar for Discussion & Results */}
      {(allowReplay || showAttribution) && (
        <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2.5 px-1">
          {/* Replay Controls with Timeline Scrubber */}
          {allowReplay && strokes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                id="btn-toggle-replay"
                onClick={toggleReplay}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isReplaying ? 'Durdur' : t('Çizimi Yeniden Oynat')}</span>
              </button>

              <button
                id="btn-toggle-replay-speed"
                onClick={toggleReplaySpeed}
                className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title={t('Oynatma Hızı')}
              >
                <FastForward className="w-3 h-3" />
                <span>{replaySpeed}x</span>
              </button>

              {/* Scrubber slider */}
              <input
                type="range"
                min={0}
                max={strokes.length}
                value={replayStrokeIndex}
                onChange={(e) => {
                  setIsReplaying(false);
                  if (replayTimerRef.current) clearInterval(replayTimerRef.current);
                  setReplayStrokeIndex(Number(e.target.value));
                }}
                className="w-24 sm:w-32 accent-indigo-600 cursor-pointer"
              />

              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">
                {t('{a}/{b} çizgi', { a: replayStrokeIndex, b: strokes.length })}</span>
            </div>
          )}

          {/* Download artwork button */}
          <button
            id="btn-download-artwork"
            onClick={downloadCanvasImage}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors ml-auto cursor-pointer"
            title={t('Ortak Resmi PNG Olarak Kaydet')}
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Resmi İndir (PNG)')}</span>
          </button>
        </div>
      )}

      {/* Attribution Chips */}
      {showAttribution && players.length > 0 && (
        <div className="w-full flex flex-wrap items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('Çizenler:')}</span>
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                highlightPlayerId === p.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs ring-2 ring-indigo-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
