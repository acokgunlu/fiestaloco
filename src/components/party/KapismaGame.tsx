import React, { useEffect, useState } from 'react';
import { ArrowLeft, Smartphone, Tv, Users } from 'lucide-react';
import { useKapismaSocket } from '../../utils/useKapismaSocket';
import { KapismaTvView } from '../kapisma/KapismaTvView';
import { KapismaControllerView } from '../kapisma/KapismaControllerView';
import { DEFAULT_PLAYER_PALETTE } from '../../data/wordPacks';
import { playClickSound } from '../../utils/audio';

import { t } from '../../i18n';
interface Props {
  onBackToHub: () => void;
}

export const KapismaGame: React.FC<Props> = ({ onBackToHub }) => {
  const [mode, setMode] = useState<'lobby' | 'host' | 'join' | 'phonehost'>('lobby');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [palette, setPalette] = useState(DEFAULT_PLAYER_PALETTE[0]);
  const socket = useKapismaSocket();

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get('room');
    if (room) {
      setCode(room.toUpperCase());
      setMode('join');
    }
  }, []);

  if (mode === 'host' && socket.roomCode && socket.gameState) {
    return (
      <KapismaTvView
        roomCode={socket.roomCode}
        gameState={socket.gameState}
        players={socket.players}
        onStartGame={socket.startGame}
        onNextRace={socket.nextRace}
        onRestartGame={socket.restartGame}
        onReturnToHub={() => { socket.leaveRoom(); onBackToHub(); }}
      />
    );
  }

  // TV'li odada telefon = sadece kumanda. TV YOK modunda odayi kuran telefon
  // hem oynar hem yonetir (hostControls).
  if ((mode === 'join' || mode === 'phonehost') && socket.myPlayer && socket.gameState) {
    return (
      <KapismaControllerView
        roomCode={socket.roomCode || ''}
        myPlayer={socket.myPlayer}
        gameState={socket.gameState}
        players={socket.players}
        errorMessage={t(socket.errorMessage)}
        onProgress={socket.sendProgress}
        onLeave={() => { socket.leaveRoom(); setMode('lobby'); }}
        hostControls={mode === 'phonehost'}
        onStartGame={socket.startGame}
        onNextRace={socket.nextRace}
        onRestartGame={socket.restartGame}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-black cursor-pointer">
            <ArrowLeft className="w-4 h-4" />  {t('Parti Arenası')}</button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 text-white flex items-center justify-center text-xl shadow-md border-2 border-white dark:border-slate-700">🏁</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{t('Kapışma')}</h1>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-black border border-sky-300 dark:border-sky-800">
                  {t('GERÇEK SÜRÜŞ')}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{t('Telefonun direksiyon — gerçekten sen sürüyorsun')}</p>
            </div>
          </div>
        </div>
      </div>

      {mode === 'lobby' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-rose-500/30 hover:border-rose-500/70 shadow-2xl transition-all group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Tv className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-2">{t('TV Ekranı (Host)')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('Pist ve bütün arabalar büyük ekranda. Herkes kendi telefonunda gerçekten araba sürer; bu ekran seyirci ekranıdır.')}</p>
            </div>
            <button onClick={() => { playClickSound(); setMode('host'); socket.createRoom(); }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Tv className="w-4 h-4" />  {t('TV ODANI KUR')}</button>
          </div>

          {/*
            TV YOK MODU — tek telefondan oda.
            Paylasilan ekran olmadigi icin turun ortak bilgisi (hedef sure,
            geri sayim, sonuclar) herkesin kendi telefonunda gosteriliyor;
            odayi kuran kisi ayrica baslat/sonraki-tur kontrollerini aliyor.
          */}
          <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-emerald-500/30 hover:border-emerald-500/70 shadow-2xl transition-all group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-2">{t('TV Yok — Tek Telefondan')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('Paylaşılan ekran gerekmez. Pistin tamamı zaten kendi telefonunda; odayı kuran başlatır.')}
              </p>
            </div>
            <button onClick={() => { playClickSound(); setMode('phonehost'); }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Users className="w-4 h-4" /> {t('ODAYI TELEFONDAN KUR')}
            </button>
          </div>

          <div className="flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-2 border-violet-500/30 hover:border-violet-500/70 shadow-2xl transition-all group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-2">{t('Telefondan Katıl')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("TV'deki oda kodunu girin; telefonunuz gerçek direksiyon olsun.")}</p>
            </div>
            <button onClick={() => { playClickSound(); setMode('join'); }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Smartphone className="w-4 h-4" />  {t('ODAYA KATIL')}</button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black">{mode === 'phonehost' ? t('Odayı Kur') : t('Telefondan Odaya Katıl')}</h3>
            <button onClick={() => setMode('lobby')} className="text-xs text-slate-500 dark:text-slate-400 font-bold cursor-pointer">{t('İptal')}</button>
          </div>
          {socket.errorMessage && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {t(socket.errorMessage)}
            </div>
          )}
          <form onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              if (mode === 'phonehost') {
                playClickSound();
                socket.createAndJoin(name.trim(), palette.avatar, palette.color, palette.name);
                return;
              }
              if (!code.trim()) return;
              playClickSound();
              socket.joinRoom(code.trim().toUpperCase(), name.trim(), palette.avatar, palette.color, palette.name, 'player');
            }} className="space-y-4">
            {mode !== 'phonehost' && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">{t('Oda Kodu')}</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('ÖRN: FISH90')} required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-mono font-black text-lg uppercase tracking-widest text-center focus:outline-none focus:border-rose-400" />
            </div>
            )}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">{t('Adınız')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Adınızı yazın…')} required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">{t('Renk Seçin')}</label>
              <div className="grid grid-cols-6 gap-2">
                {DEFAULT_PLAYER_PALETTE.map((pal) => (
                  <button type="button" key={pal.color} onClick={() => setPalette(pal)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                      palette.color === pal.color ? 'ring-2 ring-slate-900 dark:ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: pal.color }}>{pal.avatar}</button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!socket.isConnected}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer">
              {!socket.isConnected ? t('Bağlanıyor…') : 'DİREKSİYONA GEÇ'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
