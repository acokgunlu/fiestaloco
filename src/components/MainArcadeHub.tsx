import React, { useState } from 'react';
import {
  ArrowRight,
  Bomb,
  Car,
  Castle,
  HelpCircle,
  LayoutGrid,
  Orbit,
  Mic,
  Palette,
  PenTool,
  PieChart,
  Play,
  Smartphone,
  Timer,
  Trophy,
  Tv,
  VenetianMask,
} from 'lucide-react';
import { PartyGameType } from '../types/partyGames';
import { playClickSound, playTurnSound } from '../utils/audio';
import { FILTERS, GAMES, GameFilter, filterGames } from '../data/gameRegistry';
import { useHiddenGames } from '../utils/gameVisibility';
import { t } from '../i18n';
import { lookupRoomGame, roomJoinHref } from '../utils/roomLookup';

interface MainArcadeHubProps {
  onSelectGame: (gameId: PartyGameType) => void;
  onOpenRules: () => void;
  onOpenLeaderboard?: () => void;
}

/**
 * Kart görselleri tasarımda yer tutucuydu ("illo: bomb with letters").
 * Emoji yerine kalın çizgili ikon kullanıldı: çıkartma dili tamamen kontur
 * üzerine kurulu ve emoji o konturu bozuyor.
 */
const ICONS: Record<PartyGameType, React.ComponentType<{ className?: string }>> = {
  imposter: PenTool,
  codenames: LayoutGrid,
  kapisma: Car,
  bluff: VenetianMask,
  bomb: Bomb,
  trivia_pursuit: PieChart,
  race: Trophy,
  colory: Palette,
  timing: Timer,
  quiplash: Mic,
  kusatma: Castle,
  fetih: Orbit,
};

