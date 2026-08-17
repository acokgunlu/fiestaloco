import React from 'react';
import { X, Palette, EyeOff, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="rules-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="rules-modal-content"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
              ?
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Sahtekâr Ressam (Imposter Line) Rehberi</h2>
              <p className="text-xs text-slate-300">3-8 Oyunculu Gizli Çizim & Blöf Oyunu</p>
            </div>
          </div>
          <button
            id="btn-close-rules"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body rules */}
        <div className="p-6 space-y-4 text-slate-700 text-sm max-h-[75vh] overflow-y-auto">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-indigo-600" />
                The Secret Words
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Everyone is secretly shown the <span className="font-semibold text-indigo-700">SAME secret word</span> (e.g. <em>"Cat"</em>).
                Except <strong>1 Imposter</strong> who secretly receives a <span className="font-semibold text-rose-600">DIFFERENT related word</span> (e.g. <em>"Fox"</em>) or is a blind imposter!
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-600" />
                Draw Exactly ONE Continuous Line
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                In turns, each player draws <strong>ONE single unbroken stroke</strong> on the shared canvas in their assigned color.
                Once you lift your finger/mouse, your turn is done! (Usually 2 strokes per player per game).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                The Bluff Strategy
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <strong>Innocent Crew:</strong> Draw enough to prove you know the word, but don't draw too much or you'll give the exact word away to the Imposter!
                <br />
                <strong>The Imposter:</strong> Bluff along, follow the general shape, and try not to get caught!
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-rose-600" />
                Discussion, Voting & The Guess
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                After drawing, everyone discusses and votes for who they think is the Imposter.
                <br />
                • If the innocent crew votes wrong, the <strong>Imposter wins (+100 pts)</strong>!
                <br />
                • If the crew catches the Imposter, the Imposter gets <strong>ONE LAST CHANCE</strong> to guess the Crew's real word! If the Imposter guesses correctly, they steal the victory!
              </p>
            </div>
          </div>
        </div>

        {/* Footer button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="btn-got-it-rules"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
