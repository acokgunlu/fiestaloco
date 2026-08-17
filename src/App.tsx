/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, Stroke, WordPair, GamePhase, GameSettings, RoundResult } from './types';
import { CodenamesGameState, CodenamesSettings, CodenamesTeam } from './types/codenames';
import { PartyGameType } from './types/partyGames';
import { DEFAULT_PLAYER_PALETTE, getRandomWordPair } from './data/wordPacks';
import { generateCodenamesBoard } from './data/codenamesWords';
import { HeaderBar } from './components/HeaderBar';
import { RulesModal } from './components/RulesModal';
import { MainArcadeHub } from './components/MainArcadeHub';
import { LobbyView } from './components/LobbyView';
import { WordRevealView } from './components/WordRevealView';
import { DrawingView } from './components/DrawingView';
import { DiscussionView } from './components/DiscussionView';
import { VotingView } from './components/VotingView';
import { ImposterGuessView } from './components/ImposterGuessView';
import { ResultsView } from './components/ResultsView';
import { OnlineRoomPicker } from './components/OnlineRoomPicker';
import { ObserverDisplayView } from './components/ObserverDisplayView';
import { PlayerControllerView } from './components/PlayerControllerView';
import { CodenamesOnlinePicker } from './components/codenames/CodenamesOnlinePicker';
import { CodenamesMobileControllerView } from './components/codenames/CodenamesMobileControllerView';
import { CodenamesLobbyView } from './components/codenames/CodenamesLobbyView';
import { CodenamesBoardView } from './components/codenames/CodenamesBoardView';
import { CodenamesRulesModal } from './components/codenames/CodenamesRulesModal';
import { BluffTriviaGame } from './components/party/BluffTriviaGame';
import { WordBombGame } from './components/party/WordBombGame';
import { PicanteVerdictGame } from './components/party/PicanteVerdictGame';
import { TriviaPursuitGame } from './components/party/TriviaPursuitGame';
import { QuiplashGame } from './components/party/QuiplashGame';
import { UnifiedLeaderboardModal } from './components/leaderboard/UnifiedLeaderboardModal';
import { useSocketRoom } from './utils/useSocketRoom';
import { useCodenamesSocket } from './utils/useCodenamesSocket';
import { isSoundEnabled, toggleSound } from './utils/audio';
import { useAppTheme } from './utils/theme';

