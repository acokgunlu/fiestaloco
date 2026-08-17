import { BombPrompt } from '../types/partyGames';

export const BOMB_PROMPTS: BombPrompt[] = [
  // 1. Hece & Harf Grubu
  {
    id: 'bomb_1',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'KA' hecesi geçen bir kelime söyle!",
    exampleWords: ['Kapı', 'Makas', 'Balkon', 'Kartal', 'Kahve', 'Sokak', 'Bakkal'],
  },
  {
    id: 'bomb_2',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'MA' hecesi geçen bir kelime söyle!",
    exampleWords: ['Masa', 'Elma', 'Duman', 'Sinema', 'Armut', 'Mavi', 'Mandalina'],
  },
  {
    id: 'bomb_3',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'LA' hecesi geçen bir kelime söyle!",
    exampleWords: ['Lale', 'Kalem', 'Balık', 'Papatya', 'Ceylan', 'Kolay', 'Limon'],
  },
  {
    id: 'bomb_4',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'TE' hecesi geçen bir kelime söyle!",
    exampleWords: ['Telefon', 'Televizyon', 'Paket', 'Site', 'Gazete', 'Antep', 'Terazi'],
  },
  {
    id: 'bomb_5',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'RA' hecesi geçen bir kelime söyle!",
    exampleWords: ['Radyo', 'Para', 'Tarak', 'Sıra', 'Kamera', 'Zebra', 'Fırtına', 'Ranza'],
  },
  {
    id: 'bomb_6',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'KO' hecesi geçen bir kelime söyle!",
    exampleWords: ['Koltuk', 'Kola', 'Balkon', 'Koku', 'Komşu', 'Lokum', 'Dekor'],
  },
  {
    id: 'bomb_7',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'BA' hecesi geçen bir kelime söyle!",
    exampleWords: ['Balık', 'Bakkal', 'Bardak', 'Sabah', 'Tabak', 'Bavul', 'Bahçe'],
  },
  {
    id: 'bomb_8',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'YA' hecesi geçen bir kelime söyle!",
    exampleWords: ['Yastık', 'Papatya', 'Yarış', 'Ayakkabı', 'Rüya', 'Yatak', 'Yaban'],
  },
  {
    id: 'bomb_9',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'DİL' veya 'Lİ' hecesi geçen bir kelime söyle!",
    exampleWords: ['Dilim', 'Kandil', 'Mendil', 'Limon', 'Polis', 'Tatil', 'Gelin'],
  },
  {
    id: 'bomb_10',
    category: 'Hece Zinciri',
    ruleType: 'contains',
    prompt: "İçinde 'GÖZ' veya 'GÖ' geçen bir kelime söyle!",
    exampleWords: ['Gözlük', 'Gözleme', 'Gölge', 'Göl', 'Gökyüzü', 'Gözcü', 'Görev'],
  },

  // 2. Harf Başlangıçları
  {
    id: 'bomb_11',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'S' harfiyle başlayan bir hayvan veya canlı söyle!",
    exampleWords: ['Sincap', 'Salyangoz', 'Sinek', 'Serçe', 'Su Samuru', 'Sırtlan', 'Samur'],
  },
  {
    id: 'bomb_12',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'B' harfiyle başlayan bir şehir veya ülke söyle!",
    exampleWords: ['Bursa', 'Bolu', 'Berlin', 'Brezilya', 'Belçika', 'Bakü', 'Batman', 'Budapeşte'],
  },
  {
    id: 'bomb_13',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'M' harfiyle başlayan bir meyve, sebze veya yemek söyle!",
    exampleWords: ['Muz', 'Mandalina', 'Mantı', 'Mercimek', 'Marul', 'Menemen', 'Mantar'],
  },
  {
    id: 'bomb_14',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'K' harfiyle başlayan bir meslek söyle!",
    exampleWords: ['Kaptan', 'Kasap', 'Kuaför', 'Kimyager', 'Kurye', 'Kameraman', 'Kütüphaneci'],
  },
  {
    id: 'bomb_15',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'P' harfiyle başlayan bir mutfak eşyası veya alet söyle!",
    exampleWords: ['Paspas', 'Pense', 'Peçete', 'Pota', 'Peynir Bıçağı', 'Priz', 'Pres'],
  },
  {
    id: 'bomb_16',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'A' harfiyle başlayan bir otomobil markası veya araç söyle!",
    exampleWords: ['Audi', 'Alfa Romeo', 'Aston Martin', 'Ambulans', 'Araba', 'Akülü Araç'],
  },
  {
    id: 'bomb_17',
    category: 'Harf Kuralı',
    ruleType: 'starts_with',
    prompt: "'T' harfiyle başlayan ünlü bir dizi, film veya çizgi film söyle!",
    exampleWords: ['Titanic', 'Tom ve Jerry', 'Tarzan', 'Thor', 'Top Gun', 'Transformers', 'Tsubasa'],
  },

  // 3. Parti Kategori Hızı
  {
    id: 'bomb_18',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Buzdolabında bulunan bir yiyecek veya içecek söyle!",
    exampleWords: ['Peynir', 'Süt', 'Yoğurt', 'Zeytin', 'Yumurta', 'Kola', 'Tereyağı', 'Ketçap'],
  },
  {
    id: 'bomb_19',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Okul çantasında veya çalışma masasında olan bir eşya söyle!",
    exampleWords: ['Kalem', 'Silgi', 'Defter', 'Cetvel', 'Kitap', 'Pergel', 'Uç Kutusu', 'Zımba'],
  },
  {
    id: 'bomb_20',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Sahile / Tatile giderken bavula konan bir eşya söyle!",
    exampleWords: ['Mayo', 'Güneş Kremi', 'Havlu', 'Gözlük', 'Terlik', 'Şapka', 'Palet', 'Şnorkel'],
  },
  {
    id: 'bomb_21',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Pizza veya hamburger üstüne konan bir malzeme söyle!",
    exampleWords: ['Sucuk', 'Kaşar', 'Mantar', 'Zeytin', 'Mısır', 'Köfte', 'Turşu', 'Soğan'],
  },
  {
    id: 'bomb_22',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Gece saat 02:00'de acıkınca canın çeken bir yiyecek söyle!",
    exampleWords: ['Kokoreç', 'Tost', 'Midye', 'Cips', 'Çikolata', 'Buzlu Su', 'Makarna', 'Dürüm'],
  },
  {
    id: 'bomb_23',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Bir süper kahramanın sahip olabileceği bir güç veya yetenek söyle!",
    exampleWords: ['Uçmak', 'Görünmezlik', 'Işınlanma', 'Süper Hız', 'Zihin Okuma', 'Lazer Göz', 'Zamanı Durdurma'],
  },
  {
    id: 'bomb_24',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Bir Türk düğününde mutlaka görülen bir şey veya kişi söyle!",
    exampleWords: ['Halay', 'Gelin Arabası', 'Takı Töreni', 'Kuru Pasta', 'Orkestra', 'Damat', 'Şakşakçı'],
  },
  {
    id: 'bomb_25',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Uçakta el bagajına alınması kesinlikle yasak bir eşya söyle!",
    exampleWords: ['Çakı', 'Makas', 'Sıvı İçecek', 'Patlayıcı', 'Çakmak Gazı', 'Silah', 'Bıçak'],
  },
  {
    id: 'bomb_26',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Sabah uyanınca ilk 10 dakikada yapılan bir eylem söyle!",
    exampleWords: ['Alarm Kapatma', 'Yüz Yıkama', 'Telefona Bakma', 'Kahve Yapma', 'Gerinme', 'Diş Fırçalama'],
  },
  {
    id: 'bomb_27',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Bir banyoda veya tuvalette bulunan bir nesne söyle!",
    exampleWords: ['Şampuan', 'Sabun', 'Ayna', 'Duş Başlığı', 'Tarak', 'Klozet', 'Bornoz', 'Lif'],
  },
  {
    id: 'bomb_28',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Sadece kış mevsiminde giyilen veya kullanılan bir eşya söyle!",
    exampleWords: ['Mont', 'Bere', 'Atkı', 'Eldiven', 'Bot', 'Kar Maskesi', 'Termal İçlik'],
  },
  {
    id: 'bomb_29',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Telefonda yüklü en popüler sosyal medya / mesajlaşma uygulaması söyle!",
    exampleWords: ['Instagram', 'WhatsApp', 'TikTok', 'Twitter / X', 'YouTube', 'Telegram', 'Snapchat'],
  },
  {
    id: 'bomb_30',
    category: 'Kategori Hızı',
    ruleType: 'category',
    prompt: "Bir spor salonunda bulunan bir alet veya yapılan bir hareket söyle!",
    exampleWords: ['Koşu Bandı', 'Dambıl', 'Halter', 'Mekik', 'Şınav', 'Barfiks', 'Eliptik Bisiklet'],
  },
];

export function getRandomBombPrompt(excludeIds: string[] = []): BombPrompt {
  const available = BOMB_PROMPTS.filter((p) => !excludeIds.includes(p.id));
  if (available.length === 0) {
    return BOMB_PROMPTS[Math.floor(Math.random() * BOMB_PROMPTS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
