import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Coins, Play, RotateCcw, Ticket } from 'lucide-react';
import {
  BET_AMOUNTS,
  BetKind,
  HorseRaceBet,
  HorseRacePlayer,
  RaceHorse,
} from '../../types/horseRace';
import {
  MAX_RACE_MS,
  TICK_MS,
  createRaceCard,
  describeBet,
  planRace,
  progressAt,
  settleBet,
  type RacePlan,
} from '../../data/horseRaceLogic';
import { HorseRaceTrack } from './HorseRaceTrack';

/**
 * Tek cihaz modu — online modun aynısı, tek fark kuponların sırayla
 * doldurulması. Aynı mantık modülünü kullanır, dolayısıyla oranlar ve
 * ödemeler birebir aynı.
 */
interface Props {
  onBackToLobby: () => void;
}

type Phase = 'SETUP' | 'BETTING' | 'RACING' | 'RESULT';
const TOTAL_RACES = 4;

const KIND_LABEL: Record<BetKind, string> = {
  ganyan: 'Ganyan',
  plase: 'Plase',
  ikili: 'İkili',
};

export const HorseRacePassAndPlay: React.FC<Props> = ({ onBackToLobby }) => {
  const [phase, setPhase] = useState<Phase>('SETUP');
  const [names, setNames] = useState<string[]>(['Oyuncu 1', 'Oyuncu 2']);
  const [newName, setNewName] = useState('');
  const [players, setPlayers] = useState<HorseRacePlayer[]>([]);
  const [horses, setHorses] = useState<RaceHorse[]>([]);
  const [exactaOdds, setExactaOdds] = useState<number[][]>([]);
  const [bettor, setBettor] = useState(0);
  const [kind, setKind] = useState<BetKind>('ganyan');
  const [picks, setPicks] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(BET_AMOUNTS[0]);
  const [raceNo, setRaceNo] = useState(1);
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const timerRef = useRef<number | null>(null);
  const planRef = useRef<RacePlan | null>(null);

  const money = (n: number) => n.toLocaleString('tr-TR');
  const need = kind === 'ikili' ? 2 : 1;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startGame = () => {
    const ps: HorseRacePlayer[] = names.map((n, i) => ({
      id: `lp${i}`, name: n, avatar: '🎫', color: '#64748b', colorName: '',
      money: 1000, correctBets: 0, biggestWin: 0, bet: null,
    }));
    setPlayers(ps);
    setRaceNo(1);
    openBetting(ps, undefined);
  };

  const openBetting = (ps: HorseRacePlayer[], prev?: RaceHorse[]) => {
    const card = createRaceCard(prev);
    setHorses(card.horses);
    setExactaOdds(card.exactaOdds);
    setPlayers(ps.map((p) => ({ ...p, bet: null, lastDelta: 0 })));
    setBettor(0);
    setPicks([]);
    setKind('ganyan');
    setDeltas({});
    setPhase('BETTING');
  };

  const togglePick = (id: string) => {
    setPicks((prev) => {
      if (kind !== 'ikili') return [id];
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return prev.length >= 2 ? [prev[1], id] : [...prev, id];
    });
  };

  const confirmBet = () => {
    if (picks.length !== need) return;
    const next = [...players];
    next[bettor] = { ...next[bettor], bet: { kind, horseIds: [...picks], amount } };
    setPlayers(next);
    setPicks([]);
    setKind('ganyan');
    if (bettor + 1 < next.length) setBettor(bettor + 1);
    else runRace(next);
  };

  const runRace = (ps: HorseRacePlayer[]) => {
    setPhase('RACING');
    const hs = horses.map((h) => ({ ...h }));
    const plan = planRace(hs);
    planRef.current = plan;
    let t = 0;
    timerRef.current = window.setInterval(() => {
      t += TICK_MS;
      hs.forEach((h) => {
        h.progress = progressAt(t, plan.finishAt[h.id], plan.phase[h.id]);
        if (h.rank === null && t >= plan.finishAt[h.id]) h.rank = plan.order.indexOf(h.id) + 1;
      });
      setHorses([...hs]);
      if (hs.every((h) => h.rank !== null) || t >= MAX_RACE_MS) {
        if (timerRef.current) clearInterval(timerRef.current);
        hs.forEach((h) => { if (h.rank === null) h.rank = plan.order.indexOf(h.id) + 1; });
        setHorses([...hs]);
        settle(ps, hs);
      }
    }, TICK_MS);
  };

  const settle = (ps: HorseRacePlayer[], hs: RaceHorse[]) => {
    const ordered = [...hs].sort((a, b) => (a.rank || 99) - (b.rank || 99));
    const first = ordered[0]?.id ?? null;
    const second = ordered[1]?.id ?? null;
    const d: Record<string, number> = {};
    const updated = ps.map((p) => {
      const res = settleBet(p.bet ?? null, hs, first, second, exactaOdds);
      d[p.id] = res.delta;
      return {
        ...p,
        money: Math.max(0, p.money + res.delta),
        lastDelta: res.delta,
        correctBets: p.correctBets + (res.won ? 1 : 0),
      };
    });
    // form çizelgesi bir sonraki yarış için
    hs.forEach((h) => { h.form = [...(h.form || []), h.rank || 0].slice(-5); });
    setDeltas(d);
    setPlayers(updated);
    setPhase('RESULT');
  };

  const nextRace = () => {
    if (raceNo >= TOTAL_RACES) { setPhase('SETUP'); return; }
    setRaceNo(raceNo + 1);
    openBetting(players, horses);
  };

  const leader = [...players].sort((a, b) => b.money - a.money)[0];
  const cur = players[bettor];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-5 text-slate-900 dark:text-slate-100 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBackToLobby} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Mod Seçimi
        </button>
        <span className="text-xs font-black text-slate-500 dark:text-slate-400">
          Tek Cihaz · Yarış {raceNo}/{TOTAL_RACES}
        </span>
      </div>

      {phase === 'SETUP' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-lg font-black">Bahisçiler</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Cihazı sırayla alıp kuponunuzu doldurun; atlar kendi koşar.
          </p>
          <div className="flex flex-wrap gap-2">
            {names.map((n, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-black">{n}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Yeni bahisçi adı…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-bold" />
            <button onClick={() => { if (newName.trim() && names.length < 8) { setNames([...names, newName.trim()]); setNewName(''); } }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-black cursor-pointer">Ekle</button>
          </div>
          <button onClick={startGame} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black shadow-xl flex items-center justify-center gap-2 cursor-pointer">
            <Play className="w-5 h-5" /> GİŞEYİ AÇ
          </button>
        </div>
      )}

      {phase === 'BETTING' && cur && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Kupon sırası</p>
            <h3 className="text-2xl font-black">{cur.name}</h3>
            <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">{money(cur.money)} ₺</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(KIND_LABEL) as BetKind[]).map((k) => (
              <button key={k} onClick={() => { setKind(k); setPicks([]); }}
                className={`py-2.5 rounded-2xl text-xs font-black border-2 cursor-pointer ${
                  kind === k ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                             : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'}`}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {horses.map((h) => {
              const pos = picks.indexOf(h.id);
              return (
                <button key={h.id} onClick={() => togglePick(h.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer ${
                    pos >= 0 ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                             : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'}`}>
                  <span className="flex items-center gap-2 text-sm font-black">
                    <span className="text-xl">{h.emoji}</span> {h.name}
                    {kind === 'ikili' && pos >= 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black">{pos + 1}.</span>
                    )}
                    {h.form.length > 0 && (
                      <span className="text-[9px] font-mono text-slate-400">{h.form.slice(-3).join('-')}</span>
                    )}
                  </span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {kind === 'plase' ? h.placeOdds : h.odds}x
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BET_AMOUNTS.map((a) => (
              <button key={a} onClick={() => setAmount(a)} disabled={cur.money < a}
                className={`py-3 rounded-2xl text-xs font-black border-2 cursor-pointer disabled:opacity-35 ${
                  amount === a ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                               : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'}`}>
                {a >= 1000 ? `${a / 1000}K` : a}
              </button>
            ))}
          </div>

          <button onClick={confirmBet} disabled={picks.length !== need}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black shadow-lg disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
            <Ticket className="w-4 h-4" />
            KUPONU YATIR → {bettor + 1 < players.length ? 'SIRADAKİNE VER' : 'YARIŞI BAŞLAT'}
          </button>
        </div>
      )}

      {(phase === 'RACING' || phase === 'RESULT') && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <HorseRaceTrack horses={horses} />
          </div>

          {phase === 'RESULT' && (
            <>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Coins className="w-4 h-4" /> Kasa
                </div>
                {[...players].sort((a, b) => b.money - a.money).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-sm font-black">
                      {p.name}
                      {p.bet && (
                        <span className="ml-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {describeBet(p.bet, horses)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs font-black ${(deltas[p.id] || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : (deltas[p.id] || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {(deltas[p.id] || 0) > 0 ? '+' : ''}{money(deltas[p.id] || 0)}
                      </span>
                      <span className="font-mono font-black text-sm">{money(p.money)} ₺</span>
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={nextRace}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black shadow-xl flex items-center justify-center gap-2 cursor-pointer">
                {raceNo >= TOTAL_RACES ? (<><RotateCcw className="w-5 h-5" /> {leader?.name} kazandı — yeniden</>) : 'SONRAKİ YARIŞ →'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
