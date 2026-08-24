import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QuiplashGameState,
  QuiplashPlayer,
  QuiplashPrompt,
  QuiplashMatchup,
  QuiplashSettings,
  QuiplashAnswer,
} from '../types/quiplash';
import { recordMatchResult } from './leaderboardStore';
import { getWsUrl } from './serverUrl';

import { t } from '../i18n';
export interface UseQuiplashSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: QuiplashPlayer | null;
  gameState: QuiplashGameState | null;
  players: QuiplashPlayer[];
  errorMessage: string | null;
  myAssignedPrompts: QuiplashPrompt[];
  createRoom: (settings?: Partial<QuiplashSettings>) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar?: string,
    color?: string,
    role?: 'observer' | 'player'
  ) => void;
  startGame: () => void;
  submitPromptAnswers: (answers: Record<string, string>) => void;
  voteMatchupAnswer: (answerIndex: 1 | 2) => void;
  nextMatchup: () => void;
  startNextRound: () => void;
  submitLastLashAnswer: (answer: string) => void;
  submitLastLashVotes: (votedPlayerIds: string[]) => void;
  restartGame: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

export function useQuiplashSocket(): UseQuiplashSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<QuiplashPlayer | null>(null);
  const [gameState, setGameState] = useState<QuiplashGameState | null>(null);
  const [players, setPlayers] = useState<QuiplashPlayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myAssignedPrompts, setMyAssignedPrompts] = useState<QuiplashPrompt[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const myPlayerRef = useRef<QuiplashPlayer | null>(null);
  const recordedMatchRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const sessionRef = useRef<{
    roomCode?: string;
    playerName?: string;
    avatar?: string;
    color?: string;
    role?: 'observer' | 'player';
  }>({});

  const connect = useCallback(() => {
    try {
      const wsUrl = getWsUrl('/ws');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);

        // Re-join if session was active
        if (sessionRef.current.roomCode) {
          if (sessionRef.current.role === 'observer') {
            ws.send(
              JSON.stringify({
                type: 'quiplash:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'observer',
              })
            );
          } else if (sessionRef.current.playerName) {
            ws.send(
              JSON.stringify({
                type: 'quiplash:join_room',
                roomCode: sessionRef.current.roomCode,
                playerName: sessionRef.current.playerName,
                avatar: sessionRef.current.avatar,
                color: sessionRef.current.color,
                role: 'player',
              })
            );
          }
        }

        // Heartbeat
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

          if (type === 'quiplash:room_created') {
            setRoomCode(msg.roomCode);
            setClientRole('observer');
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            sessionRef.current = { roomCode: msg.roomCode, role: 'observer' };
          } else if (type === 'quiplash:room_joined') {
            setRoomCode(msg.roomCode);
            setClientRole(msg.role);
            if (msg.player) {
              setMyPlayer(msg.player);
              myPlayerRef.current = msg.player;
            }
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            sessionRef.current = {
              roomCode: msg.roomCode,
              playerName: msg.player?.name,
              avatar: msg.player?.avatar,
              color: msg.player?.color,
              role: msg.role,
            };
          } else if (type === 'quiplash:state') {
            if (msg.gameState) setGameState(msg.gameState);
            if (msg.players) {
              setPlayers(msg.players);
              if (myPlayerRef.current) {
                const updated = msg.players.find(
                  (p: QuiplashPlayer) => p.id === myPlayerRef.current?.id
                );
                if (updated) {
                  setMyPlayer(updated);
                  myPlayerRef.current = updated;
                }
              }
            }

            // Check game over for leaderboard recording
            if (
              msg.gameState?.phase === 'GAME_OVER' &&
              msg.gameState?.winnerPlayerId &&
              recordedMatchRef.current !== msg.gameState.roomCode + msg.gameState.winnerPlayerId
            ) {
              const winner = (msg.players || []).find(
                (p: QuiplashPlayer) => p.id === msg.gameState.winnerPlayerId
              );
              if (winner) {
                recordMatchResult({
                  gameType: 'quiplash',
                  gameTitle: 'Quiplash',
                  gameIcon: '🥊',
                  roomCode: msg.gameState.roomCode,
                  winnerName: winner.name,
                  winnerAvatar: winner.avatar || '🥊',
                  winnerScore: winner.score || 0,
                  details: `Mizah Düellosu Kazananı: ${winner.name} (${winner.score || 0} Puan)`,
                  players: (msg.players || []).map((pl: QuiplashPlayer) => ({
                    name: pl.name,
                    avatar: pl.avatar || '😎',
                    score: pl.score || 0,
                    isWinner: pl.id === winner.id,
                  })),
                });
                recordedMatchRef.current = msg.gameState.roomCode + msg.gameState.winnerPlayerId;
              }
            }
          } else if (type === 'quiplash:assigned_prompts') {
            if (Array.isArray(msg.prompts)) {
              setMyAssignedPrompts(msg.prompts);
            }
          }
        } catch (e) {
          console.error('Quiplash msg parse error:', e);
        }
      };
    } catch (e) {
      console.error('Quiplash connection error:', e);
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

  const send = (payload: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      setErrorMessage('Sunucu bağlantısı henüz hazır değil. Lütfen tekrar deneyin.');
    }
  };

  const createRoom = (settings?: Partial<QuiplashSettings>) => {
    send({ type: 'quiplash:create_room', settings });
  };

  const joinRoom = (
    code: string,
    playerName: string,
    avatar?: string,
    color?: string,
    role: 'observer' | 'player' = 'player'
  ) => {
    send({
      type: 'quiplash:join_room',
      roomCode: code.toUpperCase().trim(),
      playerName,
      avatar,
      color,
      role,
    });
  };

  const startGame = () => {
    send({ type: 'quiplash:start_game' });
  };

  const submitPromptAnswers = (answers: Record<string, string>) => {
    send({
      type: 'quiplash:submit_answers',
      answers,
    });
  };

  const voteMatchupAnswer = (answerIndex: 1 | 2) => {
    send({
      type: 'quiplash:vote_matchup',
      answerIndex,
    });
  };

  const nextMatchup = () => {
    send({ type: 'quiplash:next_matchup' });
  };

  const startNextRound = () => {
    send({ type: 'quiplash:next_round' });
  };

  const submitLastLashAnswer = (answer: string) => {
    send({
      type: 'quiplash:submit_last_lash_answer',
      answer,
    });
  };

  const submitLastLashVotes = (votedPlayerIds: string[]) => {
    send({
      type: 'quiplash:vote_last_lash',
      votedPlayerIds,
    });
  };

  const restartGame = () => {
    send({ type: 'quiplash:restart_game' });
  };

  const leaveRoom = () => {
    sessionRef.current = {};
    setRoomCode(null);
    setClientRole(null);
    setMyPlayer(null);
    setGameState(null);
    setPlayers([]);
    setMyAssignedPrompts([]);
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayer,
    gameState,
    players,
    errorMessage,
    myAssignedPrompts,
    createRoom,
    joinRoom,
    startGame,
    submitPromptAnswers,
    voteMatchupAnswer,
    nextMatchup,
    startNextRound,
    submitLastLashAnswer,
    submitLastLashVotes,
    restartGame,
    leaveRoom,
    clearError,
  };
}
