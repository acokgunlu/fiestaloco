import React, { useState, useEffect } from 'react';
import { CodenamesGameState, CodenamesTeam, CodenamesClue, CodenamesPlayer } from '../../types/codenames';
import { CodenamesCard } from '../../data/codenamesWords';
import { CodenamesCardItem } from './CodenamesCardItem';
import { CodenamesClueInputModal } from './CodenamesClueInputModal';
import { CodenamesGameOverModal } from './CodenamesGameOverModal';
import { CodenamesRulesModal } from './CodenamesRulesModal';
import QRCode from 'qrcode';
import { t } from '../../i18n';
import {
  Eye,
  EyeOff,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Clock,
  Shield,
  UserCheck,
  History,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Flame,
  Tv,
  QrCode,
  Copy,
  Check,
  Users,
  Smartphone,
  Share2,
} from 'lucide-react';
import {
  playClickSound,
  playAgentFoundSound,
  playNeutralFoundSound,
  playEnemyAgentSound,
  playAssassinSound,
  playTurnSound,
  playTimerTick,
} from '../../utils/audio';

interface CodenamesBoardViewProps {
  gameState: CodenamesGameState;
  onUpdateGameState?: (updater: (prev: CodenamesGameState) => CodenamesGameState) => void;
  onNewGame: () => void;
  onReturnToHub: () => void;
  // Multi-device TV Host props:
  roomCode?: string | null;
  isTvHost?: boolean;
  players?: CodenamesPlayer[];
  onRevealCardSocket?: (cardId: string) => void;
  onGiveClueSocket?: (word: string, count: number) => void;
  onEndTurnSocket?: () => void;
}

