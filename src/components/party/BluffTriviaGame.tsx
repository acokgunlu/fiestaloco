import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Send,
  CheckCircle2,
  Trophy,
  Flame,
  HelpCircle,
  Tv,
  Smartphone,
  Copy,
  Check,
  Users,
  AlertTriangle,
  Play,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { BluffGameState, BluffPlayer, BluffAnswerItem } from '../../types/partyGames';
import { BLUFF_QUESTIONS, getRandomBluffQuestion } from '../../data/bluffQuestions';
import {
  playClickSound,
  playTurnSound,
  playWinSound,
  playAgentFoundSound,
} from '../../utils/audio';
import { useBluffSocket } from '../../utils/useBluffSocket';

import { t, withLang } from '../../i18n';
interface BluffTriviaGameProps {
  onBackToHub: () => void;
}

const DEFAULT_LOCAL_PLAYERS: BluffPlayer[] = [
  { id: 'bp1', name: 'Atakan', avatar: '🦁', color: '#3b82f6', colorName: 'Mavi', score: 0, foolsCount: 0, truthsFound: 0 },
  { id: 'bp2', name: 'Zeynep', avatar: '🦊', color: '#f97316', colorName: 'Turuncu', score: 0, foolsCount: 0, truthsFound: 0 },
  { id: 'bp3', name: 'Caner', avatar: '🐼', color: '#10b981', colorName: 'Yeşil', score: 0, foolsCount: 0, truthsFound: 0 },
  { id: 'bp4', name: 'Selin', avatar: '🦄', color: '#8b5cf6', colorName: 'Mor', score: 0, foolsCount: 0, truthsFound: 0 },
];

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

/**
 * Fibbage yazim tekbicimi (tek cihaz modu). Sunucu tarafiyla AYNI kural:
 * gercek cevap ile oyuncu yalanlari bicimden ayirt edilemesin.
 */
const normalizeBluffDisplay = (text: string): string =>
  text.trim().replace(/\s+/g, ' ').replace(/[.!?,;]+$/, '').toLocaleUpperCase('tr-TR');

