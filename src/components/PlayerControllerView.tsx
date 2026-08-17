import React, { useState, useEffect } from 'react';
import { RoomState, LiveStrokeState, Stroke, Point } from '../types';
import { CanvasBoard } from './CanvasBoard';
import {
  Smartphone,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
  Send,
  Check,
  Trophy,
  Palette,
  CheckCircle2,
  XCircle,
  Radio,
} from 'lucide-react';
import { DEFAULT_PLAYER_PALETTE } from '../data/wordPacks';
import { playClickSound, playTurnSound } from '../utils/audio';

interface PlayerControllerViewProps {
  roomState: RoomState;
  myPlayerId: string;
  liveStroke: LiveStrokeState | null;
  onSendLivePoint: (points: Point[], color: string) => void;
  onCommitStroke: (stroke: Stroke) => void;
  onSkipTurn: () => void;
  onSubmitVote: (targetId: string) => void;
  onSubmitImposterGuess: (guessWord: string) => void;
  onUpdateProfile: (name: string, color: string, avatar: string, colorName: string) => void;
  onLeaveRoom: () => void;
}

export const PlayerControllerView: React.FC<PlayerControllerViewProps> = ({
  roomState,
  myPlayerId,
  liveStroke,
  onSendLivePoint,
  onCommitStroke,
  onSkipTurn,
  onSubmitVote,
  onSubmitImposterGuess,
  onUpdateProfile,
  onLeaveRoom,
}) => {
  const [isSecretCardRevealed, setIsSecretCardRevealed] = useState(false);
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [imposterGuessInput, setImposterGuessInput] = useState('');
  const [hasSubmittedGuess, setHasSubmittedGuess] = useState(false);

  // Automatically reset interaction states when phase or round changes to prevent UI lockups
  useEffect(() => {
    if (roomState.gamePhase === 'WORD_REVEAL') {
      setIsSecretCardRevealed(false);
      setSelectedVoteTargetId(null);
      setHasVoted(false);
      setImposterGuessInput('');
      setHasSubmittedGuess(false);
    } else if (roomState.gamePhase === 'DRAWING') {
      setIsSecretCardRevealed(false);
    } else if (roomState.gamePhase === 'VOTING') {
      setSelectedVoteTargetId(null);
      setHasVoted(false);
    } else if (roomState.gamePhase === 'IMPOSTER_GUESS') {
      setHasSubmittedGuess(false);
      setImposterGuessInput('');
    } else if (roomState.gamePhase === 'LOBBY') {
      setIsSecretCardRevealed(false);
      setSelectedVoteTargetId(null);
      setHasVoted(false);
      setImposterGuessInput('');
      setHasSubmittedGuess(false);
    }
  }, [roomState.gamePhase, roomState.currentRoundNumber]);

  const me = roomState.players.find((p) => p.id === myPlayerId) || roomState.players[0];
  const activePlayer = roomState.players[roomState.activePlayerIndex];
  const isMyTurnToDraw = activePlayer?.id === myPlayerId;

  // Handle live stroke point updates from local drawing canvas
  const handleLivePointsUpdate = (points: Point[]) => {
    if (isMyTurnToDraw && me) {
      onSendLivePoint(points, me.color);
    }
  };

  const handleVoteConfirm = () => {
    if (!selectedVoteTargetId || hasVoted) return;
    playClickSound();
    setHasVoted(true);
    onSubmitVote(selectedVoteTargetId);
  };

  const handleImposterGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imposterGuessInput.trim() || hasSubmittedGuess) return;
    playClickSound();
    setHasSubmittedGuess(true);
    onSubmitImposterGuess(imposterGuessInput.trim());
  };

  return (
    <div id="player-controller-view" className="w-full max-w-md mx-auto px-4 py-3 space-y-4 select-none">
      {/* Top Phone Status Pill */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xs border border-white shrink-0"
            style={{ backgroundColor: me?.color }}
          >
            {me?.avatar}
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 leading-none">{me?.name}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
              Room: <span className="font-mono text-slate-800">{roomState.roomCode}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Secret Word Quick Peek Button (if game in progress) */}
          {roomState.myAssignedWord && roomState.gamePhase !== 'LOBBY' && (
            <button
              onClick={() => setIsSecretCardRevealed((prev) => !prev)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                isSecretCardRevealed
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {isSecretCardRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{isSecretCardRevealed ? 'Hide Word' : 'Peek Word'}</span>
            </button>
          )}

          <button
            onClick={onLeaveRoom}
            className="text-[11px] text-slate-400 hover:text-rose-600 font-bold px-1 py-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Floating Peek Card Modal if opened */}
      {isSecretCardRevealed && roomState.myAssignedWord && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500 shadow-2xl space-y-2 animate-scale-in text-center">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Category: <strong className="text-white">{roomState.category}</strong></span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold ${
                roomState.myIsImposter ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
              }`}
            >
              {roomState.myRoleTitle}
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-indigo-300 py-1">
            {roomState.myAssignedWord}
          </div>

          <p className="text-[11px] text-slate-300">{roomState.myRoleDescription}</p>

          <button
            onClick={() => setIsSecretCardRevealed(false)}
            className="text-xs text-slate-400 hover:text-white font-semibold underline mt-1"
          >
            Close Peek
          </button>
        </div>
      )}

      {/* 1. LOBBY PHASE ON PHONE */}
      {roomState.gamePhase === 'LOBBY' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected to Room</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">You're in the Game!</h2>
            <p className="text-xs text-slate-500">
              Customize your profile while waiting for the host to start.
            </p>
          </div>

          {/* Player Profile Editor */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Nickname:</label>
              <input
                type="text"
                value={me?.name || ''}
                maxLength={16}
                onChange={(e) => {
                  if (me) onUpdateProfile(e.target.value, me.color, me.avatar, me.colorName);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Choose Stroke Color:</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_PLAYER_PALETTE.map((pal, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (me) onUpdateProfile(me.name, pal.color, pal.avatar, pal.name);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      me?.color === pal.color
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: pal.color }}
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {pal.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-800 font-semibold animate-pulse">
            Waiting for Host to start round on the main screen...
          </div>
        </div>
      )}

      {/* 2. WORD REVEAL (SECRET BRIEFING) ON PHONE */}
      {roomState.gamePhase === 'WORD_REVEAL' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Gizli Rolünüz (Secret Briefing)</h2>
            <p className="text-xs text-slate-500">Kelimenizi görmek için karta dokunun ve ezberleyin.</p>
          </div>

          {/* Privacy Scratch / Peek Card */}
          <div
            onClick={() => setIsSecretCardRevealed((prev) => !prev)}
            className={`w-full aspect-[4/3] rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-xl border-2 ${
              isSecretCardRevealed
                ? roomState.myIsImposter
                  ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border-rose-500 text-white'
                  : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-white hover:border-indigo-500'
            }`}
          >
            {!isSecretCardRevealed ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-base font-black">Gizli Rolü Görmek İçin Dokun</div>
                <div className="text-[11px] text-slate-400">Diğer oyunculardan gizli tutun!</div>
              </div>
            ) : (
              <div className="space-y-2 animate-scale-in">
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    roomState.myIsImposter ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {roomState.myRoleTitle}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {roomState.myAssignedWord}
                </div>
                <p className="text-xs text-slate-300 max-w-xs">{roomState.myRoleDescription}</p>
                <div className="text-[10px] text-slate-400 underline pt-2">Kapatmak için dokun</div>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 font-bold">
            Hazır olduğunuzda ana ekrana bakın!
          </div>
        </div>
      )}

      {/* 3. DRAWING PHASE ON PHONE */}
      {roomState.gamePhase === 'DRAWING' && (
        <div className="space-y-3 animate-fade-in">
          {isMyTurnToDraw ? (
            /* ACTIVE DRAWING PAD FOR CURRENT PLAYER */
            <div className="bg-white rounded-3xl p-4 border-2 border-indigo-500 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full animate-ping"
                    style={{ backgroundColor: me?.color }}
                  />
                  <span className="text-sm font-black text-slate-900 uppercase">
                    Çizme Sırası Sende (Your Turn)!
                  </span>
                </div>

                {roomState.settings.drawTimeLimitSec > 0 && (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border ${
                      roomState.turnTimeRemaining <= 5
                        ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{roomState.turnTimeRemaining}s</span>
                  </div>
                )}
              </div>

              {/* Touch Canvas */}
              <CanvasBoard
                key={`controller-canvas-${roomState.currentRoundNumber}-${roomState.currentDrawingRound}-${roomState.activePlayerIndex}`}
                strokes={roomState.strokes}
                players={roomState.players}
                activePlayer={me}
                isDrawingEnabled={true}
                onStrokeComplete={onCommitStroke}
                onLivePointsUpdate={handleLivePointsUpdate}
                currentRoundNumber={roomState.currentDrawingRound}
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Parmağınızı kaldırmadan 1 sürekli çizgi çizin</span>
                <button
                  onClick={onSkipTurn}
                  className="text-slate-400 hover:text-slate-700 underline font-semibold"
                >
                  Pas Geç
                </button>
              </div>
            </div>
          ) : (
            /* WAITING VIEW FOR OTHER PLAYERS */
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-white"
                  style={{ backgroundColor: activePlayer?.color }}
                >
                  {activePlayer?.avatar}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-500 uppercase">Şu An Çizen:</div>
                  <div className="text-lg font-black text-slate-900">{activePlayer?.name}</div>
                </div>
              </div>

              {/* Live Canvas Feed */}
              <CanvasBoard
                strokes={roomState.strokes}
                players={roomState.players}
                activePlayer={activePlayer}
                isDrawingEnabled={false}
                liveRemoteStroke={liveStroke}
                currentRoundNumber={roomState.currentDrawingRound}
              />

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold flex items-center justify-center gap-2">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Çizgileri canlı olarak takip edin!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. DISCUSSION PHASE ON PHONE */}
      {roomState.gamePhase === 'DISCUSSION' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-center">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Tartışma Aşaması
            </span>
            <h2 className="text-2xl font-black text-slate-900">Sahtekâr Kim?</h2>
            <p className="text-xs text-slate-500">
              Gruptaki şüpheli çizgileri tartışın!
            </p>
          </div>

          <CanvasBoard
            strokes={roomState.strokes}
            players={roomState.players}
            isDrawingEnabled={false}
            showAttribution={true}
            allowReplay={true}
          />
        </div>
      )}

      {/* 5. VOTING PHASE ON PHONE */}
      {roomState.gamePhase === 'VOTING' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Secret Ballot
            </span>
            <h2 className="text-2xl font-black text-slate-900">Vote for the Imposter</h2>
            <p className="text-xs text-slate-500">
              Select the player who drew the suspicious stroke.
            </p>
          </div>

          {!hasVoted ? (
            <div className="space-y-2">
              {roomState.players.map((candidate) => {
                if (candidate.id === myPlayerId) return null; // Can't vote for self
                const isSelected = selectedVoteTargetId === candidate.id;

                return (
                  <button
                    key={candidate.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedVoteTargetId(candidate.id);
                    }}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-500/20 shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs border border-white"
                        style={{ backgroundColor: candidate.color }}
                      >
                        {candidate.avatar}
                      </div>
                      <div className="text-left font-bold text-slate-900 text-sm">
                        {candidate.name}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={handleVoteConfirm}
                disabled={!selectedVoteTargetId}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-3"
              >
                <span>Submit Secret Vote</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Vote Recorded!</h3>
              <p className="text-xs text-slate-500">
                Waiting for other players to submit their ballots on the main screen...
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. IMPOSTER SHOWDOWN GUESS ON PHONE */}
      {roomState.gamePhase === 'IMPOSTER_GUESS' && roomState.roundResult && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          {roomState.myIsImposter ? (
            /* IF THIS PHONE IS THE IMPOSTER */
            <form onSubmit={handleImposterGuessSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Caught! Final Steal Attempt
                </span>
                <h2 className="text-2xl font-black text-slate-900">Guess the Crew's Word!</h2>
                <p className="text-xs text-slate-500">
                  If you guess what the innocent crew was drawing, you steal 120 points and win!
                </p>
              </div>

              {!hasSubmittedGuess ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={imposterGuessInput}
                    autoFocus
                    onChange={(e) => setImposterGuessInput(e.target.value)}
                    placeholder="Enter crew word guess..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-2xl px-4 py-3 text-base font-bold text-slate-900 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!imposterGuessInput.trim()}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Submit Steal Guess</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs font-bold text-slate-700">
                  Guess submitted! Look up at the main screen for final results.
                </div>
              )}
            </form>
          ) : (
            /* IF THIS PHONE IS AN INNOCENT CREW MEMBER */
            <div className="text-center space-y-3 py-4">
              <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black text-slate-900">Imposter Showdown!</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                The crew correctly identified the Imposter! Watch the main screen to see if they can guess your word "{roomState.myAssignedWord}".
              </p>
            </div>
          )}
        </div>
      )}

      {/* 7. RESULTS ON PHONE */}
      {roomState.gamePhase === 'RESULTS' && roomState.roundResult && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-center">
          <div className="space-y-1">
            <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-900">
              {roomState.roundResult.imposterWon ? '🎭 Sahtekâr Kazandı!' : '🎉 Masum Ressamlar Kazandı!'}
            </h2>
            <p className="text-xs text-slate-500">
              Toplam Puanınız: <strong className="text-indigo-600 text-sm">{me?.score} pts</strong>
            </p>
          </div>

          {/* Correct Imposter Voter Reward Notice */}
          {(roomState.roundResult.correctVoterIds || []).includes(myPlayerId) && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 text-xs font-black">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>🎯 Tebrikler! Sahtekârı doğru bildiniz (+50 Puan Kazandınız!)</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1.5 text-xs">
            <div>
              Gizli Kelime: <strong className="text-emerald-700 font-bold">{roomState.roundResult.crewWord}</strong>
            </div>
            <div>
              Sahtekâr: <strong className="text-rose-700 font-bold">{roomState.players.find(p => p.id === roomState.roundResult?.imposterId)?.name || 'Sahtekâr'}</strong>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Yeni tur için ana ekrana bakın!
          </div>
        </div>
      )}
    </div>
  );
};
