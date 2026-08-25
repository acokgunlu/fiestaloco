import React, { useEffect, useMemo, useRef } from 'react';
import { CarState, Track, WORLD_H, WORLD_W, generateTrack } from '../../data/pistLogic';
import { renderScenery } from '../../data/pistArt';
import { KapismaCar, KapismaPlayer } from '../../types/kapisma';

interface Props {
  /** Pist tohumu — devre bundan türetiliyor, ağdan pist geçmiyor. */
  seed: number;
  /** Sunucudan gelen arabalar (~10 Hz). */
  cars: KapismaCar[];
  players: KapismaPlayer[];
  /**
   * KENDİ arabam — 60 Hz'de kendi telefonumda simüle ediliyor.
   * Ref olarak alınıyor: prop olsaydı her karede React ağacı yeniden
   * kurulurdu. Bu araba yumuşatmadan, doğrudan çiziliyor; girdiyle görüntü
   * arasında tek karelik bile gecikme olmasın diye.
   */
  localCarRef?: React.MutableRefObject<CarState | null>;
  localPlayerId?: string;
  /** Vurgulanacak oyuncu (TV'de lider, telefonda kendisi). */
  focusPlayerId?: string;
  className?: string;
}

/** Sunucu verisi ile ekran arasındaki yumuşatma hızı (1/sn). */
const SMOOTH = 12;

interface View { x: number; y: number; heading: number }

/** Açıyı en kısa yoldan hedefe çeker — 359°'den 1°'ye giderken geri sarmasın. */
function easeAngle(from: number, to: number, k: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d * k;
}

/**
 * Üstten bakışlı pist tuvali — TV ve telefon aynı bileşeni kullanıyor.
 *
 * NEDEN KAMERA YOK: pistin tamamı 1000x620'lik dünya kutusunda ve tuval bu
 * kutunun tamamını gösteriyor. Takip kamerası olmadığı için "kamera lidere
 * yetişemedi", "sekme arka plandayken kamera dondu" gibi bütün bir hata
 * sınıfı ortadan kalkıyor.
 *
 * ÇİZİM DÖNGÜSÜ BİLEŞENİN KENDİSİNDE: dışarıdan her karede prop alsaydı
 * saniyede 60 kez React render'ı tetiklenirdi. Döngü ref'lerden okuyor,
 * React yalnızca pist değiştiğinde çalışıyor.
 */
