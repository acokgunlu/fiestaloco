import React, { useState, useEffect } from 'react';
import { Player, WordPair, GameMode } from '../types';
import { Eye, EyeOff, ShieldAlert, Sparkles, ArrowRight, Fingerprint, LockKeyhole, AlertOctagon } from 'lucide-react';
import { playClickSound, playTurnSound, playWobbleSound, playPopSound } from '../utils/audio';

interface WordRevealViewProps {
  players: Player[];
  wordPair: WordPair;
  gameMode: GameMode;
  onComplete: () => void;
}

export const WordRevealView: React.FC<WordRevealViewProps> = ({
  players,
  wordPair,
  gameMode,
  onComplete,
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const isLastPlayer = currentPlayerIndex === players.length - 1;
  const isImposter = currentPlayer?.isImposter;

  // If current player is bot, auto-advance
  useEffect(() => {
    if (currentPlayer?.isBot) {
      const timer = setTimeout(() => {
        handleNextPlayer();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, currentPlayer?.isBot]);

  const handleReveal = () => {
    setIsRevealed(true);
    if (isImposter) {
      playWobbleSound();
    } else {
      playPopSound();
    }
  };

  const handleNextPlayer = () => {
    playClickSound();
    setIsRevealed(false);
    if (isLastPlayer) {
      playTurnSound();
      onComplete();
    } else {
      setCurrentPlayerIndex((prev) => prev + 1);
    }
  };

  return (
    <div
      id="word-reveal-view"
      className="w-full max-w-lg mx-auto px-4 py-5 flex flex-col items-center justify-center min-h-[72vh] space-y-5 select-none animate-fade-in text-slate-900"
    >
      {/* Progress tracker */}
      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-xs">
        <span>Gizli Görev Brifingi • {currentPlayerIndex + 1} / {players.length}</span>
        <div className="flex gap-1.5 ml-2">
          {players.map((p, idx) => (
            <span
              key={p.id}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentPlayerIndex
                  ? 'bg-indigo-600 scale-125 ring-2 ring-indigo-500/30 shadow-xs'
                  : idx < currentPlayerIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pass device alert banner */}
      <div className="text-center space-y-2">
        <div
          className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-md border-4 border-white text-3xl ring-4 ring-indigo-500/10 animate-float"
          style={{ backgroundColor: currentPlayer.color }}
        >
          <span>{currentPlayer.avatar}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Cihazı <span className="underline decoration-indigo-500 decoration-wavy decoration-2" style={{ color: currentPlayer.color }}>{currentPlayer.name}</span> Oyuncusuna Verin
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto">
          Gizli kartınıza bakmadan önce diğer oyuncuların ekrandan uzaklaştığından emin olun!
        </p>
      </div>

      {/* Secret Card */}
      <div className="w-full relative">
        {!isRevealed ? (
          /* Locked Privacy Shield */
          <div
            id="card-privacy-shield"
            onClick={handleReveal}
            className="w-full aspect-[4/3] bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg border-2 border-slate-200 hover:border-indigo-400 transition-all transform hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:text-white group-hover:bg-indigo-600 transition-all shadow-xs mb-3">
              <Fingerprint className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Gizli Rolü Görmek İçin Dokunun</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Bu ekrana yalnızca <strong>{currentPlayer.name}</strong> bakmalıdır.
            </p>
            <div className="mt-4 px-4 py-2 rounded-full bg-slate-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs group-hover:bg-indigo-50">
              <Eye className="w-3.5 h-3.5" />
              <span>Kartı Aç & Oku</span>
            </div>
          </div>
        ) : (
          /* Revealed Card */
          <div
            id="card-revealed-content"
            className={`w-full aspect-[4/3] rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-xl border-2 transition-all animate-scale-in relative overflow-hidden ${
              isImposter
                ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-rose-200/50'
                : 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-indigo-200/50'
            }`}
          >
            {/* Confidential background watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-8xl font-black rotate-[-20deg]">
              {isImposter ? 'IMPOSTER' : 'CREW'}
            </div>

            {/* Top Tag */}
            <div className="w-full flex items-center justify-center text-xs font-bold z-10">
              <span
                className={`px-4 py-1.5 rounded-full font-black flex items-center gap-1.5 shadow-xs ${
                  isImposter
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isImposter ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>🔴 GİZLİ SAHTEKÂR (IMPOSTER)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>🟢 MASUM RESSAM (CREW)</span>
                  </>
                )}
              </span>
            </div>

            {/* Center Secret Word */}
            <div className="space-y-2 my-auto z-10">
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                {isImposter ? 'Gizli Durumun' : 'Gizli Kelimen'}
              </div>
              <div
                id="revealed-secret-word"
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  isImposter ? 'text-rose-700 animate-pulse' : 'text-indigo-900'
                }`}
              >
                {isImposter ? '🎭 SAHTEKÂRSIN!' : wordPair.crewWord}
              </div>
              <p className="text-xs text-slate-700 max-w-xs mx-auto leading-relaxed mt-2">
                {isImposter
                  ? 'Gizli kelimeyi bilmiyorsun! Diğer oyuncuların ne çizdiğini çaktırmadan taklit et ve kimseye yakalanma!'
                  : 'Sıran geldiğinde tek bir sürekli çizgi çiz. Kelimeyi bildiğini hissettir ama sahtekâra çok açık tüyo verme!'}
              </p>
            </div>

            {/* Hide button */}
            <button
              id="btn-hide-card"
              onClick={() => {
                playClickSound();
                setIsRevealed(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer z-10"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Kartı Tekrar Gizle</span>
            </button>
          </div>
        )}
      </div>

      {/* Next Player / Start Drawing Action */}
      <button
        id="btn-next-player-briefing"
        onClick={handleNextPlayer}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
      >
        <span>
          {isLastPlayer ? 'Herkes Hazır - Çizime Başla! 🎨' : 'Rolümü Ezberledim, Sıradakine Ver'}
        </span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
