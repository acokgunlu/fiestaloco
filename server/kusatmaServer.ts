import type { ContentLang } from '../src/data/contentLang';
import {
  drawQuizQuestion,
  isQuizCategory,
  pickCategoryChoices,
  tallyCategoryVote,
  type QuizCategoryId,
} from '../src/data/quizBank';
import {
  KUSATMA_TIMES,
  KUSATMA_WALL,
  hitDamage,
  otherTeam,
  rebalanceTeams,
  smallerTeam,
  teamDamage,
} from '../src/data/kusatmaLogic';
import type {
  KusatmaGameState,
  KusatmaPick,
  KusatmaPlayer,
  KusatmaSettings,
  KusatmaTeam,
} from '../src/types/kusatma';
import { createRoomKit, playerBasics, type KitHost, type KitRoom } from './roomKit';

/**
 * KALE KUŞATMASI — sunucu
 * Tur: VOTE → QUESTION → REVEAL → (sur yıkıldı ya da turlar bitti) GAME_OVER
 */

interface KusatmaRoom extends KitRoom<KusatmaGameState, KusatmaPlayer> {
  /** Doğru şıkkın sırası — açıklamaya kadar yalnızca sunucuda. */
  answerIdx: number;
  fact?: string;
  askedAt: number;
  answers: Record<string, { choice: number; ms: number }>;
  /** Soru açıldığında bağlı olan oyuncular: cevap vermeyen takım ortalamasını düşürür. */
  activeIds: string[];
  usedQuestionIds: string[];
  lastCategory: QuizCategoryId | null;
}

function freshState(settings?: Partial<KusatmaSettings>): KusatmaGameState {
  return {
    phase: 'LOBBY',
    isOnline: true,
    gameId: Date.now(),
    round: 0,
    settings: { totalRounds: Math.max(4, Math.min(20, Number(settings?.totalRounds) || 10)) },
    timerSeconds: 0,
    walls: { red: KUSATMA_WALL, blue: KUSATMA_WALL },
    catapultUsed: { red: false, blue: false },
    catapultArmed: { red: false, blue: false },
    vote: null,
    category: null,
    question: null,
    answeredIds: [],
    result: null,
    winnerTeam: null,
    winnerPlayerId: null,
  };
}