export function CodenamesBoardView({
  gameState,
  onUpdateGameState,
  onNewGame,
  onReturnToHub,
  roomCode,
  isTvHost = false,
  players = [],
  onRevealCardSocket,
  onGiveClueSocket,
  onEndTurnSocket,
}: CodenamesBoardViewProps) {
  const [isSpymasterMode, setIsSpymasterMode] = useState(false);
  const [clueModalOpen, setClueModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const {
    board,
    activeTeam,
    currentClue,
    guessesRemaining,
    redRemaining,
    blueRemaining,
    clues,
    winner,
    winReason,
    phase,
  } = gameState;

  const isRed = activeTeam === 'red';
  const joinUrl = roomCode ? `${window.location.origin}/?room=${roomCode}` : '';

  // Generate QR Code if roomCode is available
  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        margin: 1,
        width: 256,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [joinUrl]);

  // Handle Card Click (Supports both local state and multiplayer socket dispatch)
  const handleCardClick = (card: CodenamesCard) => {
    if (winner || card.revealed) return;

    if (onRevealCardSocket) {
      // Multiplayer mode: broadcast through socket
      onRevealCardSocket(card.id);
      return;
    }

    if (!onUpdateGameState) return;

    // Local Pass & Play Mode:
    const updatedBoard = board.map((c) =>
      c.id === card.id ? { ...c, revealed: true, revealedBy: activeTeam } : c
    );

    const newRedRemaining = updatedBoard.filter((c) => c.type === 'red' && !c.revealed).length;
    const newBlueRemaining = updatedBoard.filter((c) => c.type === 'blue' && !c.revealed).length;

    // Assassin Triggered!
    if (card.type === 'assassin') {
      playAssassinSound();
      const otherTeam: CodenamesTeam = activeTeam === 'red' ? 'blue' : 'red';
      onUpdateGameState((prev) => ({
        ...prev,
        board: updatedBoard,
        redRemaining: newRedRemaining,
        blueRemaining: newBlueRemaining,
        winner: otherTeam,
        winReason: 'assassin_triggered',
        phase: 'GAME_OVER',
        assassinCardId: card.id,
      }));
      return;
    }

    // Red Win
    if (card.type === 'red' && newRedRemaining === 0) {
      onUpdateGameState((prev) => ({
        ...prev,
        board: updatedBoard,
        redRemaining: 0,
        blueRemaining: newBlueRemaining,
        winner: 'red',
        winReason: 'all_agents_found',
        phase: 'GAME_OVER',
      }));
      return;
    }

    // Blue Win
    if (card.type === 'blue' && newBlueRemaining === 0) {
      onUpdateGameState((prev) => ({
        ...prev,
        board: updatedBoard,
        redRemaining: newRedRemaining,
        blueRemaining: 0,
        winner: 'blue',
        winReason: 'all_agents_found',
        phase: 'GAME_OVER',
      }));
      return;
    }

    // Correct Team card
    if (card.type === activeTeam) {
      playAgentFoundSound(activeTeam);
      const nextGuesses = guessesRemaining - 1;

      if (nextGuesses <= 0) {
        const nextTeam: CodenamesTeam = activeTeam === 'red' ? 'blue' : 'red';
        playTurnSound();
        onUpdateGameState((prev) => ({
          ...prev,
          board: updatedBoard,
          redRemaining: newRedRemaining,
          blueRemaining: newBlueRemaining,
          activeTeam: nextTeam,
          currentClue: null,
          guessesRemaining: 0,
        }));
      } else {
        onUpdateGameState((prev) => ({
          ...prev,
          board: updatedBoard,
          redRemaining: newRedRemaining,
          blueRemaining: newBlueRemaining,
          guessesRemaining: nextGuesses,
        }));
      }
    }
    // Enemy team card
    else if (card.type === (activeTeam === 'red' ? 'blue' : 'red')) {
      playEnemyAgentSound();
      const nextTeam: CodenamesTeam = activeTeam === 'red' ? 'blue' : 'red';
      onUpdateGameState((prev) => ({
        ...prev,
        board: updatedBoard,
        redRemaining: newRedRemaining,
        blueRemaining: newBlueRemaining,
        activeTeam: nextTeam,
        currentClue: null,
        guessesRemaining: 0,
      }));
    }
    // Civilian card
    else {
      playNeutralFoundSound();
      const nextTeam: CodenamesTeam = activeTeam === 'red' ? 'blue' : 'red';
      onUpdateGameState((prev) => ({
        ...prev,
        board: updatedBoard,
        redRemaining: newRedRemaining,
        blueRemaining: newBlueRemaining,
        activeTeam: nextTeam,
        currentClue: null,
        guessesRemaining: 0,
      }));
    }
  };

  // Submit Spymaster Clue
  const handleClueSubmit = (word: string, count: number) => {
    if (onGiveClueSocket) {
      onGiveClueSocket(word, count);
      return;
    }

    if (!onUpdateGameState) return;
    const newClue: CodenamesClue = {
      id: `clue-${Date.now()}`,
      team: activeTeam,
      word,
      count,
      timestamp: Date.now(),
    };

    onUpdateGameState((prev) => ({
      ...prev,
      currentClue: newClue,
      clues: [newClue, ...prev.clues],
      guessesRemaining: count + 1,
    }));
  };

  // End turn manually by operatives
  const handleEndTurn = () => {
    playClickSound();
    if (onEndTurnSocket) {
      onEndTurnSocket();
      return;
    }

    if (!onUpdateGameState) return;
    const nextTeam: CodenamesTeam = activeTeam === 'red' ? 'blue' : 'red';
    playTurnSound();
    onUpdateGameState((prev) => ({
      ...prev,
      activeTeam: nextTeam,
      currentClue: null,
      guessesRemaining: 0,
    }));
  };

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  return (
    <div
      id="codenames-board-view"
      className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-5 space-y-4 animate-fade-in text-slate-900"
    >
      {/* TV Host Top Announcement Header (if online room) */}
      {roomCode && (
        <div className="bg-slate-900 text-white rounded-3xl p-3 sm:p-4 px-5 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center text-lg font-black shadow-md">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>{t('TV / Ana Ekran Canlı Yayını')}</span>
                <span>•</span>
                <span className="text-emerald-400 font-black">{t('● CANLI')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold">{t('Oda Kodu:')}</span>
                <span className="font-mono text-lg font-black tracking-widest text-amber-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {roomCode}
                </span>
              </div>
            </div>
          </div>

          {/* Connected Squad Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound();
                setQrModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl border border-indigo-400 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>{t('Telefondan Katıl (QR Kod)')}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
              title={t('Bağlantıyı Kopyala')}
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Top Game Bar: Team Scores & Active Status */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Red Team Counter & Squad */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
            isRed
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
              : 'bg-slate-50 border-slate-200 opacity-80'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>{t('Kırmızı Takım')}</span>
              {redPlayers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded-full font-bold">
                  {redPlayers.length} Oyuncu
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {redRemaining}{' '}
              <span className="text-xs font-bold text-slate-400">{t('Kalan Ajan')}</span>
            </div>
          </div>
        </div>

        {/* Center: Active Turn & Clue Banner */}
        <div className="flex-1 text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 border border-slate-200">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                isRed ? 'bg-rose-600' : 'bg-blue-600'
              }`}
            />
            <span className={isRed ? 'text-rose-700' : 'text-blue-700'}>
              {isRed ? t('🔴 Kırmızı Takım Sırası') : t('🔵 Mavi Takım Sırası')}
            </span>
          </div>

          {/* Current Clue Display */}
          {currentClue ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 animate-scale-in">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                <span className="text-xs font-bold text-indigo-700 mr-1">{t('İPUCU:')}</span>
                <span className="text-base sm:text-xl font-black text-indigo-950 tracking-wider">
                  "{currentClue.word}" ({currentClue.count})
                </span>
              </div>
              <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-black">
                {guessesRemaining} Tahmin Hakkı
              </div>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500 italic pt-1">
              {isTvHost
                ? 'Liderin telefonundan ipucu girmesi bekleniyor...'
                : t('Ajan Lideri henüz ipucu vermedi.')}
            </div>
          )}
        </div>

        {/* Right: Blue Team Counter & Squad */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
            !isRed
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/30'
              : 'bg-slate-50 border-slate-200 opacity-80'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>{t('Mavi Takım')}</span>
              {bluePlayers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-sky-200 text-sky-900 rounded-full font-bold">
                  {bluePlayers.length} Oyuncu
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {blueRemaining}{' '}
              <span className="text-xs font-bold text-slate-400">{t('Kalan Ajan')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Left tools: Spymaster Peak Toggle & Rules */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-spymaster-mode"
            onClick={() => {
              playClickSound();
              setIsSpymasterMode((prev) => !prev);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
              isSpymasterMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            {isSpymasterMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>
              {isSpymasterMode ? t('Lider Haritasını Gizle') : t('👁️ Lider Haritası (Spymaster)')}
            </span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setRulesModalOpen(true);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200 flex items-center gap-1 text-xs font-bold"
            title={t('Nasıl Oynanır?')}
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>{t('Nasıl Oynanır?')}</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setHistoryOpen((prev) => !prev);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
              historyOpen
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>İpucu Geçmişi ({clues.length})</span>
          </button>
        </div>

        {/* Right tools: Give Clue or Pass Turn */}
        <div className="flex items-center gap-2">
          {!currentClue ? (
            <button
              id="btn-give-clue"
              onClick={() => {
                playClickSound();
                setClueModalOpen(true);
              }}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isRed
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>{t('İpucu Ver (Lider)')}</span>
            </button>
          ) : (
            <button
              id="btn-end-turn"
              onClick={handleEndTurn}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm border border-slate-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>{t('Tahmini Bitir / Sırayı Devret')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              playClickSound();
              onNewGame();
            }}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title={t('Yeniden Başlat')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clue History Drawer */}
      {historyOpen && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-fade-in space-y-2">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-600" />
            <span>{t('Tur İpuçları Günlüğü')}</span>
          </div>
          {clues.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-1">{t('Henüz ipucu verilmedi.')}</div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {clues.map((clue) => (
                <div
                  key={clue.id}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                    clue.team === 'red'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <span>{clue.team === 'red' ? '🔴' : '🔵'}</span>
                  <span className="font-black">"{clue.word}"</span>
                  <span className="opacity-70">({clue.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy Alert when Spymaster Mode is ON */}
      {isSpymasterMode && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{t('Lider Modu Aktif:')}</strong>  {t('Kartların gizli renkleri ekranda görüntüleniyor.')}</span>
          </div>
          <button
            onClick={() => setIsSpymasterMode(false)}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg transition-colors cursor-pointer"
          >
            {t('Kapat')}</button>
        </div>
      )}

      {/* 5x5 CARDS BOARD GRID IN AUTHENTIC TABLETOP BOARD STYLE */}
      <div
        id="codenames-grid-container"
        className="tabletop-wood-frame tabletop-felt-slate p-3 sm:p-5 rounded-3xl shadow-2xl border-4 border-amber-900/60"
      >
        <div className="grid grid-cols-5 gap-2 sm:gap-3.5">
          {board.map((card) => (
            <CodenamesCardItem
              key={card.id}
              card={card}
              isSpymasterView={isSpymasterMode}
              onSelectCard={handleCardClick}
              disabled={Boolean(winner)}
              isCurrentTurnTeam={isRed}
            />
          ))}
        </div>
      </div>

      {/* Spymaster Clue Modal */}
      <CodenamesClueInputModal
        isOpen={clueModalOpen}
        onClose={() => setClueModalOpen(false)}
        activeTeam={activeTeam}
        board={board}
        onSubmitClue={handleClueSubmit}
      />

      {/* Game Over / Victory Modal */}
      {winner && winReason && (
        <CodenamesGameOverModal
          winner={winner}
          winReason={winReason}
          board={board}
          clues={clues}
          onPlayAgain={onNewGame}
          onReturnToHub={onReturnToHub}
        />
      )}

      {/* Rules Modal */}
      <CodenamesRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {/* QR Code TV Screen Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                {t('TELEFONDAN OYNA')}</span>
              <h3 className="text-xl font-black text-slate-900">{t('QR Kodu Telefonla Tara')}</h3>
              <p className="text-xs text-slate-500">
                {t('Kameranızı açarak bu kodu taratın ve takımınızı/rolünüzü seçin!')}</p>
            </div>

            {qrDataUrl && (
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner inline-block mx-auto">
                <img src={qrDataUrl} alt={t('Katılma QR Kodu')} className="w-52 h-52 rounded-xl" />
              </div>
            )}

            <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-700 font-mono font-bold tracking-wider">
              {t('ODA KODU:')} <span className="text-indigo-600 font-black text-sm">{roomCode}</span>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-3 bg-slate-900 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {t('Tamam, Kapat')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
