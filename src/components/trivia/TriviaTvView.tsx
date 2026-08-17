import React, { useState } from 'react';
import {
  TriviaPursuitGameState,
  TriviaPursuitPlayer,
  TRIVIA_CATEGORIES,
  TriviaCategory,
  TriviaBoardPosition,
} from '../../types/triviaPursuit';
import { TriviaWedgePie } from './TriviaWedgePie';
import { TriviaCategoryWheel } from './TriviaCategoryWheel';
import { TriviaBoard } from './TriviaBoard';
import {
  Trophy,
  Users,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  QrCode,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toggleSound, isSoundEnabled, playClickSound, playWinSound, playTurnSound } from '../../utils/audio';

interface TriviaTvViewProps {
  roomCode: string;
  gameState: TriviaPursuitGameState;
  players: TriviaPursuitPlayer[];
  onStartGame: () => void;
  onSpinWheel: () => void;
  onRollDie: () => void;
  onPickMove: (to: TriviaBoardPosition) => void;
  onSelectCategory: (cat: TriviaCategory) => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  onGenerateAiQuestions: () => void;
  isGeneratingAi?: boolean;
}

export const TriviaTvView: React.FC<TriviaTvViewProps> = ({
  roomCode,
  gameState,
  players,
  onStartGame,
  onSpinWheel,
  onRollDie,
  onPickMove,
  onSelectCategory,
  onNextRound,
  onRestartGame,
  onGenerateAiQuestions,
  isGeneratingAi,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [showQr, setShowQr] = useState(false);

  const activePlayer = players[gameState.activePlayerIndex] || players[0];
  const currentQ = gameState.currentQuestion;
  const currentCat = currentQ ? TRIVIA_CATEGORIES[currentQ.category] : null;

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?game=trivia_pursuit&room=${roomCode}`
    : `?room=${roomCode}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    joinUrl
  )}&bgcolor=ffffff&color=0f172a&margin=1`;

  const handleToggleSound = () => {
    const updated = toggleSound();
    setSoundOn(updated);
    if (updated) playClickSound();
  };

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  return (
    <div
      id="trivia-tv-view"
      className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-3 border-emerald-100 dark:border-slate-800 shadow-xl space-y-6 text-slate-900 dark:text-slate-100 transition-colors duration-200"
    >
      {/* Top TV Host Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-2xl border-2 border-white dark:border-slate-700">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Trivia Pursuit TV
              </h2>
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ANA EKRAN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              Tur {gameState.roundNumber || 1} • Hedef: {gameState.settings.wedgesToWin || 6} Kategori Rozeti
            </p>
          </div>
        </div>

        {/* Room Code & Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQr(!showQr)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-black transition-all cursor-pointer shadow-xs"
            title="Telefon Bağlantı QR Kodu"
          >
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Katıl:</span>
            <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300 tracking-wider">
              {roomCode}
            </span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-all cursor-pointer"
            title="Ses Aç/Kapat"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowQr(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 border-2 border-emerald-400 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto text-2xl font-black">
                📱
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Telefondan Katıl</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Telefonunuzun kamerasıyla QR kodu okutun veya tarayıcınızdan oda kodunu girin.
              </p>
              <div className="flex justify-center p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img
                  src={qrImageUrl}
                  alt={`QR Code for ${roomCode}`}
                  className="w-48 h-48 rounded-xl shadow-inner"
                />
              </div>
              <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest bg-emerald-50 dark:bg-emerald-950 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {roomCode}
              </div>
              <button
                onClick={() => setShowQr(false)}
                className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Stage */}
      <main className="min-h-[420px] flex flex-col items-center justify-center w-full">
        {/* PHASE 1: LOBBY */}
        {gameState.phase === 'LOBBY' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: QR & Join Info */}
            <div className="lg:col-span-5 flex flex-col items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm text-center">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-400/40 mb-3 shadow-md">
                <img
                  src={qrImageUrl}
                  alt={`Join QR ${roomCode}`}
                  className="w-40 h-40 rounded-xl"
                />
              </div>
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">
                Oda Kodu
              </span>
              <span className="text-4xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">
                {roomCode}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-xs leading-relaxed">
                Telefonunuzun kamerası ile okutun veya <span className="font-mono font-black text-slate-900 dark:text-white">?room={roomCode}</span> ile katılın.
              </p>
            </div>

            {/* Right Column: Player Roster & Start Control */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                    <Users className="w-5 h-5 text-emerald-500" />
                    <span>Bağlı Oyuncular ({players.length})</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Kazanma: {gameState.settings.wedgesToWin} Rozet
                  </span>
                </div>

                {players.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-2">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Henüz oyuncu bağlanmadı...</p>
                    <p className="text-xs text-slate-500">
                      Telefonunuzla QR kodu okutun veya "Telefondan Katıl" sekmesini kullanın.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-xs text-white"
                          style={{ backgroundColor: p.color || '#3b82f6' }}
                        >
                          {p.avatar || '👤'}
                        </div>
                        <div className="truncate">
                          <p className="font-black text-sm text-slate-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {p.wedges.length}/6 Rozet
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Game & AI Question Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-tv-start-game"
                  onClick={() => {
                    playTurnSound();
                    onStartGame();
                  }}
                  disabled={players.length === 0}
                  className={`flex-1 py-4 px-6 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    players.length === 0
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>YARIŞMAYI BAŞLAT</span>
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    onGenerateAiQuestions();
                  }}
                  disabled={isGeneratingAi}
                  className="py-4 px-5 rounded-2xl font-bold text-xs bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Yapay Zeka ile Yeni Sorular Üret"
                >
                  <Sparkles className={`w-4 h-4 text-amber-500 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Sorular Üretiliyor...' : 'Yapay Zeka Soru Havuzu'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: WHEEL SPIN */}
        {gameState.phase === 'WHEEL_SPIN' && (
          <div className="w-full flex flex-col items-center max-w-2xl py-2 space-y-5">
            {/* Active Turn Banner */}
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-emerald-400 dark:border-emerald-500 shadow-sm">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-xs text-white"
                style={{ backgroundColor: activePlayer?.color || '#3b82f6' }}
              >
                {activePlayer?.avatar || '👤'}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Sıradaki Bilgin:
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">{activePlayer?.name}</span>
            </div>

            {/* Tahta — sunucudaki pozisyonlar ve hamle secenekleri */}
            <TriviaBoard
              positions={gameState.boardPositions || {}}
              players={players}
              activePlayerId={gameState.activePlayerId}
              moveOptions={gameState.moveOptions || []}
              onPickMove={(opt) => onPickMove(opt.to)}
              size={460}
            />

            {/* Zar / hamle yonergesi. Zar TV'den de atilabilir, telefondan da. */}
            {(gameState.moveOptions?.length || 0) === 0 ? (
              <button
                onClick={onRollDie}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <span className="w-11 h-11 rounded-xl bg-white text-slate-900 flex items-center justify-center text-2xl font-black">
                  {gameState.dieRoll ?? '🎲'}
                </span>
                ZAR AT
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-11 h-11 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center text-2xl font-black shadow-md">
                    {gameState.dieRoll}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    geldi — {activePlayer?.name} hedefini seçiyor
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {(gameState.moveOptions || []).map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => onPickMove(opt.to)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-amber-400 text-slate-900 dark:text-white text-xs font-black hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Category Announce */}
            {gameState.selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-2.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2 shadow-md border"
                style={{
                  backgroundColor: `${TRIVIA_CATEGORIES[gameState.selectedCategory]?.color}20`,
                  borderColor: TRIVIA_CATEGORIES[gameState.selectedCategory]?.color,
                  color: TRIVIA_CATEGORIES[gameState.selectedCategory]?.color,
                }}
              >
                <span className="text-2xl">{TRIVIA_CATEGORIES[gameState.selectedCategory]?.icon}</span>
                <span>{TRIVIA_CATEGORIES[gameState.selectedCategory]?.label} Kategorisi Seçildi!</span>
              </motion.div>
            )}
          </div>
        )}

        {/* PHASE 3: QUESTION ACTIVE */}
        {gameState.phase === 'QUESTION_ACTIVE' && currentQ && currentCat && (
          <div className="w-full max-w-4xl space-y-5">
            {/* Category & Timer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div
                className="px-4 py-1.5 rounded-full font-black text-xs flex items-center gap-2 border shadow-xs"
                style={{
                  backgroundColor: `${currentCat.color}20`,
                  borderColor: currentCat.color,
                  color: currentCat.color,
                }}
              >
                <span>{currentCat.icon}</span>
                <span className="uppercase tracking-wider">{currentCat.label}</span>
                {currentQ.isWedgeQuestion && (
                  <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                    ROZET SORUSU
                  </span>
                )}
              </div>

              {/* Turn Countdown Timer */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs">
                <Clock
                  className={`w-4 h-4 ${
                    gameState.timerSeconds <= 5 ? 'text-rose-500 animate-bounce' : 'text-amber-500'
                  }`}
                />
                <span
                  className={`font-mono font-black text-lg ${
                    gameState.timerSeconds <= 5 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {gameState.timerSeconds}s
                </span>
              </div>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
              <motion.div
                className={`h-full rounded-full ${
                  gameState.timerSeconds <= 5
                    ? 'bg-rose-500'
                    : gameState.timerSeconds <= 10
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                animate={{
                  width: `${(gameState.timerSeconds / (gameState.settings.turnTimerSec || 20)) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </div>

            {/* Big Question Box */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-200 dark:border-slate-700 shadow-lg text-center">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-relaxed tracking-tight">
                {currentQ.question}
              </h2>
            </div>

            {/* 4 Answer Choice Cards (A, B, C, D) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options.map((option, idx) => (
                <div
                  key={idx}
                  className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-lg shadow-inner">
                    {OPTION_LETTERS[idx]}
                  </div>
                  <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{option}</span>
                </div>
              ))}
            </div>

            {/* Response Status Indicator */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">Cevap Verenler:</span>
              {players.map((p) => {
                const hasAnswered = !!p.currentAnswer;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      hasAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{p.avatar || '👤'}</span>
                    <span>{p.name}</span>
                    {hasAnswered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 4: ANSWER REVEAL */}
        {gameState.phase === 'ANSWER_REVEAL' && currentQ && currentCat && (
          <div className="w-full max-w-4xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div
                className="px-4 py-1.5 rounded-full font-black text-xs flex items-center gap-2 border shadow-xs"
                style={{
                  backgroundColor: `${currentCat.color}20`,
                  borderColor: currentCat.color,
                  color: currentCat.color,
                }}
              >
                <span>{currentCat.icon}</span>
                <span className="uppercase tracking-wider">{currentCat.label}</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                TUR SONUCU
              </span>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200">{currentQ.question}</p>
            </div>

            {/* 4 Options with Correct Answer Highlighted */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options.map((option, idx) => {
                const isCorrect = option === currentQ.correctAnswer;
                return (
                  <div
                    key={idx}
                    className={`p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 shadow-sm border-2 transition-all ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-400/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base ${
                          isCorrect
                            ? 'bg-emerald-500 text-white font-black'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {OPTION_LETTERS[idx]}
                      </div>
                      <span className="font-bold text-base md:text-lg">{option}</span>
                    </div>

                    {isCorrect && (
                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-black text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>DOĞRU CEVAP</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fun Fact / Explanation */}
            {currentQ.explanation && (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3 shadow-xs">
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                    Biliyor muydunuz?
                  </h4>
                  <p className="text-xs text-indigo-800 dark:text-indigo-100 mt-0.5 leading-relaxed font-medium">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Player Answers & Wedge Award Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {players.map((p) => {
                const summary = gameState.lastRoundAnswerSummary?.playerAnswers[p.id];
                const isCorrect = summary?.isCorrect ?? (p.currentAnswer === currentQ.correctAnswer);
                const earnedWedge = summary?.earnedWedge;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-xs text-white"
                      style={{ backgroundColor: p.color || '#3b82f6' }}
                    >
                      {p.avatar || '👤'}
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate w-full">
                      {p.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isCorrect ? '+100 Puan' : 'Yanlış'}
                    </span>

                    {earnedWedge && (
                      <div className="mt-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 animate-bounce">
                        <Award className="w-3 h-3" />
                        <span>ROZET KAZANDI!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Advance to Next Round Button */}
            <div className="flex justify-center pt-2">
              <button
                id="btn-tv-next-round"
                onClick={() => {
                  playTurnSound();
                  onNextRound();
                }}
                className="py-3.5 px-8 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <span>SONRAKİ TURA GEÇ</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: GAME OVER / VICTORY */}
        {gameState.phase === 'GAME_OVER' && (
          <div className="w-full max-w-xl bg-slate-50 dark:bg-slate-800/90 border-3 border-amber-300 dark:border-amber-500/60 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 mx-auto flex items-center justify-center text-4xl shadow-xl text-white font-black animate-bounce border-2 border-white">
              🏆
            </div>

            <div>
              <span className="text-xs uppercase font-black tracking-widest text-amber-600 dark:text-amber-400">
                ŞAMPİYON BİLGİN
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
                {players.find((p) => p.id === gameState.winnerPlayerId)?.name || 'Şampiyon'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                Tüm Kategori Rozetlerini toplayarak Trivia Pursuit'i fethetti!
              </p>
            </div>

            {/* Final Leaderboard */}
            <div className="space-y-2 max-w-md mx-auto">
              {[...players]
                .sort((a, b) => b.wedges.length - a.wedges.length || b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl flex items-center justify-between border ${
                      idx === 0
                        ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200 font-black'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm w-5">{idx + 1}.</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-xs"
                        style={{ backgroundColor: p.color || '#3b82f6' }}
                      >
                        {p.avatar || '👤'}
                      </div>
                      <span className="font-bold text-sm">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <TriviaWedgePie wedges={p.wedges} size={28} />
                      <span className="font-mono font-black text-sm">{p.score}P</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  playClickSound();
                  onRestartGame();
                }}
                className="py-3 px-6 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>YENİDEN OYNA</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Player Dashboard / Wedges Bar */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex items-center gap-3">
            {players.map((p, idx) => {
              const isActive = gameState.activePlayerIndex === idx;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 shadow-sm scale-105'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Avatar & Wedges */}
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold shadow-xs text-white"
                      style={{ backgroundColor: p.color || '#3b82f6' }}
                    >
                      {p.avatar || '👤'}
                    </div>
                    {p.streak > 1 && (
                      <div className="absolute -top-1 -right-1 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center">
                        <Flame className="w-2.5 h-2.5" />
                        {p.streak}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-slate-900 dark:text-white truncate max-w-[85px]">
                        {p.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                          SIRA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TriviaWedgePie wedges={p.wedges} size={20} />
                      <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">{p.score}P</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-right text-[11px] text-slate-400 shrink-0 font-bold">
            FiestaLoco • Trivia Pursuit
          </div>
        </div>
      </div>
    </div>
  );
};
