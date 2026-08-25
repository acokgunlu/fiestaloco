/**
 * Pist — üstten bakışlı kapalı devre yarış
 * =========================================
 * React yok, DOM yok. Telefon (simülasyon), TV (çizim) ve sunucu (doğrulama)
 * aynı modülü kullanır.
 *
 * Pist KAPALI BİR DEVRE ve tamamı ekranda. Araba dünyada (x, y) konumuna ve
 * bir yöne (heading) sahip; direksiyon yönü döndürür, araba burnunun baktığı
 * yere gider. Yani gerçek sürüş — kayan bir şerit değil.
 *
 * Pist tek bir TOHUMDAN üretiliyor: sunucu sayıyı dağıtır, herkes birebir
 * aynı devreyi sürer.
 */

export interface TrackPoint { x: number; y: number }

export interface Track {
  name: string;
  /** Eşit aralıklı merkez çizgi noktaları (kapalı halka). */
  points: TrackPoint[];
  /** Asfaltın yarı genişliği (dünya birimi). */
  half: number;
  /** Toplam uzunluk. */
  length: number;
}

/** Dünya kutusu — çizim bu orana göre ölçekleniyor. */
export const WORLD_W = 1000;
export const WORLD_H = 620;
export const TRACK_HALF = 46;

// --- ARAÇ ---
export const MAX_SPEED = 250;      // birim/sn
export const OFFROAD_SPEED = 95;
export const ACCEL = 150;
/** Tam direksiyonda saniyede dönülen radyan (tam hızda). */
export const TURN_RATE = 2.6;
/** Tam kilitte hızın kaybedilen oranı — 0,55 => tam kilitte %45 hız. */
export const CORNER_SCRUB = 0.55;
/**
 * Arabanın merkez çizgiden bu kadar uzaklaşması "kaybolmuş" sayılır ve
 * araba piste geri konur. Eşik her türlü meşru çevre öğesinin (çakıl, lastik
 * bariyer, tribün) ötesinde: kimse normal sürüşte buraya düşmez.
 */
export const RECOVER_DIST = TRACK_HALF + 200;
/** Geri viteste hız. Kurtarmak için var, yarışmak için değil. */
export const REVERSE_SPEED = 80;

export interface CarState {
  x: number;
  y: number;
  /** Radyan. */
  heading: number;
  speed: number;
  offRoad: boolean;
  /** Merkez çizgide bulunduğu nokta indeksi — ilerleme buradan ölçülür. */
  idx: number;
  /** Tamamlanan tur. */
  lap: number;
  /** Sıralama anahtarı: lap * points.length + idx */
  progress: number;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Catmull-Rom ile yumuşatılmış kapalı eğri. */
function smoothClosed(ctrl: TrackPoint[], perSeg: number): TrackPoint[] {
  const out: TrackPoint[] = [];
  const n = ctrl.length;
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n];
    const p1 = ctrl[i];
    const p2 = ctrl[(i + 1) % n];
    const p3 = ctrl[(i + 2) % n];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
}

/** Eğriyi eşit yay uzunluğuna yeniden örnekler — ilerleme ölçümü buna dayanıyor. */
function resample(pts: TrackPoint[], spacing: number): TrackPoint[] {
  const out: TrackPoint[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i % pts.length];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    let t = 0;
    while (acc + (seg - t) >= spacing) {
      t += spacing - acc;
      acc = 0;
      const k = t / seg;
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
    acc += seg - t;
  }
  return out;
}


/**
 * Merkez çizginin her noktasındaki YEREL YARIÇAP.
 * Ardışık üç örnek arasındaki açı değişiminden hesaplanır.
 */
export function localRadius(points: TrackPoint[]): number[] {
  const n = points.length;
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = points[(i - 2 + n) % n];
    const b = points[i];
    const c = points[(i + 2) % n];
    const a1 = Math.atan2(b.y - a.y, b.x - a.x);
    const a2 = Math.atan2(c.y - b.y, c.x - b.x);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    // GERCEK yay uzunlugu — varsayilan aralik DEGIL. Yumusatma noktalari
    // sikistirdigi icin sabit aralik varsaymak yaricapi buyuk gosteriyordu.
    const l1 = Math.hypot(b.x - a.x, b.y - a.y);
    const l2 = Math.hypot(c.x - b.x, c.y - b.y);
    out[i] = Math.abs(d) < 1e-6 ? Infinity : ((l1 + l2) / 2) / Math.abs(d);
  }
  return out;
}

