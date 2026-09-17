import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogOut, RotateCcw, Save } from 'lucide-react';
import { GAMES } from '../../data/gameRegistry';
import { getApiUrl } from '../../utils/serverUrl';
import { primeHiddenGames } from '../../utils/gameVisibility';
import { useAppTheme } from '../../utils/theme';
import { getSnapshot as langSnapshot, subscribe as subscribeLang, t } from '../../i18n';

/**
 * YÖNETİM PANELİ — /admin
 * ======================
 * Şimdilik tek iş: oyunları ana sayfada göster / gizle.
 *
 * Şifre tarayıcıda yalnızca sessionStorage'da tutuluyor (sekme kapanınca
 * gider) ve her istekte Bearer olarak gönderiliyor. Asıl şifre sunucunun
 * ortam değişkeninde; panel onu hiçbir zaman bilmiyor, sadece "doğru mu"
 * cevabını alıyor.
 */

const TOKEN_KEY = 'fiestaloco_admin_token';

/** /api/health oda sayacı anahtarları künye id'leriyle bire bir değil. */
const HEALTH_KEY: Record<string, string> = { trivia_pursuit: 'trivia' };

type LoginState = 'idle' | 'checking';

function readToken(): string {
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
function writeToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* depolama kapalı — oturum sekmede yaşar */ }
}

/** Sunucu hata kodunu kullanıcının anlayacağı cümleye çevirir. */
function authError(status: number, body: { retryAfterSeconds?: number } | null): string {
  if (status === 401) return t('Şifre yanlış.');
  if (status === 429) {
    const dk = Math.max(1, Math.ceil((body?.retryAfterSeconds || 900) / 60));
    return t('Çok fazla yanlış deneme. {a} dakika sonra tekrar dene.', { a: dk });
  }
  if (status === 503) return t('Yönetim paneli sunucuda kapalı: ADMIN_TOKEN tanımlı değil.');
  return t('Sunucu beklenmeyen bir yanıt verdi ({a}).', { a: status });
}