export function MainArcadeHub({
  onSelectGame,
  onOpenRules,
  onOpenLeaderboard,
}: MainArcadeHubProps) {
  const [quickRoomCode, setQuickRoomCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [filter, setFilter] = useState<GameFilter>('hepsi');

  // Kod hangi oyunun, önce sunucuya soruluyor; yoksa burada söyleniyor.
  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickRoomCode.trim().toUpperCase();
    if (!code || joining) return;
    playClickSound();
    setJoining(true);
    setJoinError(null);
    const game = await lookupRoomGame(code);
    setJoining(false);
    if (game === null) {
      setJoinError(t('Oda bulunamadı: {a}', { a: code }));
      return;
    }
    window.location.href = roomJoinHref(code, game);
  };

  // Yönetim panelinden gizlenen oyunlar hub'da hiç listelenmez.
  const { hidden } = useHiddenGames();
  const acik = GAMES.filter((g) => !hidden.has(g.id));
  const gorunen = filterGames(acik, filter);
  // Oda kodu kutuları: girilen harfler dolu, kalanlar kesik çizgili.
  // Kodlar kelime + 2 rakam: FOX42 (5) ya da STAR86 (6).
  const kutular = [0, 1, 2, 3, 4, 5].map((i) => quickRoomCode[i] || '');

  return (
    <div
      id="main-arcade-hub"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 animate-fade-in font-body"
      style={{ color: 'var(--sticker-ink)' }}
    >
      {/* ---------------------------------------------------------------- HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-10 items-center">
        <div className="flex flex-col gap-4">
          <span
            className="sticker-pill self-start px-3.5 py-1.5 text-[11px] uppercase tracking-wide"
            style={{ background: '#ffd93d', color: '#1c1917', transform: 'rotate(-3deg)' }}
          >
            {t('TV + telefon parti konsolu')}
          </span>

          {/*
            Başlık iki katmanlı gölge kullanıyor: önce şeker rengi, sonra
            mürekkep. Tek katman olsaydı yazı zeminden kopmuyordu.
          */}
          <h1 className="font-display leading-[0.92] text-[64px] sm:text-[88px] lg:text-[104px]">
            <span style={{ color: 'var(--sticker-ink)', textShadow: '5px 5px 0 #ff5d8f, 10px 10px 0 var(--sticker-ink)' }}>
              FIESTA
            </span>
            <br />
            {/*
              LOCO açık dolgulu; kontur OLMADAN harflerin içi kâğıt zemine
              karışıyordu ve yalnızca gölgeler görünüyordu (canlıda okunmadı).
              Kontur mürekkep renginde ve paint-order ile dolgunun ARKASINA
              çiziliyor, yani beyaz dolguyu inceltmiyor. Koyu temada mürekkep
              kâğıt rengine döndüğü için kontur orada da harfi ayırıyor.
            */}
            <span
              style={{
                color: 'var(--sticker-surface)',
                WebkitTextStroke: '0.055em var(--sticker-ink)',
                paintOrder: 'stroke fill',
                textShadow: '5px 5px 0 #4cc9f0, 10px 10px 0 var(--sticker-ink)',
              }}
            >
              LOCO
            </span>
          </h1>

          <p className="max-w-md text-base sm:text-[17px] font-bold leading-relaxed" style={{ color: 'var(--sticker-ink-soft)' }}>
            {t('Bir ekranda toplanın, telefonlar kumanda olsun. On oyun, tek oda kodu.')}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              onClick={() => { playClickSound(); if (acik[0]) onSelectGame(acik[0].id); }}
              className="sticker-btn font-display px-6 py-4 text-lg sm:text-xl flex items-center gap-2"
              style={{ background: '#7bd389', color: '#1c1917' }}
            >
              <Tv className="w-5 h-5" strokeWidth={2.5} />
              {t("TV'DE AÇ")}
            </button>
            <span className="text-[13px] font-bold max-w-[190px] leading-snug" style={{ color: 'var(--sticker-ink-soft)' }}>
              {t('Oda kodu ve QR TV ekranında belirir')}
            </span>
          </div>
        </div>

        {/* Telefonla katıl paneli — tasarımda hafif eğik duruyor. */}
        <div className="sticker sticker-lg p-6 flex flex-col gap-4" style={{ transform: 'rotate(1.5deg)' }}>
          <div className="font-display text-xl flex items-center gap-2">
            <Smartphone className="w-5 h-5" strokeWidth={2.5} />
            {t('Telefonla katıl')}
          </div>

          <form onSubmit={handleQuickJoin} className="flex flex-col gap-3">
            <div className="flex gap-2">
              {kutular.map((harf, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 h-14 sm:h-16 rounded-xl flex items-center justify-center font-display text-2xl sm:text-3xl"
                  style={
                    harf
                      ? { border: '3px solid var(--sticker-ink)', background: '#ffd93d', color: '#1c1917' }
                      : { border: '3px dashed var(--sticker-ink-faint)', color: 'var(--sticker-ink-faint)' }
                  }
                >
                  {harf || (i === quickRoomCode.length ? '_' : '')}
                </div>
              ))}
            </div>

            {/* Kutular görsel; asıl giriş bu alan. Ekran okuyucu ve klavye
                için gerçek bir input şart, kutular onu yansıtıyor. */}
            <input
              id="input-quick-room-code"
              type="text"
              maxLength={6}
              placeholder={t('ODA KODU')}
              value={quickRoomCode}
              onChange={(e) => { setQuickRoomCode(e.target.value.toUpperCase().replace(/\s/g, '')); setJoinError(null); }}
              aria-label={t('ODA KODU')}
              className="w-full px-3 py-2.5 rounded-xl text-center text-sm font-black tracking-[0.3em] uppercase outline-none"
              style={{
                border: '2.5px solid var(--sticker-ink)',
                background: 'var(--sticker-paper)',
                color: 'var(--sticker-ink)',
              }}
            />

            {joinError && (
              <div className="sticker sticker-sm px-3 py-2 text-sm font-black" role="alert" style={{ background: '#ff6b6b', color: '#1c1917' }}>{joinError}</div>
            )}

            <button
              type="submit"
              disabled={joining}
              className="sticker-btn font-display py-3.5 text-lg flex items-center justify-center gap-2"
              style={{ background: '#ff5d8f', color: '#fff' }}
            >
              {joining ? t('Kontrol ediliyor…') : <>{t('KATIL')} <ArrowRight className="w-5 h-5" strokeWidth={3} /></>}
            </button>
          </form>

          <div className="flex justify-between text-xs font-extrabold" style={{ color: 'var(--sticker-ink-faint)' }}>
            <span>{t("veya TV'deki QR'ı okut")}</span>
            <button
              onClick={() => { playClickSound(); onOpenRules(); }}
              className="flex items-center gap-1 cursor-pointer hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" strokeWidth={3} /> {t('Kurallar')}
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- OYUN IZGARASI */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl">{t('Oyun seç')}</h2>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const aktif = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => { playClickSound(); setFilter(f.id); }}
                  className="sticker-pill px-3.5 py-1.5 text-xs cursor-pointer"
                  style={
                    aktif
                      ? { background: 'var(--sticker-ink)', color: 'var(--sticker-paper)' }
                      : { background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }
                  }
                >
                  {t(f.label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtre + gizleme birlikte bir kategoriyi boşaltabilir; boş ızgara
            yerine ne olduğunu söyleyen tek satır. */}
        {gorunen.length === 0 && (
          <p className="sticker sticker-sm px-4 py-3 text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>
            {t('Bu kategoride şu an oyun yok.')}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-5 pt-2">
          {gorunen.map((g) => {
            const Icon = ICONS[g.id];
            return (
              <div
                key={g.id}
                id={`card-game-${g.id}`}
                className="sticker sticker-tilt p-3.5 flex flex-col gap-2.5 relative"
                style={{ transform: `rotate(${g.rot}deg)` }}
              >
                <span
                  className="sticker-pill absolute -top-3 -right-2 px-2.5 py-0.5 text-[10px]"
                  style={{ background: g.candy, color: '#1c1917', transform: 'rotate(6deg)' }}
                >
                  {g.players}
                </span>

                <div
                  className="h-[100px] rounded-xl flex items-center justify-center"
                  style={{
                    border: '2.5px solid var(--sticker-ink)',
                    backgroundImage: `repeating-linear-gradient(135deg, ${g.candy}55 0 8px, var(--sticker-surface) 8px 16px)`,
                  }}
                >
                  <Icon className="w-10 h-10" strokeWidth={2.5} />
                </div>

                <div className="font-display text-lg leading-tight">{t(g.title)}</div>
                <div className="text-xs font-bold leading-snug min-h-[34px]" style={{ color: 'var(--sticker-ink-soft)' }}>
                  {t(g.tag)}
                </div>
                <div className="text-[11px] font-black" style={{ color: 'var(--sticker-ink-faint)' }}>
                  {t('{a} dk', { a: g.mins })}
                </div>

                <button
                  id={`btn-launch-${g.id}`}
                  onClick={() => { playTurnSound(); onSelectGame(g.id); }}
                  className="sticker-btn font-display py-2.5 text-[15px] flex items-center justify-center gap-1.5"
                  style={{ background: g.candy, color: '#1c1917', borderWidth: '2.5px', borderRadius: '12px', boxShadow: '3px 3px 0 var(--sticker-ink)' }}
                >
                  <Play className="w-4 h-4 fill-current" strokeWidth={2.5} />
                  {t('OYNA')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------ ALT ŞERİT */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onOpenLeaderboard && (
          <button
            onClick={() => { playClickSound(); onOpenLeaderboard(); }}
            className="sticker-btn font-display px-5 py-3 text-sm flex items-center gap-2"
            style={{ background: '#ffd93d', color: '#1c1917' }}
          >
            <Trophy className="w-4 h-4" strokeWidth={2.5} />
            {t('Skor Tablosu & Maç Geçmişi')}
          </button>
        )}
        <span className="sticker-pill px-4 py-2 text-xs" style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink-soft)' }}>
          {t('{a} Canlı Modül', { a: acik.length })}
        </span>
      </div>
    </div>
  );
}
