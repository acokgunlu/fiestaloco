import type { ContentLang } from '../src/data/contentLang';
import {
  drawQuizQuestion,
  isQuizCategory,
  pickCategoryChoices,
  tallyCategoryVote,
  type QuizCategoryId,
} from '../src/data/quizBank';
import { FETIH_PROVINCE_IDS, areNeighbors } from '../src/data/fetihMap';
import {
  FASTEST_BONUS,
  FETIH_TIMES,
  QUIZ_BONUS,
  baseIncome,
  banditRaid,
  ownedProvinces,
  production,
  resolveOrders,
  respawnEliminated,
  rollDice,
  setupBoard,
  shuffled,
  totalTroops,
  uniqueColor,
  type FetihOrderInput,
} from '../src/data/fetihLogic';
import type { FetihGameState, FetihPlayer, FetihSettings } from '../src/types/fetih';
import type { QuizPick } from '../src/types/quizRound';
import { createRoomKit, playerBasics, type KitHost, type KitRoom } from './roomKit';

/**
 * İL İL FETİH — sunucu
 * Tur: VOTE → QUESTION → ROLL → ORDERS → RESOLVE → … → GAME_OVER
 */

interface FetihRoom extends KitRoom<FetihGameState, FetihPlayer> {
  answerIdx: number;
  fact?: string;
  askedAt: number;
  answers: Record<string, { choice: number; ms: number }>;
  activeIds: string[];
  usedQuestionIds: string[];
  lastCategory: QuizCategoryId | null;
  /** Gizli emirler — RESOLVE'a kadar yalnızca sunucuda. */
  orders: Record<string, FetihOrderInput>;
}

function emptyTiles(): FetihGameState['tiles'] {
  const tiles: FetihGameState['tiles'] = {};
  for (const id of FETIH_PROVINCE_IDS) tiles[id] = { owner: null, troops: 1, token: 0 };
  return tiles;
}

function freshState(settings?: Partial<FetihSettings>): FetihGameState {
  return {
    phase: 'LOBBY',
    isOnline: true,
    gameId: Date.now(),
    round: 0,
    settings: { totalRounds: Math.max(4, Math.min(20, Number(settings?.totalRounds) || 10)) },
    timerSeconds: 0,
    tiles: emptyTiles(),
    vote: null,
    category: null,
    question: null,
    answeredIds: [],
    quiz: null,
    roll: null,
    submittedIds: [],
    initiative: [],
    battles: [],
    winnerPlayerId: null,
  };
}

const RESOLVE_SECONDS = (battles: number) => Math.max(6, Math.min(16, 4 + Math.ceil(battles * 1.5)));

