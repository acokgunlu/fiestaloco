import { ContentLang } from './contentLang';
export interface CodenamesCard {
  id: string;
  word: string;
  type: 'red' | 'blue' | 'neutral' | 'assassin';
  revealed: boolean;
  revealedBy?: 'red' | 'blue';
  orderIndex: number;
}

export const CODENAMES_CATEGORIES = [
  { id: 'all', name: 'Karışık (Tüm Havuz)', icon: '🎲', description: 'En dengeli ve heyecanlı 300+ kelime karması' },
  { id: 'objects', name: 'Nesneler & Teknoloji', icon: '📱', description: 'Günlük eşyalar, aletler ve dijital araçlar' },
  { id: 'pop_culture', name: 'Popüler Kültür & Sinema', icon: '🎬', description: 'Karakterler, kahramanlar ve ikonik terimler' },
  { id: 'nature', name: 'Doğa & Coğrafya', icon: '🌍', description: 'Hayvanlar, bitkiler, kıtalar ve manzaralar' },
  { id: 'abstract', name: 'Soyut & Eylemler', icon: '💡', description: 'Duygular, gizemli kavramlar ve fiiller' },
];

export const CODENAMES_WORD_BANK_TR: Record<string, string[]> = {
  objects: [
    'ANAHTAR', 'AYNA', 'BOMBA', 'ÇANTA', 'DÜRBÜN', 'FOTOĞRAF', 'GÖZLÜK', 'HARİTA',
    'İĞNE', 'KALE', 'KEMER', 'KOLYE', 'KUTU', 'KÜTÜPHANE', 'LAMBA', 'MASA',
    'MAKAS', 'MUM', 'NİKEL', 'PİL', 'PUSULA', 'RADYO', 'ROKET', 'SAAT',
    'ŞEMSİYE', 'ŞİŞE', 'TABANCA', 'TELEFON', 'TELGRAF', 'TREN', 'UÇAK', 'VAGON',
    'ZARF', 'ZİL', 'ÇEKİÇ', 'KASK', 'TELESKOP', 'MİKROSKOP', 'PİYANO', 'GİTAR',
    'ROBOT', 'ÇİP', 'DRONE', 'UYDU', 'FLÜT', 'KEMAN', 'BALON', 'MANGAL',
    'DENİZALTI', 'HELİKOPTER', 'MOTOSİKLET', 'KUMBARA', 'DEFTER', 'KALEM', 'SANDIK',
    'KÖPRÜ', 'FENER', 'MEŞALE', 'ZIRH', 'KILIÇ', 'KORİDOR', 'MERDİVEN', 'MÜHÜR'
  ],
  pop_culture: [
    'AJAN', 'KAHRAMAN', 'BATMAN', 'SÜPERMEN', 'DEDEKTİF', 'CANAVAR', 'VAMPİR', 'ZOMBİ',
    'SİHİRBAZ', 'CADİ', 'PRENSES', 'ŞÖVALYE', 'GLADYATÖR', 'NİNJA', 'SAMURAY', 'KORSAN',
    'UZAYLI', 'YILDIZ', 'GALAXY', 'MATRIX', 'AVATAR', 'JOKER', 'GÖLGE', 'HAYALET',
    'CASUS', 'DEDEKTİF', 'MASKELİ', 'ŞAMPİYON', 'EFENDİ', 'KRAL', 'KRALİÇE', 'BÜYÜCÜ',
    'EJDERHA', 'DİNOZOR', 'SİBER', 'HACKER', 'GLADYATÖR', 'KAHİN', 'ALİEN', 'ASTRONOT',
    'SENARYO', 'OSCAR', 'KAMERA', 'KOSTÜM', 'MASKARALIK', 'MÜZİKAL', 'POP', 'EFSANE',
    'KUMARBAZ', 'ALİBABA', 'ROBİNHOOD', 'SİNDİRELLA', 'MUMYA', 'LABİRENT', 'KUMANDAN'
  ],
  nature: [
    'ASLAN', 'KAPLAN', 'KARTAL', 'ŞAHİN', 'KURT', 'AYI', 'PANDA', 'YUNUS',
    'KÖPEKBALIĞI', 'BALİNA', 'AHTAPOT', 'KOBRA', 'TİMSAH', 'BUZUL', 'ÇÖL', 'ORMAN',
    'OKYANUS', 'NEHİR', 'ŞELALE', 'VOLKAN', 'YANARDAĞ', 'GÖKTAŞI', 'GÜNEŞ', 'AY',
    'YILDIRIM', 'KASIRGA', 'FIRTINA', 'ÇIĞ', 'DEPREM', 'GÖKKUŞAĞI', 'KUTUP', 'TUNDRA',
    'MAĞARA', 'ZİRVE', 'ADA', 'KANYON', 'KITA', 'SAHRA', 'MERCAN', 'LİMAN',
    'SEKVOYA', 'ÇINAR', 'PALMİYE', 'GÜL', 'ORKİDE', 'KAKTÜS', 'MANTAR', 'SARMAŞIK',
    'PENGUEN', 'FLAMİNGO', 'BAYKUŞ', 'TAVŞAN', 'GEYİK', 'ZÜRAFA', 'FİL', 'GERGEDAN'
  ],
  abstract: [
    'AŞK', 'GİZEM', 'İHANET', 'ADALET', 'ÖZGÜRLÜK', 'KORKU', 'CESARET', 'ZAMAN',
    'SONSUZLUK', 'ŞANS', 'KADER', 'HEDEF', 'İTTİFAK', 'BARIŞ', 'SAVAŞ', 'ZAFER',
    'YENİLGİ', 'PLAN', 'TAKTIK', 'RÜYA', 'KABUS', 'HAFİZA', 'SIR', 'ŞÜPHE',
    'GÜVEN', 'GURUR', 'TUTKU', 'SEVGİ', 'GÜÇ', 'ENERJİ', 'IŞIK', 'KARANLIK',
    'SESSİZLİK', 'KAOS', 'DÜZEN', 'DENGE', 'HAYAL', 'GERÇEK', 'HIZ', 'SABIR',
    'ZEKA', 'SEZGİ', 'TEHLİKE', 'SERÜVEN', 'YOLCULUK', 'GELECEK', 'GEÇMİŞ', 'AN'
  ],
};

