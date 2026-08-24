/**
 * FiestaLoco — oyun sonu tespiti ve mac kaydi olusturma
 * =============================================================================
 * 7 oyun modunun her biri kendi state sekline sahip. Bu modul, jenerik bir oda
 * nesnesinden "oyun bitti mi?" ve "kim kazandi?" sorularini cevaplayip
 * `persistence.recordMatch()` icin ortak bir MatchRecord uretir.
 *
 * Her oyun modu icin `dedupeKey` uretilir; ayni sonuc iki kez yazilmaz.
 */

import type { MatchPlayerRecord, MatchRecord, PersistedGameType } from './persistence';

export interface DetectedMatch {
  dedupeKey: string;
  record: MatchRecord;
}

const GAME_META: Record<PersistedGameType, { title: string; icon: string }> = {
  imposter: { title: 'Imposter Line', icon: '🎨' },
  codenames: { title: 'Codenames', icon: '🕵️' },
  verdict: { title: 'Grup Mahkemesi', icon: '⚖️' },
  bomb: { title: 'Saatli Bomba', icon: '💣' },
  bluff: { title: 'Yalan Ustası', icon: '🎭' },
  trivia: { title: 'Trivia Pursuit', icon: '🧠' },
  quiplash: { title: 'Quiplash', icon: '🥊' },
  race: { title: 'At Yarışı', icon: '🏇' },
};

type AnyPlayer = Record<string, any>;
type AnyRoom = {
  code: string;
  players?: AnyPlayer[];
  gameState?: Record<string, any>;
  gamePhase?: string;
  roundResult?: any;
  /** Oyun moduna ozel diger alanlar (currentRoundNumber, settings, strokes, ...) */
  [key: string]: any;
};

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function basePlayer(p: AnyPlayer, score: number, isWinner: boolean): MatchPlayerRecord {
  return {
    name: String(p.name ?? '').trim(),
    avatar: typeof p.avatar === 'string' ? p.avatar : '',
    color: typeof p.color === 'string' ? p.color : undefined,
    score: Math.max(0, Math.round(score)),
    isWinner,
  };
}

/** En yuksek skora sahip oyuncularin id'leri (beraberlikte hepsi kazanan sayilir). */
function topScorerIds(players: AnyPlayer[], scoreOf: (p: AnyPlayer) => number): Set<string> {
  if (players.length === 0) return new Set();
  const best = Math.max(...players.map(scoreOf));
  return new Set(players.filter((p) => scoreOf(p) === best).map((p) => String(p.id)));
}

/**
 * Oda bitmis bir oyun iceriyorsa kaydedilecek MatchRecord'u dondurur, aksi halde null.
 */