export function createKusatmaServer(host: KitHost) {
  const kit = createRoomKit<KusatmaGameState, KusatmaPlayer, KusatmaRoom>(host, {
    gameType: 'kusatma',
    prefix: 'kusatma',

    newRoom: (code: string, lang: ContentLang, data: any): KusatmaRoom => ({
      code,
      lang,
      observers: new Set(),
      playerSockets: new Map(),
      players: [],
      gameState: freshState(data.settings),
      phaseTimer: null,
      answerIdx: -1,
      askedAt: 0,
      answers: {},
      activeIds: [],
      usedQuestionIds: [],
      lastCategory: null,
    }),

    newPlayer: (room, data, id) => ({
      id,
      ...playerBasics(data, '🏰'),
      team: smallerTeam(room.players),
      score: 0,
      correctCount: 0,
    }),

    onAction(room, client, action, data, receivedAt) {
      const gs = room.gameState;
      const me = client.playerId ? room.players.find((p) => p.id === client.playerId) : undefined;

      switch (action) {
        case 'switch_team': {
          if (!me || gs.phase !== 'LOBBY') return;
          me.team = otherTeam(me.team);
          kit.broadcast(room);
          return;
        }
        case 'start_game': {
          if (gs.phase !== 'LOBBY' && gs.phase !== 'GAME_OVER') return;
          if (room.players.length < 2) {
            kit.sendTo(client.ws, { type: 'kusatma:error', message: 'En az 2 oyuncu gerekli.' });
            return;
          }
          rebalanceTeams(room.players);
          room.players.forEach((p) => { p.score = 0; p.correctCount = 0; });
          room.gameState = { ...freshState(gs.settings), round: 1 };
          room.usedQuestionIds = [];
          room.lastCategory = null;
          startVote(room);
          return;
        }
        case 'vote': {
          if (!me || gs.phase !== 'VOTE' || !gs.vote) return;
          if (!isQuizCategory(data.category) || !gs.vote.options.includes(data.category)) return;
          gs.vote.votes[me.id] = data.category;
          const waiting = kit.connectedIds(room).some((id) => !gs.vote!.votes[id]);
          if (waiting) kit.broadcast(room);
          else endVote(room);
          return;
        }
        case 'answer': {
          if (!me || gs.phase !== 'QUESTION' || room.answers[me.id]) return;
          const choice = Number(data.choice);
          if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
          room.answers[me.id] = { choice, ms: Math.max(0, receivedAt - room.askedAt) };
          gs.answeredIds = Object.keys(room.answers);
          const waiting = kit.connectedIds(room).some((id) => !room.answers[id]);
          if (waiting) kit.broadcast(room);
          else endQuestion(room);
          return;
        }
        case 'arm_catapult': {
          if (!me || (gs.phase !== 'VOTE' && gs.phase !== 'QUESTION')) return;
          if (gs.catapultUsed[me.team] || gs.catapultArmed[me.team]) return;
          gs.catapultArmed[me.team] = true;
          kit.broadcast(room, 'kusatma:catapult');
          return;
        }
        case 'restart_game': {
          kit.stopTimer(room);
          room.players.forEach((p) => { p.score = 0; p.correctCount = 0; });
          room.gameState = freshState(gs.settings);
          kit.broadcast(room);
          return;
        }
      }
    },

    onResume(room) {
      const gs = room.gameState;
      const left = Math.max(3, gs.timerSeconds);
      if (gs.phase === 'VOTE') kit.runTimer(room, left, () => endVote(room));
      else if (gs.phase === 'QUESTION') {
        // Sunucu kapanırken sorulan sorunun zamanı kaybolmuş olabilir; hız puanı adil kalsın diye yeniden başlat.
        room.askedAt = Date.now();
        kit.runTimer(room, left, () => endQuestion(room));
      } else if (gs.phase === 'REVEAL') kit.runTimer(room, left, () => afterReveal(room));
    },
  });

  function startVote(room: KusatmaRoom) {
    const gs = room.gameState;
    gs.phase = 'VOTE';
    gs.vote = { options: pickCategoryChoices(room.lastCategory), votes: {} };
    gs.category = null;
    gs.question = null;
    gs.answeredIds = [];
    gs.result = null;
    kit.runTimer(room, KUSATMA_TIMES.vote, () => endVote(room));
  }

  function endVote(room: KusatmaRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'VOTE' || !gs.vote) return;
    const category = tallyCategoryVote(gs.vote.options, gs.vote.votes);
    const q = drawQuizQuestion(room.lang, category, room.usedQuestionIds);
    room.usedQuestionIds.push(q.id);
    room.lastCategory = category;
    room.answerIdx = q.c;
    room.fact = q.fact;
    room.answers = {};
    room.activeIds = kit.connectedIds(room);
    room.askedAt = Date.now();

    gs.category = category;
    gs.question = { id: q.id, category: q.category, q: q.q, o: q.o };
    gs.answeredIds = [];
    gs.phase = 'QUESTION';
    kit.runTimer(room, KUSATMA_TIMES.question, () => endQuestion(room));
  }

  function endQuestion(room: KusatmaRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'QUESTION') return;

    const picks: KusatmaPick[] = [];
    for (const p of room.players) {
      const a = room.answers[p.id];
      if (!a && !room.activeIds.includes(p.id)) continue;   // soru açıldığında yoktu
      const correct = !!a && a.choice === room.answerIdx;
      const damage = correct ? hitDamage(a!.ms) : 0;
      if (correct) {
        p.score += damage;
        p.correctCount += 1;
      }
      picks.push({ playerId: p.id, team: p.team, choice: a ? a.choice : null, ms: a ? a.ms : null, correct, damage });
    }

    const damage: Record<KusatmaTeam, number> = { red: 0, blue: 0 };
    const catapult: Record<KusatmaTeam, boolean> = { red: false, blue: false };
    for (const team of ['red', 'blue'] as KusatmaTeam[]) {
      const fired = gs.catapultArmed[team];
      damage[team] = teamDamage(picks.filter((x) => x.team === team).map((x) => x.damage), fired);
      catapult[team] = fired;
      if (fired) {
        gs.catapultArmed[team] = false;
        gs.catapultUsed[team] = true;
      }
    }
    gs.walls.blue = Math.max(0, gs.walls.blue - damage.red);
    gs.walls.red = Math.max(0, gs.walls.red - damage.blue);

    gs.result = { correct: room.answerIdx, fact: room.fact, picks, damage, catapult };
    gs.phase = 'REVEAL';
    kit.runTimer(room, KUSATMA_TIMES.reveal, () => afterReveal(room));
  }

  function afterReveal(room: KusatmaRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'REVEAL') return;
    if (gs.walls.red <= 0 || gs.walls.blue <= 0 || gs.round >= gs.settings.totalRounds) {
      finish(room);
      return;
    }
    gs.round += 1;
    startVote(room);
  }

  function finish(room: KusatmaRoom) {
    const gs = room.gameState;
    kit.stopTimer(room);
    let winner: KusatmaTeam | 'draw';
    if (gs.walls.red <= 0 && gs.walls.blue <= 0) winner = 'draw';
    else if (gs.walls.red <= 0) winner = 'blue';
    else if (gs.walls.blue <= 0) winner = 'red';
    else if (gs.walls.red === gs.walls.blue) winner = 'draw';
    else winner = gs.walls.red > gs.walls.blue ? 'red' : 'blue';

    const pool = winner === 'draw' ? room.players : room.players.filter((p) => p.team === winner);
    const mvp = [...pool].sort((a, b) => b.score - a.score)[0];
    gs.winnerTeam = winner;
    gs.winnerPlayerId = mvp?.id ?? null;
    gs.phase = 'GAME_OVER';
    gs.timerSeconds = 0;
    kit.broadcast(room, 'kusatma:game_over');
  }

  return kit;
}
