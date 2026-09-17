import { useCallback, useEffect, useRef, useState } from 'react';
import { getWsUrl } from './serverUrl';
import { recordMatchResult, type GameModuleType } from './leaderboardStore';
import { getLang } from '../i18n';

/**
 * Kale Kuşatması ve İl İl Fetih için ortak soket kancası.
 *
 * İki oyunun sunucu tarafı aynı oda kitini (server/roomKit.ts) kullanıyor;
 * mesaj sözleşmesi de aynı, yalnızca önek farklı. Kapışma kancasının
 * (useKapismaSocket) birebir deseni: yeniden bağlanınca aynı oyuncu kimliğiyle
 * odaya geri dönüyor, TV YOK modunda kuran telefon oyuncuya dönüşüyor ve
 * gameState taşıyan her `<önek>:*` mesajı durum güncellemesi sayılıyor.
 */

interface BaseState {
  phase: string;
  roomCode?: string;
  gameId: number;
  winnerPlayerId: string | null;
}

interface BasePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
}

export interface QuizGameSocket<GS extends BaseState, P extends BasePlayer> {
  isConnected: boolean;
  roomCode: string | null;
  myPlayer: P | null;
  gameState: GS | null;
  players: P[];
  errorMessage: string | null;
  createRoom: (settings?: Record<string, unknown>) => void;
  createAndJoin: (name: string, avatar: string, color: string, colorName: string, settings?: Record<string, unknown>) => void;
  joinRoom: (code: string, name: string, avatar: string, color: string, colorName: string) => void;
  /** `<önek>:<eylem>` gönderir. */
  send: (action: string, payload?: Record<string, unknown>) => void;
  leaveRoom: () => void;
}

export function useQuizGameSocket<GS extends BaseState, P extends BasePlayer>(
  prefix: 'kusatma' | 'fetih',
  record: { title: string; icon: string },
): QuizGameSocket<GS, P> {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myPlayer, setMyPlayer] = useState<P | null>(null);
  const [gameState, setGameState] = useState<GS | null>(null);
  const [players, setPlayers] = useState<P[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pendingJoinRef = useRef<null | { name: string; avatar: string; color: string; colorName: string }>(null);
  const recordedRef = useRef<number | null>(null);
  const sessionRef = useRef<{
    roomCode?: string;
    role?: 'observer' | 'player';
    playerId?: string;
    name?: string;
    avatar?: string;
    color?: string;
    colorName?: string;
  }>({});
  const recordMetaRef = useRef(record);
  recordMetaRef.current = record;

  const raw = useCallback((payload: Record<string, unknown>) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    let closed = false;
    let ping: number | null = null;
    let reconnect: number | null = null;

    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(getWsUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);
        if (ping) clearInterval(ping);
        ping = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
        }, 15000);
        const s = sessionRef.current;
        if (s.roomCode) {
          ws.send(JSON.stringify({
            type: `${prefix}:join_room`, roomCode: s.roomCode, role: s.role || 'player', playerId: s.playerId,
            playerName: s.name, avatar: s.avatar, color: s.color, colorName: s.colorName,
          }));
        }
      };

      ws.onmessage = (event) => {
        let msg: any;
        try { msg = JSON.parse(event.data); } catch { return; }
        const type: string = msg?.type;
        if (typeof type !== 'string' || !type.startsWith(`${prefix}:`)) return;

        if (type === `${prefix}:room_created`) {
          setRoomCode(msg.roomCode);
          sessionRef.current.roomCode = msg.roomCode;
          setGameState(msg.gameState);
          setPlayers(msg.players || []);
          const pending = pendingJoinRef.current;
          if (pending) {
            pendingJoinRef.current = null;
            sessionRef.current = { ...sessionRef.current, role: 'player', ...pending };
            ws.send(JSON.stringify({
              type: `${prefix}:join_room`, roomCode: msg.roomCode, role: 'player',
              playerName: pending.name, avatar: pending.avatar, color: pending.color, colorName: pending.colorName,
            }));
          } else {
            sessionRef.current.role = 'observer';
          }
          return;
        }
        if (type === `${prefix}:room_joined`) {
          setRoomCode(msg.roomCode);
          sessionRef.current.roomCode = msg.roomCode;
          sessionRef.current.role = msg.role;
          if (msg.playerId) sessionRef.current.playerId = msg.playerId;
          if (msg.player) setMyPlayer(msg.player);
          setGameState(msg.gameState);
          setPlayers(msg.players || []);
          setErrorMessage(null);
          return;
        }
        if (type === `${prefix}:error`) {
          setErrorMessage(msg.message || 'Bir sorun oldu.');
          return;
        }
        if (!msg.gameState) return;

        const next: GS = msg.gameState;
        setGameState(next);
        if (msg.players) setPlayers(msg.players);
        if (msg.myPlayer) setMyPlayer(msg.myPlayer);

        // Yerel liderlik tablosu (sunucu kalıcılığı kapalıysa bu devreye giriyor)
        if (next.phase === 'GAME_OVER' && msg.players?.length && recordedRef.current !== next.gameId) {
          recordedRef.current = next.gameId;
          const list: P[] = msg.players;
          const winner = list.find((p) => p.id === next.winnerPlayerId);
          recordMatchResult({
            gameType: prefix as GameModuleType,
            gameTitle: recordMetaRef.current.title,
            gameIcon: recordMetaRef.current.icon,
            roomCode: next.roomCode || '',
            players: list.map((p) => ({ name: p.name, avatar: p.avatar, score: p.score, isWinner: p.id === next.winnerPlayerId })),
            winnerName: winner?.name,
          });
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (ping) clearInterval(ping);
        if (closed) return;
        if (reconnect) clearTimeout(reconnect);
        reconnect = window.setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      if (ping) clearInterval(ping);
      if (reconnect) clearTimeout(reconnect);
      socketRef.current?.close();
    };
  }, [prefix]);

  const createRoom = useCallback(
    (settings?: Record<string, unknown>) => raw({ type: `${prefix}:create_room`, lang: getLang(), settings }),
    [raw, prefix],
  );
  const createAndJoin = useCallback(
    (name: string, avatar: string, color: string, colorName: string, settings?: Record<string, unknown>) => {
      pendingJoinRef.current = { name, avatar, color, colorName };
      raw({ type: `${prefix}:create_room`, lang: getLang(), settings });
    },
    [raw, prefix],
  );
  const joinRoom = useCallback(
    (code: string, name: string, avatar: string, color: string, colorName: string) => {
      sessionRef.current = { roomCode: code, role: 'player', name, avatar, color, colorName };
      raw({ type: `${prefix}:join_room`, roomCode: code, role: 'player', playerName: name, avatar, color, colorName });
    },
    [raw, prefix],
  );
  const send = useCallback(
    (action: string, payload: Record<string, unknown> = {}) => raw({ ...payload, type: `${prefix}:${action}` }),
    [raw, prefix],
  );
  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    pendingJoinRef.current = null;
    setRoomCode(null);
    setMyPlayer(null);
    setGameState(null);
    setPlayers([]);
  }, []);

  return { isConnected, roomCode, myPlayer, gameState, players, errorMessage, createRoom, createAndJoin, joinRoom, send, leaveRoom };
}