const bluffCompareKey = (text: string): string =>
  normalizeBluffDisplay(text)
    .replace(/[İI]/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
    .replace(/[^A-Z0-9 ]/g, '');

export const BluffTriviaGame: React.FC<BluffTriviaGameProps> = ({ onBackToHub }) => {
  // Mode: 'online_host' (TV) | 'online_join' (Phone) | 'local' (Pass & Play)
  const [playMode, setPlayMode] = useState<'online_host' | 'online_join' | 'local'>('online_host');

  // WebSocket Integration
  const socket = useBluffSocket();

  // Selected Round Count for TV Room
  const [selectedRounds, setSelectedRounds] = useState<number>(3);

  // Mobile Join Form
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [selectedColor, setSelectedColor] = useState(COLOR_LIST[0]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile Controller State
  const [mobileBluffInput, setMobileBluffInput] = useState('');

  // Local Pass-and-Play State
  const [localPlayers, setLocalPlayers] = useState<BluffPlayer[]>(DEFAULT_LOCAL_PLAYERS);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [localActivePlayerInputIndex, setLocalActivePlayerInputIndex] = useState(0);
  const [localCurrentBluffInput, setLocalCurrentBluffInput] = useState('');
  const [localActiveVoterIndex, setLocalActiveVoterIndex] = useState(0);
  const [localUsedQuestionIds, setLocalUsedQuestionIds] = useState<string[]>([]);
  const [localGameState, setLocalGameState] = useState<BluffGameState>({
    phase: 'LOBBY',
    currentRound: 1,
    totalRounds: 3,
    currentQuestion: BLUFF_QUESTIONS[0],
    answers: [],
    timerSeconds: 30,
    category: 'Genel',
    isOnline: false,
  });

  // URL room code auto-detect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase());
      setPlayMode('online_join');
    }
  }, []);

  const handleCopyLink = (code: string) => {
    playClickSound();
    const url = withLang(`${window.location.origin}${window.location.pathname}?game=bluff&room=${code}`);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // =========================================================================
  // LOCAL PASS-AND-PLAY METHODS
  // =========================================================================
  const startLocalRound = () => {
    playTurnSound();
    const q = getRandomBluffQuestion(localUsedQuestionIds);
    setLocalUsedQuestionIds((prev) => [...prev, q.id]);

    setLocalPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        currentBluff: undefined,
        votedAnswerId: undefined,
        votedAnswerText: undefined,
        roundScoreEarned: 0,
      }))
    );

    setLocalActivePlayerInputIndex(0);
    setLocalCurrentBluffInput('');

    setLocalGameState((prev) => ({
      ...prev,
      phase: 'QUESTION_PREVIEW',
      currentQuestion: q,
      category: q.category,
      answers: [],
      timerSeconds: 30,
    }));
  };

  const submitLocalBluff = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!localCurrentBluffInput.trim()) return;

    if (
      localCurrentBluffInput.trim().toLowerCase() ===
      localGameState.currentQuestion?.realAnswer.toLowerCase()
    ) {
      alert('Bu zaten sorunun gerçek cevabı! Başka bir inandırıcı yalan uydurun.');
      return;
    }

    playClickSound();
    const updated = [...localPlayers];
    updated[localActivePlayerInputIndex].currentBluff = localCurrentBluffInput.trim();
    setLocalPlayers(updated);
    setLocalCurrentBluffInput('');

    if (localActivePlayerInputIndex + 1 < updated.length) {
      setLocalActivePlayerInputIndex(localActivePlayerInputIndex + 1);
    } else {
      const currentQ = localGameState.currentQuestion!;
      const compiled: BluffAnswerItem[] = [];

      compiled.push({
        id: 'real_ans',
        text: normalizeBluffDisplay(currentQ.realAnswer),
        isReal: true,
        chosenByPlayerIds: [],
        chosenByNames: [],
      });

      // Ayni yalani yazanlar tek secenekte birlesir (sunucu modeliyle ayni)
      const byKey = new Map<string, BluffAnswerItem>();
      updated.forEach((p) => {
        if (!p.currentBluff) return;
        const text = normalizeBluffDisplay(p.currentBluff);
        const key = bluffCompareKey(text);
        const existing = byKey.get(key);
        if (existing) {
          existing.authorPlayerIds!.push(p.id);
          existing.authorName = `${existing.authorName} & ${p.name}`;
          return;
        }
        const item: BluffAnswerItem = {
          id: `bluff_${p.id}`,
          text,
          authorPlayerId: p.id,
          authorPlayerIds: [p.id],
          authorName: p.name,
          isReal: false,
          chosenByPlayerIds: [],
          chosenByNames: [],
        };
        byKey.set(key, item);
        compiled.push(item);
      });

      if (compiled.length < 4 && currentQ.defaultFakes && currentQ.defaultFakes.length > 0) {
        const taken = new Set(compiled.map((a) => bluffCompareKey(a.text)));
        const pool = [...currentQ.defaultFakes].sort(() => Math.random() - 0.5);
        pool
          .filter((f) => !taken.has(bluffCompareKey(f)))
          .slice(0, 4 - compiled.length)
          .forEach((fake, idx) => {
          compiled.push({
            id: `fake_${idx}`,
            text: normalizeBluffDisplay(fake),
            isReal: false,
            chosenByPlayerIds: [],
            chosenByNames: [],
          });
        });
      }

      const shuffled = [...compiled].sort(() => Math.random() - 0.5);

      setLocalActiveVoterIndex(0);
      setLocalGameState((prev) => ({
        ...prev,
        phase: 'VOTING',
        answers: shuffled,
      }));
    }
  };

  const handleLocalVote = (answerItem: BluffAnswerItem) => {
    const voter = localPlayers[localActiveVoterIndex];
    if (answerItem.authorPlayerId === voter.id) {
      alert('Kendi yazdığınız yalana oy veremezsiniz!');
      return;
    }

    playClickSound();
    const nextAnswers = localGameState.answers.map((a) => {
      if (a.id === answerItem.id) {
        return {
          ...a,
          chosenByPlayerIds: [...a.chosenByPlayerIds, voter.id],
          chosenByNames: [...(a.chosenByNames || []), voter.name],
        };
      }
      return a;
    });

    const nextPlayers = [...localPlayers];
    nextPlayers[localActiveVoterIndex].votedAnswerId = answerItem.id;
    nextPlayers[localActiveVoterIndex].votedAnswerText = answerItem.text;
    setLocalPlayers(nextPlayers);

    if (localActiveVoterIndex + 1 < localPlayers.length) {
      setLocalActiveVoterIndex(localActiveVoterIndex + 1);
      setLocalGameState((prev) => ({ ...prev, answers: nextAnswers }));
    } else {
      nextPlayers.forEach((p) => {
        p.roundScoreEarned = 0;
      });

      nextPlayers.forEach((p) => {
        const votedAns = nextAnswers.find((a) => a.id === p.votedAnswerId);
        if (votedAns) {
          if (votedAns.isReal) {
            p.score += 1000;
            p.roundScoreEarned = (p.roundScoreEarned || 0) + 1000;
            p.truthsFound = (p.truthsFound || 0) + 1;
          } else if (votedAns.authorPlayerId && votedAns.authorPlayerId !== p.id) {
            const author = nextPlayers.find((pl) => pl.id === votedAns.authorPlayerId);
            if (author) {
              author.score += 500;
              author.roundScoreEarned = (author.roundScoreEarned || 0) + 500;
              author.foolsCount = (author.foolsCount || 0) + 1;
            }
          }
        }
      });

      setLocalPlayers(nextPlayers);
      setLocalGameState((prev) => ({
        ...prev,
        phase: 'ROUND_RESULT',
        answers: nextAnswers,
      }));
      playAgentFoundSound();
    }
  };

  const isOnlineActive = socket.roomCode && socket.gameState;

  // =========================================================================
  // RENDER: UNIFIED FIESTA LOCO PARTY GAME UI
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-slate-900 dark:text-slate-100 animate-fade-in">
      {/* Top Game Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <button
          id="btn-bluff-back-hub"
          onClick={() => {
            playClickSound();
            socket.leaveRoom();
            onBackToHub();
          }}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('Oyun Merkezine Dön')}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
            🎭
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{t('Yalan Ustası')}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 uppercase tracking-wide">
                {t('Fibbage Tarzı')}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{t('Sahte Cevaplar & Gerçek Trivia')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {socket.roomCode && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-black text-xs">
              {t('Oda:')} <span className="font-mono tracking-widest">{socket.roomCode}</span>
            </div>
          )}
          {playMode === 'local' && (
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl">
              {t('Tur {a}/{b}', { a: localGameState.currentRound, b: localGameState.totalRounds })}</span>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs (when not in an active online game session) */}
      {!isOnlineActive && (
        <div className="flex p-1.5 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-300/80 dark:border-slate-700/80 gap-1.5 shadow-sm">
          <button
            id="tab-mode-tv-host"
            onClick={() => {
              playClickSound();
              setPlayMode('online_host');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'online_host'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-900/50'
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
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-900/50'
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
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('📲 Tek Cihaz (Elden Ele)')}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ONLINE TV HOST SCREEN (Jackbox Big Screen Experience)                   */}
      {/* ========================================================================= */}
      {playMode === 'online_host' && (
        <div className="space-y-6">
          {!socket.roomCode ? (
            /* TV Host - Create Room Hero Banner */
            <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white rounded-3xl p-8 sm:p-12 border-4 border-white shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="max-w-md mx-auto space-y-3 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-white text-slate-900 flex items-center justify-center text-4xl mx-auto shadow-2xl animate-bounce">
                  🎭
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                  {t('Yalan Ustası TV')}</h2>
                <p className="text-amber-100 text-sm sm:text-base font-medium">
                  {t('Büyük ekranda sorular açılır. Oyuncular telefonlarından inandırıcı yalanlar uydurup herkesi kandırmaya çalışır!')}</p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black backdrop-blur-md">
                    {t('🎉 2 - 8 Oyuncu')}</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black backdrop-blur-md">
                    {t('📱 Telefon Kumandası')}</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black backdrop-blur-md">
                    {t('🎭 Fibbage Tarzı Blöf')}</span>
                </div>

                {/* Round Count Selector */}
                <div className="pt-4 flex items-center justify-center gap-3">
                  <span className="text-xs font-black text-amber-100 uppercase">{t('Tur Sayısı:')}</span>
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        playClickSound();
                        setSelectedRounds(num);
                      }}
                      className={`w-10 h-10 rounded-xl font-black text-sm transition-all cursor-pointer ${
                        selectedRounds === num
                          ? 'bg-white text-amber-900 shadow-md scale-110'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    id="btn-create-bluff-room"
                    onClick={() => {
                      playClickSound();
                      socket.createRoom(selectedRounds);
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-amber-50 text-slate-950 font-black text-base rounded-2xl shadow-xl hover:scale-105 transition-transform cursor-pointer border-2 border-amber-300"
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
                  <div className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                    {t('TV HOST CANLI')}</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t('Oda:')} <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-lg">{socket.roomCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => socket.roomCode && handleCopyLink(socket.roomCode)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                    <span>{copiedLink ? t('Kopyalandı!') : 'Linki Kopyala'}</span>
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      socket.leaveRoom();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('Odadan Ayrıl')}</span>
                  </button>
                </div>
              </div>

              {/* LOBBY PHASE */}
              {(!socket.gameState || socket.gameState.phase === 'LOBBY') && (
                <div className="grid md:grid-cols-2 gap-6 items-center animate-fade-in">
                  {/* Left Column: QR Code Card */}
                  <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t('Telefondan Katılın')}</span>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-4 border-amber-400 inline-block shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          withLang(`${window.location.origin}${window.location.pathname}?game=bluff&room=${socket.roomCode}`)
                        )}`}
                        alt={t('Bluff Room QR Code')}
                        className="w-40 h-40 mx-auto"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('veya siteye girip oda kodunu yazın:')}</div>
                      <div className="text-4xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-widest mt-1">
                        {socket.roomCode}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Joined Players & Launch Button */}
                  <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{t('Katılan Oyuncular ({a})', { a: socket.players.length })}</span>
                        </span>
                        <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                          {socket.players.length < 2 ? 'En az 2 oyuncu gerekli' : t('✓ Lobi hazır!')}
                        </span>
                      </div>

                      {socket.players.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 bg-slate-50 dark:bg-slate-900/60">
                          <div className="text-3xl animate-bounce">📱</div>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">{t('Oyuncular bekleniyor...')}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {t('Katılan arkadaşlarınızın avatarları burada belirecek.')}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {socket.players.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="p-3 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-xs animate-scale-up"
                              style={{ borderLeft: `6px solid ${p.color || '#f59e0b'}` }}
                            >
                              <div className="text-2xl">{p.avatar}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>{t('Bağlı')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      id="btn-tv-start-bluff"
                      onClick={() => {
                        playClickSound();
                        socket.startRound();
                      }}
                      disabled={socket.players.length < 2}
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg btn-party flex items-center justify-center gap-3 transition-all cursor-pointer ${
                        socket.players.length >= 2
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-slate-950" />
                      <span>{t('OYUNU BAŞLAT ({a} Oyuncu)', { a: socket.players.length })}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 1: QUESTION PREVIEW */}
              {socket.gameState?.phase === 'QUESTION_PREVIEW' && (
                <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-8 animate-fade-in">
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider">
                      {t('Tur {a} / {b}', { a: socket.gameState.currentRound, b: socket.gameState.totalRounds })}</span>
                    <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-xs">
                      {t('Kategori: {a}', { a: socket.gameState.category })}</span>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-4">
                    <span className="text-xs uppercase font-black tracking-widest text-amber-700 dark:text-amber-300">
                      {t('Büyük Ekran Sorusu')}</span>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-slate-100 leading-relaxed">
                      {socket.gameState.currentQuestion?.prompt.split('[...]').map((chunk, i, arr) => (
                        <React.Fragment key={i}>
                          {chunk}
                          {i < arr.length - 1 && (
                            <span className="inline-block px-4 py-1.5 mx-2 bg-amber-400 text-slate-950 font-black rounded-2xl shadow-sm animate-pulse border-2 border-amber-500">
                              [ ? ? ? ]
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs">
                      <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                      <span>{t('Telefonlarınıza bakın! Boşluğu dolduracak bir yalan yazacaksınız.')}</span>
                    </div>

                    <button
                      id="btn-tv-skip-to-writing"
                      onClick={() => socket.startWriting()}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs btn-party shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>{t('Yalanları Başlat ➔')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 2: WRITING BLUFF */}
              {socket.gameState?.phase === 'WRITING_BLUFF' && (
                <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black shadow-xs">
                      {t('Tur {a} • {b}', { a: socket.gameState.currentRound, b: socket.gameState.category })}</span>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-mono font-black text-sm shadow-xs">
                      <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-bounce" />
                      <span>{socket.gameState.timerSeconds}s</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-900 rounded-2xl p-5 max-w-3xl mx-auto space-y-2">
                    <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                      {t('Soru')}</span>
                    <p className="text-lg md:text-2xl font-black text-slate-900 dark:text-slate-100 leading-relaxed">
                      {socket.gameState.currentQuestion?.prompt}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-amber-800 dark:text-amber-300">
                      {t('HERKES TELEFONUNDAN YALANINI YAZIYOR!')}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                      {t('Kimseyi şüphelendirmeden en inandırıcı cevabı uydur!')}</p>
                  </div>

                  {/* Live Player Status Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
                    {socket.players.map((p) => {
                      const hasSubmitted = socket.gameState?.submittedPlayerIds?.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                            hasSubmitted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 shadow-md'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="text-2xl">{p.avatar}</div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                            <div
                              className={`text-[10px] font-bold ${
                                hasSubmitted ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-400 animate-pulse'
                              }`}
                            >
                              {hasSubmitted ? t('✓ Yalanı Hazır') : t('⏳ Yazıyor...')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PHASE 3: VOTING / FIND THE TRUTH */}
              {socket.gameState?.phase === 'VOTING' && (
                <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900">
                      {t('GERÇEK CEVABI BULUN!')}</span>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-mono font-black text-sm shadow-xs">
                      <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>{socket.gameState.timerSeconds}s</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-3xl mx-auto">
                    <p className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">
                      {socket.gameState.currentQuestion?.prompt}
                    </p>
                  </div>

                  {/* Shuffled Choices Grid */}
                  <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {socket.gameState.answers.map((ans, idx) => {
                      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                      return (
                        <div
                          key={ans.id || idx}
                          className="p-5 bg-white dark:bg-slate-900 border-3 border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-2xl flex items-center gap-4 text-left shadow-md transition-all"
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center font-black text-sm border-2 border-amber-300 dark:border-amber-800 shrink-0">
                            {letters[idx] || idx + 1}
                          </div>
                          <span className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize leading-snug">
                            {ans.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Voter Checklist */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {socket.players.map((p) => {
                      const hasVoted = socket.gameState?.votedPlayerIds?.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 ${
                            hasVoted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span>{p.avatar}</span>
                          <span>{p.name}</span>
                          <span className="font-black">{hasVoted ? '✓' : '...'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PHASE 4: DRAMATIC ROUND RESULT / REVEALS */}
              {socket.gameState?.phase === 'ROUND_RESULT' && (
                <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-300 dark:border-amber-800">
                      {t('Tur {a} Sonuçları', { a: socket.gameState.currentRound })}</span>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                      {t('KİMLER KANDI, KİMLER GERÇEĞİ BULDU?')}</h3>
                  </div>

                  {/* Revealed Answers Card Deck */}
                  <div className="max-w-3xl mx-auto space-y-3">
                    {socket.gameState.answers.map((ans, idx) => {
                      const fools = socket.players.filter((p) => ans.chosenByPlayerIds?.includes(p.id));
                      const author = socket.players.find((p) => p.id === ans.authorPlayerId);

                      return (
                        <div
                          key={ans.id || idx}
                          className={`p-4 md:p-5 rounded-2xl border-3 transition-all text-left space-y-3 ${
                            ans.isReal
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md'
                              : fools.length > 0
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-black ${
                                  ans.isReal
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                                }`}
                              >
                                {ans.isReal ? '✨' : '🎭'}
                              </div>
                              <div>
                                <div className="text-base font-black text-slate-900 dark:text-slate-100">{ans.text}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                                  {ans.isReal ? (
                                    <span className="text-emerald-700 dark:text-emerald-300 font-black">{t('GERÇEK CEVAP (+1000 Puan)')}</span>
                                  ) : author ? (
                                    <span>
                                      Yazan: <strong className="text-amber-800 dark:text-amber-300">{author.avatar} {author.name}</strong> (+500/kurban)
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 dark:text-slate-400">{t('Oyunun Sahte Cevabı')}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {ans.isReal ? (
                              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-black border border-emerald-300 dark:border-emerald-800">
                                {t('{a} Kişi Bildi', { a: fools.length })}</span>
                            ) : author && fools.length > 0 ? (
                              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-black border border-amber-300 dark:border-amber-800">
                                {t('+{a} Blöf Puanı!', { a: fools.length * 500 })}</span>
                            ) : null}
                          </div>

                          {fools.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
                              <span className="text-slate-600 dark:text-slate-400 font-bold">
                                {ans.isReal ? t('Doğruyu bulanlar:') : 'Bu yalana inananlar:'}
                              </span>
                              {fools.map((f) => (
                                <span
                                  key={f.id}
                                  className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                                    ans.isReal
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                                  }`}
                                >
                                  <span>{f.avatar}</span>
                                  <span>{f.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Scoreboard Preview */}
                  <div className="max-w-3xl mx-auto bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-left">
                      {t('Skor Durumu')}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[...socket.players]
                        .sort((a, b) => b.score - a.score)
                        .map((p, idx) => (
                          <div
                            key={p.id}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-black text-slate-400 dark:text-slate-500">#{idx + 1}</span>
                              <span className="text-base">{p.avatar}</span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                            </div>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
                              {p.score}p
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Advance Button */}
                  <div className="pt-2">
                    <button
                      id="btn-tv-next-round"
                      onClick={() => {
                        playClickSound();
                        socket.nextRound();
                      }}
                      className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg btn-party flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all"
                    >
                      <span>
                        {socket.gameState.currentRound >= socket.gameState.totalRounds
                          ? t('Şampiyonu Açıkla 🏆')
                          : t('Sonraki Tura Geç ➔')}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 5: GAME OVER / PODIUMS */}
              {socket.gameState?.phase === 'GAME_OVER' && (
                <div className="bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-8 animate-fade-in">
                  <div className="space-y-2">
                    <div className="text-5xl animate-bounce">👑</div>
                    <h2 className="text-3xl sm:text-5xl font-black text-amber-600 dark:text-amber-400">
                      {t('OYUN BİTTİ!')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-bold">{t('İşte Yalan Ustası Arenasının Kazananları!')}</p>
                  </div>

                  {/* Top 3 Podium */}
                  {(() => {
                    const sorted = [...socket.players].sort((a, b) => b.score - a.score);
                    const first = sorted[0];
                    const second = sorted[1];
                    const third = sorted[2];

                    return (
                      <div className="flex items-end justify-center gap-4 w-full max-w-lg mx-auto pt-6">
                        {/* 2nd Place */}
                        {second && (
                          <div className="flex-1 flex flex-col items-center space-y-2">
                            <div className="text-3xl">{second.avatar}</div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-300 truncate w-full">
                              {second.name}
                            </div>
                            <div className="text-xs font-mono font-black text-amber-700 dark:text-amber-300">
                              {second.score}p
                            </div>
                            <div className="w-full h-24 bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-700 rounded-t-2xl flex items-center justify-center font-black text-xl text-slate-600 dark:text-slate-400 shadow-md">
                              🥈 2.
                            </div>
                          </div>
                        )}

                        {/* 1st Place */}
                        {first && (
                          <div className="flex-1 flex flex-col items-center space-y-2 -mt-6">
                            <div className="text-4xl animate-bounce">{first.avatar}</div>
                            <div className="text-sm font-black text-amber-900 dark:text-amber-200 truncate w-full">
                              {first.name}
                            </div>
                            <div className="text-sm font-mono font-black text-amber-800 dark:text-amber-300">
                              {first.score}p
                            </div>
                            <div className="w-full h-32 bg-gradient-to-t from-amber-400 to-yellow-400 border-3 border-amber-500 rounded-t-2xl flex items-center justify-center font-black text-2xl text-slate-950 shadow-xl">
                              🥇 1.
                            </div>
                          </div>
                        )}

                        {/* 3rd Place */}
                        {third && (
                          <div className="flex-1 flex flex-col items-center space-y-2">
                            <div className="text-3xl">{third.avatar}</div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-300 truncate w-full">
                              {third.name}
                            </div>
                            <div className="text-xs font-mono font-black text-amber-700 dark:text-amber-300">
                              {third.score}p
                            </div>
                            <div className="w-full h-18 bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-200 dark:border-amber-900 rounded-t-2xl flex items-center justify-center font-black text-lg text-amber-800 dark:text-amber-300 shadow-sm">
                              🥉 3.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Fun Awards */}
                  <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    {(() => {
                      const topBluffer = [...socket.players].sort(
                        (a, b) => (b.foolsCount || 0) - (a.foolsCount || 0)
                      )[0];
                      const topDetective = [...socket.players].sort(
                        (a, b) => (b.truthsFound || 0) - (a.truthsFound || 0)
                      )[0];

                      return (
                        <>
                          {topBluffer && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-left shadow-sm">
                              <div className="text-3xl">🎭</div>
                              <div>
                                <div className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                  {t('YALAN USTASI (EN ÇOK KANDIRAN)')}</div>
                                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                                  {topBluffer.avatar} {topBluffer.name}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {t('{a} kişiyi tuzağa düşürdü', { a: topBluffer.foolsCount || 0 })}</div>
                              </div>
                            </div>
                          )}

                          {topDetective && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-left shadow-sm">
                              <div className="text-3xl">🕵️‍♂️</div>
                              <div>
                                <div className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                  {t('GERÇEK DEDEKTİFİ')}</div>
                                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                                  {topDetective.avatar} {topDetective.name}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                  {t('{a} kez doğruyu buldu', { a: topDetective.truthsFound || 0 })}</div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Restart & Menu Buttons */}
                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                    <button
                      id="btn-tv-restart-bluff"
                      onClick={() => {
                        playClickSound();
                        socket.restartGame();
                      }}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-md btn-party transition-all cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{t('YENİDEN OYNA')}</span>
                    </button>

                    <button
                      onClick={() => {
                        playClickSound();
                        socket.leaveRoom();
                        onBackToHub();
                      }}
                      className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                    >
                      {t('Ana Menüye Dön')}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE CONTROLLER SCREEN (Telefondan Katıl)                           */}
      {/* ========================================================================= */}
      {playMode === 'online_join' && (
        <div className="w-full max-w-md mx-auto space-y-4">
          {!socket.myPlayer ? (
            /* Join Room Card */
            <div className="bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-scale-up">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center text-3xl mx-auto border-2 border-amber-300 dark:border-amber-800 font-black shadow-inner">
                  📱
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('YALAN USTASI KUMANDASI')}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {t('Büyük ekrandaki 4 haneli oda kodunu girin ve isminizi yazın.')}</p>
              </div>

              {socket.errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{t(socket.errorMessage)}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                    {t('Oda Kodu (Room Code)')}</label>
                  <input
                    id="input-bluff-room-code"
                    type="text"
                    maxLength={4}
                    placeholder={t('Örn: LIE9')}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl text-center text-2xl font-mono font-black text-amber-700 dark:text-amber-300 tracking-widest uppercase outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                    {t('Adınız / Lakabınız')}</label>
                  <input
                    id="input-bluff-player-name"
                    type="text"
                    maxLength={14}
                    placeholder={t('Örn: Blöfçü Ali')}
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                    {t('Avatar Seçin')}</label>
                  <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    {AVATAR_LIST.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setSelectedAvatar(av);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-amber-400 text-slate-950 scale-110 shadow-sm border-2 border-amber-600'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                    {t('Renk Seçin')}</label>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    {COLOR_LIST.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setSelectedColor(c);
                        }}
                        className={`w-7 h-7 rounded-full transition-all cursor-pointer border-2 ${
                          selectedColor.hex === c.hex
                            ? 'border-slate-900 scale-125 shadow-sm'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                id="btn-bluff-join-room"
                onClick={() => {
                  if (!joinCodeInput.trim() || !playerNameInput.trim()) {
                    alert('Lütfen oda kodunu ve adınızı yazın.');
                    return;
                  }
                  playClickSound();
                  socket.joinRoom(
                    joinCodeInput.trim(),
                    playerNameInput.trim(),
                    selectedAvatar,
                    selectedColor.hex,
                    selectedColor.name
                  );
                }}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-md btn-party transition-all cursor-pointer"
              >
                {t('ODAYA BAĞLAN ➔')}</button>
            </div>
          ) : (
            /* Active Mobile Controller */
            <div className="space-y-4 animate-fade-in">
              {/* Mobile Header Card */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">{socket.myPlayer.avatar}</div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-slate-100">{socket.myPlayer.name}</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold">
                      {t('Skor: {a}p', { a: socket.myPlayer.score })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-[10px] font-mono font-black text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                    {t('Oda: {a}', { a: socket.roomCode })}</span>
                  <button
                    onClick={() => {
                      playClickSound();
                      socket.leaveRoom();
                    }}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t('Ayrıl')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {socket.rejectedReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 shadow-sm animate-shake">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <div className="flex-1">{socket.rejectedReason}</div>
                </div>
              )}

              {/* LOBBY PHASE */}
              {(!socket.gameState || socket.gameState.phase === 'LOBBY') && (
                <div className="text-center space-y-4 p-8 bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl shadow-sm">
                  <div className="text-4xl animate-bounce">🛋️</div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{t('Lobidesiniz!')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto font-medium">
                    {t('Büyük ekrandan ev sahibinin oyunu başlatması bekleniyor...')}</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-black">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{t('Bağlantı Aktif')}</span>
                  </div>
                </div>
              )}

              {/* QUESTION PREVIEW */}
              {socket.gameState?.phase === 'QUESTION_PREVIEW' && (
                <div className="text-center space-y-4 p-6 bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl shadow-sm">
                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-black">
                    {t('Kategori: {a}', { a: socket.gameState.category })}</span>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100 leading-relaxed">
                    {socket.gameState.currentQuestion?.prompt}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                    {t('Hazır olun! Birazdan bu boşluğu dolduracak inandırıcı bir yalan yazacaksınız.')}</p>
                </div>
              )}

              {/* WRITING BLUFF */}
              {socket.gameState?.phase === 'WRITING_BLUFF' && (
                <div className="space-y-4 p-5 bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                        {t('YALANINI YAZ')}</span>
                      <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                        ⏱️ {socket.gameState.timerSeconds}s
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">
                      {socket.gameState.currentQuestion?.prompt}
                    </p>
                  </div>

                  {socket.mySubmittedBluff ? (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 rounded-2xl text-center space-y-2 shadow-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto animate-scale-up" />
                      <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300">{t('YALANIN GÖNDERİLDİ!')}</h4>
                      <p className="text-xs text-slate-900 dark:text-slate-100 font-black bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        "{socket.mySubmittedBluff}"
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {t('Diğer oyuncuların yalanlarını tamamlaması bekleniyor...')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        id="textarea-mobile-bluff"
                        rows={3}
                        maxLength={60}
                        placeholder={t('İnandırıcı bir sahte cevap uydurun...')}
                        value={mobileBluffInput}
                        onChange={(e) => {
                          setMobileBluffInput(e.target.value);
                          if (socket.rejectedReason) socket.clearRejectedReason();
                        }}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none resize-none"
                      />
                      <button
                        id="btn-mobile-submit-bluff"
                        onClick={() => {
                          if (!mobileBluffInput.trim()) return;
                          playClickSound();
                          socket.submitBluff(mobileBluffInput.trim());
                          setMobileBluffInput('');
                        }}
                        disabled={!mobileBluffInput.trim()}
                        className={`w-full py-3.5 rounded-xl font-black text-xs tracking-wider shadow-md btn-party flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          mobileBluffInput.trim()
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        <span>{t('YALANI GÖNDER')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VOTING */}
              {socket.gameState?.phase === 'VOTING' && (
                <div className="space-y-4 p-5 bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl shadow-md">
                  <div className="space-y-1 text-center">
                    <h4 className="text-sm font-black text-amber-800 dark:text-amber-300">{t('GERÇEK CEVAP HANGİSİ?')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                      {t('Doğru olduğunu düşündüğünüz şıkka dokunun.')}</p>
                  </div>

                  {socket.myVotedAnswerId ? (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 rounded-2xl text-center space-y-2 shadow-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300">{t('OYUNUZ ALINDI!')}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {t('Büyük ekrandan sonuçların açıklanmasını izleyin!')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {socket.gameState.answers.map((ans) => {
                        const isMyOwnBluff = ans.text.trim().toLowerCase() === (socket.mySubmittedBluff || '').trim().toLowerCase();

                        return (
                          <button
                            key={ans.id}
                            disabled={isMyOwnBluff}
                            onClick={() => {
                              playClickSound();
                              socket.voteAnswer(ans.id);
                            }}
                            className={`w-full p-3.5 rounded-2xl font-black text-xs text-left transition-all border-2 flex items-center justify-between ${
                              isMyOwnBluff
                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-300 dark:border-slate-700 hover:border-amber-400 text-slate-900 dark:text-slate-100 cursor-pointer active:scale-98 shadow-xs'
                            }`}
                          >
                            <span>{ans.text}</span>
                            {isMyOwnBluff ? (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                {t('(Kendi Yalanın)')}</span>
                            ) : (
                              <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ROUND RESULT / GAME OVER */}
              {(socket.gameState?.phase === 'ROUND_RESULT' || socket.gameState?.phase === 'GAME_OVER') && (
                <div className="p-8 bg-white dark:bg-slate-900 border-3 border-amber-200 dark:border-amber-900 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="text-4xl animate-bounce">📺</div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{t('SONUÇLAR AÇIKLANIYOR!')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                    {t('Kimin kimi kandırdığını ve gerçek cevabı görmek için büyük ekrana bakın!')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LOCAL PASS-AND-PLAY (Tek Cihaz)                                       */}
      {/* ========================================================================= */}
      {playMode === 'local' && (
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {localGameState.phase === 'LOBBY' && (
            <div className="bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center text-2xl mx-auto border-2 border-amber-300 dark:border-amber-800 font-black">
                  👥
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{t('TEK CİHAZ (EL DEĞİŞTİR)')}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {t('Telefonu elden ele gezdirerek herkes sırayla kendi yalanını yazar ve oy verir.')}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                    {t('Oyuncu Listesi ({a})', { a: localPlayers.length })}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {localPlayers.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.avatar}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                      </div>
                      {localPlayers.length > 2 && (
                        <button
                          onClick={() => {
                            playClickSound();
                            setLocalPlayers((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold cursor-pointer"
                        >
                          {t('Sil')}</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={14}
                    placeholder={t('Yeni Oyuncu Adı...')}
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!newPlayerName.trim()) return;
                      playClickSound();
                      setLocalPlayers((prev) => [
                        ...prev,
                        {
                          id: `bp_${Date.now()}`,
                          name: newPlayerName.trim(),
                          avatar: AVATAR_LIST[prev.length % AVATAR_LIST.length],
                          score: 0,
                          foolsCount: 0,
                          truthsFound: 0,
                        },
                      ]);
                      setNewPlayerName('');
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-black cursor-pointer"
                  >
                    {t('Ekle')}</button>
                </div>
              </div>

              <button
                id="btn-start-local-bluff"
                onClick={startLocalRound}
                disabled={localPlayers.length < 2}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-md btn-party cursor-pointer"
              >
                {t('OYUNU BAŞLAT ➔')}</button>
            </div>
          )}

          {localGameState.phase === 'QUESTION_PREVIEW' && (
            <div className="bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xl animate-fade-in">
              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-black">
                {t('Kategori: {a}', { a: localGameState.category })}</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-relaxed">
                {localGameState.currentQuestion?.prompt}
              </p>
              <button
                onClick={() => {
                  playClickSound();
                  setLocalGameState((prev) => ({ ...prev, phase: 'WRITING_BLUFF' }));
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md btn-party cursor-pointer"
              >
                {t('YALANLARI YAZMAYA BAŞLA ➔')}</button>
            </div>
          )}

          {localGameState.phase === 'WRITING_BLUFF' && (
            <div className="bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-3">
                <span className="text-3xl">
                  {localPlayers[localActivePlayerInputIndex].avatar}
                </span>
                <div>
                  <div className="text-xs font-black text-amber-800 dark:text-amber-300">{t('TELEFONU OYUNCUYA VERİN:')}</div>
                  <div className="text-base font-black text-slate-900 dark:text-slate-100">
                    {localPlayers[localActivePlayerInputIndex].name}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                  {localGameState.currentQuestion?.prompt}
                </p>
                <form onSubmit={submitLocalBluff} className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('İnandırıcı bir yalan uydurun...')}
                    value={localCurrentBluffInput}
                    onChange={(e) => setLocalCurrentBluffInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md btn-party cursor-pointer"
                  >
                    {t('KAYDET VE SIRADAKİ OYUNCUYA VER ➔')}</button>
                </form>
              </div>
            </div>
          )}

          {localGameState.phase === 'VOTING' && (
            <div className="bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-3">
                <span className="text-3xl">{localPlayers[localActiveVoterIndex].avatar}</span>
                <div>
                  <div className="text-xs font-black text-amber-800 dark:text-amber-300">{t('OY SIRASI:')}</div>
                  <div className="text-base font-black text-slate-900 dark:text-slate-100">
                    {localPlayers[localActiveVoterIndex].name}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                  {t('Gerçek Cevabı Seçin:')}</span>
                <div className="space-y-2">
                  {localGameState.answers.map((ans) => {
                    const voter = localPlayers[localActiveVoterIndex];
                    const isOwn = ans.authorPlayerId === voter.id;

                    return (
                      <button
                        key={ans.id}
                        disabled={isOwn}
                        onClick={() => handleLocalVote(ans)}
                        className={`w-full p-3.5 rounded-xl font-black text-xs text-left transition-all border-2 flex items-center justify-between ${
                          isOwn
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-300 dark:border-slate-700 hover:border-amber-400 text-slate-900 dark:text-slate-100 cursor-pointer shadow-xs'
                        }`}
                      >
                        <span>{ans.text}</span>
                        {isOwn && <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('(Kendi Yalanın)')}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {localGameState.phase === 'ROUND_RESULT' && (
            <div className="bg-white dark:bg-slate-900 border-3 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in text-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('TUR SONUÇLARI')}</h3>

              <div className="space-y-3 text-left">
                {localGameState.answers.map((ans) => {
                  const author = localPlayers.find((p) => p.id === ans.authorPlayerId);
                  return (
                    <div
                      key={ans.id}
                      className={`p-4 rounded-2xl border-2 ${
                        ans.isReal
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">{ans.text}</div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {ans.isReal ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-black">{t('GERÇEK CEVAP (+1000 Puan)')}</span>
                        ) : author ? (
                          <span>{t('Yazan: {a}', { a: author.name })}</span>
                        ) : (
                          'Sahte Cevap'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  startLocalRound();
                }}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md btn-party cursor-pointer"
              >
                {t('SONRAKİ TUR ➔')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
