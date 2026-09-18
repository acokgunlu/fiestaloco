import type { ContentLang } from '../src/data/contentLang';
import {
  QUIZ_CATEGORIES,
  drawQuizQuestion,
  isQuizCategory,
  pickCategoryChoices,
  tallyCategoryVote,
  type QuizCategoryId,
} from '../src/data/quizBank';
import {
  GALAXY_STEP_MS,
  GALAXY_TIMES,
  canPlaceHome,
  canQueue,
  createGalaxy,
  homeCandidates,
  homeFalls,
  radiusFor,
  respawnSpot,
  reveal,
  revealAroundOwned,
  scoreOf,
  uniqueColor,
  type GalaxyKind,
  type GalaxyMove,
} from '../src/data/galaxyLogic';
import type { DuelReason, FetihGameState, FetihLogEntry, FetihPlayer, FetihSettings } from '../src/types/fetih';
import type { QuizPick } from '../src/types/quizRound';
import { createRoomKit, playerBasics, type KitHost, type KitRoom } from './roomKit';

/**
 * GALAKSİ — sunucu (iç kimlik 'fetih')
 * LOBBY → PICK → [VOTE → QUESTION → ANSWER → ORDERS → RESOLVE (↔ DUEL)] × tur → GAME_OVER
 *
 * Her şey sunucuda: sisin altındaki türler `secrets`te, emirler ve düello
 * cevapları açıklanana kadar odada. RESOLVE adımları geri sayım değil, kısa
 * aralıklı bir adım zamanlayıcısıyla (`stepTimer`) ilerliyor; düello araya
 * girince zamanlayıcı durur, düello bitince kaldığı yerden devam eder.
 */

interface QueuedMove extends GalaxyMove {
  pid: string;
}

interface FetihRoom extends KitRoom<FetihGameState, FetihPlayer> {
  secrets: Record<number, GalaxyKind>;
  answerIdx: number;
  fact?: string;
  askedAt: number;
  answers: Record<string, { choice: number; ms: number }>;
  activeIds: string[];
  usedQuestionIds: string[];
  lastCategory: QuizCategoryId | null;
  /** Gizli emirler — RESOLVE'a kadar yalnızca sunucuda. */
  orders: Record<string, GalaxyMove[]>;
  queue: QueuedMove[];
  qi: number;
  /** Hamle zinciri kesilen oyuncular (kara delik, kaybedilen düello). */
  stopped: Record<string, boolean>;
  duelCorrect: number;
  duelAskedAt: number;
  duelAnswers: Record<string, { choice: number; ms: number }>;
  /** Adı `timer` ile bitiyor: snapshot'a yazılmıyor. */
  stepTimer: ReturnType<typeof setTimeout> | null;
}

function freshState(settings?: Partial<FetihSettings>, playerCount = 4): FetihGameState {
  const radius = radiusFor(playerCount);
  return {
    phase: 'LOBBY',
    isOnline: true,
    gameId: Date.now(),
    round: 0,
    settings: { totalRounds: Math.max(4, Math.min(20, Number(settings?.totalRounds) || 10)) },
    timerSeconds: 0,
    radius,
    cells: createGalaxy(radius).cells,
    vote: null,
    category: null,
    question: null,
    answeredIds: [],
    quiz: null,
    initiative: [],
    submittedIds: [],
    moverId: null,
    lastMove: null,
    duel: null,
    log: [],
    winnerPlayerId: null,
  };
}

