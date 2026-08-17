import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bomb,
  Flame,
  Heart,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Volume2,
  Trophy,
  Tv,
  Smartphone,
  Copy,
  Check,
  QrCode,
  Users,
  AlertTriangle,
  Zap,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { BombGameState, BombPlayer, BombPrompt } from '../../types/partyGames';
import { BOMB_PROMPTS, getRandomBombPrompt } from '../../data/bombPrompts';
import {
  playClickSound,
  playTurnSound,
  playAssassinSound,
  playWinSound,
  playFanfareSound,
} from '../../utils/audio';
import { useBombSocket } from '../../utils/useBombSocket';

interface WordBombGameProps {
  onBackToHub: () => void;
}

const DEFAULT_LOCAL_PLAYERS: BombPlayer[] = [
  { id: 'bp1', name: 'Atakan', avatar: '🦁', color: '#ef4444', colorName: 'Kırmızı', lives: 3, wordsUsed: [], isAlive: true },
  { id: 'bp2', name: 'Zeynep', avatar: '🦊', color: '#f97316', colorName: 'Turuncu', lives: 3, wordsUsed: [], isAlive: true },
  { id: 'bp3', name: 'Caner', avatar: '🐼', color: '#06b6d4', colorName: 'Camgöbeği', lives: 3, wordsUsed: [], isAlive: true },
  { id: 'bp4', name: 'Selin', avatar: '🦄', color: '#8b5cf6', colorName: 'Mor', lives: 3, wordsUsed: [], isAlive: true },
];

const AVATAR_LIST = ['🦁', '🦊', '🐼', '🦄', '🐯', '🐙', '🐨', '🐸', '🚀', '⚡', '🔥', '👑'];

