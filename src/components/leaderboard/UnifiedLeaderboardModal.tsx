import React, { useState, useEffect } from 'react';
import {
  Trophy,
  History,
  Award,
  Trash2,
  X,
  Sparkles,
  Users,
  Medal,
  Calendar,
  Crown,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  getLeaderboard,
  getMatchHistory,
  clearAllGameHistory,
  fetchGlobalLeaderboard,
  fetchGlobalMatchHistory,
  PlayerStats,
  MatchHistoryEntry,
  GameModuleType,
} from '../../utils/leaderboardStore';
import { playClickSound } from '../../utils/audio';

import { t } from '../../i18n';
interface UnifiedLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'leaderboard' | 'history' | 'badges';
}

const GAME_FILTER_OPTIONS: { id: 'all' | GameModuleType; label: string; icon: string }[] = [
  { id: 'all', label: 'Tüm Oyunlar', icon: '🎮' },
  { id: 'quiplash', label: 'Quiplash', icon: '🥊' },
  { id: 'codenames', label: 'Codenames', icon: '🕵️' },
  { id: 'imposter', label: 'Imposter', icon: '🎨' },
  { id: 'bluff', label: 'Fibbage', icon: '🤥' },
  { id: 'bomb', label: 'Word Bomb', icon: '💣' },
  { id: 'trivia_pursuit', label: 'Trivia Pursuit', icon: '🧠' },
];

