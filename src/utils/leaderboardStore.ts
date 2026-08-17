import { getApiUrl } from './serverUrl';

export type GameModuleType =
  | 'imposter'
  | 'codenames'
  | 'bluff'
  | 'bomb'
  | 'verdict'
  | 'trivia_pursuit'
  | 'quiplash';

export interface PlayerStats {
  name: string;
  avatar: string;
  color?: string;
  totalGames: number;
  wins: number;
  totalScore: number;
  highestScore: number;
  wedgesEarned?: number;
  imposterCatches?: number;
  bluffsFooled?: number;
  bombsDefused?: number;
  lastPlayed: number;
  badges: string[];
}

export interface MatchHistoryEntry {
  id: string;
  gameType: GameModuleType;
  gameTitle: string;
  gameIcon: string;
  roomCode?: string;
  playedAt: number;
  winnerName?: string;
  winnerAvatar?: string;
  winnerScore?: number;
  details?: string;
  players: {
    name: string;
    avatar: string;
    score: number;
    isWinner?: boolean;
    roleOrTeam?: string;
  }[];
}

const LEADERBOARD_KEY = 'fiestaloco_leaderboard_v1';
const MATCH_HISTORY_KEY = 'fiestaloco_match_history_v1';

export function getLeaderboard(): Record<string, PlayerStats> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load leaderboard', e);
    return {};
  }
}

export function getMatchHistory(): MatchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MATCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load match history', e);
    return [];
  }
}

export function recordMatchResult(entry: Omit<MatchHistoryEntry, 'id' | 'playedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: MatchHistoryEntry = {
      ...entry,
      id: matchId,
      playedAt: Date.now(),
    };

    // 1. Update Match History (Keep last 50 matches)
    const history = getMatchHistory();
    const updatedHistory = [fullEntry, ...history].slice(0, 50);
    localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(updatedHistory));

    // 2. Update Player Stats
    const leaderboard = getLeaderboard();

    entry.players.forEach((p) => {
      const pKey = p.name.trim().toLowerCase();
      if (!pKey) return;

      const existing: PlayerStats = leaderboard[pKey] || {
        name: p.name.trim(),
        avatar: p.avatar || '😎',
        totalGames: 0,
        wins: 0,
        totalScore: 0,
        highestScore: 0,
        lastPlayed: Date.now(),
        badges: [],
      };

      existing.name = p.name.trim();
      if (p.avatar) existing.avatar = p.avatar;
      existing.totalGames += 1;
      existing.totalScore += Math.max(0, p.score || 0);
      existing.highestScore = Math.max(existing.highestScore, p.score || 0);
      existing.lastPlayed = Date.now();

      if (p.isWinner) {
        existing.wins += 1;
      }

      // Badges detection
      const newBadges = new Set(existing.badges);
      if (existing.totalGames >= 1) newBadges.add('🎮 Çaylak Parti Canavarı');
      if (existing.totalGames >= 5) newBadges.add('🔥 Parti Kıdemlisi');
      if (existing.wins >= 3) newBadges.add('🏆 Seri Şampiyon');
      if (existing.wins >= 10) newBadges.add('👑 Fiesta Efsanesi');
      if (entry.gameType === 'trivia_pursuit' && p.isWinner) newBadges.add('🧠 Bilgi Dâhisi');
      if (entry.gameType === 'bluff' && p.isWinner) newBadges.add('🎭 Usta Yalancı');
      if (entry.gameType === 'bomb' && p.isWinner) newBadges.add('💣 Çelik Sinirli');
      if (entry.gameType === 'codenames' && p.isWinner) newBadges.add('🕵️ Gizli Ajan Lideri');
      if (entry.gameType === 'imposter' && p.isWinner) newBadges.add('🎨 Sanat Dedektifi');
      if (entry.gameType === 'verdict' && p.isWinner) newBadges.add('⚖️ Grup Yargıcı');
      if (entry.gameType === 'quiplash' && p.isWinner) newBadges.add('🥊 Mizah Şampiyonu');

      existing.badges = Array.from(newBadges);
      leaderboard[pKey] = existing;
    });

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (e) {
    console.error('Failed to record match result', e);
  }
}

