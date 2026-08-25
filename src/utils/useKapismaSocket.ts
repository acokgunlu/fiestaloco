import { useState, useEffect, useRef, useCallback } from 'react';
import { KapismaGameState, KapismaPlayer, KapismaSettings } from '../types/kapisma';
import { recordMatchResult } from './leaderboardStore';
import { getWsUrl } from './serverUrl';

import { getLang } from '../i18n';
export interface UseKapismaSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  clientRole: 'observer' | 'player' | null;
  myPlayer: KapismaPlayer | null;

  gameState: KapismaGameState | null;
  players: KapismaPlayer[];
  errorMessage: string | null;
  createRoom: (settings?: Partial<KapismaSettings>) => void;
  /**
   * TV YOK modu: odayı kuran telefon aynı anda oyuncu olur.
   * Önce create_room (gözlemci), room_created gelince hemen join_room (oyuncu).
   */
  createAndJoin: (
    playerName: string,
    avatar?: string,
    color?: string,
    colorName?: string,
    settings?: Partial<KapismaSettings>
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
  sendProgress: (p: { x: number; y: number; heading: number; speed: number; offRoad: boolean; lap: number; idx: number; progress: number }) => void;
  nextRace: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
}

export function useKapismaSocket(): UseKapismaSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [clientRole, setClientRole] = useState<'observer' | 'player' | null>(null);
  const [myPlayer, setMyPlayer] = useState<KapismaPlayer | null>(null);

  const [gameState, setGameState] = useState<KapismaGameState | null>(null);
  const [players, setPlayers] = useState<KapismaPlayer[]>([]);
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
              type: 'kapisma:join_room',
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
          if (type === 'kapisma:probe') {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'kapisma:probe_ack', n: msg.n }));
            }
            return;
          }

          if (type === 'kapisma:room_created') {
            setRoomCode(msg.roomCode);
            sessionRef.current.roomCode = msg.roomCode;
            setGameState(msg.gameState);
            setPlayers(msg.players || []);

            const pending = pendingJoinRef.current;
            if (pending) {
              // TV YOK modu: kuran telefon hemen oyuncuya dönüşüyor.
              // Sunucu join sırasında bu soketi gözlemci listesinden çıkarıyor,
              // yoksa her güncelleme iki kez ve iki farklı yükle gelirdi.
              pendingJoinRef.current = null;
              sessionRef.current = {
                ...sessionRef.current,
                role: 'player',
                playerName: pending.playerName,
                avatar: pending.avatar,
                color: pending.color,
                colorName: pending.colorName,
              };
              ws.send(JSON.stringify({
                type: 'kapisma:join_room',
                roomCode: msg.roomCode,
                playerName: pending.playerName,
                name: pending.playerName,
                avatar: pending.avatar,
                color: pending.color,
                colorName: pending.colorName,
                role: 'player',
              }));
            } else {
              setClientRole('observer');
              sessionRef.current.role = 'observer';
            }
            return;
          }
          if (type === 'kapisma:room_joined') {
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
          if (type === 'kapisma:error') {
            setErrorMessage(msg.message || 'Bir sorun oldu.');
            return;
          }

          // BEYAZ LISTE YOK — gameState tasiyan her kapisma:* mesaji durum
          // guncellemesi sayilir. (Trivia'da beyaz liste yuzunden yeni event
          // adlari sessizce dusmus ve oyun kilitlenmisti.)
          if (typeof type === 'string' && type.startsWith('kapisma:') && msg.gameState) {
            const next: KapismaGameState = msg.gameState;
            setGameState(next);
            if (msg.players) setPlayers(msg.players);
            if (msg.myPlayer) setMyPlayer(msg.myPlayer);

            if (
              next.phase === 'GAME_OVER' &&
              msg.players?.length &&
              recordedRef.current !== next.roomCode
            ) {
              recordedRef.current = next.roomCode || null;
              const winner = msg.players.find((p: KapismaPlayer) => p.id === next.winnerPlayerId);
              recordMatchResult({
                gameType: 'timing',
                gameTitle: 'Tam Zamanında',
                gameIcon: '⏱️',
                roomCode: next.roomCode || '',
                players: msg.players.map((p: KapismaPlayer) => ({
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
    (settings?: Partial<KapismaSettings>) => send({ type: 'kapisma:create_room', lang: getLang(), settings }),
    [send]
  );
  const joinRoom = useCallback(
    (
      code: string,
      playerName: string,
      avatar = '🏁',
      color = '#0ea5e9',
      colorName = 'Mavi',
      role: 'observer' | 'player' = 'player'
    ) => {
      sessionRef.current = { ...sessionRef.current, roomCode: code, role, playerName, avatar, color, colorName };
      send({ type: 'kapisma:join_room', roomCode: code, playerName, name: playerName, avatar, color, colorName, role });
    },
    [send]
  );
  const createAndJoin = useCallback(
    (
      playerName: string,
      avatar = '🏁',
      color = '#0ea5e9',
      colorName = 'Mavi',
      settings?: Partial<KapismaSettings>
    ) => {
      pendingJoinRef.current = { playerName, avatar, color, colorName };
      send({ type: 'kapisma:create_room', lang: getLang(), settings });
    },
    [send]
  );
  const startGame = useCallback(() => send({ type: 'kapisma:start_game' }), [send]);
  /**
   * Telefonun kendi arabasinin konumunu sunucuya bildirmesi (~15 Hz).
   * Fizik burada CALISMIYOR — araba bilesende simule ediliyor, bu yalnizca
   * bildirim kanali. Bu yuzden state guncellemesi de yok: her bildirimde
   * React agacini kurmak 15 Hz'de gereksiz is olurdu.
   */
  const sendProgress = useCallback(
    (p: { x: number; y: number; heading: number; speed: number; offRoad: boolean; lap: number; idx: number; progress: number }) =>
      send({ type: 'kapisma:progress', ...p }),
    [send]
  );
  const nextRace = useCallback(() => send({ type: 'kapisma:next_race' }), [send]);
  const restartGame = useCallback(() => send({ type: 'kapisma:restart_game' }), [send]);
  const leaveRoom = useCallback(() => {
    sessionRef.current = {};
    pendingJoinRef.current = null;
    setRoomCode(null); setClientRole(null); setMyPlayer(null);
    setGameState(null); setPlayers([]);
    recordedRef.current = null;
  }, []);

  return {
    isConnected, roomCode, clientRole, myPlayer, gameState, players, errorMessage,
    createRoom, createAndJoin, joinRoom, startGame, sendProgress, nextRace, restartGame, leaveRoom,
  };
}
