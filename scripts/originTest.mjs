/**
 * ALLOWED_ORIGINS dogrulama testi.
 * Sunucuyu su env ile calistirip kullanin:
 *   ALLOWED_ORIGINS="https://fiestaloco.vercel.app,https://*.vercel.app"
 */
import { WebSocket } from 'ws';

const TARGET = process.env.SMOKE_TARGET || 'http://127.0.0.1:3000';
const WS_TARGET = TARGET.replace(/^http/, 'ws');

const cases = [
  ['https://fiestaloco.vercel.app', true, 'tam eslesme'],
  ['https://preview-abc.vercel.app', true, 'joker *.vercel.app'],
  ['http://localhost:5173', true, 'localhost her zaman serbest'],
  ['https://kotu-site.com', false, 'izinsiz origin'],
  [undefined, false, 'origin yok (ALLOWED_ORIGINS dolu)'],
];

let failures = 0;

for (const [origin, shouldPass, label] of cases) {
  const result = await new Promise((resolve) => {
    const ws = new WebSocket(WS_TARGET, origin ? { origin } : {});
    const t = setTimeout(() => {
      ws.terminate();
      resolve('timeout');
    }, 4000);
    ws.on('open', () => {
      clearTimeout(t);
      ws.close();
      resolve('kabul');
    });
    ws.on('error', () => {
      clearTimeout(t);
      resolve('red');
    });
  });
  const ok = (result === 'kabul') === shouldPass;
  if (!ok) failures += 1;
  console.log(`${ok ? '✅' : '❌'} WS  ${String(origin).padEnd(32)} -> ${result.padEnd(7)} (${label})`);
}

const bad = await fetch(`${TARGET}/api/health`, { headers: { Origin: 'https://kotu-site.com' } });
const good = await fetch(`${TARGET}/api/health`, { headers: { Origin: 'https://fiestaloco.vercel.app' } });

const badOk = bad.headers.get('access-control-allow-origin') === null;
const goodOk = good.headers.get('access-control-allow-origin') === 'https://fiestaloco.vercel.app';
if (!badOk) failures += 1;
if (!goodOk) failures += 1;

console.log(`${badOk ? '✅' : '❌'} CORS izinsiz origin -> ${bad.headers.get('access-control-allow-origin') ?? '(baslik yok, dogru)'}`);
console.log(`${goodOk ? '✅' : '❌'} CORS izinli origin  -> ${good.headers.get('access-control-allow-origin')}`);

process.exit(failures > 0 ? 1 : 0);
