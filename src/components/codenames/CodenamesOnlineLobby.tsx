import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Crown, Play, Users, AlertTriangle } from 'lucide-react';
import { CodenamesPlayer, CodenamesTeam } from '../../types/codenames';

import { t } from '../../i18n';
import { T } from '../../i18n/T';
interface CodenamesOnlineLobbyProps {
  roomCode: string;
  players: CodenamesPlayer[];
  errorMessage?: string | null;
  onStartGame: () => void;
  onReturnToHub: () => void;
}

/**
 * Codenames — TV / ana ekran LOBISI.
 *
 * Oda acilinca oyun artik hemen baslamiyor: once bu ekran gorunuyor,
 * oyuncular telefondan katilip takim ve rol seciyor, host baslatiyor.
 * Sunucu da ayni kurali dogruluyor (bkz. server.ts `codenames:start_game`).
 */
export const CodenamesOnlineLobby: React.FC<CodenamesOnlineLobbyProps> = ({
  roomCode,
  players,
  errorMessage,
  onStartGame,
  onReturnToHub,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?game=codenames&room=${roomCode}`;
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [roomCode]);

  const red = players.filter((p) => p.team === 'red');
  const blue = players.filter((p) => p.team === 'blue');
  const unassigned = players.filter((p) => p.team !== 'red' && p.team !== 'blue');

  /** Sunucudaki kuralin aynisi — buton durumu ile gercek davranis uyusmali. */
  const missing: string[] = [];
  for (const [label, team] of [
    [t('Kırmızı'), red],
    ['Mavi', blue],
  ] as const) {
    if (!team.some((p) => p.role === 'spymaster')) missing.push(`${label} lider`);
    if (!team.some((p) => p.role === 'operative')) missing.push(`${label} ajan`);
  }
  const canStart = missing.length === 0;

  const TeamColumn: React.FC<{ team: CodenamesTeam; list: CodenamesPlayer[] }> = ({ team, list }) => {
    const isRed = team === 'red';
    const spymasters = list.filter((p) => p.role === 'spymaster');
    const operatives = list.filter((p) => p.role === 'operative');

    return (
      <div
        className={`flex-1 rounded-3xl p-5 border-2 ${
          isRed
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900'
            : 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-900'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-black ${
              isRed ? 'text-rose-700 dark:text-rose-300' : 'text-sky-700 dark:text-sky-300'
            }`}
          >
            {isRed ? t('🔴 Kırmızı Takım') : t('🔵 Mavi Takım')}
          </h3>
          <span className="text-xs font-black text-slate-500 dark:text-slate-400">
            {t('{a} kişi', { a: list.length })}</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Crown className="w-3.5 h-3.5" />
              {t('Lider (Spymaster)')}</div>
            {spymasters.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                {t('Bekleniyor…')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {spymasters.map((p) => (
                  <span
                    key={p.id}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-400 text-xs font-black text-slate-900 dark:text-white"
                  >
                    👑 {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Users className="w-3.5 h-3.5" />
              {t('Ajanlar')}</div>
            {operatives.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                {t('Bekleniyor…')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {operatives.map((p) => (
                  <span
                    key={p.id}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Ust bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onReturnToHub}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-black transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Parti Arenası')}</button>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('Oda Kodu')}</span>
          <span className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 font-mono font-black text-2xl tracking-[0.3em] border-2 border-amber-400">
            {roomCode}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* QR / katilim */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            {t('Telefondan Katılın')}</h2>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={t('Katılım QR kodu')} className="w-48 h-48 rounded-2xl" />
          ) : (
            <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
              {t('QR yükleniyor…')}</div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-3 max-w-[15rem]">
            <T k="Kamerayla okutun veya {host} adresine girip {code} yazın."
                v={{
                  host: <strong className="text-slate-900 dark:text-white">{window.location.host}</strong>,
                  code: <strong className="text-amber-500">{roomCode}</strong>,
                }} />
          </p>
        </div>

        {/* Takimlar */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <TeamColumn team="red" list={red} />
            <TeamColumn team="blue" list={blue} />
          </div>

          {unassigned.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {t('Takım seçmeyi bekleyenler')}</div>
              <div className="flex flex-wrap gap-1.5">
                {unassigned.map((p) => (
                  <span
                    key={p.id}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-black">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t(errorMessage)}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5" />
              {t('OYUNU BAŞLAT')}</button>
            {!canStart && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center">
                {t('Eksik: {a}', { a: missing.join(' · ') })}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
