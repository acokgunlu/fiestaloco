import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Tv,
  Smartphone,
  Users,
  HelpCircle,
  Sparkles,
  Flame,
  Trophy,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useQuiplashSocket } from '../../utils/useQuiplashSocket';
import { QuiplashTvView } from '../quiplash/QuiplashTvView';
import { QuiplashControllerView } from '../quiplash/QuiplashControllerView';
import { QuiplashPassAndPlay } from '../quiplash/QuiplashPassAndPlay';
import { QuiplashRulesModal } from '../quiplash/QuiplashRulesModal';
import { DEFAULT_PLAYER_PALETTE } from '../../data/wordPacks';
import { playClickSound } from '../../utils/audio';

interface QuiplashGameProps {
  onBackToHub: () => void;
}

export const QuiplashGame: React.FC<QuiplashGameProps> = ({ onBackToHub }) => {
  const [playMode, setPlayMode] = useState<'lobby' | 'online_host' | 'online_join' | 'local'>('lobby');
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Mobile Join Form
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_PLAYER_PALETTE[0].color);
  const [selectedColorName, setSelectedColorName] = useState(DEFAULT_PLAYER_PALETTE[0].name);

  // Socket
  const socket = useQuiplashSocket();

  // URL room param detection (?game=quiplash&room=CODE or ?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase());
      setPlayMode('online_join');
    }
  }, []);

  const handleStartHost = () => {
    playClickSound();
    setPlayMode('online_host');
    socket.createRoom();
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !playerNameInput.trim()) return;

    playClickSound();
    socket.joinRoom(
      joinCodeInput.trim().toUpperCase(),
      playerNameInput.trim(),
      selectedAvatar,
      selectedColor,
      'player'
    );
  };

  // If in online_host mode and room is created:
  if (playMode === 'online_host' && socket.roomCode) {
    return (
      <>
        <QuiplashTvView
          roomCode={socket.roomCode}
          gameState={socket.gameState}
          players={socket.players}
          onStartGame={socket.startGame}
          onNextMatchup={socket.nextMatchup}
          onNextRound={socket.startNextRound}
          onRestartGame={socket.restartGame}
          onOpenRules={() => setIsRulesOpen(true)}
          onBackToHub={onBackToHub}
        />
        <QuiplashRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </>
    );
  }

  // If in online_join mode and joined room:
  if (playMode === 'online_join' && socket.myPlayer && socket.roomCode) {
    return (
      <>
        <QuiplashControllerView
          roomCode={socket.roomCode}
          player={socket.myPlayer}
          gameState={socket.gameState}
          assignedPrompts={socket.myAssignedPrompts}
          onSubmitAnswers={socket.submitPromptAnswers}
          onVoteMatchup={socket.voteMatchupAnswer}
          onSubmitLastLashAnswer={socket.submitLastLashAnswer}
          onVoteLastLash={socket.submitLastLashVotes}
        />
        <QuiplashRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </>
    );
  }

  // If in local pass-and-play mode:
  if (playMode === 'local') {
    return (
      <>
        <QuiplashPassAndPlay
          onBackToHub={() => setPlayMode('lobby')}
          onOpenRules={() => setIsRulesOpen(true)}
        />
        <QuiplashRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </>
    );
  }

  // Otherwise, render Room Setup / Mode Picker
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative selection:bg-purple-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          FiestaLoco Hub
        </button>

        <button
          onClick={() => setIsRulesOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all border border-slate-800"
        >
          <HelpCircle className="w-4 h-4 text-purple-400" />
          Nasıl Oynanır?
        </button>
      </header>

      {/* Center Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center py-8 max-w-4xl mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-black tracking-widest uppercase mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            MİZAH VE LAF CAMBAZLIĞI DÜELLOSU
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            QUIPLASH
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mx-auto mt-2">
            Absürt sorulara en komik cevabı yaz, oyları topla, rakiplerini tek tek ele!
          </p>
        </div>

        {/* Mode Selector Cards */}
        {playMode === 'lobby' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {/* 1. TV Host Mode */}
            <div className="flex flex-col justify-between p-7 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border-2 border-purple-500/30 hover:border-purple-500/70 shadow-2xl transition-all group backdrop-blur-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Tv className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">TV Ekranı (Host)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Odayı büyük ekranda kurun. Oyuncular telefonlarından odaya katılsın, oylar ve kapışmalar TV'de aksın.
                </p>
              </div>

              <button
                onClick={handleStartHost}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm shadow-xl shadow-purple-900/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4" />
                TV Odanı Kur
              </button>
            </div>

            {/* 2. Mobile Controller Join */}
            <div className="flex flex-col justify-between p-7 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border-2 border-pink-500/30 hover:border-pink-500/70 shadow-2xl transition-all group backdrop-blur-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-pink-600/20 text-pink-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Telefondan Katıl</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  TV ekranındaki 4 haneli oda kodunu girerek telefonunuzu kontrol kumandasına dönüştürün.
                </p>
              </div>

              <button
                onClick={() => setPlayMode('online_join')}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-amber-600 text-white font-black text-sm shadow-xl shadow-pink-900/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Odaya Katıl
              </button>
            </div>

            {/* 3. Pass & Play Local */}
            <div className="flex flex-col justify-between p-7 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border-2 border-amber-500/30 hover:border-amber-500/70 shadow-2xl transition-all group backdrop-blur-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Tek Cihaz (Çevrimdışı)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  İnternet veya ikinci ekran olmadan tek bir telefon veya tableti elden ele devrederek oynayın.
                </p>
              </div>

              <button
                onClick={() => setPlayMode('local')}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Tek Cihazda Başla
              </button>
            </div>
          </div>
        ) : (
          /* Mobile Join Form */
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Telefondan Odaya Katıl</h3>
              <button
                onClick={() => setPlayMode('lobby')}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                İptal
              </button>
            </div>

            {socket.errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {socket.errorMessage}
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="space-y-4">
              {/* Room Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  4 Haneli Oda Kodu
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="Örn: WOLF"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono font-black text-lg uppercase tracking-widest text-center focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Oyuncu Adınız
                </label>
                <input
                  type="text"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  placeholder="Adınızı yazın..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-2">
                  Avatar Seçin
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {DEFAULT_PLAYER_PALETTE.map((pal) => (
                    <button
                      type="button"
                      key={pal.color}
                      onClick={() => {
                        setSelectedAvatar(pal.avatar);
                        setSelectedColor(pal.color);
                        setSelectedColorName(pal.name);
                      }}
                      className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                        selectedColor === pal.color
                          ? 'ring-2 ring-white scale-110 shadow-lg'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: pal.color }}
                    >
                      {pal.avatar}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!socket.isConnected}
                className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {!socket.isConnected ? 'Bağlanıyor...' : 'Odaya Gir ve Başla'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 font-medium">
        FiestaLoco • Multi-Device Party Gaming Platform
      </footer>

      {/* Rules Modal */}
      <QuiplashRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};
