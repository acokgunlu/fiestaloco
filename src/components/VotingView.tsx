import React, { useState, useEffect } from 'react';
import { Player, WordPair, RoundResult } from '../types';
import { ShieldAlert, Check, ArrowRight, Sparkles, Target, Gavel, Scale, AlertTriangle } from 'lucide-react';
import { playClickSound, playTurnSound, playSuspenseSound, playGongSound, playGavelSound } from '../utils/audio';

import { t } from '../i18n';
interface VotingViewProps {
  players: Player[];
  wordPair: WordPair;
  onVotesComplete: (result: Partial<RoundResult>) => void;
}

export const VotingView: React.FC<VotingViewProps> = ({
  players,
  wordPair,
  onVotesComplete,
}) => {
  // Pass-around ballot state
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>({}); // voterId -> targetPlayerId
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isTallying, setIsTallying] = useState(false);

  const currentVoter = players[currentVoterIndex];
  const isLastVoter = currentVoterIndex === players.length - 1;

  // Bot auto-vote logic
  useEffect(() => {
    if (currentVoter?.isBot && !isTallying) {
      const candidates = players.filter((p) => p.id !== currentVoter.id);
      const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
      const timer = setTimeout(() => {
        handleConfirmVote(randomTarget.id);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentVoterIndex, currentVoter?.isBot, isTallying]);

  const handleSelectCandidate = (targetId: string) => {
    if (targetId === currentVoter.id) return; // cannot vote for self
    playClickSound();
    setSelectedTargetId(targetId);
  };

  const handleConfirmVote = (targetId?: string) => {
    const chosen = targetId || selectedTargetId;
    if (!chosen) return;

    playGavelSound();
    const updatedVotes = { ...votes, [currentVoter.id]: chosen };
    setVotes(updatedVotes);
    setSelectedTargetId(null);

    if (isLastVoter) {
      // Begin tallying
      tallyVotes(updatedVotes);
    } else {
      setCurrentVoterIndex((prev) => prev + 1);
    }
  };

  const tallyVotes = (allVotes: Record<string, string>) => {
    setIsTallying(true);
    playSuspenseSound();

    setTimeout(() => {
      playGongSound();

      // Count votes
      const voteCounts: Record<string, number> = {};
      players.forEach((p) => (voteCounts[p.id] = 0));
      Object.values(allVotes).forEach((targetId) => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      });

      // Find player with most votes
      let highestVotes = -1;
      let votedPlayerId: string | null = null;

      Object.entries(voteCounts).forEach(([pId, count]) => {
        if (count > highestVotes) {
          highestVotes = count;
          votedPlayerId = pId;
        }
      });

      const imposter = players.find((p) => p.isImposter);
      const imposterId = imposter ? imposter.id : '';
      const wasImposterCaught = votedPlayerId === imposterId;

      // Detect players who correctly voted for the imposter
      const correctVoterIds = Object.entries(allVotes)
        .filter(([voterId, target]) => target === imposterId && voterId !== imposterId)
        .map(([voterId]) => voterId);

      onVotesComplete({
        votedPlayerId,
        wasImposterCaught,
        crewWord: wordPair.crewWord,
        imposterWord: wordPair.imposterWord,
        imposterId,
        correctVoterIds,
        votes: allVotes,
      });
    }, 2200);
  };

  if (isTallying) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-pulse">
        <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 mx-auto flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xl border-2 border-rose-200 dark:border-rose-900 ring-4 ring-rose-500/10">
          <Gavel className="w-12 h-12 animate-bounce text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {t('Mahkeme Kararı Bekleniyor...')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('Gizli oylar sayılıyor, Sahtekârın maskesi düşürülüyor!')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="voting-view"
      className="w-full max-w-lg mx-auto px-3 sm:px-4 py-5 flex flex-col items-center justify-center min-h-[68vh] space-y-4 animate-fade-in"
    >
      {/* Courtroom Progress Pill & Badge */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs">
          <Scale className="w-3.5 h-3.5 text-amber-500" />
          <span>Teşhis Odası • Sıra: {currentVoterIndex + 1} / {players.length}</span>
        </div>

        {/* Bonus reward badge */}
        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-black shadow-2xs">
          <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('Doğru Tahmine +50 Puan Bonus!')}</span>
        </div>
      </div>

      {/* Header with Spotlight on Voter */}
      <div className="text-center space-y-1">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-md border-2 border-white text-2xl mb-1 ring-4 ring-indigo-500/10"
          style={{ backgroundColor: currentVoter.color }}
        >
          <span>{currentVoter.avatar}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
          <span style={{ color: currentVoter.color }}>{currentVoter.name}</span>{t(', şüphelini seç!')}</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
          {t('Çizgisi sence en sahte olan kimdi? Şüphe duyduğun oyuncuyu işaretle.')}</p>
      </div>

      {/* Suspect Mugshot Lineup Grid */}
      <div className="w-full grid grid-cols-1 gap-2.5">
        {players.map((candidate) => {
          const isSelf = candidate.id === currentVoter.id;
          const isSelected = selectedTargetId === candidate.id;

          if (isSelf) return null; // Can't vote for self

          return (
            <button
              key={candidate.id}
              id={`vote-candidate-${candidate.id}`}
              onClick={() => handleSelectCandidate(candidate.id)}
              className={`relative p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/30 shadow-md transform scale-[1.02] text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs border-2 border-white shrink-0"
                  style={{ backgroundColor: candidate.color }}
                >
                  {candidate.avatar}
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                    <span>{candidate.name}</span>
                    {candidate.isBot && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                        {t('BOT')}</span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: candidate.color }}
                    />
                    <span>{candidate.colorName} Çizgileri</span>
                  </div>
                </div>
              </div>

              {/* Suspect Accused Stamp when selected */}
              {isSelected ? (
                <div className="animate-stamp-slam border-2 border-rose-500 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('ŞÜPHELİ!')}</span>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] font-mono">?</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit vote button */}
      <button
        id="btn-confirm-vote"
        onClick={() => handleConfirmVote()}
        disabled={!selectedTargetId}
        className="w-full py-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-40 disabled:hover:from-rose-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-1"
      >
        <Gavel className="w-5 h-5 text-amber-300" />
        <span>{isLastVoter ? 'Mahkeme Kararını Açıkla 🔨' : 'Oyu Damgala & Gönder'}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
