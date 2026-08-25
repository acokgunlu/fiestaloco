import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Flag, LogOut, Play, RotateCcw, Users } from 'lucide-react';
import { KapismaGameState, KapismaPlayer } from '../../types/kapisma';
import { CarState, freshCar, generateTrack, resolveInput, stepCar, MAX_SPEED } from '../../data/pistLogic';
import { PistCanvas } from './PistCanvas';
import { t, withLang } from '../../i18n';

interface Props {
  roomCode: string;
  myPlayer: KapismaPlayer | null;
  gameState: KapismaGameState;
  players: KapismaPlayer[];
  errorMessage?: string | null;
  onProgress: (p: {
    x: number; y: number; heading: number;
    speed: number; offRoad: boolean; lap: number; idx: number; progress: number;
  }) => void;
  onLeave: () => void;
  hostControls?: boolean;
  onStartGame?: () => void;
  onNextRace?: () => void;
  onRestartGame?: () => void;
}

/** Tam kilit için parmağın başlangıç noktasından kayması gereken piksel. */
const FULL_LOCK_PX = 85;
/** Sunucuya konum bildirme aralığı (ms). */
const REPORT_MS = 66;

export const KapismaControllerView: React.FC<Props> = ({
  roomCode, myPlayer, gameState, players, errorMessage, onProgress, onLeave,
  hostControls = false, onStartGame, onNextRace, onRestartGame,
}) => {
  const gs = gameState;
  const racing = gs.phase === 'RACING';

  // --- SÜRÜŞ DURUMU: ref'te tutuluyor, state'te DEĞİL.
  // 60 Hz'de setState çağırmak her karede React ağacını yeniden kurardı;
  // araba ref'te yaşıyor, ekrana yalnızca canvas ve saniyede birkaç kez
  // güncellenen hız göstergesi bakıyor.
  /**
   * Pist tohumdan türetiliyor — sunucudan pist geçmiyor, tek bir sayı geçiyor.
   * TV ve bütün telefonlar birebir aynı devreyi kuruyor.
   */
  const track = useMemo(() => generateTrack(gs.seed), [gs.seed]);

  const carRef = useRef<CarState | null>(null);
  const steerRef = useRef(0);
  /** 1 = ileri, -1 = geri vites. */
  const gazRef = useRef(1);
  const touchOriginRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const lastReportRef = useRef(0);
  const finishedRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  /** Sadece gösterge için — saniyede ~8 kez tazeleniyor. */
  const [hud, setHud] = useState({ speed: 0, offRoad: false, lap: 0, progress: 0 });
  /** Sadece butonun basılı görünmesi için — sürüş bunu okumuyor. */
  const [basili, setBasili] = useState({ sol: false, sag: false, geri: false });


  const shareUrl = typeof window === 'undefined'
    ? ''
    : withLang(`${window.location.origin}${window.location.pathname}?game=kapisma&room=${roomCode}`);

  /**
   * Yeni yarış: arabayı ızgaradaki yerine koy.
   *
   * Başlangıç konumu SUNUCUDAN alınıyor (gs.cars), yerel olarak
   * hesaplanmıyor: ızgara sırası sunucudaki oyuncu dizilimine bağlı ve iki
   * taraf ayrı ayrı hesaplasaydı bir oyuncunun arabası TV'de başka yerde
   * doğardı.
   */
  useEffect(() => {
    const spawn = gs.cars.find((c) => c.playerId === myPlayer?.id);
    carRef.current = spawn
      ? { x: spawn.x, y: spawn.y, heading: spawn.heading, speed: 0, offRoad: false, idx: 0, lap: 0, progress: 0 }
      : freshCar(track, 0);
    finishedRef.current = false;
    steerRef.current = 0;
    gazRef.current = 1;
    girdiRef.current = { sol: false, sag: false, geri: false, surukluyor: false, surukle: 0 };
    setBasili({ sol: false, sag: false, geri: false });
    touchOriginRef.current = null;
    setHud({ speed: 0, offRoad: false, lap: 0, progress: 0 });
    // gs.cars kasten bagimlilikta degil: yaris sirasinda saniyede 10 kez
    // degisiyor ve arabayi her yayinda basa sardirirdi.
     
  }, [gs.seed, gs.currentRace, track, myPlayer?.id]);

  // --- SÜRÜŞ DÖNGÜSÜ
  useEffect(() => {
    if (!racing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTsRef.current = performance.now();
    let hudAcc = 0;

    const loop = (ts: number) => {
      // dt tavanı: sekme arka plandan dönünce dev bir dt gelir ve araba
      // pistin dışına ışınlanır. 50 ms'de kesiliyor.
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const car = carRef.current;
      if (car && !finishedRef.current) {
        const next = stepCar(car, steerRef.current, dt, track, gazRef.current);
        carRef.current = next;
        if (next.lap >= gs.settings.laps) finishedRef.current = true;
      }

      if (car && ts - lastReportRef.current >= REPORT_MS) {
        lastReportRef.current = ts;
        const c = carRef.current!;
        onProgressRef.current({
          x: c.x, y: c.y, heading: c.heading,
          speed: c.speed, offRoad: c.offRoad,
          lap: c.lap, idx: c.idx, progress: c.progress,
        });
      }

      hudAcc += dt;
      if (hudAcc > 0.12) {
        hudAcc = 0;
        const c = carRef.current;
        if (c) setHud({ speed: c.speed, offRoad: c.offRoad, lap: c.lap, progress: c.progress });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [racing, track, gs.settings.laps]);

  /**
   * GİRDİ — birincisi BUTONLAR.
   *
   * İlk sürümde tek kontrol "parmağını ekrana koy ve kaydır" idi. Keşfedilir
   * bir kontrol değil: ekranda görünen hiçbir şey öyle bir hareketi
   * çağrıştırmıyor ve oyuncu ne yapacağını anlamıyor. Artık ekranın altında
   * SOL / GERİ / SAĞ butonları var; kaydırma da çalışmaya devam ediyor ama
   * artık gizli birincil kontrol değil, isteyene ince ayar.
   *
   * Üç ayrı bayrak tutuluyor çünkü dokunmatikte aynı anda iki parmak olabilir
   * (sağa dönerken geri basmak gibi); tek bir "aktif buton" değişkeni bunu
   * kaybederdi.
   */
  const girdiRef = useRef({ sol: false, sag: false, geri: false, surukluyor: false, surukle: 0 });

  /** Bayrakları tek bir direksiyon/gaz değerine indirger (bkz. resolveInput). */
  const girdiUygula = () => {
    const { steer, throttle } = resolveInput(girdiRef.current);
    steerRef.current = steer;
    gazRef.current = throttle;
  };

  const butonBas = (yon: 'sol' | 'sag' | 'geri') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // İşaretçi yakalama, parmak butondan kayınca bile bırakma olayının
    // butona gelmesini sağlıyor — yoksa buton "basılı kalıyor" ve araba
    // sonsuza kadar dönüyor. Ama etkin olmayan bir pointerId ile çağrılırsa
    // İSTİSNA ATIYOR ve handler orada kesiliyor; testte tam olarak bu oldu,
    // buton hiç tepki vermedi. Yakalama olsa da olmasa da girdi işlenmeli.
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch { /* yakalama şart değil */ }
    girdiRef.current[yon] = true;
    girdiUygula();
    setBasili({ ...girdiRef.current });
  };
  const butonBirak = (yon: 'sol' | 'sag' | 'geri') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    girdiRef.current[yon] = false;
    girdiUygula();
    setBasili({ ...girdiRef.current });
  };

  // Kaydırma — tuvalin üzerinde, ince ayar için.
  const onDown = (clientX: number) => {
    touchOriginRef.current = clientX;
    girdiRef.current.surukluyor = true;
    girdiRef.current.surukle = 0;
    girdiUygula();
  };
  const onMove = (clientX: number) => {
    if (touchOriginRef.current === null) return;
    const dx = clientX - touchOriginRef.current;
    girdiRef.current.surukle = Math.max(-1, Math.min(1, dx / FULL_LOCK_PX));
    girdiUygula();
  };
  const onUp = () => {
    touchOriginRef.current = null;
    girdiRef.current.surukluyor = false;
    girdiRef.current.surukle = 0;
    girdiUygula();
  };

  // Masaüstünde ok tuşları: sol/sağ direksiyon, aşağı geri vites.
  useEffect(() => {
    if (!racing) return;
    const esle = (k: string) =>
      k === 'ArrowLeft' ? 'sol' : k === 'ArrowRight' ? 'sag' : k === 'ArrowDown' ? 'geri' : null;
    const bas = (e: KeyboardEvent) => {
      const y = esle(e.key);
      if (!y) return;
      e.preventDefault();
      girdiRef.current[y as 'sol' | 'sag' | 'geri'] = true;
      girdiUygula();
      setBasili({ ...girdiRef.current });
    };
    const birak = (e: KeyboardEvent) => {
      const y = esle(e.key);
      if (!y) return;
      girdiRef.current[y as 'sol' | 'sag' | 'geri'] = false;
      girdiUygula();
      setBasili({ ...girdiRef.current });
    };
    window.addEventListener('keydown', bas);
    window.addEventListener('keyup', birak);
    return () => {
      window.removeEventListener('keydown', bas);
      window.removeEventListener('keyup', birak);
    };
  }, [racing]);

  const myCar = gs.cars.find((c) => c.playerId === myPlayer?.id);
  const byScore = [...players].sort((a, b) => b.score - a.score);
  const toplam = track.points.length * gs.settings.laps;
  const pct = Math.min(100, (hud.progress / Math.max(1, toplam)) * 100);

  return (
    <div className="w-full max-w-md mx-auto px-3 py-3 space-y-3 text-slate-900 dark:text-slate-100 animate-fade-in">
      {!racing && (
        <div className="flex items-center justify-between p-3 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg text-white" style={{ backgroundColor: myPlayer?.color || '#ef4444' }}>🏎️</div>
            <div>
              <div className="font-black text-sm truncate max-w-[120px]">{myPlayer?.name}</div>
              <div className="text-xs font-mono font-black text-rose-700 dark:text-rose-400">{t('{a} puan', { a: myPlayer?.score || 0 })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">{roomCode}</span>
            <button onClick={onLeave} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black">
          <AlertTriangle className="w-4 h-4 shrink-0" />{t(errorMessage)}
        </div>
      )}

      {gs.phase === 'LOBBY' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <div className="text-4xl">🏁</div>
          {hostControls ? (
            <>
              <h3 className="text-lg font-black">{t('Oda hazır — arkadaşlarını çağır')}</h3>
              <div className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-950 border-2 border-amber-400">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">{t('ODA KODU')}</p>
                <p className="font-mono font-black text-3xl tracking-[0.3em] text-white">{roomCode}</p>
              </div>
              <button onClick={() => { try { navigator.clipboard?.writeText(shareUrl); } catch { /* izin yok */ } }}
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black flex items-center justify-center gap-2 cursor-pointer">
                <Copy className="w-3.5 h-3.5" /> {t('Bağlantıyı Kopyala')}
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-black">{t('Hazırsın!')}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Odayı kuranın başlatması bekleniyor…')}</p>
            </>
          )}

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" /> {t('Oyuncular ({a})', { a: players.length })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {players.map((p) => (
                <span key={p.id} className="px-2.5 py-1 rounded-xl text-xs font-black border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-left text-xs space-y-1 font-medium text-rose-900 dark:text-rose-200">
            <p>{t('1️⃣ Alttaki SOL ve SAĞ butonlarını basılı tut — direksiyon bu. Gaz otomatik.')}</p>
            <p>{t('2️⃣ Direksiyonu ne kadar sert kırarsan o kadar yavaşlarsın. Yumuşak çizgi hızlıdır.')}</p>
            <p>{t('3️⃣ Çime taşarsan hızın yarıya düşer. Kerb sana ait, çim değil.')}</p>
          </div>

          {hostControls && (
            <button onClick={onStartGame} disabled={players.length < 1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white font-black text-base shadow-xl active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
              <Play className="w-5 h-5" /> {t('BAŞLAT')}
            </button>
          )}
        </div>
      )}

      {gs.phase === 'COUNTDOWN' && (
        <div className="py-16 text-center space-y-2 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-800 shadow-lg">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{t('Parmağını hazırla')}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('{a} tur · {b}', { a: gs.settings.laps, b: t(track.name) })}</p>
          <div className="text-8xl font-black text-amber-500 tabular-nums">{gs.timerSeconds}</div>
        </div>
      )}

      {/*
        SÜRÜŞ EKRANI — tam ekran, üstte ince gösterge.
        Dokunma alanı canvas'ın TAMAMI: başparmağını nereye koyarsan koy,
        oradan kaydırdığın kadar direksiyon kırıyorsun.
      */}
      {/*
        SÜRÜŞ EKRANI — TAM EKRAN KAPLAMA.
        Uygulama başlığı + HUD telefonda 173 piksel yiyordu; geriye pist için
        ~224 piksel kalıyor ve araba bir avuç piksele iniyordu. Telefonu yan
        çevirmek de kurtarmıyordu, çünkü başlık her iki yönde de aynı yeri
        kaplıyor. Yarış boyunca ekranın tamamını alıyoruz; dokunma alanı da
        tuvalin TAMAMI: başparmağını nereye koyarsan koy, oradan kaydırdığın
        kadar direksiyon kırıyorsun.
      */}
      {/*
        PORTAL ŞART: dış kapsayıcıdaki `animate-fade-in` transform uyguluyor
        ve transform'lu bir ata, `position: fixed` çocukları için kapsayıcı
        blok oluşturuyor. Kaplama o yüzden ekranı değil kabı kaplıyordu —
        ölçtüğümde 812x400 yerine 448x24 çıktı ve tuval 0x0'a düştü.
        body'ye taşıyınca gerçekten tam ekran oluyor.
      */}
      {racing && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none touch-none">
          <div className="flex items-center gap-2 px-3 py-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-amber-400 text-[11px] font-black tabular-nums border border-amber-500/40">
              {t('TUR {a}/{b}', { a: Math.min(hud.lap + 1, gs.settings.laps), b: gs.settings.laps })}
            </span>
            {myCar && myCar.position > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-100 text-[11px] font-black tabular-nums border border-slate-700">
                {t('{a}.', { a: myCar.position })}
              </span>
            )}
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-sm font-black tabular-nums ${hud.offRoad ? 'text-rose-400' : 'text-slate-100'}`}>
              {Math.round((hud.speed / MAX_SPEED) * 260)}
            </span>
            <span className="text-[10px] font-black text-slate-500">km/s</span>
            <button onClick={onLeave} className="p-1.5 rounded-lg bg-slate-900 text-rose-400 border border-slate-700 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            className="relative flex-1 min-h-0 flex items-center justify-center px-1"
            onPointerDown={(e) => {
              try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch { /* yakalama şart değil */ }
              onDown(e.clientX);
            }}
            onPointerMove={(e) => onMove(e.clientX)}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <PistCanvas
              seed={gs.seed}
              cars={gs.cars}
              players={players}
              localCarRef={carRef}
              localPlayerId={myPlayer?.id}
              focusPlayerId={myPlayer?.id}
              fitToBox
            />
            {finishedRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                <p className="text-3xl font-black text-white">{t('BİTİRDİN!')}</p>
              </div>
            )}
            {hud.offRoad && !finishedRef.current && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black">
                {t('ASFALTA DÖN!')}
              </div>
            )}
          </div>

          {/*
            KONTROL ÇUBUĞU. Basılı tut = dön; bırakınca düz. Gaz otomatik,
            o yüzden gaz butonu yok — geri vites ise gerekli: bariyere burnunu
            dayamış oyuncu direksiyonla kurtulamıyor.
          */}
          <div className="shrink-0 grid grid-cols-5 gap-1.5 px-1.5 pb-2 pt-1">
            <button
              className={`col-span-2 h-16 rounded-2xl border-2 flex items-center justify-center gap-1.5 text-lg font-black transition-colors cursor-pointer ${
                basili.sol
                  ? 'bg-amber-400 border-amber-300 text-slate-950'
                  : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}
              onPointerDown={butonBas('sol')}
              onPointerUp={butonBirak('sol')}
              onPointerCancel={butonBirak('sol')}
              onPointerLeave={butonBirak('sol')}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={t('Sola dön')}
            >
              <ChevronLeft className="w-7 h-7" /> {t('SOL')}
            </button>

            <button
              className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center text-[11px] font-black transition-colors cursor-pointer ${
                basili.geri
                  ? 'bg-rose-500 border-rose-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              onPointerDown={butonBas('geri')}
              onPointerUp={butonBirak('geri')}
              onPointerCancel={butonBirak('geri')}
              onPointerLeave={butonBirak('geri')}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={t('Geri vites')}
            >
              <RotateCcw className="w-5 h-5 mb-0.5" /> {t('GERİ')}
            </button>

            <button
              className={`col-span-2 h-16 rounded-2xl border-2 flex items-center justify-center gap-1.5 text-lg font-black transition-colors cursor-pointer ${
                basili.sag
                  ? 'bg-amber-400 border-amber-300 text-slate-950'
                  : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}
              onPointerDown={butonBas('sag')}
              onPointerUp={butonBirak('sag')}
              onPointerCancel={butonBirak('sag')}
              onPointerLeave={butonBirak('sag')}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={t('Sağa dön')}
            >
              {t('SAĞ')} <ChevronRight className="w-7 h-7" />
            </button>
          </div>
        </div>,
        document.body,
      )}

      {(gs.phase === 'FINISH' || gs.phase === 'GAME_OVER') && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg text-center space-y-3">
          <Flag className="w-8 h-8 mx-auto text-slate-400" />
          {(() => {
            const mine = (gs.results || []).find((r) => r.playerId === myPlayer?.id);
            if (!mine) return <p className="text-sm font-black text-slate-500">{t('Bu yarışta yoktun')}</p>;
            return (
              <>
                <p className="text-4xl font-black tabular-nums">{t('{a}.', { a: mine.rank })}</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{mine.points}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">{mine.time.toFixed(2)}s</p>
              </>
            );
          })()}
          <div className="pt-1 space-y-1 text-left">
            {byScore.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-black ${
                p.id === myPlayer?.id ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <span className="flex items-center gap-1.5">{i + 1}. <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}</span>
                <span className="font-mono">{p.score}</span>
              </div>
            ))}
          </div>
          {hostControls && gs.phase === 'FINISH' && (
            <button onClick={onNextRace}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black shadow-lg active:scale-95 transition-transform cursor-pointer">
              {t('SONRAKİ YARIŞ →')}
            </button>
          )}
          {hostControls && gs.phase === 'GAME_OVER' && (
            <button onClick={onRestartGame}
              className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-sm shadow-lg active:scale-95 transition-transform inline-flex items-center justify-center gap-2 cursor-pointer">
              <RotateCcw className="w-4 h-4" /> {t('YENİDEN OYNA')}
            </button>
          )}
          {gs.phase === 'GAME_OVER' && gs.winnerPlayerId === myPlayer?.id && (
            <p className="text-sm font-black text-amber-500">{t('🏆 Şampiyon sensin!')}</p>
          )}
        </div>
      )}
    </div>
  );
};