export function AdminPanel() {
  useAppTheme();
  useSyncExternalStore(subscribeLang, langSnapshot, langSnapshot);

  const [token, setToken] = useState(readToken);
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sunucudaki kayıtlı liste ve ekrandaki düzenleme ayrı tutuluyor:
  // "Vazgeç" kayıtlıya döner, "Kaydet" yalnızca fark varsa açılır.
  const [saved, setSaved] = useState<string[] | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [rooms, setRooms] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'warn' | 'error'; text: string } | null>(null);

  const logout = (message?: string) => {
    writeToken('');
    setToken('');
    setSaved(null);
    setNotice(null);
    if (message) setLoginError(message);
  };

  // Giriş sonrası: kayıtlı listeyi ve canlı oda sayılarını çek.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch(getApiUrl('/api/games/visibility'), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const hidden: string[] = Array.isArray(d?.hidden) ? d.hidden : [];
        setSaved(hidden);
        setDraft(new Set(hidden));
      })
      .catch(() => alive && setNotice({ kind: 'error', text: t('Sunucuya ulaşılamadı. Bağlantını kontrol edip sayfayı yenile.') }));
    fetch(getApiUrl('/api/health'), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => alive && setRooms(d?.rooms || {}))
      .catch(() => { /* oda sayısı bilgi amaçlı; yoksa gösterilmez */ });
    return () => { alive = false; };
  }, [token]);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = password.trim();
    if (!candidate) return;
    setLoginState('checking');
    setLoginError(null);
    try {
      const r = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${candidate}` },
      });
      if (r.ok) {
        writeToken(candidate);
        setToken(candidate);
        setPassword('');
      } else {
        setLoginError(authError(r.status, await r.json().catch(() => null)));
      }
    } catch {
      setLoginError(t('Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.'));
    } finally {
      setLoginState('idle');
    }
  };

  const toggle = (id: string) => {
    setNotice(null);
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const dirty = useMemo(() => {
    if (!saved) return false;
    if (saved.length !== draft.size) return true;
    return saved.some((id) => !draft.has(id));
  }, [saved, draft]);

  const visibleCount = GAMES.length - draft.size;
  const allHidden = visibleCount === 0;

  const save = async () => {
    if (!dirty || allHidden) return;
    setSaving(true);
    setNotice(null);
    try {
      const r = await fetch(getApiUrl('/api/admin/games/visibility'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hidden: GAMES.map((g) => g.id).filter((id) => draft.has(id)) }),
      });
      const body = await r.json().catch(() => null);
      if (r.status === 401 || r.status === 429 || r.status === 503) {
        logout(authError(r.status, body));
        return;
      }
      if (!r.ok) {
        setNotice({
          kind: 'error',
          text: body?.error === 'cannot_hide_all'
            ? t('En az bir oyun görünür kalmalı.')
            : t('Kaydedilemedi ({a}). Tekrar dene.', { a: r.status }),
        });
        return;
      }
      const hidden: string[] = body.hidden;
      setSaved(hidden);
      setDraft(new Set(hidden));
      primeHiddenGames(hidden);
      setNotice(
        body.persisted
          ? { kind: 'ok', text: t('Kaydedildi. Ana sayfa bir sonraki açılışta güncel listeyi gösterir.') }
          : { kind: 'warn', text: t('Uygulandı ama kalıcı depoya yazılamadı. Sunucu yeniden başlarsa bu ayar kaybolur.') },
      );
    } catch {
      setNotice({ kind: 'error', text: t('Sunucuya ulaşılamadı. Değişiklikler kaydedilmedi.') });
    } finally {
      setSaving(false);
    }
  };

  const noticeColor = { ok: '#7bd389', warn: '#ffd93d', error: '#ff5d8f' } as const;

  return (
    <div className="min-h-screen font-body" style={{ color: 'var(--sticker-ink)' }}>
      <header
        className="px-4 sm:px-6 py-3"
        style={{ background: 'var(--sticker-surface)', borderBottom: '3px solid var(--sticker-ink)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="font-display text-xl">
            Fiesta<span style={{ color: '#ff5d8f' }}>Loco</span>
            <span className="ml-2 text-sm" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Yönetim')}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="sticker-pill px-3 py-1.5 text-xs flex items-center gap-1.5"
              style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={3} /> {t('Siteye dön')}
            </a>
            {token && (
              <button
                onClick={() => logout()}
                className="sticker-pill px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={3} /> {t('Çıkış yap')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {!token ? (
          /* ------------------------------------------------------------ GİRİŞ */
          <form onSubmit={submitLogin} className="sticker sticker-lg max-w-sm mx-auto p-6 flex flex-col gap-4">
            <div className="font-display text-2xl flex items-center gap-2">
              <LockKeyhole className="w-6 h-6" strokeWidth={2.5} /> {t('Yönetim girişi')}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--sticker-ink-soft)' }}>
                {t('Şifre')}
              </span>
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-3 rounded-xl text-base font-bold outline-none"
                style={{ border: '2.5px solid var(--sticker-ink)', background: 'var(--sticker-paper)', color: 'var(--sticker-ink)' }}
              />
            </label>
            {loginError && (
              <p role="alert" className="sticker-pill px-3 py-2 text-sm" style={{ background: '#ff5d8f', color: '#fff', borderRadius: 12 }}>
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginState === 'checking' || !password.trim()}
              className="sticker-btn font-display py-3 text-lg"
              style={{ background: '#ffd93d', color: '#1c1917' }}
            >
              {loginState === 'checking' ? t('Kontrol ediliyor…') : t('Giriş yap')}
            </button>
          </form>
        ) : (
          /* ------------------------------------------------------ GÖRÜNÜRLÜK */
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl">{t('Oyun görünürlüğü')}</h1>
                <p className="text-sm font-bold max-w-xl leading-relaxed" style={{ color: 'var(--sticker-ink-soft)' }}>
                  {t('Gizlenen oyun ana sayfada listelenmez ve bağlantıyla yeni oyun başlatılamaz. Şu an oynanan odalar etkilenmez.')}
                </p>
              </div>
              <span className="sticker-pill px-3 py-1.5 text-sm" style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}>
                {t('{a} / {b} oyun görünür', { a: visibleCount, b: GAMES.length })}
              </span>
            </div>

            {saved === null && !notice ? (
              <p className="text-sm font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>{t('Yükleniyor…')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {GAMES.map((g) => {
                  const isHidden = draft.has(g.id);
                  const liveRooms = rooms[HEALTH_KEY[g.id] || g.id] || 0;
                  return (
                    <li
                      key={g.id}
                      className="sticker sticker-sm flex items-center gap-3 p-3"
                      style={{ opacity: isHidden ? 0.72 : 1 }}
                    >
                      <span
                        aria-hidden
                        className="w-10 h-10 shrink-0 rounded-xl"
                        style={{ background: g.candy, border: '2.5px solid var(--sticker-ink)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-lg leading-tight truncate">{t(g.title)}</div>
                        <div className="text-xs font-bold truncate" style={{ color: 'var(--sticker-ink-soft)' }}>
                          {t(g.tag)}
                        </div>
                      </div>
                      {liveRooms > 0 && (
                        <span
                          className="hidden sm:inline-flex sticker-pill px-2 py-0.5 text-[11px]"
                          style={{ background: '#7bd389', color: '#1c1917' }}
                          title={t('Şu an bu oyunda açık oda sayısı')}
                        >
                          {t('{a} aktif oda', { a: liveRooms })}
                        </span>
                      )}
                      <button
                        role="switch"
                        aria-checked={!isHidden}
                        aria-label={t('{a}: ana sayfada göster', { a: t(g.title) })}
                        onClick={() => toggle(g.id)}
                        className="sticker-btn shrink-0 px-3 py-2 text-sm font-black flex items-center gap-1.5 min-w-[108px] justify-center"
                        style={
                          isHidden
                            ? { background: 'var(--sticker-surface)', color: 'var(--sticker-ink)', borderWidth: '2.5px', boxShadow: '3px 3px 0 var(--sticker-ink)' }
                            : { background: '#7bd389', color: '#1c1917', borderWidth: '2.5px', boxShadow: '3px 3px 0 var(--sticker-ink)' }
                        }
                      >
                        {isHidden
                          ? <><EyeOff className="w-4 h-4" strokeWidth={2.5} /> {t('Gizli')}</>
                          : <><Eye className="w-4 h-4" strokeWidth={2.5} /> {t('Görünür')}</>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {notice && (
              <p role="status" className="sticker sticker-sm px-4 py-3 text-sm font-bold" style={{ background: noticeColor[notice.kind], color: '#1c1917' }}>
                {notice.text}
              </p>
            )}
            {allHidden && (
              <p role="alert" className="text-sm font-black" style={{ color: '#ff5d8f' }}>
                {t('En az bir oyun görünür kalmalı.')}
              </p>
            )}

            {/* Kaydet çubuğu ekranın altında sabit: uzun listede kaydırıp aramaya gerek kalmasın. */}
            <div
              className="sticky bottom-3 flex flex-wrap items-center justify-end gap-3 sticker sticker-sm p-3"
            >
              <span className="mr-auto text-xs font-bold" style={{ color: 'var(--sticker-ink-soft)' }}>
                {dirty ? t('Kaydedilmemiş değişiklik var.') : t('Tüm değişiklikler kayıtlı.')}
              </span>
              <button
                onClick={() => { setDraft(new Set(saved || [])); setNotice(null); }}
                disabled={!dirty || saving}
                className="sticker-btn px-4 py-2.5 text-sm font-black flex items-center gap-1.5"
                style={{ background: 'var(--sticker-surface)', color: 'var(--sticker-ink)' }}
              >
                <RotateCcw className="w-4 h-4" strokeWidth={2.5} /> {t('Vazgeç')}
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving || allHidden}
                className="sticker-btn font-display px-5 py-2.5 text-base flex items-center gap-1.5"
                style={{ background: '#ff5d8f', color: '#fff' }}
              >
                <Save className="w-4 h-4" strokeWidth={2.5} />
                {saving ? t('Kaydediliyor…') : t('Değişiklikleri kaydet')}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
