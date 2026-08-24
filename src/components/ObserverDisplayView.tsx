import React, { useEffect, useState, useRef } from 'react';
import { RoomState, LiveStrokeState, Stroke, GameSettings, WordPair } from '../types';
import { CanvasBoard } from './CanvasBoard';
import QRCode from 'qrcode';
import {
  Tv,
  Users,
  Play,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Clock,
  Radio,
  ShieldAlert,
  Trophy,
  ArrowRight,
  RotateCcw,
  Bot,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { playTurnSound, playGongSound, playSuspenseSound, playFanfareSound } from '../utils/audio';
import confetti from 'canvas-confetti';

import { t, withLang } from '../i18n';
interface ObserverDisplayViewProps {
  roomState: RoomState;
  liveStroke: LiveStrokeState | null;
  onStartGame: (customPair?: WordPair) => void;
  onStartDrawing: () => void;
  onProceedToVoting: () => void;
  onForceTallyVotes: () => void;
  onNextRound: () => void;
  onBackToLobby: () => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onLeaveRoom: () => void;
}

export const ObserverDisplayView: React.FC<ObserverDisplayViewProps> = ({
  roomState,
  liveStroke,
  onStartGame,
  onStartDrawing,
  onProceedToVoting,
  onForceTallyVotes,
  onNextRound,
  onBackToLobby,
  onAddBot,
  onRemovePlayer,
  onUpdateSettings,
  onLeaveRoom,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [highlightPlayerId, setHighlightPlayerId] = useState<string | null>(null);

  const activePlayer = roomState.players[roomState.activePlayerIndex];
  const maxRounds = roomState.settings.roundsPerPlayer || 2;
  const turnsCompleted =
    (roomState.currentDrawingRound - 1) * roomState.players.length + roomState.activePlayerIndex;
  const totalTurnsInGame = roomState.players.length * maxRounds;

  const joinUrl = withLang(`${window.location.origin}/?room=${roomState.roomCode}`);

  // Generate QR Code
  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 200,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code error:', err));
  }, [joinUrl]);

  // Sound effects on phase transitions
  useEffect(() => {
    if (roomState.gamePhase === 'WORD_REVEAL') {
      playTurnSound();
    } else if (roomState.gamePhase === 'DRAWING') {
      playTurnSound();
    } else if (roomState.gamePhase === 'DISCUSSION') {
      playGongSound();
    } else if (roomState.gamePhase === 'VOTING') {
      playSuspenseSound();
    } else if (roomState.gamePhase === 'RESULTS') {
      playFanfareSound();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
    }
  }, [roomState.gamePhase]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="observer-display-view" className="w-full max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Top Observer Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {t('Observer TV Display')}</span>
              <span className="text-xs text-slate-500 font-bold">
                {roomState.players.length} Players Connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{t('Room Code:')}</span>
              <span className="font-mono font-black text-slate-900 tracking-wider text-lg">
                {roomState.roomCode}
              </span>
            </div>
          </div>
        </div>

        {/* Action / Phase Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Join Link'}</span>
          </button>
          <button
            onClick={onLeaveRoom}
            className="px-3 py-1.5 text-slate-500 hover:text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors"
          >
            {t('Exit Room')}</button>
        </div>
      </div>

      {/* PHASE 1: LOBBY ON BIG SCREEN */}
      {roomState.gamePhase === 'LOBBY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left 2 Cols: QR code & Join Info */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Join on your phone or mobile browser!')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {t('Scan QR or Go to Join Page')}</h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-lg">
                {t('Players join from their own devices to secretly receive their word, draw continuous line strokes, and vote on the imposter!')}</p>
            </div>

            {/* QR & Room Code Box */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
              {qrDataUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-md shrink-0">
                  <img src={qrDataUrl} alt={t('Room QR Code')} className="w-36 h-36 rounded-lg block" />
                </div>
              )}
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
                  {t('Enter Room Code on Phone')}</span>
                <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white">
                  {roomState.roomCode}
                </div>
                <p className="text-xs text-slate-300">
                  {t('Direct URL:')} <strong className="text-indigo-200">{joinUrl}</strong>
                </p>
              </div>
            </div>

            {/* Host Start Action */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                id="btn-observer-start-game"
                onClick={() => onStartGame()}
                disabled={roomState.players.length < 3}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>START GAME ({roomState.players.length} PLAYERS)</span>
              </button>

              <button
                onClick={onAddBot}
                disabled={roomState.players.length >= 8}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>{t('+ Add AI Bot')}</span>
              </button>
            </div>
          </div>

          {/* Right Col: Connected Players Roster */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{t('Joined Players')}</span>
                </h3>
                <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {roomState.players.length} / 8
                </span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {roomState.players.map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 animate-scale-in"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs border border-white shrink-0"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {player.isBot && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                              {t('Bot')}</span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          {player.colorName}
                        </div>
                      </div>
                    </div>

                    {roomState.players.length > 3 && (
                      <button
                        onClick={() => onRemovePlayer(player.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs px-2 py-1"
                        title={t('Remove player')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-500 text-center">
              Category: <strong>{roomState.category || 'All Categories'}</strong> • {roomState.settings.roundsPerPlayer} strokes per player
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: WORD REVEAL (SECRET BRIEFING) */}
      {roomState.gamePhase === 'WORD_REVEAL' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border-2 border-indigo-200 mx-auto flex items-center justify-center text-indigo-600">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">
              {t('Telefonlarınızdan Gizli Rolünüzü Kontrol Edin!')}</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {t('Her oyuncu kendi telefonuna gizli rol kartını aldı. Aranızdan 1 kişi Sahtekâr (Imposter)!')}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
            <span>{t('Herkes hazır olduğunda çizim turunu başlatın:')}</span>
          </div>

          <button
            onClick={onStartDrawing}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 cursor-pointer"
          >
            <span>{t('Çizim Turunu Başlat')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* PHASE 3: LIVE DRAWING ON BIG CANVAS */}
      {roomState.gamePhase === 'DRAWING' && (
        <div className="space-y-4 animate-fade-in">
          {/* Active Player Banner with Next Drawer */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white relative shrink-0"
                style={{ backgroundColor: activePlayer?.color }}
              >
                <span>{activePlayer?.avatar}</span>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {t('Şu An Çizen (Drawing Now)')}</span>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: activePlayer?.color }}
                  >
                    {activePlayer?.colorName}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                  {activePlayer?.name} {activePlayer?.isBot && '(AI Bot)'}
                </h2>
              </div>
            </div>

            {/* Next Drawer Up & Countdown */}
            <div className="flex items-center gap-3">
              {roomState.players[(roomState.activePlayerIndex + 1) % roomState.players.length] && (
                <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {t('Sıradaki (Next):')}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs text-white font-bold"
                      style={{
                        backgroundColor:
                          roomState.players[(roomState.activePlayerIndex + 1) % roomState.players.length]
                            .color,
                      }}
                    >
                      {roomState.players[(roomState.activePlayerIndex + 1) % roomState.players.length].avatar}
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {roomState.players[(roomState.activePlayerIndex + 1) % roomState.players.length].name}
                    </span>
                  </div>
                </div>
              )}

              {roomState.settings.drawTimeLimitSec > 0 && (
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-mono font-black text-base border ${
                    roomState.turnTimeRemaining <= 5
                      ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{roomState.turnTimeRemaining}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>
              Round {roomState.currentDrawingRound} of {maxRounds} • Stroke {turnsCompleted + 1} of {totalTurnsInGame}
            </span>
            <div className="flex gap-1.5">
              {roomState.players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`w-3.5 h-3.5 rounded-full border border-white shadow-xs transition-all ${
                    idx === roomState.activePlayerIndex
                      ? 'ring-2 ring-indigo-500 scale-125'
                      : idx < roomState.activePlayerIndex
                      ? 'opacity-70'
                      : 'opacity-25'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          {/* Live Synchronized Canvas Board */}
          <CanvasBoard
            key={`observer-draw-canvas-${roomState.currentRoundNumber}`}
            strokes={roomState.strokes}
            players={roomState.players}
            activePlayer={activePlayer}
            isDrawingEnabled={false}
            liveRemoteStroke={liveStroke}
            currentRoundNumber={roomState.currentDrawingRound}
          />
        </div>
      )}

      {/* PHASE 4: DISCUSSION */}
      {roomState.gamePhase === 'DISCUSSION' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                {t('Discussion Phase')}</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {t('Who Drew the Suspicious Line?')}</h2>
              <p className="text-xs text-slate-500">
                {t('Kim şüpheli bir çizgi çizdi? Çizgilerini tek tek incelemek için aşağıdaki oyuncu butonlarına tıklayın.')}</p>
            </div>

            {roomState.settings.discussionTimeSec > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-mono font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{roomState.discussionTimeRemaining}s</span>
              </div>
            )}
          </div>

          {/* Canvas with Stroke Inspection */}
          <CanvasBoard
            key={`observer-discussion-canvas-${roomState.currentRoundNumber}`}
            strokes={roomState.strokes}
            players={roomState.players}
            isDrawingEnabled={false}
            highlightPlayerId={highlightPlayerId}
            showAttribution={true}
            allowReplay={true}
          />

          {/* Attribution Buttons */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">
                {t('Filter by Player Stroke:')}</span>
              {highlightPlayerId && (
                <button
                  onClick={() => setHighlightPlayerId(null)}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  {t('Show All')}</button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {roomState.players.map((p) => {
                const isSelected = highlightPlayerId === p.id;
                const count = roomState.strokes.filter((s) => s.playerId === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => setHighlightPlayerId((prev) => (prev === p.id ? null : p.id))}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-xs border border-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.avatar}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{count} strokes</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Voting Action */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onProceedToVoting}
              className="px-8 py-4 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-black text-base rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>{t('START SECRET VOTING ON PHONES')}</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 5: VOTING STATUS ON BIG SCREEN */}
      {roomState.gamePhase === 'VOTING' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 mx-auto flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">
              {t('Players are Voting on Their Devices!')}</h2>
            <p className="text-sm text-slate-500">
              {t('Cast your secret ballot on your phone screen. Who is the Imposter?')}</p>
          </div>

          {/* Vote Counter Progress */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-slate-700">
              <span>{t('Votes Received')}</span>
              <span className="text-indigo-600">
                {roomState.votedPlayerIds.length} / {roomState.players.length}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-500"
                style={{
                  width: `${(roomState.votedPlayerIds.length / roomState.players.length) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-center gap-2 pt-2">
              {roomState.players.map((p) => {
                const hasVoted = roomState.votedPlayerIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      hasVoted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>{p.name}</span>
                    {hasVoted ? '✓' : '...'}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onForceTallyVotes}
            className="text-xs text-slate-400 hover:text-slate-700 underline font-semibold"
          >
            {t('Force Tally Votes')}</button>
        </div>
      )}

      {/* PHASE 6: IMPOSTER GUESS SHOWDOWN */}
      {roomState.gamePhase === 'IMPOSTER_GUESS' && roomState.roundResult && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white text-center border-2 border-rose-500 shadow-2xl max-w-2xl mx-auto space-y-6 animate-scale-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('Imposter Was Caught! Final Showdown')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black">
            {t('The Imposter has ONE Chance to Guess the Word!')}</h2>

          <p className="text-slate-300 text-sm max-w-md mx-auto">
            {t('The imposter is typing their guess on their phone. If they correctly identify what the crew was drawing, they steal the victory!')}</p>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs text-slate-200 font-semibold animate-pulse">
            {t('Waiting for Imposter guess submission...')}</div>
        </div>
      )}

      {/* PHASE 7: RESULTS & SCOREBOARD */}
      {roomState.gamePhase === 'RESULTS' && roomState.roundResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Victory Card */}
          <div
            className={`rounded-3xl p-8 text-white text-center shadow-2xl border-2 ${
              roomState.roundResult.imposterWon
                ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border-rose-500'
                : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 border-emerald-500'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Round {roomState.currentRoundNumber} Complete</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black">
              {roomState.roundResult.imposterWon ? '🎭 THE IMPOSTER WINS!' : '🎉 THE INNOCENT CREW WINS!'}
            </h2>

            {/* Word Reveal Chips */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 text-left">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  {t('Crew Word (Majority)')}</span>
                <span className="text-xl font-black text-emerald-400">
                  {roomState.roundResult.crewWord}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 text-left">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  {t('Imposter Word')}</span>
                <span className="text-xl font-black text-rose-400">
                  {roomState.roundResult.imposterWord}
                </span>
              </div>
            </div>
          </div>

          {/* Artwork & Leaderboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{t('Collaborative Drawing')}</span>
              </h3>
              <CanvasBoard
                strokes={roomState.strokes}
                players={roomState.players}
                isDrawingEnabled={false}
                showAttribution={true}
                allowReplay={true}
              />
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{t('Leaderboard Standings')}</span>
              </h3>
              <div className="space-y-2">
                {[...roomState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, rank) => {
                    const pointsEarned = roomState.roundResult?.pointsAwarded?.[player.id] || 0;
                    const isImposter = player.id === roomState.roundResult?.imposterId;
                    const votedCorrectly = (roomState.roundResult?.correctVoterIds || []).includes(player.id);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-black text-sm text-slate-400">
                            #{rank + 1}
                          </span>
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs border border-white"
                            style={{ backgroundColor: player.color }}
                          >
                            {player.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{player.name}</span>
                              {isImposter && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-extrabold">
                                  {t('Sahtekâr')}</span>
                              )}
                              {votedCorrectly && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-extrabold">
                                  {t('+50 Buldu')}</span>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              {player.colorName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-indigo-700">{player.score} pts</div>
                          {pointsEarned > 0 && (
                            <div className="text-[11px] font-bold text-emerald-600">
                              +{pointsEarned} bu tur
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Action to proceed to next round */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNextRound}
              className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{t('PLAY NEXT ROUND')}</span>
            </button>
            <button
              onClick={onBackToLobby}
              className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 transition-colors"
            >
              {t('Back to Room Lobby')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
