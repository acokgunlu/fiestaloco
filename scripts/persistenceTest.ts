/**
 * serializeRoom + detectFinishedMatch birim testleri.
 * Calistirma:  npx tsx scripts/persistenceTest.ts
 */
import { EventEmitter } from 'events';
import { serializeRoom } from '../server/persistence';
import { detectFinishedMatch } from '../server/matchResult';

let failures = 0;

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`✅ ${label}`);
  } else {
    failures += 1;
    console.log(`❌ ${label}`, extra !== undefined ? JSON.stringify(extra) : '');
  }
}

// -----------------------------------------------------------------------------
// serializeRoom
// -----------------------------------------------------------------------------
console.log('\n— serializeRoom —\n');

class FakeSocket extends EventEmitter {
  readyState = 1;
  send() {}
}

const timer = setInterval(() => {}, 100000);
const socket = new FakeSocket();

const room: any = {
  code: 'WOLF',
  observers: new Set([socket]),
  playerSockets: new Map([['p1', socket]]),
  players: [
    { id: 'p1', name: 'Ada', score: 12, avatar: '🦊' },
    { id: 'p2', name: 'Ben', score: 7, avatar: '🐼' },
  ],
  gameState: { phase: 'VOTING', currentRound: 2, roundTimer: timer, isTimerRunning: true },
  roundTimer: timer,
  discussionTimer: timer,
  strokes: [{ id: 's1', points: [{ x: 1, y: 2 }] }],
};
room.selfReference = room; // dairesel referans

const serialized = serializeRoom(room);
const json = JSON.stringify(serialized);

check('oda kodu korunur', serialized.code === 'WOLF');
check('oyuncular korunur', Array.isArray(serialized.players) && (serialized.players as any[]).length === 2);
check('ic ice state korunur', (serialized.gameState as any).phase === 'VOTING');
check('cizimler korunur', Array.isArray(serialized.strokes));
check('observers (Set) atilir', serialized.observers === undefined);
check('playerSockets (Map) atilir', serialized.playerSockets === undefined);
check('kok seviye timer atilir', serialized.roundTimer === undefined && serialized.discussionTimer === undefined);
check('ic ice timer atilir', (serialized.gameState as any).roundTimer === undefined);
check('dairesel referans patlatmaz', typeof json === 'string');
check('JSON serilesebilir (round-trip)', JSON.parse(json).code === 'WOLF');
clearInterval(timer);

// -----------------------------------------------------------------------------
// detectFinishedMatch
// -----------------------------------------------------------------------------
console.log('\n— detectFinishedMatch —\n');

// Devam eden oyun -> null
check(
  'devam eden oyun kaydedilmez',
  detectFinishedMatch('quiplash', {
    code: 'AAAA',
    players: [{ id: '1', name: 'Ada', score: 5 }],
    gameState: { phase: 'VOTING' },
  }) === null,
);

// Quiplash — winnerPlayerId
const quiplash = detectFinishedMatch('quiplash', {
  code: 'BEAR',
  players: [
    { id: '1', name: 'Ada', avatar: '🦊', score: 800 },
    { id: '2', name: 'Ben', avatar: '🐼', score: 400 },
  ],
  gameState: { phase: 'GAME_OVER', winnerPlayerId: '1', currentRound: 3 },
});
check('quiplash tespit edildi', quiplash !== null);
check('quiplash kazanani dogru', quiplash?.record.winnerName === 'Ada', quiplash?.record.winnerName);
check('quiplash kaybedeni isWinner=false', quiplash?.record.players[1].isWinner === false);

// Bomb — winnerPlayerId + wordsUsed -> bombsDefused
const bomb = detectFinishedMatch('bomb', {
  code: 'BOMB',
  players: [
    { id: '1', name: 'Ada', avatar: '🦊', wordsUsed: ['kar', 'kale', 'kapı'] },
    { id: '2', name: 'Ben', avatar: '🐼', wordsUsed: ['kum'] },
  ],
  gameState: { phase: 'GAME_OVER', winnerPlayerId: '1', currentRound: 4 },
});
check('bomb kazanani dogru', bomb?.record.winnerName === 'Ada');
check('bomb bombsDefused = kelime sayisi', bomb?.record.players[0].bombsDefused === 3, bomb?.record.players[0]);

