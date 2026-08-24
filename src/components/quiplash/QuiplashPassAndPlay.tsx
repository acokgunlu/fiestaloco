import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Flame,
  HelpCircle,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';
import {
  QuiplashPlayer,
  QuiplashMatchup,
  QuiplashPrompt,
} from '../../types/quiplash';
import { getRandomQuiplashPrompts, getRandomLastLashPrompt } from '../../data/quiplashPrompts';
import { DEFAULT_PLAYER_PALETTE } from '../../data/wordPacks';

import { t } from '../../i18n';
interface QuiplashPassAndPlayProps {
  onBackToHub: () => void;
  onOpenRules: () => void;
}

type LocalPhase =
  | 'SETUP'
  | 'PASS_DEVICE_WRITE'
  | 'WRITE_PROMPTS'
  | 'MATCHUP_VOTE'
  | 'MATCHUP_RESULT'
  | 'ROUND_SCORES'
  | 'GAME_OVER';

export const QuiplashPassAndPlay: React.FC<QuiplashPassAndPlayProps> = ({
  onBackToHub,
  onOpenRules,
}) => {
  const [phase, setPhase] = useState<LocalPhase>('SETUP');
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Oyuncu 1',
    'Oyuncu 2',
    'Oyuncu 3',
  ]);
  const [players, setPlayers] = useState<QuiplashPlayer[]>([]);
  const [currentWritingPlayerIdx, setCurrentWritingPlayerIdx] = useState<number>(0);
  const [isRevealedForWriting, setIsRevealedForWriting] = useState<boolean>(false);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});

  // Matchups
  const [matchups, setMatchups] = useState<QuiplashMatchup[]>([]);
  const [currentMatchupIndex, setCurrentMatchupIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = 2;

  // Add / remove player in setup
  const handleAddPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, `Oyuncu ${playerNames.length + 1}`]);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const handleStartGame = () => {
    const initialPlayers: QuiplashPlayer[] = playerNames.map((name, i) => {
      const pal = DEFAULT_PLAYER_PALETTE[i % DEFAULT_PLAYER_PALETTE.length];
      return {
        id: `p-${i}`,
        name: name.trim() || `Oyuncu ${i + 1}`,
        avatar: pal.avatar,
        color: pal.color,
        colorName: pal.name,
        score: 0,
        assignedPrompts: [],
        submittedPrompts: {},
      };
    });

    setPlayers(initialPlayers);
    setCurrentRound(1);
    startWritingRound(initialPlayers);
  };

  const startWritingRound = (roundPlayers: QuiplashPlayer[]) => {
    const count = Math.max(roundPlayers.length, 2);
    const prompts = getRandomQuiplashPrompts(count, 'all');

    const newMatchups: QuiplashMatchup[] = [];

    // Assign prompts circularly
    for (let i = 0; i < roundPlayers.length; i++) {
      const p1 = roundPlayers[i];
      const p2 = roundPlayers[(i + 1) % roundPlayers.length];
      const prompt = prompts[i % prompts.length];

      p1.assignedPrompts = p1.assignedPrompts || [];
      p2.assignedPrompts = p2.assignedPrompts || [];

      p1.assignedPrompts.push(prompt);
      p2.assignedPrompts.push(prompt);

      newMatchups.push({
        id: `m-${Date.now()}-${i}`,
        prompt,
        answer1: {
          playerId: p1.id,
          playerName: p1.name,
          playerAvatar: p1.avatar,
          text: '',
          votes: [],
        },
        answer2: {
          playerId: p2.id,
          playerName: p2.name,
          playerAvatar: p2.avatar,
          text: '',
          votes: [],
        },
      });
    }

    setMatchups(newMatchups);
    setCurrentWritingPlayerIdx(0);
    setIsRevealedForWriting(false);
    setCurrentAnswers({});
    setPhase('PASS_DEVICE_WRITE');
  };

  const handleSubmitPlayerWriting = () => {
    const currentPlayer = players[currentWritingPlayerIdx];
    if (currentPlayer) {
      currentPlayer.submittedPrompts = {
        ...(currentPlayer.submittedPrompts || {}),
        ...currentAnswers,
      };

      // Populate matchups
      matchups.forEach((m) => {
        if (m.answer1.playerId === currentPlayer.id && currentAnswers[m.prompt.id]) {
          m.answer1.text = currentAnswers[m.prompt.id];
        }
        if (m.answer2.playerId === currentPlayer.id && currentAnswers[m.prompt.id]) {
          m.answer2.text = currentAnswers[m.prompt.id];
        }
      });
    }

    if (currentWritingPlayerIdx + 1 < players.length) {
      setCurrentWritingPlayerIdx(currentWritingPlayerIdx + 1);
      setIsRevealedForWriting(false);
      setCurrentAnswers({});
      setPhase('PASS_DEVICE_WRITE');
    } else {
      // All players finished writing! Start first matchup
      setCurrentMatchupIndex(0);
      setPhase('MATCHUP_VOTE');
    }
  };

  const handleVoteInMatchup = (ansIdx: 1 | 2) => {
    const m = matchups[currentMatchupIndex];
    if (!m) return;

    if (ansIdx === 1) {
      m.answer1.votes.push('voter');
    } else {
      m.answer2.votes.push('voter');
    }

    // Single device quick resolution: award points & show result
    const roundMultiplier = currentRound === 2 ? 2 : 1;
    const ptsPerVote = 150 * roundMultiplier;

    m.answer1.pointsEarned = m.answer1.votes.length * ptsPerVote;
    m.answer2.pointsEarned = m.answer2.votes.length * ptsPerVote;

    // Quiplash sweep
    if (m.answer1.votes.length > 0 && m.answer2.votes.length === 0) {
      m.answer1.isQuiplash = true;
      m.answer1.pointsEarned += 400 * roundMultiplier;
    } else if (m.answer2.votes.length > 0 && m.answer1.votes.length === 0) {
      m.answer2.isQuiplash = true;
      m.answer2.pointsEarned += 400 * roundMultiplier;
    }

    const p1 = players.find((pl) => pl.id === m.answer1.playerId);
    if (p1) p1.score += m.answer1.pointsEarned || 0;

    const p2 = players.find((pl) => pl.id === m.answer2.playerId);
    if (p2) p2.score += m.answer2.pointsEarned || 0;

    setPhase('MATCHUP_RESULT');
  };

  const handleNextMatchup = () => {
    if (currentMatchupIndex + 1 < matchups.length) {
      setCurrentMatchupIndex(currentMatchupIndex + 1);
      setPhase('MATCHUP_VOTE');
    } else {
      setPhase('ROUND_SCORES');
    }
  };

  const handleNextRoundOrEnd = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
      // Clear assigned prompts for next round
      players.forEach((p) => {
        p.assignedPrompts = [];
        p.submittedPrompts = {};
      });
      startWritingRound(players);
    } else {
      setPhase('GAME_OVER');
    }
  };

  const currentActiveMatchup = matchups[currentMatchupIndex];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 text-slate-900 dark:text-slate-100 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all cursor-pointer"
          >
            {t('← Parti Arenası')}</button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 flex items-center justify-center text-white text-lg">
              🥊
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                {t('QUIPLASH')}</h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block -mt-0.5">
                {t('Tek Cihaz (Pass & Play)')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenRules}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
          title={t('Kurallar')}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </header>

      {/* Main Area */}
      <main className="flex flex-col justify-center items-center py-2 w-full">
        {/* ============================================================ */}
        {/* 1. SETUP                                                     */}
        {/* ============================================================ */}
        {phase === 'SETUP' && (
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
                {t('OYUNCU AYARLARI')}</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{t('Oyuncuları Belirleyin')}</h2>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0">
                    {DEFAULT_PLAYER_PALETTE[i % DEFAULT_PLAYER_PALETTE.length].avatar}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const updated = [...playerNames];
                      updated[i] = e.target.value;
                      setPlayerNames(updated);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-sm"
                  />
                  {playerNames.length > 2 && (
                    <button
                      onClick={() => handleRemovePlayer(i)}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs hover:bg-rose-500/30"
                    >
                      {t('Sil')}</button>
                  )}
                </div>
              ))}
            </div>

            {playerNames.length < 8 && (
              <button
                onClick={handleAddPlayer}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-dashed border-slate-700"
              >
                {t('+ Oyuncu Ekle')}</button>
            )}

            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              {t('Oyunu Başlat')}</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. PASS DEVICE                                               */}
        {/* ============================================================ */}
        {phase === 'PASS_DEVICE_WRITE' && (
          <div className="w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
            <div
              className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl"
              style={{
                backgroundColor: players[currentWritingPlayerIdx]?.color || '#8b5cf6',
              }}
            >
              {players[currentWritingPlayerIdx]?.avatar || '🥊'}
            </div>

            <div>
              <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
                {t('CİHAZI DEVREDİN')}</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                Sıra: {players[currentWritingPlayerIdx]?.name}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                {t('Diğer oyuncular ekrana bakmasın! Yalnızca sıradaki oyuncu butona bassın.')}</p>
            </div>

            <button
              onClick={() => {
                setIsRevealedForWriting(true);
                setPhase('WRITE_PROMPTS');
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-base shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              {t('Ben Hazırım, Soruları Göster')}</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. WRITE PROMPTS                                             */}
        {/* ============================================================ */}
        {phase === 'WRITE_PROMPTS' && isRevealedForWriting && (
          <div className="w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-pink-400">
                {players[currentWritingPlayerIdx]?.name} İçin Sorular
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Oyuncu {currentWritingPlayerIdx + 1} / {players.length}
              </span>
            </div>

            {(players[currentWritingPlayerIdx]?.assignedPrompts || []).map((prompt, i) => (
              <div key={prompt.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-purple-400 uppercase">
                  Soru #{i + 1}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">"{prompt.prompt}"</p>
                <input
                  type="text"
                  value={currentAnswers[prompt.id] || ''}
                  onChange={(e) =>
                    setCurrentAnswers({ ...currentAnswers, [prompt.id]: e.target.value })
                  }
                  placeholder={t('En komik yanıtını yaz...')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}

            <button
              onClick={handleSubmitPlayerWriting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {t('Tamamla ve Sıradakine Geç')}</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. MATCHUP VOTE                                              */}
        {/* ============================================================ */}
        {phase === 'MATCHUP_VOTE' && currentActiveMatchup && (
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
            <span className="text-xs font-black uppercase tracking-widest text-pink-400">
              KAPIŞMA #{currentMatchupIndex + 1} / {matchups.length}
            </span>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-500/30">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                "{currentActiveMatchup.prompt.prompt}"
              </p>
            </div>

            <p className="text-xs text-slate-400 font-bold">
              {t('Masa olarak en komik bulduğunuz seçeneğe tıklayın:')}</p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleVoteInMatchup(1)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border-2 border-slate-300 dark:border-slate-700 hover:border-cyan-400 text-left transition-all group"
              >
                <span className="text-[10px] font-black uppercase text-cyan-400 block mb-1">
                  {t('SEÇENEK A')}</span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  "{currentActiveMatchup.answer1.text || '...'}"
                </p>
              </button>

              <button
                onClick={() => handleVoteInMatchup(2)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/60 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-400 text-left transition-all group"
              >
                <span className="text-[10px] font-black uppercase text-rose-400 block mb-1">
                  {t('SEÇENEK B')}</span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  "{currentActiveMatchup.answer2.text || '...'}"
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. MATCHUP RESULT                                            */}
        {/* ============================================================ */}
        {phase === 'MATCHUP_RESULT' && currentActiveMatchup && (
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              {t('KAPIŞMA SONUCU')}</span>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-2xl border ${
                  currentActiveMatchup.answer1.votes.length > 0
                    ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-400/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-xs font-black text-slate-300 block mb-1">
                  {currentActiveMatchup.answer1.playerName}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  "{currentActiveMatchup.answer1.text}"
                </p>
                <span className="text-xs font-extrabold text-cyan-400">
                  +{currentActiveMatchup.answer1.pointsEarned || 0} Pts
                </span>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  currentActiveMatchup.answer2.votes.length > 0
                    ? 'bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-xs font-black text-slate-300 block mb-1">
                  {currentActiveMatchup.answer2.playerName}
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  "{currentActiveMatchup.answer2.text}"
                </p>
                <span className="text-xs font-extrabold text-rose-400">
                  +{currentActiveMatchup.answer2.pointsEarned || 0} Pts
                </span>
              </div>
            </div>

            <button
              onClick={handleNextMatchup}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-base shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>{t('Sonraki Kapışma')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. ROUND SCORES                                              */}
        {/* ============================================================ */}
        {phase === 'ROUND_SCORES' && (
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
            <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
              TUR {currentRound} SKORLARI
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('Liderlik Tablosu')}</h2>

            <div className="space-y-2.5">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-400">#{i + 1}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</span>
                    </div>
                    <span className="text-base font-black text-amber-400">{p.score} Puan</span>
                  </div>
                ))}
            </div>

            <button
              onClick={handleNextRoundOrEnd}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              {currentRound < totalRounds ? t('Sonraki Tura Geç (2x Puan)') : t('Oyun Sonucunu Gör')}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. GAME OVER                                                 */}
        {/* ============================================================ */}
        {phase === 'GAME_OVER' && (
          <div className="w-full p-8 rounded-3xl bg-slate-900 border border-amber-400/50 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-4xl mx-auto animate-bounce">
              👑
            </div>

            <div>
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                {t('OYUN BİTTİ')}</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{t('Şampiyon')}</h2>
            </div>

            {(() => {
              const winner = [...players].sort((a, b) => b.score - a.score)[0];
              return (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-400/40">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{winner?.name}</h3>
                  <span className="text-xl font-black text-amber-400">
                    {winner?.score || 0} Toplam Puan
                  </span>
                </div>
              );
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setPhase('SETUP')}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm hover:scale-105 transition-all"
              >
                {t('Yeniden Oyna')}</button>
              <button
                onClick={onBackToHub}
                className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700"
              >
                {t('Menü')}</button>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-2">
        {t('FiestaLoco • Quiplash Pass & Play')}</footer>
    </div>
  );
};