export function clearAllGameHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEADERBOARD_KEY);
  localStorage.removeItem(MATCH_HISTORY_KEY);
}

// =============================================================================
// GLOBAL (SUNUCU) LEADERBOARD
// =============================================================================
// Sunucu Supabase'e bagliysa skorlar tum cihazlarda ortaktir. Sunucuya
// ulasilamazsa veya kalicilik kapaliysa cagiran taraf localStorage'a duser.

/** Sunucudaki `game_type` degerlerini istemcideki GameModuleType'a cevirir. */
function toModuleType(serverGameType: string): GameModuleType {
  return serverGameType === 'trivia' ? 'trivia_pursuit' : (serverGameType as GameModuleType);
}

const GAME_LABELS: Record<GameModuleType, { title: string; icon: string }> = {
  imposter: { title: 'Imposter Line', icon: '🎨' },
  codenames: { title: 'Codenames', icon: '🕵️' },
  bluff: { title: 'Yalan Ustası', icon: '🎭' },
  bomb: { title: 'Saatli Bomba', icon: '💣' },
  verdict: { title: 'Grup Mahkemesi', icon: '⚖️' },
  trivia_pursuit: { title: 'Trivia Pursuit', icon: '🧠' },
  quiplash: { title: 'Quiplash', icon: '🥊' },
};

/**
 * Global leaderboard'u sunucudan ceker.
 * Kalicilik kapaliysa veya istek basarisizsa `null` doner (cagiran local'e duser).
 */
export async function fetchGlobalLeaderboard(
  limit = 100,
): Promise<Record<string, PlayerStats> | null> {
  try {
    const res = await fetch(getApiUrl(`/api/leaderboard?limit=${limit}`));
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.enabled || !Array.isArray(body.players)) return null;

    const map: Record<string, PlayerStats> = {};
    for (const row of body.players) {
      const key = String(row.name_key ?? row.name ?? '').trim().toLowerCase();
      if (!key) continue;
      map[key] = {
        name: row.name ?? key,
        avatar: row.avatar || '😎',
        color: row.color ?? undefined,
        totalGames: row.total_games ?? 0,
        wins: row.wins ?? 0,
        totalScore: row.total_score ?? 0,
        highestScore: row.highest_score ?? 0,
        wedgesEarned: row.wedges_earned ?? 0,
        imposterCatches: row.imposter_catches ?? 0,
        bluffsFooled: row.bluffs_fooled ?? 0,
        bombsDefused: row.bombs_defused ?? 0,
        lastPlayed: row.last_played ? new Date(row.last_played).getTime() : Date.now(),
        badges: Array.isArray(row.badges) ? row.badges : [],
      };
    }
    return map;
  } catch {
    return null;
  }
}

/**
 * Global mac gecmisini sunucudan ceker.
 * Kalicilik kapaliysa veya istek basarisizsa `null` doner.
 */
export async function fetchGlobalMatchHistory(limit = 50): Promise<MatchHistoryEntry[] | null> {
  try {
    const res = await fetch(getApiUrl(`/api/match-history?limit=${limit}`));
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.enabled || !Array.isArray(body.matches)) return null;

    return body.matches.map((row: any): MatchHistoryEntry => {
      const gameType = toModuleType(String(row.game_type ?? 'imposter'));
      const labels = GAME_LABELS[gameType] ?? { title: row.game_title ?? '', icon: '🎮' };
      return {
        id: String(row.id),
        gameType,
        gameTitle: row.game_title || labels.title,
        gameIcon: row.game_icon || labels.icon,
        roomCode: row.room_code ?? undefined,
        playedAt: row.played_at ? new Date(row.played_at).getTime() : Date.now(),
        winnerName: row.winner_name ?? undefined,
        winnerAvatar: row.winner_avatar ?? undefined,
        winnerScore: row.winner_score ?? undefined,
        details: row.details ?? undefined,
        players: Array.isArray(row.players)
          ? row.players.map((p: any) => ({
              name: p.name ?? '',
              avatar: p.avatar || '😎',
              score: p.score ?? 0,
              isWinner: Boolean(p.isWinner),
              roleOrTeam: p.roleOrTeam ?? undefined,
            }))
          : [],
      };
    });
  } catch {
    return null;
  }
}