export const PistCanvas: React.FC<Props> = ({
  seed, cars, players, localCarRef, localPlayerId, focusPlayerId, className,
}) => {
  const cvRef = useRef<HTMLCanvasElement | null>(null);

  // Pist ve çevre tohum başına BİR KEZ üretiliyor. Çevre (çim, kerb, çakıl,
  // bariyer, tribün) yarış boyunca değişmediği için arka tuvale çizilip her
  // karede blit ediliyor — 60 fps burada korunuyor.
  const track: Track = useMemo(() => generateTrack(seed), [seed]);
  const sahne = useMemo(
    () => renderScenery(WORLD_W, WORLD_H, track, seed),
    [track, seed],
  );

  // Döngünün okuduğu canlı veriler
  const carsRef = useRef(cars);
  carsRef.current = cars;
  const playersRef = useRef(players);
  playersRef.current = players;
  const viewRef = useRef<Map<string, View>>(new Map());

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) return;

    let raf = 0;
    let last = performance.now();

    const draw = (ts: number) => {
      const dt = Math.min(0.25, (ts - last) / 1000);
      last = ts;
      const k = 1 - Math.exp(-SMOOTH * dt);

      g.clearRect(0, 0, WORLD_W, WORLD_H);
      g.drawImage(sahne, 0, 0);

      const list = carsRef.current;
      const pl = playersRef.current;

      for (const car of list) {
        const isLocal = !!localPlayerId && car.playerId === localPlayerId;
        let x: number;
        let y: number;
        let heading: number;

        if (isLocal && localCarRef?.current) {
          // Kendi arabam: yumuşatma YOK, ham simülasyon.
          const c = localCarRef.current;
          x = c.x; y = c.y; heading = c.heading;
          viewRef.current.set(car.playerId, { x, y, heading });
        } else {
          // Başkasının arabası: sunucu 10 Hz yayın yapıyor, doğrudan çizsek
          // saniyede 10 kez zıplardı. Hedefe doğru üstel yumuşatma.
          const prev = viewRef.current.get(car.playerId);
          const v: View = prev
            ? {
                x: prev.x + (car.x - prev.x) * k,
                y: prev.y + (car.y - prev.y) * k,
                heading: easeAngle(prev.heading, car.heading, k),
              }
            : { x: car.x, y: car.y, heading: car.heading };
          viewRef.current.set(car.playerId, v);
          x = v.x; y = v.y; heading = v.heading;
        }

        const p = pl.find((q) => q.id === car.playerId);
        const renk = p?.color || '#ef4444';
        const vurgu = !!focusPlayerId && car.playerId === focusPlayerId;

        // Çimdeyken toz
        if (car.offRoad) {
          g.fillStyle = 'rgba(186,150,96,.5)';
          g.beginPath();
          g.ellipse(x - Math.cos(heading) * 9, y - Math.sin(heading) * 9, 21, 12, heading, 0, Math.PI * 2);
          g.fill();
        }

        g.save();
        g.translate(x, y);
        g.rotate(heading);
        if (vurgu) {
          g.strokeStyle = 'rgba(255,255,255,.85)';
          g.lineWidth = 2;
          g.beginPath();
          g.arc(0, 0, 21, 0, Math.PI * 2);
          g.stroke();
        }
        g.fillStyle = renk;
        g.strokeStyle = '#0f1720';
        g.lineWidth = 2;
        g.beginPath();
        g.roundRect(-15, -9, 30, 18, 5);
        g.fill();
        g.stroke();
        // ön cam — hangi yöne baktığı bir bakışta anlaşılsın
        g.fillStyle = 'rgba(15,23,34,.55)';
        g.beginPath();
        g.roundRect(1, -6, 9, 12, 3);
        g.fill();
        g.restore();

        if (p) {
          g.font = '700 13px ui-sans-serif, system-ui, sans-serif';
          g.textAlign = 'center';
          g.lineWidth = 3.5;
          g.strokeStyle = 'rgba(10,15,22,.9)';
          g.strokeText(p.name, x, y - 18);
          g.fillStyle = vurgu ? '#fde68a' : '#eef2f7';
          g.fillText(p.name, x, y - 18);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [sahne, localCarRef, localPlayerId, focusPlayerId]);

  // Yeni pistte eski yumuşatma konumları geçersiz — yoksa arabalar bir önceki
  // pistteki yerlerinden yenisine doğru süzülür.
  useEffect(() => { viewRef.current.clear(); }, [seed]);

  return (
    <canvas
      ref={cvRef}
      width={WORLD_W}
      height={WORLD_H}
      className={className || 'mx-auto block rounded-2xl border border-slate-300 dark:border-slate-800 shadow-lg bg-[#2f6b3a]'}
      /*
       * Tuvalin kendi boyutu (1000x620) var; genişlik VE yükseklik tavanı
       * verip ikisini de 'auto' bırakınca tarayıcı oranı bozmadan sığdırıyor.
       * Sabit `w-full` iken yatay tutulan telefonda tuval ekrandan taşıyor ve
       * sayfa dikey kayıyordu — yarış sırasında en istenmeyen şey.
       */
      style={className
        // Özel sınıf verildiyse (tam ekran sürüş) sığdırmayı o üstleniyor.
        ? { width: 'auto', height: 'auto' }
        : { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '72vh' }}
      aria-label="Üstten bakışlı yarış pisti"
    />
  );
};