/**
 * NOKTA BAZLI yumuşatma — her noktaya AYRI katsayı.
 *
 * İlk sürüm tüm halkayı eşit yumuşatıyordu. Laplace yumuşatma eğriyi
 * daireleştirdiği için bu, dar virajı açarken düzlükleri ve karakteri de
 * siliyordu: üretilen her pist aynı yumurtaya benziyordu. Şimdi katsayı
 * yalnızca eşiği İHLAL EDEN yerlerde büyük, gerisinde sıfır.
 */
function smoothWeighted(points: TrackPoint[], w: number[]): TrackPoint[] {
  const n = points.length;
  return points.map((p, i) => {
    const k = w[i];
    if (k <= 0) return p;
    const a = points[(i - 1 + n) % n];
    const b = points[(i + 1) % n];
    return {
      x: p.x + ((a.x + b.x) / 2 - p.x) * k,
      y: p.y + ((a.y + b.y) / 2 - p.y) * k,
    };
  });
}

/** İhlal alanını komşulara yay — yoksa açılan virajın kenarında kırık kalır. */
function blurField(v: number[], yaricap: number): number[] {
  const n = v.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let top = 0;
    for (let d = -yaricap; d <= yaricap; d++) top += v[(i + d + n * 2) % n];
    out[i] = top / (yaricap * 2 + 1);
  }
  return out;
}

/**
 * Pisti dünya kutusuna oturt — kenarda kerb/çakıl/bariyer için pay bırakarak.
 * Ölçek TEK katsayı (en/boy ayrı ayrı esnetilirse viraj yarıçapları bozulur).
 */
function fitToWorld(pts: TrackPoint[]): TrackPoint[] {
  // Pay = asfalt disinda kalmasi gereken her sey: kerb, cakil kacamak alani,
  // lastik bariyer VE tribun. 38 iken tribunler dunya kenarina tasip
  // eleniyordu ve her pist seyircisiz kaliyordu.
  const pay = TRACK_HALF + 62;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const k = Math.min((WORLD_W - pay * 2) / w, (WORLD_H - pay * 2) / h);
  const ox = (minX + maxX) / 2;
  const oy = (minY + maxY) / 2;
  return pts.map((p) => ({
    x: WORLD_W / 2 + (p.x - ox) * k,
    y: WORLD_H / 2 + (p.y - oy) * k,
  }));
}

// Arabanın tam hızdaki dönüş yarıçapı MAX_SPEED/TURN_RATE ≈ 96 birim.
// Eşiği bunun ALTINA koyuyoruz (0,85): en dar viraj tam gazda ancak DOĞRU
// ÇİZGİYLE alınır, kötü çizgiyle dışarı taşılır — istediğimiz de bu.
// Sert sınır yalnızca geometri: yarıçap pist yarı genişliğini (46) geçmezse
// iç kenar kendi üzerine katlanıp asfalt pistin ortasını doldurur.
const MIN_RADIUS = (MAX_SPEED / TURN_RATE) * 0.85;

/**
 * ARABANIN DÖNEBİLECEĞİNDEN DAR VİRAJ ÜRETİLEMEZ (bkz. MIN_RADIUS).
 * Yalnızca ihlal eden bölgeler açılır; düzlükler ve geniş virajlar korunur.
 */
function relaxTrack(points: TrackPoint[], spacing: number): TrackPoint[] {
  let pts = fitToWorld(points);
  for (let pass = 0; pass < 500; pass++) {
    const r = localRadius(pts);
    let ihlal = false;
    const w = r.map((v) => {
      if (!isFinite(v) || v >= MIN_RADIUS) return 0;
      ihlal = true;
      return Math.min(1, 1 - v / MIN_RADIUS);
    });
    if (!ihlal) break;
    // TABAN AĞIRLIK: ihlal eşiğe yaklaşınca oran sıfıra gidiyor ve yumuşatma
    // duruyordu — pistler 51 yarıçapında (iç kenar neredeyse sivri) takılı
    // kalıyordu. İhlalin olduğu her yerde ağırlığı tam güce çıkarıyoruz.
    const alan = blurField(w, 7).map((k) => (k > 0 ? Math.min(0.5, 0.5 * (k / 0.12)) : 0));
    pts = resample(smoothWeighted(pts, alan), spacing);
  }
  return fitToWorld(pts);
}

