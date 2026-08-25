/**
 * Pist sanatı — çevre katmanı
 * =============================
 * Pistin ETRAFINDAKİ her şey: çim, kerb, çakıl, lastik bariyer, tribün, ağaç.
 *
 * MİMARİ: bunların hepsi bir pist için SABİT. Her karede yeniden çizmek
 * saniyede 60 kez binlerce yol işlemi demekti; onun yerine tek seferlik bir
 * arka tuvale çiziliyor ve döngüde yalnızca tek bir drawImage yapılıyor.
 * Arabalar üstüne çiziliyor.
 *
 * Görsel referans: gerçek pistlerin havadan görüntüsü — biçme şeritli çim,
 * virajlarda kırmızı-beyaz kerb, dışarıda ten rengi çakıl, düzlük boyunca
 * tribün.
 */
import { Track, TrackPoint } from './pistLogic';

export const ART = {
  cim1: '#2f6b3a',
  cim2: '#357a42',
  cimNokta: 'rgba(24,72,34,.5)',
  cakil: '#b9a37c',
  cakilNokta: 'rgba(140,120,88,.55)',
  asfalt: '#3b4350',
  asfaltNokta: 'rgba(28,34,44,.35)',
  yarisCizgisi: 'rgba(24,29,38,.30)',
  kerbKirmizi: '#d63b34',
  kerbBeyaz: '#f4f6f8',
  kenar: '#eef1f5',
  bariyerA: '#1c222c',
  bariyerB: '#e8ebef',
  tribunCati: '#4a5566',
  agacGovde: '#3b2f24',
};

/** Basit, tohuma bağlı rastgele — çizim her yeniden çizimde aynı çıksın. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Her noktadaki dönüş miktarı (radyan) ve yönü. Kerb yerleşimi buna bakar. */
export function curvature(track: Track): number[] {
  const P = track.points;
  const n = P.length;
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = P[(i - 4 + n) % n];
    const b = P[i];
    const c = P[(i + 4) % n];
    const a1 = Math.atan2(b.y - a.y, b.x - a.x);
    const a2 = Math.atan2(c.y - b.y, c.x - b.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    out[i] = d;
  }
  return out;
}

function normalAt(P: TrackPoint[], i: number): { nx: number; ny: number } {
  const n = P.length;
  const a = P[(i - 1 + n) % n];
  const b = P[(i + 1) % n];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  return { nx: -Math.sin(ang), ny: Math.cos(ang) };
}

