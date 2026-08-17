import React, { useState } from 'react';
import {
  CodenamesGameState,
  CodenamesPlayer,
  CodenamesTeam,
  CodenamesRole,
} from '../../types/codenames';
import { CodenamesCard } from '../../data/codenamesWords';
import {
  Shield,
  UserCheck,
  Send,
  Sparkles,
  HelpCircle,
  SkipForward,
  RotateCcw,
  Eye,
  Key,
  Skull,
  Award,
  Users,
  Smartphone,
  LogOut,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { playClickSound, playTurnSound } from '../../utils/audio';

interface CodenamesMobileControllerViewProps {
  roomCode: string;
  myPlayer: CodenamesPlayer;
  gameState: CodenamesGameState;
  players: CodenamesPlayer[];
  onGiveClue: (word: string, count: number) => void;
  onRevealCard: (cardId: string) => void;
  onEndTurn: () => void;
  onUpdateRole: (team: CodenamesTeam, role: CodenamesRole) => void;
  onLeave: () => void;
  onOpenRules: () => void;
}

export function CodenamesMobileControllerView({
  roomCode,
  myPlayer,
  gameState,
  players,
  onGiveClue,
  onRevealCard,
  onEndTurn,
  onUpdateRole,
  onLeave,
  onOpenRules,
}: CodenamesMobileControllerViewProps) {
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState<number>(2);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [confirmCard, setConfirmCard] = useState<CodenamesCard | null>(null);

  const isMyTeamTurn = gameState.activeTeam === myPlayer.team;
  const isSpymaster = myPlayer.role === 'spymaster';
  const isGameOver = !!gameState.winner;

  const handleClueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueWord.trim()) return;
    playTurnSound();
    onGiveClue(clueWord.trim().toUpperCase(), clueCount);
    setClueWord('');
  };

  const handleSuggestAiClue = () => {
    playClickSound();
    // Intelligent heuristic clue suggester for Spymaster
    const unrevealedMyCards = gameState.board.filter(
      (c) => c.type === myPlayer.team && !c.revealed
    );
    if (unrevealedMyCards.length === 0) return;

    const sampleCard = unrevealedMyCards[0].word;
    const aiClues: Record<string, { word: string; count: number }> = {
      ASLAN: { word: 'ORMAN', count: 2 },
      KAPLAN: { word: 'YIRTICI', count: 2 },
      KARTAL: { word: 'GÖKYÜZÜ', count: 2 },
      GÜNEŞ: { word: 'UZAY', count: 2 },
      AY: { word: 'GECE', count: 2 },
      DENİZALTI: { word: 'OKYANUS', count: 2 },
      ROKET: { word: 'UZAY', count: 2 },
      KILIÇ: { word: 'SAVAŞ', count: 2 },
      HARİTA: { word: 'KEŞİF', count: 2 },
      ANAHTAR: { word: 'GİZEM', count: 2 },
      DEDEKTİF: { word: 'İSTİHBARAT', count: 2 },
    };

    const suggested = aiClues[sampleCard] || {
      word: sampleCard.length > 5 ? sampleCard.substring(0, 4) + 'İ' : 'TAKTIK',
      count: 2,
    };

    setClueWord(suggested.word);
    setClueCount(suggested.count);
  };

  return (
    <div
      id="codenames-mobile-controller"
      className="w-full max-w-lg mx-auto px-3 py-4 space-y-4 text-slate-900 dark:text-slate-100 animate-fade-in"
    >
      {/* Top Header Card: Player Profile & Room Info */}
      <div
        className={`p-4 rounded-3xl border shadow-md flex items-center justify-between transition-colors ${
          myPlayer.team === 'red'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950'
            : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-xs ${
              myPlayer.team === 'red' ? 'bg-red-600 text-white' : 'bg-sky-600 text-white'
            }`}
          >
            {isSpymaster ? '👑' : '🕵️‍♂️'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm">{myPlayer.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-bold">
                Oda: {roomCode}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{myPlayer.team === 'red' ? '🔴 Kırmızı Takım' : '🔵 Mavi Takım'}</span>
              <span>•</span>
              <span>{isSpymaster ? 'Lider (Spymaster)' : 'Saha Ajanı'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Takım / Rol Değiştir"
          >
            🔄
          </button>
          <button
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Kurallar"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onLeave}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-rose-600 dark:text-rose-400 text-xs font-bold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Odadan Ayrıl"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Switcher Drawer (if open) */}
      {showRoleSwitcher && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-3 animate-scale-in">
          <h4 className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Takım ve Rolünü Güncelle:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onUpdateRole('red', 'spymaster');
                setShowRoleSwitcher(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer ${
                myPlayer.team === 'red' && myPlayer.role === 'spymaster'
                  ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-950 font-black'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              👑 Kırmızı Lider
            </button>
            <button
              onClick={() => {
                onUpdateRole('red', 'operative');
                setShowRoleSwitcher(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer ${
                myPlayer.team === 'red' && myPlayer.role === 'operative'
                  ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-950 font-black'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              🕵️‍♂️ Kırmızı Ajan
            </button>
            <button
              onClick={() => {
                onUpdateRole('blue', 'spymaster');
                setShowRoleSwitcher(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer ${
                myPlayer.team === 'blue' && myPlayer.role === 'spymaster'
                  ? 'bg-sky-100 dark:bg-sky-900/40 border-sky-500 text-sky-950 font-black'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              👑 Mavi Lider
            </button>
            <button
              onClick={() => {
                onUpdateRole('blue', 'operative');
                setShowRoleSwitcher(false);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left cursor-pointer ${
                myPlayer.team === 'blue' && myPlayer.role === 'operative'
                  ? 'bg-sky-100 dark:bg-sky-900/40 border-sky-500 text-sky-950 font-black'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              🕵️‍♂️ Mavi Ajan
            </button>
          </div>
        </div>
      )}

      {/* Match Score & Status Banner */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div
          className={`p-3 rounded-2xl border transition-all ${
            gameState.activeTeam === 'red'
              ? 'bg-red-600 text-white font-black shadow-md ring-2 ring-red-400/40'
              : 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border-red-200 dark:border-red-900 font-bold'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider">Kırmızı Takım</div>
          <div className="text-xl font-black">{gameState.redRemaining} Ajan Kaldı</div>
          {gameState.activeTeam === 'red' && <div className="text-[10px] mt-0.5">● SIRA BURADA</div>}
        </div>

        <div
          className={`p-3 rounded-2xl border transition-all ${
            gameState.activeTeam === 'blue'
              ? 'bg-sky-600 text-white font-black shadow-md ring-2 ring-sky-400/40'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-900 font-bold'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider">Mavi Takım</div>
          <div className="text-xl font-black">{gameState.blueRemaining} Ajan Kaldı</div>
          {gameState.activeTeam === 'blue' && <div className="text-[10px] mt-0.5">● SIRA BURADA</div>}
        </div>
      </div>

      {/* Game Over Banner */}
      {isGameOver && (
        <div className="p-5 rounded-3xl bg-slate-900 text-white text-center space-y-2 border border-slate-800 shadow-xl animate-fade-in">
          <div className="text-3xl">🏆</div>
          <h3 className="text-xl font-black text-amber-400">
            {gameState.winner === 'red' ? '🔴 KIRMIZI TAKIM KAZANDI!' : '🔵 MAVİ TAKIM KAZANDI!'}
          </h3>
          <p className="text-xs text-slate-300">
            {gameState.winReason === 'assassin_triggered'
              ? '☠️ Rakip Kara Suikastçı kartını açtığı için zafer elde edildi!'
              : '🎉 Tüm gizli ajanlar başarıyla açığa çıkarıldı!'}
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* SPYMASTER VIEW: 5x5 Key Matrix & Clue Submission Box */}
      {/* ========================================================= */}
      {isSpymaster && !isGameOver && (
        <div className="space-y-4">
          {/* 5x5 Key Matrix */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="font-black text-xs uppercase tracking-wider text-amber-400">
                  TOP SECRET: 5x5 Lider Anahtar Haritası
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Sadece Liderler Görür</span>
            </div>

            {/* 5x5 Grid */}
            <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800">
              {gameState.board.map((card) => {
                let bgClass = 'bg-slate-800 text-slate-300';
                if (card.type === 'red') bgClass = 'bg-red-600 text-white font-black';
                if (card.type === 'blue') bgClass = 'bg-sky-600 text-white font-black';
                if (card.type === 'neutral') bgClass = 'bg-amber-100 dark:bg-amber-900/40 text-stone-900 font-bold';
                if (card.type === 'assassin') bgClass = 'bg-black text-rose-400 font-black border border-rose-500/50';

                return (
                  <div
                    key={card.id}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all ${bgClass} ${
                      card.revealed ? 'opacity-40 line-through ring-1 ring-white/30' : 'shadow-xs'
                    }`}
                  >
                    <span className="text-[9px] leading-tight font-mono uppercase truncate w-full">
                      {card.word}
                    </span>
                    {card.revealed && <span className="text-[8px] opacity-90">✓ AÇILDI</span>}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
              <span className="flex items-center gap-1">🔴 Kırmızı ({gameState.redRemaining})</span>
              <span className="flex items-center gap-1">🔵 Mavi ({gameState.blueRemaining})</span>
              <span className="flex items-center gap-1">⚪ Sivil (7)</span>
              <span className="flex items-center gap-1 text-rose-400">☠️ Suikastçı (1)</span>
            </div>
          </div>

          {/* Clue Giving Input Form */}
          {isMyTeamTurn && (
            <form
              onSubmit={handleClueSubmit}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sıra Sizde: İpucu Gönderin</span>
                </h4>
                <button
                  type="button"
                  onClick={handleSuggestAiClue}
                  className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>AI Öneri</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    İpucu Kelimesi (Tek Kelime):
                  </label>
                  <input
                    type="text"
                    value={clueWord}
                    onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                    placeholder="ÖRN: ORMAN"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 dark:text-slate-100 uppercase focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelime Sayısı:
                  </label>
                  <select
                    value={clueCount}
                    onChange={(e) => setClueCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2.5 text-sm font-black text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n} Kart
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!clueWord.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <span>İPUCUNU TV'YE VE SAHAYA GÖNDER</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* OPERATIVE VIEW: Active Clue & Tap-to-Guess Cards */}
      {/* ========================================================= */}
      {!isSpymaster && !isGameOver && (
        <div className="space-y-4">
          {/* Current Clue Alert Banner */}
          {gameState.currentClue ? (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white shadow-lg space-y-1 text-center animate-fade-in">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-100">
                Liderinizin İpucu:
              </div>
              <div className="text-2xl font-black tracking-tight">
                "{gameState.currentClue.word}" ({gameState.currentClue.count})
              </div>
              <div className="text-xs text-white/90 font-medium">
                Kalan Tahmin Hakkı: <strong>{gameState.guessesRemaining}</strong>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-center text-xs font-bold border border-slate-200 dark:border-slate-800">
              ⏳ {gameState.activeTeam === myPlayer.team ? 'Liderinizin ipucu vermesi bekleniyor...' : 'Rakip takımın lideri düşünüyor...'}
            </div>
          )}

          {/* Operative Tap to Reveal Word Tiles */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Panodaki Kelimeler (Dokunarak Aç):
              </h4>
              {isMyTeamTurn && (
                <button
                  onClick={() => {
                    playTurnSound();
                    onEndTurn();
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Turu Bitir</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gameState.board.map((card) => {
                let style = 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800';
                if (card.revealed) {
                  if (card.type === 'red') style = 'bg-red-600 text-white border-red-700 opacity-70';
                  else if (card.type === 'blue') style = 'bg-sky-600 text-white border-sky-700 opacity-70';
                  else if (card.type === 'neutral') style = 'bg-amber-100 dark:bg-amber-900/40 text-amber-950 border-amber-300 dark:border-amber-800 opacity-70';
                  else if (card.type === 'assassin') style = 'bg-stone-900 text-rose-400 border-stone-800 opacity-70';
                }

                return (
                  <button
                    key={card.id}
                    disabled={card.revealed || !isMyTeamTurn}
                    onClick={() => setConfirmCard(card)}
                    className={`p-3 rounded-2xl border text-xs font-black transition-all text-center flex flex-col items-center justify-center min-h-[56px] cursor-pointer disabled:cursor-not-allowed ${style}`}
                  >
                    <span>{card.word}</span>
                    {card.revealed && <span className="text-[9px] mt-0.5 font-bold">AÇILDI</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before revealing card */}
      {confirmCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
            <div className="text-3xl">🕵️‍♂️</div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                "{confirmCard.word}" Kartını Aç?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bu kart TV ekranında tüm oyuncuların gözü önünde açılacak!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmCard(null)}
                className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onRevealCard(confirmCard.id);
                  setConfirmCard(null);
                }}
                className="py-3 bg-gradient-to-r from-red-600 via-purple-600 to-sky-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                KARTI AÇ!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
