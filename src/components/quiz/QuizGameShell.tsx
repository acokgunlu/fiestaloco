import React, { useEffect, useState } from 'react';
import { Smartphone, Tv, Users } from 'lucide-react';
import { DEFAULT_PLAYER_PALETTE } from '../../data/wordPacks';
import { playClickSound } from '../../utils/audio';
import type { QuizGameSocket } from '../../utils/useQuizGameSocket';
import { t } from '../../i18n';
import { GameHeader, INK, PrimaryButton } from './QuizParts';

/**
 * Kale Kuşatması ve Dünya Fethi'in giriş ekranı.
 * Üç yol (Kapışma ile aynı): TV'de oda kur, TV olmadan telefondan kur, katıl.
 * Oyun başladıktan sonra ekranı `renderTv` / `renderController` çiziyor.
 */

interface Props<S extends QuizGameSocket<any, any>> {
  socket: S;
  slug: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  candy: string;
  tvHint: string;
  onBackToHub: () => void;
  renderTv: (socket: S, leave: () => void) => React.ReactNode;
  renderController: (socket: S, hostControls: boolean, leave: () => void) => React.ReactNode;
}

export function QuizGameShell<S extends QuizGameSocket<any, any>>({
  socket, slug, title, tagline, icon, candy, tvHint, onBackToHub, renderTv, renderController,
}: Props<S>) {
  const [mode, setMode] = useState<'lobby' | 'host' | 'join' | 'phonehost'>('lobby');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [palette, setPalette] = useState(DEFAULT_PLAYER_PALETTE[0]);

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get('room');
    if (room) {
      setCode(room.toUpperCase());
      setMode('join');
    }
  }, []);

  if (mode === 'host' && socket.roomCode && socket.gameState) {
    return <>{renderTv(socket, () => { socket.leaveRoom(); onBackToHub(); })}</>;
  }
  if ((mode === 'join' || mode === 'phonehost') && socket.myPlayer && socket.gameState) {
    return <>{renderController(socket, mode === 'phonehost', () => { socket.leaveRoom(); setMode('lobby'); })}</>;
  }

  const cards = [
    {
      key: 'host', icon: <Tv className="w-7 h-7" />, candy: '#4cc9f0', rot: -1,
      title: t('TV Ekranı (Host)'), text: tvHint, cta: t('TV ODANI KUR'),
      go: () => { setMode('host'); socket.createRoom(); },
    },
    {
      key: 'phonehost', icon: <Users className="w-7 h-7" />, candy: '#7bd389', rot: 1,
      title: t('TV Yok — Tek Telefondan'), text: t('Paylaşılan ekran gerekmez: soru da seçenekler de herkesin kendi telefonunda. Odayı kuran başlatır.'),
      cta: t('ODAYI TELEFONDAN KUR'), go: () => setMode('phonehost'),
    },
    {
      key: 'join', icon: <Smartphone className="w-7 h-7" />, candy: '#ff8fab', rot: -0.5,
      title: t('Telefondan Katıl'), text: t('TV’deki oda kodunu gir ya da QR kodu okut.'),
      cta: t('ODAYA KATIL'), go: () => setMode('join'),
    },
  ] as const;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 font-body" style={{ color: 'var(--sticker-ink)' }}>
      <GameHeader icon={icon} candy={candy} title={title} subtitle={tagline} onBack={onBackToHub} />

      {mode === 'lobby' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div key={c.key} className="sticker sticker-tilt p-6 flex flex-col justify-between gap-5" style={{ transform: `rotate(${c.rot}deg)` }}>
              <div className="space-y-3">
                <div className="sticker sticker-sm w-14 h-14 flex items-center justify-center" style={{ background: c.candy, color: INK }}>{c.icon}</div>
                <h3 className="font-display text-2xl leading-tight">{c.title}</h3>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--sticker-ink-soft)' }}>{c.text}</p>
              </div>
              <PrimaryButton candy={c.candy} onClick={() => { playClickSound(); c.go(); }}>{c.cta}</PrimaryButton>
            </div>
          ))}
        </div>
      ) : mode === 'host' ? (
        <div className="sticker p-8 text-center font-display text-xl">{socket.isConnected ? t('Oda kuruluyor…') : t('Bağlanıyor…')}</div>
      ) : (
        <div className="sticker w-full max-w-md mx-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">{mode === 'phonehost' ? t('Odayı Kur') : t('Telefondan Odaya Katıl')}</h3>
            <button onClick={() => setMode('lobby')} className="text-sm font-black underline cursor-pointer">{t('İptal')}</button>
          </div>
          {socket.errorMessage && (
            <div className="sticker sticker-sm px-3 py-2 text-sm font-black" style={{ background: '#ff6b6b', color: INK }}>{t(socket.errorMessage)}</div>
          )}
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            playClickSound();
            if (mode === 'phonehost') {
              socket.createAndJoin(name.trim(), palette.avatar, palette.color, palette.name);
              return;
            }
            if (!code.trim()) return;
            socket.joinRoom(code.trim().toUpperCase(), name.trim(), palette.avatar, palette.color, palette.name);
          }}>
            {mode === 'join' && (
              <label className="block space-y-1">
                <span className="text-xs font-black uppercase tracking-wide">{t('Oda Kodu')}</span>
                <input id={`${slug}-code`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('ÖRN: FISH90')} required
                  className="w-full px-4 py-3 rounded-xl font-mono font-black text-xl uppercase tracking-widest text-center focus:outline-none"
                  style={{ background: 'var(--sticker-paper)', border: '3px solid var(--sticker-ink)', color: 'var(--sticker-ink)' }} />
              </label>
            )}
            <label className="block space-y-1">
              <span className="text-xs font-black uppercase tracking-wide">{t('Adınız')}</span>
              <input id={`${slug}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Adınızı yazın…')} required maxLength={18}
                className="w-full px-4 py-3 rounded-xl font-bold focus:outline-none"
                style={{ background: 'var(--sticker-paper)', border: '3px solid var(--sticker-ink)', color: 'var(--sticker-ink)' }} />
            </label>
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wide">{t('Renk Seçin')}</span>
              <div className="grid grid-cols-8 gap-2">
                {DEFAULT_PLAYER_PALETTE.map((pal) => (
                  <button type="button" key={pal.color} onClick={() => setPalette(pal)} aria-label={pal.name}
                    className="h-10 rounded-lg cursor-pointer"
                    style={{ background: pal.color, border: '3px solid var(--sticker-ink)', transform: palette.color === pal.color ? 'scale(1.15)' : 'none', boxShadow: palette.color === pal.color ? '2px 2px 0 var(--sticker-ink)' : 'none' }} />
                ))}
              </div>
            </div>
            <PrimaryButton type="submit" candy={candy} disabled={!socket.isConnected} className="w-full">
              {!socket.isConnected ? t('Bağlanıyor…') : mode === 'phonehost' ? t('ODAYI KUR') : t('KATIL')}
            </PrimaryButton>
          </form>
        </div>
      )}
    </div>
  );
}
