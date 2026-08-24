import React from 'react';
import {
  TriviaPursuitGameState,
  TriviaPursuitPlayer,
  TRIVIA_CATEGORIES,
  TriviaCategory,
  TriviaBoardPosition,
} from '../../types/triviaPursuit';
import { TriviaWedgePie } from './TriviaWedgePie';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Flame,
  HelpCircle,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { motion } from 'motion/react';
import { playClickSound, playTurnSound } from '../../utils/audio';

import { t } from '../../i18n';
interface TriviaControllerViewProps {
  roomCode: string;
  myPlayer: TriviaPursuitPlayer | null;
  gameState: TriviaPursuitGameState;
  players: TriviaPursuitPlayer[];
  myAnswerSubmitted: string | null;
  onSubmitAnswer: (answer: string) => void;
  onSpinWheel: () => void;
  onRollDie: () => void;
  onPickMove: (to: TriviaBoardPosition) => void;
  onSelectCategory: (cat: TriviaCategory) => void;
}

export const TriviaControllerView: React.FC<TriviaControllerViewProps> = ({
  roomCode,
  myPlayer,
  gameState,
  players,
  myAnswerSubmitted,
  onSubmitAnswer,
  onSpinWheel,
  onRollDie,
  onPickMove,
  onSelectCategory,
}) => {
  const activePlayer = players[gameState.activePlayerIndex];
  const isMyTurn = myPlayer && activePlayer && myPlayer.id === activePlayer.id;
  /** Zar atildi, hedef bekleniyor. */
  const waitingForMove = (gameState.moveOptions?.length || 0) > 0;
  /** Merkezdeysen zar atmazsin — sira dogrudan final sorusudur. */
  const onHub = gameState.boardPositions?.[myPlayer?.id || '']?.track === 'hub';
  const currentQ = gameState.currentQuestion;
  const currentCat = currentQ ? TRIVIA_CATEGORIES[currentQ.category] : null;

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  const handleSubmit = (opt: string) => {
    if (myAnswerSubmitted) return;
    playClickSound();
    onSubmitAnswer(opt);
  };

  return (
    <div
      id="trivia-controller-container"
      className="w-full max-w-md mx-auto min-h-[600px] flex flex-col justify-between p-4 space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in select-none"
    >
      {/* Player Profile & Stats Top Header */}
      <div className="flex items-center justify-between p-3.5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xs text-white"
            style={{ backgroundColor: myPlayer?.color || '#10b981' }}
          >
            {myPlayer?.avatar || '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[130px]">
                {myPlayer?.name || 'Oyuncu'}
              </span>
              {isMyTurn && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse">
                  {t('SENİN SIRAN')}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                {myPlayer?.score || 0} Puan
              </span>
              {(myPlayer?.streak || 0) > 1 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5" />
                  {myPlayer?.streak}x Seri
                </span>
              )}
            </div>
          </div>
        </div>

        {/* My Wedges Pie */}
        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <TriviaWedgePie wedges={myPlayer?.wedges || []} size={34} />
          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 mt-1">
            {myPlayer?.wedges.length || 0}/6 Rozet
          </span>
        </div>
      </div>

      {/* Main Controller Interactive Stage */}
      <main className="my-auto py-2 flex flex-col items-center justify-center w-full">
        {/* LOBBY PHASE */}
        {gameState.phase === 'LOBBY' && (
          <div className="w-full text-center space-y-4 py-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center mx-auto text-3xl">
              🎮
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('Odaya Bağlandınız!')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto font-medium">
              Oda Kodu: <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{roomCode}</span>. TV ekranından oyunun başlaması bekleniyor...
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
              <p className="font-black text-emerald-700 dark:text-emerald-300">{t('🎯 Oyun Hedefi:')}</p>
              <p className="text-slate-600 dark:text-slate-300">
                {t('Sıranız gelince zarı atıp tahtada ilerleyin. Rozet yalnızca KALE karelerinde kazanılır; 6 rozeti toplayıp merkeze ulaşan şampiyon olur!')}</p>
            </div>
          </div>
        )}

        {/* WHEEL SPIN PHASE */}
        {gameState.phase === 'WHEEL_SPIN' && (
          <div className="w-full space-y-5 text-center bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            {/* Tahta modu: cark yok, ZAR var. Hamleyi de telefondan seciyoruz —
                TV'ye uzanmak gerekmesin. Secenekleri sunucu uretiyor. */}
            {isMyTurn ? (
              waitingForMove ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-3xl font-black shadow-md">
                      {gameState.dieRoll}
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{t('geldi!')}</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {t('Nereye gideceğini seç')}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(gameState.moveOptions || []).map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          playClickSound();
                          onPickMove(opt.to);
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-base shadow-lg active:scale-95 transition-transform cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-black">
                    {onHub ? 'Merkezdesin! Final sorusunu cevapla.' : t('Sıra sende! Zarı at ve tahtada ilerle.')}
                  </div>

                  <button
                    id="btn-controller-roll-die"
                    onClick={() => {
                      playTurnSound();
                      onRollDie();
                    }}
                    className="w-full py-8 rounded-3xl font-black text-xl tracking-wider text-white shadow-xl transition-all transform active:scale-95 flex flex-col items-center justify-center gap-2 border-3 border-amber-300 dark:border-amber-500 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 hover:scale-[1.02] cursor-pointer"
                  >
                    <span className="text-4xl">{onHub ? '🏆' : '🎲'}</span>
                    <span>{onHub ? t('FİNAL SORUSU!') : 'ZAR AT!'}</span>
                  </button>
                </div>
              )
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center mx-auto text-3xl">
                  🎲
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                  {activePlayer?.name || t('Sıradaki oyuncu')} zar atıyor…
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {t('Sırası gelince telefonunda zar butonu çıkacak.')}</p>
              </div>
            )}
          </div>
        )}

        {/* QUESTION ACTIVE PHASE */}
        {gameState.phase === 'QUESTION_ACTIVE' && currentQ && currentCat && (
          <div className="w-full space-y-4">
            {/* Category Banner & Timer */}
            <div className="flex items-center justify-between">
              <div
                className="px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-xs"
                style={{
                  backgroundColor: `${currentCat.color}20`,
                  borderColor: currentCat.color,
                  color: currentCat.color,
                }}
              >
                <span>{currentCat.icon}</span>
                <span className="uppercase tracking-wider">{currentCat.label}</span>
                {currentQ.isWedgeQuestion && (
                  <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
                    {t('ROZET')}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-white">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{gameState.timerSeconds}s</span>
              </div>
            </div>

            {/* Question Text in phone controller */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {currentQ.question}
              </p>
            </div>

            {/* 4 Interactive Choice Buttons (A, B, C, D) */}
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = myAnswerSubmitted === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(option)}
                    disabled={!!myAnswerSubmitted}
                    className={`w-full p-3.5 rounded-2xl flex items-center gap-3 text-left font-bold text-sm transition-all border-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-300/40 shadow-lg scale-102'
                        : myAnswerSubmitted
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs active:scale-98'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected
                          ? 'bg-white text-emerald-700 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {OPTION_LETTERS[idx]}
                    </div>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })}
            </div>

            {myAnswerSubmitted && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-0.5">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('Cevabınız iletildi!')}</span>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {t('TV ekranında turun bitmesini bekleyin...')}</p>
              </div>
            )}
          </div>
        )}

        {/* ANSWER REVEAL PHASE */}
        {gameState.phase === 'ANSWER_REVEAL' && currentQ && currentCat && (
          <div className="w-full space-y-4 text-center bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            {myAnswerSubmitted === currentQ.correctAnswer ? (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl animate-bounce">
                  ✨
                </div>
                <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {t('HARİKA! DOĞRU CEVAP')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">{t('+100 Puan Kazandınız!')}</p>
                {gameState.lastRoundAnswerSummary?.playerAnswers[myPlayer?.id || '']?.earnedWedge && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black animate-pulse">
                    <Award className="w-4 h-4" />
                    <span>{currentCat.label} ROZETİ KAZANDINIZ!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950 border-2 border-rose-500 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-3xl">
                  ❌
                </div>
                <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {t('YANLIŞ CEVAP')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Doğru cevap:{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{currentQ.correctAnswer}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* GAME OVER PHASE */}
        {gameState.phase === 'GAME_OVER' && (
          <div className="w-full text-center space-y-4 py-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 text-3xl flex items-center justify-center mx-auto border-2 border-amber-400">
              🏆
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('Oyun Bitti!')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('Şampiyon:')} <span className="font-black text-slate-900 dark:text-white">{players.find((p) => p.id === gameState.winnerPlayerId)?.name}</span>
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Puanınız:')}</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{myPlayer?.score || 0}P</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="text-center text-[10px] text-slate-400 font-bold">
        {t('FiestaLoco • Mobil Kumanda')}</footer>
    </div>
  );
};
