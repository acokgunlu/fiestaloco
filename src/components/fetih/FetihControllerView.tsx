import React, { useEffect, useMemo, useState } from 'react';
import { Check, LogOut, Play, RotateCcw, Send, Shield, Swords, Trophy, X } from 'lucide-react';
import type { FetihAttackOrder, FetihGameState, FetihPlayer } from '../../types/fetih';
import { isSeaLink, neighborsOf, territoryName } from '../../data/fetihMap';
import {
  FASTEST_BONUS, QUIZ_BONUS, autoPlacement, baseIncome, ownedProvinces, threatAt, totalTroops, winChance,
} from '../../data/fetihLogic';
import { getLang, t } from '../../i18n';
import { FetihMap } from './FetihMap';
import { Die, battleLine } from './FetihTvView';
import { AnswerPad, AnswerVerdict, INK, Panel, PrimaryButton, TimerPill, VotePad } from '../quiz/QuizParts';

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

const sameAttack = (a: FetihAttackOrder, b: FetihAttackOrder) => a.from === b.from && a.to === b.to;
const pct = (v: number) => {
  const n = Math.round(v * 100);
  return getLang() === 'en' ? `${n}%` : `%${n}`;
};

export const FetihControllerView: React.FC<Props> = ({ roomCode, me, gameState: gs, players, errorMessage, hostControls, send, onLeave }) => {
  const lang = getLang();
  const name = (id: number) => territoryName(id, lang);
  const owned = useMemo(() => ownedProvinces(gs.tiles, me.id), [gs.tiles, me.id]);
  const troops = useMemo(() => totalTroops(gs.tiles, me.id), [gs.tiles, me.id]);
  const ownerName = (id: string | null) => (id ? players.find((p) => p.id === id)?.name ?? '?' : t('tarafsız'));
  const ownerColor = (id: string | null) => (id ? players.find((p) => p.id === id)?.color ?? '#a8a29e' : 'var(--sticker-surface)');

  // --- emir taslağı (yalnızca ORDERS fazında) ------------------------------
  const [place, setPlace] = useState<number | null>(null);
  const [from, setFrom] = useState<number | null>(null);
  const [attacks, setAttacks] = useState<FetihAttackOrder[]>([]);
  const [sent, setSent] = useState(false);
  const orderKey = `${gs.gameId}-${gs.round}-${gs.phase === 'ORDERS'}`;

  /** Yerleştirme hesaba katılmış asker sayısı. */
  const troopsAt = (id: number) => (gs.tiles[id]?.troops ?? 0) + (place === id ? me.reserve : 0);
  /** Saldırı kaynağı olabilecek bölgeler: 2+ asker ve en az bir yabancı komşu. */
  const sources = owned
    .filter((id) => troopsAt(id) >= 2 && neighborsOf(id).some((n) => gs.tiles[n].owner !== me.id))
    .sort((a, b) => troopsAt(b) - troopsAt(a));
  const sourcesKey = sources.join(',');

  useEffect(() => {
    const auto = gs.phase === 'ORDERS' ? autoPlacement(gs.tiles, me.id) : null;
    setPlace(auto);
    setFrom(auto);
    setAttacks([]);
    setSent(false);
    // Yalnızca yeni emir turunda sıfırla; durum her saniye yeniden geliyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  // Yerleştirme değişince kaynak artık saldıramıyorsa seçimi ve geçersiz saldırıları düşür
  useEffect(() => {
    if (from !== null && !sources.includes(from)) setFrom(sources[0] ?? null);
    setAttacks((prev) => {
      const kept = prev.filter((a) => sources.includes(a.from));
      return kept.length === prev.length ? prev : kept;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey]);

  const targets = from === null ? [] : neighborsOf(from).filter((n) => gs.tiles[n].owner !== me.id);

  const toggleAttack = (a: FetihAttackOrder) => {
    setSent(false);
    setAttacks((prev) => {
      if (prev.some((x) => sameAttack(x, a))) return prev.filter((x) => !sameAttack(x, a));
      return [...prev, a].slice(-Math.max(1, me.attacks));
    });
  };

  const onMapClick = (id: number) => {
    if (sources.includes(id)) { setFrom(id); return; }
    if (from !== null && targets.includes(id)) toggleAttack({ from, to: id });
  };

  const placeList = useMemo(
    () => [...owned].sort((a, b) => threatAt(gs.tiles, me.id, b) - threatAt(gs.tiles, me.id, a) || gs.tiles[b].troops - gs.tiles[a].troops),
    [owned, gs.tiles, me.id],
  );

  let body: React.ReactNode = null;

  if (gs.phase === 'LOBBY') {
    body = (
      <div className="space-y-4">
        <Panel className="text-center space-y-2">
          <p className="font-display text-2xl">{t('Odadasın!')}</p>
          <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Oyun başlayınca dünya haritasında sana rastgele 3 bölge düşecek.')}</p>
          <p className="text-sm font-black">{t('Oyuncular ({a})', { a: players.length })}: {players.map((p) => p.name).join(', ')}</p>
        </Panel>
        {hostControls ? (
          <PrimaryButton className="w-full" candy="#7bd389" disabled={players.length < 2} onClick={() => send('start_game')}>
            <Play className="w-5 h-5" /> {players.length < 2 ? t('En az 2 oyuncu gerekli') : t('FETHE BAŞLA')}
          </PrimaryButton>
        ) : (
          <p className="text-center text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Oyunun başlaması bekleniyor…')}</p>
        )}
      </div>
    );
  } else if (gs.phase === 'VOTE' && gs.vote) {
    body = <VotePad vote={gs.vote} myId={me.id} onVote={(c) => send('vote', { category: c })} />;
  } else if (gs.phase === 'QUESTION' && gs.question) {
    body = <AnswerPad question={gs.question} seconds={gs.timerSeconds} answered={gs.answeredIds.includes(me.id)} onAnswer={(i) => send('answer', { choice: i })} />;
  } else if (gs.phase === 'ROLL' && gs.question && gs.quiz && gs.roll) {
    const pick = gs.quiz.picks.find((x) => x.playerId === me.id);
    const fastest = gs.quiz.fastestId === me.id;
    const sum = gs.roll.dice[0] + gs.roll.dice[1];
    const produced = gs.roll.gains[me.id] || 0;
    const raided = gs.roll.raided.find((r) => r.playerId === me.id);
    body = (
      <div className="space-y-4">
        <AnswerVerdict correct={!!pick?.correct} answered={pick?.choice !== null && pick?.choice !== undefined} rightAnswer={gs.question.o[gs.quiz.correct]}
          detail={fastest ? <p className="text-sm font-black">{t('En hızlı sendin: +{a} asker, 2 saldırı, ilk hamle!', { a: FASTEST_BONUS })}</p> : undefined} />
        <Panel className="space-y-2">
          <div className="flex items-center gap-3">
            <Die value={gs.roll.dice[0]} size={44} /><Die value={gs.roll.dice[1]} size={44} />
            <span className="font-display text-3xl tabular-nums ml-auto">{sum}</span>
          </div>
          {raided && <p className="text-sm font-black">{t('Korsanlar {a} bölgesinden 1 asker götürdü.', { a: name(raided.province) })}</p>}
          <ul className="text-sm font-bold space-y-0.5">
            <li>{t('Taban gelir: +{a}', { a: owned.length > 0 ? baseIncome(owned.length) : 0 })}</li>
            {pick?.correct && <li>{t('Doğru cevap: +{a}', { a: QUIZ_BONUS + (fastest ? FASTEST_BONUS : 0) })}</li>}
            <li>{t('Zar üretimi: +{a}', { a: produced })}</li>
          </ul>
          <p className="font-display text-xl">{t('Bu tur yedeğin: {a} asker', { a: me.reserve })}</p>
        </Panel>
      </div>
    );
  } else if (gs.phase === 'ORDERS') {
    body = (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl">{t('Emirlerin')}</p>
          <TimerPill seconds={gs.timerSeconds} />
        </div>

        {/* 1. Yerleştirme */}
        <Panel className="space-y-2 p-4">
          <p className="font-black text-sm inline-flex items-center gap-1.5"><Shield className="w-4 h-4" /> {t('1. {a} yedek askeri nereye yığalım?', { a: me.reserve })}</p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {placeList.map((id) => {
              const threat = threatAt(gs.tiles, me.id, id);
              const border = neighborsOf(id).some((n) => gs.tiles[n].owner !== me.id);
              const selected = place === id;
              return (
                <button key={id} onClick={() => { setPlace(id); setFrom(id); setSent(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-black cursor-pointer"
                  style={{ border: '2.5px solid var(--sticker-ink)', background: selected ? '#ffd93d' : 'var(--sticker-surface)', color: selected ? INK : 'var(--sticker-ink)' }}>
                  <span className="flex-1 truncate">{name(id)}</span>
                  {border && <span className="text-[11px] font-bold opacity-80">{threat > 0 ? t('cephe · {a} düşman', { a: threat }) : t('sınır')}</span>}
                  <span className="tabular-nums">{gs.tiles[id].troops}{selected && me.reserve > 0 ? ` +${me.reserve}` : ''}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* 2. Saldırı: önce kaynak, sonra YALNIZCA onun komşuları */}
        <Panel className="space-y-3 p-4">
          <p className="font-black text-sm inline-flex items-center gap-1.5">
            <Swords className="w-4 h-4" /> {t('2. Saldırı ({a}/{b} seçildi)', { a: attacks.length, b: me.attacks })}
          </p>

          {sources.length === 0 ? (
            <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Saldırmak için en az 2 askerli, sınırda bir bölgen olmalı.')}</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-black uppercase" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Nereden saldıracaksın?')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((id) => (
                    <button key={id} onClick={() => setFrom(id)}
                      className="sticker-pill px-3 py-1 text-sm cursor-pointer"
                      style={{ background: from === id ? me.color : 'var(--sticker-surface)', color: from === id ? INK : 'var(--sticker-ink)' }}>
                      {name(id)} <span className="tabular-nums">{troopsAt(id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {from !== null && (
                <div className="space-y-1.5">
                  <p className="text-xs font-black uppercase" style={{ color: 'var(--sticker-ink-soft)' }}>
                    {t('{a} bölgesinin komşuları', { a: name(from) })}
                  </p>
                  {targets.length === 0 ? (
                    <p className="text-sm font-bold">{t('Bu bölgenin saldırabileceği komşusu yok.')}</p>
                  ) : targets.map((to) => {
                    const tile = gs.tiles[to];
                    const chosen = attacks.some((a) => sameAttack(a, { from, to }));
                    return (
                      <button key={to} onClick={() => toggleAttack({ from, to })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm cursor-pointer"
                        style={{ border: '2.5px solid var(--sticker-ink)', background: chosen ? '#ff6b6b' : 'var(--sticker-surface)', color: chosen ? INK : 'var(--sticker-ink)' }}>
                        <span className="flex-1 min-w-0">
                          <span className="font-black">{name(to)} <span className="tabular-nums">{tile.troops}</span></span>
                          <span className="flex items-center gap-1 text-[11px] font-bold opacity-80">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: ownerColor(tile.owner), border: '1.5px solid var(--sticker-ink)' }} />
                            {ownerName(tile.owner)}{isSeaLink(from, to) ? ` · ${t('deniz geçidi')}` : ''}
                          </span>
                        </span>
                        <span className="font-display text-lg tabular-nums">{pct(winChance(troopsAt(from), tile.troops))}</span>
                        {chosen && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {attacks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Seçilen saldırılar')}</p>
                  {attacks.map((a) => (
                    <div key={`${a.from}-${a.to}`} className="flex items-center gap-2 text-sm font-black">
                      <span className="flex-1 truncate">{name(a.from)} → {name(a.to)}</span>
                      <button onClick={() => toggleAttack(a)} aria-label={t('Kaldır')} className="sticker-btn p-1" style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Panel>

        <PrimaryButton className="w-full" candy={sent ? '#7bd389' : '#ffd93d'} onClick={() => { send('orders', { place, attacks }); setSent(true); }}>
          {sent ? <><Check className="w-5 h-5" /> {t('Gönderildi — değiştirip yeniden gönderebilirsin')}</> : <><Send className="w-5 h-5" /> {t('Emirleri Gönder')}</>}
        </PrimaryButton>
      </div>
    );
  } else if (gs.phase === 'RESOLVE') {
    const mine = gs.battles.filter((b) => b.playerId === me.id || b.defenderId === me.id);
    body = (
      <Panel className="space-y-2">
        <p className="font-display text-2xl">{t('Savaş sonuçları')}</p>
        {mine.length === 0
          ? <p className="text-sm font-bold">{t('Bu tur seni ilgilendiren savaş olmadı.')}</p>
          : mine.map((b, i) => <p key={i} className="text-sm font-bold" style={{ opacity: b.cancelled ? 0.55 : 1 }}>{battleLine(b, players)}</p>)}
      </Panel>
    );
  } else if (gs.phase === 'GAME_OVER') {
    const rank = [...players].sort((a, b) => b.score - a.score).findIndex((p) => p.id === me.id) + 1;
    const won = gs.winnerPlayerId === me.id;
    body = (
      <div className="space-y-4">
        <Panel className="text-center space-y-2" style={{ background: won ? '#7bd389' : '#ffd93d', color: INK }}>
          <Trophy className="w-10 h-10 mx-auto" />
          <p className="font-display text-3xl">{won ? t('Dünya senin!') : t('{a}. oldun', { a: rank })}</p>
          <p className="text-sm font-black">{t('{a} bölge · {b} doğru cevap', { a: me.score, b: me.correctCount })}</p>
        </Panel>
        {hostControls && (
          <div className="grid grid-cols-1 gap-3">
            <PrimaryButton candy="#7bd389" onClick={() => send('start_game')}><Play className="w-5 h-5" /> {t('Yeni Harita')}</PrimaryButton>
            <PrimaryButton candy="#4cc9f0" onClick={() => send('restart_game')}><RotateCcw className="w-5 h-5" /> {t('Lobiye Dön')}</PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  const ordering = gs.phase === 'ORDERS';
  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-4 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="sticker-pill px-3 py-1 text-sm inline-flex items-center gap-1.5 min-w-0" style={{ background: me.color, color: INK }}>
          <span className="truncate">{me.name}</span>
          {gs.phase !== 'LOBBY' && <span className="tabular-nums">· {t('{a} bölge', { a: me.score })} · {t('{a} asker', { a: troops })}</span>}
        </span>
        <div className="flex items-center gap-2">
          <span className="sticker-pill px-2.5 py-0.5 font-mono text-sm" style={{ background: '#ffd93d', color: INK }}>{roomCode}</span>
          <button onClick={onLeave} aria-label={t('Odadan çık')} className="sticker-btn p-1.5" style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {gs.phase !== 'LOBBY' && (
        <Panel className="p-2 space-y-1">
          <FetihMap tiles={gs.tiles} players={players} focusPlayerId={me.id} showTokens={gs.phase === 'ROLL'}
            rolled={gs.phase === 'ROLL' && gs.roll ? gs.roll.dice[0] + gs.roll.dice[1] : null}
            plannedPlace={ordering ? place : null} plannedAttacks={ordering ? attacks : []}
            battles={gs.phase === 'RESOLVE' ? gs.battles : []}
            selectedFrom={ordering ? from : null} targets={ordering ? targets : []}
            zoomIds={ordering && from !== null ? [from, ...neighborsOf(from)] : null}
            onTerritoryClick={ordering ? onMapClick : undefined} />
          {ordering && from !== null && (
            <p className="text-[11px] font-bold text-center" style={{ color: 'var(--sticker-ink-soft)' }}>
              {t('Kırmızı halkalılar {a} bölgesinin komşuları — yalnızca onlara saldırabilirsin.', { a: name(from) })}
            </p>
          )}
        </Panel>
      )}

      {errorMessage && (
        <div className="sticker sticker-sm px-3 py-2 text-sm font-black" style={{ background: '#ff6b6b', color: INK }}>{t(errorMessage)}</div>
      )}
      {body}
    </div>
  );
};
