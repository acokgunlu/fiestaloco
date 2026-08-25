/**
 * FiestaLoco — dil katmanı (TR / EN)
 * =============================================================================
 * Oyun ya TAMAMEN Türkçe ya TAMAMEN İngilizce. Karışık dil yok.
 *
 * ANAHTAR = TÜRKÇE METNİN KENDİSİ
 * -------------------------------
 * `t('Rengi hatırla')` gibi. Uydurma anahtar ('game.colory.subtitle') yerine
 * kaynak metnin kendisini anahtar yapmanın üç sebebi var:
 *   1. 950 dize için 950 anahtar uydurmak gerekmiyor — göç mekanik kalıyor.
 *   2. Kaynak kod okunur kalıyor; `t('...')` içinde ne yazdığı belli.
 *   3. Çeviri eksikse Türkçesi görünür — asla boş kutu ya da ham anahtar çıkmaz.
 * Bedeli: Türkçe metni değiştirince çeviri bağı kopar (fallback Türkçe olur).
 *
 * NEDEN HOOK DEĞİL DE MODÜL FONKSİYONU
 * ------------------------------------
 * `t` modül seviyesinde; bileşenler sadece import edip çağırıyor, gövdelerine
 * hook eklemek gerekmiyor (58 dosyada riskli olurdu).
 * Dil değişince `subscribe` ile App yeniden render oluyor; kod tabanında hiç
 * React.memo/useMemo olmadığı için bu tüm ağacı tazeliyor.
 * YENİDEN MOUNT DEĞİL, yeniden RENDER: WebSocket bağlantısı ve oyun durumu
 * ayakta kalıyor, oyunun ortasında dil değiştiren kimse odadan düşmüyor.
 */
import { EN } from './en';
import { TR } from './tr';

export type Lang = 'tr' | 'en';

const LANG_KEY = 'fiestaloco_app_lang';

function readStored(): Lang {
  if (typeof window === 'undefined') return 'tr';
  try {
    // Telefon TV'nin QR'ından geliyorsa dili URL taşır — oda tek dilde kalsın.
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'en' || fromUrl === 'tr') return fromUrl;
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'tr') return stored;
  } catch {
    /* gizli mod / erisim yok */
  }
  return 'tr';
}

let current: Lang = readStored();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next;
  } catch {
    /* yoksay */
  }
  listeners.forEach((fn) => fn());
}

export function toggleLang(): void {
  setLang(current === 'tr' ? 'en' : 'tr');
}

/** useSyncExternalStore icin. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function getSnapshot(): Lang {
  return current;
}

/**
 * Çeviri.
 *
 * @param tr   Kaynak metin (aynı zamanda sözlük anahtarı)
 * @param vars `{sayi}` gibi yer tutucular — her iki dilde de aynı adla geçer
 *
 * Sözlükte karşılığı yoksa Türkçesi döner: eksik çeviri "bozuk arayüz" değil,
 * yalnızca çevrilmemiş bir satır demek.
 */
/**
 * Sunucudan gelen, içinde oda kodu gibi değişken parça taşıyan mesajlar.
 *
 * Sunucu istemcinin dilini bilmiyor (oda başına dil tutulmuyor), o yüzden
 * metni Türkçe gönderiyor ve çeviri istemcide yapılıyor. Sabit mesajlar
 * doğrudan sözlükte; değişken taşıyanlar burada desene bağlanıp {a} ile
 * yeniden kuruluyor.
 */
const SERVER_PATTERNS: Array<[RegExp, string]> = [
  [/^Oda bulunamad[ıi]:\s*"?(.*?)"?$/, 'Oda bulunamadı: {a}'],
  [/^Room "(.*?)" not found\.?$/, 'Oda bulunamadı: {a}'],
];

export function t(tr: string, vars?: Record<string, string | number>): string {
  // Kaynak dizeler karisik: cogu Turkce ama uygulamada bastan beri Ingilizce
  // yazilmis metinler de var ("Add Player", "Game Rules"). Iki yonlu sozluk
  // sart — yoksa "tam Turkce" modunda o metinler Ingilizce kalirdi.
  const dict = current === 'en' ? EN : TR;
  let out = dict[tr];

  if (out === undefined) {
    // Sözlükte yok — değişken taşıyan sunucu mesajı olabilir mi?
    for (const [re, key] of SERVER_PATTERNS) {
      const m = re.exec(tr);
      if (m) {
        const tpl = dict[key];
        if (tpl) return tpl.split('{a}').join(m[1]);
        break;
      }
    }
    out = tr;
  }
  if (vars) {
    for (const key in vars) {
      out = out.split(`{${key}}`).join(String(vars[key]));
    }
  }
  return out;
}

/** Sayı/tarih biçimlendirmesi için yerel ayar. */
export function locale(): string {
  return current === 'en' ? 'en-US' : 'tr-TR';
}

/**
 * Ondalık virgül / nokta. Türkçe "10,34", İngilizce "10.34".
 * Süre ve para biçimlendiren yerler bunu kullanır.
 */
export function decimal(value: number, digits = 2): string {
  const s = value.toFixed(digits);
  return current === 'en' ? s : s.replace('.', ',');
}

/** Bir URL'e mevcut dili ekler (QR ve paylaşım bağlantıları için). */
export function withLang(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}lang=${current}`;
}

// Ilk yuklemede <html lang> dogru olsun
if (typeof document !== 'undefined') {
  document.documentElement.lang = current;
}
