import React, { useEffect } from 'react';
import { CodenamesTeam, CodenamesClue } from '../../types/codenames';
import { CodenamesCard } from '../../data/codenamesWords';
import { Trophy, Skull, RotateCcw, ArrowRight, ShieldCheck, Award, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playFanfareSound, playAssassinSound, playClickSound } from '../../utils/audio';

interface CodenamesGameOverModalProps {
  winner: CodenamesTeam;
  winReason: 'all_agents_found' | 'assassin_triggered';
  board: CodenamesCard[];
  clues: CodenamesClue[];
  onPlayAgain: () => void;
  onReturnToHub: () => void;
}

export function CodenamesGameOverModal({
  winner,
  winReason,
  board,
  clues,
  onPlayAgain,
  onReturnToHub,
}: CodenamesGameOverModalProps) {
  const isRedWinner = winner === 'red';

  useEffect(() => {
    if (winReason === 'all_agents_found') {
      playFanfareSound();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: isRedWinner ? ['#ef4444', '#dc2626', '#f87171'] : ['#0284c7', '#2563eb', '#38bdf8'],
        });
      } catch {}
    } else {
      playAssassinSound();
    }
  }, [winner, winReason]);

  const redCount = board.filter((c) => c.type === 'red' && c.revealed).length;
  const blueCount = board.filter((c) => c.type === 'blue' && c.revealed).length;

  return (
    <div
      id="codenames-game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col space-y-6 animate-scale-in text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Victory Icon / Banner */}
        <div className="flex flex-col items-center space-y-3">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white ${
              isRedWinner
                ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/30'
                : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-blue-500/30'
            }`}
          >
            {winReason === 'assassin_triggered' ? (
              <Skull className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Trophy className="w-10 h-10 text-amber-300 animate-bounce" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700">
              {winReason === 'assassin_triggered' ? '☠️ Kara Suikastçı Vakası' : '🏆 Kusursuz İstihbarat Operasyonu'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {isRedWinner ? '🔴 KIRMIZI TAKIM KAZANDI!' : '🔵 MAVİ TAKIM KAZANDI!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {winReason === 'assassin_triggered'
                ? `Rakip takım panodaki Kara Suikastçı kartını açarak tuzağa düştü ve zaferi ${
                    isRedWinner ? 'Kırmızı Takım' : 'Mavi Takım'
                  }'a hediye etti!`
                : `${isRedWinner ? 'Kırmızı' : 'Mavi'} Takım sahadaki tüm gizli ajanlarını başarıyla ortaya çıkardı!`}
            </p>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Kırmızı Ajanlar</span>
            <div className="text-base sm:text-lg font-black text-rose-600">{redCount} Bulundu</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Mavi Ajanlar</span>
            <div className="text-base sm:text-lg font-black text-blue-600">{blueCount} Bulundu</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Toplam İpucu</span>
            <div className="text-base sm:text-lg font-black text-indigo-700">{clues.length} Tur</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            id="btn-codenames-play-again"
            onClick={() => {
              playClickSound();
              onPlayAgain();
            }}
            className={`flex-1 py-4 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
              isRedWinner
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/20'
                : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-blue-600/20'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>YENİ TUR BAŞLAT 🚀</span>
          </button>

          <button
            id="btn-codenames-return-hub"
            onClick={() => {
              playClickSound();
              onReturnToHub();
            }}
            className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-sm rounded-2xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Parti Kulübü</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
