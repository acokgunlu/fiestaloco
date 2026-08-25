import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Tv,
  Smartphone,
  Users,
  Trophy,
  HelpCircle,
  Play,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Flame,
  Award,
  ChevronRight,
  Disc,
} from 'lucide-react';
import { useTriviaPursuitSocket } from '../../utils/useTriviaPursuitSocket';
import { TriviaTvView } from '../trivia/TriviaTvView';
import { TriviaControllerView } from '../trivia/TriviaControllerView';
import { TriviaPassAndPlay } from '../trivia/TriviaPassAndPlay';
import { TriviaCategory, TRIVIA_CATEGORIES } from '../../types/triviaPursuit';
import { playClickSound, playTurnSound } from '../../utils/audio';

import { t, withLang } from '../../i18n';
interface TriviaPursuitGameProps {
  onBackToHub: () => void;
}

const AVATAR_LIST = ['🦁', '🦊', '🐼', '🦄', '🐯', '🐙', '🐨', '🐸', '🚀', '⚡', '🔥', '👑'];
const COLOR_LIST = [
  { hex: '#3b82f6', name: 'Mavi' },
  { hex: '#ef4444', name: 'Kırmızı' },
  { hex: '#10b981', name: 'Yeşil' },
  { hex: '#f59e0b', name: 'Sarı' },
  { hex: '#8b5cf6', name: 'Mor' },
  { hex: '#ec4899', name: 'Pembe' },
  { hex: '#06b6d4', name: 'Camgöbeği' },
  { hex: '#14b8a6', name: 'Teal' },
];

