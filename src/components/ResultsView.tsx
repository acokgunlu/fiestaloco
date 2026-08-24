import React, { useEffect } from 'react';
import { Player, Stroke, RoundResult } from '../types';
import { CanvasBoard } from './CanvasBoard';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Play,
  Award,
  CheckCircle2,
  Target,
  Crown,
  Medal,
  Flame,
  Zap,
} from 'lucide-react';
import { playFanfareSound, playClickSound, playTurnSound, playLevelUpSound } from '../utils/audio';
import confetti from 'canvas-confetti';

import { t } from '../i18n';
interface ResultsViewProps {
  players: Player[];
  strokes: Stroke[];
  roundResult: RoundResult;
  currentRoundNumber: number;
  onNextRound: () => void;
  onBackToLobby: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  players,
  strokes,
  roundResult,
  currentRoundNumber,
  onNextRound,
  onBackToLobby,
}) => {
  const imposter = players.find((p) => p.id === roundResult.imposterId) || players[0];
  const imposterWon = roundResult.imposterWon;
  const correctVoters = (roundResult.correctVoterIds || [])
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  useEffect(() => {
    playFanfareSound();
    playLevelUpSound();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.4 },
    });
  }, []);

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Top 3 players for podium
  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];

  return (
    <div id="results-view" className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-5 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Victory Header Game-Show Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-center shadow-xl border-2 transition-all relative overflow-hidden ${
          imposterWon
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-rose-200/50'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-emerald-200/50'
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider mb-2.5 shadow-xs border border-slate-200 dark:border-slate-800">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Tur {currentRoundNumber} Büyük Yüzleşme</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {imposterWon ? t('🎭 SAHTEKÂR ZAFERİ!') : '🎉 MASUM RESSAMLAR KAZANDI!'}
        </h2>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-lg mx-auto mt-2 leading-relaxed font-medium">
          {imposterWon
            ? roundResult.imposterGuessedCorrectly
              ? `${imposter.name} yakalandı fakat gizli kelimeyi ("${roundResult.crewWord}") bilerek zaferi kaptı!`
              : `Ressamlar yanlış kişiyi oyladı! ${imposter.name} gizlice aralarında süzülmeyi başardı!`
            : `Ressamlar Sahtekâr ${imposter.name}'ı başarıyla teşhis etti ve gizli kelimelerini korudu!`}
        </p>

        {/* Word Reveal Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-left shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
              {t('Gizli Kelime (Word)')}</span>
            <span className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">{roundResult.crewWord}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-left shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block">
              {t('Sahtekâr Ressam (Imposter)')}</span>
            <span className="text-lg sm:text-2xl font-black text-rose-700 dark:text-rose-300">{imposter.name}</span>
          </div>
        </div>
      </div>

      {/* 3D-Style Winner Podium for Top 3 Players */}
      {sortedPlayers.length >= 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="text-center mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>{t('Oyun Kürsüsü (Podium)')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('Genel puan durumunda zirveye yerleşen ressamlar')}</p>
          </div>

          <div className="flex items-end justify-center gap-2 sm:gap-4 pt-8 pb-2 max-w-md mx-auto">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex-1 flex flex-col items-center animate-fade-in">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-white mb-2 relative"
                  style={{ backgroundColor: top2.color }}
                >
                  <span className="absolute -top-3 -right-2 text-sm">🥈</span>
                  {top2.avatar}
                </div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate w-20 sm:w-24 text-center">
                  {top2.name}
                </div>
                <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">{top2.score} pts</div>
                <div className="w-full h-24 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl border-t-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-black text-lg shadow-xs">
                  2
                </div>
              </div>
            )}

            {/* 1st Place (Champion) */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center animate-podium-hop z-10">
                <Crown className="w-6 h-6 text-amber-500 mb-1 animate-bounce" />
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-4 border-amber-300 dark:border-amber-800 mb-2 relative"
                  style={{ backgroundColor: top1.color }}
                >
                  <span className="absolute -top-3 -right-2 text-lg">🥇</span>
                  {top1.avatar}
                </div>
                <div className="text-sm font-black text-amber-900 dark:text-amber-200 truncate w-24 sm:w-28 text-center">
                  {top1.name}
                </div>
                <div className="text-xs font-black text-amber-700 dark:text-amber-300 mb-1">{top1.score} pts</div>
                <div className="w-full h-36 bg-gradient-to-t from-amber-400 via-amber-300 to-yellow-200 rounded-t-2xl border-t-4 border-amber-400 flex items-center justify-center text-slate-900 dark:text-slate-100 font-black text-2xl shadow-md">
                  1
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex-1 flex flex-col items-center animate-fade-in">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-white mb-2 relative"
                  style={{ backgroundColor: top3.color }}
                >
                  <span className="absolute -top-3 -right-2 text-sm">🥉</span>
                  {top3.avatar}
                </div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate w-20 sm:w-24 text-center">
                  {top3.name}
                </div>
                <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1">{top3.score} pts</div>
                <div className="w-full h-16 bg-gradient-to-t from-amber-100 to-amber-50 rounded-t-2xl border-t-2 border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-300 font-black text-base shadow-xs">
                  3
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bonus Reward Badge for Correct Imposter Guessers (+50 pts) */}
      {correctVoters.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                {t('🎯 Sahtekârı Doğru Tespit Edenler (+50 Puan Bonus!)')}</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {t('Sahtekârı doğru oylayan dedektifler fazladan +50 puan kazandı:')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {correctVoters.map((voter) => (
              <div
                key={voter.id}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-2xs text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs text-white shadow-2xs"
                  style={{ backgroundColor: voter.color }}
                >
                  {voter.avatar}
                </span>
                <span>{voter.name}</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200 dark:border-emerald-900">
                  {t('+50 pts')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Artwork Showcase & Replay */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('Ortak Çizim Başyapıtı & Tekrarı')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('Çizimin nasıl oluştuğunu oynatın veya resim olarak indirin.')}</p>
          </div>

          <CanvasBoard
            strokes={strokes}
            players={players}
            isDrawingEnabled={false}
            showAttribution={true}
            allowReplay={true}
          />
        </div>

        {/* Right: Leaderboard & Points */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t('Tüm Oyuncular Puan Tablosu')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Toplam kazanılan puan sıralaması.')}</p>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {sortedPlayers.map((player, rank) => {
              const pointsEarned = roundResult.pointsAwarded[player.id] || 0;
              const isCurrentImposter = player.id === imposter.id;
              const votedImposter = (roundResult.correctVoterIds || []).includes(player.id);

              return (
                <div
                  key={player.id}
                  id={`score-row-${player.id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-sm text-slate-500 dark:text-slate-400">
                      {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-xs border border-white shrink-0"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {isCurrentImposter && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 font-black border border-rose-200 dark:border-rose-900">
                            {t('Sahtekâr')}</span>
                        )}
                        {votedImposter && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-black flex items-center gap-0.5 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>+50</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {player.colorName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-indigo-700 dark:text-indigo-300">{player.score} pts</div>
                    {pointsEarned > 0 && (
                      <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          id="btn-play-next-round"
          onClick={() => {
            playTurnSound();
            onNextRound();
          }}
          className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{t('SONRAKİ TURU OYNA 🚀')}</span>
        </button>

        <button
          id="btn-return-lobby-results"
          onClick={() => {
            playClickSound();
            onBackToLobby();
          }}
          className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('Oyuncu / Ayarları Değiştir')}</span>
        </button>
      </div>
    </div>
  );
};