const TRACK_NAMES = [
  'Kanyon Pisti', 'Liman Devresi', 'Kuzey Ormanı', 'Çöl Halkası',
  'Eski Havaalanı', 'Dağ Geçidi', 'Sahil Yolu', 'Fabrika Bölgesi',
];

/**
 * Pist üretimi.
 *
 * Bozulmuş bir elipsten yola çıkıp yumuşatıyoruz. Kontrol noktası sayısı
 * 7-10: altında pist bir yumurtaya benziyor, üstünde her viraj birbirine
 * benzeyen bir spagetti çıkıyor.
 */
export function generateTrack(seed: number): Track {
  const rand = rng(seed);
  const name = TRACK_NAMES[Math.floor(rand() * TRACK_NAMES.length)];
  const n = 8 + Math.floor(rand() * 4);
  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;
  const ctrl: TrackPoint[] = [];

  // AÇISAL SIÇRAMA + GENİŞ YARIÇAP ARALIĞI.
  // İlk sürümde açılar eşit aralıklı, yarıçap da dar bir bantta (0,62-1,0)
  // seçiliyordu; üretilen her pist yuvarlak bir yumurtaya benziyordu, biri
  // diğerinden ayırt edilemiyordu. Açıyı sıçratmak komşu noktaları kimi
  // yerde sıkıştırıp kimi yerde açıyor: sıkışan yerde firkete, açılan yerde
  // düzlük çıkıyor.
  const jitter: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) { const w = 0.5 + rand() * 1.5; jitter.push(w); total += w; }
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = (acc / total) * Math.PI * 2;
    acc += jitter[i];
    const rr = 0.42 + rand() * 0.58;
    ctrl.push({
      x: cx + Math.cos(a) * (WORLD_W * 0.40) * rr,
      y: cy + Math.sin(a) * (WORLD_H * 0.38) * rr,
    });
  }
  const smooth = smoothClosed(ctrl, 26);
  // Yumuşatma noktaları kısaltıp halkayı büzebilir; önce gevşet sonra
  // eşit aralığa yeniden örnekle ki ilerleme ölçümü bozulmasın.
  const relaxed = relaxTrack(resample(smooth, 9), 9);
  const points = resample(relaxed, 9);
  let length = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return { name, points, half: TRACK_HALF, length };
}

/** Merkez çizgideki en yakın nokta — ipucu indeksinin etrafında aranır. */
export function nearestIndex(track: Track, x: number, y: number, hint: number): { idx: number; dist: number } {
  const n = track.points.length;
  let best = hint;
  let bestD = Infinity;
  // Yalnizca yakin pencerede ara: tum pistte aramak her karede N islem demek
  // ve araba pistin karsi tarafindaki bir noktaya "atlayabilir".
  for (let k = -30; k <= 30; k++) {
    const i = ((hint + k) % n + n) % n;
    const p = track.points[i];
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < bestD) { bestD = d; best = i; }
  }
  return { idx: best, dist: Math.sqrt(bestD) };
}

export function freshCar(track: Track, laneOffset = 0): CarState {
  const p = track.points[0];
  const q = track.points[3];
  const heading = Math.atan2(q.y - p.y, q.x - p.x);
  // Izgara: arabalar yolun enine hafifce yayilir
  const nx = -Math.sin(heading);
  const ny = Math.cos(heading);
  return {
    x: p.x + nx * laneOffset,
    y: p.y + ny * laneOffset,
    heading,
    speed: 0,
    offRoad: false,
    idx: 0,
    lap: 0,
    progress: 0,
  };
}

/**
 * Bir fizik adımı.
 *
 * @param steer -1 (sol) .. +1 (sağ)
 *
 * Dönüş gücü hıza bağlı: duran araba dönmez. Sabit olsaydı asfalt dışında
 * sürünürken bile yerinde dönüp çıkabilir, dışarı çıkmanın bedeli kalmazdı.
 */
