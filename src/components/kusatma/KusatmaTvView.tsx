import React from 'react';
import { Castle as CastleIcon, Check, Crown, Play, RotateCcw, Trophy, Zap } from 'lucide-react';
import type { KusatmaGameState, KusatmaPlayer, KusatmaTeam } from '../../types/kusatma';
import { KUSATMA_WALL, TEAM_COLOR, otherTeam } from '../../data/kusatmaLogic';
import { t } from '../../i18n';
import { Castle, HpBar } from './Castle';
import { GameHeader, INK, JoinCard, Panel, PlayerChip, PrimaryButton, QuestionBoard, VoteBoard } from '../quiz/QuizParts';

interface Props {
  roomCode: string;
  gameState: KusatmaGameState;
  players: KusatmaPlayer[];
  send: (action: string, payload?: Record<string, unknown>) => void;
  onLeave: () => void;
}

export const teamName = (team: KusatmaTeam) => (team === 'red' ? t('Kızıl Kale') : t('Mavi Kale'));

export const KusatmaTvView: React.FC<Props> = ({ roomCode, gameState: gs, players, send, onLeave }) => {
  const team = (tm: KusatmaTeam) => players.filter((p) => p.team === tm);
  const inGame = gs.phase !== 'LOBBY';
  const connected = players.filter((p) => p.connected !== false).length;

  const castleCard = (tm: KusatmaTeam) => {
    const hit = gs.phase === 'REVEAL' && gs.result ? gs.result.damage[otherTeam(tm)] : 0;
    const fired = gs.phase === 'REVEAL' && gs.result?.catapult[tm];
    const catapultText = gs.catapultArmed[tm] ? t('MANCINIK KURULDU ×2') : gs.catapultUsed[tm] ? t('Mancınık kullanıldı') : t('Mancınık hazır');
    return (
      <Panel className="flex flex-col items-center gap-3 relative" style={{ transform: `rotate(${tm === 'red' ? -1 : 1}deg)` }}>
        <h3 className="font-display text-2xl" style={{ color: 'var(--sticker-ink)' }}>{teamName(tm)}</h3>
        <div className="relative w-full flex justify-center">
          <Castle hp={gs.walls[tm]} color={TEAM_COLOR[tm]} flip={tm === 'blue'} shaking={hit > 0} label={t('{a} suru: {b} can', { a: teamName(tm), b: gs.walls[tm] })} />
          {hit > 0 && (
            <span className="sticker-pill absolute top-0 right-2 px-3 py-1 font-display text-2xl" style={{ background: '#ff6b6b', color: INK }}>−{hit}</span>
          )}
        </div>
        <div className="w-full space-y-1">
          <HpBar hp={gs.walls[tm]} color={TEAM_COLOR[tm]} />
          <p className="text-center font-display text-xl tabular-nums">{gs.walls[tm]} / {KUSATMA_WALL}</p>
        </div>
        <span className="sticker-pill px-3 py-1 text-xs inline-flex items-center gap-1"
          style={{ background: gs.catapultArmed[tm] || fired ? '#ffd93d' : 'var(--sticker-surface)', color: gs.catapultArmed[tm] || fired ? INK : 'var(--sticker-ink)', opacity: gs.catapultUsed[tm] && !fired ? 0.5 : 1 }}>
          <Zap className="w-3.5 h-3.5" /> {fired ? t('MANCINIK ATEŞLENDİ!') : catapultText}
        </span>
        <div className="flex flex-wrap justify-center gap-1.5">
          {team(tm).map((p) => {
            const answered = gs.phase === 'QUESTION' && gs.answeredIds.includes(p.id);
            const pick = gs.phase === 'REVEAL' ? gs.result?.picks.find((x) => x.playerId === p.id) : undefined;
            return (
              <PlayerChip key={p.id} name={p.name} color={p.color} dim={p.connected === false}
                suffix={answered ? <Check className="w-3.5 h-3.5" /> : pick ? <span className="tabular-nums">{pick.correct ? `+${pick.damage}` : '0'}</span> : null} />
            );
          })}
        </div>
      </Panel>
    );
  };

  let center: React.ReactNode = null;
  if (gs.phase === 'LOBBY') {
    center = (
      <div className="space-y-4">
        <Panel className="space-y-3">
          <h3 className="font-display text-2xl">{t('Nasıl oynanır?')}</h3>
          <ul className="space-y-2 text-sm font-semibold" style={{ color: 'var(--sticker-ink-soft)' }}>
            <li>{t('Her tur üç kategori çıkar, en çok oyu alan kategoriden soru gelir.')}</li>
            <li>{t('Doğru cevap karşı surdan can götürür; ne kadar hızlıysan o kadar sert vurursun.')}</li>
            <li>{t('Takımın tek bir mancınık hakkı var: kurduğunuz tur hasar iki katı.')}</li>
            <li>{t('Suru ilk yıkılan kaybeder. {a} tur sonunda ayakta kalan surun canı karar verir.', { a: gs.settings.totalRounds })}</li>
          </ul>
        </Panel>
        <PrimaryButton className="w-full" candy="#ffd93d" disabled={players.length < 2} onClick={() => send('start_game')}>
          <Play className="w-5 h-5" /> {players.length < 2 ? t('En az 2 oyuncu gerekli') : t('KUŞATMAYI BAŞLAT')}
        </PrimaryButton>
      </div>
    );
  } else if (gs.phase === 'VOTE' && gs.vote) {
    center = <Panel><VoteBoard vote={gs.vote} seconds={gs.timerSeconds} total={connected} /></Panel>;
  } else if (gs.phase === 'QUESTION' && gs.question) {
    center = (
      <Panel>
        <QuestionBoard question={gs.question} seconds={gs.timerSeconds}
          footer={<p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('{a}/{b} oyuncu cevapladı', { a: gs.answeredIds.length, b: connected })}</p>} />
      </Panel>
    );
  } else if (gs.phase === 'REVEAL' && gs.question && gs.result) {
    const r = gs.result;
    center = (
      <Panel>
        <QuestionBoard question={gs.question} correct={r.correct} fact={r.fact}
          footer={
            <div className="grid grid-cols-2 gap-3 pt-1">
              {(['red', 'blue'] as KusatmaTeam[]).map((tm) => (
                <div key={tm} className="sticker sticker-sm px-3 py-2 text-center" style={{ background: TEAM_COLOR[tm], color: INK }}>
                  <p className="text-xs font-black uppercase">{teamName(tm)}</p>
                  <p className="font-display text-2xl tabular-nums">{t('{a} hasar', { a: r.damage[tm] })}{r.catapult[tm] ? ' ×2' : ''}</p>
                </div>
              ))}
            </div>
          } />
      </Panel>
    );
  } else if (gs.phase === 'GAME_OVER') {
    const ranked = [...players].sort((a, b) => b.score - a.score);
    const mvp = players.find((p) => p.id === gs.winnerPlayerId);
    center = (
      <Panel className="space-y-4 text-center">
        <Trophy className="w-12 h-12 mx-auto" />
        <h2 className="font-display text-4xl">
          {gs.winnerTeam === 'draw' ? t('Berabere!') : t('{a} kazandı!', { a: teamName(gs.winnerTeam as KusatmaTeam) })}
        </h2>
        {mvp && <p className="font-bold inline-flex items-center gap-1.5"><Crown className="w-4 h-4" /> {t('En sert vuran: {a} ({b} hasar)', { a: mvp.name, b: mvp.score })}</p>}
        <div className="text-left space-y-1.5">
          {ranked.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--sticker-paper)', border: '2.5px solid var(--sticker-ink)' }}>
              <span className="font-display w-6 tabular-nums">{i + 1}</span>
              <span className="w-3 h-3 rounded-full" style={{ background: TEAM_COLOR[p.team], border: '2px solid var(--sticker-ink)' }} />
              <span className="font-black flex-1 truncate">{p.name}</span>
              <span className="text-xs font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('{a} doğru', { a: p.correctCount })}</span>
              <span className="font-display tabular-nums">{p.score}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PrimaryButton candy="#ffd93d" onClick={() => send('start_game')}><Play className="w-5 h-5" /> {t('Tekrar Kuşat')}</PrimaryButton>
          <PrimaryButton candy="#4cc9f0" onClick={() => send('restart_game')}><RotateCcw className="w-5 h-5" /> {t('Takımları Değiştir')}</PrimaryButton>
        </div>
      </Panel>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <GameHeader icon={<CastleIcon className="w-6 h-6" />} candy="#ff9f43" title={t('Kale Kuşatması')} roomCode={roomCode} onBack={onLeave}
        subtitle={inGame ? t('Soru turu {a}/{b}', { a: Math.max(1, gs.round), b: gs.settings.totalRounds }) : t('Takımlar hazırlanıyor')} />

      {gs.phase === 'LOBBY' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4"><JoinCard slug="kusatma" roomCode={roomCode} /></div>
          <div className="lg:col-span-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['red', 'blue'] as KusatmaTeam[]).map((tm) => (
                <Panel key={tm} className="space-y-3" style={{ background: TEAM_COLOR[tm], color: INK }}>
                  <h3 className="font-display text-2xl">{teamName(tm)} <span className="tabular-nums">({team(tm).length})</span></h3>
                  <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                    {team(tm).length === 0
                      ? <span className="text-sm font-bold">{t('Bekleniyor…')}</span>
                      : team(tm).map((p) => <PlayerChip key={p.id} name={p.name} color={p.color} dim={p.connected === false} />)}
                  </div>
                </Panel>
              ))}
            </div>
            {center}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 order-2 lg:order-1">{castleCard('red')}</div>
          <div className="lg:col-span-6 order-1 lg:order-2">{center}</div>
          <div className="lg:col-span-3 order-3">{castleCard('blue')}</div>
        </div>
      )}
    </div>
  );
};
