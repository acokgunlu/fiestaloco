import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, Play, RotateCcw, Send, Trophy, Undo2 } from 'lucide-react';
import type { FetihGameState, FetihPlayer } from '../../types/fetih';
import { DIRS, frontier, geometry, homeCandidates, ownish, targetState, type GalaxyMove } from '../../data/galaxyLogic';
import { t } from '../../i18n';
import { GalaxyBoard, NeighborCompass, type FlowerOption } from './GalaxyBoard';
import { DUEL_REASON, logLine } from './FetihTvView';
import { AnswerPad, AnswerVerdict, INK, OPTION_COLORS, OPTION_LETTERS, Panel, PrimaryButton, TimerPill, VotePad } from '../quiz/QuizParts';

interface Props {
  roomCode: string;
  me: FetihPlayer;
  gameState: FetihGameState;
  players: FetihPlayer[];
  errorMessage: string | null;
  hostControls: boolean;
  send: (action: string, payload?: Record<string, unknown>) => void;
  onLeave: () => void;
}

const DARK = { background: 'radial-gradient(circle at 30% 12%, #26134d 0%, #0b061c 62%)', border: '3px solid var(--sticker-ink)', boxShadow: '4px 4px 0 var(--sticker-ink)' };

export const FetihControllerView: React.FC<Props> = ({ roomCode, me, gameState: gs, players, errorMessage, hostControls, send, onLeave }) => {
  const colorOf = (pid: string) => players.find((p) => p.id === pid)?.color ?? '#ffffff';
  const nameOf = (pid: string | null | undefined) => players.find((p) => p.id === pid)?.name ?? '?';
  const myHome = gs.cells.find((c) => c.home === me.id);

  /* ------------------------------------------------------ hamle taslağı */
  const [plan, setPlan] = useState<GalaxyMove[]>([]);
  const [focus, setFocus] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const orderKey = `${gs.gameId}-${gs.round}-${gs.phase === 'ORDERS'}`;
  useEffect(() => {
    setPlan([]);
    setSent(false);
    setFocus(null);
  }, [orderKey]);

  // Plan her değiştiğinde taslak olarak gidiyor: süre dolarsa gönderilmemiş plan kaybolmasın.
  useEffect(() => {
    if (gs.phase === 'ORDERS' && !sent) send('orders', { moves: plan, final: false });
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  const fr = useMemo(() => (gs.phase === 'ORDERS' ? frontier(gs.cells, gs.radius, me.id, plan, me.energy) : []), [gs.phase, gs.cells, gs.radius, me.id, me.energy, plan]);
  const mine = useMemo(() => ownish(gs.cells, me.id, plan), [gs.cells, me.id, plan]);
  const current = focus !== null && mine.has(focus) ? focus : (fr[0] ?? myHome?.id ?? null);

  const options: FlowerOption[] = useMemo(() => {
    if (current === null) return [];
    const row = geometry(gs.radius).byDir[current] ?? [];
    return DIRS.map((_, i) => {
      const id = row[i];
      if (id === null || id === undefined) return { id: null, ok: false, label: '', kind: 'edge' as const };
      const st = targetState(gs.cells, me.id, plan, me.energy, id);
      const cell = gs.cells[id];
      const label = st.kind === 'mine' ? t('Senin')
        : st.kind === 'planned' ? t('Planlandı')
        : st.kind === 'hole' ? t('Kara delik')
        : cell.owner ? nameOf(cell.owner)
        : !cell.revealed ? t('Keşfet')
        : cell.kind === 'planet' ? t('Gezegen') : cell.kind === 'asteroid' ? t('Asteroit') : t('Boş sektör');
      const sub = st.kind === 'hole' ? t('geçilmez')
        : st.kind === 'noEnergy' ? t('enerji yok')
        : st.kind === 'enemy' ? t('düello')
        : st.ok ? t('1 enerji') : '';
      return { id, ok: st.ok, label, sub, kind: st.kind };
    });
  }, [current, gs.cells, gs.radius, me.id, me.energy, plan]);

  const queue = (to: number) => {
    if (current === null) return;
    setPlan([...plan, { from: current, to }]);
    setSent(false);
    // Boş yere girildiyse oradan devam edilebilir; rakip sektöründen devam edilemez (sonuç belli değil)
    if (!gs.cells[to].owner) setFocus(to);
  };
  const undo = () => {
    const last = plan[plan.length - 1];
    setPlan(plan.slice(0, -1));
    if (last) setFocus(last.from);
    setSent(false);
  };

  /* ------------------------------------------------------ ana yıldız */
  const candidates = useMemo(() => (gs.phase === 'PICK' && !myHome ? new Set(homeCandidates(gs.cells).ids) : new Set<number>()), [gs.phase, gs.cells, myHome]);

  let body: React.ReactNode = null;
  let showBoard = gs.phase !== 'LOBBY';
  let boardProps: Partial<React.ComponentProps<typeof GalaxyBoard>> = {};

  if (gs.phase === 'LOBBY') {
    body = (
      <div className="space-y-4">
        <Panel className="text-center space-y-2">
          <p className="font-display text-2xl">{t('Odadasın!')}</p>
          <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Oyun başlayınca sisli galakside ana yıldızını seçeceksin.')}</p>
          <p className="text-sm font-black">{t('Oyuncular ({a})', { a: players.length })}: {players.map((p) => p.name).join(', ')}</p>
        </Panel>
        {hostControls ? (
          <PrimaryButton className="w-full" candy="#b892ff" disabled={players.length < 2} onClick={() => send('start_game')}>
            <Play className="w-5 h-5" /> {players.length < 2 ? t('En az 2 oyuncu gerekli') : t('GALAKSİYE ÇIK')}
          </PrimaryButton>
        ) : (
          <p className="text-center text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Oyunun başlaması bekleniyor…')}</p>
        )}
      </div>
    );
  } else if (gs.phase === 'PICK') {
    boardProps = { tappable: candidates, invite: candidates, onCellClick: (id) => send('pick_home', { cell: id }) };
    body = (
      <Panel className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-2xl">{myHome ? t('Ana yıldızın hazır') : t('Ana yıldızını seç')}</p>
          <TimerPill seconds={gs.timerSeconds} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>
          {myHome ? t('{a} senin. Diğerleri seçerken bekle.', { a: myHome.name }) : t('Yukarıdaki galakside kesik çizgili bir sektöre dokun. Diğer ana yıldızlara en az 3 sektör uzak olmalı.')}
        </p>
      </Panel>
    );
  } else if (gs.phase === 'VOTE' && gs.vote) {
    showBoard = false;
    body = <VotePad vote={gs.vote} myId={me.id} onVote={(c) => send('vote', { category: c })} />;
  } else if (gs.phase === 'QUESTION' && gs.question) {
    showBoard = false;
    body = <AnswerPad question={gs.question} seconds={gs.timerSeconds} answered={gs.answeredIds.includes(me.id)} onAnswer={(i) => send('answer', { choice: i })} />;
  } else if (gs.phase === 'ANSWER' && gs.question && gs.quiz) {
    showBoard = false;
    const pick = gs.quiz.picks.find((x) => x.playerId === me.id);
    const order = gs.initiative.indexOf(me.id) + 1;
    body = (
      <AnswerVerdict correct={!!pick?.correct} answered={pick?.choice !== null && pick?.choice !== undefined} rightAnswer={gs.question.o[gs.quiz.correct]}
        detail={<p className="text-sm font-black">{t('{a} enerji · hamle sıran: {b}', { a: me.energy, b: order || '-' })}</p>} />
    );
  } else if (gs.phase === 'ORDERS') {
    const left = me.energy - plan.length;
    boardProps = {
      tappable: new Set(fr),
      onCellClick: (id) => setFocus(id),
      focus: current,
      arrows: plan.map((m) => ({ from: m.from, to: m.to, color: '#ffffff', dashed: true })),
    };
    body = (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-2xl">{t('Hamleni planla')}</p>
          <span className="sticker-pill px-3 py-0.5 text-sm" style={{ background: '#ffd93d', color: INK }}>{t('{a}/{b} enerji', { a: left, b: me.energy })}</span>
        </div>
        {current !== null && gs.cells[current] && (
          <div className="rounded-2xl p-2" style={DARK}>
            <NeighborCompass center={gs.cells[current]} options={options} cells={gs.cells} colorOf={colorOf} onPick={queue} myColor={me.color} />
            <p className="text-[11px] font-bold text-center" style={{ color: '#cfc3ff' }}>{t('Komşuya dokun = o yöne ilerle')}</p>
          </div>
        )}
        {fr.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {fr.map((id) => (
              <button key={id} type="button" onClick={() => setFocus(id)}
                className="sticker-pill px-2.5 py-0.5 text-xs cursor-pointer"
                style={{ background: id === current ? me.color : 'var(--sticker-surface)', color: id === current ? INK : 'var(--sticker-ink)' }}>
                {gs.cells[id].name}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1 text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>
          {plan.length === 0
            ? <p>{t('Henüz hamle yok.')}</p>
            : plan.map((m, i) => {
              const to = gs.cells[m.to];
              return (
                <p key={i}>
                  {i + 1}. <b style={{ color: 'var(--sticker-ink)' }}>{gs.cells[m.from].name}</b> → {to.owner ? t('{a} (düello)', { a: nameOf(to.owner) }) : to.revealed ? to.name : t('sisli sektör')}
                </p>
              );
            })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PrimaryButton candy="#ffffff" disabled={plan.length === 0} onClick={undo}><Undo2 className="w-4 h-4" /> {t('Geri al')}</PrimaryButton>
          <PrimaryButton candy={sent ? '#7bd389' : '#00f5d4'} onClick={() => { send('orders', { moves: plan }); setSent(true); }}>
            <Send className="w-4 h-4" /> {sent ? t('Gönderildi') : t('Gönder')}
          </PrimaryButton>
        </div>
        {sent && <p className="text-xs font-bold text-center" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Değiştirip yeniden gönderebilirsin; herkes gönderince hamleler başlar.')}</p>}
      </div>
    );
  } else if (gs.phase === 'DUEL' && gs.duel) {
    const d = gs.duel;
    const involved = d.attackerId === me.id || d.defenderId === me.id;
    const rival = d.attackerId === me.id ? d.defenderId : d.attackerId;
    const cell = gs.cells[d.cell];
    boardProps = { highlight: d.cell };
    if (involved && d.stage === 'question') {
      showBoard = false;
      const answered = d.answeredIds.includes(me.id);
      body = (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-2xl">{t('Düello!')}</p>
            <TimerPill seconds={gs.timerSeconds} />
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>
            {d.attackerId === me.id ? t('{a} sektörü için {b} ile karşılaşıyorsun.', { a: cell.name, b: nameOf(rival) }) : t('{b}, {a} sektörüne saldırıyor — savun!', { a: cell.name, b: nameOf(rival) })}
            {' '}{cell.kind === 'asteroid' ? t('Asteroit kuşağı: ikiniz de bilirseniz savunan korur.') : t('Doğru ve hızlı olan kazanır.')}
          </p>
          <p className="font-display text-xl leading-snug">{d.question.q}</p>
          <div className="grid gap-2.5">
            {d.question.o.map((o, i) => (
              <button key={i} type="button" disabled={answered} onClick={() => send('duel_answer', { choice: i })}
                className="sticker-btn w-full px-3 py-3 flex items-center gap-3 text-left"
                style={{ background: OPTION_COLORS[i], color: INK }}>
                <span className="font-display text-xl w-6 shrink-0">{OPTION_LETTERS[i]}</span>
                <span className="font-black">{o}</span>
              </button>
            ))}
          </div>
          {answered && <p className="text-sm font-black text-center">{t('Cevabın kilitlendi — sonucu bekle.')}</p>}
        </div>
      );
    } else if (involved) {
      const won = d.winnerId === me.id;
      body = (
        <Panel className="text-center space-y-1" style={{ background: won ? '#00f5d4' : '#ff8fab', color: INK }}>
          <p className="font-display text-3xl">{won ? t('Kazandın!') : t('Kaybettin')}</p>
          <p className="text-sm font-black">{t('Doğru cevap: {a}', { a: d.correct !== undefined ? d.question.o[d.correct] : '?' })}</p>
          <p className="text-sm font-bold">{t(DUEL_REASON[d.reason ?? 'only'])}</p>
        </Panel>
      );
    } else {
      body = (
        <Panel className="space-y-1">
          <p className="font-display text-2xl">{t('Düello')}</p>
          <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('{a} ile {b}, {c} için karşı karşıya.', { a: nameOf(d.attackerId), b: nameOf(d.defenderId), c: cell.name })}</p>
        </Panel>
      );
    }
  } else if (gs.phase === 'RESOLVE') {
    const lastMine = gs.log.filter((e) => e.playerId === me.id || e.otherId === me.id).slice(-4).reverse();
    boardProps = { arrows: gs.lastMove ? [{ from: gs.lastMove.from, to: gs.lastMove.to, color: colorOf(gs.lastMove.playerId) }] : [] };
    body = (
      <Panel className="space-y-1">
        <p className="font-display text-2xl">{t('Hamleler oynanıyor')}</p>
        {gs.moverId && <p className="text-sm font-black">{t('Sıra: {a}', { a: nameOf(gs.moverId) })}</p>}
        {lastMine.map((e, i) => <p key={i} className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{logLine(e, gs, players)}</p>)}
      </Panel>
    );
  } else if (gs.phase === 'GAME_OVER') {
    const rank = [...players].sort((a, b) => b.score - a.score || b.sectors - a.sectors).findIndex((p) => p.id === me.id) + 1;
    const won = gs.winnerPlayerId === me.id;
    body = (
      <div className="space-y-4">
        <Panel className="text-center space-y-2" style={{ background: won ? '#00f5d4' : '#ffd93d', color: INK }}>
          <Trophy className="w-10 h-10 mx-auto" />
          <p className="font-display text-3xl">{won ? t('Galaksi senin!') : t('{a}. oldun', { a: rank })}</p>
          <p className="text-sm font-black">{t('{a} puan · {b} sektör · {c} gezegen', { a: me.score, b: me.sectors, c: me.planets })}</p>
        </Panel>
        {hostControls && (
          <div className="grid grid-cols-1 gap-3">
            <PrimaryButton candy="#b892ff" onClick={() => send('start_game')}><Play className="w-5 h-5" /> {t('Yeni Galaksi')}</PrimaryButton>
            <PrimaryButton candy="#4cc9f0" onClick={() => send('restart_game')}><RotateCcw className="w-5 h-5" /> {t('Lobiye Dön')}</PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-4 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="sticker-pill px-3 py-1 text-sm inline-flex items-center gap-1.5 min-w-0" style={{ background: me.color, color: INK }}>
          <span className="truncate">{me.name}</span>
          {gs.phase !== 'LOBBY' && gs.phase !== 'PICK' && <span className="tabular-nums">· {t('{a} puan', { a: me.score })}</span>}
        </span>
        <div className="flex items-center gap-2">
          <span className="sticker-pill px-2.5 py-0.5 font-mono text-sm" style={{ background: '#ffd93d', color: INK }}>{roomCode}</span>
          <button onClick={onLeave} aria-label={t('Odadan çık')} className="sticker-btn p-1.5" style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showBoard && (
        <div className="rounded-2xl p-2" style={DARK}>
          <GalaxyBoard cells={gs.cells} radius={gs.radius} players={players} showStars={false} {...boardProps} />
        </div>
      )}

      {errorMessage && (
        <div className="sticker sticker-sm px-3 py-2 text-sm font-black" style={{ background: '#ff6b6b', color: INK }}>{t(errorMessage)}</div>
      )}
      {body}
    </div>
  );
};
