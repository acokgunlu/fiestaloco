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

export const CODENAMES_WORD_BANK: Record<string, string[]> = {
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

// Flattened master list
export const ALL_CODENAMES_WORDS = Array.from(
  new Set([
    ...CODENAMES_WORD_BANK.objects,
    ...CODENAMES_WORD_BANK.pop_culture,
    ...CODENAMES_WORD_BANK.nature,
    ...CODENAMES_WORD_BANK.abstract,
  ])
);

export function getRandomCodenamesWords(count = 25, category = 'all'): string[] {
  let source = category === 'all' || !CODENAMES_WORD_BANK[category]
    ? ALL_CODENAMES_WORDS
    : CODENAMES_WORD_BANK[category];

  if (source.length < count) {
    source = ALL_CODENAMES_WORDS;
  }

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateCodenamesBoard(
  startingTeam: 'red' | 'blue' = 'red',
  category = 'all',
  customWords?: string[]
): CodenamesCard[] {
  const words = customWords && customWords.length >= 25
    ? customWords.slice(0, 25)
    : getRandomCodenamesWords(25, category);

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