/**
 * @param throttle 1 = ileri (varsayılan), -1 = geri vites.
 *   Gaz otomatik olduğu için tek anlamlı seçenek geri gitmek: duvara ya da
 *   bariyere burnunu dayamış oyuncu direksiyonla kurtulamıyor.
 */
export function stepCar(
  car: CarState, steer: number, dt: number, track: Track, throttle: number = 1,
): CarState {
  const s = Math.max(-1, Math.min(1, steer));
  // Dönüş oranı hızın BÜYÜKLÜĞÜNE bağlı: geri giderken hız negatif ve
  // işaretli kullanılsaydı direksiyon kilitlenirdi.
  const vRatio = Math.min(1, Math.abs(car.speed) / MAX_SPEED);
  let heading = car.heading + s * TURN_RATE * (0.25 + 0.75 * vRatio) * dt;

  let speed = car.speed;
  let x = car.x + Math.cos(heading) * speed * dt;
  let y = car.y + Math.sin(heading) * speed * dt;

  // --- DÜNYA SINIRI
  // Bu olmadan asfalttan çıkan araba dünyanın dışına doğru sonsuza kadar
  // gidiyordu: canlı testte bir oyuncunun arabası (-4919, 2692) konumuna,
  // yani 1000x620'lik dünyanın binlerce birim dışına ulaştı — TV'de hiç
  // çizilmedi ve oyuncunun yarışa dönmesi pratikte imkânsız hale geldi.
  // Kenar artık duvar: çarpınca hız kesiliyor ama araba ekranda kalıyor.
  const kenar = 12;
  let carpti = false;
  if (x < kenar) { x = kenar; carpti = true; }
  else if (x > WORLD_W - kenar) { x = WORLD_W - kenar; carpti = true; }
  if (y < kenar) { y = kenar; carpti = true; }
  else if (y > WORLD_H - kenar) { y = WORLD_H - kenar; carpti = true; }

  const near = nearestIndex(track, x, y, car.idx);
  let offRoad = near.dist > track.half;

  // --- KURTARMA
  // Duvar arabayı ekranda tutuyor ama pistin çok uzağında sürünen bir oyuncu
  // yine de yarış dışı kalır. Çok uzaklaşan araba, EN SON GEÇTİĞİ noktadan
  // piste geri konuyor. İlerleme kazandırmıyor (idx aynı kalıyor), o yüzden
  // kestirme aracı olarak kullanılamaz — sadece yarışa geri döndürüyor.
  if (near.dist > RECOVER_DIST) {
    const p = track.points[near.idx];
    const q = track.points[(near.idx + 3) % track.points.length];
    x = p.x;
    y = p.y;
    heading = Math.atan2(q.y - p.y, q.x - p.x);
    speed = OFFROAD_SPEED * 0.5;
    offRoad = false;
  }

  // KORNERDE HIZ SIYRILMASI.
  // Fren tuşu yok — tek girdi direksiyon. Direksiyonu kırmak hızı düşürmezse
  // arabanın dönüş yarıçapı (MAX_SPEED/TURN_RATE ≈ 96 birim) firkete
  // virajlardan geniş kalıyor ve oyuncunun çime taşmaktan başka çaresi
  // olmuyordu. Gerçek araba gibi: viraja ne kadar yüklenirsen o kadar
  // yavaşlarsın. Bu aynı zamanda yumuşak çizgiyi ödüllendiriyor.
  const kornerTavan = MAX_SPEED * (1 - CORNER_SCRUB * Math.abs(s));

  if (throttle < 0) speed += (-REVERSE_SPEED - speed) * Math.min(1, dt * 2.5);
  else if (offRoad) speed += (OFFROAD_SPEED - speed) * Math.min(1, dt * 3);
  else if (speed > kornerTavan) speed += (kornerTavan - speed) * Math.min(1, dt * 4);
  else speed = Math.min(kornerTavan, speed + ACCEL * dt);
  if (carpti) speed = Math.max(-REVERSE_SPEED, Math.min(speed, OFFROAD_SPEED * 0.55));

  // --- İLERLEME ve TUR
  const n = track.points.length;
  let idx = car.idx;
  let lap = car.lap;
  // Yalnizca ILERI dogru ve KUCUK adimlarla ilerlet: buyuk siçramayi kabul
  // etseydik pistin ortasindan kestirme yapan biri tur kazanirdi.
  let delta = near.idx - car.idx;
  if (delta < -n / 2) delta += n;       // halkayi tamamladi
  if (delta > n / 2) delta -= n;        // geriye sardi
  if (delta > 0 && delta < 25) {
    idx = car.idx + delta;
    if (idx >= n) { idx -= n; lap += 1; }
  }

  return { x, y, heading, speed, offRoad, idx, lap, progress: lap * n + idx };
}