/** Merkez çizgiden `off` kadar kaydırılmış kapalı yol. */
function offsetPath(g: CanvasRenderingContext2D, track: Track, off: number) {
  const P = track.points;
  g.beginPath();
  for (let i = 0; i < P.length; i++) {
    const { nx, ny } = normalAt(P, i);
    const x = P[i].x + nx * off;
    const y = P[i].y + ny * off;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}

function centerPath(g: CanvasRenderingContext2D, track: Track) {
  const P = track.points;
  g.beginPath();
  P.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
}

/**
 * Çevreyi ve pisti bir tuvale çizer.
 * Dönen tuval her karede olduğu gibi blit edilir.
 */
export function renderScenery(
  W: number, H: number, track: Track, seed: number
): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const rand = rng(seed);
  const P = track.points;
  const curv = curvature(track);
  const half = track.half;

  // ---------- ÇİM + BİÇME ŞERİTLERİ
  // Şeritler tek başına pisti "gerçek" yapan ayrıntı: gerçek devrelerde
  // çim çapraz bantlar hâlinde biçilir ve havadan ilk göze çarpan şey budur.
  g.fillStyle = ART.cim1;
  g.fillRect(0, 0, W, H);
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(-0.42);
  g.fillStyle = ART.cim2;
  const bant = 30;
  for (let x = -W; x < W; x += bant * 2) g.fillRect(x, -H, bant, H * 2);
  g.restore();

  // çim dokusu
  g.fillStyle = ART.cimNokta;
  for (let i = 0; i < 1400; i++) {
    const x = rand() * W;
    const y = rand() * H;
    g.fillRect(x, y, 1.6, 1.6);
  }

  // ---------- ÇAKIL KAÇAMAK (yalnız sert virajların DIŞINDA)
  for (let i = 0; i < P.length; i++) {
    const k = curv[i];
    if (Math.abs(k) < 0.09) continue;
    const yon = k > 0 ? -1 : 1;               // virajın dış tarafı
    const { nx, ny } = normalAt(P, i);
    const r = half + 34;
    const x = P[i].x + nx * yon * (half + 18);
    const y = P[i].y + ny * yon * (half + 18);
    g.fillStyle = ART.cakil;
    g.beginPath();
    g.arc(x, y, 30, 0, Math.PI * 2);
    g.fill();
    void r;
  }
  // çakıl dokusu
  g.fillStyle = ART.cakilNokta;
  for (let i = 0; i < P.length; i++) {
    if (Math.abs(curv[i]) < 0.09) continue;
    const yon = curv[i] > 0 ? -1 : 1;
    const { nx, ny } = normalAt(P, i);
    for (let j = 0; j < 10; j++) {
      const rr = rand() * 28;
      const aa = rand() * Math.PI * 2;
      g.fillRect(
        P[i].x + nx * yon * (half + 18) + Math.cos(aa) * rr,
        P[i].y + ny * yon * (half + 18) + Math.sin(aa) * rr, 1.7, 1.7
      );
    }
  }

  // ---------- ASFALT
  g.lineJoin = 'round';
  g.lineCap = 'round';
  centerPath(g, track);
  g.strokeStyle = 'rgba(12,16,22,.35)';
  g.lineWidth = half * 2 + 14;
  g.stroke();
  centerPath(g, track);
  g.strokeStyle = ART.asfalt;
  g.lineWidth = half * 2;
  g.stroke();

  // asfalt dokusu — yalnız asfaltın içinde kalsın
  g.save();
  centerPath(g, track);
  g.lineWidth = half * 2;
  g.strokeStyle = '#000';
  // kırpma için pistin kendisini maske yap
  const maske = document.createElement('canvas');
  maske.width = W; maske.height = H;
  const mg = maske.getContext('2d')!;
  centerPath(mg, track);
  mg.strokeStyle = '#fff';
  mg.lineWidth = half * 2;
  mg.lineJoin = 'round'; mg.lineCap = 'round';
  mg.stroke();
  g.restore();

  const doku = document.createElement('canvas');
  doku.width = W; doku.height = H;
  const dg = doku.getContext('2d')!;
  dg.fillStyle = ART.asfaltNokta;
  for (let i = 0; i < 2600; i++) dg.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  dg.globalCompositeOperation = 'destination-in';
  dg.drawImage(maske, 0, 0);
  g.drawImage(doku, 0, 0);

  // ---------- YARIŞ ÇİZGİSİ (aşınmış iz)
  // İçe doğru kayan, virajlarda apeksi öpen soluk bir bant.
  g.beginPath();
  for (let i = 0; i < P.length; i++) {
    const { nx, ny } = normalAt(P, i);
    const kayma = Math.max(-1, Math.min(1, curv[i] * 6)) * (half * 0.45);
    const x = P[i].x + nx * kayma;
    const y = P[i].y + ny * kayma;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
  g.strokeStyle = ART.yarisCizgisi;
  g.lineWidth = 26;
  g.stroke();

  // ---------- KERB (yalnız SIKI virajlarda, virajın İÇ tarafında)
  // Eşik 0,055 iken yarıçapı 164'ün altındaki HER yer kerb alıyordu — turun
  // %59'u. Pist baştan sona şeker çubuğuna dönüyordu. 0,085 => yarıçap 106'nın
  // altı: yalnızca gerçekten yavaşlatan virajlar.
  for (let i = 0; i < P.length; i++) {
    const k = curv[i];
    if (Math.abs(k) < 0.085) continue;
    const yon = k > 0 ? 1 : -1;               // virajın iç tarafı
    const { nx, ny } = normalAt(P, i);
    const bx = P[i].x + nx * yon * (half - 5);
    const by = P[i].y + ny * yon * (half - 5);
    const nb = P[(i + 1) % P.length];
    const ang = Math.atan2(nb.y - P[i].y, nb.x - P[i].x);
    g.save();
    g.translate(bx, by);
    g.rotate(ang);
    // Diş: 3 nokta kırmızı / 3 nokta beyaz (~27 birim) — gerçek kerb oranı.
    g.fillStyle = i % 6 < 3 ? ART.kerbKirmizi : ART.kerbBeyaz;
    g.fillRect(-5, -4.5, 11, 9);
    g.restore();
  }

  // ---------- PİST KENAR ÇİZGİLERİ
  for (const yon of [-1, 1]) {
    offsetPath(g, track, yon * (half - 2));
    g.strokeStyle = ART.kenar;
    g.lineWidth = 2.5;
    g.stroke();
  }

  // ---------- LASTİK BARİYER (sert virajların dışında)
  // Düz nokta dizisi kesik çizgi gibi okunuyordu. Lastik yığını: koyu dış
  // halka + jant boşluğu, aralarda kırmızı-beyaz işaret lastiği.
  for (let i = 0; i < P.length; i += 2) {
    const k = curv[i];
    if (Math.abs(k) < 0.1) continue;
    const yon = k > 0 ? -1 : 1;
    const { nx, ny } = normalAt(P, i);
    const x = P[i].x + nx * yon * (half + 46);
    const y = P[i].y + ny * yon * (half + 46);
    if (x < 8 || x > W - 8 || y < 8 || y > H - 8) continue;
    const isaret = (i / 2) % 5 === 0;
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fillStyle = isaret ? ART.kerbKirmizi : ART.bariyerA;
    g.fill();
    g.beginPath();
    g.arc(x, y, 2.4, 0, Math.PI * 2);
    g.fillStyle = isaret ? ART.kerbBeyaz : '#39424f';
    g.fill();
  }

  // ---------- TRİBÜNLER (pistin en düz bölümünün dışında)
  {
    const adet = 3;
    const pencere = Math.min(P.length - 2, 34);
    const bas = enDuzPencere(curv, pencere);
    let kondu = 0;
    for (let s = 0; s < adet; s++) {
      const i = (bas + Math.floor((pencere / (adet + 1)) * (s + 1))) % P.length;
      const { nx, ny } = normalAt(P, i);
      const nb = P[(i + 1) % P.length];
      const ang = Math.atan2(nb.y - P[i].y, nb.x - P[i].x);
      // Pistin hangi tarafi dunya merkezine daha uzaksa oraya koy —
      // tribun pistin ic alanina sikismasin.
      const disa = (P[i].x - W / 2) * nx + (P[i].y - H / 2) * ny > 0 ? 1 : -1;
      const cx = P[i].x + nx * disa * (half + 38);
      const cy = P[i].y + ny * disa * (half + 38);
      if (cx < 62 || cx > W - 62 || cy < 26 || cy > H - 26) continue;
      tribun(g, cx, cy, ang, rand);
      kondu++;
    }
    // Hicbiri sigmadiysa pencerenin ortasina ICE dogru tek tribun koy —
    // her pistte seyirci olsun.
    if (kondu === 0) {
      const i = (bas + (pencere >> 1)) % P.length;
      const { nx, ny } = normalAt(P, i);
      const nb = P[(i + 1) % P.length];
      const ang = Math.atan2(nb.y - P[i].y, nb.x - P[i].x);
      const ice = (P[i].x - W / 2) * nx + (P[i].y - H / 2) * ny > 0 ? -1 : 1;
      tribun(g, P[i].x + nx * ice * (half + 38), P[i].y + ny * ice * (half + 38), ang, rand);
    }
  }

  // ---------- AĞAÇLAR (pistten uzakta, çimin üstünde)
  for (let i = 0; i < 90; i++) {
    const x = rand() * W;
    const y = rand() * H;
    if (pistUzakligi(track, x, y) < half + 74) continue;
    agac(g, x, y, 6 + rand() * 7);
  }

  // ---------- START / BİTİŞ
  const p0 = P[0];
  const p1 = P[3];
  const ang0 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  g.save();
  g.translate(p0.x, p0.y);
  g.rotate(ang0);
  const kutu = (half * 2) / 10;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 10; c++) {
      g.fillStyle = (r + c) % 2 ? '#12161d' : '#f4f6f8';
      g.fillRect(-7 + r * 7, -half + c * kutu, 7, kutu);
    }
  }
  g.restore();

  return cv;
}