/**
 * Ingilizce kelime havuzu — Turkce havuzla AYNI kategoriler ve AYNI boyutlar
 * (63 / 55 / 56 / 48). Birebir ceviri degil: Codenames'te kelime, uzerinde
 * kelime oyunu yapilabilen tek parca bir isim olmali; bazi Turkce kelimelerin
 * birebir karsiligi Ingilizce'de bu isi gormezdi.
 */
export const CODENAMES_WORD_BANK_EN: Record<string, string[]> = {
  objects: [
    'KEY', 'MIRROR', 'BOMB', 'SUITCASE', 'BINOCULARS', 'PHOTOGRAPH', 'GLASSES', 'MAP', 'NEEDLE', 
    'CASTLE', 'BELT', 'NECKLACE', 'BOX', 'LIBRARY', 'LAMP', 'TABLE', 'SCISSORS', 'CANDLE', 'NICKEL', 
    'BATTERY', 'COMPASS', 'RADIO', 'ROCKET', 'CLOCK', 'UMBRELLA', 'BOTTLE', 'PISTOL', 'PHONE', 
    'TELEGRAPH', 'TRAIN', 'AIRPLANE', 'WAGON', 'ENVELOPE', 'BELL', 'HAMMER', 'HELMET', 'TELESCOPE', 
    'MICROSCOPE', 'PIANO', 'GUITAR', 'ROBOT', 'CHIP', 'DRONE', 'SATELLITE', 'FLUTE', 'VIOLIN', 
    'BALLOON', 'GRILL', 'SUBMARINE', 'HELICOPTER', 'MOTORCYCLE', 'PIGGYBANK', 'NOTEBOOK', 'PENCIL', 
    'CHEST', 'BRIDGE', 'LANTERN', 'TORCH', 'ARMOUR', 'SWORD', 'CORRIDOR', 'LADDER', 'SEAL'
  ],
  pop_culture: [
    'AGENT', 'HERO', 'BATMAN', 'SUPERMAN', 'DETECTIVE', 'MONSTER', 'VAMPIRE', 'ZOMBIE', 'WIZARD', 
    'WITCH', 'PRINCESS', 'KNIGHT', 'GLADIATOR', 'NINJA', 'SAMURAI', 'PIRATE', 'ALIEN', 'STAR', 
    'GALAXY', 'MATRIX', 'AVATAR', 'JOKER', 'SHADOW', 'GHOST', 'SPY', 'SIDEKICK', 'MASKED', 
    'CHAMPION', 'MASTER', 'KING', 'QUEEN', 'SORCERER', 'DRAGON', 'DINOSAUR', 'CYBER', 'HACKER', 
    'ORACLE', 'MARTIAN', 'ASTRONAUT', 'SCRIPT', 'OSCAR', 'CAMERA', 'COSTUME', 'SLAPSTICK', 'MUSICAL', 
    'POP', 'LEGEND', 'GAMBLER', 'ALADDIN', 'ROBINHOOD', 'CINDERELLA', 'MUMMY', 'LABYRINTH', 
    'COMMANDER', 'SEQUEL'
  ],
  nature: [
    'LION', 'TIGER', 'EAGLE', 'FALCON', 'WOLF', 'BEAR', 'PANDA', 'DOLPHIN', 'SHARK', 'WHALE', 
    'OCTOPUS', 'COBRA', 'CROCODILE', 'GLACIER', 'DESERT', 'FOREST', 'OCEAN', 'RIVER', 'WATERFALL', 
    'VOLCANO', 'CRATER', 'METEOR', 'SUN', 'MOON', 'LIGHTNING', 'HURRICANE', 'STORM', 'AVALANCHE', 
    'EARTHQUAKE', 'RAINBOW', 'POLE', 'TUNDRA', 'CAVE', 'SUMMIT', 'ISLAND', 'CANYON', 'CONTINENT', 
    'SAHARA', 'CORAL', 'HARBOUR', 'REDWOOD', 'SYCAMORE', 'PALM', 'ROSE', 'ORCHID', 'CACTUS', 
    'MUSHROOM', 'IVY', 'PENGUIN', 'FLAMINGO', 'OWL', 'RABBIT', 'DEER', 'GIRAFFE', 'ELEPHANT', 
    'RHINO'
  ],
  abstract: [
    'LOVE', 'MYSTERY', 'BETRAYAL', 'JUSTICE', 'FREEDOM', 'FEAR', 'COURAGE', 'TIME', 'ETERNITY', 
    'LUCK', 'FATE', 'TARGET', 'ALLIANCE', 'PEACE', 'WAR', 'VICTORY', 'DEFEAT', 'PLAN', 'TACTIC', 
    'DREAM', 'NIGHTMARE', 'MEMORY', 'SECRET', 'DOUBT', 'TRUST', 'PRIDE', 'PASSION', 'AFFECTION', 
    'POWER', 'ENERGY', 'LIGHT', 'DARKNESS', 'SILENCE', 'CHAOS', 'ORDER', 'BALANCE', 'FANCY', 'TRUTH', 
    'SPEED', 'PATIENCE', 'WIT', 'INSTINCT', 'DANGER', 'ADVENTURE', 'JOURNEY', 'FUTURE', 'PAST', 
    'MOMENT'
  ],
};