export function createFetihServer(host: KitHost) {
  const kit = createRoomKit<FetihGameState, FetihPlayer, FetihRoom>(host, {
    gameType: 'fetih',
    prefix: 'fetih',

    newRoom: (code: string, lang: ContentLang, data: any): FetihRoom => ({
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
      orders: {},
    }),

    newPlayer: (room, data, id) => {
      const basics = playerBasics(data, '🚩');
      basics.color = uniqueColor(basics.color, room.players.map((p) => p.color));
      return { id, ...basics, score: 0, reserve: 0, attacks: 0, correctCount: 0, respawns: 0 };
    },

    /** Oyun sürerken gelen oyuncu boş bir ilde başlıyor. */
    onPlayerAdded(room, player) {
      const gs = room.gameState;
      if (gs.phase === 'LOBBY' || gs.phase === 'GAME_OVER') return;
      respawnEliminated(gs.tiles, [player.id]);
      player.score = ownedProvinces(gs.tiles, player.id).length;
    },

    onAction(room, client, action, data, receivedAt) {
      const gs = room.gameState;
      const me = client.playerId ? room.players.find((p) => p.id === client.playerId) : undefined;

      switch (action) {
        case 'start_game': {
          if (gs.phase !== 'LOBBY' && gs.phase !== 'GAME_OVER') return;
          if (room.players.length < 2) {
            kit.sendTo(client.ws, { type: 'fetih:error', message: 'En az 2 oyuncu gerekli.' });
            return;
          }
          const state = { ...freshState(gs.settings), round: 1 };
          state.tiles = setupBoard(room.players.map((p) => p.id));
          room.gameState = state;
          room.players.forEach((p) => {
            p.score = ownedProvinces(state.tiles, p.id).length;
            p.reserve = 0;
            p.attacks = 0;
            p.correctCount = 0;
            p.respawns = 0;
          });
          room.usedQuestionIds = [];
          room.lastCategory = null;
          startVote(room);
          return;
        }
        case 'vote': {
          if (!me || gs.phase !== 'VOTE' || !gs.vote) return;
          if (!isQuizCategory(data.category) || !gs.vote.options.includes(data.category)) return;
          gs.vote.votes[me.id] = data.category;
          if (kit.connectedIds(room).some((id) => !gs.vote!.votes[id])) kit.broadcast(room);
          else endVote(room);
          return;
        }
        case 'answer': {
          if (!me || gs.phase !== 'QUESTION' || room.answers[me.id]) return;
          const choice = Number(data.choice);
          if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
          room.answers[me.id] = { choice, ms: Math.max(0, receivedAt - room.askedAt) };
          gs.answeredIds = Object.keys(room.answers);
          if (kit.connectedIds(room).some((id) => !room.answers[id])) kit.broadcast(room);
          else endQuestion(room);
          return;
        }
        case 'orders': {
          if (!me || gs.phase !== 'ORDERS') return;
          const place = Number.isInteger(data.place) && gs.tiles[data.place]?.owner === me.id ? Number(data.place) : null;
          const attacks = (Array.isArray(data.attacks) ? data.attacks : [])
            .map((a: any) => ({ from: Number(a?.from), to: Number(a?.to) }))
            .filter((a: { from: number; to: number }) =>
              Number.isInteger(a.from) && Number.isInteger(a.to) && gs.tiles[a.from] && gs.tiles[a.to] && areNeighbors(a.from, a.to))
            .slice(0, me.attacks);
          room.orders[me.id] = { place, attacks };
          if (!gs.submittedIds.includes(me.id)) gs.submittedIds.push(me.id);
          if (kit.connectedIds(room).some((id) => !gs.submittedIds.includes(id))) kit.broadcast(room);
          else endOrders(room);
          return;
        }
        case 'restart_game': {
          kit.stopTimer(room);
          room.gameState = freshState(gs.settings);
          room.players.forEach((p) => { p.score = 0; p.reserve = 0; p.attacks = 0; p.correctCount = 0; p.respawns = 0; });
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
        room.askedAt = Date.now();
        kit.runTimer(room, left, () => endQuestion(room));
      } else if (gs.phase === 'ROLL') kit.runTimer(room, left, () => startOrders(room));
      else if (gs.phase === 'ORDERS') kit.runTimer(room, left, () => endOrders(room));
      else if (gs.phase === 'RESOLVE') kit.runTimer(room, left, () => afterResolve(room));
    },
  });

  function startVote(room: FetihRoom) {
    const gs = room.gameState;
    gs.phase = 'VOTE';
    gs.vote = { options: pickCategoryChoices(room.lastCategory), votes: {} };
    gs.category = null;
    gs.question = null;
    gs.answeredIds = [];
    gs.quiz = null;
    gs.roll = null;
    gs.submittedIds = [];
    gs.battles = [];
    kit.runTimer(room, FETIH_TIMES.vote, () => endVote(room));
  }

  function endVote(room: FetihRoom) {
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
    kit.runTimer(room, FETIH_TIMES.question, () => endQuestion(room));
  }

  /** Soru kapanır: ödüller, hamle sırası ve üretim zarı aynı anda açıklanıyor. */
  function endQuestion(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'QUESTION') return;

    const picks: QuizPick[] = room.players
      .filter((p) => room.answers[p.id] || room.activeIds.includes(p.id))
      .map((p) => {
        const a = room.answers[p.id];
        return { playerId: p.id, choice: a ? a.choice : null, ms: a ? a.ms : null, correct: !!a && a.choice === room.answerIdx };
      });
    const correct = picks.filter((x) => x.correct).sort((a, b) => (a.ms ?? 0) - (b.ms ?? 0));
    const fastestId = correct[0]?.playerId ?? null;
    const correctIds = new Set(correct.map((x) => x.playerId));

    // Hamle sırası: doğru bilenler hız sırasıyla, sonra geri kalanlar kura ile.
    const rest = shuffled(room.players.map((p) => p.id).filter((id) => !correctIds.has(id)));
    gs.initiative = [...correct.map((x) => x.playerId), ...rest];

    for (const p of room.players) {
      const owned = ownedProvinces(gs.tiles, p.id).length;
      let income = owned > 0 ? baseIncome(owned) : 0;
      if (correctIds.has(p.id)) {
        income += QUIZ_BONUS;
        p.correctCount += 1;
      }
      if (p.id === fastestId) income += FASTEST_BONUS;
      p.reserve = income;
      p.attacks = p.id === fastestId ? 2 : 1;
    }

    const dice = rollDice();
    const sum = dice[0] + dice[1];
    let gains: Record<string, number> = {};
    let raided: Array<{ playerId: string; province: number }> = [];
    if (sum === 7) raided = banditRaid(gs.tiles, room.players.map((p) => p.id));
    else gains = production(gs.tiles, sum);
    for (const p of room.players) p.reserve += gains[p.id] || 0;

    gs.quiz = { correct: room.answerIdx, fact: room.fact, picks, fastestId };
    gs.roll = { dice, gains, raided };
    gs.phase = 'ROLL';
    kit.runTimer(room, FETIH_TIMES.roll, () => startOrders(room));
  }

  function startOrders(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'ROLL') return;
    room.orders = {};
    gs.submittedIds = [];
    gs.phase = 'ORDERS';
    kit.runTimer(room, FETIH_TIMES.orders, () => endOrders(room));
  }

  function endOrders(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'ORDERS') return;

    const reserves: Record<string, number> = {};
    const limits: Record<string, number> = {};
    room.players.forEach((p) => { reserves[p.id] = p.reserve; limits[p.id] = p.attacks; });
    const order = gs.initiative.filter((id) => room.players.some((p) => p.id === id));
    for (const p of room.players) if (!order.includes(p.id)) order.push(p.id);

    gs.battles = resolveOrders(gs.tiles, order, room.orders, reserves, limits);
    const reborn = new Set(respawnEliminated(gs.tiles, room.players.map((p) => p.id)));
    room.players.forEach((p) => {
      p.reserve = 0;
      p.attacks = 0;
      if (reborn.has(p.id)) p.respawns += 1;
      p.score = ownedProvinces(gs.tiles, p.id).length;
    });

    gs.phase = 'RESOLVE';
    kit.runTimer(room, RESOLVE_SECONDS(gs.battles.length), () => afterResolve(room));
  }

  function afterResolve(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'RESOLVE') return;
    if (gs.round >= gs.settings.totalRounds) {
      finish(room);
      return;
    }
    gs.round += 1;
    startVote(room);
  }

  function finish(room: FetihRoom) {
    const gs = room.gameState;
    kit.stopTimer(room);
    const ranked = [...room.players].sort(
      (a, b) => b.score - a.score || totalTroops(gs.tiles, b.id) - totalTroops(gs.tiles, a.id),
    );
    gs.winnerPlayerId = ranked[0]?.id ?? null;
    gs.phase = 'GAME_OVER';
    gs.timerSeconds = 0;
    kit.broadcast(room, 'fetih:game_over');
  }

  return kit;
}
