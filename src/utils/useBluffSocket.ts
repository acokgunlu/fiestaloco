import { useState, useEffect, useRef, useCallback } from 'react';
import { BluffGameState, BluffPlayer } from '../types/partyGames';
import {
  playClickSound,
  playTurnSound,
  playWinSound,
  playAssassinSound,
  playAgentFoundSound,
  playFanfareSound,
} from './audio';
import { getWsUrl } from './serverUrl';

export interface UseBluffSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: BluffPlayer | null;
  gameState: BluffGameState | null;
  players: BluffPlayer[];
  mySubmittedBluff: string | null;
  myVotedAnswerId: string | null;
  rejectedReason: string | null;
  errorMessage: string | null;
  createRoom: (totalRounds?: number) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar: string,
    color?: string,
    colorName?: string
  ) => void;
  startRound: () => void;
  startWriting: () => void;
  submitBluff: (bluffText: string) => void;
  voteAnswer: (answerId: string) => void;
  nextReveal: () => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  clearRejectedReason: () => void;
}

export function useBluffSocket(): UseBluffSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<BluffPlayer | null>(null);
  const [gameState, setGameState] = useState<BluffGameState | null>(null);
  const [players, setPlayers] = useState<BluffPlayer[]>([]);
  const [mySubmittedBluff, setMySubmittedBluff] = useState<string | null>(null);
  const [myVotedAnswerId, setMyVotedAnswerId] = useState<string | null>(null);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const myPlayerRef = useRef<BluffPlayer | null>(null);
  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    player?: BluffPlayer;
  }>({});
  const reconnectTimerRef = useRef<number | null>(null);

  // Keep myPlayerRef synced
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
      const socketUrl = getWsUrl();
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);

        // Auto rejoin session
        if (sessionRef.current.roomCode) {
          if (sessionRef.current.role === 'observer') {
            ws.send(
              JSON.stringify({
                type: 'bluff:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'observer',
              })
            );
          } else if (sessionRef.current.player) {
            ws.send(
              JSON.stringify({
                type: 'bluff:join_room',
                roomCode: sessionRef.current.roomCode,
                name: sessionRef.current.player.name,
                avatar: sessionRef.current.player.avatar,
                color: sessionRef.current.player.color,
                colorName: sessionRef.current.player.colorName,
              })
            );
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'bluff:created') {
            setRoomCode(msg.roomCode);
            setClientRole('observer');
            if (msg.gameState) setGameState(msg.gameState);
            if (msg.players) setPlayers(msg.players);
            sessionRef.current = { roomCode: msg.roomCode, role: 'observer' };
            playTurnSound();
          } else if (msg.type === 'bluff:joined') {
            setRoomCode(msg.roomCode);
            setClientRole('player');
            if (msg.player) {
              setMyPlayer(msg.player);
              myPlayerRef.current = msg.player;
            }
            if (msg.gameState) setGameState(msg.gameState);
            if (msg.players) setPlayers(msg.players);
            sessionRef.current = {
              roomCode: msg.roomCode,
              role: 'player',
              player: msg.player,
            };
            playClickSound();
          } else if (
            msg.type === 'bluff:state' ||
            msg.type === 'bluff:player_joined' ||
            msg.type === 'bluff:round_started' ||
            msg.type === 'bluff:writing_started' ||
            msg.type === 'bluff:voting_started' ||
            msg.type === 'bluff:bluff_submitted' ||
            msg.type === 'bluff:vote_submitted' ||
            msg.type === 'bluff:round_results' ||
            msg.type === 'bluff:game_over'
          ) {
            if (msg.gameState) {
              setGameState(msg.gameState);

              // Clear local bluff/vote on new round
              if (msg.gameState.phase === 'QUESTION_PREVIEW') {
                setMySubmittedBluff(null);
                setMyVotedAnswerId(null);
                setRejectedReason(null);
              }
            }
            if (msg.players) {
              setPlayers(msg.players);
              if (myPlayerRef.current) {
                const currentId = myPlayerRef.current.id;
                const updatedMe = msg.players.find((p: BluffPlayer) => p.id === currentId);
                if (updatedMe) {
                  setMyPlayer(updatedMe);
                  myPlayerRef.current = updatedMe;
                }
              }
            }

            if (msg.myPlayer) {
              setMyPlayer(msg.myPlayer);
              myPlayerRef.current = msg.myPlayer;
            }

            if (msg.mySubmittedBluff !== undefined) {
              setMySubmittedBluff(msg.mySubmittedBluff);
            }
            if (msg.myVotedAnswerId !== undefined) {
              setMyVotedAnswerId(msg.myVotedAnswerId);
            }

            // Sound triggers
            if (msg.type === 'bluff:round_started') {
              playTurnSound();
            } else if (msg.type === 'bluff:voting_started') {
              playClickSound();
            } else if (msg.type === 'bluff:round_results') {
              playAgentFoundSound();
            } else if (msg.type === 'bluff:game_over') {
              playFanfareSound();
            }
          } else if (msg.type === 'bluff:bluff_rejected' || msg.type === 'bluff:vote_rejected') {
            setRejectedReason(msg.reason || 'Geçersiz işlem');
            playAssassinSound();
          } else if (msg.type === 'bluff:error') {
            setErrorMessage(msg.message);
            playAssassinSound();
          }
        } catch (e) {
          console.error('Bluff socket message parse error', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
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
    } catch (err) {
      console.error('Bluff WebSocket connection error', err);
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
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Robust send helper that delivers immediately if open or queues until connected
  const send = useCallback(
    (payload: Record<string, any>) => {
      const dataStr = JSON.stringify(payload);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(dataStr);
        return;
      }

      // Re-trigger connect if not connected
      connect();

      // Retry sending once connected
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
    (totalRounds: number = 3) => {
      setErrorMessage(null);
      send({
        type: 'bluff:create_room',
        totalRounds,
      });
    },
    [send]
  );

  const joinRoom = useCallback(
    (
      targetRoomCode: string,
      playerName: string,
      avatar: string,
      color?: string,
      colorName?: string
    ) => {
      setErrorMessage(null);
      send({
        type: 'bluff:join_room',
        roomCode: targetRoomCode.toUpperCase().trim(),
        name: playerName.trim(),
        avatar,
        color,
        colorName,
      });
    },
    [send]
  );

  const startRound = useCallback(() => {
    send({
      type: 'bluff:start_game',
    });
  }, [send]);

  const startWriting = useCallback(() => {
    send({
      type: 'bluff:start_writing',
    });
  }, [send]);

  const submitBluff = useCallback(
    (bluffText: string) => {
      const activePlayer = myPlayerRef.current || myPlayer;
      if (activePlayer) {
        setRejectedReason(null);
        setMySubmittedBluff(bluffText);
        send({
          type: 'bluff:submit_bluff',
          playerId: activePlayer.id,
          bluffText,
        });
        playClickSound();
      }
    },
    [myPlayer, send]
  );

  const voteAnswer = useCallback(
    (answerId: string) => {
      const activePlayer = myPlayerRef.current || myPlayer;
      if (activePlayer) {
        setRejectedReason(null);
        setMyVotedAnswerId(answerId);
        send({
          type: 'bluff:vote_answer',
          playerId: activePlayer.id,
          answerId,
        });
        playClickSound();
      }
    },
    [myPlayer, send]
  );

  const nextReveal = useCallback(() => {
    send({
      type: 'bluff:next_reveal',
    });
    playClickSound();
  }, [send]);

  const nextRound = useCallback(() => {
    send({
      type: 'bluff:next_round',
    });
  }, [send]);

  const restartGame = useCallback(() => {
    send({
      type: 'bluff:restart_game',
    });
  }, [send]);

  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    setRoomCode(null);
    setClientRole(null);
    setMyPlayer(null);
    setGameState(null);
    setPlayers([]);
    setMySubmittedBluff(null);
    setMyVotedAnswerId(null);
    setRejectedReason(null);
    setErrorMessage(null);
  }, []);

  const clearRejectedReason = useCallback(() => {
    setRejectedReason(null);
  }, []);

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayer,
    gameState,
    players,
    mySubmittedBluff,
    myVotedAnswerId,
    rejectedReason,
    errorMessage,
    createRoom,
    joinRoom,
    startRound,
    startWriting,
    submitBluff,
    voteAnswer,
    nextReveal,
    nextRound,
    restartGame,
    leaveRoom,
    clearRejectedReason,
  };
}
