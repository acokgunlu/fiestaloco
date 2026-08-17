import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Gavel,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  Users,
  Flame,
  Tv,
  Smartphone,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Lock,
  Clock,
  MessageSquare,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { VerdictGameState, VerdictPlayer, VerdictQuestion } from '../../types/partyGames';
import { VERDICT_QUESTIONS, getRandomVerdictQuestion } from '../../data/verdictPrompts';
import {
  playClickSound,
  playTurnSound,
  playWinSound,
  playAssassinSound,
  playFanfareSound,
} from '../../utils/audio';
import { useVerdictSocket } from '../../utils/useVerdictSocket';

interface PicanteVerdictGameProps {
  onBackToHub: () => void;
}

const DEFAULT_VERDICT_PLAYERS: VerdictPlayer[] = [
  { id: 'vp1', name: 'Atakan', avatar: '🦁', color: '#6366f1', colorName: 'İndigo', score: 0, votesReceived: 0 },
  { id: 'vp2', name: 'Zeynep', avatar: '🦊', color: '#ec4899', colorName: 'Pembe', score: 0, votesReceived: 0 },
  { id: 'vp3', name: 'Caner', avatar: '🐼', color: '#10b981', colorName: 'Zümrüt', score: 0, votesReceived: 0 },
  { id: 'vp4', name: 'Selin', avatar: '🦄', color: '#f59e0b', colorName: 'Kehribar', score: 0, votesReceived: 0 },
];

const DEFENSE_PRESETS = [
  '✋ İtiraz ediyorum Sayın Yargıç! Tamamen iftira!',
  '😇 Kabul ediyorum ama kesinlikle haklı bir sebebim vardı!',
  '🤐 Avukatım olmadan tek bir kelime dahi konuşmam!',
  '👈 Asıl suçlu yanımda oturan kişi, ben sadece kurbandım!',
  '💸 İstediğiniz rüşveti vermeye hazırım, beni aklayın!',
  '🍷 O gün bilincim yerinde değildi, sayılmaz!',
];