export const TriviaPursuitGame: React.FC<TriviaPursuitGameProps> = ({ onBackToHub }) => {
  const [playMode, setPlayMode] = useState<'online_host' | 'online_join' | 'local'>('online_host');
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_LIST[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_LIST[0]);
  const [selectedWedgesTarget, setSelectedWedgesTarget] = useState<number>(6);
  const [selectedTimerSec, setSelectedTimerSec] = useState<number>(20);
  const [enableAiQuestions, setEnableAiQuestions] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const socket = useTriviaPursuitSocket();

  // Read URL params for auto-join
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomCodeInput(roomParam.toUpperCase());
      setPlayMode('online_join');
    }
  }, []);

  const handleCopyLink = (code: string) => {
    playClickSound();
    const url = withLang(`${window.location.origin}${window.location.pathname}?game=trivia_pursuit&room=${code}`);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Host Create Room
  const handleHostCreateRoom = () => {
    playTurnSound();
    socket.createRoom({
      wedgesToWin: selectedWedgesTarget,
      turnTimerSec: selectedTimerSec,
      allPlayersAnswer: true,
      aiDynamicQuestions: enableAiQuestions,
    });
  };

  // Handle Player Join
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCodeInput.trim() || !playerNameInput.trim()) return;
    playClickSound();
    socket.joinRoom(
      joinRoomCodeInput.trim(),
      playerNameInput.trim(),
      selectedAvatar,
      selectedColor.hex,
      selectedColor.name
    );
  };

  const isOnlineActive = Boolean(socket.roomCode && socket.gameState);

  // If in Local Pass & Play Mode
  if (playMode === 'local') {
    return <TriviaPassAndPlay onBackToLobby={() => setPlayMode('online_host')} />;
  }

  // If connected as TV Host / Observer
  if (socket.roomCode && socket.clientRole === 'observer' && socket.gameState) {
    return (
      <TriviaTvView
        roomCode={socket.roomCode}
        gameState={socket.gameState}
        players={socket.players}
        onStartGame={socket.startGame}
        onSpinWheel={socket.spinWheel}
        onRollDie={socket.rollDie}
        onPickMove={socket.pickMove}
        onSelectCategory={socket.selectCategory}
        onNextRound={socket.nextRound}
        onRestartGame={socket.restartGame}
        onGenerateAiQuestions={() => socket.generateAiQuestions()}
        isGeneratingAi={socket.isGeneratingAi}
      />
    );
  }

  // If connected as Mobile Phone Controller
  if (socket.roomCode && socket.clientRole === 'player' && socket.gameState) {
    return (
      <TriviaControllerView
        roomCode={socket.roomCode}
        myPlayer={socket.myPlayer}
        gameState={socket.gameState}
        players={socket.players}
        myAnswerSubmitted={socket.myAnswerSubmitted}
        onSubmitAnswer={socket.submitAnswer}
        onSpinWheel={socket.spinWheel}
        onRollDie={socket.rollDie}
        onPickMove={socket.pickMove}
        onSelectCategory={socket.selectCategory}
      />
    );
  }

  return (
    <div
      id="trivia-pursuit-container"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in text-slate-900 dark:text-slate-100"
    >
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-hub"
            onClick={() => {
              playClickSound();
              onBackToHub();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Parti Arenası')}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white dark:border-slate-700">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('Trivia Pursuit')}</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                  {t('BİLGİ ÇARKI & 6 ROZET')}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {t('Tekrar etmeyen zengin soru havuzu & AI desteği')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {socket.roomCode && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-black text-xs">
              {t('Oda:')} <span className="font-mono tracking-widest">{socket.roomCode}</span>
            </div>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('6 Kategori')}</span>
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      {!isOnlineActive && (
        <div className="flex p-1.5 bg-slate-200/70 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-300/80 dark:border-slate-700 gap-1.5 shadow-xs">
          <button
            id="tab-mode-tv-host"
            onClick={() => {
              playClickSound();
              setPlayMode('online_host');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'online_host'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>{t('📺 TV / Ana Ekran Odası Aç')}</span>
          </button>

          <button
            id="tab-mode-phone-controller"
            onClick={() => {
              playClickSound();
              setPlayMode('online_join');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'online_join'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{t('📱 Telefondan Katıl (Kumanda)')}</span>
          </button>

          <button
            id="tab-mode-local-pass"
            onClick={() => {
              playClickSound();
              setPlayMode('local');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'local'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('📲 Tek Cihaz (Elden Ele)')}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ONLINE TV HOST SCREEN                                                  */}
      {/* ========================================================================= */}
      {playMode === 'online_host' && (
        <div className="space-y-6">
          {!socket.roomCode ? (
            /* TV Host Create Room Hero */
            <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-700 dark:from-emerald-600 dark:via-teal-800 dark:to-indigo-900 text-white rounded-3xl p-8 sm:p-12 border-4 border-white/80 dark:border-slate-800 shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-8xl opacity-15 pointer-events-none select-none">
                🎡
              </div>
              <div className="absolute -bottom-10 -left-10 text-8xl opacity-15 pointer-events-none select-none">
                🏆
              </div>

              <div className="max-w-xl mx-auto space-y-4 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 text-slate-950 dark:text-amber-400 flex items-center justify-center text-4xl mx-auto shadow-2xl animate-bounce border-2 border-white/40">
                  🏆
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                  {t('Trivia Pursuit TV Host')}</h2>
                <p className="text-emerald-100 dark:text-emerald-200 text-sm sm:text-base font-medium leading-relaxed">
                  {t('Büyük ekranda 6 renkli çark döner! Oyuncular telefonlarından cevap verir, 6 farklı kategorideki tüm rozetleri ilk toplayan şampiyon olur!')}</p>

                {/* Badges / Category Preview Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {Object.values(TRIVIA_CATEGORIES).map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-xs backdrop-blur-md flex items-center gap-1"
                      style={{ backgroundColor: `${cat.color}cc` }}
                    >
                      <span>{cat.icon}</span>
                      <span>{t(cat.label || '')}</span>
                    </span>
                  ))}
                </div>

                {/* Config Controls (Wedges to Win, Timer, AI) */}
                <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-4 text-left">
                  {/* Wedges to win */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-emerald-100 tracking-wider">
                      {t('🎯 Kazanma Hedefi:')}</span>
                    <div className="flex items-center gap-2">
                      {[3, 4, 6].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            playClickSound();
                            setSelectedWedgesTarget(count);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            selectedWedgesTarget === count
                              ? 'bg-white text-emerald-950 shadow-md scale-105'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {count === 6 ? '6 Rozet (Tam)' : `${count} Rozet (Hızlı)`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Turn Timer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="text-xs font-black uppercase text-emerald-100 tracking-wider">
                      {t('⏱️ Soru Süresi:')}</span>
                    <div className="flex items-center gap-2">
                      {[15, 20, 30].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => {
                            playClickSound();
                            setSelectedTimerSec(sec);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            selectedTimerSec === sec
                              ? 'bg-white text-emerald-950 shadow-md scale-105'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {t('{a} Saniye', { a: sec })}</button>
                      ))}
                    </div>
                  </div>

                  {/* AI Dynamic Questions */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black uppercase text-emerald-100 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{t('Gemini AI Soruları:')}</span>
                      </span>
                      <p className="text-[11px] text-emerald-200">
                        {t('Zengin yerel veri tabanına ek olarak dinamik sorular üretilir')}</p>
                    </div>
                    <button
                      onClick={() => {
                        playClickSound();
                        setEnableAiQuestions(!enableAiQuestions);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        enableAiQuestions
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {enableAiQuestions ? t('AÇIK ✨') : 'KAPALI'}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-create-trivia-room"
                    onClick={handleHostCreateRoom}
                    className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-emerald-50 text-slate-950 font-black text-base rounded-2xl shadow-xl hover:scale-105 transition-transform cursor-pointer border-2 border-emerald-300"
                  >
                    {t('ONLINE TV ODASI OLUŞTUR ➔')}</button>
                </div>
              </div>
            </div>
          ) : (
            /* Active TV Room Content */
            <div className="space-y-6">
              {/* Room Code & Sharing Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-black rounded-lg uppercase tracking-wider">
                    {t('TV HOST CANLI')}</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t('Oda:')} <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">{socket.roomCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(socket.roomCode!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? t('Kopyalandı!') : t('Bağlantıyı Kopyala')}</span>
                  </button>
                </div>
              </div>

              {/* In-Game Active TV Stage */}
              <TriviaTvView
                roomCode={socket.roomCode}
                gameState={socket.gameState!}
                players={socket.players}
                onStartGame={socket.startGame}
                onSpinWheel={socket.spinWheel}
                onRollDie={socket.rollDie}
                onPickMove={socket.pickMove}
                onSelectCategory={socket.selectCategory}
                onNextRound={socket.nextRound}
                onRestartGame={socket.restartGame}
                onGenerateAiQuestions={() => socket.generateAiQuestions()}
                isGeneratingAi={socket.isGeneratingAi}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ONLINE PHONE CONTROLLER JOIN FORM                                      */}
      {/* ========================================================================= */}
      {playMode === 'online_join' && (
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-3 border-emerald-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl mx-auto shadow-md font-black">
                📱
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('Telefondan Odaya Katıl')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {t('TV ekranındaki 4 haneli oda kodunu girerek kumandanızı aktifleştirin.')}</p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              {/* Room Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('Oda Kodu:')}</label>
                <input
                  id="input-trivia-room-code"
                  type="text"
                  maxLength={4}
                  placeholder={t('ÖRN: WOLF')}
                  value={joinRoomCodeInput}
                  onChange={(e) => setJoinRoomCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-center text-xl font-mono font-black tracking-widest uppercase text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              {/* Player Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('Oyuncu Adınız:')}</label>
                <input
                  id="input-trivia-player-name"
                  type="text"
                  maxLength={15}
                  placeholder={t('Adınızı yazın')}
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-center text-base font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('Avatar Seçin:')}</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_LIST.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedAvatar(av);
                      }}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                        selectedAvatar === av
                          ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 dark:ring-emerald-800 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('Tema Rengi:')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_LIST.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedColor(c);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        selectedColor.hex === c.hex
                          ? 'border-slate-900 dark:border-white shadow-sm scale-105 text-white'
                          : 'border-transparent text-white/90 hover:opacity-90'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="btn-join-trivia-submit"
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer mt-4"
              >
                <Smartphone className="w-4 h-4" />
                <span>{t('KUMANDAYI BAĞLA')}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
