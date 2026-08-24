/**
 * FiestaLoco — uctan uca duman testi
 * =============================================================================
 * Calisan bir oyun sunucusuna karsi gercek WebSocket baglantilari acar ve
 * her oyun modu icin "TV oda acar -> telefon katilir -> state gelir" akisini
 * dogrular. Ayrica /api/health ve leaderboard uclarini kontrol eder.
 *
 * Kullanim:
 *   npm run build:server
 *   NODE_ENV=production node dist-server/server.cjs &
 *   npm run smoke                       # varsayilan http://127.0.0.1:3000
 *   SMOKE_TARGET=https://... npm run smoke
 */

import { WebSocket } from 'ws';

const TARGET = (process.env.SMOKE_TARGET || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const WS_TARGET = TARGET.replace(/^http/, 'ws');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 8000);

interface GameSpec {
  name: string;
  createType: string;
  createExtra?: Record<string, unknown>;
  joinType: string;
  /** Oda kodunun gorundugu mesaj tipleri */
  stateTypes: string[];
}

const GAMES: GameSpec[] = [
  {
    name: 'imposter',
    createType: 'room:create',
    joinType: 'room:join',
    stateTypes: ['room:created', 'room:joined', 'room:state'],
  },
  {
    name: 'codenames',
    createType: 'codenames:create_room',
    joinType: 'codenames:join_room',
    stateTypes: ['codenames:room_created', 'codenames:room_joined', 'codenames:state'],
  },
  {
    name: 'bomb',
    createType: 'bomb:create_room',
    joinType: 'bomb:join_room',
    stateTypes: ['bomb:room_created', 'bomb:room_joined', 'bomb:state'],
  },
  {
    name: 'bluff',
    createType: 'bluff:create_room',
    joinType: 'bluff:join_room',
    stateTypes: ['bluff:created', 'bluff:joined', 'bluff:state'],
  },
  {
    name: 'trivia',
    createType: 'trivia:create_room',
    joinType: 'trivia:join_room',
    stateTypes: ['trivia:room_created', 'trivia:room_joined', 'trivia:state'],
  },
  {
    name: 'race',
    createType: 'race:create_room',
    joinType: 'race:join_room',
    stateTypes: ['race:room_created', 'race:room_joined', 'race:state'],
  },
  {
    name: 'quiplash',
    createType: 'quiplash:create_room',
    joinType: 'quiplash:join_room',
    stateTypes: ['quiplash:room_created', 'quiplash:room_joined', 'quiplash:state'],
  },
];

type Msg = Record<string, any>;

function connect(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_TARGET, { origin: 'http://localhost:5173' });
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error(`WS baglanti zaman asimi (${WS_TARGET})`));
    }, TIMEOUT_MS);
    ws.on('open', () => {
      clearTimeout(timer);
      resolve(ws);
    });
    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/** Belirli tiplerden biri gelene kadar bekler (heartbeat mesajlarini yok sayar). */
function waitFor(ws: WebSocket, types: string[], label: string): Promise<Msg> {
  return new Promise((resolve, reject) => {
    const seen: string[] = [];
    const timer = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error(`${label}: [${types.join(', ')}] beklenirken zaman asimi. Gelen: ${seen.join(', ') || '(hicbir sey)'}`));
    }, TIMEOUT_MS);

    const onMessage = (raw: Buffer) => {
      let msg: Msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type === 'heartbeat') return;
      seen.push(String(msg.type));
      if (types.includes(msg.type)) {
        clearTimeout(timer);
        ws.off('message', onMessage);
        resolve(msg);
      }
    };
    ws.on('message', onMessage);
  });
}

function findRoomCode(msg: Msg): string | null {
  return (
    msg.roomCode ??
    msg.code ??
    msg.state?.roomCode ??
    msg.gameState?.roomCode ??
    null
  );
}

async function testGame(spec: GameSpec): Promise<{ ok: boolean; detail: string }> {
  let tv: WebSocket | null = null;
  let phone: WebSocket | null = null;
  try {
    // 1) TV ekrani odayi acar
    tv = await connect();
    const createdPromise = waitFor(tv, spec.stateTypes, `${spec.name} oda olusturma`);
    tv.send(JSON.stringify({ type: spec.createType, ...(spec.createExtra ?? {}) }));
    const created = await createdPromise;

    const roomCode = findRoomCode(created);
    if (!roomCode) return { ok: false, detail: `oda kodu bulunamadi (${created.type})` };

    // 2) Telefon kumandasi odaya katilir
    phone = await connect();
    const joinedPromise = waitFor(
      phone,
      [...spec.stateTypes, 'error', `${spec.name}:error`],
      `${spec.name} odaya katilma`,
    );
    phone.send(
      JSON.stringify({
        type: spec.joinType,
        roomCode,
        playerName: 'SmokeBot',
        name: 'SmokeBot',
        avatar: '🤖',
      }),
    );
    const joined = await joinedPromise;
    if (String(joined.type).endsWith('error')) {
      return { ok: false, detail: `katilma reddedildi: ${joined.message ?? ''}` };
    }

    return { ok: true, detail: `oda=${roomCode}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  } finally {
    tv?.close();
    phone?.close();
  }
}

async function main() {
  console.log(`\n🎯 Hedef: ${TARGET}\n`);

  // --- HTTP uclari -----------------------------------------------------------
  const health = await fetch(`${TARGET}/api/health`).then((r) => r.json());
  console.log('✅ /api/health            :', JSON.stringify(health.rooms), '| kalicilik:', health.persistence?.enabled ? 'acik' : 'kapali');

  const board = await fetch(`${TARGET}/api/leaderboard?limit=5`).then((r) => r.json());
  console.log('✅ /api/leaderboard       :', board.enabled ? `${board.players.length} oyuncu` : 'kalicilik kapali');

  const history = await fetch(`${TARGET}/api/match-history?limit=5`).then((r) => r.json());
  console.log('✅ /api/match-history     :', history.enabled ? `${history.matches.length} mac` : 'kalicilik kapali');

  // --- CORS ------------------------------------------------------------------
  const cors = await fetch(`${TARGET}/api/health`, { headers: { Origin: 'https://example.vercel.app' } });
  console.log('✅ CORS baslik            :', cors.headers.get('access-control-allow-origin') ?? '(yok)');

  // --- WebSocket oyun akislari ----------------------------------------------
  console.log('\n🎮 Oyun modlari (TV oda acar -> telefon katilir):\n');
  let failures = 0;
  for (const spec of GAMES) {
    const result = await testGame(spec);
    if (!result.ok) failures += 1;
    console.log(`   ${result.ok ? '✅' : '❌'} ${spec.name.padEnd(10)} ${result.detail}`);
  }

  const after = await fetch(`${TARGET}/api/health`).then((r) => r.json());
  console.log('\n📊 Test sonrasi aktif oda sayisi:', after.activeRooms, JSON.stringify(after.rooms));

  if (failures > 0) {
    console.error(`\n❌ ${failures}/${GAMES.length} oyun modu basarisiz.\n`);
    process.exit(1);
  }
  console.log(`\n✅ Tum kontroller gecti (${GAMES.length}/${GAMES.length} oyun modu).\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Duman testi hata verdi:', error);
  process.exit(1);
});
