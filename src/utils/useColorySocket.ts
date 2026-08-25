import { useState, useEffect, useRef, useCallback } from 'react';
import { ColoryGameState, ColoryPlayer, ColorySettings, Hsl } from '../types/colory';
import { recordMatchResult } from './leaderboardStore';
import { getWsUrl } from './serverUrl';

export interface UseColorySocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: ColoryPlayer | null;
  myGuess: Hsl | null;
  gameState: ColoryGameState | null;
  players: ColoryPlayer[];
  errorMessage: string | null;
  createRoom: (settings?: Partial<ColorySettings>) => void;
  /** TV YOK modu: odayı kuran telefon aynı anda oyuncu olur. */
  createAndJoin: (
    playerName: string, avatar?: string, color?: string, colorName?: string,
    settings?: Partial<ColorySettings>
  ) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar?: string,
    color?: string,
    colorName?: string,
    role?: 'observer' | 'player'
  ) => void;
  startGame: () => void;
  submitGuess: (hsl: Hsl) => void;
  nextRound: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
}

export function useColorySocket(): UseColorySocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<ColoryPlayer | null>(null);
  const [myGuess, setMyGuess] = useState<Hsl | null>(null);
  const [gameState, setGameState] = useState<ColoryGameState | null>(null);
  const [players, setPlayers] = useState<ColoryPlayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  /** createAndJoin: room_created gelir gelmez oyuncu olarak katılmak için. */
  const pendingJoinRef = useRef<null | {
    playerName: string; avatar: string; color: string; colorName: string;
  }>(null);
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
              type: 'colory:join_room',
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

          if (type === 'colory:room_created') {
            setRoomCode(msg.roomCode);
            sessionRef.current.roomCode = msg.roomCode;
            setGameState(msg.gameState);
            setPlayers(msg.players || []);

            const pending = pendingJoinRef.current;
            if (pending) {
              // TV YOK modu: kuran telefon hemen oyuncuya dönüşüyor. Sunucu
              // join sırasında bu soketi gözlemci listesinden çıkarır; yoksa
              // soket iki listede kalıp her güncellemeyi iki farklı yükle alır.
              pendingJoinRef.current = null;
              sessionRef.current = {
                ...sessionRef.current, role: 'player',
                playerName: pending.playerName, avatar: pending.avatar,
                color: pending.color, colorName: pending.colorName,
              };
              ws.send(JSON.stringify({
                type: 'colory:join_room', roomCode: msg.roomCode,
                playerName: pending.playerName, name: pending.playerName,
                avatar: pending.avatar, color: pending.color,
                colorName: pending.colorName, role: 'player',
              }));
            } else {
              setClientRole('observer');
              sessionRef.current.role = 'observer';
            }
            return;
          }
          if (type === 'colory:room_joined') {
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
          if (type === 'colory:error') {
            setErrorMessage(msg.message || 'Bir sorun oldu.');
            return;
          }

          // BEYAZ LISTE YOK — gameState tasiyan her colory:* mesaji durum
          // guncellemesi sayilir. (Trivia'da beyaz liste yuzunden yeni event
          // adlari sessizce dusmus ve oyun kilitlenmisti.)
          if (typeof type === 'string' && type.startsWith('colory:') && msg.gameState) {
            const next: ColoryGameState = msg.gameState;
            setGameState(next);
            if (msg.players) setPlayers(msg.players);
            if (msg.myPlayer) setMyPlayer(msg.myPlayer);
            setMyGuess(msg.myGuess ?? null);

            if (
              next.phase === 'GAME_OVER' &&
              msg.players?.length &&
              recordedRef.current !== next.roomCode
            ) {
              recordedRef.current = next.roomCode || null;
              const winner = msg.players.find((p: ColoryPlayer) => p.id === next.winnerPlayerId);
              recordMatchResult({
                gameType: 'colory',
                gameTitle: 'Colory',
                gameIcon: '🎨',
                roomCode: next.roomCode || '',
                players: msg.players.map((p: ColoryPlayer) => ({
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
    (settings?: Partial<ColorySettings>) => send({ type: 'colory:create_room', settings }),
    [send]
  );
  const joinRoom = useCallback(
    (code: string, playerName: string, avatar = '🎨', color = '#8b5cf6', colorName = 'Mor', role: 'observer' | 'player' = 'player') => {
      sessionRef.current = { ...sessionRef.current, roomCode: code, role, playerName, avatar, color, colorName };
      send({ type: 'colory:join_room', roomCode: code, playerName, name: playerName, avatar, color, colorName, role });
    },
    [send]
  );
  const createAndJoin = useCallback(
    (playerName: string, avatar = '🎨', color = '#8b5cf6', colorName = 'Mor',
     settings?: Partial<ColorySettings>) => {
      pendingJoinRef.current = { playerName, avatar, color, colorName };
      send({ type: 'colory:create_room', settings });
    },
    [send]
  );
  const startGame = useCallback(() => send({ type: 'colory:start_game' }), [send]);
  const submitGuess = useCallback((hsl: Hsl) => send({ type: 'colory:submit_guess', hsl }), [send]);
  const nextRound = useCallback(() => send({ type: 'colory:next_round' }), [send]);
  const restartGame = useCallback(() => send({ type: 'colory:restart_game' }), [send]);
  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    pendingJoinRef.current = null;
    setRoomCode(null); setClientRole(null); setMyPlayer(null);
    setMyGuess(null); setGameState(null); setPlayers([]);
    recordedRef.current = null;
  }, []);

  return {
    isConnected, roomCode, clientRole, myPlayer, myGuess, gameState, players, errorMessage,
    createRoom, createAndJoin, joinRoom, startGame, submitGuess, nextRound, restartGame, leaveRoom,
  };
}
