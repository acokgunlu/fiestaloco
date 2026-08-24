/**
 * FiestaLoco — Supabase kalicilik katmani
 * =============================================================================
 * Iki isi yapar:
 *
 *  1) LEADERBOARD + MAC GECMISI (kalici)
 *     Oyun bitince `recordMatch()` cagirilir; Supabase'deki `record_match` RPC'si
 *     hem `match_history` satirini yazar hem de tum oyuncularin `player_stats`
 *     kayitlarini atomik olarak gunceller.
 *
 *  2) ODA SNAPSHOT'LARI (restart/deploy dayanikliligi)
 *     Aktif odalarin state'i periyodik olarak `room_snapshots` tablosuna yazilir.
 *     Sunucu yeniden basladiginda `loadRoomSnapshots()` ile geri yuklenir; oyuncu
 *     ve TV baglantilari otomatik reconnect edip ayni oda koduna geri girer.
 *
 * Supabase env degiskenleri tanimli degilse tum fonksiyonlar sessizce no-op olur
 * ve sunucu eskisi gibi salt bellek-ici calisir. Yani DB olmadan da ayakta kalir.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Kurulum
// -----------------------------------------------------------------------------

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

/** Snapshot yazma araligi (ms). 0 veya negatifse periyodik yazim kapanir. */
export const SNAPSHOT_INTERVAL_MS = Math.max(
  0,
  Number(process.env.SNAPSHOT_INTERVAL_MS ?? 15000) || 0,
);

/** Bu yastan eski snapshot'lar acilista geri yuklenmez (dakika). */
const SNAPSHOT_MAX_AGE_MINUTES = Math.max(1, Number(process.env.SNAPSHOT_MAX_AGE_MINUTES ?? 180) || 180);

let client: SupabaseClient | null = null;
let lastError: string | null = null;
let writes = 0;
let failures = 0;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log('[persistence] Supabase baglantisi aktif:', SUPABASE_URL);
} else {
  console.log(
    '[persistence] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanimli degil — ' +
      'sunucu salt bellek-ici modda calisiyor (leaderboard ve snapshot kapali).',
  );
}

export function isPersistenceEnabled(): boolean {
  return client !== null;
}

export function persistenceStatus() {
  return {
    enabled: client !== null,
    snapshotIntervalMs: SNAPSHOT_INTERVAL_MS,
    writes,
    failures,
    lastError,
  };
}

function noteFailure(scope: string, error: unknown): void {
  failures += 1;
  lastError = `${scope}: ${error instanceof Error ? error.message : String(error)}`;
  console.error(`[persistence] ${lastError}`);
}

// -----------------------------------------------------------------------------
// Oyun tipleri
// -----------------------------------------------------------------------------

export type PersistedGameType =
  | 'imposter'
  | 'codenames'
  | 'verdict'
  | 'bomb'
  | 'bluff'
  | 'trivia'
  | 'quiplash'
  | 'race'
  | 'colory'
  | 'timing';

// -----------------------------------------------------------------------------
// Leaderboard / mac gecmisi
// -----------------------------------------------------------------------------

export interface MatchPlayerRecord {
  name: string;
  avatar?: string;
  color?: string;
  score?: number;
  isWinner?: boolean;
  roleOrTeam?: string;
  wedgesEarned?: number;
  imposterCatches?: number;
  bluffsFooled?: number;
  bombsDefused?: number;
  badges?: string[];
}

export interface MatchRecord {
  gameType: PersistedGameType;
  gameTitle?: string;
  gameIcon?: string;
  roomCode?: string;
  winnerName?: string;
  winnerAvatar?: string;
  winnerScore?: number;
  details?: string;
  players: MatchPlayerRecord[];
}

/** Bir mac sonucunu kalici olarak yazar. Hata durumunda oyunu bloklamaz. */
export async function recordMatch(match: MatchRecord): Promise<void> {
  if (!client) return;

  const players = (match.players || []).filter((p) => p && typeof p.name === 'string' && p.name.trim());
  if (players.length === 0) return;

  try {
    const { error } = await client.rpc('record_match', {
      p_game_type: match.gameType,
      p_game_title: match.gameTitle ?? '',
      p_game_icon: match.gameIcon ?? '',
      p_room_code: match.roomCode ?? null,
      p_winner_name: match.winnerName ?? null,
      p_winner_avatar: match.winnerAvatar ?? null,
      p_winner_score: match.winnerScore ?? null,
      p_details: match.details ?? null,
      p_players: players,
    });
    if (error) throw error;
    writes += 1;
  } catch (error) {
    noteFailure(`recordMatch(${match.gameType})`, error);
  }
}

export async function fetchLeaderboard(limit = 100) {
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('player_stats')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 500));
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    noteFailure('fetchLeaderboard', error);
    return [];
  }
}

