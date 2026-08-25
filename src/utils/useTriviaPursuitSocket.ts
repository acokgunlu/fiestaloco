import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TriviaPursuitGameState,
  TriviaPursuitPlayer,
  TriviaPursuitSettings,
  TriviaCategory,
  TriviaBoardPosition,
} from '../types/triviaPursuit';
import { playClickSound, playTurnSound, playFanfareSound } from './audio';
import { recordMatchResult } from './leaderboardStore';
import { getApiUrl, getWsUrl } from './serverUrl';

import { t } from '../i18n';
import { getLang } from '../i18n';
export function useTriviaPursuitSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myPlayer, setMyPlayer] = useState<TriviaPursuitPlayer | null>(null);
  const [gameState, setGameState] = useState<TriviaPursuitGameState | null>(null);
  const [players, setPlayers] = useState<TriviaPursuitPlayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myAnswerSubmitted, setMyAnswerSubmitted] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const myPlayerRef = useRef<TriviaPursuitPlayer | null>(null);
  const recordedMatchRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    playerId?: string;
    playerName?: string;
    avatar?: string;
    color?: string;
    colorName?: string;
  }>({});

  useEffect(() => {
    myPlayerRef.current = myPlayer;
  }, [myPlayer]);

  const connect = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);

        // Reconnect session if active
        if (sessionRef.current.roomCode) {
          if (sessionRef.current.role === 'observer') {
            ws.send(
              JSON.stringify({
                type: 'trivia:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'observer',
              })
            );
          } else if (sessionRef.current.playerId && sessionRef.current.playerName) {
            ws.send(
              JSON.stringify({
                type: 'trivia:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'player',
                playerId: sessionRef.current.playerId,
                playerName: sessionRef.current.playerName,
                avatar: sessionRef.current.avatar,
                color: sessionRef.current.color,
                colorName: sessionRef.current.colorName,
              })
            );
          }
        }

        // Start ping heartbeat every 15s
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);

        // Auto-reconnect after 1.5s if active session
        if (sessionRef.current.roomCode) {
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = window.setTimeout(() => {
            connect();
          }, 1500);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type } = msg;

          if (type === 'heartbeat' || type === 'pong') return;

          if (type === 'error') {
            setErrorMessage(msg.message || t('Bir hata oluştu'));
            return;
          }

          if (type === 'trivia:room_created') {
            setRoomCode(msg.roomCode);
            setClientRole('observer');
            if (msg.gameState) setGameState(msg.gameState);
            if (msg.players) setPlayers(msg.players);
            sessionRef.current = { roomCode: msg.roomCode, role: 'observer' };
            playTurnSound();
          } else if (type === 'trivia:room_joined') {
            setRoomCode(msg.roomCode);
            setClientRole(msg.role);
            if (msg.gameState) setGameState(msg.gameState);
            if (msg.players) setPlayers(msg.players);

            if (msg.role === 'player' && msg.player) {
              setMyPlayerId(msg.player.id);
              setMyPlayer(msg.player);
              sessionRef.current = {
                roomCode: msg.roomCode,
                role: 'player',
                playerId: msg.player.id,
                playerName: msg.player.name,
                avatar: msg.player.avatar,
                color: msg.player.color,
                colorName: msg.player.colorName,
              };
              playClickSound();
            } else {
              sessionRef.current = { roomCode: msg.roomCode, role: 'observer' };
            }
          } else if (
            // Sunucu durum yayinini farkli event adlariyla yapabiliyor.
            // BEYAZ LISTE YERINE: gameState tasiyan HER trivia mesajini durum
            // guncellemesi say. Onceden `trivia:die_rolled` ve
            // `trivia:roll_again` listede olmadigi icin sessizce dusuyordu ve
            // zar atilinca ekran hic guncellenmiyordu.
            typeof type === 'string' &&
            type.startsWith('trivia:') &&
            msg.gameState
          ) {
            if (msg.gameState) {
              setGameState(msg.gameState);

              // Clear local answered state when a new question starts
              if (msg.gameState.phase === 'QUESTION_ACTIVE' && !msg.myAnswer) {
                setMyAnswerSubmitted(null);
              } else if (msg.myAnswer) {
                setMyAnswerSubmitted(msg.myAnswer);
              }

              // Record match result on Game Over once
              if (
                msg.gameState.phase === 'GAME_OVER' &&
                msg.players &&
                msg.players.length > 0 &&
                recordedMatchRef.current !== msg.gameState.roomCode
              ) {
                recordedMatchRef.current = msg.gameState.roomCode;
                playFanfareSound();

                const winner = msg.players.find(
                  (p: TriviaPursuitPlayer) => p.id === msg.gameState.winnerPlayerId
                ) || msg.players[0];

                recordMatchResult({
                  gameType: 'trivia_pursuit',
                  gameTitle: 'Trivia Pursuit (Bilgi Çarkı)',
                  gameIcon: '🧠',
                  roomCode: msg.gameState.roomCode,
                  winnerName: winner?.name,
                  winnerAvatar: winner?.avatar,
                  winnerScore: winner?.score,
                  details: `${winner?.wedges?.length || 6} Rozet Toplandı!`,
                  players: msg.players.map((p: TriviaPursuitPlayer) => ({
                    name: p.name,
                    avatar: p.avatar,
                    score: p.score,
                    isWinner: p.id === msg.gameState.winnerPlayerId,
                  })),
                });
              }
            }

            if (msg.players) {
              setPlayers(msg.players);
              if (myPlayerRef.current) {
                const updated = msg.players.find(
                  (p: TriviaPursuitPlayer) => p.id === myPlayerRef.current?.id
                );
                if (updated) setMyPlayer(updated);
              }
            }

            if (msg.myPlayer) {
              setMyPlayer(msg.myPlayer);
            }
          } else if (type === 'trivia:answer_confirmed') {
            setMyAnswerSubmitted(msg.answer);
          }
        } catch (e) {
          console.error('Trivia Pursuit message parse error:', e);
        }
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Robust send helper that queues until connected
  const send = useCallback(
    (payload: Record<string, any>) => {
      const dataStr = JSON.stringify(payload);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(dataStr);
        return;
      }

      connect();
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(dataStr);
          clearInterval(interval);
        } else if (attempts >= 30) {
          clearInterval(interval);
        }
      }, 100);
    },
    [connect]
  );

  // Actions
  const createRoom = useCallback(
    (settings?: Partial<TriviaPursuitSettings>) => {
      setErrorMessage(null);
      send({
        type: 'trivia:create_room', lang: getLang(),
        settings,
      });
    },
    [send]
  );

  const joinRoom = useCallback(
    (
      targetRoomCode: string,
      playerName: string,
      avatar?: string,
      color?: string,
      colorName?: string
    ) => {
      setErrorMessage(null);
      send({
        type: 'trivia:join_room',
        roomCode: targetRoomCode.toUpperCase().trim(),
        role: 'player',
        playerName: playerName.trim(),
        avatar,
        color,
        colorName,
      });
    },
    [send]
  );

  const startGame = useCallback(() => {
    send({ type: 'trivia:start_game' });
  }, [send]);

  const spinWheel = useCallback(() => {
    send({ type: 'trivia:spin_wheel' });
  }, [send]);

  /** Tahta modu: zar at (yalnizca sirasi gelen oyuncu veya TV/host). */
  const rollDie = useCallback(() => {
    send({ type: 'trivia:roll_die' });
  }, [send]);

  /** Tahta modu: zar sonrasi hedef kareyi sec. */
  const pickMove = useCallback(
    (to: TriviaBoardPosition) => {
      send({ type: 'trivia:pick_move', to });
    },
    [send]
  );

  const selectCategory = useCallback(
    (category: TriviaCategory) => {
      send({
        type: 'trivia:select_category',
        category,
      });
    },
    [send]
  );

  const submitAnswer = useCallback(
    (answer: string) => {
      setMyAnswerSubmitted(answer);
      send({
        type: 'trivia:submit_answer',
        answer,
      });
      playClickSound();
    },
    [send]
  );

  const nextRound = useCallback(() => {
    setMyAnswerSubmitted(null);
    send({ type: 'trivia:next_round' });
  }, [send]);

  const restartGame = useCallback(() => {
    setMyAnswerSubmitted(null);
    recordedMatchRef.current = null;
    send({ type: 'trivia:restart_game' });
  }, [send]);

  const generateAiQuestions = useCallback(
    async (category?: TriviaCategory) => {
      if (isGeneratingAi || !roomCode) return;
      setIsGeneratingAi(true);
      try {
        const res = await fetch(getApiUrl('/api/trivia-pursuit/generate-questions'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, count: 6, lang: getLang() }),
        });
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          send({
            type: 'trivia:add_questions',
            questions: data.questions,
          });
        }
      } catch (err) {
        console.error('Failed to generate AI questions:', err);
      } finally {
        setIsGeneratingAi(false);
      }
    },
    [isGeneratingAi, roomCode, send]
  );

  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    setRoomCode(null);
    setClientRole(null);
    setGameState(null);
    setPlayers([]);
    setMyPlayerId(null);
    setMyPlayer(null);
    setMyAnswerSubmitted(null);
  }, []);

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayerId,
    myPlayer,
    gameState,
    players,
    errorMessage,
    myAnswerSubmitted,
    isGeneratingAi,
    createRoom,
    joinRoom,
    startGame,
    spinWheel,
    rollDie,
    pickMove,
    selectCategory,
    submitAnswer,
    nextRound,
    restartGame,
    generateAiQuestions,
    leaveRoom,
  };
}
