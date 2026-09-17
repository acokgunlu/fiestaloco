import React from 'react';
import { LogOut, Play, Repeat, RotateCcw, Trophy, Zap } from 'lucide-react';
import type { KusatmaGameState, KusatmaPlayer, KusatmaTeam } from '../../types/kusatma';
import { TEAM_COLOR, otherTeam } from '../../data/kusatmaLogic';
import { t } from '../../i18n';
import { HpBar } from './Castle';
import { teamName } from './KusatmaTvView';
import { AnswerPad, AnswerVerdict, INK, Panel, PlayerChip, PrimaryButton, VotePad } from '../quiz/QuizParts';

interface Props {
  roomCode: string;
  me: KusatmaPlayer;
  gameState: KusatmaGameState;
  players: KusatmaPlayer[];
  errorMessage: string | null;
  hostControls: boolean;
  send: (action: string, payload?: Record<string, unknown>) => void;
  onLeave: () => void;
}

export const KusatmaControllerView: React.FC<Props> = ({ roomCode, me, gameState: gs, players, errorMessage, hostControls, send, onLeave }) => {
  const myTeam = me.team;
  const foe = otherTeam(myTeam);
  const canArm = (gs.phase === 'VOTE' || gs.phase === 'QUESTION') && !gs.catapultUsed[myTeam] && !gs.catapultArmed[myTeam];

  const catapult = (gs.phase === 'VOTE' || gs.phase === 'QUESTION') && (
    gs.catapultArmed[myTeam] ? (
      <div className="sticker sticker-sm px-3 py-2 text-center font-black text-sm inline-flex items-center justify-center gap-1.5 w-full" style={{ background: '#ffd93d', color: INK }}>
        <Zap className="w-4 h-4" /> {t('Mancınık kuruldu — bu tur hasar ×2')}
      </div>
    ) : canArm ? (
      <button onClick={() => send('arm_catapult')} className="sticker-btn w-full px-3 py-2.5 font-black text-sm inline-flex items-center justify-center gap-1.5"
        style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
        <Zap className="w-4 h-4" /> {t('Mancınığı kur (takım başına 1 kez, hasar ×2)')}
      </button>
    ) : null
  );

  let body: React.ReactNode = null;

  if (gs.phase === 'LOBBY') {
    body = (
      <div className="space-y-4">
        <Panel className="text-center space-y-3" style={{ background: TEAM_COLOR[myTeam], color: INK }}>
          <p className="text-xs font-black uppercase">{t('Takımın')}</p>
          <p className="font-display text-3xl">{teamName(myTeam)}</p>
          <button onClick={() => send('switch_team')} className="sticker-btn px-4 py-2 font-black text-sm inline-flex items-center gap-1.5"
            style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
            <Repeat className="w-4 h-4" /> {t('{a} takımına geç', { a: teamName(foe) })}
          </button>
        </Panel>
        <Panel className="space-y-2">
          {(['red', 'blue'] as KusatmaTeam[]).map((tm) => (
            <div key={tm} className="flex flex-wrap items-center gap-1.5">
              <span className="font-black text-sm w-full">{teamName(tm)}</span>
              {players.filter((p) => p.team === tm).map((p) => <PlayerChip key={p.id} name={p.name} color={TEAM_COLOR[tm]} dim={p.connected === false} />)}
            </div>
          ))}
        </Panel>
        {hostControls ? (
          <PrimaryButton className="w-full" disabled={players.length < 2} onClick={() => send('start_game')}>
            <Play className="w-5 h-5" /> {players.length < 2 ? t('En az 2 oyuncu gerekli') : t('KUŞATMAYI BAŞLAT')}
          </PrimaryButton>
        ) : (
          <p className="text-center text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Oyunun başlaması bekleniyor…')}</p>
        )}
      </div>
    );
  } else if (gs.phase === 'VOTE' && gs.vote) {
    body = <div className="space-y-4"><VotePad vote={gs.vote} myId={me.id} onVote={(c) => send('vote', { category: c })} />{catapult}</div>;
  } else if (gs.phase === 'QUESTION' && gs.question) {
    body = (
      <div className="space-y-4">
        <AnswerPad question={gs.question} seconds={gs.timerSeconds} answered={gs.answeredIds.includes(me.id)} onAnswer={(i) => send('answer', { choice: i })} />
        {catapult}
      </div>
    );
  } else if (gs.phase === 'REVEAL' && gs.question && gs.result) {
    const r = gs.result;
    const pick = r.picks.find((x) => x.playerId === me.id);
    body = (
      <AnswerVerdict correct={!!pick?.correct} answered={pick?.choice !== null && pick?.choice !== undefined} rightAnswer={gs.question.o[r.correct]}
        detail={
          <p className="text-sm font-black">
            {t('Senin vuruşun: {a} · Takımın toplam: {b}', { a: pick?.damage ?? 0, b: r.damage[myTeam] })}{r.catapult[myTeam] ? ' ×2' : ''}
          </p>
        } />
    );
  } else if (gs.phase === 'GAME_OVER') {
    const won = gs.winnerTeam === myTeam;
    body = (
      <div className="space-y-4">
        <Panel className="text-center space-y-2" style={{ background: gs.winnerTeam === 'draw' ? '#ffd93d' : won ? '#7bd389' : '#ff8fab', color: INK }}>
          <Trophy className="w-10 h-10 mx-auto" />
          <p className="font-display text-3xl">{gs.winnerTeam === 'draw' ? t('Berabere!') : won ? t('Kazandınız!') : t('Surunuz düştü')}</p>
          <p className="text-sm font-black">{t('Senin toplam hasarın: {a} · {b} doğru', { a: me.score, b: me.correctCount })}</p>
        </Panel>
        {hostControls && (
          <div className="grid grid-cols-1 gap-3">
            <PrimaryButton onClick={() => send('start_game')}><Play className="w-5 h-5" /> {t('Tekrar Kuşat')}</PrimaryButton>
            <PrimaryButton candy="#4cc9f0" onClick={() => send('restart_game')}><RotateCcw className="w-5 h-5" /> {t('Takımları Değiştir')}</PrimaryButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-4 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="sticker-pill px-3 py-1 text-sm inline-flex items-center gap-1.5 min-w-0" style={{ background: TEAM_COLOR[myTeam], color: INK }}>
          <span className="truncate">{me.name}</span> · {teamName(myTeam)}
        </span>
        <div className="flex items-center gap-2">
          <span className="sticker-pill px-2.5 py-0.5 font-mono text-sm" style={{ background: '#ffd93d', color: INK }}>{roomCode}</span>
          <button onClick={onLeave} aria-label={t('Odadan çık')} className="sticker-btn p-1.5" style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {gs.phase !== 'LOBBY' && (
        <div className="grid grid-cols-2 gap-3">
          {([myTeam, foe] as KusatmaTeam[]).map((tm) => (
            <div key={tm} className="space-y-1">
              <p className="text-[11px] font-black uppercase truncate">{tm === myTeam ? t('Bizim sur') : t('Rakip sur')} · <span className="tabular-nums">{gs.walls[tm]}</span></p>
              <HpBar hp={gs.walls[tm]} color={TEAM_COLOR[tm]} />
            </div>
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="sticker sticker-sm px-3 py-2 text-sm font-black" style={{ background: '#ff6b6b', color: INK }}>{t(errorMessage)}</div>
      )}
      {body}
    </div>
  );
};
