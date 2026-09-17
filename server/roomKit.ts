import { WebSocket } from 'ws';
import { asContentLang, type ContentLang } from '../src/data/contentLang';
import type { PersistedGameType } from './persistence';

/**
 * ODA KİTİ — Kale Kuşatması ve İl İl Fetih için ortak oda iskeleti
 * =================================================================
 * server.ts'deki her oyun oda kurma, katılma, yeniden bağlanma, yayın ve
 * kopma işini kendi içinde tekrar yazıyor. Yeni iki oyun bu tekrarı bu
 * dosyadan alıyor; oyun modülleri yalnızca KURALLARI yazıyor.
 *
 * Mesaj sözleşmesi diğer oyunlarla birebir aynı (istemci kancaları aynı
 * deseni izliyor): `<önek>:create_room`, `<önek>:join_room`,
 * `<önek>:room_created`, `<önek>:room_joined`, `<önek>:error` ve gameState
 * taşıyan her `<önek>:*` durum güncellemesi. Oyuncuya giden pakette ayrıca
 * `myPlayer` var.
 */

export interface KitClient {
  ws: WebSocket;
  roomCode?: string;
  role?: 'observer' | 'player';
  playerId?: string;
  gameType?: string;
}

export interface KitHost {
  clientMap: Map<WebSocket, KitClient>;
  generateRoomCode(): string;
  recordMatch(gameType: PersistedGameType, room: unknown): void;
  forgetRoom(gameType: PersistedGameType, roomCode: string): void;
}

export interface KitPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  colorName: string;
  connected?: boolean;
  isHost?: boolean;
}

export interface KitRoom<GS extends { phase: string; timerSeconds: number }, P extends KitPlayer> {
  code: string;
  lang: ContentLang;
  observers: Set<WebSocket>;
  playerSockets: Map<string, WebSocket>;
  players: P[];
  gameState: GS;
  /** Adı `timer` ile bitiyor: snapshot'a yazılmıyor, geri yüklemede sıfırlanıyor. */
  phaseTimer: ReturnType<typeof setInterval> | null;
}

export interface RoomKitOptions<GS extends { phase: string; timerSeconds: number }, P extends KitPlayer, R extends KitRoom<GS, P>> {
  gameType: PersistedGameType;
  prefix: string;
  newRoom(code: string, lang: ContentLang, data: any): R;
  newPlayer(room: R, data: any, id: string): P;
  /** Oyun sürerken gelen yeni oyuncuyu oyuna sokmak için (takım, il…). */
  onPlayerAdded?(room: R, player: P): void;
  /** create/join dışındaki her `<önek>:<eylem>` mesajı. */
  onAction(room: R, client: KitClient, action: string, data: any, receivedAt: number): void;
  /**
   * Sunucu yeniden başlayıp oda snapshot'tan döndüğünde zamanlayıcı yoktur.
   * İlk bağlantıda oyun modülü süren fazın zamanlayıcısını yeniden kurar.
   */
  onResume?(room: R): void;
}

