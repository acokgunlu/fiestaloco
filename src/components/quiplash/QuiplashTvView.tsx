import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  Trophy,
  Users,
  Flame,
  Sparkles,
  ArrowRight,
  Clock,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Crown,
  Zap,
} from 'lucide-react';
import {
  QuiplashGameState,
  QuiplashPlayer,
  QuiplashMatchup,
} from '../../types/quiplash';
import { isSoundEnabled, toggleSound, playCorrectSound, playClickSound } from '../../utils/audio';

import { t, withLang } from '../../i18n';
interface QuiplashTvViewProps {
  roomCode: string;
  gameState: QuiplashGameState;
  players: QuiplashPlayer[];
  onStartGame: () => void;
  onNextMatchup: () => void;
  onNextRound: () => void;
  onRestartGame: () => void;
  onOpenRules: () => void;
  onBackToHub: () => void;
}

export const QuiplashTvView: React.FC<QuiplashTvViewProps> = ({
  roomCode,
  gameState,
  players,
  onStartGame,
  onNextMatchup,
  onNextRound,
  onRestartGame,
  onOpenRules,
  onBackToHub,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    const origin = window.location.origin;
    const joinUrl = withLang(`${origin}/?game=quiplash&room=${roomCode}`);
    QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 280,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code error:', err));
  }, [roomCode]);

  const handleToggleAudio = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  const activeMatchup = gameState.currentMatchup;
  const isMatchupResult = gameState.phase === 'MATCHUP_RESULT';
  const isRoundScores = gameState.phase === 'ROUND_SCORES';
  const isLastLashResult = gameState.phase === 'LAST_LASH_RESULT';
  const isGameOver = gameState.phase === 'GAME_OVER';

  return (
    // TV sahnesi bilerek koyu kalir (projeksiyonda okunakli olsun diye), ama
    // artik kendi min-h-screen sayfasini KURMAZ — diger TV gorunumleri gibi
    // uygulama kabugunun icinde tam genislikte bir panel olarak yasar.
    <div className="w-full rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden relative selection:bg-purple-500 selection:text-white min-h-[85vh]">
      {/* Background glowing comedy party lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top TV Bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700/50"
          >
            {t('← FiestaLoco Hub')}</button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 flex items-center justify-center text-white text-lg shadow-md shadow-pink-500/20">
              🥊
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                {t('QUIPLASH')}</h1>
              <span className="text-[10px] text-slate-400 font-bold block -mt-0.5">
                {t('TV Host • Ana Ekran')}</span>
            </div>
          </div>
        </div>

        {/* Center Round / Matchup Tag */}
        {gameState.phase !== 'LOBBY' && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-black tracking-wide uppercase flex items-center gap-2 shadow-inner">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {gameState.phase === 'LAST_LASH_WRITING' ||
              gameState.phase === 'LAST_LASH_VOTING' ||
              gameState.phase === 'LAST_LASH_RESULT'
                ? t('BÜYÜK FİNAL (THE LAST LASH)')
                : `TUR ${gameState.currentRound} / ${gameState.totalRounds}`}
            </div>

            {gameState.isTimerRunning && (
              <div className="px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                {gameState.timerSeconds}s
              </div>
            )}
          </div>
        )}

        {/* Right action tools */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {t('ODA:')} <span className="text-amber-400 font-black tracking-widest">{roomCode}</span>
          </div>

          <button
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
            title={t('Kurallar')}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleAudio}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
            title={t('Ses Aç/Kapat')}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-8 py-6 relative z-10 max-w-7xl mx-auto w-full">
        {/* ============================================================ */}
        {/* 1. LOBBY PHASE                                               */}
        {/* ============================================================ */}
        {gameState.phase === 'LOBBY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
            {/* Left QR & Join instructions */}
            <div className="lg:col-span-5 flex flex-col items-center text-center p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
              <span className="text-xs font-black tracking-widest uppercase text-pink-400 mb-2">
                {t('TELEFONDAN KATILIN')}</span>
              <h2 className="text-3xl font-black text-white mb-4">
                Oda Kodu:{' '}
                <span className="text-amber-400 tracking-wider font-mono bg-slate-950 px-3 py-1 rounded-xl border border-amber-500/30">
                  {roomCode}
                </span>
              </h2>

              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-purple-950/50 mb-4 transform hover:scale-105 transition-transform">
                  <img src={qrDataUrl} alt={t('Join QR')} className="w-52 h-52 object-contain rounded-xl" />
                </div>
              ) : (
                <div className="w-52 h-52 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <span className="text-xs text-slate-400">{t('QR Yükleniyor...')}</span>
                </div>
              )}

              <p className="text-xs text-slate-400 max-w-xs font-medium">
                Telefonunuzun kamerasını okutun veya tarayıcıdan{' '}
                <strong className="text-white">{window.location.host}</strong> adresine girip{' '}
                <strong className="text-amber-400">{roomCode}</strong> yazın.
              </p>
            </div>

            {/* Right Joined Players List */}
            <div className="lg:col-span-7 flex flex-col justify-between p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl min-h-[460px]">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-black tracking-wide text-white">
                      Katılan Oyuncular ({players.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">
                    {players.length < 2 ? 'En az 2 oyuncu gerekli' : t('Oyuna hazır!')}
                  </span>
                </div>

                {players.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                    <Users className="w-12 h-12 text-slate-700 animate-bounce" />
                    <p className="text-sm font-bold">{t('İlk oyuncunun katılması bekleniyor...')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-72 overflow-y-auto pr-1">
                    {players.map((p, idx) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-md"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md"
                          style={{ backgroundColor: p.color || '#8b5cf6' }}
                        >
                          {p.avatar || '🥊'}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-black text-white truncate">{p.name}</h4>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {t('Hazır')}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Button */}
              <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={onStartGame}
                  disabled={players.length < 2}
                  className={`px-8 py-4 rounded-2xl font-black text-base flex items-center gap-3 transition-all shadow-xl ${
                    players.length >= 2
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:opacity-95 text-white shadow-purple-900/50 hover:scale-105'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  {t('Quiplash’ı Başlat!')}</button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. WRITING PROMPTS PHASE                                     */}
        {/* ============================================================ */}
        {gameState.phase === 'WRITING_PROMPTS' && (
          <div className="text-center w-full max-w-3xl flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-4xl shadow-2xl shadow-purple-600/30 mb-6 animate-pulse"
            >
              ✍️
            </motion.div>

            <span className="text-xs font-black tracking-widest uppercase text-pink-400 mb-2">
              TUR {gameState.currentRound} • YAZMA AŞAMASI
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
              {t('Telefonlarınıza Bakın!')}</h2>
            <p className="text-slate-400 text-sm max-w-lg mb-8">
              {t('Her oyuncu telefonuna gelen 2 absürt soruya en komik yanıtını yazıyor. Süre bitmeden hazır olun!')}</p>

            {/* Submission Status Pills */}
            <div className="w-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400">{t('Yanıt Gönderenler')}</span>
                <span className="text-xs font-black text-amber-400">
                  {gameState.submittedPlayerIds?.length || 0} / {players.length} Tamamlandı
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {players.map((p) => {
                  const isDone = gameState.submittedPlayerIds?.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                      }`}
                    >
                      <div className="text-lg">{p.avatar || '🥊'}</div>
                      <div className="overflow-hidden text-left flex-1">
                        <div className="text-xs font-bold truncate text-white">{p.name}</div>
                        <div className="text-[10px] font-semibold">
                          {isDone ? t('✓ Gönderdi') : t('⏳ Yazıyor...')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MATCHUP VOTING & RESULT PHASE                             */}
        {/* ============================================================ */}
        {(gameState.phase === 'MATCHUP_VOTING' || gameState.phase === 'MATCHUP_RESULT') && activeMatchup && (
          <div className="w-full flex flex-col items-center">
            {/* Header info */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs uppercase tracking-widest shadow-md">
                Kapışma #{gameState.currentMatchupIndex + 1} / {gameState.matchups.length}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {activeMatchup.prompt.category}
              </span>
            </div>

            {/* Big Prompt Question Card */}
            <motion.div
              key={activeMatchup.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-4xl p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-purple-500/30 shadow-2xl text-center mb-8 relative overflow-hidden"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                "{activeMatchup.prompt.prompt}"
              </p>
            </motion.div>

            {/* 2 Duel Answer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-8">
              {/* Answer 1 (Left Card - Cyan / Indigo) */}
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`p-7 rounded-3xl border-2 flex flex-col justify-between transition-all shadow-2xl relative overflow-hidden min-h-[220px] ${
                  isMatchupResult && activeMatchup.answer1.isQuiplash
                    ? 'bg-gradient-to-br from-amber-950/60 to-yellow-900/60 border-amber-400 ring-4 ring-amber-400/30'
                    : isMatchupResult &&
                      activeMatchup.answer1.votes.length > activeMatchup.answer2.votes.length
                    ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border-cyan-400 ring-2 ring-cyan-400/20'
                    : 'bg-slate-900/90 border-slate-700/80'
                }`}
              >
                {/* Quiplash Sweep Banner */}
                {isMatchupResult && activeMatchup.answer1.isQuiplash && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg animate-bounce">
                    {t('👑 QUIPLASH! (+500 BONUS)')}</div>
                )}

                <div className="mb-4">
                  <span className="text-xs font-black tracking-widest uppercase text-cyan-400 block mb-2">
                    {t('SEÇENEK A')}</span>
                  <p className="text-2xl sm:text-3xl font-black text-white leading-snug">
                    "{activeMatchup.answer1.text || t('Hiçbir yanıt yok')}"
                  </p>
                </div>

                {/* Vote Count / Result Reveal */}
                {isMatchupResult && (
                  <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center text-lg shadow">
                        {activeMatchup.answer1.playerAvatar || '🥊'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">
                          {activeMatchup.answer1.playerName}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-extrabold">
                          +{activeMatchup.answer1.pointsEarned || 0} Puan
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-cyan-400">
                        {activeMatchup.answer1.votes.length} Oy
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Answer 2 (Right Card - Orange / Rose) */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`p-7 rounded-3xl border-2 flex flex-col justify-between transition-all shadow-2xl relative overflow-hidden min-h-[220px] ${
                  isMatchupResult && activeMatchup.answer2.isQuiplash
                    ? 'bg-gradient-to-br from-amber-950/60 to-yellow-900/60 border-amber-400 ring-4 ring-amber-400/30'
                    : isMatchupResult &&
                      activeMatchup.answer2.votes.length > activeMatchup.answer1.votes.length
                    ? 'bg-gradient-to-br from-rose-950/80 to-pink-950/80 border-rose-400 ring-2 ring-rose-400/20'
                    : 'bg-slate-900/90 border-slate-700/80'
                }`}
              >
                {/* Quiplash Sweep Banner */}
                {isMatchupResult && activeMatchup.answer2.isQuiplash && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg animate-bounce">
                    {t('👑 QUIPLASH! (+500 BONUS)')}</div>
                )}

                <div className="mb-4">
                  <span className="text-xs font-black tracking-widest uppercase text-rose-400 block mb-2">
                    {t('SEÇENEK B')}</span>
                  <p className="text-2xl sm:text-3xl font-black text-white leading-snug">
                    "{activeMatchup.answer2.text || t('Hiçbir yanıt yok')}"
                  </p>
                </div>

                {/* Vote Count / Result Reveal */}
                {isMatchupResult && (
                  <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-lg shadow">
                        {activeMatchup.answer2.playerAvatar || '🥊'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">
                          {activeMatchup.answer2.playerName}
                        </span>
                        <span className="text-[10px] text-rose-400 font-extrabold">
                          +{activeMatchup.answer2.pointsEarned || 0} Puan
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-rose-400">
                        {activeMatchup.answer2.votes.length} Oy
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer action button */}
            {isMatchupResult && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={onNextMatchup}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl shadow-purple-900/50 hover:scale-105 transition-all flex items-center gap-2"
              >
                {gameState.currentMatchupIndex + 1 >= gameState.matchups.length ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    {t('Tur Skorlarını Gör')}</>
                ) : (
                  <>
                    <span>{t('Sonraki Kapışma')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. ROUND SCORES LEADERBOARD                                  */}
        {/* ============================================================ */}
        {isRoundScores && (
          <div className="w-full max-w-3xl flex flex-col items-center">
            <span className="text-xs font-black tracking-widest uppercase text-pink-400 mb-2">
              TUR {gameState.currentRound} PUAN TABLOSU
            </span>
            <h2 className="text-4xl font-black text-white mb-6">{t('Mizah Liderleri')}</h2>

            <div className="w-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-3 mb-8">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center text-lg font-black text-slate-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow"
                        style={{ backgroundColor: p.color || '#8b5cf6' }}
                      >
                        {p.avatar || '🥊'}
                      </div>
                      <span className="text-base font-bold text-white">{p.name}</span>
                    </div>

                    <span className="text-xl font-black text-amber-400">{p.score} Puan</span>
                  </div>
                ))}
            </div>

            <button
              onClick={onNextRound}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl shadow-purple-900/50 hover:scale-105 transition-all flex items-center gap-3"
            >
              {gameState.currentRound < gameState.totalRounds ? (
                <>
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>{t('Sonraki Tura Geç (2x Puan)')}</span>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 text-amber-300" />
                  <span>{t('Büyük Finale Geç (The Last Lash)')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. LAST LASH (FINAL ROUND)                                   */}
        {/* ============================================================ */}
        {(gameState.phase === 'LAST_LASH_WRITING' ||
          gameState.phase === 'LAST_LASH_VOTING' ||
          gameState.phase === 'LAST_LASH_RESULT') && (
          <div className="w-full max-w-4xl flex flex-col items-center text-center">
            <span className="text-xs font-black tracking-widest uppercase text-amber-400 mb-2">
              {t('👑 BÜYÜK FİNAL • THE LAST LASH (3X PUAN)')}</span>

            {gameState.lastLashPrompt && (
              <div className="w-full p-8 rounded-3xl bg-gradient-to-b from-purple-950/80 to-slate-950 border-2 border-amber-500/40 shadow-2xl text-center mb-8">
                <p className="text-3xl sm:text-4xl font-black text-white">
                  "{gameState.lastLashPrompt.prompt}"
                </p>
              </div>
            )}

            {gameState.phase === 'LAST_LASH_WRITING' && (
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 w-full max-w-xl text-center">
                <h3 className="text-xl font-bold text-white mb-2">{t('Herkes Tek Bir Soruya Cevap Yazıyor!')}</h3>
                <p className="text-xs text-slate-400">
                  {t('Telefonunuza gelen son soruda en yüksek mizah potansiyelinizi ortaya koyun.')}</p>
              </div>
            )}

            {(gameState.phase === 'LAST_LASH_VOTING' || gameState.phase === 'LAST_LASH_RESULT') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
                {(gameState.lastLashAnswers || []).map((ans, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-left shadow-lg"
                  >
                    <p className="text-lg font-bold text-white mb-3">"{ans.text}"</p>
                    {gameState.phase === 'LAST_LASH_RESULT' && (
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-400">{ans.playerName}</span>
                        <span className="font-black text-amber-400">
                          {ans.votes.length} Oy (+{ans.pointsEarned || 0} Pts)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {gameState.phase === 'LAST_LASH_RESULT' && (
              <button
                onClick={onNextRound}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-base shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <Crown className="w-5 h-5" />
                {t('Şampiyonu Açıkla!')}</button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. GAME OVER & PODIUM                                        */}
        {/* ============================================================ */}
        {isGameOver && (
          <div className="w-full max-w-3xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-4xl shadow-2xl shadow-amber-400/30 mb-4 animate-bounce">
              👑
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-amber-400 mb-2">
              {t('OYUN BİTTİ')}</span>
            <h2 className="text-5xl font-black text-white mb-8">{t('QUIPLASH ŞAMPİYONU')}</h2>

            {/* Winner Spotlight Card */}
            {(() => {
              const sorted = [...players].sort((a, b) => b.score - a.score);
              const winner = sorted[0];
              if (!winner) return null;

              return (
                <div className="w-full p-8 rounded-3xl bg-gradient-to-b from-amber-500/20 via-purple-900/30 to-slate-950 border-2 border-amber-400/60 shadow-2xl flex flex-col items-center mb-8">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl mb-4 border-4 border-amber-400"
                    style={{ backgroundColor: winner.color || '#8b5cf6' }}
                  >
                    {winner.avatar || '🥊'}
                  </div>
                  <h3 className="text-3xl font-black text-white mb-1">{winner.name}</h3>
                  <span className="text-2xl font-black text-amber-400 mb-4">
                    {winner.score} Toplam Puan
                  </span>

                  {/* Rest of podium */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-6 border-t border-slate-800">
                    {sorted.slice(1, 3).map((p, i) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3"
                      >
                        <span className="text-2xl">{i === 0 ? '🥈' : '🥉'}</span>
                        <div className="text-left overflow-hidden">
                          <div className="text-sm font-bold text-white truncate">{p.name}</div>
                          <div className="text-xs font-bold text-amber-400">{p.score} Puan</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Replay action */}
            <div className="flex items-center gap-4">
              <button
                onClick={onRestartGame}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                {t('Yeniden Oyna')}</button>
              <button
                onClick={onBackToHub}
                className="px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base border border-slate-700 transition-all"
              >
                {t('Ana Menü')}</button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar Info */}
      <footer className="relative z-10 px-8 py-3 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 font-medium">
        {t('FiestaLoco • Quiplash TV Host Mode')}</footer>
    </div>
  );
};
