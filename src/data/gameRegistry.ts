import { PartyGameType } from '../types/partyGames';

/**
 * OYUN KÜNYESİ — tek kaynak.
 * ==========================
 * Hub kartları, filtreler ve başlık çubuğu buradan besleniyor. Önceden on
 * kartın hepsi MainArcadeHub içinde elle yazılmıştı; yeni tasarım kart
 * ızgarasını veri güdümlü kurduğu için (tasarımdaki `sc-for list="{{ games }}"`)
 * künye ayrı bir dosyaya alındı. Yeni oyun eklemek artık tek satır.
 *
 * Renkler tasarımın "Sticker Cartoon" (1b) paletinden birebir geliyor; her
 * oyunun kendi şeker rengi var ve kart, rozet ve buton aynı rengi paylaşıyor.
 */

export type GameCategory = 'parti' | 'zeka' | 'refleks';

export interface GameEntry {
  id: PartyGameType;
  /** Türkçe kaynak metin — t() anahtarı olarak da bu kullanılıyor. */
  title: string;
  /** Kart altındaki tek cümlelik anlatım. */
  tag: string;
  /** "3-10" gibi oyuncu aralığı. */
  players: string;
  /** Ortalama süre (dakika). "< 10 dk" filtresi bunu okuyor. */
  mins: number;
  category: GameCategory;
  /** Kartın şeker rengi (1b paleti). */
  candy: string;
  /**
   * Kartın duruş açısı (derece). Tasarımda kartlar hafifçe eğik duruyor ve
   * üzerine gelince düzeliyor — çıkartma hissini veren şey bu.
   */
  rot: number;
}

/** 1b "Sticker Cartoon" paleti — tasarımdan birebir. */
export const STICKER = {
  paper: '#fff6e5',
  paperDot: '#e9d5b8',
  ink: '#1c1917',
  inkSoft: '#57534e',
  inkFaint: '#a8a29e',
  surface: '#ffffff',
  /** Koyu tema karşılıkları (1b telefon varyantı). */
  darkPaper: '#1c1917',
  darkDot: '#3a342f',
  darkInk: '#fff6e5',
  darkSurface: '#292524',
} as const;

const G = (
  id: PartyGameType, title: string, tag: string,
  players: string, mins: number, category: GameCategory, candy: string, rot: number,
): GameEntry => ({ id, title, tag, players, mins, category, candy, rot });

/**
 * Sıra hub'daki görünüm sırası.
 *
 * ADLAR BAŞKASININ MARKASINI TAŞIMAZ. "Quiplash" (Jackbox) ve "Trivial Pursuit"
 * (Hasbro) tescilli; ticari bir üründe bu adlar ya da çok yakın klonları hem
 * mağazadan kaldırılma hem de SMK m.30 kapsamında suç riski taşıyor. Bu yüzden
 * Laf Cambazı ve Bilgi Kalesi adlarını aldılar. id'ler ('quiplash',
 * 'trivia_pursuit') DEĞİŞMEDİ: oyuncuya görünmüyorlar ve değiştirmek mevcut QR
 * bağlantılarını, soket mesaj tiplerini ve oda snapshot'larını bozardı.
 */
export const GAMES: GameEntry[] = [
  G('imposter',       'Sahtekâr Ressam', 'Tek çizgi çiz, sahtekârı yakala',      '3-10', 12, 'parti',   '#ffd93d', -1.5),
  G('codenames',      'Gizli Ajanlar',   'Tek kelimelik ipucu, gizli ajanlar',   '4-12', 20, 'zeka',    '#4cc9f0',  1),
  G('kapisma',        'Kapışma',         'Parmağın direksiyon',                  '2-8',  10, 'refleks', '#ff6b6b', -0.5),
  G('bluff',          'Yalan Ustası',    'İnandırıcı yalan yaz, gerçeği bul',    '2-10', 15, 'zeka',    '#ff5d8f',  1.5),
  G('bomb',           'Saatli Bomba',    'Heceyi yakala, bombayı fırlat',        '2-12',  8, 'refleks', '#ff9f43', -1),
  G('trivia_pursuit', 'Bilgi Kalesi',    'Zar at, kaleleri fethet',              '2-10', 25, 'zeka',    '#7bd389', -1.5),
  G('race',           'At Yarışı',       'Kuponunu yatır, izle',                 '2-8',  10, 'parti',   '#a3e635',  1),
  G('colory',         'Colory',          'Rengi hatırla, en yakını bul',         '2-12',  8, 'refleks', '#ff8fab', -0.5),
  G('timing',         'Tam Zamanında',   'İçinden say, tam vaktinde bas',        '2-12',  6, 'refleks', '#7ad7f0',  1.5),
  G('quiplash',       'Laf Cambazı',     'Doğru cevap yok, en komik kazanır',    '2-12', 15, 'parti',   '#b892ff', -1),
  G('kusatma',        'Kale Kuşatması',  'Bil, vur, surlarını yık',              '2-12', 10, 'zeka',    '#ff9f43',  1),
  G('fetih',          'Cihan Fatihi',    'Bil, üret, dünyayı fethet',            '2-8',  15, 'zeka',    '#7bd389', -1),
];

export type GameFilter = 'hepsi' | GameCategory | 'kisa';

/** Filtre çipleri — tasarımdaki Hepsi / Parti / Zekâ / Refleks / < 10 dk. */
export const FILTERS: Array<{ id: GameFilter; label: string }> = [
  { id: 'hepsi',   label: 'Hepsi' },
  { id: 'parti',   label: 'Parti' },
  { id: 'zeka',    label: 'Zekâ' },
  { id: 'refleks', label: 'Refleks' },
  { id: 'kisa',    label: '< 10 dk' },
];

export function filterGames(games: GameEntry[], filter: GameFilter): GameEntry[] {
  if (filter === 'hepsi') return games;
  if (filter === 'kisa') return games.filter((g) => g.mins < 10);
  return games.filter((g) => g.category === filter);
}

export function gameById(id: PartyGameType): GameEntry | undefined {
  return GAMES.find((g) => g.id === id);
}
