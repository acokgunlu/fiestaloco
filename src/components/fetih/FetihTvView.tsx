import React from 'react';
import { Check, Crown, Map as MapIcon, Play, RotateCcw, Swords, Trophy, Zap } from 'lucide-react';
import type { FetihBattle, FetihGameState, FetihPlayer } from '../../types/fetih';
import { provinceName } from '../../data/fetihMap';
import { FASTEST_BONUS, QUIZ_BONUS, totalTroops } from '../../data/fetihLogic';
import { t } from '../../i18n';
import { FetihMap } from './FetihMap';
import { GameHeader, INK, JoinCard, Panel, PlayerChip, PrimaryButton, QuestionBoard, TimerPill, VoteBoard } from '../quiz/QuizParts';

interface Props {
  roomCode: string;
  gameState: FetihGameState;
  players: FetihPlayer[];
  send: (action: string, payload?: Record<string, unknown>) => void;
  onLeave: () => void;
}

export const PHASE_LABEL: Record<FetihGameState['phase'], string> = {
  LOBBY: 'Lobi',
  VOTE: 'Kategori oylaması',
  QUESTION: 'Soru',
  ROLL: 'Zar ve üretim',
  ORDERS: 'Emirler',
  RESOLVE: 'Savaşlar',
  GAME_OVER: 'Oyun bitti',
};

