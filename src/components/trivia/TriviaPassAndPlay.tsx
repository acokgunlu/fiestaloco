import React, { useState, useEffect, useRef } from 'react';
import {
  TriviaPursuitGameState,
  TriviaPursuitPlayer,
  TriviaCategory,
  TriviaQuestion,
  TRIVIA_CATEGORIES,
  TRIVIA_CATEGORY_KEYS,
} from '../../types/triviaPursuit';
import { INITIAL_TRIVIA_QUESTIONS, getNextTriviaQuestion } from '../../data/triviaPursuitQuestions';
import { TriviaWedgePie } from './TriviaWedgePie';
import { TriviaBoard } from './TriviaBoard';
import {
  BoardPosition,
  MoveOption,
  getMoveOptions,
  rollDie,
  spaceAt,
  startingPosition,
  isFinalQuestionTurn,
} from '../../data/triviaBoard';
import {
  Trophy,
  Users,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  Flame,
  UserPlus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { playClickSound, playWinSound, playCorrectSound, playWrongSound, playTurnSound } from '../../utils/audio';

interface TriviaPassAndPlayProps {
  onBackToLobby?: () => void;
}

export const TriviaPassAndPlay: React.FC<TriviaPassAndPlayProps> = ({ onBackToLobby }) => {
  const [players, setPlayers] = useState<TriviaPursuitPlayer[]>([
    {
      id: 'p1',
      name: 'Oyuncu 1',
      avatar: '🦊',
      color: '#ef4444',
      colorName: 'Kırmızı',
      score: 0,
      wedges: [],
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
    },
    {
      id: 'p2',
      name: 'Oyuncu 2',
      avatar: '🐼',
      color: '#3b82f6',
      colorName: 'Mavi',
      score: 0,
      wedges: [],
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
    },
  ]);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameState, setGameState] = useState<TriviaPursuitGameState>({
    phase: 'LOBBY',
    roundNumber: 1,
    activePlayerIndex: 0,
    activePlayerId: 'p1',
    selectedCategory: null,
    currentQuestion: null,
    timerSeconds: 25,
    isTimerRunning: false,
    wheelRotationDegrees: 0,
    isSpinning: false,
    winnerPlayerId: null,
    settings: {
      wedgesToWin: 6,
      turnTimerSec: 25,
      allPlayersAnswer: false,
      aiDynamicQuestions: true,
      difficulty: 'all',
    },
    usedQuestionIds: [],
  });

  const [questionPool, setQuestionPool] = useState<TriviaQuestion[]>([...INITIAL_TRIVIA_QUESTIONS]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // --- Tahta durumu -----------------------------------------------------------
  /** oyuncu id -> tahtadaki yeri */
  const [positions, setPositions] = useState<Record<string, BoardPosition>>({});
  const [dieRoll, setDieRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [moveOptions, setMoveOptions] = useState<MoveOption[]>([]);
  /** Bu tur inilen kare KALE mi? Sadece o zaman dilim kazanilir. */
  const [landedOnHq, setLandedOnHq] = useState(false);
  /** Merkeze varildi mi? Dogru cevap oyunu bitirir. */
  const [landedOnHub, setLandedOnHub] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activePlayer = players[gameState.activePlayerIndex] || players[0];
  const currentQ = gameState.currentQuestion;
  const currentCat = currentQ ? TRIVIA_CATEGORIES[currentQ.category] : null;
  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const addPlayer = () => {
    if (!newPlayerName.trim() || players.length >= 8) return;
    const avatars = ['🦁', '🐯', '🐸', '🐨', '🦄', '🦅', '🚀', '🔥'];
    const colors = [
      { hex: '#10b981', name: 'Yeşil' },
      { hex: '#f59e0b', name: 'Sarı' },
      { hex: '#8b5cf6', name: 'Mor' },
      { hex: '#ec4899', name: 'Pembe' },
      { hex: '#06b6d4', name: 'Camgöbeği' },
    ];
    const pickedColor = colors[players.length % colors.length];
    const p: TriviaPursuitPlayer = {
      id: `p-${Date.now()}`,
      name: newPlayerName.trim(),
      avatar: avatars[players.length % avatars.length],
      color: pickedColor.hex,
      colorName: pickedColor.name,
      score: 0,
      wedges: [],
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
    };
    setPlayers([...players, p]);
    setNewPlayerName('');
    playClickSound();
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    playClickSound();
    setPlayers(players.filter((p) => p.id !== id));
  };

  const startGame = () => {
    playTurnSound();
    // Herkes tahtanin tepesindeki kareden baslar
    const start: Record<string, BoardPosition> = {};
    players.forEach((p) => {
      start[p.id] = startingPosition();
    });
    setPositions(start);
    setDieRoll(null);
    setMoveOptions([]);
    setLandedOnHq(false);
    setLandedOnHub(false);

    setGameState((prev) => ({
      ...prev,
      phase: 'WHEEL_SPIN',
      roundNumber: 1,
      activePlayerIndex: 0,
      activePlayerId: players[0]?.id || 'p1',
      selectedCategory: null,
      currentQuestion: null,
      winnerPlayerId: null,
    }));
  };

  // --- Tahta: zar at ve hamle sec ---------------------------------------------

  /** Soru asamasini baslat (zar/hamle sonrasi ortak yol). */
  const beginQuestion = (cat: TriviaCategory) => {
    const q = getNextTriviaQuestion(cat, gameState.usedQuestionIds, questionPool);
    setSelectedAnswer(null);
    setGameState((prev) => ({
      ...prev,
      selectedCategory: cat,
      phase: 'QUESTION_ACTIVE',
      currentQuestion: q,
      usedQuestionIds: [...prev.usedQuestionIds, q.id],
      timerSeconds: prev.settings.turnTimerSec,
      isTimerRunning: true,
    }));

    clearTimer();
    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.timerSeconds <= 1) {
          clearTimer();
          handleAnswerSubmit('');
          return { ...prev, timerSeconds: 0, isTimerRunning: false };
        }
        return { ...prev, timerSeconds: prev.timerSeconds - 1 };
      });
    }, 1000);
  };

  const handleRollDie = () => {
    if (isRolling || moveOptions.length > 0) return;

    // MERKEZDE zar atilmaz — sira dogrudan final sorusudur. (Onceden merkezde
    // hic secenek uretilmiyor, ekran yine "ZAR AT" gosteriyordu: sonsuz dongu.)
    const here = positions[activePlayer.id] || startingPosition();
    if (isFinalQuestionTurn(here)) {
      playTurnSound();
      setLandedOnHq(false);
      setLandedOnHub(true);
      beginQuestion(
        TRIVIA_CATEGORY_KEYS[Math.floor(Math.random() * TRIVIA_CATEGORY_KEYS.length)]
      );
      return;
    }

    playTurnSound();
    setIsRolling(true);

    // Kisa bir "zar donuyor" animasyonu
    let ticks = 0;
    const spin = setInterval(() => {
      setDieRoll(rollDie());
      ticks += 1;
      if (ticks >= 8) {
        clearInterval(spin);
        const final = rollDie();
        setDieRoll(final);
        setIsRolling(false);

        const pos = positions[activePlayer.id] || startingPosition();
        const needed = gameState.settings.wedgesToWin || 6;
        const hasAll = activePlayer.wedges.length >= needed;
        setMoveOptions(getMoveOptions(pos, final, hasAll));
      }
    }, 90);
  };

  const handlePickMove = (option: MoveOption) => {
    playClickSound();
    const target = option.to;
    setPositions((prev) => ({ ...prev, [activePlayer.id]: target }));
    setMoveOptions([]);

    const space = spaceAt(target);
    setLandedOnHq(space.kind === 'hq');
    setLandedOnHub(space.kind === 'hub');

    // "Tekrar at" karesi: soru yok, ayni oyuncu yeniden zar atar
    if (space.kind === 'rollAgain') {
      setDieRoll(null);
      return;
    }

    if (space.kind === 'hub') {
      // Final sorusu: eksigi olmayan oyuncu icin rastgele kategori
      const cat =
        TRIVIA_CATEGORY_KEYS[Math.floor(Math.random() * TRIVIA_CATEGORY_KEYS.length)];
      beginQuestion(cat);
      return;
    }

    if (space.category) {
      beginQuestion(space.category);
    }
  };

  const spinWheel = () => {
    if (gameState.isSpinning) return;

    // Pick random category biased toward missing wedges
    const missingWedges = TRIVIA_CATEGORY_KEYS.filter((c) => !activePlayer.wedges.includes(c));
    const chosenCategory: TriviaCategory =
      missingWedges.length > 0 && Math.random() < 0.75
        ? missingWedges[Math.floor(Math.random() * missingWedges.length)]
        : TRIVIA_CATEGORY_KEYS[Math.floor(Math.random() * TRIVIA_CATEGORY_KEYS.length)];

    const catIndex = TRIVIA_CATEGORY_KEYS.indexOf(chosenCategory);
    const segmentAngle = 360 / TRIVIA_CATEGORY_KEYS.length;
    const targetOffset = 360 - catIndex * segmentAngle - segmentAngle / 2;
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = gameState.wheelRotationDegrees + spins * 360 + targetOffset;

    setGameState((prev) => ({
      ...prev,
      isSpinning: true,
      selectedCategory: chosenCategory,
      wheelRotationDegrees: finalRotation,
    }));

    playTurnSound();

    setTimeout(() => {
      const q = getNextTriviaQuestion(
        chosenCategory,
        gameState.usedQuestionIds,
        questionPool
      );

      setSelectedAnswer(null);
      setGameState((prev) => ({
        ...prev,
        isSpinning: false,
        phase: 'QUESTION_ACTIVE',
        currentQuestion: q,
        usedQuestionIds: [...prev.usedQuestionIds, q.id],
        timerSeconds: prev.settings.turnTimerSec,
        isTimerRunning: true,
      }));

      // Start timer
      clearTimer();
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timerSeconds <= 1) {
            clearTimer();
            handleAnswerSubmit('');
            return { ...prev, timerSeconds: 0, isTimerRunning: false };
          }
          return { ...prev, timerSeconds: prev.timerSeconds - 1 };
        });
      }, 1000);
    }, 2600);
  };

  const handleSelectCategory = (cat: TriviaCategory) => {
    playClickSound();
    const q = getNextTriviaQuestion(cat, gameState.usedQuestionIds, questionPool);
    setSelectedAnswer(null);
    setGameState((prev) => ({
      ...prev,
      selectedCategory: cat,
      phase: 'QUESTION_ACTIVE',
      currentQuestion: q,
      usedQuestionIds: [...prev.usedQuestionIds, q.id],
      timerSeconds: prev.settings.turnTimerSec,
      isTimerRunning: true,
    }));

    clearTimer();
    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.timerSeconds <= 1) {
          clearTimer();
          handleAnswerSubmit('');
          return { ...prev, timerSeconds: 0, isTimerRunning: false };
        }
        return { ...prev, timerSeconds: prev.timerSeconds - 1 };
      });
    }, 1000);
  };

  const handleAnswerSubmit = (answer: string) => {
    clearTimer();
    setSelectedAnswer(answer);

    const q = gameState.currentQuestion;
    if (!q) return;

    const isCorrect = answer === q.correctAnswer;
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx !== gameState.activePlayerIndex) return p;
        const newScore = isCorrect ? p.score + 100 : p.score;
        const newStreak = isCorrect ? p.streak + 1 : 0;
        let newWedges = [...p.wedges];
        // Dilim YALNIZCA kale karesinde kazanilir — klasik Trivial Pursuit kurali.
        // Normal kategori karesinde dogru cevap sadece puan ve tekrar zar hakki verir.
        if (isCorrect && landedOnHq && !newWedges.includes(q.category)) {
          newWedges.push(q.category);
        }
        return {
          ...p,
          score: newScore,
          streak: newStreak,
          wedges: newWedges,
          totalCorrect: isCorrect ? p.totalCorrect + 1 : p.totalCorrect,
          totalAnswered: p.totalAnswered + 1,
        };
      })
    );

    setGameState((prev) => ({
      ...prev,
      phase: 'ANSWER_REVEAL',
      isTimerRunning: false,
    }));
  };

  const nextTurn = () => {
    playClickSound();
    const currentP = players[gameState.activePlayerIndex];
    const wasCorrect = selectedAnswer === gameState.currentQuestion?.correctAnswer;

    // Oyunu kazanmanin TEK yolu: tum dilimler + merkeze varip dogru cevap.
    if (landedOnHub && wasCorrect) {
      playWinSound();
      setGameState((prev) => ({
        ...prev,
        phase: 'GAME_OVER',
        winnerPlayerId: currentP.id,
      }));
      return;
    }

    setDieRoll(null);
    setMoveOptions([]);
    setLandedOnHq(false);
    setLandedOnHub(false);

    // Klasik kural: dogru cevap = ayni oyuncu tekrar zar atar.
    if (wasCorrect) {
      setGameState((prev) => ({
        ...prev,
        phase: 'WHEEL_SPIN',
        currentQuestion: null,
        selectedCategory: null,
      }));
      return;
    }

    const nextIndex = (gameState.activePlayerIndex + 1) % players.length;
    setGameState((prev) => ({
      ...prev,
      phase: 'WHEEL_SPIN',
      activePlayerIndex: nextIndex,
      activePlayerId: players[nextIndex].id,
      roundNumber: prev.roundNumber + 1,
      currentQuestion: null,
      selectedCategory: null,
    }));
  };

  const restartGame = () => {
    playClickSound();
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        score: 0,
        wedges: [],
        streak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
      }))
    );
    setGameState((prev) => ({
      ...prev,
      phase: 'LOBBY',
      roundNumber: 1,
      activePlayerIndex: 0,
      winnerPlayerId: null,
      currentQuestion: null,
      selectedCategory: null,
    }));
  };

  return (
    <div
      id="trivia-pass-and-play-view"
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToLobby && (
            <button
              onClick={() => {
                playClickSound();
                onBackToLobby();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mod Seçimi</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Tek Cihaz (Elden Ele)</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-300 dark:border-indigo-800">
                LOKAL OYUN
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              Tur {gameState.roundNumber} • Sırayla telefonu devrederek yarışın
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            Hedef: 6 Rozet
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-[420px] flex flex-col items-center justify-center">
        {/* LOBBY */}
        {gameState.phase === 'LOBBY' && (
          <div className="w-full max-w-lg space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-emerald-500" />
                <span>Oyuncuları Yönet ({players.length})</span>
              </h3>

              <div className="space-y-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-white shadow-xs"
                        style={{ backgroundColor: p.color || '#3b82f6' }}
                      >
                        {p.avatar}
                      </div>
                      <span className="font-black text-sm text-slate-900 dark:text-white">{p.name}</span>
                    </div>
                    {players.length > 2 && (
                      <button
                        onClick={() => removePlayer(p.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                        title="Oyuncuyu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {players.length < 8 && (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Yeni oyuncu adı..."
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                  <button
                    onClick={addPlayer}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ekle</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.02] text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>OYUNU BAŞLAT</span>
            </button>
          </div>
        )}

        {/* WHEEL SPIN */}
        {gameState.phase === 'WHEEL_SPIN' && (
          <div className="w-full flex flex-col items-center max-w-xl space-y-5">
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-400 shadow-sm">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-xs text-white"
                style={{ backgroundColor: activePlayer?.color || '#3b82f6' }}
              >
                {activePlayer?.avatar}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Sıradaki Bilgin:
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{activePlayer?.name}</span>
            </div>

            <TriviaBoard
              positions={positions}
              players={players}
              activePlayerId={gameState.activePlayerId}
              moveOptions={moveOptions}
              onPickMove={handlePickMove}
              size={440}
            />

            {/* Zar ve yonerge */}
            <div className="flex flex-col items-center gap-3">
              {moveOptions.length === 0 ? (
                <button
                  onClick={handleRollDie}
                  disabled={isRolling}
                  className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
                >
                  <span
                    className={`w-11 h-11 rounded-xl bg-white text-slate-900 flex items-center justify-center text-2xl font-black ${
                      isRolling ? 'animate-spin' : ''
                    }`}
                  >
                    {dieRoll ?? '🎲'}
                  </span>
                  {isRolling
                    ? 'ZAR DÖNÜYOR...'
                    : isFinalQuestionTurn(positions[activePlayer.id] || startingPosition())
                      ? 'FİNAL SORUSU 🏆'
                      : 'ZAR AT'}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-11 h-11 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center text-2xl font-black shadow-md">
                      {dieRoll}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      geldi — nereye gideceğini seç
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {moveOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handlePickMove(opt)}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-amber-400 text-slate-900 dark:text-white text-xs font-black hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Tahtadaki yanıp sönen kareye de dokunabilirsin
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm">
                Dilim yalnızca <strong>kale karelerinde</strong> (ikonlu, altın çerçeveli)
                kazanılır. Doğru cevap tekrar zar hakkı verir.
                {' '}
                {gameState.settings.wedgesToWin} dilimi tamamlayınca kolu kullanıp merkeze çık.
              </p>
            </div>
          </div>
        )}

        {/* QUESTION ACTIVE */}
        {gameState.phase === 'QUESTION_ACTIVE' && currentQ && currentCat && (
          <div className="w-full max-w-2xl space-y-5">
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

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{gameState.timerSeconds}s</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-slate-700 shadow-md text-center">
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSubmit(option)}
                  className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center gap-3 text-left font-bold text-sm text-slate-900 dark:text-white transition-all shadow-xs active:scale-98 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-xs">
                    {OPTION_LETTERS[idx]}
                  </div>
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ANSWER REVEAL */}
        {gameState.phase === 'ANSWER_REVEAL' && currentQ && currentCat && (
          <div className="w-full max-w-2xl space-y-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {currentCat.label}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{currentQ.question}</h3>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black text-base flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Doğru Cevap: {currentQ.correctAnswer}</span>
              </div>

              {currentQ.explanation && (
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {currentQ.explanation}
                </p>
              )}

              <div className="pt-2">
                <button
                  onClick={nextTurn}
                  className="py-3 px-8 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  {/* Dogru cevap = ayni oyuncu tekrar atar; buton bunu soylemeli. */}
                  <span>
                    {selectedAnswer === currentQ.correctAnswer
                      ? landedOnHub
                        ? 'ZAFERİ İLAN ET 🏆'
                        : 'TEKRAR ZAR AT 🎲'
                      : 'SONRAKİ OYUNCUYA GEÇ'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {gameState.phase === 'GAME_OVER' && (
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-500/60 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-rose-500 mx-auto flex items-center justify-center text-3xl text-white font-black animate-bounce">
              🏆
            </div>

            <div>
              <span className="text-xs uppercase font-black tracking-widest text-amber-600">
                ŞAMPİYON BİLGİN
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {players.find((p) => p.id === gameState.winnerPlayerId)?.name}
              </h3>
            </div>

            <button
              onClick={restartGame}
              className="py-3 px-6 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>YENİDEN OYNA</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Sticky Player Dashboard */}
      <footer className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
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
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-xs"
                  style={{ backgroundColor: p.color || '#3b82f6' }}
                >
                  {p.avatar}
                </div>
                <div>
                  <span className="font-black text-xs text-slate-900 dark:text-white">{p.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TriviaWedgePie wedges={p.wedges} size={18} />
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{p.score}P</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
