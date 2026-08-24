import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Coins, Play, RotateCcw } from 'lucide-react';
import { BET_AMOUNTS, Horse, HorseRacePlayer } from '../../types/horseRace';
import {
  MAX_RACE_MS,
  TICK_MS,
  advanceRace,
  computeOdds,
  finalizeUnfinished,
  makeHorse,
  settlePlayer,
} from '../../data/horseRaceLogic';
import { HorseRaceTrack } from './HorseRaceTrack';

/**
 * Tek cihaz modu — BAHİS oyunu.
 *
 * Online modda herkes kendi telefonuna basarak atını koşturuyor; tek cihazda
 * bu mümkün değil (tek ekran, tek parmak). Bu yüzden burada atlar KENDİ
 * KENDİNE koşuyor ve oyuncular sırayla cihazı alıp bahis koyuyor.
 * Kural ve ödeme mantığı online modla aynı (aynı modülü kullanır).
 */
const LOCAL_HORSES = [
  { name: 'Şimşek', emoji: '🐎', color: '#ef4444' },
  { name: 'Kasırga', emoji: '🏇', color: '#3b82f6' },
  { name: 'Yıldız', emoji: '🦄', color: '#a855f7' },
  { name: 'Rüzgar', emoji: '🐴', color: '#10b981' },
];

interface Props {
  onBackToLobby: () => void;
}

type Phase = 'SETUP' | 'BETTING' | 'RACING' | 'RESULT';

