import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Play,
  HelpCircle,
  Tv,
  Smartphone,
  Flame,
  Zap,
  Gamepad2,
  ArrowRight,
  PartyPopper,
  Crown,
  Dice5,
  Trophy,
} from 'lucide-react';
import { PartyGameType } from '../types/partyGames';
import { playClickSound, playTurnSound } from '../utils/audio';

interface MainArcadeHubProps {
  onSelectGame: (gameId: PartyGameType) => void;
  onOpenRules: () => void;
  onOpenLeaderboard?: () => void;
}

export function MainArcadeHub({
  onSelectGame,
  onOpenRules,
  onOpenLeaderboard,
}: MainArcadeHubProps) {
  const [quickRoomCode, setQuickRoomCode] = useState('');

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRoomCode.trim()) return;
    playClickSound();
    window.location.href = `?room=${quickRoomCode.trim().toUpperCase()}`;
  };

  return (
    <div
      id="main-arcade-hub"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-fade-in text-slate-900 dark:text-slate-100"
    >
      {/* Playful Arcade Header Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-rose-500/10 relative overflow-hidden border-4 border-white/80 dark:border-slate-800">
        {/* Floating party sticker elements */}
        <div className="absolute -top-6 -right-6 text-7xl opacity-20 pointer-events-none select-none">
          🎲
        </div>
        <div className="absolute -bottom-6 -left-6 text-7xl opacity-20 pointer-events-none select-none">
          🎉
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/25 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs border border-white/40 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
              <span>Çok Oyunculu TV & Telefon Parti Konsolu</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-sm flex items-center justify-center md:justify-start gap-2">
              <span>FIESTA</span>
              <span className="text-amber-300 underline decoration-white/40">LOCO</span>
              <span className="text-2xl sm:text-4xl">🕹️</span>
            </h1>

            <p className="text-sm sm:text-base text-white/95 max-w-xl font-medium leading-relaxed">
              Tek bir ekranda toplanın, telefonlarınızı kumandaya dönüştürün ve arkadaşlarınızla kahkaha dolu Jackbox tarzı oyunların tadını çıkarın!
            </p>
          </div>

          {/* Quick Join Widget for Phone Players */}
          <div className="w-full md:w-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 rounded-2xl border-2 border-white/80 dark:border-slate-700 shadow-lg text-slate-900 dark:text-white min-w-[280px] space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Odaya Hızlı Katıl</span>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-2">
              <input
                id="input-quick-room-code"
                type="text"
                maxLength={4}
                placeholder="ODA KODU (ÖRN: WOLF)"
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl text-center text-base font-mono font-black text-slate-900 dark:text-white tracking-widest uppercase outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>KUMANDAYLA KATIL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom banner action pills */}
        <div className="relative z-10 pt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 border-t border-white/20 mt-4 text-xs font-bold">
          <button
            onClick={() => {
              playClickSound();
              onOpenRules();
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
            <span>Oyun Rehberi & Kurallar</span>
          </button>

          {onOpenLeaderboard && (
            <button
              onClick={() => {
                playClickSound();
                onOpenLeaderboard();
              }}
              className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border border-amber-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-950" />
              <span>🏆 Skor Tablosu & Maç Geçmişi</span>
            </button>
          )}

          <span className="px-3 py-1 rounded-full bg-black/15 text-white/90">
            📺 TV Host + 📱 Telefon Kumandası Destekli
          </span>
          <span className="px-3 py-1 rounded-full bg-black/15 text-white/90">
            👥 2-12+ Oyuncu
          </span>
        </div>
      </div>

      {/* Game Modules Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg shadow-sm font-black">
              🎮
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Parti Oyunları Arenası
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">İstediğiniz oyunu seçip başlatın</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800">
            7 Canlı Modül
          </span>
        </div>

        {/* 7 Distinct Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* GAME 1: QUIPLASH */}
          <div
            id="card-game-quiplash"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-purple-200 dark:border-purple-900/60 hover:border-purple-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  🥊
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[11px] font-black border border-purple-200 dark:border-purple-800">
                    MİZAH DÜELLOSU
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    2-12+ Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Quiplash
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Doğru cevap yok, sadece en çok güldüren kazanır! Absürt sorulara kurnaz yanıtlar yazın, birebir kapışmalarda oyları toplayın.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  👑 The Last Lash
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  💥 Quiplash Süpürme
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-quiplash"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('quiplash');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>QUIPLASH'I BAŞLAT</span>
              </button>
            </div>
          </div>

          {/* GAME 2: CODENAMES */}
          <div
            id="card-game-codenames"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-indigo-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-rose-600 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  🕵️
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[11px] font-black border border-indigo-200 dark:border-indigo-800">
                    TAKIM SAVAŞI
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    4-12+ Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Codenames
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Kırmızı ve Mavi casus liderleri tek kelimelik ipuçları verir, ajanlar gizli kelimeleri çözer. Suikastçıya dikkat!
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  ✨ Gemini AI Casus
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  ⏱️ Zamanlayıcı
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-codenames"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('codenames');
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>AJANLARI BAŞLAT</span>
              </button>
            </div>
          </div>

          {/* GAME 2: SAHTEKÂR RESSAM (IMPOSTER LINE) */}
          <div
            id="card-game-imposter"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-amber-100 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  🎭
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-200 dark:border-amber-800">
                    ÇİZİM & BLÖF
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    3-10 Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Imposter
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Herkes gizli kelimeyi biliyor, biri hariç! Sırayla tek bir kesintisiz çizgi çekin, sahtekârı oylamayla yakalayın.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  ✏️ Tek Çizgi
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  🤖 Bot Desteği
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-imposter"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('imposter');
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>RESSAMI BAŞLAT</span>
              </button>
            </div>
          </div>

          {/* GAME 3: YALAN USTASI (BLUFF TRIVIA) */}
          <div
            id="card-game-bluff"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-rose-100 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  🤥
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[11px] font-black border border-rose-200 dark:border-rose-800">
                    FIBBAGE TARZI
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    2-10 Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Fibbage (Bluff Trivia)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  İnanılmaz gerçek sorulara inandırıcı yalanlar yazın. Rakiplerinizi kandırıp puanları kapın, gerçeği bulun!
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  ✨ Gemini AI Soruları
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  🔥 Blöf Puanı
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-bluff"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('bluff');
                }}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>YALANLARI BAŞLAT</span>
              </button>
            </div>
          </div>

          {/* GAME 4: SAATLİ BOMBA (WORD BOMB) */}
          <div
            id="card-game-bomb"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-orange-100 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-red-600 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  💣
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-[11px] font-black border border-orange-200 dark:border-orange-800">
                    BOMBPARTY
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    2-12 Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  Word Bomb
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Bomba elinizde patlamadan ekrandaki heceyi içeren geçerli bir kelime yazıp sıradaki oyuncuya fırlatın!
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  🔥 Hızlı Refleks
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  💥 Can Sistemi
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-bomb"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('bomb');
                }}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>BOMBAYI KUR</span>
              </button>
            </div>
          </div>

          {/* GAME 5: TRIVIA PURSUIT (BİLGİ ÇARKI & 6 ROZET) */}
          <div
            id="card-game-trivia"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-emerald-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  🏆
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-800">
                    TRIVIAL PURSUIT
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    2-10 Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Trivia Pursuit (Bilgi Çarkı)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Tekrar etmeyen zengin soru havuzu & AI desteği! Çarkı çevirip 6 farklı kategorideki tüm rozetleri toplayın.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  🎡 6 Kategori
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  ✨ Yapay Zeka
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-trivia"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('trivia_pursuit');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>TRIVIA YARIŞINI BAŞLAT</span>
              </button>
            </div>
          </div>

          {/* GAME 6: AT YARIŞI (GANYAN) */}
          <div
            id="card-game-race"
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-3 border-lime-100 dark:border-slate-800 hover:border-lime-400 dark:hover:border-lime-500 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group game-card-pop relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-lime-500 to-amber-400 text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-slate-700">
                  🏇
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-lime-100 dark:bg-lime-950 text-lime-800 dark:text-lime-300 text-[11px] font-black border border-lime-300 dark:border-lime-800">
                    GANYAN
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    2-8 Oyuncu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                  At Yarışı
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Bildiğin ganyan. Altı at, canlı oranlar, form çizelgesi. Ganyan/plase/ikili kuponunu yatır, izle. Kasası en kalabalık olan kazanır.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  📺 TV Host
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  📱 Telefon Kumandası
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  📊 Form Çizelgesi
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                  🎫 Ganyan/Plase/İkili
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                id="btn-launch-race"
                onClick={() => {
                  playTurnSound();
                  onSelectGame('race');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-black text-xs rounded-2xl shadow-md btn-party flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>PİSTE ÇIK</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
