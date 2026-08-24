import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Tv,
  Smartphone,
  Users,
  HelpCircle,
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

import { t } from '../../i18n';
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
  // NOT: Bu ekran diger oyunlarla ayni "icerik blogu" desenini kullanir —
  // kendi min-h-screen sayfasini KURMAZ. Uygulama kabugu (App.tsx) zaten
  // arka plani, HeaderBar'i ve temayi sagliyor.
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Parti Arenası')}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white dark:border-slate-700">
              🥊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('Quiplash')}</h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black border border-purple-300 dark:border-purple-800">
                  {t('MİZAH VE LAF CAMBAZLIĞI DÜELLOSU')}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {t('Absürt sorulara en komik cevabı yaz, oyları topla, rakiplerini tek tek ele!')}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsRulesOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all shadow-xs cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          {t('Nasıl Oynanır?')}</button>
      </div>

      <div className="w-full">

        {/* Mode Selector Cards */}
        {playMode === 'lobby' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {/* 1. TV Host Mode */}
            <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-purple-500/30 hover:border-purple-500/70 shadow-2xl transition-all group backdrop-blur-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Tv className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('TV Ekranı (Host)')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("Odayı büyük ekranda kurun. Oyuncular telefonlarından odaya katılsın, oylar ve kapışmalar TV'de aksın.")}</p>
              </div>

              <button
                onClick={handleStartHost}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm shadow-xl shadow-purple-900/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4" />
                {t('TV Odanı Kur')}</button>
            </div>

            {/* 2. Mobile Controller Join */}
            <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-pink-500/30 hover:border-pink-500/70 shadow-2xl transition-all group backdrop-blur-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-600/20 text-pink-600 dark:text-pink-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('Telefondan Katıl')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('TV ekranındaki 4 haneli oda kodunu girerek telefonunuzu kontrol kumandasına dönüştürün.')}</p>
              </div>

              <button
                onClick={() => setPlayMode('online_join')}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-amber-600 text-white font-black text-sm shadow-xl shadow-pink-900/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                {t('Odaya Katıl')}</button>
            </div>

            {/* 3. Pass & Play Local */}
            <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-amber-500/30 hover:border-amber-500/70 shadow-2xl transition-all group backdrop-blur-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('Tek Cihaz (Çevrimdışı)')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('İnternet veya ikinci ekran olmadan tek bir telefon veya tableti elden ele devrederek oynayın.')}</p>
              </div>

              <button
                onClick={() => setPlayMode('local')}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                {t('Tek Cihazda Başla')}</button>
            </div>
          </div>
        ) : (
          /* Mobile Join Form */
          <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{t('Telefondan Odaya Katıl')}</h3>
              <button
                onClick={() => setPlayMode('lobby')}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold"
              >
                {t('İptal')}</button>
            </div>

            {socket.errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {socket.errorMessage}
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="space-y-4">
              {/* Room Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  {t('4 Haneli Oda Kodu')}</label>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder={t('Örn: WOLF')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono font-black text-lg uppercase tracking-widest text-center focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  {t('Oyuncu Adınız')}</label>
                <input
                  type="text"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  placeholder={t('Adınızı yazın...')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                  {t('Avatar Seçin')}</label>
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
                          ? 'ring-2 ring-slate-900 dark:ring-white scale-110 shadow-lg'
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
      </div>

      {/* Rules Modal */}
      <QuiplashRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};
