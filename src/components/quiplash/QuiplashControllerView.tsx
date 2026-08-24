import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { t } from '../../i18n';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Award,
  Crown,
  Trophy,
  Flame,
} from 'lucide-react';
import {
  QuiplashGameState,
  QuiplashPlayer,
  QuiplashPrompt,
} from '../../types/quiplash';

interface QuiplashControllerViewProps {
  roomCode: string;
  player: QuiplashPlayer | null;
  gameState: QuiplashGameState;
  assignedPrompts: QuiplashPrompt[];
  onSubmitAnswers: (answers: Record<string, string>) => void;
  onVoteMatchup: (answerIndex: 1 | 2) => void;
  onSubmitLastLashAnswer: (answer: string) => void;
  onVoteLastLash: (votedPlayerIds: string[]) => void;
}

export const QuiplashControllerView: React.FC<QuiplashControllerViewProps> = ({
  roomCode,
  player,
  gameState,
  assignedPrompts,
  onSubmitAnswers,
  onVoteMatchup,
  onSubmitLastLashAnswer,
  onVoteLastLash,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedVoteIndex, setSelectedVoteIndex] = useState<1 | 2 | null>(null);

  // Last Lash state
  const [lastLashText, setLastLashText] = useState<string>('');
  const [lastLashSubmitted, setLastLashSubmitted] = useState<boolean>(false);
  const [selectedMedalPlayerId, setSelectedMedalPlayerId] = useState<string | null>(null);

  // Reset local controller inputs on phase change
  useEffect(() => {
    if (gameState.phase === 'WRITING_PROMPTS') {
      setSubmitted(false);
      setAnswers({});
    } else if (gameState.phase === 'MATCHUP_VOTING') {
      setSelectedVoteIndex(player?.currentVoteAnswerIndex || null);
    } else if (gameState.phase === 'LAST_LASH_WRITING') {
      setLastLashSubmitted(false);
      setLastLashText('');
    } else if (gameState.phase === 'LAST_LASH_VOTING') {
      setSelectedMedalPlayerId(null);
    }
  }, [gameState.phase, gameState.currentMatchupIndex]);

  const handleAnswerChange = (promptId: string, text: string) => {
    if (text.length <= 80) {
      setAnswers((prev) => ({ ...prev, [promptId]: text }));
    }
  };

  const handleSubmitAllAnswers = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;
    setSubmitted(true);
    onSubmitAnswers(answers);
  };

  const handleVote = (idx: 1 | 2) => {
    setSelectedVoteIndex(idx);
    onVoteMatchup(idx);
  };

  const handleSubmitLastLash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastLashText.trim() || lastLashSubmitted) return;
    setLastLashSubmitted(true);
    onSubmitLastLashAnswer(lastLashText.trim());
  };

  const handleSelectLastLashMedal = (targetPlayerId: string) => {
    setSelectedMedalPlayerId(targetPlayerId);
    onVoteLastLash([targetPlayerId]);
  };

  const currentMatchup = gameState.currentMatchup;
  const isAuthorInCurrentMatchup =
    currentMatchup &&
    player &&
    (currentMatchup.answer1.playerId === player.id ||
      currentMatchup.answer2.playerId === player.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Controller Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: player?.color || '#8b5cf6' }}
          >
            {player?.avatar || '🥊'}
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">
              {player?.name || 'Oyuncu'}
            </h2>
            <span className="text-xs font-bold text-amber-400">
              {player?.score || 0} Puan
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            {t('ODA KODU')}</span>
          <span className="text-sm font-black font-mono text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {roomCode}
          </span>
        </div>
      </header>

      {/* Main Controller Area */}
      <main className="flex-1 flex flex-col justify-center py-6 max-w-lg mx-auto w-full">
        {/* ============================================================ */}
        {/* 1. LOBBY PHASE                                               */}
        {/* ============================================================ */}
        {gameState.phase === 'LOBBY' && (
          <div className="text-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              🎮
            </div>
            <h3 className="text-xl font-black text-white mb-2">{t('Odaya Katıldınız!')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {t('Oyunun TV ana ekranından başlatılması bekleniyor. Arkanıza yaslanın ve hazır olun!')}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              {t('Hazır Durumdasınız')}</div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. WRITING PROMPTS PHASE                                     */}
        {/* ============================================================ */}
        {gameState.phase === 'WRITING_PROMPTS' && (
          <div className="w-full">
            {submitted ? (
              <div className="text-center p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{t('Yanıtlar Gönderildi!')}</h3>
                <p className="text-xs text-slate-400 mb-6">
                  {t('Harika! Diğer oyuncuların da yanıtlarını tamamlaması bekleniyor. TV ekranını takip edin!')}</p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                  Kalan Süre: {gameState.timerSeconds}s
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAllAnswers} className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400">
                    TUR {gameState.currentRound} • YANITLARINI YAZ
                  </span>
                  <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {gameState.timerSeconds}s
                  </span>
                </div>

                {assignedPrompts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900 text-center text-xs text-slate-400">
                    {t('Sorular yükleniyor...')}</div>
                ) : (
                  assignedPrompts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-purple-400">
                          Soru #{idx + 1} ({p.category})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {(answers[p.id] || '').length} / 80
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white leading-snug">
                        "{p.prompt}"
                      </p>

                      <input
                        type="text"
                        value={answers[p.id] || ''}
                        onChange={(e) => handleAnswerChange(p.id, e.target.value)}
                        placeholder={t('En komik yanıtını yaz...')}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                      />
                    </div>
                  ))
                )}

                <button
                  type="submit"
                  disabled={assignedPrompts.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-black text-base shadow-xl shadow-purple-900/50 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {t('Yanıtları Gönder')}</button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MATCHUP VOTING PHASE                                      */}
        {/* ============================================================ */}
        {gameState.phase === 'MATCHUP_VOTING' && currentMatchup && (
          <div className="w-full space-y-4">
            <div className="text-center mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-pink-400 block mb-1">
                KAPIŞMA #{gameState.currentMatchupIndex + 1}
              </span>
              <p className="text-base font-black text-white leading-snug">
                "{currentMatchup.prompt.prompt}"
              </p>
            </div>

            {isAuthorInCurrentMatchup && gameState.players?.length > 2 ? (
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-purple-500/40 text-center shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3 text-3xl">
                  🍿
                </div>
                <h4 className="text-lg font-black text-white mb-1">{t('Bu Soru Senin!')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('Sen bu kapışmanın yazarlarından birisin. Oy kullanamazsın; arkanıza yaslanın ve TV ekranındaki oyları izleyin!')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-xs font-bold text-slate-400 mb-2">
                  {t('En çok güldüren cevaba oy ver:')}</p>

                {/* Option 1 Button */}
                <button
                  onClick={() => handleVote(1)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden active:scale-95 ${
                    selectedVoteIndex === 1
                      ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-900/50'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/60'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-1">
                    {t('SEÇENEK A')}</span>
                  <p className="text-base font-black text-white leading-snug">
                    "{currentMatchup.answer1.text || '...'}"
                  </p>
                  {selectedVoteIndex === 1 && (
                    <div className="mt-2 text-xs font-bold text-cyan-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />  {t('Oyunuz Kaydedildi')}</div>
                  )}
                </button>

                {/* Option 2 Button */}
                <button
                  onClick={() => handleVote(2)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden active:scale-95 ${
                    selectedVoteIndex === 2
                      ? 'bg-gradient-to-r from-rose-950 to-pink-950 border-rose-400 ring-2 ring-rose-400/40 shadow-lg shadow-rose-900/50'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-rose-500/60'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">
                    {t('SEÇENEK B')}</span>
                  <p className="text-base font-black text-white leading-snug">
                    "{currentMatchup.answer2.text || '...'}"
                  </p>
                  {selectedVoteIndex === 2 && (
                    <div className="mt-2 text-xs font-bold text-rose-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />  {t('Oyunuz Kaydedildi')}</div>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. MATCHUP RESULT & ROUND SCORES PHASE                       */}
        {/* ============================================================ */}
        {(gameState.phase === 'MATCHUP_RESULT' || gameState.phase === 'ROUND_SCORES') && (
          <div className="text-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              🏆
            </div>
            <h3 className="text-xl font-black text-white mb-2">{t('Puanlar TV Ekranında!')}</h3>
            <p className="text-xs text-slate-400 mb-6">
              {t('Sonuçlar ve skor durumu ana ekranda gösteriliyor.')}</p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 inline-block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t('MEVCUT PUANINIZ')}</span>
              <span className="text-2xl font-black text-amber-400">
                {player?.score || 0} Puan
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. LAST LASH (FINAL ROUND) CONTROLLER                        */}
        {/* ============================================================ */}
        {gameState.phase === 'LAST_LASH_WRITING' && (
          <div className="w-full">
            {lastLashSubmitted ? (
              <div className="text-center p-8 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 text-3xl">
                  👑
                </div>
                <h3 className="text-xl font-black text-white mb-2">{t('Final Yanıtın Gönderildi!')}</h3>
                <p className="text-xs text-slate-400">
                  {t('Şampiyonluk için oylama başlamak üzere!')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLastLash} className="space-y-4">
                <div className="text-center mb-2">
                  <span className="text-xs font-black uppercase text-amber-400 block mb-1">
                    {t('👑 BÜYÜK FİNAL (THE LAST LASH)')}</span>
                  <p className="text-sm font-bold text-white leading-snug">
                    "{gameState.lastLashPrompt?.prompt}"
                  </p>
                </div>

                <textarea
                  rows={3}
                  value={lastLashText}
                  onChange={(e) => setLastLashText(e.target.value)}
                  placeholder={t('En efsane final yanıtını buraya yaz...')}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />

                <button
                  type="submit"
                  disabled={!lastLashText.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-base shadow-xl shadow-amber-900/50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {t('Final Yanıtını Gönder')}</button>
              </form>
            )}
          </div>
        )}

        {/* LAST LASH VOTING */}
        {gameState.phase === 'LAST_LASH_VOTING' && (
          <div className="w-full space-y-3">
            <div className="text-center mb-2">
              <span className="text-xs font-black uppercase text-amber-400 block mb-1">
                {t('EN İYİ CEVABA OY VER (3X PUAN)')}</span>
              <p className="text-xs text-slate-400">
                {t('Aşağıdaki yanıtlardan en çok beğendiğini seç:')}</p>
            </div>

            <div className="space-y-2.5">
              {(gameState.lastLashAnswers || []).map((ans, idx) => {
                const isOwn = ans.playerId === player?.id;
                const isSelected = selectedMedalPlayerId === ans.playerId;

                return (
                  <button
                    key={idx}
                    disabled={isOwn}
                    onClick={() => handleSelectLastLashMedal(ans.playerId)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      isOwn
                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400/60'
                    }`}
                  >
                    <p className="text-sm font-bold text-white">"{ans.text}"</p>
                    {isOwn && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {t('(Senin cevabın)')}</span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] font-bold text-amber-400 block mt-1">
                        {t('✓ Seçildi')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. GAME OVER CONTROLLER                                      */}
        {/* ============================================================ */}
        {gameState.phase === 'GAME_OVER' && (
          <div className="text-center p-8 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-4 text-3xl">
              👑
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{t('Oyun Tamamlandı!')}</h3>
            <p className="text-xs text-slate-400 mb-6">
              {t('Final sonuçları ve şampiyon TV ekranında açıklandı!')}</p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 inline-block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {t('TOPLAM PUANINIZ')}</span>
              <span className="text-3xl font-black text-amber-400">
                {player?.score || 0} Puan
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Controller Footer */}
      <footer className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-2">
        {t('FiestaLoco • Quiplash Phone Controller')}</footer>
    </div>
  );
};
