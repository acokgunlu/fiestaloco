import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VerdictGameState,
  VerdictPlayer,
  VerdictQuestion,
  VerdictVoteDetail,
} from '../types/partyGames';
import {
  playClickSound,
  playTurnSound,
  playWinSound,
  playAssassinSound,
  playFanfareSound,
} from './audio';
import { getWsUrl } from './serverUrl';

export interface UseVerdictSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: VerdictPlayer | null;
  gameState: VerdictGameState | null;
  players: VerdictPlayer[];
  votedPlayerIds: string[];
  myVotedTargetId: string | null;
  errorMessage: string | null;
  createRoom: (totalRounds?: number) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar: string,
    color?: string,
    colorName?: string
  ) => void;
  startGame: () => void;
  startVoting: () => void;
  castSecretVote: (targetPlayerId: string) => void;
  submitDefense: (defenseSpeech: string) => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
}

export function useVerdictSocket(): UseVerdictSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<VerdictPlayer | null>(null);
  const [gameState, setGameState] = useState<VerdictGameState | null>(null);
  const [players, setPlayers] = useState<VerdictPlayer[]>([]);
  const [votedPlayerIds, setVotedPlayerIds] = useState<string[]>([]);
  const [myVotedTargetId, setMyVotedTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    player?: VerdictPlayer;
  }>({});
  const lastPhaseRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

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
                type: 'verdict:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'observer',
              })
            );
          } else if (sessionRef.current.player) {
            ws.send(
              JSON.stringify({
                type: 'verdict:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'player',
                playerId: sessionRef.current.player.id,
                playerName: sessionRef.current.player.name,
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
          const data = JSON.parse(event.data);
          const { type } = data;

          if (type === 'verdict:room_created') {
            setRoomCode(data.roomCode);
            setClientRole('observer');
            setGameState(data.gameState);
            setPlayers(data.players || []);
            setVotedPlayerIds([]);
            sessionRef.current = { roomCode: data.roomCode, role: 'observer' };
          } else if (type === 'verdict:room_joined') {
            setRoomCode(data.roomCode);
            setClientRole(data.role);
            setGameState(data.gameState);
            setPlayers(data.players || []);
            if (data.role === 'player' && data.player) {
              setMyPlayer(data.player);
              sessionRef.current = {
                roomCode: data.roomCode,
                role: 'player',
                player: data.player,
              };
            } else {
              sessionRef.current = { roomCode: data.roomCode, role: 'observer' };
            }
          } else if (type === 'verdict:state') {
            const prevPhase = lastPhaseRef.current;
            const newGameState: VerdictGameState = data.gameState;
            lastPhaseRef.current = newGameState?.phase || null;

            setGameState(newGameState);
            setPlayers(data.players || []);
            setVotedPlayerIds(data.votedPlayerIds || []);

            if (data.myPlayer) {
              setMyPlayer(data.myPlayer);
            }

            if (newGameState.phase === 'VOTING' && prevPhase !== 'VOTING') {
              playTurnSound();
            } else if (
              newGameState.phase === 'THE_VERDICT' &&
              prevPhase !== 'THE_VERDICT'
            ) {
              playAssassinSound();
            } else if (
              newGameState.phase === 'DEFENSE_TIME' &&
              prevPhase !== 'DEFENSE_TIME'
            ) {
              playTurnSound();
            } else if (
              newGameState.phase === 'ROUND_SCORES' &&
              prevPhase !== 'ROUND_SCORES'
            ) {
              playWinSound();
            } else if (
              newGameState.phase === 'GAME_OVER' &&
              prevPhase !== 'GAME_OVER'
            ) {
              playFanfareSound();
            }

            // Sync private vote if provided
            if (data.myVoteTargetId !== undefined) {
              setMyVotedTargetId(data.myVoteTargetId);
            } else if (newGameState.phase === 'QUESTION_REVEAL' || newGameState.phase === 'LOBBY') {
              setMyVotedTargetId(null);
            }
          } else if (type === 'verdict:vote_confirmed') {
            setMyVotedTargetId(data.targetPlayerId);
            playClickSound();
          } else if (type === 'error') {
            setErrorMessage(data.message || 'Bir hata oluştu.');
          }
        } catch (err) {
          console.error('Verdict socket message parse error:', err);
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
      console.error('Failed to establish verdict socket connection:', err);
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

      // Re-trigger connect if not active
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
        type: 'verdict:create_room',
        totalRounds,
      });
    },
    [send]
  );

  const joinRoom = useCallback(
    (
      code: string,
      playerName: string,
      avatar: string,
      color?: string,
      colorName?: string
    ) => {
      setErrorMessage(null);
      send({
        type: 'verdict:join_room',
        roomCode: code.toUpperCase().trim(),
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
    send({
      type: 'verdict:start_game',
    });
  }, [send]);

  const startVoting = useCallback(() => {
    send({
      type: 'verdict:start_voting',
    });
  }, [send]);

  const castSecretVote = useCallback(
    (targetPlayerId: string) => {
      setMyVotedTargetId(targetPlayerId);
      send({
        type: 'verdict:cast_vote',
        targetPlayerId,
      });
    },
    [send]
  );

  const submitDefense = useCallback(
    (defenseSpeech: string) => {
      send({
        type: 'verdict:submit_defense',
        defenseSpeech,
      });
    },
    [send]
  );

  const nextRound = useCallback(() => {
    setMyVotedTargetId(null);
    send({
      type: 'verdict:next_round',
    });
  }, [send]);

  const restartGame = useCallback(() => {
    setMyVotedTargetId(null);
    send({
      type: 'verdict:restart_game',
    });
  }, [send]);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    setClientRole(null);
    setMyPlayer(null);
    setGameState(null);
    setPlayers([]);
    setVotedPlayerIds([]);
    setMyVotedTargetId(null);
    sessionRef.current = {};
  }, []);

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayer,
    gameState,
    players,
    votedPlayerIds,
    myVotedTargetId,
    errorMessage,
    createRoom,
    joinRoom,
    startGame,
    startVoting,
    castSecretVote,
    submitDefense,
    nextRound,
    restartGame,
    leaveRoom,
  };
}
