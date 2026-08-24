import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HorseRaceBet,
  HorseRaceGameState,
  HorseRacePlayer,
  HorseRaceSettings,
} from '../types/horseRace';
import { recordMatchResult } from './leaderboardStore';
import { getWsUrl } from './serverUrl';

export interface UseHorseRaceSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: HorseRacePlayer | null;
  myBet: HorseRaceBet | null;
  gameState: HorseRaceGameState | null;
  players: HorseRacePlayer[];
  errorMessage: string | null;
  createRoom: (settings?: Partial<HorseRaceSettings>) => void;
  joinRoom: (
    roomCode: string,
    playerName: string,
    avatar?: string,
    color?: string,
    colorName?: string,
    role?: 'observer' | 'player'
  ) => void;
  startGame: () => void;
  placeBet: (horseId: string, amount: number) => void;
  /** Biriken dokunuslari sunucuya yollar (istemci toplu gonderir). */
  sendTaps: (count: number) => void;
  nextRace: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

export function useHorseRaceSocket(): UseHorseRaceSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<HorseRacePlayer | null>(null);
  const [myBet, setMyBet] = useState<HorseRaceBet | null>(null);
  const [gameState, setGameState] = useState<HorseRaceGameState | null>(null);
  const [players, setPlayers] = useState<HorseRacePlayer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const recordedMatchRef = useRef<string | null>(null);
  const pingTimerRef = useRef<number | null>(null);
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

        // Uzun sessizliklerde baglantinin bosta sayilip dusurulmesini engeller
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
        }, 15000);

        // Kopan oturumu geri bagla
        const s = sessionRef.current;
        if (s.roomCode) {
          ws.send(
            JSON.stringify({
              type: 'race:join_room',
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

          if (type === 'race:room_created') {
            setRoomCode(msg.roomCode);
            setClientRole('observer');
            sessionRef.current.roomCode = msg.roomCode;
            sessionRef.current.role = 'observer';
            setGameState(msg.gameState);
            setPlayers(msg.players || []);
            setErrorMessage(null);
            return;
          }

          if (type === 'race:room_joined') {
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

          if (type === 'race:error' || type === 'race:bet_rejected') {
            setErrorMessage(msg.message || 'Bir sorun oldu.');
            return;
          }

          // Durum guncellemesi: BEYAZ LISTE YOK.
          // Sunucu farkli event adlariyla yayin yapiyor (race:betting_started,
          // race:countdown, race:started, race:results...). Trivia'da beyaz liste
          // yuzunden yeni event adlari sessizce dusmus ve oyun kilitlenmisti —
          // burada gameState tasiyan HER race:* mesaji durum sayiliyor.
          if (typeof type === 'string' && type.startsWith('race:') && msg.gameState) {
            const next: HorseRaceGameState = msg.gameState;
            setGameState(next);
            if (msg.players) setPlayers(msg.players);
            if (msg.myPlayer) setMyPlayer(msg.myPlayer);
            setMyBet(msg.myBet ?? null);

            if (
              next.phase === 'GAME_OVER' &&
              msg.players?.length &&
              recordedMatchRef.current !== next.roomCode
            ) {
              recordedMatchRef.current = next.roomCode || null;
              const winner = msg.players.find((p: HorseRacePlayer) => p.id === next.winnerPlayerId);
              recordMatchResult({
                gameType: 'race',
                gameTitle: 'At Yarışı',
                gameIcon: '🏇',
                roomCode: next.roomCode || '',
                players: msg.players.map((p: HorseRacePlayer) => ({
                  name: p.name,
                  avatar: p.avatar,
                  score: p.money,
                  isWinner: p.id === next.winnerPlayerId,
                })),
                winnerName: winner?.name,
              });
            }
          }
        } catch {
          /* bozuk paket — yoksay */
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        if (closed) return;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(connect, 1500);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      closed = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, []);

  const createRoom = useCallback(
    (settings?: Partial<HorseRaceSettings>) => send({ type: 'race:create_room', settings }),
    [send]
  );

  const joinRoom = useCallback(
    (
      code: string,
      playerName: string,
      avatar = '🦊',
      color = '#f59e0b',
      colorName = 'Sarı',
      role: 'observer' | 'player' = 'player'
    ) => {
      sessionRef.current = { ...sessionRef.current, roomCode: code, role, playerName, avatar, color, colorName };
      send({ type: 'race:join_room', roomCode: code, playerName, name: playerName, avatar, color, colorName, role });
    },
    [send]
  );

  const startGame = useCallback(() => send({ type: 'race:start_game' }), [send]);
  const placeBet = useCallback(
    (horseId: string, amount: number) => send({ type: 'race:place_bet', horseId, amount }),
    [send]
  );
  const sendTaps = useCallback((count: number) => send({ type: 'race:tap', count }), [send]);
  const nextRace = useCallback(() => send({ type: 'race:next_race' }), [send]);
  const restartGame = useCallback(() => send({ type: 'race:restart_game' }), [send]);

  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    setRoomCode(null);
    setClientRole(null);
    setMyPlayer(null);
    setMyBet(null);
    setGameState(null);
    setPlayers([]);
    recordedMatchRef.current = null;
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return {
    isConnected,
    roomCode,
    clientRole,
    myPlayer,
    myBet,
    gameState,
    players,
    errorMessage,
    createRoom,
    joinRoom,
    startGame,
    placeBet,
    sendTaps,
    nextRace,
    restartGame,
    leaveRoom,
    clearError,
  };
}
