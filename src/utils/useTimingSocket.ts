import { useState, useEffect, useRef, useCallback } from 'react';
import { TimingGameState, TimingPlayer, TimingSettings } from '../types/timing';
import { recordMatchResult } from './leaderboardStore';
import { getWsUrl } from './serverUrl';

export interface UseTimingSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: TimingPlayer | null;
  myPressed: boolean;
  gameState: TimingGameState | null;
  players: TimingPlayer[];
  errorMessage: string | null;
  createRoom: (settings?: Partial<TimingSettings>) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar?: string,
    color?: string,
    colorName?: string,
    role?: 'observer' | 'player'
  ) => void;
  startGame: () => void;
  press: () => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
}

export function useTimingSocket(): UseTimingSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<TimingPlayer | null>(null);
  const [myPressed, setMyPressed] = useState(false);
  const [gameState, setGameState] = useState<TimingGameState | null>(null);
  const [players, setPlayers] = useState<TimingPlayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const recordedRef = useRef<string | null>(null);
  const pingRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    playerId?: string;
    playerName?: string;
    avatar?: string;
    color?: string;
    colorName?: string;
  }>({});

  const send = useCallback((payload: any) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    let closed = false;

    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(getWsUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
        }, 15000);

        const s = sessionRef.current;
        if (s.roomCode) {
          ws.send(
            JSON.stringify({
              type: 'timing:join_room',
              roomCode: s.roomCode,
              role: s.role || 'player',
              playerId: s.playerId,
              playerName: s.playerName,
              name: s.playerName,
              avatar: s.avatar,
              color: s.color,
              colorName: s.colorName,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type } = msg;

          // ---------------------------------------------------------------
          // GECIKME OLCUMU — HER SEYDEN ONCE.
          // Sunucu bu oyunda oyuncunun suresinden gidis-donus gecikmesini
          // dusuyor; olcumun dogru olmasi icin yaniti React'e, state'e,
          // hicbir seye ugramadan ANINDA geri gondermek gerekiyor. Asagi
          // tasinirsa olculen sey ag gecikmesi degil bizim render suremiz
          // olur ve oyuncular haksiz telafi alir.
          // ---------------------------------------------------------------
          if (type === 'timing:probe') {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'timing:probe_ack', n: msg.n }));
            }
            return;
          }

          if (type === 'timing:room_created') {
            setRoomCode(msg.roomCode);
            setClientRole('observer');
            sessionRef.current.roomCode = msg.roomCode;
            sessionRef.current.role = 'observer';
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            return;
          }
          if (type === 'timing:room_joined') {
            setRoomCode(msg.roomCode);
            setClientRole(msg.role);
            sessionRef.current.roomCode = msg.roomCode;
            sessionRef.current.role = msg.role;
            if (msg.playerId) sessionRef.current.playerId = msg.playerId;
            if (msg.player) setMyPlayer(msg.player);
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            setErrorMessage(null);
            return;
          }
          if (type === 'timing:error') {
            setErrorMessage(msg.message || 'Bir sorun oldu.');
            return;
          }

          // BEYAZ LISTE YOK — gameState tasiyan her timing:* mesaji durum
          // guncellemesi sayilir. (Trivia'da beyaz liste yuzunden yeni event
          // adlari sessizce dusmus ve oyun kilitlenmisti.)
          if (typeof type === 'string' && type.startsWith('timing:') && msg.gameState) {
            const next: TimingGameState = msg.gameState;
            setGameState(next);
            if (msg.players) setPlayers(msg.players);
            if (msg.myPlayer) setMyPlayer(msg.myPlayer);
            setMyPressed(!!msg.myPressed);

            if (
              next.phase === 'GAME_OVER' &&
              msg.players?.length &&
              recordedRef.current !== next.roomCode
            ) {
              recordedRef.current = next.roomCode || null;
              const winner = msg.players.find((p: TimingPlayer) => p.id === next.winnerPlayerId);
              recordMatchResult({
                gameType: 'timing',
                gameTitle: 'Tam Zamanında',
                gameIcon: '⏱️',
                roomCode: next.roomCode || '',
                players: msg.players.map((p: TimingPlayer) => ({
                  name: p.name,
                  avatar: p.avatar,
                  score: p.score,
                  isWinner: p.id === next.winnerPlayerId,
                })),
                winnerName: winner?.name,
              });
            }
          }
        } catch {
          /* bozuk paket */
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingRef.current) clearInterval(pingRef.current);
        if (closed) return;
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = window.setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      if (pingRef.current) clearInterval(pingRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, []);

  const createRoom = useCallback(
    (settings?: Partial<TimingSettings>) => send({ type: 'timing:create_room', settings }),
    [send]
  );
  const joinRoom = useCallback(
    (
      code: string,
      playerName: string,
      avatar = '⏱️',
      color = '#0ea5e9',
      colorName = 'Mavi',
      role: 'observer' | 'player' = 'player'
    ) => {
      sessionRef.current = { ...sessionRef.current, roomCode: code, role, playerName, avatar, color, colorName };
      send({ type: 'timing:join_room', roomCode: code, playerName, name: playerName, avatar, color, colorName, role });
    },
    [send]
  );
  const startGame = useCallback(() => send({ type: 'timing:start_game' }), [send]);
  const press = useCallback(() => {
    // Yerel geri bildirim aninda: sunucunun yaniti beklenirse buton "olmus"
    // gibi hissettiriyor. Yetkili durum yine sunucudan gelir.
    setMyPressed(true);
    send({ type: 'timing:press' });
  }, [send]);
  const nextRound = useCallback(() => send({ type: 'timing:next_round' }), [send]);
  const restartGame = useCallback(() => send({ type: 'timing:restart_game' }), [send]);
  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    setRoomCode(null); setClientRole(null); setMyPlayer(null);
    setMyPressed(false); setGameState(null); setPlayers([]);
    recordedRef.current = null;
  }, []);

  return {
    isConnected, roomCode, clientRole, myPlayer, myPressed, gameState, players, errorMessage,
    createRoom, joinRoom, startGame, press, nextRound, restartGame, leaveRoom,
  };
}
