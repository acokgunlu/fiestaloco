import React, { useMemo } from 'react';
import { Check, Crown, Orbit, Play, RotateCcw, Trophy } from 'lucide-react';
import type { FetihGameState, FetihLogEntry, FetihPlayer } from '../../types/fetih';
import { homeCandidates } from '../../data/galaxyLogic';
import { decimal, t } from '../../i18n';
import { GalaxyBoard, type BoardArrow } from './GalaxyBoard';
import { GameHeader, INK, JoinCard, OPTION_LETTERS, Panel, PlayerChip, PrimaryButton, QuestionBoard, TimerPill, VoteBoard } from '../quiz/QuizParts';

interface Props {
  roomCode: string;
  gameState: FetihGameState;
  players: FetihPlayer[];
  send: (action: string, payload?: Record<string, unknown>) => void;
  onLeave: () => void;
}

export const PHASE_LABEL: Record<FetihGameState['phase'], string> = {
  LOBBY: 'Lobi',
  PICK: 'Ana yıldız seçimi',
  VOTE: 'Kategori oylaması',
  QUESTION: 'Soru',
  ANSWER: 'Enerji dağıtıldı',
  ORDERS: 'Hamleler planlanıyor',
  RESOLVE: 'Hamleler oynanıyor',
  DUEL: 'Düello',
  GAME_OVER: 'Oyun bitti',
};

export const DUEL_REASON: Record<string, string> = {
  only: 'yalnızca kazanan doğru bildi',
  none: 'kimse bilemedi, savunan korudu',
  asteroid: 'ikisi de bildi, asteroitte savunan korur',
  faster: 'ikisi de bildi, kazanan daha hızlıydı',
};

/** Günlük satırı: metin burada, dile göre kuruluyor. */
export function logLine(e: FetihLogEntry, gs: FetihGameState, players: FetihPlayer[]): string {
  const name = (id?: string) => players.find((p) => p.id === id)?.name ?? '?';
  const cell = gs.cells[e.cell]?.name ?? '?';
  switch (e.kind) {
    case 'capture': return t('{a}: {b} sektörünü aldı', { a: name(e.playerId), b: cell });
    case 'hole': return t('{a}: {b} bir kara delik çıktı!', { a: name(e.playerId), b: cell });
    case 'duelWin': return t('{a} düelloyu kazandı: {b} artık onun ({c} kaybetti)', { a: name(e.playerId), b: cell, c: name(e.otherId) });
    case 'duelLoss': return t('{a} düelloyu kaybetti: {b}, {c} elinde kaldı', { a: name(e.playerId), b: cell, c: name(e.otherId) });
    case 'homeFall': return t('ANA YILDIZ DÜŞTÜ: {c} → {a}, {d} sektör el değiştirdi', { a: name(e.playerId), c: name(e.otherId), d: e.count ?? 0 });
    case 'cancel': return t('{a}: {b} hamlesi iptal (kaynak sektör elden gitti)', { a: name(e.playerId), b: cell });
    case 'respawn': return t('{a} galaksiye katıldı: {b}', { a: name(e.playerId), b: cell });
  }
}