/** Geriye uyum: dil belirtilmeyen eski cagrilar Turkce havuzu gorur. */
export const CODENAMES_WORD_BANK = CODENAMES_WORD_BANK_TR;

function bankFor(lang: ContentLang) {
  return lang === 'en' ? CODENAMES_WORD_BANK_EN : CODENAMES_WORD_BANK_TR;
}
function allWords(lang: ContentLang) {
  const b = bankFor(lang);
  return Array.from(new Set([...b.objects, ...b.pop_culture, ...b.nature, ...b.abstract]));
}

// Flattened master list
export const ALL_CODENAMES_WORDS = Array.from(
  new Set([
    ...CODENAMES_WORD_BANK.objects,
    ...CODENAMES_WORD_BANK.pop_culture,
    ...CODENAMES_WORD_BANK.nature,
    ...CODENAMES_WORD_BANK.abstract,
  ])
);

export function getRandomCodenamesWords(count = 25, category = 'all', lang: ContentLang = 'tr'): string[] {
  const bank = bankFor(lang);
  const all = allWords(lang);
  let source = category === 'all' || !bank[category] ? all : bank[category];

  if (source.length < count) {
    source = all;
  }

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateCodenamesBoard(
  startingTeam: 'red' | 'blue' = 'red',
  category = 'all',
  customWords?: string[],
  lang: ContentLang = 'tr'
): CodenamesCard[] {
  const words = customWords && customWords.length >= 25
    ? customWords.slice(0, 25)
    : getRandomCodenamesWords(25, category, lang);

  // Distribution:
  // Starting team: 9
  // Second team: 8
  // Neutral: 7
  // Assassin: 1
  const otherTeam: 'red' | 'blue' = startingTeam === 'red' ? 'blue' : 'red';

  const types: ('red' | 'blue' | 'neutral' | 'assassin')[] = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(otherTeam),
    ...Array(7).fill('neutral'),
    'assassin',
  ];

  // Shuffle types
  const shuffledTypes = [...types].sort(() => Math.random() - 0.5);

  return words.map((word, index) => ({
    id: `card-${index}-${Date.now()}`,
    word: word.toUpperCase(),
    type: shuffledTypes[index],
    revealed: false,
    orderIndex: index,
  }));
}
