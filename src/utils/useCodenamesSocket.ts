import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CodenamesGameState,
  CodenamesPlayer,
  CodenamesSettings,
  CodenamesTeam,
  CodenamesRole,
} from '../types/codenames';
import { CodenamesCard } from '../data/codenamesWords';
import {
  playClickSound,
  playAgentFoundSound,
  playNeutralFoundSound,
  playEnemyAgentSound,
  playAssassinSound,
  playTurnSound,
  playCardFlipSound,
} from './audio';
import { getWsUrl } from './serverUrl';

export interface UseCodenamesSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: CodenamesPlayer | null;
  gameState: CodenamesGameState | null;
  players: CodenamesPlayer[];
  errorMessage: string | null;
  createRoom: (settings?: Partial<CodenamesSettings>) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    team: CodenamesTeam,
    role: CodenamesRole,
    roleTitle?: string
  ) => void;
  updatePlayerRole: (team: CodenamesTeam, role: CodenamesRole) => void;
  giveClue: (word: string, count: number) => void;
  revealCard: (cardId: string) => void;
  endTurn: () => void;
  newGame: (settings?: Partial<CodenamesSettings>) => void;
  /** Lobiden oyuna gecis (TV/host tetikler). */
  startGame: () => void;
  leaveRoom: () => void;
}

export function useCodenamesSocket(): UseCodenamesSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<CodenamesPlayer | null>(null);
  const [gameState, setGameState] = useState<CodenamesGameState | null>(null);
  const [players, setPlayers] = useState<CodenamesPlayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const previousRevealedCardIds = useRef<Set<string>>(new Set());

  // Keep latest session for auto-reconnect
  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    player?: CodenamesPlayer;
  }>({});

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const socketUrl = getWsUrl();
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);

        // Auto-rejoin room if we had an active session
        if (sessionRef.current.roomCode) {
          if (sessionRef.current.role === 'observer') {
            ws.send(
              JSON.stringify({
                type: 'codenames:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'observer',
              })
            );
          } else if (sessionRef.current.player) {
            ws.send(
              JSON.stringify({
                type: 'codenames:join_room',
                roomCode: sessionRef.current.roomCode,
                playerName: sessionRef.current.player.name,
                team: sessionRef.current.player.team,
                role: sessionRef.current.player.role,
                playerId: sessionRef.current.player.id,
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

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type } = msg;

          if (type === 'codenames:room_created') {
            setRoomCode(msg.roomCode);
            setClientRole('observer');
            sessionRef.current.roomCode = msg.roomCode;
            sessionRef.current.role = 'observer';
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            setErrorMessage(null);
          } else if (type === 'codenames:room_joined') {
            setRoomCode(msg.roomCode);
            setClientRole(msg.role);
            sessionRef.current.roomCode = msg.roomCode;
            sessionRef.current.role = msg.role;
            if (msg.player) {
              setMyPlayer(msg.player);
              sessionRef.current.player = msg.player;
            }
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            setErrorMessage(null);
          } else if (type === 'codenames:start_rejected') {
            // Takim kurulumu eksik — sunucu oyunu baslatmadi
            setErrorMessage(msg.message || 'Takımlar hazır değil.');
          } else if (type === 'codenames:state') {
            const nextState: CodenamesGameState = msg.gameState;

            // Check if a new card was flipped to play appropriate sound
            if (nextState && nextState.board) {
              nextState.board.forEach((card: CodenamesCard) => {
                if (card.revealed && !previousRevealedCardIds.current.has(card.id)) {
                  previousRevealedCardIds.current.add(card.id);
                  if (card.type === 'assassin') {
                    playAssassinSound();
                  } else if (card.type === 'neutral') {
                    playNeutralFoundSound();
                  } else {
                    playAgentFoundSound(card.type);
                  }
                }
              });
            }

            setGameState(nextState);
            if (msg.players) setPlayers(msg.players);
            if (msg.myPlayer) {
              setMyPlayer(msg.myPlayer);
              sessionRef.current.player = msg.myPlayer;
            }
          } else if (type === 'error') {
            setErrorMessage(msg.message || 'Bir bağlantı hatası oluştu.');
          }
        } catch (err) {
          // Silent catch for malformed messages
        }
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
    } catch {
      setIsConnected(false);
    }
  }, []);

  // Connect on mount and handle visibility change
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
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback(
    (payload: any) => {
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

  const createRoom = useCallback(
    (settings?: Partial<CodenamesSettings>) => {
      send({
        type: 'codenames:create_room',
        settings,
      });
    },
    [send]
  );

  const joinRoom = useCallback(
    (
      code: string,
      playerName: string,
      team: CodenamesTeam,
      role: CodenamesRole,
      roleTitle?: string
    ) => {
      send({
        type: 'codenames:join_room',
        roomCode: code.toUpperCase().trim(),
        playerName: playerName.trim() || 'Ajan',
        team,
        role,
      });
    },
    [send]
  );

  const updatePlayerRole = useCallback(
    (team: CodenamesTeam, role: CodenamesRole) => {
      if (!myPlayer) return;
      send({
        type: 'codenames:update_player',
        playerId: myPlayer.id,
        team,
        role,
      });
    },
    [send, myPlayer]
  );

  const giveClue = useCallback(
    (word: string, count: number) => {
      send({
        type: 'codenames:give_clue',
        word: word.trim().toUpperCase(),
        count,
      });
    },
    [send]
  );

  const revealCard = useCallback(
    (cardId: string) => {
      send({
        type: 'codenames:reveal_card',
        cardId,
      });
    },
    [send]
  );

  const endTurn = useCallback(() => {
    send({
      type: 'codenames:end_turn',
    });
  }, [send]);

  const newGame = useCallback(
    (settings?: Partial<CodenamesSettings>) => {
      send({
        type: 'codenames:new_game',
        settings,
      });
    },
    [send]
  );

  /** Lobiden oyuna gecis — yalnizca TV/host tetikler. */
  const startGame = useCallback(() => {
    send({ type: 'codenames:start_game' });
  }, [send]);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    setClientRole(null);
    setMyPlayer(null);
    setGameState(null);
    setPlayers([]);
    previousRevealedCardIds.current.clear();
  }, []);

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayer,
    gameState,
    players,
    errorMessage,
    createRoom,
    joinRoom,
    updatePlayerRole,
    giveClue,
    revealCard,
    endTurn,
    newGame,
    startGame,
    leaveRoom,
  };
}
