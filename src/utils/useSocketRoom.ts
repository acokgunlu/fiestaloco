import { useEffect, useRef, useState, useCallback } from 'react';
import { RoomState, LiveStrokeState, Stroke, GameSettings, WordPair, ClientRole, Point } from '../types';
import { getWsUrl } from './serverUrl';

export function useSocketRoom() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [liveStroke, setLiveStroke] = useState<LiveStrokeState | null>(null);
  const [clientRole, setClientRole] = useState<ClientRole | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep latest session credentials in ref for seamless auto-reconnect
  const sessionRef = useRef<{
    roomCode?: string;
    role?: ClientRole;
    playerId?: string;
    playerName?: string;
    playerColor?: string;
    avatar?: string;
  }>({});

  const pingTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setErrorMessage(null);

      // If we previously had an active room session, auto-rejoin immediately
      if (sessionRef.current.roomCode) {
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: sessionRef.current.roomCode,
            role: sessionRef.current.role || 'player',
            playerId: sessionRef.current.playerId,
            playerName: sessionRef.current.playerName,
            playerColor: sessionRef.current.playerColor,
            avatar: sessionRef.current.avatar,
          })
        );
      }

      // Start client ping heartbeat
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      pingTimerRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'room:state') {
          setRoomState(data.state);
          if (!data.state || data.state.gamePhase !== 'DRAWING' || data.state.strokes.length === 0) {
            setLiveStroke(null);
          }
        } else if (data.type === 'room:created') {
          setClientRole('observer');
          sessionRef.current.role = 'observer';
          sessionRef.current.roomCode = data.roomCode;
          setRoomState(data.state);
          setLiveStroke(null);
        } else if (data.type === 'room:joined') {
          setClientRole(data.role);
          sessionRef.current.role = data.role;
          sessionRef.current.roomCode = data.roomCode;
          if (data.playerId) {
            setMyPlayerId(data.playerId);
            sessionRef.current.playerId = data.playerId;
          }
          if (data.state) setRoomState(data.state);
          setLiveStroke(null);
        } else if (data.type === 'stroke:live') {
          if (data.points && data.points.length > 0) {
            setLiveStroke({
              playerId: data.playerId,
              points: data.points,
              color: data.color,
            });
          } else {
            setLiveStroke(null);
          }
        } else if (data.type === 'timer:tick') {
          setRoomState((prev) => {
            if (!prev) return prev;
            if (data.phase === 'DRAWING') {
              return { ...prev, turnTimeRemaining: data.timeRemaining };
            } else if (data.phase === 'DISCUSSION') {
              return { ...prev, discussionTimeRemaining: data.timeRemaining };
            }
            return prev;
          });
        } else if (data.type === 'error') {
          setErrorMessage(data.message);
        } else if (data.type === 'heartbeat' || data.type === 'pong') {
          // Keepalive acknowledged
        }
      } catch (e) {
        console.error('Error handling socket message', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);

      // Auto-reconnect after 1.5 seconds if session exists
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

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

    // Reconnect on tab visibility change / device unlock
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback(
    (type: string, payload: Record<string, any> = {}) => {
      const dataStr = JSON.stringify({ type, ...payload });
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(dataStr);
        return;
      }

      // Re-trigger connect if not active
      connect();

      // Retry sending once connected
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(dataStr);
          clearInterval(interval);
        } else if (attempts >= 30) {
          clearInterval(interval);
        }
      }, 100);
    },
    [connect]
  );

  const createRoom = useCallback((settings?: Partial<GameSettings>, hostName?: string) => {
    setErrorMessage(null);
    send('room:create', { settings, hostName });
  }, [send]);

  const joinRoom = useCallback((roomCode: string, role: ClientRole = 'player', playerName?: string, playerColor?: string, avatar?: string) => {
    setErrorMessage(null);
    sessionRef.current = {
      roomCode,
      role,
      playerId: sessionRef.current.playerId,
      playerName,
      playerColor,
      avatar,
    };
    send('room:join', { roomCode, role, playerId: sessionRef.current.playerId, playerName, playerColor, avatar });
  }, [send]);

  const startGame = useCallback((customPair?: WordPair) => {
    send('game:start', { customPair });
  }, [send]);

  const startDrawing = useCallback(() => {
    send('game:start_drawing');
  }, [send]);

  const sendLiveStrokePoint = useCallback((points: Point[], color: string) => {
    send('stroke:live_point', { playerId: myPlayerId, points, color });
  }, [send, myPlayerId]);

  const commitStroke = useCallback((stroke: Stroke) => {
    setLiveStroke(null);
    send('stroke:commit', { stroke });
  }, [send]);

  const skipTurn = useCallback(() => {
    setLiveStroke(null);
    send('turn:skip');
  }, [send]);

  const proceedToVoting = useCallback(() => {
    send('discussion:proceed_to_voting');
  }, [send]);

  const submitVote = useCallback((targetId: string) => {
    if (!myPlayerId) return;
    send('vote:submit', { voterId: myPlayerId, targetId });
  }, [send, myPlayerId]);

  const forceTallyVotes = useCallback(() => {
    send('vote:force_tally');
  }, [send]);

  const submitImposterGuess = useCallback((guessWord: string) => {
    send('imposter:guess', { guessWord });
  }, [send]);

  const nextRound = useCallback(() => {
    send('game:next_round');
  }, [send]);

  const backToLobby = useCallback(() => {
    send('game:back_to_lobby');
  }, [send]);

  const addBot = useCallback(() => {
    send('lobby:add_bot');
  }, [send]);

  const removePlayer = useCallback((playerId: string) => {
    send('lobby:remove_player', { playerId });
  }, [send]);

  const updateSettings = useCallback((settings: GameSettings) => {
    send('settings:update', { settings });
  }, [send]);

  const updateProfile = useCallback((name: string, color: string, avatar: string, colorName: string) => {
    if (!myPlayerId) return;
    sessionRef.current.playerName = name;
    sessionRef.current.playerColor = color;
    sessionRef.current.avatar = avatar;
    send('player:update', { playerId: myPlayerId, name, color, avatar, colorName });
  }, [send, myPlayerId]);

  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    setRoomState(null);
    setClientRole(null);
    setMyPlayerId(null);
    setLiveStroke(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return {
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
  };
}