export const HorseRacePassAndPlay: React.FC<Props> = ({ onBackToLobby }) => {
  const [phase, setPhase] = useState<Phase>('SETUP');
  const [names, setNames] = useState<string[]>(['Oyuncu 1', 'Oyuncu 2']);
  const [newName, setNewName] = useState('');
  const [players, setPlayers] = useState<HorseRacePlayer[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [bettorIndex, setBettorIndex] = useState(0);
  const [pickedHorse, setPickedHorse] = useState<string | null>(null);
  const [pickedAmount, setPickedAmount] = useState<number>(BET_AMOUNTS[0]);
  const [raceNo, setRaceNo] = useState(1);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const timerRef = useRef<number | null>(null);

  const money = (n: number) => n.toLocaleString('tr-TR');
  const TOTAL_RACES = 3;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startGame = () => {
    const ps: HorseRacePlayer[] = names.map((n, i) => ({
      id: `lp${i}`,
      name: n,
      avatar: '🧍',
      color: '#64748b',
      colorName: '',
      money: 1000,
      wins: 0,
      correctBets: 0,
      bet: null,
    }));
    setPlayers(ps);
    setRaceNo(1);
    beginBetting(ps, 1);
  };

  const beginBetting = (ps: HorseRacePlayer[], race: number) => {
    // Atlar sabit kadro; oranlar önceki yarış galibiyetlerine göre
    const hs = LOCAL_HORSES.map((h, i) => {
      const fake: HorseRacePlayer = { ...ps[0], id: `h${i}`, name: h.name, color: h.color };
      const horse = makeHorse(fake, i, computeOdds({ ...fake, wins: horseWins[i] || 0 }, race - 1));
      horse.emoji = h.emoji;
      return horse;
    });
    setHorses(hs);
    setPlayers(ps.map((p) => ({ ...p, bet: null, lastDelta: 0 })));
    setBettorIndex(0);
    setPickedHorse(null);
    setSummary({});
    setPhase('BETTING');
  };

  const horseWinsRef = useRef<number[]>([0, 0, 0, 0]);
  const horseWins = horseWinsRef.current;

  const confirmBet = () => {
    if (!pickedHorse) return;
    const next = [...players];
    next[bettorIndex] = { ...next[bettorIndex], bet: { horseId: pickedHorse, amount: pickedAmount } };
    setPlayers(next);
    setPickedHorse(null);
    if (bettorIndex + 1 < next.length) {
      setBettorIndex(bettorIndex + 1);
    } else {
      runRace(next);
    }
  };

  const runRace = (ps: HorseRacePlayer[]) => {
    setPhase('RACING');
    const hs = horses.map((h) => ({ ...h }));
    let elapsed = 0;
    timerRef.current = window.setInterval(() => {
      // Tek cihazda dokunuş yok — atlar kendi formlarıyla koşar
      advanceRace(hs, {});
      elapsed += TICK_MS;
      setHorses([...hs]);
      if (hs.every((h) => h.rank !== null) || elapsed >= MAX_RACE_MS) {
        if (timerRef.current) clearInterval(timerRef.current);
        finalizeUnfinished(hs);
        setHorses([...hs]);
        settle(ps, hs);
      }
    }, TICK_MS);
  };

  const settle = (ps: HorseRacePlayer[], hs: Horse[]) => {
    const winner = hs.find((h) => h.rank === 1) || null;
    if (winner) {
      const idx = hs.indexOf(winner);
      horseWinsRef.current[idx] = (horseWinsRef.current[idx] || 0) + 1;
    }
    const deltas: Record<string, number> = {};
    const updated = ps.map((p) => {
      // Tek cihazda oyuncunun kendi atı yok — yalnızca bahis ödemesi
      const bet = p.bet;
      let delta = 0;
      if (bet) {
        if (winner && bet.horseId === winner.id) {
          delta += Math.round(bet.amount * (winner.odds || 3));
        } else {
          delta -= bet.amount;
        }
      }
      deltas[p.id] = delta;
      return { ...p, money: Math.max(0, p.money + delta), lastDelta: delta };
    });
    setSummary(deltas);
    setPlayers(updated);
    setPhase('RESULT');
  };

  const nextRace = () => {
    if (raceNo >= TOTAL_RACES) {
      setPhase('SETUP');
      return;
    }
    const n = raceNo + 1;
    setRaceNo(n);
    beginBetting(players, n);
  };

  const leader = [...players].sort((a, b) => b.money - a.money)[0];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-5 text-slate-900 dark:text-slate-100 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black cursor-pointer"
        >
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
            Tek cihazda atlar kendi kendine koşar; siz sırayla bahis koyarsınız.
          </p>
          <div className="flex flex-wrap gap-2">
            {names.map((n, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-black">
                {n}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Yeni bahisçi adı…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-bold"
            />
            <button
              onClick={() => { if (newName.trim() && names.length < 8) { setNames([...names, newName.trim()]); setNewName(''); } }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-black cursor-pointer"
            >
              Ekle
            </button>
          </div>
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5" /> YARIŞI BAŞLAT
          </button>
        </div>
      )}

      {phase === 'BETTING' && players[bettorIndex] && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sıra</p>
            <h3 className="text-2xl font-black">{players[bettorIndex].name}</h3>
            <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
              {money(players[bettorIndex].money)} ₺
            </p>
          </div>

          <div className="space-y-2">
            {horses.map((h) => (
              <button
                key={h.id}
                onClick={() => setPickedHorse(h.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer ${
                  pickedHorse === h.id
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-black">
                  <span className="text-xl">{h.emoji}</span> {h.name}
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">{h.odds}x</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {BET_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setPickedAmount(a)}
                disabled={players[bettorIndex].money < a}
                className={`py-3 rounded-2xl text-sm font-black border-2 cursor-pointer disabled:opacity-35 ${
                  pickedAmount === a
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                }`}
              >
                {money(a)} ₺
              </button>
            ))}
          </div>

          <button
            onClick={confirmBet}
            disabled={!pickedHorse}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black shadow-lg disabled:opacity-40 cursor-pointer"
          >
            BAHSİ ONAYLA → {bettorIndex + 1 < players.length ? 'SIRADAKİNE VER' : 'YARIŞI BAŞLAT'}
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
                    <span className="text-sm font-black">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs font-black ${(summary[p.id] || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : (summary[p.id] || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {(summary[p.id] || 0) > 0 ? '+' : ''}{money(summary[p.id] || 0)}
                      </span>
                      <span className="font-mono font-black text-sm">{money(p.money)} ₺</span>
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={nextRace}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {raceNo >= TOTAL_RACES ? (<><RotateCcw className="w-5 h-5" /> {leader?.name} kazandı — yeniden</>) : 'SONRAKİ YARIŞ →'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
