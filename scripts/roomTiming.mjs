/**
 * Oda acma suresi olcumu.
 * Ayni sunucu process'i uzerinde arka arkaya oda acar; her odanin
 * "istek gonderildi -> oda kodu geldi" suresini raporlar.
 */
import { WebSocket } from 'ws';

const TARGET = process.env.SMOKE_TARGET || 'ws://127.0.0.1:3400';
const COUNT = Number(process.env.ROOM_COUNT || 50);

function openRoom() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(TARGET, { origin: 'http://localhost:5173' });
    ws.on('open', () => {
      const t0 = process.hrtime.bigint();
      ws.on('message', (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.type === 'heartbeat') return;
        if (m.type === 'room:created') {
          const ms = Number(process.hrtime.bigint() - t0) / 1e6;
          ws.close();
          resolve({ ms, code: m.roomCode ?? m.state?.roomCode });
        }
      });
      ws.send(JSON.stringify({ type: 'room:create' }));
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('timeout')), 5000);
  });
}

const timings = [];
for (let i = 0; i < COUNT; i += 1) {
  const { ms } = await openRoom();
  timings.push(ms);
}

timings.sort((a, b) => a - b);
const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
const p95 = timings[Math.floor(timings.length * 0.95)];

console.log(`\nAyni process uzerinde ${COUNT} oda acildi (yerel, ag gecikmesi haric):`);
console.log(`  en hizli : ${timings[0].toFixed(3)} ms`);
console.log(`  ortalama : ${avg.toFixed(3)} ms`);
console.log(`  p95      : ${p95.toFixed(3)} ms`);
console.log(`  en yavas : ${timings[timings.length - 1].toFixed(3)} ms`);

const healthBase = TARGET.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
const health = await fetch(healthBase + '/api/health').then((r) => r.json());
console.log(`\nSunucu ayakta kalma suresi: ${health.uptimeSeconds}s (hic yeniden baslatilmadi)`);
console.log(`Ayni anda tutulan oda sayisi: ${health.activeRooms}`);
console.log(`Bellek: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB (test istemcisi)\n`);
process.exit(0);