/**
 * EN DÜZ PENCERE — "düzlük var mı" değil, "nerede en düz".
 *
 * Önceki sürüm mutlak eşik arıyordu (yarıçap > 257 ve en az 9 nokta üst üste).
 * Tribün 118 birim geniş; üç tanesi ~354 birim düzlük ister ve çoğu pist bunu
 * sağlamadığı için tribün hiç düşmüyordu — oysa seyirci istenen şeydi. Şimdi
 * sabit uzunlukta pencereyi kaydırıp toplam dönüşü en küçük olanı seçiyoruz:
 * sonuç her zaman var, sadece "en düz olan" değişiyor.
 */
function enDuzPencere(curv: number[], pencere: number): number {
  const n = curv.length;
  if (n <= pencere) return 0;
  let top = 0;
  for (let i = 0; i < pencere; i++) top += Math.abs(curv[i]);
  let enIyi = top;
  let enIyiBas = 0;
  for (let i = 1; i < n; i++) {
    top += Math.abs(curv[(i + pencere - 1) % n]) - Math.abs(curv[i - 1]);
    if (top < enIyi) { enIyi = top; enIyiBas = i; }
  }
  return enIyiBas;
}


function pistUzakligi(track: Track, x: number, y: number): number {
  let best = Infinity;
  // Her 3 noktada bir örneklemek yeterli — ağaç yerleşimi için hassasiyet
  // gerekmez ve tüm noktalara bakmak 90 ağaç × 170 nokta olurdu.
  for (let i = 0; i < track.points.length; i += 3) {
    const p = track.points[i];
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function tribun(g: CanvasRenderingContext2D, cx: number, cy: number, ang: number, rand: () => number) {
  const w = 118;
  const h = 40;
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  // gölge
  g.fillStyle = 'rgba(10,14,20,.32)';
  g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  // oturma sıraları — pist tarafına bakan basamaklar
  for (let r = 0; r < 5; r++) {
    const t = r / 5;
    g.fillStyle = `rgb(${86 + r * 9},${96 + r * 9},${112 + r * 9})`;
    g.fillRect(-w / 2, -h / 2 + r * (h / 5), w, h / 5 - 1);
    // seyirciler
    for (let s = 0; s < 22; s++) {
      if (rand() < 0.34) continue;
      const px = -w / 2 + 3 + rand() * (w - 6);
      const py = -h / 2 + r * (h / 5) + 2;
      g.fillStyle = `hsl(${Math.floor(rand() * 360)} 62% ${58 + t * 10}%)`;
      g.fillRect(px, py, 2.4, 2.4);
    }
  }
  // çatı kenarı
  g.fillStyle = '#2a323f';
  g.fillRect(-w / 2 - 2, -h / 2 - 4, w + 4, 5);
  g.restore();
}

function agac(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.fillStyle = 'rgba(10,20,12,.30)';
  g.beginPath();
  g.arc(x + 2.5, y + 3, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#245c2c';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2f7a38';
  g.beginPath();
  g.arc(x - r * 0.22, y - r * 0.26, r * 0.66, 0, Math.PI * 2);
  g.fill();
}
