import React, { useState } from 'react';
import { Player, Stroke, RoundResult } from '../types';
import { CanvasBoard } from './CanvasBoard';
import { Sparkles, ShieldAlert, Send, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { playClickSound, playFanfareSound, playBuzzer } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ImposterGuessViewProps {
  imposter: Player;
  players: Player[];
  strokes: Stroke[];
  roundResult: RoundResult;
  onShowdownComplete: (guessedCorrectly: boolean, guessWord: string) => void;
}

export const ImposterGuessView: React.FC<ImposterGuessViewProps> = ({
  imposter,
  players,
  strokes,
  roundResult,
  onShowdownComplete,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const cleanString = (str: string) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const handleSubmitGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guessInput.trim() || hasSubmitted) return;

    playClickSound();
    setHasSubmitted(true);

    const actualClean = cleanString(roundResult.crewWord);
    const guessClean = cleanString(guessInput);

    // Generous substring / equality matching
    const matches =
      actualClean === guessClean ||
      (guessClean.length >= 3 && actualClean.includes(guessClean)) ||
      (actualClean.length >= 3 && guessClean.includes(actualClean));

    setIsCorrect(matches);

    if (matches) {
      playFanfareSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      playBuzzer();
    }
  };

  const handleFinish = () => {
    playClickSound();
    onShowdownComplete(isCorrect, guessInput.trim());
  };

  return (
    <div id="imposter-guess-view" className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-fade-in text-slate-900">
      {/* Dramatic Alert Header */}
      <div className="bg-rose-50 rounded-3xl p-6 sm:p-7 text-center border-2 border-rose-300 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider border border-rose-200">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Sahtekâr Yakalandı! Son Çalma Girişimi</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          <span style={{ color: imposter.color }}>{imposter.name}</span>, Gizli Kelimeyi Tahmin Edebilir Misin?
        </h2>

        <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
          Ressamlar seni tespit etti! Fakat diğerlerinin ne çizdiğini doğru tahmin edebilirsen tüm puanları çalar ve <strong className="text-amber-700">KAZANIRSIN!</strong>
        </p>
      </div>

      {/* Mini Artwork Preview */}
      <div className="max-w-md mx-auto">
        <CanvasBoard
          strokes={strokes}
          players={players}
          isDrawingEnabled={false}
          className="scale-90"
        />
      </div>

      {/* Guessing Form */}
      {!hasSubmitted ? (
        <form onSubmit={handleSubmitGuess} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-3.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Masum Ressamların Gizli Kelimesini Tahmin Edin:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="input-imposter-guess"
              value={guessInput}
              autoFocus
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="Örn: Pizza, Fil, Uçak, Kahve..."
              className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-2xl px-4 py-3 text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              id="btn-submit-imposter-guess"
              disabled={!guessInput.trim()}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 text-white font-black rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Tahmin Et</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            İpucu: Yukarıdaki tuvaldeki çizgi ve formları dikkatlice inceleyin.
          </p>
        </form>
      ) : (
        <div className={`p-6 rounded-3xl text-center space-y-4 border-2 shadow-xl animate-scale-in ${
          isCorrect
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex justify-center">
            {isCorrect ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
            ) : (
              <XCircle className="w-16 h-16 text-rose-600" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-black">
              {isCorrect ? 'HARİKA! DOĞRU TAHMİN ETTİN!' : 'YANLIŞ TAHMİN!'}
            </h3>
            <p className="text-sm text-slate-700">
              Senin Tahminin: <strong className="text-slate-900">"{guessInput}"</strong> • Gerçek Kelime: <strong className="text-emerald-700">"{roundResult.crewWord}"</strong>
            </p>
          </div>

          <button
            id="btn-finish-imposter-showdown"
            onClick={handleFinish}
            className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <span>Sonuçları Görüntüle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
