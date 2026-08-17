import { useState, useEffect, useRef, useCallback } from 'react';
import { BombGameState, BombPlayer, BombPrompt } from '../types/partyGames';
import {
  playClickSound,
  playTurnSound,
  playWinSound,
  playAssassinSound,
  playFanfareSound,
} from './audio';
import { getWsUrl } from './serverUrl';

export interface UseBombSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: BombPlayer | null;
  gameState: BombGameState | null;
  players: BombPlayer[];
  isMyTurn: boolean;
  errorMessage: string | null;
  createRoom: () => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar: string,
    color?: string,
    colorName?: string
  ) => void;
  startRound: () => void;
  submitWord: (word: string) => void;
  passTurn: () => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
}

export function useBombSocket(): UseBombSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<BombPlayer | null>(null);
  const [gameState, setGameState] = useState<BombGameState | null>(null);
  const [players, setPlayers] = useState<BombPlayer[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    player?: BombPlayer;
  }>({});

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

      // Istemci -> sunucu keep-alive. 3-4 saatlik seanslarda uzun sessizlik
      // aninda platformun baglantiyi "bosta" sayip dusurmesini engeller.
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      pingTimerRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);

        // Auto rejoin session
        if (sessionRef.current.roomCode) {
          if (sessionRef.current.role === 'observer') {
            ws.send(
              JSON.stringify({
                type: 'bomb:join_room',
                roomCode: sessionRef.current.roomCode,
                role: 'observer',
              })
            );
          } else if (sessionRef.current.player) {
            ws.send(
              JSON.stringify({
                type: 'bomb:join_room',
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

          if (type === 'heartbeat') {
            return;
          }

          if (type === 'error') {
            setErrorMessage(data.message || 'Bilinmeyen bir hata oluştu');
            return;
          }

          // 1. Room Created (TV / Host)
          if (type === 'bomb:room_created') {
            setRoomCode(data.roomCode);
            setClientRole('observer');
            sessionRef.current = { roomCode: data.roomCode, role: 'observer' };
            if (data.gameState) setGameState(data.gameState);
            if (data.players) setPlayers(data.players);
          }

          // 2. Room Joined (Player or Observer)
          else if (type === 'bomb:room_joined') {
            setRoomCode(data.roomCode);
            setClientRole(data.role);
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
            if (data.gameState) setGameState(data.gameState);
            if (data.players) setPlayers(data.players);
          }

          // 3. General Bomb State Broadcast
          else if (
            type === 'bomb:state' ||
            type === 'bomb:round_started' ||
            type === 'bomb:word_passed' ||
            type === 'bomb:exploded'
          ) {
            if (data.gameState) setGameState(data.gameState);
            if (data.players) setPlayers(data.players);
            if (data.myPlayer) setMyPlayer(data.myPlayer);
            if (typeof data.isMyTurn === 'boolean') {
              setIsMyTurn(data.isMyTurn);
            } else if (data.gameState && sessionRef.current.player) {
              const activeP = data.players?.[data.gameState.activePlayerIndex];
              setIsMyTurn(activeP?.id === sessionRef.current.player.id);
            }

            // Audio cues
            if (type === 'bomb:round_started') {
              playTurnSound();
            } else if (type === 'bomb:word_passed') {
              playClickSound();
            } else if (type === 'bomb:exploded') {
              playAssassinSound();
              if (data.isGameOver) {
                setTimeout(() => playWinSound(), 1000);
              }
            }
          }
        } catch (err) {
          console.error('Bomb WebSocket parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        // Attempt reconnection after 2 seconds
        setTimeout(() => {
          if (sessionRef.current.roomCode) {
            connect();
          }
        }, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error('Bomb WebSocket connect failed:', e);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
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
  const createRoom = useCallback(() => {
    setErrorMessage(null);
    send({ type: 'bomb:create_room' });
  }, [send]);

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
        type: 'bomb:join_room',
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

  const startRound = useCallback(() => {
    send({ type: 'bomb:start_round' });
  }, [send]);

  const submitWord = useCallback(
    (word: string) => {
      send({
        type: 'bomb:submit_word',
        word: word.trim(),
      });
    },
    [send]
  );

  const passTurn = useCallback(() => {
    send({
      type: 'bomb:pass_turn',
      word: '✓ Pas Devredildi',
    });
  }, [send]);

  const nextRound = useCallback(() => {
    send({ type: 'bomb:next_round' });
  }, [send]);

  const restartGame = useCallback(() => {
    send({ type: 'bomb:restart_game' });
  }, [send]);

  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    setRoomCode(null);
    setClientRole(null);
    setMyPlayer(null);
    setGameState(null);
    setPlayers([]);
    setIsMyTurn(false);
  }, []);

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayer,
    gameState,
    players,
    isMyTurn,
    errorMessage,
    createRoom,
    joinRoom,
    startRound,
    submitWord,
    passTurn,
    nextRound,
    restartGame,
    leaveRoom,
  };
}