export async function fetchMatchHistory(limit = 50, gameType?: string) {
  if (!client) return [];
  try {
    let query = client
      .from('match_history')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200));
    if (gameType) query = query.eq('game_type', gameType);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    noteFailure('fetchMatchHistory', error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Oda snapshot'lari
// -----------------------------------------------------------------------------

/**
 * Oda nesnesindeki serilestirilemez alanlari atar:
 *  - WebSocket referanslari (observers, playerSockets, hostSocketId)
 *  - NodeJS.Timeout handle'lari (adi *Timer / *Interval / *Timeout ile biten alanlar)
 */
const NON_SERIALIZABLE_KEYS = new Set(['observers', 'playerSockets', 'hostSocketId']);

function isTimerKey(key: string): boolean {
  return /(timer|interval|timeout|handle)$/i.test(key);
}

export function serializeRoom(room: unknown): Record<string, unknown> {
  const seen = new WeakSet<object>();

  const walk = (value: unknown, key = ''): unknown => {
    if (value === null || value === undefined) return value;

    const t = typeof value;
    if (t === 'function' || t === 'symbol' || t === 'bigint') return undefined;
    if (t !== 'object') return value;

    // Timer handle'lari ve socket benzeri nesneler
    if (NON_SERIALIZABLE_KEYS.has(key) || isTimerKey(key)) return undefined;
    if (value instanceof Map || value instanceof Set) return undefined;

    const obj = value as Record<string, unknown>;
    // ws / http.Server gibi nesneleri kabaca ele
    if (typeof (obj as { readyState?: unknown }).readyState === 'number' && typeof (obj as { send?: unknown }).send === 'function') {
      return undefined;
    }
    if (seen.has(obj)) return undefined;
    seen.add(obj);

    if (Array.isArray(value)) {
      return value.map((item) => walk(item)).filter((item) => item !== undefined);
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const next = walk(v, k);
      if (next !== undefined) out[k] = next;
    }
    return out;
  };

  return (walk(room) as Record<string, unknown>) ?? {};
}

export interface SnapshotMeta {
  phase?: string | null;
  playerCount?: number;
}

/** Tek bir odanin state'ini yazar (upsert). */
export async function saveRoomSnapshot(
  gameType: PersistedGameType,
  roomCode: string,
  room: unknown,
  meta: SnapshotMeta = {},
): Promise<void> {
  if (!client) return;
  try {
    const { error } = await client.from('room_snapshots').upsert(
      {
        game_type: gameType,
        room_code: roomCode,
        phase: meta.phase ?? null,
        player_count: meta.playerCount ?? 0,
        state: serializeRoom(room),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'game_type,room_code' },
    );
    if (error) throw error;
    writes += 1;
  } catch (error) {
    noteFailure(`saveRoomSnapshot(${gameType}/${roomCode})`, error);
  }
}

/** Birden fazla odayi tek istekte yazar. */
export async function saveRoomSnapshots(
  entries: Array<{ gameType: PersistedGameType; roomCode: string; room: unknown; meta?: SnapshotMeta }>,
): Promise<void> {
  if (!client || entries.length === 0) return;
  try {
    const now = new Date().toISOString();
    const rows = entries.map((e) => ({
      game_type: e.gameType,
      room_code: e.roomCode,
      phase: e.meta?.phase ?? null,
      player_count: e.meta?.playerCount ?? 0,
      state: serializeRoom(e.room),
      updated_at: now,
    }));
    const { error } = await client.from('room_snapshots').upsert(rows, { onConflict: 'game_type,room_code' });
    if (error) throw error;
    writes += 1;
  } catch (error) {
    noteFailure(`saveRoomSnapshots(${entries.length} oda)`, error);
  }
}

export async function deleteRoomSnapshot(gameType: PersistedGameType, roomCode: string): Promise<void> {
  if (!client) return;
  try {
    const { error } = await client
      .from('room_snapshots')
      .delete()
      .eq('game_type', gameType)
      .eq('room_code', roomCode);
    if (error) throw error;
  } catch (error) {
    noteFailure(`deleteRoomSnapshot(${gameType}/${roomCode})`, error);
  }
}

export interface LoadedSnapshot {
  gameType: PersistedGameType;
  roomCode: string;
  state: Record<string, unknown>;
  updatedAt: string;
}

/** Acilista taze snapshot'lari yukler (eskiler atlanir ve temizlenir). */
export async function loadRoomSnapshots(): Promise<LoadedSnapshot[]> {
  if (!client) return [];
  try {
    const cutoff = new Date(Date.now() - SNAPSHOT_MAX_AGE_MINUTES * 60_000).toISOString();
    const { data, error } = await client
      .from('room_snapshots')
      .select('game_type, room_code, state, updated_at')
      .gte('updated_at', cutoff);
    if (error) throw error;

    return (data ?? []).map((row) => ({
      gameType: row.game_type as PersistedGameType,
      roomCode: row.room_code as string,
      state: (row.state ?? {}) as Record<string, unknown>,
      updatedAt: row.updated_at as string,
    }));
  } catch (error) {
    noteFailure('loadRoomSnapshots', error);
    return [];
  }
}

/** Eski snapshot'lari temizler; silinen satir sayisini dondurur. */
export async function pruneStaleSnapshots(olderThanHours = 12): Promise<number> {
  if (!client) return 0;
  try {
    const { data, error } = await client.rpc('prune_stale_room_snapshots', {
      p_older_than_hours: olderThanHours,
    });
    if (error) throw error;
    return typeof data === 'number' ? data : 0;
  } catch (error) {
    noteFailure('pruneStaleSnapshots', error);
    return 0;
  }
}
