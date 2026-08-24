import React, { useState } from 'react';
import { CodenamesTeam } from '../../types/codenames';
import { CodenamesCard } from '../../data/codenamesWords';
import { Lightbulb, Sparkles, Send, X, AlertCircle, RefreshCw } from 'lucide-react';
import { playClickSound, playClueGivenSound } from '../../utils/audio';
import { getApiUrl } from '../../utils/serverUrl';

import { t } from '../../i18n';
interface CodenamesClueInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTeam: CodenamesTeam;
  board: CodenamesCard[];
  onSubmitClue: (word: string, count: number) => void;
}

export function CodenamesClueInputModal({
  isOpen,
  onClose,
  activeTeam,
  board,
  onSubmitClue,
}: CodenamesClueInputModalProps) {
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState<number>(2);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isRed = activeTeam === 'red';

  const validateAndSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const clean = clueWord.trim().toUpperCase();
    if (!clean) {
      setErrorMessage('Lütfen bir ipucu kelimesi yazın.');
      return;
    }

    if (clean.includes(' ')) {
      setErrorMessage('İpucu yalnızca TEK BİR kelimeden oluşmalıdır (boşluk içeremez).');
      return;
    }

    // Check if word is literally on the board
    const boardWords = board.map((c) => c.word.toUpperCase());
    if (boardWords.includes(clean)) {
      setErrorMessage(`"${clean}" panoda zaten bulunan bir kelimedir! Farklı bir ipucu seçin.`);
      return;
    }

    playClueGivenSound();
    onSubmitClue(clean, clueCount);
    onClose();
  };

  const handleFetchAiClue = async () => {
    setIsAiLoading(true);
    setErrorMessage('');
    playClickSound();

    try {
      // Gather unrevealed cards for context
      const teamCards = board.filter((c) => !c.revealed && c.type === activeTeam).map((c) => c.word);
      const enemyTeam = activeTeam === 'red' ? 'blue' : 'red';
      const enemyCards = board.filter((c) => !c.revealed && c.type === enemyTeam).map((c) => c.word);
      const assassinCard = board.find((c) => !c.revealed && c.type === 'assassin')?.word || '';
      const bystanderCards = board.filter((c) => !c.revealed && c.type === 'neutral').map((c) => c.word);

      const res = await fetch(getApiUrl('/api/codenames/ai-clue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTeam,
          teamCards,
          enemyCards,
          bystanderCards,
          assassinCard,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.clueWord) {
          setClueWord(data.clueWord.toUpperCase());
          if (data.clueCount) setClueCount(Number(data.clueCount));
          return;
        }
      }

      // Fallback local generator heuristic if backend offline or no key
      const fallbackClues = [
        { word: 'GİZEMLİ', count: 2 },
        { word: 'MACERA', count: 2 },
        { word: 'STRATEJİ', count: 2 },
        { word: 'SİSTEM', count: 3 },
        { word: 'EVRENSEL', count: 2 },
      ];
      const picked = fallbackClues[Math.floor(Math.random() * fallbackClues.length)];
      setClueWord(picked.word);
      setClueCount(picked.count);
    } catch (err) {
      setErrorMessage('AI ipucu alınamadı. Manuel olarak ipucunuzu yazabilirsiniz.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      id="codenames-clue-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col space-y-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white ${
                isRed ? 'bg-rose-600' : 'bg-blue-600'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                {isRed ? '🔴 Kırmızı Lider İpucu Formu' : '🔵 Mavi Lider İpucu Formu'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('Sahadaki ajanlarınıza yön verin')}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={validateAndSubmit} className="space-y-4">
          {/* Clue Word Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('1. İpucu Kelimesi (Tek Kelime):')}</label>
              <button
                type="button"
                onClick={handleFetchAiClue}
                disabled={isAiLoading}
                className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-200 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900 transition-all cursor-pointer"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                )}
                <span>{t('AI İpucu Öner')}</span>
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={clueWord}
              onChange={(e) => {
                setClueWord(e.target.value);
                setErrorMessage('');
              }}
              placeholder={t('Örn: ORMAN, TEKNOLOJİ, SİNEMA...')}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-600 rounded-2xl px-4 py-3 text-base font-black text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden uppercase tracking-wider"
            />
          </div>

          {/* Number of Cards Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              {t('2. İlişkili Kart Sayısı:')}</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setClueCount(num);
                  }}
                  className={`py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer border ${
                    clueCount === num
                      ? isRed
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs scale-105'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Help Tip */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <span>{t('💡 Kural Hatırlatması:')}</span>
            </div>
            <p className="leading-relaxed">
              Saha ajanlarınız <strong>{clueCount + 1}</strong> defaya kadar tahmin yapabilecek (seçtiğiniz sayı + 1 bonus hak).
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!clueWord.trim()}
            className={`w-full py-3.5 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50 ${
              isRed
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/20'
                : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-blue-600/20'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{t('İpucunu Ajanlara Gönder')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