export function detectFinishedMatch(gameType: PersistedGameType, room: AnyRoom): DetectedMatch | null {
  const players = Array.isArray(room.players) ? room.players.filter((p) => p && String(p.name ?? '').trim()) : [];
  if (players.length === 0) return null;

  const meta = GAME_META[gameType];
  const gs = room.gameState ?? {};

  // ---------------------------------------------------------------------------
  // IMPOSTER — tur bazli; her RESULTS fazinda bir tur kaydedilir
  // ---------------------------------------------------------------------------
  if (gameType === 'imposter') {
    if (room.gamePhase !== 'RESULTS' || !room.roundResult) return null;
    const rr = room.roundResult;
    const imposterWon = Boolean(rr.imposterWon);
    const imposter = players.find((p) => p.isImposter);

    const recordPlayers: MatchPlayerRecord[] = players.map((p) => {
      const isWinner = imposterWon ? Boolean(p.isImposter) : !p.isImposter;
      const entry = basePlayer(p, num(p.score), isWinner);
      entry.roleOrTeam = p.isImposter ? 'imposter' : 'crew';
      if (!p.isImposter && Array.isArray(rr.correctVoterIds) && rr.correctVoterIds.includes(p.id)) {
        entry.imposterCatches = 1;
      }
      return entry;
    });

    const winnerEntry = imposterWon
      ? recordPlayers.find((p) => p.roleOrTeam === 'imposter')
      : [...recordPlayers].filter((p) => p.isWinner).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    return {
      dedupeKey: `imposter:${room.code}:${num(rr.roundNumber, num((room as any).currentRoundNumber))}:${rr.imposterId ?? ''}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: winnerEntry?.score,
        details: imposterWon
          ? `Imposter kazandı${imposter ? `: ${imposter.name}` : ''} (gizli kelime: ${rr.imposterWord ?? '?'})`
          : `Ekip imposter'ı yakaladı${imposter ? `: ${imposter.name}` : ''}`,
        players: recordPlayers,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // CODENAMES — takim bazli
  // ---------------------------------------------------------------------------
  if (gameType === 'codenames') {
    if (gs.phase !== 'GAME_OVER' || !gs.winner) return null;
    const winningTeam = String(gs.winner);
    const teamScore = winningTeam === 'red' ? num(gs.redScore) : num(gs.blueScore);

    const recordPlayers: MatchPlayerRecord[] = players.map((p) => {
      const isWinner = String(p.team) === winningTeam;
      const entry = basePlayer(p, isWinner ? Math.max(teamScore, 1) : 0, isWinner);
      entry.roleOrTeam = `${p.team ?? '?'}/${p.role ?? '?'}`;
      return entry;
    });

    const winnerEntry = recordPlayers.find((p) => p.isWinner);

    return {
      dedupeKey: `codenames:${room.code}:${winningTeam}:${gs.winReason ?? ''}:${num(gs.redScore)}-${num(gs.blueScore)}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: teamScore,
        details:
          gs.winReason === 'assassin_triggered'
            ? `${winningTeam === 'red' ? 'Kırmızı' : 'Mavi'} takım kazandı (rakip suikastçıya bastı)`
            : `${winningTeam === 'red' ? 'Kırmızı' : 'Mavi'} takım tüm ajanlarını buldu`,
        players: recordPlayers,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // BOMB — son hayatta kalan kazanir
  // ---------------------------------------------------------------------------
  if (gameType === 'race') {
    if (gs.phase !== 'GAME_OVER') return null;
    const winnerId = gs.winnerPlayerId ? String(gs.winnerPlayerId) : null;

    const recordPlayers: MatchPlayerRecord[] = players.map((p) => {
      const money = num(p.money);
      const entry = basePlayer(p, money, winnerId ? String(p.id) === winnerId : false);
      return entry;
    });

    const winnerEntry = recordPlayers.find((p) => p.isWinner);

    return {
      dedupeKey: `race:${room.code}:${winnerId ?? 'none'}:${num(gs.currentRace)}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: winnerEntry?.score,
        players: recordPlayers,
      },
    };
  }

  if (gameType === 'bomb') {
    if (gs.phase !== 'GAME_OVER') return null;
    const winnerId = gs.winnerPlayerId ? String(gs.winnerPlayerId) : null;

    const recordPlayers: MatchPlayerRecord[] = players.map((p) => {
      const wordsUsed = Array.isArray(p.wordsUsed) ? p.wordsUsed.length : 0;
      const entry = basePlayer(p, wordsUsed, winnerId ? String(p.id) === winnerId : false);
      entry.bombsDefused = wordsUsed;
      return entry;
    });

    const winnerEntry = recordPlayers.find((p) => p.isWinner);

    return {
      dedupeKey: `bomb:${room.code}:${winnerId ?? 'none'}:${num(gs.currentRound)}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: winnerEntry?.score,
        details: winnerEntry ? `Bombadan sağ çıkan: ${winnerEntry.name}` : 'Bomba oyunu tamamlandı',
        players: recordPlayers,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // BLUFF — en yuksek skor kazanir; foolsCount -> bluffsFooled
  // ---------------------------------------------------------------------------
  if (gameType === 'bluff') {
    if (gs.phase !== 'GAME_OVER') return null;
    const winners = topScorerIds(players, (p) => num(p.score));

    const recordPlayers: MatchPlayerRecord[] = players.map((p) => {
      const entry = basePlayer(p, num(p.score), winners.has(String(p.id)));
      entry.bluffsFooled = num(p.foolsCount);
      return entry;
    });

    const winnerEntry = [...recordPlayers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    return {
      dedupeKey: `bluff:${room.code}:${num(gs.currentRound)}:${[...winners].sort().join('|')}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: winnerEntry?.score,
        details: winnerEntry ? `Yalan ustası: ${winnerEntry.name} (${winnerEntry.score} puan)` : undefined,
        players: recordPlayers,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // VERDICT — en yuksek skor kazanir
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // TRIVIA PURSUIT — winnerPlayerId; wedges -> wedgesEarned
  // ---------------------------------------------------------------------------
  if (gameType === 'trivia') {
    if (gs.phase !== 'GAME_OVER') return null;
    const winnerId = gs.winnerPlayerId ? String(gs.winnerPlayerId) : null;
    const fallbackWinners = winnerId ? new Set([winnerId]) : topScorerIds(players, (p) => num(p.score));

    const recordPlayers: MatchPlayerRecord[] = players.map((p) => {
      const entry = basePlayer(p, num(p.score), fallbackWinners.has(String(p.id)));
      entry.wedgesEarned = Array.isArray(p.wedges) ? p.wedges.length : 0;
      return entry;
    });

    const winnerEntry = recordPlayers.find((p) => p.isWinner) ?? recordPlayers[0];

    return {
      dedupeKey: `trivia:${room.code}:${winnerId ?? [...fallbackWinners].sort().join('|')}:${num(gs.roundNumber)}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: winnerEntry?.score,
        details: winnerEntry
          ? `Bilgi şampiyonu: ${winnerEntry.name} (${winnerEntry.wedgesEarned ?? 0} dilim, ${winnerEntry.score} puan)`
          : undefined,
        players: recordPlayers,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // QUIPLASH — winnerPlayerId
  // ---------------------------------------------------------------------------
  if (gameType === 'quiplash') {
    if (gs.phase !== 'GAME_OVER') return null;
    const winnerId = gs.winnerPlayerId ? String(gs.winnerPlayerId) : null;
    const fallbackWinners = winnerId ? new Set([winnerId]) : topScorerIds(players, (p) => num(p.score));

    const recordPlayers = players.map((p) => basePlayer(p, num(p.score), fallbackWinners.has(String(p.id))));
    const winnerEntry = recordPlayers.find((p) => p.isWinner) ?? recordPlayers[0];

    return {
      dedupeKey: `quiplash:${room.code}:${winnerId ?? [...fallbackWinners].sort().join('|')}:${num(gs.currentRound)}`,
      record: {
        gameType,
        gameTitle: meta.title,
        gameIcon: meta.icon,
        roomCode: room.code,
        winnerName: winnerEntry?.name,
        winnerAvatar: winnerEntry?.avatar,
        winnerScore: winnerEntry?.score,
        details: winnerEntry ? `Mizah düellosu galibi: ${winnerEntry.name} (${winnerEntry.score} puan)` : undefined,
        players: recordPlayers,
      },
    };
  }

  return null;
}