/** Yarış sonu puanı — diğer yarış oyunlarıyla aynı ölçek. */
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export function pointsForRank(rank: number): number {
  return RACE_POINTS[rank - 1] ?? 0;
}

export function makeSeed(rand: () => number = Math.random): number {
  return Math.floor(rand() * 100000) + 1;
}

// -----------------------------------------------------------------------------
// SUNUCU TARAFI DOĞRULAMA
// -----------------------------------------------------------------------------
// Araba oyuncunun KENDİ telefonunda simüle ediliyor (girdi gecikmesi sıfır
// olsun diye), yani konumda telefon yetkili. Bu, kaba hileyi mümkün kılar:
// "progress = 999999" gönderen anında birinci olurdu. Sunucu fizik
// çalıştırmıyor ama geçen süreye göre FİZİKSEL OLARAK MÜMKÜN olandan uzağa
// gidilemeyeceğini biliyor; sınırı aşan paket sessizce atılıyor.
//
// Tam koruma değil (kod telefonda), ama ölçülü hile için sürüşü gerçekten
// iyi yapmak gerekiyor — parti oyunu için doğru denge.

/** İlerleme sayacını kat edilen mesafeye çevirir. */
export function distanceAt(progress: number, track: Track): number {
  return (progress / track.points.length) * track.length;
}

/** Verilen sürede bu mesafeye ulaşmak mümkün mü? */
export function isPlausible(progress: number, elapsedSec: number, track: Track): boolean {
  if (!Number.isFinite(progress) || progress < 0) return false;
  // %6 pay: telefon saati ile sunucu saati arasındaki kayma ve ilk karedeki
  // hızlanma yuvarlaması için. 90 birim sabit pay da geri sayım anındaki
  // milisaniyelik oynamayı karşılıyor.
  return distanceAt(progress, track) <= MAX_SPEED * Math.max(0, elapsedSec) * 1.06 + 90;
}

// -----------------------------------------------------------------------------
// GİRDİ ÇÖZÜMLEME
// -----------------------------------------------------------------------------
// Bileşenin içinde kalsaydı test edilemezdi: sürüş döngüsü
// requestAnimationFrame'e bağlı ve arka plandaki sekmede hiç çalışmıyor, yani
// "butona bastım, araba döndü mü" zinciri tarayıcıdan doğrulanamıyor. Saf
// fonksiyon olarak burada durunca doğrudan sınanabiliyor.

export interface DriveInput {
  /** SOL butonu basılı. */
  sol: boolean;
  /** SAĞ butonu basılı. */
  sag: boolean;
  /** GERİ butonu basılı. */
  geri: boolean;
  /** Tuval üzerinde parmak sürükleniyor. */
  surukluyor: boolean;
  /** Sürükleme miktarı, -1..1. */
  surukle: number;
}

/**
 * Basılı tuşları tek bir direksiyon/gaz çiftine indirger.
 * Butonlar sürüklemeyi EZER: ikisi aynı anda kullanılıyorsa niyet buton.
 */
export function resolveInput(g: DriveInput): { steer: number; throttle: number } {
  const tus = (g.sag ? 1 : 0) + (g.sol ? -1 : 0);
  const surukle = Math.max(-1, Math.min(1, g.surukle));
  return {
    steer: tus !== 0 ? tus : (g.surukluyor ? surukle : 0),
    throttle: g.geri ? -1 : 1,
  };
}