/** TV'deki düello kartı: soru, 4 şık, iki oyuncu; açıklamada doğru şık ve seçimler. */
export const DuelCard: React.FC<{ gs: FetihGameState; players: FetihPlayer[] }> = ({ gs, players }) => {
  const d = gs.duel;
  if (!d) return null;
  const pl = (id: string) => players.find((p) => p.id === id);
  const show = d.stage === 'reveal';
  const cell = gs.cells[d.cell];
  const side = (id: string, role: string) => {
    const p = pl(id);
    const pick = d.picks?.find((x) => x.playerId === id);
    const ok = pick && pick.choice !== null && pick.choice === d.correct;
    return (
      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,.06)', border: `2px solid ${show && d.winnerId === id ? '#00f5d4' : 'transparent'}`, boxShadow: show && d.winnerId === id ? '0 0 14px rgba(0,245,212,.4)' : undefined }}>
        <p className="text-xs font-black" style={{ color: p?.color }}>{p?.name} · {role}</p>
        <p className="font-display text-lg text-white tabular-nums">
          {show
            ? (pick && pick.choice !== null ? `${OPTION_LETTERS[pick.choice]} · ${decimal((pick.ms ?? 0) / 1000, 1)} ${t('sn')} · ${ok ? t('doğru') : t('yanlış')}` : t('cevap yok'))
            : (d.answeredIds.includes(id) ? t('cevapladı') : '…')}
        </p>
      </div>
    );
  };
  return (
    <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-[min(94%,480px)] rounded-2xl p-4 grid gap-2"
      style={{ background: 'rgba(22,13,51,.95)', border: '2px solid #b9a8ff', boxShadow: '0 0 30px rgba(185,168,255,.35)' }}>
      <div className="flex items-center justify-between gap-2 text-xs font-black tracking-wide" style={{ color: '#ffd93d' }}>
        <span>{t('DÜELLO')} · {cell?.name}{cell?.kind === 'asteroid' ? ` · ${t('asteroit: ikisi de bilirse savunan korur')}` : ''}</span>
        {!show && <TimerPill seconds={gs.timerSeconds} />}
      </div>
      <p className="font-display text-xl text-white leading-snug">{d.question.q}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {d.question.o.map((o, i) => (
          <span key={i} className="text-sm rounded-lg px-2 py-1" style={{ color: '#e8e0ff', background: show && i === d.correct ? 'rgba(0,245,212,.18)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${show && i === d.correct ? '#00f5d4' : 'transparent'}` }}>
            <b style={{ color: '#ffd93d' }}>{OPTION_LETTERS[i]}</b> {o}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {side(d.attackerId, t('saldırıyor'))}
        {side(d.defenderId, t('savunuyor'))}
      </div>
      {show && d.winnerId && (
        <p className="text-center font-display text-base" style={{ color: '#ffd93d' }}>
          {t('{a} kazandı', { a: pl(d.winnerId)?.name ?? '?' })} · {t(DUEL_REASON[d.reason ?? 'only'])}
        </p>
      )}
    </div>
  );
};

export const FetihTvView: React.FC<Props> = ({ roomCode, gameState: gs, players, send, onLeave }) => {
  const connected = players.filter((p) => p.connected !== false).length;
  const nameOf = (id: string | null) => players.find((p) => p.id === id);
  const ranked = [...players].sort((a, b) => b.score - a.score || b.sectors - a.sectors);
  const invite = useMemo(() => (gs.phase === 'PICK' ? new Set(homeCandidates(gs.cells).ids) : undefined), [gs.phase, gs.cells]);
  const arrows: BoardArrow[] = gs.lastMove && (gs.phase === 'RESOLVE' || gs.phase === 'DUEL')
    ? [{ from: gs.lastMove.from, to: gs.lastMove.to, color: nameOf(gs.lastMove.playerId)?.color }]
    : [];
  const recentLog = [...gs.log].reverse().slice(0, 7);

  let side: React.ReactNode = null;
  if (gs.phase === 'LOBBY') {
    side = (
      <div className="space-y-4">
        <JoinCard slug="galaksi" roomCode={roomCode} />
        <Panel className="space-y-2">
          <p className="font-black text-sm">{t('Oyuncular ({a})', { a: players.length })}</p>
          <div className="flex flex-wrap gap-1.5">
            {players.length === 0
              ? <span className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Bekleniyor…')}</span>
              : players.map((p) => <PlayerChip key={p.id} name={p.name} color={p.color} dim={p.connected === false} />)}
          </div>
        </Panel>
        <PrimaryButton className="w-full" candy="#b892ff" disabled={players.length < 2} onClick={() => send('start_game')}>
          <Play className="w-5 h-5" /> {players.length < 2 ? t('En az 2 oyuncu gerekli') : t('GALAKSİYE ÇIK')}
        </PrimaryButton>
      </div>
    );
  } else if (gs.phase === 'PICK') {
    side = (
      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">{t('Ana yıldızını seç')}</h2>
          <TimerPill seconds={gs.timerSeconds} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Herkes telefonundan sisli galakside bir sektör seçiyor. Seçmeyene süre bitince rastgele bir yer düşer.')}</p>
        <div className="flex flex-wrap gap-1.5">
          {players.map((p) => (
            <PlayerChip key={p.id} name={p.name} color={p.color} dim={p.connected === false}
              suffix={gs.cells.some((c) => c.home === p.id) ? <Check className="w-3.5 h-3.5" /> : null} />
          ))}
        </div>
      </Panel>
    );
  } else if (gs.phase === 'VOTE' && gs.vote) {
    side = <Panel><VoteBoard compact vote={gs.vote} seconds={gs.timerSeconds} total={connected} /></Panel>;
  } else if (gs.phase === 'QUESTION' && gs.question) {
    side = (
      <Panel>
        <QuestionBoard compact question={gs.question} seconds={gs.timerSeconds}
          footer={<p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('{a}/{b} oyuncu cevapladı', { a: gs.answeredIds.length, b: connected })}</p>} />
      </Panel>
    );
  } else if (gs.phase === 'ANSWER' && gs.question && gs.quiz) {
    side = (
      <Panel className="space-y-3">
        <p className="text-xs font-black uppercase" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Doğru cevap')}</p>
        <p className="font-display text-2xl leading-tight">{gs.question.o[gs.quiz.correct]}</p>
        <p className="text-xs font-black uppercase" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Hamle sırası ve enerji')}</p>
        <div className="space-y-1.5">
          {gs.initiative.map((id, i) => {
            const p = nameOf(id);
            if (!p) return null;
            return (
              <div key={id} className="flex items-center gap-2 text-sm font-black">
                <span className="w-5 tabular-nums" style={{ color: 'var(--sticker-ink-soft)' }}>{i + 1}.</span>
                <PlayerChip name={p.name} color={p.color} suffix={<span className="tabular-nums">{t('{a} enerji', { a: p.energy })}</span>} />
              </div>
            );
          })}
        </div>
      </Panel>
    );
  } else if (gs.phase === 'ORDERS') {
    side = (
      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">{t('Hamleler planlanıyor')}</h2>
          <TimerPill seconds={gs.timerSeconds} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Herkes telefonunda komşu sektörlere doğru ilerliyor. Hamleler gizli; birazdan sırayla oynanacak.')}</p>
        <div className="space-y-1.5">
          {gs.initiative.map((id, i) => {
            const p = nameOf(id);
            if (!p) return null;
            return (
              <div key={id} className="flex items-center gap-2 text-sm font-black">
                <span className="w-5 tabular-nums" style={{ color: 'var(--sticker-ink-soft)' }}>{i + 1}.</span>
                <PlayerChip name={p.name} color={p.color} dim={p.connected === false} suffix={gs.submittedIds.includes(id) ? <Check className="w-3.5 h-3.5" /> : null} />
              </div>
            );
          })}
        </div>
      </Panel>
    );
  } else if (gs.phase === 'RESOLVE' || gs.phase === 'DUEL') {
    const mover = nameOf(gs.moverId);
    side = (
      <Panel className="space-y-2">
        <h2 className="font-display text-2xl">{gs.phase === 'DUEL' ? t('Düello!') : t('Hamleler oynanıyor')}</h2>
        {mover && <p className="text-sm font-black">{t('Sıra: {a}', { a: mover.name })}</p>}
      </Panel>
    );
  } else if (gs.phase === 'GAME_OVER') {
    const winner = nameOf(gs.winnerPlayerId);
    side = (
      <Panel className="space-y-4 text-center">
        <Trophy className="w-12 h-12 mx-auto" />
        <h2 className="font-display text-3xl">{winner ? t('{a} galaksiyi fethetti!', { a: winner.name }) : t('Oyun bitti')}</h2>
        {winner && <p className="font-bold">{t('{a} puan · {b} sektör', { a: winner.score, b: winner.sectors })}</p>}
        <div className="grid grid-cols-1 gap-3">
          <PrimaryButton candy="#b892ff" onClick={() => send('start_game')}><Play className="w-5 h-5" /> {t('Yeni Galaksi')}</PrimaryButton>
          <PrimaryButton candy="#4cc9f0" onClick={() => send('restart_game')}><RotateCcw className="w-5 h-5" /> {t('Lobiye Dön')}</PrimaryButton>
        </div>
      </Panel>
    );
  }

  const subtitle = gs.phase === 'LOBBY'
    ? t('Sisli galaksi seni bekliyor')
    : gs.phase === 'PICK' ? t(PHASE_LABEL.PICK)
    : t('Tur {a}/{b} · {c}', { a: Math.max(1, gs.round), b: gs.settings.totalRounds, c: t(PHASE_LABEL[gs.phase]) });

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 py-5 space-y-5 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <GameHeader icon={<Orbit className="w-6 h-6" />} candy="#b892ff" title={t('Galaksi')} roomCode={roomCode} onBack={onLeave} subtitle={subtitle} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-9 space-y-4">
          <div className="relative rounded-[18px] p-3 overflow-hidden"
            style={{ background: 'radial-gradient(circle at 30% 12%, #26134d 0%, #0b061c 62%)', border: '3px solid var(--sticker-ink)', boxShadow: '6px 6px 0 var(--sticker-ink)' }}>
            <GalaxyBoard cells={gs.cells} radius={gs.radius} players={players} invite={invite} arrows={arrows}
              highlight={gs.phase === 'DUEL' && gs.duel ? gs.duel.cell : null} />
            {gs.phase === 'DUEL' && <DuelCard gs={gs} players={players} />}
          </div>
          {gs.phase === 'LOBBY' && (
            <Panel className="space-y-2">
              <h3 className="font-display text-xl">{t('Nasıl oynanır?')}</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm font-semibold" style={{ color: 'var(--sticker-ink-soft)' }}>
                <li>{t('Galaksi sisli. Herkes bir ana yıldız seçer; çevresindeki sektörler açılır.')}</li>
                <li>{t('Her tur kategori oylanır, soru gelir: doğru cevap 2, yanlış 1 enerji. En hızlı doğru önce oynar.')}</li>
                <li>{t('Telefondaki pusula senin komşuluğun: bir komşuya dokun, o yöne ilerle. Her adım 1 enerji.')}</li>
                <li>{t('Sisli yerden gezegen, asteroit ya da kara delik çıkabilir. Kara deliğe giren o tur durur.')}</li>
                <li>{t('Rakibin sektörüne girersen düello: ikinize aynı 4 şıklı soru. Doğru ve hızlı olan kazanır; kimse bilemezse savunan korur.')}</li>
                <li>{t('Ana yıldızı düşenin sektörlerinin yarısı fethedene geçer. Gezegen 3, diğer sektörler 1 puan; {a} tur sonunda en çok puan kazanır.', { a: gs.settings.totalRounds })}</li>
              </ul>
            </Panel>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {side}
          {gs.phase !== 'LOBBY' && (
            <Panel className="space-y-1.5 p-4">
              {ranked.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm" style={{ opacity: p.connected === false ? 0.5 : 1 }}>
                  <span className="font-display w-5 tabular-nums">{i + 1}</span>
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: p.color, border: '2px solid var(--sticker-ink)' }} />
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className="font-black block truncate">{p.name}</span>
                    <span className="font-bold tabular-nums text-xs block truncate" style={{ color: 'var(--sticker-ink-soft)' }}>{t('{a} sektör · {b} gezegen', { a: p.sectors, b: p.planets })}</span>
                  </span>
                  {gs.phase === 'GAME_OVER' && i === 0 && <Crown className="w-4 h-4 shrink-0" />}
                  <span className="sticker-pill px-2 py-0 text-xs tabular-nums" style={{ background: p.color, color: INK }}>{p.score}</span>
                </div>
              ))}
            </Panel>
          )}
          {recentLog.length > 0 && gs.phase !== 'LOBBY' && (
            <Panel className="space-y-1 p-4">
              {recentLog.map((e, i) => (
                <p key={i} className="text-xs font-bold" style={{ color: e.kind === 'homeFall' || e.kind === 'hole' ? 'var(--sticker-ink)' : 'var(--sticker-ink-soft)' }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: nameOf(e.playerId)?.color }} />
                  {logLine(e, gs, players)}
                </p>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