const MAX_LOG = 40;

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
      secrets: {},
      answerIdx: -1,
      askedAt: 0,
      answers: {},
      activeIds: [],
      usedQuestionIds: [],
      lastCategory: null,
      orders: {},
      queue: [],
      qi: 0,
      stopped: {},
      duelCorrect: -1,
      duelAskedAt: 0,
      duelAnswers: {},
      stepTimer: null,
    }),

    newPlayer: (room, data, id) => {
      const basics = playerBasics(data, '🚀');
      basics.color = uniqueColor(basics.color, room.players.map((p) => p.color));
      return { id, ...basics, score: 0, sectors: 0, planets: 0, energy: 0, correctCount: 0 };
    },

    /** Oyun sürerken gelen oyuncu boş bir sektörde ana yıldızla başlıyor. */
    onPlayerAdded(room, player) {
      const gs = room.gameState;
      if (gs.phase === 'LOBBY' || gs.phase === 'PICK' || gs.phase === 'GAME_OVER') return;
      placeHome(room, player.id, respawnSpot(gs.cells));
      pushLog(room, { playerId: player.id, kind: 'respawn', cell: gs.cells.find((c) => c.home === player.id)?.id ?? 0 });
      refreshScores(room);
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
          clearStep(room);
          const state = { ...freshState(gs.settings, room.players.length), round: 0 };
          const galaxy = createGalaxy(state.radius);
          state.cells = galaxy.cells;
          room.secrets = galaxy.secrets;
          room.gameState = state;
          room.players.forEach((p) => { p.score = 0; p.sectors = 0; p.planets = 0; p.energy = 0; p.correctCount = 0; });
          room.usedQuestionIds = [];
          room.lastCategory = null;
          startPick(room);
          return;
        }
        case 'pick_home': {
          if (!me || gs.phase !== 'PICK') return;
          if (gs.cells.some((c) => c.home === me.id)) return;
          const id = Number(data.cell);
          const { minDist } = homeCandidates(gs.cells);
          if (!Number.isInteger(id) || !canPlaceHome(gs.cells, id, minDist)) {
            kit.sendTo(client.ws, { type: 'fetih:error', message: 'Buraya ana yıldız kurulamaz, başka bir sektör seç.' });
            return;
          }
          placeHome(room, me.id, id);
          refreshScores(room);
          if (kit.connectedIds(room).every((pid) => gs.cells.some((c) => c.home === pid))) endPick(room);
          else kit.broadcast(room);
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
          // Her adım sırayla denetleniyor: komşu mu, benim sayılan yerden mi, enerji yetiyor mu.
          const plan: GalaxyMove[] = [];
          for (const raw of Array.isArray(data.moves) ? data.moves : []) {
            const move = { from: Number(raw?.from), to: Number(raw?.to) };
            if (!Number.isInteger(move.from) || !Number.isInteger(move.to)) break;
            if (!canQueue(gs.cells, gs.radius, me.id, plan, me.energy, move)) break;
            plan.push(move);
          }
          room.orders[me.id] = plan;
          // Taslak: plan her değiştiğinde saklanıyor, süre dolarsa bu oynanır; "hazırım" sayılmaz.
          if (data.final === false) return;
          if (!gs.submittedIds.includes(me.id)) gs.submittedIds.push(me.id);
          if (kit.connectedIds(room).some((id) => !gs.submittedIds.includes(id))) kit.broadcast(room);
          else endOrders(room);
          return;
        }
        case 'duel_answer': {
          const d = gs.duel;
          if (!me || gs.phase !== 'DUEL' || !d || d.stage !== 'question') return;
          if (me.id !== d.attackerId && me.id !== d.defenderId) return;
          if (room.duelAnswers[me.id]) return;
          const choice = Number(data.choice);
          if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
          room.duelAnswers[me.id] = { choice, ms: Math.max(0, receivedAt - room.duelAskedAt) };
          d.answeredIds = Object.keys(room.duelAnswers);
          const waiting = [d.attackerId, d.defenderId].some((pid) => room.playerSockets.has(pid) && !room.duelAnswers[pid]);
          if (waiting) kit.broadcast(room);
          else endDuel(room);
          return;
        }
        case 'restart_game': {
          kit.stopTimer(room);
          clearStep(room);
          room.gameState = freshState(gs.settings, room.players.length);
          room.secrets = {};
          room.players.forEach((p) => { p.score = 0; p.sectors = 0; p.planets = 0; p.energy = 0; p.correctCount = 0; });
          kit.broadcast(room);
          return;
        }
      }
    },

    onResume(room) {
      const gs = room.gameState;
      // Eski (dünya haritalı) sürümden kalan oda: yarım oyunu sürdürmek anlamsız
      if (!Array.isArray(gs.cells)) {
        room.gameState = freshState(gs.settings, room.players.length);
        return;
      }
      const left = Math.max(3, gs.timerSeconds);
      if (gs.phase === 'PICK') kit.runTimer(room, left, () => endPick(room));
      else if (gs.phase === 'VOTE') kit.runTimer(room, left, () => endVote(room));
      else if (gs.phase === 'QUESTION') { room.askedAt = Date.now(); kit.runTimer(room, left, () => endQuestion(room)); }
      else if (gs.phase === 'ANSWER') kit.runTimer(room, left, () => startOrders(room));
      else if (gs.phase === 'ORDERS') kit.runTimer(room, left, () => endOrders(room));
      else if (gs.phase === 'DUEL') {
        if (gs.duel?.stage === 'reveal') kit.runTimer(room, left, () => afterDuel(room));
        else { room.duelAskedAt = Date.now(); kit.runTimer(room, left, () => endDuel(room)); }
      } else if (gs.phase === 'RESOLVE' && !room.stepTimer) schedule(room, 400);
    },
  });

  /* ------------------------------------------------------------ yardımcılar */

  function pushLog(room: FetihRoom, entry: FetihLogEntry) {
    room.gameState.log = [...room.gameState.log, entry].slice(-MAX_LOG);
  }

  function refreshScores(room: FetihRoom) {
    for (const p of room.players) {
      const s = scoreOf(room.gameState.cells, p.id);
      p.sectors = s.sectors;
      p.planets = s.planets;
      p.score = s.score;
    }
  }

  /**
   * Ana yıldız kur. Seçilen sektör sisin altında bir kara delikse kara delik
   * boş sektöre dönüşür — ana yıldız seçimi kara deliklerin yerini ele vermesin.
   */
  function placeHome(room: FetihRoom, pid: string, id: number | null) {
    if (id === null) return;
    const gs = room.gameState;
    if (room.secrets[id] === 'hole') room.secrets[id] = 'empty';
    const c = gs.cells[id];
    c.owner = pid;
    c.home = pid;
    revealAroundOwned(gs.cells, room.secrets, gs.radius);
  }

  function clearStep(room: FetihRoom) {
    if (room.stepTimer) { clearTimeout(room.stepTimer); room.stepTimer = null; }
  }

  function schedule(room: FetihRoom, ms: number) {
    clearStep(room);
    room.stepTimer = setTimeout(() => {
      room.stepTimer = null;
      if (kit.rooms.get(room.code) !== room) return;
      step(room);
    }, ms);
  }

  /* ------------------------------------------------------------------ faz */

  function startPick(room: FetihRoom) {
    const gs = room.gameState;
    gs.phase = 'PICK';
    gs.log = [];
    kit.runTimer(room, GALAXY_TIMES.pick, () => endPick(room));
  }

  /** Süre bitti ya da herkes seçti: seçmeyenlere rastgele ana yıldız. */
  function endPick(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'PICK') return;
    for (const p of room.players) {
      if (gs.cells.some((c) => c.home === p.id)) continue;
      const { ids } = homeCandidates(gs.cells);
      placeHome(room, p.id, ids.length ? ids[Math.floor(Math.random() * ids.length)] : respawnSpot(gs.cells));
    }
    refreshScores(room);
    gs.round = 1;
    startVote(room);
  }

  function startVote(room: FetihRoom) {
    const gs = room.gameState;
    gs.phase = 'VOTE';
    gs.vote = { options: pickCategoryChoices(room.lastCategory), votes: {} };
    gs.category = null;
    gs.question = null;
    gs.answeredIds = [];
    gs.quiz = null;
    gs.submittedIds = [];
    gs.moverId = null;
    gs.lastMove = null;
    gs.duel = null;
    kit.runTimer(room, GALAXY_TIMES.vote, () => endVote(room));
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
    kit.runTimer(room, GALAXY_TIMES.question, () => endQuestion(room));
  }

  /** Doğru 2, yanlış 1 enerji; hamle sırası: doğrular hızına göre, sonra kalanlar. */
  function endQuestion(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'QUESTION') return;
    const picks: QuizPick[] = room.players
      .filter((p) => room.answers[p.id] || room.activeIds.includes(p.id))
      .map((p) => {
        const a = room.answers[p.id];
        return { playerId: p.id, choice: a ? a.choice : null, ms: a ? a.ms : null, correct: !!a && a.choice === room.answerIdx };
      });
    const correct = picks.filter((x) => x.correct).sort((a, b) => (a.ms ?? 0) - (b.ms ?? 0)).map((x) => x.playerId);
    const others = room.players.map((p) => p.id).filter((id) => !correct.includes(id))
      .sort((a, b) => (room.answers[a]?.ms ?? 1e9) - (room.answers[b]?.ms ?? 1e9));
    gs.initiative = [...correct, ...others];
    for (const p of room.players) {
      const ok = correct.includes(p.id);
      p.energy = ok ? 2 : 1;
      if (ok) p.correctCount += 1;
    }
    gs.quiz = { correct: room.answerIdx, fact: room.fact, picks };
    gs.phase = 'ANSWER';
    kit.runTimer(room, GALAXY_TIMES.answer, () => startOrders(room));
  }

  function startOrders(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'ANSWER') return;
    room.orders = {};
    gs.submittedIds = [];
    gs.phase = 'ORDERS';
    kit.runTimer(room, GALAXY_TIMES.orders, () => endOrders(room));
  }

  function endOrders(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'ORDERS') return;
    kit.stopTimer(room);
    room.queue = [];
    for (const pid of gs.initiative) for (const m of room.orders[pid] ?? []) room.queue.push({ pid, ...m });
    room.qi = 0;
    room.stopped = {};
    gs.phase = 'RESOLVE';
    gs.timerSeconds = 0;
    kit.broadcast(room);
    schedule(room, GALAXY_STEP_MS);
  }

  /** Sıradaki tek adım. */
  function step(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'RESOLVE') return;
    const mv = room.queue[room.qi];
    if (!mv) { finishRound(room); return; }
    room.qi += 1;
    if (room.stopped[mv.pid] || !room.players.some((p) => p.id === mv.pid)) { schedule(room, 30); return; }

    const from = gs.cells[mv.from];
    const to = gs.cells[mv.to];
    gs.moverId = mv.pid;
    if (!from || !to || from.owner !== mv.pid) {
      room.stopped[mv.pid] = true;
      pushLog(room, { playerId: mv.pid, kind: 'cancel', cell: mv.to });
      kit.broadcast(room);
      schedule(room, GALAXY_STEP_MS / 2);
      return;
    }
    if (to.owner === mv.pid) { schedule(room, 30); return; }

    reveal(gs.cells, room.secrets, to.id);
    gs.lastMove = { playerId: mv.pid, from: from.id, to: to.id };

    if (to.kind === 'hole') {
      room.stopped[mv.pid] = true;
      pushLog(room, { playerId: mv.pid, kind: 'hole', cell: to.id });
      kit.broadcast(room);
      schedule(room, GALAXY_STEP_MS * 1.5);
      return;
    }
    if (!to.owner) {
      to.owner = mv.pid;
      revealAroundOwned(gs.cells, room.secrets, gs.radius);
      refreshScores(room);
      pushLog(room, { playerId: mv.pid, kind: 'capture', cell: to.id });
      kit.broadcast(room);
      schedule(room, GALAXY_STEP_MS);
      return;
    }
    startDuel(room, mv.pid, to.owner, to.id);
  }

  /* ---------------------------------------------------------------- düello */

  function startDuel(room: FetihRoom, attackerId: string, defenderId: string, cell: number) {
    const gs = room.gameState;
    const category = QUIZ_CATEGORIES[Math.floor(Math.random() * QUIZ_CATEGORIES.length)].id;
    const q = drawQuizQuestion(room.lang, category, room.usedQuestionIds);
    room.usedQuestionIds.push(q.id);
    room.duelCorrect = q.c;
    room.duelAnswers = {};
    room.duelAskedAt = Date.now();
    gs.duel = {
      attackerId, defenderId, cell,
      question: { id: q.id, category: q.category, q: q.q, o: q.o },
      answeredIds: [],
      stage: 'question',
    };
    gs.phase = 'DUEL';
    // İkisi de bağlı değilse beklemeye gerek yok
    const anyone = [attackerId, defenderId].some((pid) => room.playerSockets.has(pid));
    if (!anyone) { endDuel(room); return; }
    kit.runTimer(room, GALAXY_TIMES.duel, () => endDuel(room));
  }

  /**
   * Yalnızca biri bilirse o kazanır; ikisi de bilirse hızlı olan — asteroit
   * kuşağında savunan; kimse bilemezse savunan korur.
   */
  function endDuel(room: FetihRoom) {
    const gs = room.gameState;
    const d = gs.duel;
    if (gs.phase !== 'DUEL' || !d || d.stage !== 'question') return;
    kit.stopTimer(room);
    const A = room.duelAnswers[d.attackerId];
    const D = room.duelAnswers[d.defenderId];
    const aOk = !!A && A.choice === room.duelCorrect;
    const dOk = !!D && D.choice === room.duelCorrect;
    const cell = gs.cells[d.cell];
    let attWins: boolean;
    let reason: DuelReason;
    if (aOk !== dOk) { attWins = aOk; reason = 'only'; }
    else if (!aOk) { attWins = false; reason = 'none'; }
    else if (cell.kind === 'asteroid') { attWins = false; reason = 'asteroid'; }
    else { attWins = A!.ms < D!.ms; reason = 'faster'; }

    d.stage = 'reveal';
    d.correct = room.duelCorrect;
    d.picks = [d.attackerId, d.defenderId].map((pid) => ({
      playerId: pid, choice: room.duelAnswers[pid]?.choice ?? null, ms: room.duelAnswers[pid]?.ms ?? null,
    }));
    d.winnerId = attWins ? d.attackerId : d.defenderId;
    d.reason = reason;

    if (attWins) {
      const wasHome = cell.home === d.defenderId;
      cell.owner = d.attackerId;
      pushLog(room, { playerId: d.attackerId, kind: 'duelWin', cell: cell.id, otherId: d.defenderId });
      if (wasHome) {
        const { transferred } = homeFalls(gs.cells, d.attackerId, d.defenderId, cell.id);
        // Yeni doğum yeri sisli bir kara delik olmasın
        const nh = gs.cells.find((c) => c.home === d.defenderId);
        if (nh && room.secrets[nh.id] === 'hole') room.secrets[nh.id] = 'empty';
        pushLog(room, { playerId: d.attackerId, kind: 'homeFall', cell: cell.id, otherId: d.defenderId, count: transferred });
      }
      revealAroundOwned(gs.cells, room.secrets, gs.radius);
      refreshScores(room);
    } else {
      room.stopped[d.attackerId] = true;
      pushLog(room, { playerId: d.attackerId, kind: 'duelLoss', cell: cell.id, otherId: d.defenderId });
    }
    kit.runTimer(room, GALAXY_TIMES.duelReveal, () => afterDuel(room));
  }

  function afterDuel(room: FetihRoom) {
    const gs = room.gameState;
    if (gs.phase !== 'DUEL') return;
    gs.duel = null;
    gs.phase = 'RESOLVE';
    gs.timerSeconds = 0;
    kit.broadcast(room);
    schedule(room, GALAXY_STEP_MS);
  }

  /* ------------------------------------------------------------------ tur sonu */

  function finishRound(room: FetihRoom) {
    const gs = room.gameState;
    clearStep(room);
    gs.moverId = null;
    gs.lastMove = null;
    refreshScores(room);
    if (gs.round >= gs.settings.totalRounds) {
      const ranked = [...room.players].sort((a, b) => b.score - a.score || b.sectors - a.sectors);
      gs.winnerPlayerId = ranked[0]?.id ?? null;
      gs.phase = 'GAME_OVER';
      gs.timerSeconds = 0;
      kit.broadcast(room, 'fetih:game_over');
      return;
    }
    gs.round += 1;
    startVote(room);
  }

  return kit;
}