// Bluff — winnerPlayerId yok, en yuksek skor kazanir
const bluff = detectFinishedMatch('bluff', {
  code: 'FROG',
  players: [
    { id: '1', name: 'Ada', avatar: '🦊', score: 300, foolsCount: 4 },
    { id: '2', name: 'Ben', avatar: '🐼', score: 900, foolsCount: 1 },
  ],
  gameState: { phase: 'GAME_OVER', currentRound: 3 },
});
check('bluff en yuksek skoru kazanan sayar', bluff?.record.winnerName === 'Ben', bluff?.record.winnerName);
check('bluff bluffsFooled tasinir', bluff?.record.players[0].bluffsFooled === 4);

// Codenames — takim bazli
const codenames = detectFinishedMatch('codenames', {
  code: 'CODE',
  players: [
    { id: '1', name: 'Ada', avatar: '🦊', team: 'red', role: 'spymaster' },
    { id: '2', name: 'Ben', avatar: '🐼', team: 'blue', role: 'operative' },
  ],
  gameState: { phase: 'GAME_OVER', winner: 'red', winReason: 'all_agents_found', redScore: 9, blueScore: 5 },
});
check('codenames kazanan takim oyuncusu', codenames?.record.winnerName === 'Ada');
check('codenames mavi takim kaybeder', codenames?.record.players[1].isWinner === false);
check('codenames roleOrTeam dolu', codenames?.record.players[0].roleOrTeam === 'red/spymaster');

// Trivia — wedges -> wedgesEarned
const trivia = detectFinishedMatch('trivia', {
  code: 'QUIZ',
  players: [
    { id: '1', name: 'Ada', avatar: '🦊', score: 60, wedges: ['history', 'science', 'arts'] },
    { id: '2', name: 'Ben', avatar: '🐼', score: 40, wedges: ['sports'] },
  ],
  gameState: { phase: 'GAME_OVER', winnerPlayerId: '1', roundNumber: 8 },
});
check('trivia wedgesEarned dogru', trivia?.record.players[0].wedgesEarned === 3);

// Imposter — tur bazli, RESULTS fazi
const imposter = detectFinishedMatch('imposter', {
  code: 'WOLF',
  gamePhase: 'RESULTS',
  currentRoundNumber: 2,
  players: [
    { id: '1', name: 'Ada', avatar: '🦊', score: 100, isImposter: false },
    { id: '2', name: 'Ben', avatar: '🐼', score: 0, isImposter: true },
  ],
  roundResult: { imposterWon: false, imposterId: '2', correctVoterIds: ['1'], imposterWord: 'kedi' },
});
check('imposter ekip galibiyeti tespit edildi', imposter !== null);
check('imposter ekip uyesi kazanir', imposter?.record.players[0].isWinner === true);
check('imposter kaybeder', imposter?.record.players[1].isWinner === false);
check('imposterCatches verilir', imposter?.record.players[0].imposterCatches === 1);
check('roleOrTeam dogru', imposter?.record.players[1].roleOrTeam === 'imposter');

// Dedupe anahtarlari farkli turlarda farkli olmali
const round3 = detectFinishedMatch('imposter', {
  code: 'WOLF',
  gamePhase: 'RESULTS',
  currentRoundNumber: 3,
  players: [{ id: '1', name: 'Ada', score: 100, isImposter: false }, { id: '2', name: 'Ben', score: 0, isImposter: true }],
  roundResult: { imposterWon: false, imposterId: '2', correctVoterIds: ['1'] },
});
check('farkli turlar farkli dedupe anahtari uretir', imposter?.dedupeKey !== round3?.dedupeKey, {
  a: imposter?.dedupeKey,
  b: round3?.dedupeKey,
});

// Isimsiz oyuncular elenir
const empty = detectFinishedMatch('quiplash', {
  code: 'NULL',
  players: [{ id: '1', name: '  ', score: 5 }],
  gameState: { phase: 'GAME_OVER', winnerPlayerId: '1' },
});
check('isimsiz oyuncu kaydedilmez', empty === null);

console.log(failures === 0 ? `\n✅ Tum birim testleri gecti.\n` : `\n❌ ${failures} test basarisiz.\n`);
process.exit(failures > 0 ? 1 : 0);