export const WordBombGame: React.FC<WordBombGameProps> = ({ onBackToHub }) => {
  // Mode selection: 'online_host' | 'online_join' | 'local'
  const [playMode, setPlayMode] = useState<'online_host' | 'online_join' | 'local'>('online_host');

  // Online WebSocket integration
  const socket = useBombSocket();

  // Mobile Join Form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile controller typed word
  const [mobileTypedWord, setMobileTypedWord] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  // Local Pass-and-Play state
  const [localPlayers, setLocalPlayers] = useState<BombPlayer[]>(DEFAULT_LOCAL_PLAYERS);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [localTypedWord, setLocalTypedWord] = useState('');
  const [localGameState, setLocalGameState] = useState<BombGameState>({
    phase: 'LOBBY',
    currentRound: 1,
    currentPrompt: BOMB_PROMPTS[0],
    activePlayerIndex: 0,
    bombTimeRemaining: 25,
    visualTimerFraction: 1,
    usedWords: [],
    explodedPlayerId: null,
    winnerPlayerId: null,
    isOnline: false,
  });

  const localTimerRef = useRef<number | null>(null);
  const localInitialDurationRef = useRef<number>(25);

  // Auto-detect room code in URL (?game=bomb&room=CODE or ?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase());
      setPlayMode('online_join');
    }
  }, []);

  // Copy Room Link to clipboard
  const handleCopyLink = (code: string) => {
    playClickSound();
    const url = `${window.location.origin}${window.location.pathname}?game=bomb&room=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // ==========================================
  // LOCAL PASS-AND-PLAY LOGIC
  // ==========================================
  const startLocalBombRound = () => {
    playTurnSound();
    const alivePlayers = localPlayers.filter((p) => p.isAlive);
    if (alivePlayers.length <= 1) {
      const winner = alivePlayers[0] || localPlayers[0];
      setLocalGameState((prev) => ({
        ...prev,
        phase: 'GAME_OVER',
        winnerPlayerId: winner.id,
      }));
      playWinSound();
      return;
    }

    const prompt = getRandomBombPrompt();
    const randomFuse = Math.floor(16 + Math.random() * 14);
    localInitialDurationRef.current = randomFuse;

    const firstAliveIndex = localPlayers.findIndex((p) => p.isAlive);

    setLocalGameState((prev) => ({
      ...prev,
      phase: 'TICKING',
      currentPrompt: prompt,
      activePlayerIndex: firstAliveIndex >= 0 ? firstAliveIndex : 0,
      bombTimeRemaining: randomFuse,
      visualTimerFraction: 1,
      usedWords: [],
      explodedPlayerId: null,
    }));
    setLocalTypedWord('');
  };

  useEffect(() => {
    if (playMode === 'local' && localGameState.phase === 'TICKING') {
      localTimerRef.current = window.setInterval(() => {
        setLocalGameState((prev) => {
          if (prev.phase !== 'TICKING') return prev;

          const nextRemaining = prev.bombTimeRemaining - 0.5;

          if (nextRemaining <= 0) {
            playAssassinSound();
            const victim = localPlayers[prev.activePlayerIndex];

            const updatedPlayers = localPlayers.map((p, idx) => {
              if (idx === prev.activePlayerIndex) {
                const nextLives = p.lives - 1;
                return {
                  ...p,
                  lives: nextLives,
                  isAlive: nextLives > 0,
                };
              }
              return p;
            });

            setLocalPlayers(updatedPlayers);

            const remainingAlive = updatedPlayers.filter((p) => p.isAlive);
            if (remainingAlive.length <= 1) {
              playWinSound();
              return {
                ...prev,
                phase: 'GAME_OVER',
                explodedPlayerId: victim ? victim.id : null,
                winnerPlayerId: remainingAlive[0] ? remainingAlive[0].id : null,
                bombTimeRemaining: 0,
                visualTimerFraction: 0,
              };
            }

            return {
              ...prev,
              phase: 'EXPLODED',
              explodedPlayerId: victim ? victim.id : null,
              bombTimeRemaining: 0,
              visualTimerFraction: 0,
            };
          }

          return {
            ...prev,
            bombTimeRemaining: nextRemaining,
            visualTimerFraction: Math.max(0, nextRemaining / localInitialDurationRef.current),
          };
        });
      }, 500);
    }

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [playMode, localGameState.phase, localPlayers]);

  const handlePassLocalBomb = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (localGameState.phase !== 'TICKING') return;

    playClickSound();
    const word = localTypedWord.trim() || '✓ Pas Geçildi';
    const nextUsedWords = [...localGameState.usedWords, word];
    setLocalTypedWord('');

    let nextIdx = (localGameState.activePlayerIndex + 1) % localPlayers.length;
    let loops = 0;
    while (!localPlayers[nextIdx].isAlive && loops < localPlayers.length) {
      nextIdx = (nextIdx + 1) % localPlayers.length;
      loops++;
    }

    setLocalGameState((prev) => ({
      ...prev,
      activePlayerIndex: nextIdx,
      usedWords: nextUsedWords,
    }));
  };

  const handleAddLocalPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const randomAvatar = AVATAR_LIST[localPlayers.length % AVATAR_LIST.length];
    setLocalPlayers((prev) => [
      ...prev,
      {
        id: `bp_${Date.now()}`,
        name: newPlayerName.trim(),
        avatar: randomAvatar,
        lives: 3,
        wordsUsed: [],
        isAlive: true,
      },
    ]);
    setNewPlayerName('');
  };

  // Online helper state
  const onlineGameState = socket.gameState;
  const onlinePlayers = socket.players;
  const activeOnlinePlayer = onlinePlayers[onlineGameState?.activePlayerIndex ?? 0];
  const isMyOnlineTurn = socket.isMyTurn;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-slate-900 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <button
          onClick={() => {
            playClickSound();
            socket.leaveRoom();
            onBackToHub();
          }}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Oyun Merkezine Dön</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-red-500/20 text-lg animate-pulse">
            💣
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>Saatli Bomba</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Word Bomb
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              Tik-tak patlamadan kelimeyi devret!
            </p>
          </div>
        </div>

        {/* Mode Selector Segment */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              playClickSound();
              setPlayMode('online_host');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playMode === 'online_host'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>📺 TV Host</span>
          </button>
          <button
            onClick={() => {
              playClickSound();
              setPlayMode('online_join');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playMode === 'online_join'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Katıl</span>
          </button>
          <button
            onClick={() => {
              playClickSound();
              setPlayMode('local');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playMode === 'local'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📲 Tek Cihaz</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ONLINE TV HOST (ANA EKRAN / OBSERVER BOARD)                       */}
      {/* ========================================================================= */}
      {playMode === 'online_host' && (
        <div className="space-y-6">
          {!socket.roomCode ? (
            /* TV Host - Create Room Prompt */
            <div className="bg-gradient-to-br from-amber-400 via-red-500 to-rose-600 text-white rounded-3xl p-8 sm:p-12 border-4 border-white shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="max-w-md mx-auto space-y-3 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-white text-slate-900 flex items-center justify-center text-4xl mx-auto shadow-2xl animate-bounce">
                  💣
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                  Saatli Bomba TV Modu
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium">
                  Bu ekranı televizyona veya monitöre yansıtın. Arkadaşlarınız telefonlarıyla odaya katılsın ve sırası gelen telefonundan kelime yazarak bombayı devretsin!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
                <button
                  onClick={() => {
                    playClickSound();
                    socket.createRoom();
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-red-600 font-black text-sm sm:text-base rounded-2xl shadow-xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-red-200 btn-party"
                >
                  <Tv className="w-5 h-5 text-red-600" />
                  <span>ONLINE TV ODASI OLUŞTUR</span>
                </button>
              </div>
            </div>
          ) : (
            /* TV Host Active Room Screen */
            <div className="space-y-6">
              {/* TV Room Code & Share Bar */}
              <div className="bg-white text-slate-900 rounded-2xl p-4 border-2 border-red-200 flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-black text-xs tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>TV HOST CANLI</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Oda Kodu</span>
                    <span className="text-xl sm:text-2xl font-black tracking-widest text-red-600 font-mono">
                      {socket.roomCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(socket.roomCode!)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>Davet Linki</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      playClickSound();
                      socket.leaveRoom();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                  >
                    Odayı Kapat
                  </button>
                </div>
              </div>

              {/* ONLINE PHASE 1: LOBBY */}
              {(!onlineGameState || onlineGameState.phase === 'LOBBY') && (
                <div className="bg-white rounded-3xl p-6 sm:p-10 border-3 border-red-200 shadow-xl space-y-8 text-center">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left: QR Code & Join Info */}
                    <div className="md:col-span-5 bg-gradient-to-br from-red-50 to-amber-50 text-slate-900 p-6 rounded-3xl border-2 border-red-200 space-y-4 text-center shadow-md">
                      <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-300">
                        TELEFONDAN KATIL
                      </span>

                      <div className="p-3 bg-white rounded-2xl inline-block shadow-lg border-4 border-red-400">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            `${window.location.origin}${window.location.pathname}?game=bomb&room=${socket.roomCode}`
                          )}`}
                          alt="Room QR Code"
                          className="w-36 h-36 sm:w-44 sm:h-44 rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 font-bold">Kamera ile QR Kodu Okutun</p>
                        <p className="text-2xl font-black text-red-600 tracking-widest font-mono">
                          {socket.roomCode}
                        </p>
                      </div>
                    </div>

                    {/* Right: Player Roster & Start Button */}
                    <div className="md:col-span-7 space-y-6 text-left">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-900">
                            Katılan Oyuncular ({onlinePlayers.length})
                          </h3>
                          <span className="text-xs text-slate-500 font-bold">
                            En az 2 oyuncu önerilir
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Herkes telefonundan katıldığında aşağıdaki butona basarak bombayı ateşleyin!
                        </p>
                      </div>

                      {/* Player Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[140px]">
                        {onlinePlayers.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 relative"
                          >
                            <span className="text-3xl">{p.avatar}</span>
                            <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                            <div className="flex justify-center gap-1">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} className="text-xs">
                                  {i < p.lives ? '❤️' : '🖤'}
                                </span>
                              ))}
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-white shadow-xs" />
                          </div>
                        ))}

                        {onlinePlayers.length === 0 && (
                          <div className="col-span-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold text-center space-y-2">
                            <Smartphone className="w-8 h-8 text-slate-300 animate-bounce" />
                            <span>Oyuncuların telefonlarıyla katılması bekleniyor...</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          playClickSound();
                          socket.startRound();
                        }}
                        disabled={onlinePlayers.length < 2}
                        className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                          onlinePlayers.length >= 2
                            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white active:scale-98 shadow-red-600/30'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Flame className="w-5 h-5" />
                        <span>BOMBAYI ATEŞLE 💣 ({onlinePlayers.length} Oyuncu)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ONLINE PHASE 2: TICKING BOMB ARENA */}
              {onlineGameState?.phase === 'TICKING' && onlineGameState.currentPrompt && (
                <div className="space-y-6">
                  {/* Giant Central Bomb TV Display */}
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden border-2 border-red-500/40">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent pointer-events-none" />

                    {/* Animated Pulsing Bomb */}
                    <div className="relative flex items-center justify-center my-4">
                      <div
                        className="transition-all duration-300 transform"
                        style={{
                          transform: `scale(${1 + (1 - onlineGameState.visualTimerFraction) * 0.5})`,
                        }}
                      >
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-6xl sm:text-7xl shadow-2xl shadow-red-600/60 animate-bounce">
                          💣
                        </div>
                      </div>
                    </div>

                    {/* Current Category & Prompt Banner */}
                    <div className="space-y-2 max-w-xl mx-auto relative z-10">
                      <span className="px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-wider border border-red-500/30">
                        {onlineGameState.currentPrompt.category}
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-black text-amber-200 drop-shadow-md">
                        "{onlineGameState.currentPrompt.prompt}"
                      </h2>
                    </div>

                    {/* Active Holding Player Spotlight */}
                    <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                      <span className="text-3xl animate-bounce">{activeOnlinePlayer?.avatar}</span>
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-bold text-red-300 block">
                          BOMBA KİMİN ELİNDE?
                        </span>
                        <p className="text-base sm:text-lg font-black text-white">
                          {activeOnlinePlayer?.name}
                        </p>
                      </div>
                    </div>

                    {/* Host TV Emergency Pass button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          playClickSound();
                          socket.passTurn();
                        }}
                        className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                      >
                        🎙️ Oyuncu Sesli Söyledi (TV'den Pas Devret)
                      </button>
                    </div>
                  </div>

                  {/* Used Words Cloud in Current Round */}
                  {onlineGameState.usedWords.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Bu Turda Söylenen Kelimeler ({onlineGameState.usedWords.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {onlineGameState.usedWords.map((word, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black animate-fade-in"
                          >
                            ✓ {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Players Arena Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {onlinePlayers.map((p, idx) => {
                      const isHolding = idx === onlineGameState.activePlayerIndex;
                      return (
                        <div
                          key={p.id}
                          className={`p-4 rounded-2xl border-2 transition-all text-center space-y-1.5 ${
                            isHolding
                              ? 'bg-red-50 border-red-500 ring-4 ring-red-500/20 shadow-lg scale-105'
                              : p.isAlive
                              ? 'bg-white border-slate-200 shadow-xs'
                              : 'bg-slate-100 border-slate-200 opacity-40'
                          }`}
                        >
                          <span className="text-3xl block">{p.avatar}</span>
                          <p className="text-xs font-black text-slate-900 truncate">{p.name}</p>
                          <div className="flex justify-center gap-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <span key={i} className="text-xs">
                                {i < p.lives ? '❤️' : '🖤'}
                              </span>
                            ))}
                          </div>
                          {isHolding && (
                            <span className="text-[10px] font-black text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded-full inline-block">
                              💣 Sende!
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ONLINE PHASE 3: EXPLODED SCREEN */}
              {onlineGameState?.phase === 'EXPLODED' && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-6 max-w-xl mx-auto animate-shake">
                  <div className="w-24 h-24 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-5xl mx-auto shadow-inner">
                    💥
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                      BOOOOOOOM!
                    </span>
                    <h2 className="text-3xl font-black text-slate-900">Bomba Patladı!</h2>
                    <p className="text-sm text-slate-600 font-medium">
                      Bomba elindeyken patlayan:{' '}
                      <strong className="text-red-600 text-base">
                        {onlinePlayers.find((p) => p.id === onlineGameState.explodedPlayerId)?.name}
                      </strong>{' '}
                      (1 can kaybetti 💔)
                    </p>
                  </div>

                  {/* Current Lives Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {onlinePlayers.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border text-center ${
                          p.id === onlineGameState.explodedPlayerId
                            ? 'bg-red-50 border-red-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <p className="text-xs font-black text-slate-800 truncate">
                          {p.avatar} {p.name}
                        </p>
                        <div className="flex justify-center gap-1 mt-1">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <span key={i} className="text-xs">
                              {i < p.lives ? '❤️' : '🖤'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      playClickSound();
                      socket.nextRound();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-xl shadow-red-600/30 cursor-pointer active:scale-98 transition-all"
                  >
                    SONRAKİ BOMBAYI ATEŞLE 💣 (Tur {onlineGameState.currentRound + 1})
                  </button>
                </div>
              )}

              {/* ONLINE PHASE 4: GAME OVER */}
              {onlineGameState?.phase === 'GAME_OVER' && (
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl text-center space-y-6 max-w-xl mx-auto animate-fade-in">
                  <div className="w-24 h-24 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-5xl mx-auto shadow-inner animate-bounce">
                    🏆
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                      Bomba Arenası Şampiyonu!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Tüm turlarda hayatta kalmayı başaran tek kurtulan:
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 text-white space-y-2 shadow-xl">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                      👑 KELİME ŞAMPİYONU
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black">
                      {onlinePlayers.find((p) => p.id === onlineGameState.winnerPlayerId)?.name}
                    </h3>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        playClickSound();
                        socket.restartGame();
                      }}
                      className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-md"
                    >
                      YENİDEN OYNA (LOBİ)
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        socket.leaveRoom();
                        onBackToHub();
                      }}
                      className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      OYUN MERKEZİ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MOBILE PHONE CONTROLLER (TELEFON KUMANDASI)                        */}
      {/* ========================================================================= */}
      {playMode === 'online_join' && (
        <div className="max-w-md mx-auto space-y-6">
          {!socket.myPlayer ? (
            /* Mobile Join Form */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  📱
                </div>
                <h2 className="text-xl font-black text-slate-900">Telefondan Katıl</h2>
                <p className="text-xs text-slate-500">
                  TV ekranındaki 4 haneli oda kodunu girerek bombaya katılın.
                </p>
              </div>

              {socket.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{socket.errorMessage}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!joinCodeInput.trim() || !playerNameInput.trim()) return;
                  playClickSound();
                  socket.joinRoom(joinCodeInput, playerNameInput, selectedAvatar);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    Oda Kodu
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Örn: FIRE42"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-500 font-black text-center text-lg uppercase tracking-widest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    Oyuncu Adınız
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Adınız..."
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-500 font-bold text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1.5">
                    Avatar Seçin
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_LIST.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`p-2 rounded-xl text-xl transition-all cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-red-500 text-white ring-2 ring-red-400 scale-110 shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm shadow-lg shadow-red-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  ODAYA KATIL 🚀
                </button>
              </form>
            </div>
          ) : (
            /* Active Mobile Controller */
            <div className="space-y-4">
              {/* Top Mobile Status Header */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{socket.myPlayer.avatar}</span>
                  <div>
                    <h3 className="text-xs font-black text-white">{socket.myPlayer.name}</h3>
                    <div className="flex gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className="text-xs">
                          {i < (onlinePlayers.find((p) => p.id === socket.myPlayer?.id)?.lives ?? 3)
                            ? '❤️'
                            : '🖤'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Oda</span>
                  <span className="text-xs font-black text-amber-400">{socket.roomCode}</span>
                </div>
              </div>

              {/* Controller Screen per Phase */}
              {(!onlineGameState || onlineGameState.phase === 'LOBBY') && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto animate-pulse">
                    ⏳
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Lobiye Katıldınız!</h3>
                  <p className="text-xs text-slate-500">
                    TV ekranından oyunun başlatılması bekleniyor. Hazır olun!
                  </p>
                </div>
              )}

              {onlineGameState?.phase === 'TICKING' && (
                <div className="space-y-4">
                  {/* Prompt Banner Preview on Phone */}
                  {onlineGameState.currentPrompt && (
                    <div className="bg-slate-900 text-white rounded-2xl p-4 text-center border border-slate-800 space-y-1 shadow-md">
                      <span className="text-[10px] font-black uppercase text-red-400 bg-red-950 px-2.5 py-0.5 rounded-full">
                        {onlineGameState.currentPrompt.category}
                      </span>
                      <p className="text-sm font-black text-amber-200">
                        "{onlineGameState.currentPrompt.prompt}"
                      </p>
                    </div>
                  )}

                  {/* Is it MY turn? */}
                  {isMyOnlineTurn ? (
                    /* EMERGENCY ALERT: BOMB IS IN YOUR HANDS! */
                    <div className="bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 border-4 border-amber-300 animate-shake">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl mx-auto shadow-inner animate-bounce">
                        💣
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-black uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full text-amber-200">
                          🚨 DİKKAT! BOMBA SENDE!
                        </span>
                        <h2 className="text-2xl font-black text-white">ÇABUK KELİME YAZ!</h2>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!mobileTypedWord.trim()) return;
                          playClickSound();
                          socket.submitWord(mobileTypedWord);
                          setMobileTypedWord('');
                        }}
                        className="space-y-3"
                      >
                        <input
                          type="text"
                          autoFocus
                          placeholder="Kelimenizi buraya yazın..."
                          value={mobileTypedWord}
                          onChange={(e) => setMobileTypedWord(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-2xl bg-white text-slate-900 font-black text-center text-base focus:outline-none shadow-inner"
                        />

                        <button
                          type="submit"
                          className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-base shadow-xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Flame className="w-5 h-5 text-amber-400" />
                          <span>🔥 BOMBADAN KURTUL (GÖNDER)</span>
                        </button>
                      </form>

                      {/* Quick Pass Voice Option */}
                      <button
                        onClick={() => {
                          playClickSound();
                          socket.passTurn();
                        }}
                        className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer transition-all"
                      >
                        🎤 Sesli Söyledim (Pas Devret)
                      </button>
                    </div>
                  ) : (
                    /* Calm / Waiting for Turn */
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-3xl mx-auto">
                        ⏳
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          ŞU AN BOMBA KİMDE?
                        </span>
                        <h3 className="text-xl font-black text-slate-800">
                          {activeOnlinePlayer?.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Sıran gelene kadar kelimeni düşün!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Exploded / Game Over states on phone */}
              {onlineGameState?.phase === 'EXPLODED' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl text-center space-y-3">
                  <span className="text-4xl block">💥</span>
                  <h3 className="text-lg font-black text-slate-900">Bomba Patladı!</h3>
                  <p className="text-xs text-slate-500">
                    TV ekranından sonraki turun başlatılması bekleniyor.
                  </p>
                </div>
              )}

              {onlineGameState?.phase === 'GAME_OVER' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl text-center space-y-3">
                  <span className="text-4xl block">🏆</span>
                  <h3 className="text-lg font-black text-slate-900">Oyun Bitti!</h3>
                  <p className="text-xs text-slate-500">
                    Şampiyon: {onlinePlayers.find((p) => p.id === onlineGameState.winnerPlayerId)?.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: LOCAL PASS-AND-PLAY (TEK CİHAZ / EL DEĞİŞTİR)                      */}
      {/* ========================================================================= */}
      {playMode === 'local' && (
        <div className="space-y-6">
          {/* LOCAL LOBBY */}
          {localGameState.phase === 'LOBBY' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  💣
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Saatli Bomba (Tek Cihaz)</h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Cihazı elden ele gezdirin. Kurala uygun kelimeyi söyleyip hemen bombayı devredin!
                </p>
              </div>

              {/* Player Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {localPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1"
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className="text-xs">
                          {i < p.lives ? '❤️' : '🖤'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Player Input */}
              <form onSubmit={handleAddLocalPlayer} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  placeholder="Yeni oyuncu adı..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Ekle
                </button>
              </form>

              <button
                onClick={startLocalBombRound}
                className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-lg transition-all active:scale-98 cursor-pointer"
              >
                BOMBAYI ATEŞLE 💣 ({localPlayers.length} Oyuncu)
              </button>
            </div>
          )}

          {/* LOCAL TICKING */}
          {localGameState.phase === 'TICKING' && localGameState.currentPrompt && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden border border-red-500/30">
                <div
                  className="transition-all duration-300 transform inline-block"
                  style={{
                    transform: `scale(${1 + (1 - localGameState.visualTimerFraction) * 0.45})`,
                  }}
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-5xl sm:text-6xl shadow-2xl shadow-red-600/50 animate-bounce">
                    💣
                  </div>
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-wider border border-red-500/30">
                    {localGameState.currentPrompt.category}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-amber-200">
                    "{localGameState.currentPrompt.prompt}"
                  </h2>
                </div>

                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <span className="text-2xl">
                    {localPlayers[localGameState.activePlayerIndex]?.avatar}
                  </span>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-red-300">Bomba Kimde?</span>
                    <p className="text-sm font-black text-white">
                      {localPlayers[localGameState.activePlayerIndex]?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Local interactive passing controller */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4 max-w-lg mx-auto text-center">
                <form onSubmit={handlePassLocalBomb} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Kelime (isteğe bağlı)..."
                    value={localTypedWord}
                    onChange={(e) => setLocalTypedWord(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-500 font-bold text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-md cursor-pointer active:scale-95 transition-all"
                  >
                    PASLA 🚀
                  </button>
                </form>

                <button
                  onClick={() => handlePassLocalBomb()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-base shadow-lg hover:from-amber-400 hover:to-red-500 cursor-pointer active:scale-98 transition-all"
                >
                  🔥 SESLİ SÖYLEDİM, BOMBAYI DEVRET!
                </button>
              </div>

              {/* Local player lives */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {localPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border transition-all text-center ${
                      idx === localGameState.activePlayerIndex
                        ? 'bg-red-50 border-red-500 ring-2 ring-red-500/30'
                        : p.isAlive
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-100 border-slate-200 opacity-40'
                    }`}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                    <div className="flex justify-center gap-1 mt-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className="text-xs">
                          {i < p.lives ? '❤️' : '🖤'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOCAL EXPLODED */}
          {localGameState.phase === 'EXPLODED' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 max-w-xl mx-auto animate-shake">
              <div className="w-20 h-20 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-4xl mx-auto shadow-inner">
                💥
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  BOOOOM!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Bomba Patladı!</h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Bomba elindeyken patlayan:{' '}
                  <strong className="text-red-600">
                    {localPlayers.find((p) => p.id === localGameState.explodedPlayerId)?.name}
                  </strong>{' '}
                  (1 can kaybetti)
                </p>
              </div>

              <button
                onClick={() => {
                  setLocalGameState((prev) => ({
                    ...prev,
                    currentRound: prev.currentRound + 1,
                  }));
                  startLocalBombRound();
                }}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-md cursor-pointer transition-all active:scale-98"
              >
                YENİ TURA BAŞLA 💣
              </button>
            </div>
          )}

          {/* LOCAL GAME OVER */}
          {localGameState.phase === 'GAME_OVER' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-4xl mx-auto shadow-inner">
                🏆
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Bomba Arenası Şampiyonu!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Hayatta kalmayı başaran tek oyuncu:
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-red-600 text-white space-y-2 shadow-lg">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                  HAYATTA KALAN KELİME ŞAMPİYONU
                </span>
                <h3 className="text-3xl font-black">
                  {localPlayers.find((p) => p.id === localGameState.winnerPlayerId)?.name}
                </h3>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setLocalGameState((prev) => ({
                      ...prev,
                      phase: 'LOBBY',
                      currentRound: 1,
                    }));
                    setLocalPlayers((prev) =>
                      prev.map((p) => ({ ...p, lives: 3, isAlive: true }))
                    );
                  }}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-md"
                >
                  YENİDEN OYNA
                </button>
                <button
                  onClick={onBackToHub}
                  className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  OYUN MERKEZİ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