export const UnifiedLeaderboardModal: React.FC<UnifiedLeaderboardModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'leaderboard',
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'badges'>(initialTab);
  const [selectedGameFilter, setSelectedGameFilter] = useState<'all' | GameModuleType>('all');
  const [leaderboardMap, setLeaderboardMap] = useState<Record<string, PlayerStats>>({});
  const [historyList, setHistoryList] = useState<MatchHistoryEntry[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Once yerel veriyi goster (aninda acilir), ardindan sunucudaki global
    // leaderboard gelirse onunla degistir. Sunucu/kalicilik yoksa yerel kalir.
    setLeaderboardMap(getLeaderboard());
    setHistoryList(getMatchHistory());
    setIsGlobal(false);

    let cancelled = false;
    void (async () => {
      const [globalBoard, globalHistory] = await Promise.all([
        fetchGlobalLeaderboard(200),
        fetchGlobalMatchHistory(50),
      ]);
      if (cancelled) return;
      if (globalBoard) {
        setLeaderboardMap(globalBoard);
        setIsGlobal(true);
      }
      if (globalHistory) setHistoryList(globalHistory);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const playersList: PlayerStats[] = (Object.values(leaderboardMap) as PlayerStats[]).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalScore - a.totalScore;
  });

  const filteredHistory =
    selectedGameFilter === 'all'
      ? historyList
      : historyList.filter((m) => m.gameType === selectedGameFilter);

  const handleClearHistory = () => {
    playClickSound();
    if (window.confirm('Tüm oyun geçmişi ve skor tablosu sıfırlansın mı?')) {
      clearAllGameHistory();
      setLeaderboardMap({});
      setHistoryList([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>{t('Skor Tablosu & Oyun Geçmişi')}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isGlobal
                      ? 'bg-emerald-500/20 border-emerald-300/60 text-emerald-50'
                      : 'bg-white/10 border-white/30 text-amber-50'
                  }`}
                  title={
                    isGlobal
                      ? t('Skorlar sunucuda saklanıyor, tüm cihazlarda ortak')
                      : t('Skorlar yalnızca bu cihazda saklanıyor')
                  }
                >
                  {isGlobal ? '🌍 Global' : '📱 Bu cihaz'}
                </span>
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                {t('FiestaLoco Tüm Parti Oyunları İstatistikleri')}</p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title={t('Kapat')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-2">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{t('Oyuncu Sıralaması ({a})', { a: playersList.length })}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('history');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-rose-500" />
            <span>{t('Maç Geçmişi ({a})', { a: historyList.length })}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('badges');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>{t('Rozetler')}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: PLAYER LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div>
              {playersList.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-5xl">🎮</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {t('Henüz Kayıtlı Oyun Yok')}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t('Parti oyunlarından herhangi birini tamamladığınızda skorlar ve şampiyonluklar burada otomatik listelenir!')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Podium for Top 3 */}
                  {playersList.length >= 2 && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 pt-4">
                      {/* 2nd Place */}
                      <div className="order-1 flex flex-col items-center justify-end p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 text-center">
                        <span className="text-xl sm:text-2xl mb-1">🥈</span>
                        <div className="text-2xl sm:text-3xl mb-1">{playersList[1]?.avatar}</div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-full">
                          {playersList[1]?.name}
                        </div>
                        <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mt-1">
                          {t('{a} Galibiyet', { a: playersList[1]?.wins })}</div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          {t('{a} Puan', { a: playersList[1]?.totalScore })}</div>
                      </div>

                      {/* 1st Place */}
                      <div className="order-2 flex flex-col items-center justify-end p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-500 text-center shadow-lg -translate-y-2">
                        <div className="flex items-center gap-1 text-amber-500 font-black text-xs uppercase mb-1">
                          <Crown className="w-4 h-4 fill-current" />
                          <span>{t('Lider')}</span>
                        </div>
                        <div className="text-3xl sm:text-4xl mb-1">{playersList[0]?.avatar}</div>
                        <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-full">
                          {playersList[0]?.name}
                        </div>
                        <div className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1">
                          {t('🏆 {a} Galibiyet', { a: playersList[0]?.wins })}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-extrabold">
                          {t('{a} Toplam Puan', { a: playersList[0]?.totalScore })}</div>
                      </div>

                      {/* 3rd Place */}
                      {playersList[2] && (
                        <div className="order-3 flex flex-col items-center justify-end p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-amber-700/30 text-center">
                          <span className="text-xl sm:text-2xl mb-1">🥉</span>
                          <div className="text-2xl sm:text-3xl mb-1">{playersList[2]?.avatar}</div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-full">
                            {playersList[2]?.name}
                          </div>
                          <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mt-1">
                            {t('{a} Galibiyet', { a: playersList[2]?.wins })}</div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {t('{a} Puan', { a: playersList[2]?.totalScore })}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player Rankings List */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    {playersList.map((player, idx) => (
                      <div
                        key={player.name}
                        className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-black text-xs sm:text-sm text-slate-400">
                            #{idx + 1}
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-xs">
                            {player.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{player.name}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                                  {t('👑 Şampiyon')}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {player.badges.slice(0, 3).map((badge, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                            {t('{a} Puan', { a: player.totalScore })}</div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t('{a} Galibiyet / {b} Maç', { a: player.wins, b: player.totalGames })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Game Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {GAME_FILTER_OPTIONS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedGameFilter(filter.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedGameFilter === filter.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <div className="text-4xl">📜</div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {t('Kayıtlı Maç Bulunamadı')}</h3>
                  <p className="text-xs text-slate-500">
                    {t('Oyun oynandıkça maç geçmişi detaylarıyla burada saklanır.')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((match) => (
                    <div
                      key={match.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{match.gameIcon}</span>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {match.gameTitle}
                            </span>
                            {match.roomCode && (
                              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-200 dark:border-indigo-800 font-mono">
                                {match.roomCode}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(match.playedAt).toLocaleDateString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Winner & Details */}
                      {match.winnerName && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 font-bold">
                          <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span>{t('Kazanan: {a} {b} ({c} Puan)', { a: match.winnerAvatar, b: match.winnerName, c: match.winnerScore })}</span>
                          {match.details && <span className="text-amber-700 dark:text-amber-300 font-normal">| {match.details}</span>}
                        </div>
                      )}

                      {/* Participants breakdown */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {match.players.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              p.isWinner
                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold border border-amber-300 dark:border-amber-700'
                                : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            <span>{p.avatar}</span>
                            <span>{p.name}</span>
                            <span className="text-[11px] opacity-70">({p.score}p)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BADGES SHOWCASE */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{t('Fiesta Başarımları Nasıl Kazanılır?')}</span>
                </div>
                {t('Parti oyunlarında oynayarak, zaferler kazanarak ve gizli görevleri başararak profilinize özel rozetler eklersiniz.')}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: '🎮 Çaylak Parti Canavarı', desc: 'En az 1 parti oyunu tamamla.', color: 'border-slate-300' },
                  { title: '🔥 Parti Kıdemlisi', desc: 'En az 5 parti oyunu tamamla.', color: 'border-orange-300' },
                  { title: '🏆 Seri Şampiyon', desc: 'Farklı oyunlarda en az 3 galibiyet elde et.', color: 'border-amber-400' },
                  { title: '👑 Fiesta Efsanesi', desc: 'Toplamda 10 zafer kazanarak efsane ol!', color: 'border-yellow-500' },
                  { title: '🧠 Bilgi Dâhisi', desc: 'Trivia Pursuit çarkında 6 rozeti topla veya kazan.', color: 'border-blue-400' },
                  { title: '🎭 Usta Yalancı', desc: 'Yalan Ustası (Bluff Trivia) oyununda rakipleri kandırarak kazan.', color: 'border-purple-400' },
                  { title: '💣 Çelik Sinirli', desc: 'Saatli Bomba oyununda bombayı patlatmadan son hayatta kalan ol.', color: 'border-rose-400' },
                  { title: '🕵️ Gizli Ajan Lideri', desc: 'Gizli Ajanlar (Codenames) oyununda takımına zaferi getir.', color: 'border-indigo-400' },
                  { title: '🎨 Sanat Dedektifi', desc: 'Sahtekâr Ressam oyununda sahtekârı çizimlerinden yakala.', color: 'border-emerald-400' },
                  { title: '⚖️ Grup Yargıcı', desc: 'Kim Yapar? Mahkemesi oyununda en popüler oyları topla.', color: 'border-pink-400' },
                ].map((badge, bIdx) => (
                  <div
                    key={bIdx}
                    className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 ${badge.color} dark:border-slate-700 shadow-xs space-y-1`}
                  >
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      {badge.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {badge.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('Geçmişi Sıfırla')}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            {t('Kapat')}</button>
        </div>
      </div>
    </div>
  );
};