export const PicanteVerdictGame: React.FC<PicanteVerdictGameProps> = ({ onBackToHub }) => {
  // Mode selection: 'online_host' | 'online_join' | 'local'
  const [playMode, setPlayMode] = useState<'online_host' | 'online_join' | 'local'>('online_host');

  // Online WebSocket integration
  const socket = useVerdictSocket();

  // Mobile Join Form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [copiedLink, setCopiedLink] = useState(false);

  // Local Pass-and-Play state
  const [localPlayers, setLocalPlayers] = useState<VerdictPlayer[]>(DEFAULT_VERDICT_PLAYERS);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [activeVoterIndex, setActiveVoterIndex] = useState(0);
  const [localDefenseInput, setLocalDefenseInput] = useState('');
  const [localGameState, setLocalGameState] = useState<VerdictGameState>({
    phase: 'LOBBY',
    currentRound: 1,
    totalRounds: 3,
    currentQuestion: VERDICT_QUESTIONS[0],
    accusedPlayerId: null,
    defenseSeconds: 30,
    roundVotes: {},
    isOnline: false,
  });
  const [localUsedQuestionIds, setLocalUsedQuestionIds] = useState<string[]>([]);

  // Mobile defense speech typing
  const [mobileDefenseSpeech, setMobileDefenseSpeech] = useState('');

  // Auto-detect room code in URL (?game=verdict&room=CODE or ?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const gameParam = params.get('game');
    if (roomParam && (gameParam === 'verdict' || !gameParam)) {
      setJoinCodeInput(roomParam.toUpperCase());
      setPlayMode('online_join');
    }
  }, []);

  // Sync defense text if present
  useEffect(() => {
    if (socket.gameState?.defenseSpeech) {
      setMobileDefenseSpeech(socket.gameState.defenseSpeech);
    }
  }, [socket.gameState?.defenseSpeech]);

  // Host QR link generator
  const getRoomJoinUrl = () => {
    if (!socket.roomCode) return '';
    const base = window.location.origin;
    return `${base}?game=verdict&room=${socket.roomCode}`;
  };

  const handleCopyLink = () => {
    const url = getRoomJoinUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ==========================================
  // LOCAL PASS-AND-PLAY HANDLERS
  // ==========================================
  const startLocalRound = () => {
    playTurnSound();
    const q = getRandomVerdictQuestion(localUsedQuestionIds);
    setLocalUsedQuestionIds((prev) => [...prev, q.id]);

    setLocalPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        votedTargetPlayerId: undefined,
        votesReceived: 0,
      }))
    );

    setActiveVoterIndex(0);
    setLocalDefenseInput('');

    setLocalGameState((prev) => ({
      ...prev,
      phase: 'QUESTION_REVEAL',
      currentQuestion: q,
      accusedPlayerId: null,
      defenseSeconds: 30,
      defenseSpeech: undefined,
      roundVotes: {},
    }));
  };

  const startLocalVoting = () => {
    playClickSound();
    setLocalGameState((prev) => ({
      ...prev,
      phase: 'VOTING',
    }));
  };

  const handleLocalVote = (targetPlayerId: string) => {
    playClickSound();
    const voter = localPlayers[activeVoterIndex];

    const nextVotes = {
      ...localGameState.roundVotes,
      [voter.id]: targetPlayerId,
    };

    const nextPlayers = [...localPlayers];
    nextPlayers[activeVoterIndex].votedTargetPlayerId = targetPlayerId;
    setLocalPlayers(nextPlayers);

    if (activeVoterIndex + 1 < localPlayers.length) {
      setActiveVoterIndex(activeVoterIndex + 1);
      setLocalGameState((prev) => ({ ...prev, roundVotes: nextVotes }));
    } else {
      // All local players voted
      playAssassinSound();

      const voteCounts: Record<string, number> = {};
      (Object.values(nextVotes) as string[]).forEach((targetId: string) => {
        if (targetId) {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
      });


      let maxVotes = -1;
      let accusedId: string | null = null;
      Object.entries(voteCounts).forEach(([pid, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          accusedId = pid;
        }
      });

      const scoredPlayers = nextPlayers.map((p) => {
        const received = voteCounts[p.id] || 0;
        const votedForAccused = nextVotes[p.id] === accusedId;
        return {
          ...p,
          votesReceived: received,
          score: p.score + (votedForAccused ? 50 : 0),
        };
      });

      setLocalPlayers(scoredPlayers);

      setLocalGameState((prev) => ({
        ...prev,
        phase: 'THE_VERDICT',
        accusedPlayerId: accusedId,
        roundVotes: nextVotes,
      }));
    }
  };

  const handleLocalDefenseSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playClickSound();
    setLocalGameState((prev) => ({
      ...prev,
      phase: 'ROUND_SCORES',
      defenseSpeech: localDefenseInput.trim() || 'Sanık hiçbir pişmanlık göstermeden gülümsedi!',
    }));
  };

  const handleLocalNextRoundOrFinish = () => {
    if (localGameState.currentRound < localGameState.totalRounds) {
      setLocalGameState((prev) => ({
        ...prev,
        currentRound: prev.currentRound + 1,
      }));
      startLocalRound();
    } else {
      playWinSound();
      setLocalGameState((prev) => ({
        ...prev,
        phase: 'GAME_OVER',
      }));
    }
  };

  const handleAddLocalPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const avatars = ['🦁', '🦊', '🐼', '🦄', '🐯', '🐙', '🐨', '🐸'];
    const randomAvatar = avatars[localPlayers.length % avatars.length];
    setLocalPlayers((prev) => [
      ...prev,
      {
        id: `vp_${Date.now()}`,
        name: newPlayerName.trim(),
        avatar: randomAvatar,
        score: 0,
        votesReceived: 0,
      },
    ]);
    setNewPlayerName('');
  };

  // Quick avatar list
  const avatarList = ['🦁', '🦊', '🐼', '🦄', '🐯', '🐙', '🐨', '🐸', '🚀', '👑', '🥑', '🔥'];

  // Check if online host or joined player
  const isOnlineActive = socket.roomCode && socket.gameState;
  const currentOnlineState = socket.gameState;
  const currentOnlinePlayers = socket.players;
  const myPlayer = socket.myPlayer;
  const isObserverHost = socket.clientRole === 'observer';

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-5 space-y-6 text-slate-900 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200">
        <button
          onClick={() => {
            playClickSound();
            socket.leaveRoom();
            onBackToHub();
          }}
          className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-600 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Oyun Merkezine Dön</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900">Grup Mahkemesi</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">
                Gizli Oylama
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold">Kim Yapar? & Sıcak Koltuk</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {socket.roomCode && (
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-xs">
              Oda: <span className="font-mono tracking-widest">{socket.roomCode}</span>
            </div>
          )}
          {playMode === 'local' && (
            <span className="text-xs font-black text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
              Duruşma {localGameState.currentRound}/{localGameState.totalRounds}
            </span>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs (when not in active online room) */}
      {!isOnlineActive && (
        <div className="flex p-1.5 bg-slate-200/70 backdrop-blur-md rounded-2xl border border-slate-300/80 gap-1.5 shadow-sm">
          <button
            onClick={() => {
              playClickSound();
              setPlayMode('online_host');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'online_host'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Tv className="w-4 h-4 text-purple-300" />
            <span>📺 TV / Ana Ekran Odası Aç</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setPlayMode('online_join');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'online_join'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-pink-300" />
            <span>📱 Telefondan Katıl (Gizli Oy Ver)</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setPlayMode('local');
            }}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              playMode === 'local'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>👥 Tek Cihaz (El Değiştir)</span>
          </button>
        </div>
      )}

      {/* Socket Error notice if any */}
      {socket.errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-black rounded-2xl text-center shadow-sm animate-shake flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{socket.errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ONLINE HOST CREATION VIEW (Before Room Creation) */}
      {/* ========================================================================= */}
      {!isOnlineActive && playMode === 'online_host' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 animate-fade-in text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-4xl mx-auto shadow-lg shadow-purple-500/20">
              ⚖️
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Online Grup Mahkemesi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Herkes telefonundan odaya katılır ve sorulara <strong className="text-purple-700 font-bold">tamamen gizli</strong> oy verir. TV ekranında oylar açılır, sanık sıcak koltuğa oturur ve 30 saniye içinde kendini savunur!
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-black text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Gelişmiş Gizli Oylama Motoru:</span>
            </div>
            <ul className="text-xs text-purple-800 space-y-1 font-medium pl-6 list-disc">
              <li>Oylar gönderilene kadar kimin kime oy verdiği kesinlikle gizli tutulur.</li>
              <li>Tüm oyuncular oyunu verince mahkeme kararı (The Verdict) canlı açıklanır.</li>
              <li>Çoğunlukla aynı kişiyi seçen jüri üyeleri bonus puan kazanır!</li>
            </ul>
          </div>

          <div className="pt-2 max-w-sm mx-auto">
            <button
              onClick={() => {
                playClickSound();
                socket.createRoom(3);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white text-base font-black shadow-lg shadow-purple-600/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-3"
            >
              <Tv className="w-5 h-5" />
              <span>TV Odasını Başlat</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ONLINE JOIN VIEW (Phone Controller Join Screen) */}
      {/* ========================================================================= */}
      {!isOnlineActive && playMode === 'online_join' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 max-w-md mx-auto animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              📱
            </div>
            <h2 className="text-2xl font-black text-slate-900">Mahkemeye Katıl</h2>
            <p className="text-xs text-slate-600 font-medium">
              TV ekranındaki 4 haneli oda kodunu girin ve gizli oylama kumandanızı hazırlayın!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                4 Haneli Oda Kodu:
              </label>
              <input
                type="text"
                maxLength={4}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Örn: WOLF"
                className="w-full text-center tracking-widest text-2xl font-mono font-black py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-pink-500 focus:outline-hidden bg-slate-50 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Adınız / Lakabınız:
              </label>
              <input
                type="text"
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                placeholder="Örn: Caner"
                maxLength={15}
                className="w-full text-base font-bold py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-pink-500 focus:outline-hidden bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Profil İkonunuz:
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {avatarList.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedAvatar(av);
                    }}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-pink-600 text-white scale-110 shadow-md ring-2 ring-pink-400/50'
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!joinCodeInput.trim() || !playerNameInput.trim()) {
                  alert('Lütfen oda kodu ve isminizi girin.');
                  return;
                }
                playClickSound();
                socket.joinRoom(joinCodeInput, playerNameInput, selectedAvatar);
              }}
              disabled={!joinCodeInput.trim() || !playerNameInput.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-base font-black shadow-lg shadow-pink-600/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>Odaya Katıl & Başla</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE ONLINE MULTIPLAYER (TV SCREEN / OBSERVER or MOBILE PLAYER) */}
      {/* ========================================================================= */}
      {isOnlineActive && currentOnlineState && (
        <div className="space-y-6">
          {/* Top Status Header */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl">
                ⚖️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black">
                    {currentOnlineState.phase === 'LOBBY' && 'Duruşma Öncesi Bekleme Salonu'}
                    {currentOnlineState.phase === 'QUESTION_REVEAL' && 'Duruşma Sorusu Açıklandı!'}
                    {currentOnlineState.phase === 'VOTING' && '🔒 Gizli Oylama Sürüyor...'}
                    {currentOnlineState.phase === 'THE_VERDICT' && '🚨 MAHKEME KARARI: SANIĞI SEÇTİNİZ!'}
                    {currentOnlineState.phase === 'DEFENSE_TIME' && '🎤 SICAK KOLTUK: SAVUNMA KÜRSÜSÜ'}
                    {currentOnlineState.phase === 'ROUND_SCORES' && '📊 Duruşma Puan Durumu'}
                    {currentOnlineState.phase === 'GAME_OVER' && '🏆 MAHKEME SONA ERDİ: ŞAMPİYON'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-400/20 text-purple-300 border border-purple-400/30">
                    Tur {currentOnlineState.currentRound}/{currentOnlineState.totalRounds}
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                  {isObserverHost ? '📺 TV Host Ekranı' : `📱 Oyuncu: ${myPlayer?.name} (${myPlayer?.avatar})`}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {isObserverHost && currentOnlineState.phase === 'LOBBY' && (
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Kopyalandı!' : 'Davet Linki'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Odadan ayrılmak istediğinize emin misiniz?')) {
                    socket.leaveRoom();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-black transition-colors cursor-pointer"
              >
                Odadan Çık
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: LOBBY */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'LOBBY' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Joined Players & Room Code */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Katılan Jüri Üyeleri</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Gizli oylama için en az 2 oyuncu gereklidir (önerilen 3-8).
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-black text-xs">
                    {currentOnlinePlayers.length} Oyuncu Hazır
                  </span>
                </div>

                {currentOnlinePlayers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Smartphone className="w-10 h-10 mx-auto text-slate-300 animate-bounce" />
                    <p className="text-sm font-bold">Oyuncuların telefondan bağlanması bekleniyor...</p>
                    <p className="text-xs text-slate-500">Sağdaki QR kodu taratarak hemen katılabilirsiniz.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {currentOnlinePlayers.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                          p.id === myPlayer?.id
                            ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                          {p.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">
                            {p.isHost ? '👑 Oda Sahibi' : `Jüri #${idx + 1}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start Game Button (for Host) */}
                {(isObserverHost || myPlayer?.isHost) && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        playTurnSound();
                        socket.startGame();
                      }}
                      disabled={currentOnlinePlayers.length < 2}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-base shadow-lg shadow-purple-600/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Gavel className="w-5 h-5" />
                      <span>Duruşmayı Başlat (1. Soru)</span>
                    </button>
                    {currentOnlinePlayers.length < 2 && (
                      <p className="text-[11px] text-center text-amber-600 font-bold mt-2">
                        ⚠️ Başlatmak için en az 2 oyuncunun katılması gerekir.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Col: QR Code Card */}
              <div className="bg-gradient-to-b from-purple-50 to-indigo-50/60 rounded-3xl p-6 border border-purple-200 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                    Telefonla Katıl
                  </span>
                  <h4 className="text-xl font-black text-slate-900 font-mono tracking-wider">
                    {socket.roomCode}
                  </h4>
                </div>

                {/* QR Code image */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-purple-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      getRoomJoinUrl()
                    )}`}
                    alt="Oda QR Kodu"
                    className="w-40 h-40 object-contain rounded-xl"
                  />
                </div>

                <p className="text-xs text-slate-600 font-medium max-w-xs">
                  Kameranızı açıp QR kodu okutun veya tarayıcınızdan bu koda katılın!
                </p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: QUESTION REVEAL */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'QUESTION_REVEAL' && currentOnlineState.currentQuestion && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl space-y-8 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider border border-purple-200">
                <Flame className="w-4 h-4 text-purple-600" />
                <span>{currentOnlineState.currentQuestion.category}</span>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-snug">
                  "{currentOnlineState.currentQuestion.question}"
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Tüm jüri üyeleri aranızdan bu soruya en uygun kişiyi gizlice seçecek.
                </p>
              </div>

              {/* Action */}
              {(isObserverHost || myPlayer?.isHost) ? (
                <div className="max-w-md mx-auto pt-4">
                  <button
                    onClick={() => {
                      playTurnSound();
                      socket.startVoting();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base shadow-xl shadow-purple-600/30 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-5 h-5" />
                    <span>Gizli Oylamayı Başlat (Telefonlara Gönder)</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 max-w-md mx-auto text-purple-900 text-xs font-bold animate-pulse">
                  ⏳ Oda yöneticisinin oylamayı başlatması bekleniyor...
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: VOTING (SECRET VOTING) */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'VOTING' && (
            <div className="space-y-6">
              {/* Question Header Banner */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  {currentOnlineState.currentQuestion?.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 max-w-2xl mx-auto">
                  "{currentOnlineState.currentQuestion?.question}"
                </h3>
              </div>

              {/* If Mobile Player: Show Secret Voting Pad */}
              {!isObserverHost && myPlayer && (
                <div className="bg-gradient-to-b from-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-purple-400/40 space-y-6 animate-fade-in">
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-black border border-white/20">
                      <Lock className="w-3.5 h-3.5 text-purple-300" />
                      <span>GİZLİ OY PUSULASI</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black">Kimi Suçluyorsun?</h3>
                    <p className="text-xs text-purple-200/80 font-medium">
                      Aşağıdan suçlu bulduğun arkadaşının kartına dokun! Seçimin kesinlikle gizlidir.
                    </p>
                  </div>

                  {/* Secret Player Cards to Pick */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto">
                    {currentOnlinePlayers.map((target) => {
                      const isMyTarget = socket.myVotedTargetId === target.id;
                      return (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => socket.castSecretVote(target.id)}
                          className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                            isMyTarget
                              ? 'bg-purple-500 border-white text-white shadow-xl ring-4 ring-purple-400/50 scale-105'
                              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                          }`}
                        >
                          <span className="text-4xl">{target.avatar}</span>
                          <span className="text-sm font-black truncate w-full">{target.name}</span>
                          {isMyTarget && (
                            <span className="text-[10px] font-black bg-white text-purple-900 px-2 py-0.5 rounded-full shadow-xs">
                              ✓ SEÇİLDİ
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {socket.myVotedTargetId && (
                    <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-center text-emerald-200 text-xs font-black flex items-center justify-center gap-2 animate-pulse">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Oyunuz kilitlendi! Diğer jürilerin oylarını vermesi bekleniyor...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TV Status View: Live Voting Progress and Voter Lock Status */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="text-base font-black text-slate-900">Jüri Oy Durumu</h4>
                      <p className="text-xs text-slate-500">Oylar verildikten sonra mahkeme kararı açıklanacaktır.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
                    {socket.votedPlayerIds.length} / {currentOnlinePlayers.length} Oy Kullanıldı
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {currentOnlinePlayers.map((p) => {
                    const hasVoted = socket.votedPlayerIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                          hasVoted
                            ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                          {p.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {hasVoted ? (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Kilitlendi</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 animate-spin" />
                                <span>Bekleniyor</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: THE VERDICT (ACCUSED REVEALED) */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'THE_VERDICT' && (
            <div className="bg-gradient-to-b from-rose-950 via-purple-950 to-slate-950 rounded-3xl p-6 sm:p-10 text-white border-2 border-rose-500/40 shadow-2xl text-center space-y-8 animate-fade-in relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/40 uppercase tracking-widest animate-pulse">
                <Gavel className="w-4 h-4 text-rose-400" />
                <span>MAHKEME KARARINI VERDİ</span>
              </div>

              {/* Accused spotlight */}
              {(() => {
                const accused = currentOnlinePlayers.find(
                  (p) => p.id === currentOnlineState.accusedPlayerId
                );
                return (
                  <div className="space-y-4">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center text-5xl sm:text-6xl mx-auto shadow-2xl ring-8 ring-rose-500/30 animate-bounce">
                      {accused?.avatar || '🦁'}
                    </div>

                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-rose-400">
                        {accused?.name || 'Sanık'}
                      </h2>
                      <p className="text-sm sm:text-base text-rose-200/90 font-bold mt-1">
                        Jüri çoğunluğunun kararıyla <strong className="text-white">SUÇLU</strong> bulundu!
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Vote Breakdown */}
              {currentOnlineState.voteBreakdown && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 max-w-xl mx-auto space-y-3 text-left">
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider text-center">
                    Oy Dağılımı & İtiriraflar
                  </h4>
                  <div className="space-y-2">
                    {Object.values(currentOnlineState.voteBreakdown).map((vb) => {
                      const target = currentOnlinePlayers.find((p) => p.id === vb.targetPlayerId);
                      return (
                        <div
                          key={vb.targetPlayerId}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span>{target?.avatar}</span>
                            <span className="font-bold text-white">{target?.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-amber-300 mr-2">{vb.count} Oy</span>
                            <span className="text-[10px] text-white/60">
                              ({vb.voterNames.join(', ')})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-rose-300/80 font-medium">
                ⏱️ Sanık şimdi Sıcak Koltuğa oturuyor! 30 saniyelik savunma süresi başlıyor...
              </p>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: DEFENSE TIME (SICAK KOLTUK) */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'DEFENSE_TIME' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-fade-in">
              <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-200">
                  <Mic className="w-4 h-4 text-amber-600" />
                  <span>SICAK KOLTUK & SAVUNMA KÜRSÜSÜ</span>
                </div>
                {(() => {
                  const accused = currentOnlinePlayers.find(
                    (p) => p.id === currentOnlineState.accusedPlayerId
                  );
                  return (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <span className="text-4xl">{accused?.avatar}</span>
                      <div className="text-left">
                        <h3 className="text-xl font-black text-slate-900">{accused?.name}</h3>
                        <p className="text-xs text-slate-500 font-bold">Sanık Kendini Savunuyor</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Accused Live Speech Box */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-inner text-center space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">
                  Sanığın Canlı Savunması
                </p>
                <p className="text-lg sm:text-xl font-bold text-slate-800 italic">
                  "{currentOnlineState.defenseSpeech || 'Sanık kürsüde nefesini tuttu ve kendini savunmaya hazırlanıyor...'}"
                </p>
              </div>

              {/* If mobile user is the accused, give them live defense inputs & presets */}
              {!isObserverHost && myPlayer?.id === currentOnlineState.accusedPlayerId && (
                <div className="p-5 rounded-2xl bg-purple-900 text-white space-y-4 shadow-xl border border-purple-400/40">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
                    <Mic className="w-4 h-4" />
                    <span>SEN SUÇLANDIN! Canlı Savunmanı Yap:</span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEFENSE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setMobileDefenseSpeech(preset);
                          socket.submitDefense(preset);
                        }}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left text-xs font-bold text-white border border-white/15 transition-all cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom typing */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={mobileDefenseSpeech}
                      onChange={(e) => setMobileDefenseSpeech(e.target.value)}
                      placeholder="Kendi savunmanı yaz..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder:text-white/50 text-xs font-bold focus:outline-hidden"
                    />
                    <button
                      onClick={() => {
                        playClickSound();
                        socket.submitDefense(mobileDefenseSpeech);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gönder</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Next Action Button (for Host) */}
              {(isObserverHost || myPlayer?.isHost) && (
                <div className="pt-2 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      playClickSound();
                      socket.nextRound();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-lg shadow-purple-600/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Duruşmayı Tamamla & Puanları Gör</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: ROUND SCORES */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'ROUND_SCORES' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 animate-fade-in text-center">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                  <Trophy className="w-4 h-4 text-purple-600" />
                  <span>Duruşma Puan Durumu</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  {currentOnlineState.currentRound}. Duruşma Tamamlandı!
                </h3>
              </div>

              {/* Leaderboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {currentOnlinePlayers
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-purple-600 w-5">#{idx + 1}</span>
                        <span className="text-2xl">{p.avatar}</span>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">
                            {p.votesReceived} Kez Sanık Oldu
                          </p>
                        </div>
                      </div>
                      <span className="text-base font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                        {p.score} Puan
                      </span>
                    </div>
                  ))}
              </div>

              {(isObserverHost || myPlayer?.isHost) && (
                <div className="pt-4 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      playTurnSound();
                      socket.nextRound();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-base shadow-lg shadow-purple-600/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentOnlineState.currentRound >= currentOnlineState.totalRounds
                        ? 'Sonuçları & Kazananı Gör 🏆'
                        : 'Sonraki Soruya Geç ➡️'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* ONLINE PHASE: GAME OVER */}
          {/* ------------------------------------------------------------------- */}
          {currentOnlineState.phase === 'GAME_OVER' && (
            <div className="bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-purple-400/40 shadow-2xl text-center space-y-8 animate-fade-in">
              <div className="space-y-2">
                <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-4xl mx-auto shadow-2xl animate-bounce">
                  🏆
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-amber-300">
                  Mahkeme Kararı Nihayete Erdi!
                </h2>
                <p className="text-sm text-purple-200/90 font-bold">
                  En isabetli jüri kararlarını veren ve en yüksek puanı toplayan şampiyon:
                </p>
              </div>

              {/* Champion Podium */}
              {(() => {
                const sorted = currentOnlinePlayers.slice().sort((a, b) => b.score - a.score);
                const winner = sorted[0];
                return (
                  <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 max-w-md mx-auto space-y-2">
                    <span className="text-6xl">{winner?.avatar || '🦁'}</span>
                    <h3 className="text-2xl font-black text-white">{winner?.name}</h3>
                    <p className="text-base font-black text-amber-300">{winner?.score} Puan ile Şampiyon!</p>
                  </div>
                );
              })()}

              {(isObserverHost || myPlayer?.isHost) && (
                <div className="pt-4 max-w-sm mx-auto">
                  <button
                    onClick={() => {
                      playClickSound();
                      socket.restartGame();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-base shadow-xl transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Yeniden Oyna</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LOCAL PASS-AND-PLAY (SINGLE DEVICE OFFLINE MODE) */}
      {/* ========================================================================= */}
      {!isOnlineActive && playMode === 'local' && (
        <div className="space-y-6">
          {/* LOCAL LOBBY */}
          {localGameState.phase === 'LOBBY' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center animate-fade-in">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  👥
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Tek Cihazda Mahkeme</h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Telefonu elden ele uzatarak gizli oy verin veya odadaki herkesle birlikte tartışarak oynayın!
                </p>
              </div>

              {/* Player List */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {localPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1"
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] font-bold text-purple-600">{p.score} Puan</p>
                  </div>
                ))}
              </div>

              {/* Add Player Form */}
              <form onSubmit={handleAddLocalPlayer} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Yeni oyuncu adı..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Ekle
                </button>
              </form>

              {/* Start Local Round Button */}
              <div className="pt-4 max-w-sm mx-auto">
                <button
                  onClick={startLocalRound}
                  disabled={localPlayers.length < 2}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-base shadow-lg shadow-purple-600/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Gavel className="w-5 h-5" />
                  <span>Duruşmayı Başlat</span>
                </button>
              </div>
            </div>
          )}

          {/* LOCAL QUESTION REVEAL */}
          {localGameState.phase === 'QUESTION_REVEAL' && localGameState.currentQuestion && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl space-y-8 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider border border-purple-200">
                <Flame className="w-4 h-4 text-purple-600" />
                <span>{localGameState.currentQuestion.category}</span>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-snug">
                  "{localGameState.currentQuestion.question}"
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Tüm oyuncular telefonu sırayla alıp gizlice kurbanını seçecek!
                </p>
              </div>

              <div className="max-w-md mx-auto pt-4">
                <button
                  onClick={startLocalVoting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-base shadow-xl shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  <span>Oylamayı Başlat (Telefonu {localPlayers[0]?.name}'e verin)</span>
                </button>
              </div>
            </div>
          )}

          {/* LOCAL SECRET VOTING */}
          {localGameState.phase === 'VOTING' && (
            <div className="bg-gradient-to-b from-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-purple-400/40 space-y-6 text-center animate-fade-in">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  Sıra Sende: {localPlayers[activeVoterIndex]?.name} {localPlayers[activeVoterIndex]?.avatar}
                </span>
                <h3 className="text-xl sm:text-2xl font-black pt-2">Kimi Suçluyorsun?</h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  "{localGameState.currentQuestion?.question}"
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                {localPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleLocalVote(p.id)}
                    className="p-4 rounded-2xl bg-white/10 hover:bg-purple-600 hover:border-white border border-white/20 text-center flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-4xl">{p.avatar}</span>
                    <span className="text-sm font-black truncate w-full">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOCAL THE VERDICT */}
          {localGameState.phase === 'THE_VERDICT' && (
            <div className="bg-gradient-to-b from-rose-950 to-slate-950 rounded-3xl p-8 text-white border-2 border-rose-500/40 shadow-2xl text-center space-y-6 animate-fade-in">
              <div className="w-24 h-24 rounded-3xl bg-rose-600 flex items-center justify-center text-5xl mx-auto shadow-2xl animate-bounce">
                {localPlayers.find((p) => p.id === localGameState.accusedPlayerId)?.avatar || '🦁'}
              </div>
              <h2 className="text-3xl font-black text-rose-400">
                {localPlayers.find((p) => p.id === localGameState.accusedPlayerId)?.name} Suçlu Bulundu!
              </h2>
              <button
                onClick={() =>
                  setLocalGameState((prev) => ({
                    ...prev,
                    phase: 'DEFENSE_TIME',
                  }))
                }
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm cursor-pointer"
              >
                Savunma Kürsüsüne Geç 🎤
              </button>
            </div>
          )}

          {/* LOCAL DEFENSE TIME */}
          {localGameState.phase === 'DEFENSE_TIME' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center animate-fade-in">
              <h3 className="text-2xl font-black text-slate-900">🎤 Savunma Kürsüsü</h3>
              <p className="text-xs text-slate-600 font-medium">
                {localPlayers.find((p) => p.id === localGameState.accusedPlayerId)?.name}, kendini 30 saniye içinde jüriye savun!
              </p>
              <form onSubmit={handleLocalDefenseSubmit} className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={localDefenseInput}
                  onChange={(e) => setLocalDefenseInput(e.target.value)}
                  placeholder="Savunma konuşmanı yaz veya söyle..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm cursor-pointer"
                >
                  Savunmayı Tamamla & Puanları Gör
                </button>
              </form>
            </div>
          )}

          {/* LOCAL ROUND SCORES */}
          {localGameState.phase === 'ROUND_SCORES' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center animate-fade-in">
              <h3 className="text-2xl font-black text-slate-900">Duruşma Puanları</h3>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {localPlayers.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-2xl">{p.avatar}</span>
                    <p className="text-xs font-black">{p.name}</p>
                    <p className="text-xs font-bold text-purple-600">{p.score} Puan</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleLocalNextRoundOrFinish}
                className="px-6 py-3.5 rounded-2xl bg-purple-600 text-white font-black text-sm cursor-pointer"
              >
                {localGameState.currentRound < localGameState.totalRounds
                  ? 'Sonraki Duruşma ➡️'
                  : 'Sonuçları Gör 🏆'}
              </button>
            </div>
          )}

          {/* LOCAL GAME OVER */}
          {localGameState.phase === 'GAME_OVER' && (
            <div className="bg-purple-950 rounded-3xl p-8 text-white text-center space-y-6 animate-fade-in">
              <h2 className="text-3xl font-black text-amber-400">Mahkeme Bitti!</h2>
              <button
                onClick={() => {
                  setLocalGameState({
                    phase: 'LOBBY',
                    currentRound: 1,
                    totalRounds: 3,
                    currentQuestion: VERDICT_QUESTIONS[0],
                    accusedPlayerId: null,
                    defenseSeconds: 30,
                    roundVotes: {},
                  });
                }}
                className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-900 font-black text-sm cursor-pointer"
              >
                Yeniden Oyna
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