/** Zarın yüzü — nokta dizilimiyle, rakamla değil. */
export const Die: React.FC<{ value: number; size?: number }> = ({ value, size = 56 }) => {
  const pips: Record<number, Array<[number, number]>> = {
    1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
    6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={String(value)}>
      <rect x="5" y="5" width="90" height="90" rx="18" style={{ fill: 'var(--sticker-surface)', stroke: 'var(--sticker-ink)', strokeWidth: 7 }} />
      {(pips[value] || []).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" style={{ fill: 'var(--sticker-ink)' }} />)}
    </svg>
  );
};

export function battleLine(b: FetihBattle, players: FetihPlayer[]): string {
  const who = players.find((p) => p.id === b.playerId)?.name ?? '?';
  const from = provinceName(b.from);
  const to = provinceName(b.to);
  if (b.cancelled) return t('{a}: {b} → {c} emri geçersiz kaldı', { a: who, b: from, c: to });
  if (b.conquered) return t('{a}, {b} ilini fethetti ({c} kayıp)', { a: who, b: to, c: b.attLoss });
  return t('{a}, {b} önünde püskürtüldü ({c} kayıp, savunma {d})', { a: who, b: to, c: b.attLoss, d: b.defLoss });
}

export const FetihTvView: React.FC<Props> = ({ roomCode, gameState: gs, players, send, onLeave }) => {
  const connected = players.filter((p) => p.connected !== false).length;
  const nameOf = (id: string | null) => players.find((p) => p.id === id);
  const ranked = [...players].sort((a, b) => b.score - a.score || totalTroops(gs.tiles, b.id) - totalTroops(gs.tiles, a.id));
  const rolledSum = gs.phase === 'ROLL' && gs.roll ? gs.roll.dice[0] + gs.roll.dice[1] : null;

  let side: React.ReactNode = null;
  if (gs.phase === 'LOBBY') {
    side = (
      <div className="space-y-4">
        <JoinCard slug="fetih" roomCode={roomCode} />
        <Panel className="space-y-2">
          <p className="font-black text-sm">{t('Oyuncular ({a})', { a: players.length })}</p>
          <div className="flex flex-wrap gap-1.5">
            {players.length === 0
              ? <span className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Bekleniyor…')}</span>
              : players.map((p) => <PlayerChip key={p.id} name={p.name} color={p.color} dim={p.connected === false} />)}
          </div>
        </Panel>
        <PrimaryButton className="w-full" candy="#7bd389" disabled={players.length < 2} onClick={() => send('start_game')}>
          <Play className="w-5 h-5" /> {players.length < 2 ? t('En az 2 oyuncu gerekli') : t('FETHE BAŞLA')}
        </PrimaryButton>
      </div>
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
  } else if (gs.phase === 'ROLL' && gs.question && gs.quiz && gs.roll) {
    const fastest = nameOf(gs.quiz.fastestId);
    const sum = gs.roll.dice[0] + gs.roll.dice[1];
    side = (
      <div className="space-y-4">
        <Panel className="space-y-2">
          <p className="text-xs font-black uppercase" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Doğru cevap')}</p>
          <p className="font-display text-2xl leading-tight">{gs.question.o[gs.quiz.correct]}</p>
          <div className="flex flex-wrap gap-1.5">
            {gs.quiz.picks.filter((x) => x.correct).map((x) => {
              const p = nameOf(x.playerId);
              return p ? <PlayerChip key={x.playerId} name={p.name} color={p.color} suffix={<span className="tabular-nums">+{QUIZ_BONUS + (x.playerId === gs.quiz!.fastestId ? FASTEST_BONUS : 0)}</span>} /> : null;
            })}
            {gs.quiz.picks.every((x) => !x.correct) && <span className="text-sm font-bold">{t('Kimse bilemedi.')}</span>}
          </div>
          {fastest && (
            <p className="text-sm font-black inline-flex items-center gap-1.5"><Zap className="w-4 h-4" /> {t('En hızlı: {a} — ilk hamle ve 2 saldırı hakkı', { a: fastest.name })}</p>
          )}
        </Panel>
        <Panel className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Die value={gs.roll.dice[0]} /><Die value={gs.roll.dice[1]} /></div>
            <span className="font-display text-5xl tabular-nums">{sum}</span>
          </div>
          {sum === 7 ? (
            <p className="text-sm font-black">{t('Eşkıya baskını! En kalabalık illerden 1’er asker gitti.')}{gs.roll.raided.length === 0 ? ` ${t('Ama kimsenin 4+ askeri yoktu.')}` : ''}</p>
          ) : Object.keys(gs.roll.gains).length === 0 ? (
            <p className="text-sm font-bold">{t('{a} numaralı illerin hiçbiri kimsenin değil — üretim yok.', { a: sum })}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(gs.roll.gains).map(([pid, n]) => {
                const p = nameOf(pid);
                return p ? <PlayerChip key={pid} name={p.name} color={p.color} suffix={<span className="tabular-nums">+{n}</span>} /> : null;
              })}
            </div>
          )}
        </Panel>
      </div>
    );
  } else if (gs.phase === 'ORDERS') {
    side = (
      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">{t('Emirler veriliyor')}</h2>
          <TimerPill seconds={gs.timerSeconds} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Herkes telefonundan yedek askerlerini yerleştirip saldırı hedefini seçiyor. Emirler gizli, aynı anda açılacak.')}</p>
        <div className="space-y-1.5">
          {gs.initiative.map((id, i) => {
            const p = nameOf(id);
            if (!p) return null;
            const done = gs.submittedIds.includes(id);
            return (
              <div key={id} className="flex items-center gap-2 text-sm font-black">
                <span className="w-5 tabular-nums" style={{ color: 'var(--sticker-ink-soft)' }}>{i + 1}.</span>
                <PlayerChip name={p.name} color={p.color} dim={p.connected === false} suffix={<span className="tabular-nums">+{p.reserve}</span>} />
                {done && <Check className="w-4 h-4" />}
              </div>
            );
          })}
        </div>
      </Panel>
    );
  } else if (gs.phase === 'RESOLVE') {
    side = (
      <Panel className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl inline-flex items-center gap-2"><Swords className="w-6 h-6" /> {t('Savaşlar')}</h2>
          <TimerPill seconds={gs.timerSeconds} urgentAt={0} />
        </div>
        {gs.battles.length === 0 ? (
          <p className="text-sm font-bold">{t('Bu tur kimse saldırmadı.')}</p>
        ) : (
          <ol className="space-y-1.5">
            {gs.battles.map((b, i) => {
              const p = nameOf(b.playerId);
              return (
                <li key={i} className="flex items-start gap-2 text-sm font-bold" style={{ opacity: b.cancelled ? 0.5 : 1 }}>
                  <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ background: p?.color, border: '2px solid var(--sticker-ink)' }} />
                  <span>{battleLine(b, players)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    );
  } else if (gs.phase === 'GAME_OVER') {
    const winner = nameOf(gs.winnerPlayerId);
    side = (
      <Panel className="space-y-4 text-center">
        <Trophy className="w-12 h-12 mx-auto" />
        <h2 className="font-display text-3xl">{winner ? t('{a} Anadolu’ya hükmetti!', { a: winner.name }) : t('Oyun bitti')}</h2>
        {winner && <p className="font-bold">{t('{a} il ile birinci', { a: winner.score })}</p>}
        <div className="grid grid-cols-1 gap-3">
          <PrimaryButton candy="#7bd389" onClick={() => send('start_game')}><Play className="w-5 h-5" /> {t('Yeni Harita')}</PrimaryButton>
          <PrimaryButton candy="#4cc9f0" onClick={() => send('restart_game')}><RotateCcw className="w-5 h-5" /> {t('Lobiye Dön')}</PrimaryButton>
        </div>
      </Panel>
    );
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-5 space-y-5 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <GameHeader icon={<MapIcon className="w-6 h-6" />} candy="#7bd389" title={t('İl İl Fetih')} roomCode={roomCode} onBack={onLeave}
        subtitle={gs.phase === 'LOBBY' ? t('Harita rastgele dağıtılacak') : t('Tur {a}/{b} · {c}', { a: Math.max(1, gs.round), b: gs.settings.totalRounds, c: t(PHASE_LABEL[gs.phase]) })} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <Panel className="p-3">
            <FetihMap tiles={gs.tiles} players={players} rolled={rolledSum}
              battles={gs.phase === 'RESOLVE' ? gs.battles : []} showTokens={gs.phase !== 'LOBBY'} showTroops={gs.phase !== 'LOBBY'} />
          </Panel>
          {gs.phase === 'LOBBY' ? (
            <Panel className="space-y-2">
              <h3 className="font-display text-xl">{t('Nasıl oynanır?')}</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm font-semibold" style={{ color: 'var(--sticker-ink-soft)' }}>
                <li>{t('Başlangıç rastgele: herkese dağınık 3 il ve 3’er asker, tarafsız illerde 1-3 asker.')}</li>
                <li>{t('Her tur kategori oylanır, soru gelir. Doğru bilen +{a} asker, en hızlı +{b} daha ve 2 saldırı hakkı alır.', { a: QUIZ_BONUS, b: FASTEST_BONUS })}</li>
                <li>{t('Sonra iki zar atılır: numarası tutan her il sahibine 1 asker üretir. 7 gelirse eşkıya baskını.')}</li>
                <li>{t('Emirler gizli verilir: yedeği bir ile yığ, komşu bir ile saldır. Savaşlar Risk zarlarıyla çözülür.')}</li>
                <li>{t('İlsiz kalan elenmez, boş bir ilde yeniden doğar. {a} tur sonunda en çok ili olan kazanır.', { a: gs.settings.totalRounds })}</li>
              </ul>
            </Panel>
          ) : null}
        </div>

        <div className="lg:col-span-4 space-y-4">
          {side}
          {gs.phase !== 'LOBBY' && (
            <Panel className="space-y-1.5 p-4">
              {ranked.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm" style={{ opacity: p.connected === false ? 0.5 : 1 }}>
                  <span className="font-display w-5 tabular-nums">{i + 1}</span>
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: p.color, border: '2px solid var(--sticker-ink)' }} />
                  <span className="font-black flex-1 truncate">{p.name}</span>
                  {gs.phase === 'GAME_OVER' && i === 0 && <Crown className="w-4 h-4" />}
                  <span className="font-bold tabular-nums" style={{ color: 'var(--sticker-ink-soft)' }}>{t('{a} asker', { a: totalTroops(gs.tiles, p.id) })}</span>
                  <span className="sticker-pill px-2 py-0 text-xs tabular-nums" style={{ background: p.color, color: INK }}>{t('{a} il', { a: p.score })}</span>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
};