export default function App() {
  // Theme handling (Light / Dark mode)
  const { theme, toggleTheme } = useAppTheme();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Active Game Module: 'arcade_hub' | 'imposter' | 'codenames' | 'bluff' | 'bomb' | 'verdict'
  const [activeModule, setActiveModule] = useState<'arcade_hub' | PartyGameType>(
    'arcade_hub'
  );

  // Socket multiplayer hook for Imposter Line
  const {
    isConnected,
    roomState,
    liveStroke,
    clientRole,
    myPlayerId,
    errorMessage,
    createRoom,
    joinRoom,
    startGame,
    startDrawing,
    sendLiveStrokePoint,
    commitStroke,
    skipTurn,
    proceedToVoting,
    submitVote,
    forceTallyVotes,
    submitImposterGuess,
    nextRound,
    backToLobby,
    addBot,
    removePlayer,
    updateSettings,
    updateProfile,
    leaveRoom,
  } = useSocketRoom();

  // Socket multiplayer hook for Codenames (Gizli Ajanlar)
  const {
    isConnected: isCodenamesConnected,
    roomCode: codenamesRoomCode,
    clientRole: codenamesClientRole,
    myPlayer: codenamesMyPlayer,
    gameState: codenamesSocketGameState,
    players: codenamesPlayers,
    errorMessage: codenamesErrorMessage,
    createRoom: createCodenamesTvRoom,
    joinRoom: joinCodenamesMobileRoom,
    updatePlayerRole: updateCodenamesPlayerRole,
    giveClue: giveCodenamesClue,
    revealCard: revealCodenamesCard,
    endTurn: endCodenamesTurn,
    newGame: newCodenamesGame,
    leaveRoom: leaveCodenamesRoom,
  } = useCodenamesSocket();

  // Mode: 'online' | 'local_pass_play' | 'picker'
  const [appMode, setAppMode] = useState<'picker' | 'local_pass_play'>('picker');
  const [codenamesAppMode, setCodenamesAppMode] = useState<'picker' | 'local_pass_play'>('picker');

  // --- CODENAMES STATE ---
  const [codenamesState, setCodenamesState] = useState<CodenamesGameState>({
    board: [],
    activeTeam: 'red',
    startingTeam: 'red',
    phase: 'LOBBY',
    clues: [],
    currentClue: null,
    guessesRemaining: 0,
    winner: null,
    winReason: null,
    redRemaining: 9,
    blueRemaining: 8,
    timerSeconds: 0,
    isTimerRunning: false,
    settings: {
      startingTeam: 'random',
      category: 'all',
      timerSeconds: 0,
      aiSpymaster: false,
    },
    redScore: 0,
    blueScore: 0,
    assassinCardId: null,
  });

  const [codenamesRulesOpen, setCodenamesRulesOpen] = useState(false);

  const startCodenamesGame = (settings: CodenamesSettings) => {
    let starting: CodenamesTeam =
      settings.startingTeam === 'random'
        ? Math.random() > 0.5
          ? 'red'
          : 'blue'
        : settings.startingTeam;

    const newBoard = generateCodenamesBoard(starting, settings.category);
    const redCount = newBoard.filter((c) => c.type === 'red').length;
    const blueCount = newBoard.filter((c) => c.type === 'blue').length;

    setCodenamesState({
      board: newBoard,
      activeTeam: starting,
      startingTeam: starting,
      phase: 'CLUE_PHASE',
      clues: [],
      currentClue: null,
      guessesRemaining: 0,
      winner: null,
      winReason: null,
      redRemaining: redCount,
      blueRemaining: blueCount,
      timerSeconds: settings.timerSeconds,
      isTimerRunning: settings.timerSeconds > 0,
      settings,
      redScore: 0,
      blueScore: 0,
      assassinCardId: null,
    });
  };

  const resetCodenamesRound = () => {
    startCodenamesGame(codenamesState.settings);
  };

  // --- LOCAL IMPOSTER PASS & PLAY STATE ---
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'p-1',
      name: 'Player 1',
      color: DEFAULT_PLAYER_PALETTE[0].color,
      colorName: DEFAULT_PLAYER_PALETTE[0].name,
      avatar: DEFAULT_PLAYER_PALETTE[0].avatar,
      isImposter: false,
      score: 0,
    },
    {
      id: 'p-2',
      name: 'Player 2',
      color: DEFAULT_PLAYER_PALETTE[1].color,
      colorName: DEFAULT_PLAYER_PALETTE[1].name,
      avatar: DEFAULT_PLAYER_PALETTE[1].avatar,
      isImposter: false,
      score: 0,
    },
    {
      id: 'p-3',
      name: 'Player 3',
      color: DEFAULT_PLAYER_PALETTE[2].color,
      colorName: DEFAULT_PLAYER_PALETTE[2].name,
      avatar: DEFAULT_PLAYER_PALETTE[2].avatar,
      isImposter: false,
      score: 0,
    },
    {
      id: 'p-4',
      name: 'Player 4',
      color: DEFAULT_PLAYER_PALETTE[3].color,
      colorName: DEFAULT_PLAYER_PALETTE[3].name,
      avatar: DEFAULT_PLAYER_PALETTE[3].avatar,
      isImposter: false,
      score: 0,
    },
    {
      id: 'p-5',
      name: 'Player 5',
      color: DEFAULT_PLAYER_PALETTE[4].color,
      colorName: DEFAULT_PLAYER_PALETTE[4].name,
      avatar: DEFAULT_PLAYER_PALETTE[4].avatar,
      isImposter: false,
      score: 0,
    },
  ]);

  const [settings, setSettings] = useState<GameSettings>({
    roundsPerPlayer: 2,
    drawTimeLimitSec: 25,
    discussionTimeSec: 60,
    gameMode: 'different_word',
    category: 'all',
  });

  const [gamePhase, setGamePhase] = useState<GamePhase>('LOBBY');
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [currentWordPair, setCurrentWordPair] = useState<WordPair>(getRandomWordPair());
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  // UI helpers
  const [rulesOpen, setRulesOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(true);

  // Check URL query parameters for ?room=CODE or ?game=verdict / codenames
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const gameParam = params.get('game');

    if (gameParam === 'verdict') {
      setActiveModule('verdict');
    } else if (gameParam === 'quiplash') {
      setActiveModule('quiplash');
    } else if (gameParam === 'codenames') {
      setActiveModule('codenames');
    } else if (gameParam === 'bomb') {
      setActiveModule('bomb');
    } else if (gameParam === 'bluff') {
      setActiveModule('bluff');
    } else if (gameParam === 'trivia' || gameParam === 'trivia_pursuit') {
      setActiveModule('trivia_pursuit');
    } else if (roomParam && !roomState) {
      setActiveModule('imposter');
      setAppMode('picker');
    }
  }, [roomState]);


  // Local Imposter game lifecycle handlers
  const startNewGameRound = (customPair?: WordPair) => {
    const pair = customPair || getRandomWordPair(settings.category);
    setCurrentWordPair(pair);
    setStrokes([]);
    setRoundResult(null);

    const imposterIdx = Math.floor(Math.random() * players.length);
    const updatedPlayers = players.map((p, idx) => ({
      ...p,
      isImposter: idx === imposterIdx,
    }));
    setPlayers(updatedPlayers);
    setGamePhase('WORD_REVEAL');
  };

  const handleAddStroke = (newStroke: Stroke) => {
    setStrokes((prev) => [...prev, newStroke]);
  };

  const handleDrawingFinished = () => {
    setGamePhase('DISCUSSION');
  };

  const handleProceedToVoting = () => {
    setGamePhase('VOTING');
  };

  const handleVotesComplete = (partialResult: Partial<RoundResult>) => {
    const imposter = players.find((p) => p.isImposter) || players[0];

    if (partialResult.wasImposterCaught) {
      const baseResult: RoundResult = {
        votedPlayerId: partialResult.votedPlayerId || null,
        wasImposterCaught: true,
        crewWord: currentWordPair.crewWord,
        imposterWord: currentWordPair.imposterWord,
        imposterId: imposter.id,
        crewWinners: players.filter((p) => !p.isImposter).map((p) => p.id),
        imposterWon: false,
        pointsAwarded: {},
      };
      setRoundResult(baseResult);
      setGamePhase('IMPOSTER_GUESS');
    } else {
      const pointsMap: Record<string, number> = {};
      players.forEach((p) => {
        pointsMap[p.id] = p.isImposter ? 100 : 0;
      });

      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          score: p.score + (pointsMap[p.id] || 0),
        }))
      );

      const finalResult: RoundResult = {
        votedPlayerId: partialResult.votedPlayerId || null,
        wasImposterCaught: false,
        crewWord: currentWordPair.crewWord,
        imposterWord: currentWordPair.imposterWord,
        imposterId: imposter.id,
        crewWinners: [],
        imposterWon: true,
        pointsAwarded: pointsMap,
      };
      setRoundResult(finalResult);
      setGamePhase('RESULTS');
    }
  };

  const handleImposterShowdownComplete = (guessedCorrectly: boolean, guessWord: string) => {
    const imposter = players.find((p) => p.isImposter) || players[0];
    const pointsMap: Record<string, number> = {};

    if (guessedCorrectly) {
      players.forEach((p) => {
        pointsMap[p.id] = p.isImposter ? 120 : 0;
      });
    } else {
      players.forEach((p) => {
        pointsMap[p.id] = p.isImposter ? 0 : 100;
      });
    }

    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        score: p.score + (pointsMap[p.id] || 0),
      }))
    );

    const finalResult: RoundResult = {
      votedPlayerId: roundResult?.votedPlayerId || null,
      wasImposterCaught: true,
      imposterGuessedCorrectly: guessedCorrectly,
      imposterGuessWord: guessWord,
      crewWord: currentWordPair.crewWord,
      imposterWord: currentWordPair.imposterWord,
      imposterId: imposter.id,
      crewWinners: guessedCorrectly ? [] : players.filter((p) => !p.isImposter).map((p) => p.id),
      imposterWon: guessedCorrectly,
      pointsAwarded: pointsMap,
    };

    setRoundResult(finalResult);
    setGamePhase('RESULTS');
  };

  const handleNextRound = () => {
    setCurrentRoundNumber((prev) => prev + 1);
    setPlayers((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
    startNewGameRound();
  };

  const handleReturnToLobby = () => {
    setGamePhase('LOBBY');
  };

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundActive(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/80 via-slate-50 to-slate-100 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 transition-colors duration-200">
      {/* Top Header with Module Indicator & Quick Switcher */}
      <HeaderBar
        activeModule={activeModule === 'arcade_hub' ? 'imposter' : activeModule}
        phase={activeModule === 'imposter' ? (roomState ? roomState.gamePhase : gamePhase) : 'LOBBY'}
        currentRound={roomState ? roomState.currentRoundNumber : currentRoundNumber}
        maxRounds={5}
        onOpenRules={() => {
          if (activeModule === 'codenames') {
            setCodenamesRulesOpen(true);
          } else {
            setRulesOpen(true);
          }
        }}
        onRestart={() => {
          if (activeModule === 'imposter') {
            if (roomState) {
              leaveRoom();
            } else {
              setAppMode('picker');
              handleReturnToLobby();
            }
          } else if (activeModule === 'codenames') {
            setCodenamesState((prev) => ({ ...prev, phase: 'LOBBY' }));
          }
        }}
        onSelectGameHub={() => setActiveModule('arcade_hub')}
        soundActive={soundActive}
        onToggleSound={handleToggleSound}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* Main Screen Router */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {/* 1. MAIN ARCADE HUB (GAME SELECTOR) */}
        {activeModule === 'arcade_hub' && (
          <MainArcadeHub
            onSelectGame={(gameId) => setActiveModule(gameId)}
            onOpenRules={() => setRulesOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}

        {/* 2. CODENAMES (GİZLİ AJANLAR) MODULE */}
        {activeModule === 'codenames' && (
          <>
            {/* ONLINE TV HOST OBSERVER (BIG SCREEN / TV) */}
            {codenamesSocketGameState && codenamesClientRole === 'observer' && (
              <CodenamesBoardView
                gameState={codenamesSocketGameState}
                isTvHost={true}
                roomCode={codenamesRoomCode}
                players={codenamesPlayers}
                onRevealCardSocket={revealCodenamesCard}
                onGiveClueSocket={giveCodenamesClue}
                onEndTurnSocket={endCodenamesTurn}
                onNewGame={newCodenamesGame}
                onReturnToHub={leaveCodenamesRoom}
              />
            )}

            {/* ONLINE MOBILE CONTROLLER (PLAYER'S PHONE) */}
            {codenamesSocketGameState && codenamesClientRole === 'player' && codenamesMyPlayer && (
              <CodenamesMobileControllerView
                roomCode={codenamesRoomCode || ''}
                myPlayer={codenamesMyPlayer}
                gameState={codenamesSocketGameState}
                players={codenamesPlayers}
                onGiveClue={giveCodenamesClue}
                onRevealCard={revealCodenamesCard}
                onEndTurn={endCodenamesTurn}
                onUpdateRole={updateCodenamesPlayerRole}
                onLeave={leaveCodenamesRoom}
                onOpenRules={() => setCodenamesRulesOpen(true)}
              />
            )}

            {/* CODENAMES ONLINE PICKER (TV HOST / PHONE JOIN / LOCAL SELECTION) */}
            {!codenamesSocketGameState && codenamesAppMode === 'picker' && (
              <CodenamesOnlinePicker
                onHostTvRoom={(settings) => createCodenamesTvRoom(settings)}
                onJoinMobileRoom={(code, name, team, role) =>
                  joinCodenamesMobileRoom(code, name, team, role)
                }
                onStartLocalPassAndPlay={(settings) => {
                  setCodenamesAppMode('local_pass_play');
                  startCodenamesGame(settings);
                }}
                onOpenRules={() => setCodenamesRulesOpen(true)}
                onBackToHub={() => setActiveModule('arcade_hub')}
                errorMessage={codenamesErrorMessage}
              />
            )}

            {/* LOCAL SINGLE-DEVICE PASS & PLAY BOARD */}
            {!codenamesSocketGameState && codenamesAppMode === 'local_pass_play' && (
              <CodenamesBoardView
                gameState={codenamesState}
                onUpdateGameState={setCodenamesState}
                onNewGame={resetCodenamesRound}
                onReturnToHub={() => setCodenamesAppMode('picker')}
              />
            )}
          </>
        )}

        {/* 3. IMPOSTER LINE (SAHTEKÂR RESSAM) MODULE */}
        {activeModule === 'imposter' && (
          <>
            {/* ONLINE MULTI-DEVICE: OBSERVER (BIG SCREEN / TV) */}
            {roomState && clientRole === 'observer' && (
              <ObserverDisplayView
                roomState={roomState}
                liveStroke={liveStroke}
                onStartGame={startGame}
                onStartDrawing={startDrawing}
                onProceedToVoting={proceedToVoting}
                onForceTallyVotes={forceTallyVotes}
                onNextRound={nextRound}
                onBackToLobby={backToLobby}
                onAddBot={addBot}
                onRemovePlayer={removePlayer}
                onUpdateSettings={updateSettings}
                onLeaveRoom={leaveRoom}
              />
            )}

            {/* ONLINE MULTI-DEVICE: PLAYER CONTROLLER (MOBILE PHONE) */}
            {roomState && clientRole === 'player' && myPlayerId && (
              <PlayerControllerView
                roomState={roomState}
                myPlayerId={myPlayerId}
                liveStroke={liveStroke}
                onSendLivePoint={sendLiveStrokePoint}
                onCommitStroke={commitStroke}
                onSkipTurn={skipTurn}
                onSubmitVote={submitVote}
                onSubmitImposterGuess={submitImposterGuess}
                onUpdateProfile={updateProfile}
                onLeaveRoom={leaveRoom}
              />
            )}

            {/* MODE PICKER (LANDING / JOIN / HOST SELECTION) */}
            {!roomState && appMode === 'picker' && (
              <div className="w-full max-w-xl space-y-4">
                <div className="flex justify-between items-center px-1">
                  <button
                    onClick={() => setActiveModule('arcade_hub')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>← Parti Kulübü Oyun Menüsü</span>
                  </button>
                </div>
                <OnlineRoomPicker
                  errorMessage={errorMessage}
                  onHostObserver={(roomSettings, hostName) =>
                    createRoom(roomSettings, hostName)
                  }
                  onJoinPlayer={(roomCode, name, color, avatar, colorName) =>
                    joinRoom(roomCode, 'player', name, color, avatar)
                  }
                  onStartPassAndPlay={() => setAppMode('local_pass_play')}
                />
              </div>
            )}

            {/* LOCAL SINGLE-DEVICE PASS & PLAY FLOW */}
            {!roomState && appMode === 'local_pass_play' && (
              <>
                {gamePhase === 'LOBBY' && (
                  <LobbyView
                    key="local-lobby"
                    players={players}
                    onUpdatePlayers={setPlayers}
                    settings={settings}
                    onUpdateSettings={setSettings}
                    onStartGame={startNewGameRound}
                  />
                )}

                {gamePhase === 'WORD_REVEAL' && (
                  <WordRevealView
                    key={`local-word-reveal-${currentRoundNumber}`}
                    players={players}
                    wordPair={currentWordPair}
                    gameMode={settings.gameMode}
                    onComplete={() => setGamePhase('DRAWING')}
                  />
                )}

                {gamePhase === 'DRAWING' && (
                  <DrawingView
                    key={`local-drawing-${currentRoundNumber}`}
                    players={players}
                    wordPair={currentWordPair}
                    settings={settings}
                    strokes={strokes}
                    onAddStroke={handleAddStroke}
                    onDrawingFinished={handleDrawingFinished}
                  />
                )}

                {gamePhase === 'DISCUSSION' && (
                  <DiscussionView
                    key={`local-discussion-${currentRoundNumber}`}
                    players={players}
                    strokes={strokes}
                    wordPair={currentWordPair}
                    settings={settings}
                    onProceedToVoting={handleProceedToVoting}
                  />
                )}

                {gamePhase === 'VOTING' && (
                  <VotingView
                    key={`local-voting-${currentRoundNumber}`}
                    players={players}
                    wordPair={currentWordPair}
                    onVotesComplete={handleVotesComplete}
                  />
                )}

                {gamePhase === 'IMPOSTER_GUESS' && roundResult && (
                  <ImposterGuessView
                    key={`local-imposter-guess-${currentRoundNumber}`}
                    imposter={players.find((p) => p.isImposter) || players[0]}
                    players={players}
                    strokes={strokes}
                    roundResult={roundResult}
                    onShowdownComplete={handleImposterShowdownComplete}
                  />
                )}

                {gamePhase === 'RESULTS' && roundResult && (
                  <ResultsView
                    key={`local-results-${currentRoundNumber}`}
                    players={players}
                    strokes={strokes}
                    roundResult={roundResult}
                    currentRoundNumber={currentRoundNumber}
                    onNextRound={handleNextRound}
                    onBackToLobby={handleReturnToLobby}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* 4. YALAN USTASI (BLUFF TRIVIA) MODULE */}
        {activeModule === 'bluff' && (
          <BluffTriviaGame onBackToHub={() => setActiveModule('arcade_hub')} />
        )}

        {/* 5. SAATLİ BOMBA (WORD BOMB) MODULE */}
        {activeModule === 'bomb' && (
          <WordBombGame onBackToHub={() => setActiveModule('arcade_hub')} />
        )}

        {/* 6. KİM YAPAR? / MAHKEME (PICANTE VERDICT) MODULE */}
        {activeModule === 'verdict' && (
          <PicanteVerdictGame onBackToHub={() => setActiveModule('arcade_hub')} />
        )}

        {/* 7. TRIVIA PURSUIT (BİLGİ ÇARKI & 6 ROZET) MODULE */}
        {activeModule === 'trivia_pursuit' && (
          <TriviaPursuitGame onBackToHub={() => setActiveModule('arcade_hub')} />
        )}

        {/* 8. QUIPLASH (MİZAH & KAPIŞMA) MODULE */}
        {activeModule === 'quiplash' && (
          <QuiplashGame onBackToHub={() => setActiveModule('arcade_hub')} />
        )}
      </main>

      {/* Rules & Leaderboard Modals */}
      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
      <CodenamesRulesModal
        isOpen={codenamesRulesOpen}
        onClose={() => setCodenamesRulesOpen(false)}
      />
      <UnifiedLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
}