export function createRoomKit<GS extends { phase: string; timerSeconds: number }, P extends KitPlayer, R extends KitRoom<GS, P>>(
  host: KitHost,
  opts: RoomKitOptions<GS, P, R>,
) {
  const rooms = new Map<string, R>();
  const { prefix, gameType } = opts;

  const sendTo = (ws: WebSocket, payload: unknown) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  };

  function broadcast(room: R, eventType = `${prefix}:state`): void {
    host.recordMatch(gameType, room);
    const base = { gameState: { ...room.gameState, roomCode: room.code }, players: room.players };
    for (const player of room.players) {
      const ws = room.playerSockets.get(player.id);
      if (ws) sendTo(ws, { type: eventType, ...base, myPlayer: player });
    }
    const tv = JSON.stringify({ type: eventType, ...base });
    room.observers.forEach((ws) => { if (ws.readyState === WebSocket.OPEN) ws.send(tv); });
  }

  function stopTimer(room: R): void {
    if (room.phaseTimer) {
      clearInterval(room.phaseTimer);
      room.phaseTimer = null;
    }
  }

  /**
   * Faz geri sayımı: her saniye `timerSeconds` düşüp yayınlanıyor, sıfırda
   * `onEnd`. Oda haritadan silinmiş ya da yerine yenisi konmuşsa (geri
   * yükleme) eski zamanlayıcı kendini kapatıyor.
   */
  function runTimer(room: R, seconds: number, onEnd: () => void): void {
    stopTimer(room);
    room.gameState.timerSeconds = seconds;
    broadcast(room);
    room.phaseTimer = setInterval(() => {
      if (rooms.get(room.code) !== room) {
        stopTimer(room);
        return;
      }
      room.gameState.timerSeconds -= 1;
      if (room.gameState.timerSeconds <= 0) {
        room.gameState.timerSeconds = 0;
        stopTimer(room);
        onEnd();
      } else {
        broadcast(room);
      }
    }, 1000);
  }

  /** Şu an bağlı oyuncular — "herkes cevapladı mı" kontrolleri bunu sayıyor. */
  function connectedIds(room: R): string[] {
    return room.players.filter((p) => room.playerSockets.has(p.id)).map((p) => p.id);
  }

  function handleMessage(ws: WebSocket, type: string, data: any, receivedAt: number): boolean {
    if (typeof type !== 'string' || !type.startsWith(`${prefix}:`)) return false;
    const action = type.slice(prefix.length + 1);

    if (action === 'create_room') {
      const code = host.generateRoomCode();
      const room = opts.newRoom(code, asContentLang(data.lang), data);
      room.observers.add(ws);
      rooms.set(code, room);
      host.clientMap.set(ws, { ws, roomCode: code, role: 'observer', gameType });
      sendTo(ws, { type: `${prefix}:room_created`, roomCode: code, gameState: { ...room.gameState, roomCode: code }, players: room.players });
      return true;
    }

    if (action === 'join_room') {
      const code = String(data.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) {
        sendTo(ws, { type: `${prefix}:error`, message: `Oda bulunamadı: "${code}"` });
        return true;
      }

      if (data.role === 'observer') {
        room.observers.add(ws);
        host.clientMap.set(ws, { ws, roomCode: code, role: 'observer', gameType });
        sendTo(ws, { type: `${prefix}:room_joined`, roomCode: code, role: 'observer', gameState: { ...room.gameState, roomCode: code }, players: room.players });
      } else {
        const wantedId = typeof data.playerId === 'string' ? data.playerId : '';
        let player = wantedId ? room.players.find((p) => p.id === wantedId) : undefined;
        const isNew = !player;
        if (!player) {
          if (room.players.length >= 12) {
            sendTo(ws, { type: `${prefix}:error`, message: 'Oda dolu (en fazla 12 oyuncu).' });
            return true;
          }
          const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          player = opts.newPlayer(room, data, id);
          player.isHost = room.players.length === 0;
          room.players.push(player);
        }
        player.connected = true;

        // Aynı oyuncu ikinci sekmeden bağlanırsa eski soket boşa düşsün
        const previous = room.playerSockets.get(player.id);
        if (previous && previous !== ws) host.clientMap.set(previous, { ws: previous });

        room.observers.delete(ws);
        room.playerSockets.set(player.id, ws);
        host.clientMap.set(ws, { ws, roomCode: code, role: 'player', playerId: player.id, gameType });
        if (isNew && opts.onPlayerAdded) opts.onPlayerAdded(room, player);
        sendTo(ws, {
          type: `${prefix}:room_joined`, roomCode: code, role: 'player', playerId: player.id, player,
          gameState: { ...room.gameState, roomCode: code }, players: room.players,
        });
      }

      if (!room.phaseTimer && opts.onResume) opts.onResume(room);
      broadcast(room);
      return true;
    }

    const client = host.clientMap.get(ws);
    if (!client?.roomCode || client.gameType !== gameType) return true;
    const room = rooms.get(client.roomCode);
    if (!room) return true;
    opts.onAction(room, client, action, data, receivedAt);
    return true;
  }

  function handleClose(ws: WebSocket, client: KitClient): boolean {
    if (client.gameType !== gameType || !client.roomCode) return false;
    const code = client.roomCode;
    const room = rooms.get(code);
    if (!room) return true;

    if (client.role === 'observer') {
      room.observers.delete(ws);
    } else if (client.playerId && room.playerSockets.get(client.playerId) === ws) {
      room.playerSockets.delete(client.playerId);
      const p = room.players.find((pl) => pl.id === client.playerId);
      if (p) p.connected = false;
    }
    broadcast(room);

    if (room.observers.size === 0 && room.playerSockets.size === 0) {
      setTimeout(() => {
        const cur = rooms.get(code);
        if (cur && cur.observers.size === 0 && cur.playerSockets.size === 0) {
          stopTimer(cur);
          rooms.delete(code);
          host.forgetRoom(gameType, code);
        }
      }, 180000);
    }
    return true;
  }

  return { rooms, broadcast, runTimer, stopTimer, connectedIds, handleMessage, handleClose, sendTo };
}

/** Kullanıcıdan gelen ad/renk alanlarını güvenli hale getirir. */
export function playerBasics(data: any, fallbackAvatar: string): Omit<KitPlayer, 'id'> {
  const str = (v: unknown, max: number, fallback: string) =>
    typeof v === 'string' && v.trim() ? v.trim().substring(0, max) : fallback;
  return {
    name: str(data.playerName ?? data.name, 18, 'Oyuncu'),
    avatar: str(data.avatar, 8, fallbackAvatar),
    color: /^#[0-9a-fA-F]{6}$/.test(String(data.color)) ? String(data.color) : '#ef4444',
    colorName: str(data.colorName, 20, 'Kırmızı'),
    connected: true,
  };
}
