import { ContentLang } from './contentLang';
import { BombPrompt } from '../types/partyGames';

export const BOMB_PROMPTS_TR: BombPrompt[] = [
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

/**
 * Ingilizce prompt havuzu — CEVIRI DEGIL, YENIDEN YAZIM.
 *
 * Turkce havuz HECE uzerine kurulu ("icinde 'KA' hecesi gecen kelime").
 * Ingilizce'de hece ayni islevi gormez; onun yerine harf kumeleri
 * kullanildi ('ST', 'GHT', 'OO'). Kategori promptlarindaki kulturel
 * ogeler de degistirildi (Turk dugunu -> genel dugun gorunumleri).
 *
 * Kural dagilimi Turkce havuzla ayni: 10 contains / 7 starts_with /
 * 13 category. Kelime dogrulamasi sunucuda YOK — kurali masadakiler
 * denetliyor, o yuzden harf kumesi ile hece arasindaki fark oyunu bozmuyor.
 */
export const BOMB_PROMPTS_EN: BombPrompt[] = [
  {
    id: 'bomb_1',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'ST'!",
    exampleWords: ["Storm", "Castle", "Fastest", "Nest", "Stone", "Mistake", "Rooster"],
  },
  {
    id: 'bomb_2',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'AN'!",
    exampleWords: ["Banana", "Plan", "Handle", "Island", "Animal", "Orange", "Elephant"],
  },
  {
    id: 'bomb_3',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'OR'!",
    exampleWords: ["Doctor", "Forest", "Sword", "Mirror", "Morning", "Colour", "Corner"],
  },
  {
    id: 'bomb_4',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'CH'!",
    exampleWords: ["Chair", "Kitchen", "Beach", "Church", "Cheese", "Machine", "Teacher"],
  },
  {
    id: 'bomb_5',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'TR'!",
    exampleWords: ["Train", "Country", "Street", "Control", "Strong", "Electric", "Nitrogen"],
  },
  {
    id: 'bomb_6',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'IN'!",
    exampleWords: ["Window", "Finger", "Machine", "Rain", "Point", "Kingdom", "Sprint"],
  },
  {
    id: 'bomb_7',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'LE'!",
    exampleWords: ["Table", "Little", "Bottle", "Elephant", "Puzzle", "Clever", "Whale"],
  },
  {
    id: 'bomb_8',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'RE'!",
    exampleWords: ["Bread", "Green", "Dream", "Forest", "Present", "Secret", "Theatre"],
  },
  {
    id: 'bomb_9',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'GHT'!",
    exampleWords: ["Light", "Night", "Fight", "Thought", "Bright", "Straight", "Daughter"],
  },
  {
    id: 'bomb_10',
    category: "Letter Chain",
    ruleType: 'contains',
    prompt: "Say a word that contains 'OO'!",
    exampleWords: ["Book", "Moon", "Spoon", "Wooden", "School", "Balloon", "Kangaroo"],
  },
  {
    id: 'bomb_11',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name an animal or living creature starting with 'S'!",
    exampleWords: ["Snake", "Squirrel", "Shark", "Swan", "Spider", "Seal", "Salmon"],
  },
  {
    id: 'bomb_12',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name a city or country starting with 'B'!",
    exampleWords: ["Berlin", "Brazil", "Budapest", "Belgium", "Boston", "Bangkok", "Bolivia"],
  },
  {
    id: 'bomb_13',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name a fruit, vegetable or dish starting with 'M'!",
    exampleWords: ["Mango", "Mushroom", "Melon", "Mustard", "Meatball", "Muffin", "Mint"],
  },
  {
    id: 'bomb_14',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name a job starting with 'P'!",
    exampleWords: ["Pilot", "Plumber", "Painter", "Photographer", "Professor", "Pharmacist", "Postman"],
  },
  {
    id: 'bomb_15',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name a kitchen item or tool starting with 'K'!",
    exampleWords: ["Kettle", "Knife", "Kitchen roll", "Kebab skewer", "Kneading board", "Ketchup bottle", "Kitchen timer"],
  },
  {
    id: 'bomb_16',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name a car brand or vehicle starting with 'T'!",
    exampleWords: ["Toyota", "Tesla", "Truck", "Tram", "Tractor", "Tricycle", "Trailer"],
  },
  {
    id: 'bomb_17',
    category: "Letter Rule",
    ruleType: 'starts_with',
    prompt: "Name a famous film, series or cartoon starting with 'S'!",
    exampleWords: ["Star Wars", "Shrek", "Sherlock", "Spider-Man", "Succession", "SpongeBob", "Superman"],
  },
  {
    id: 'bomb_18',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you'd find in a fridge!",
    exampleWords: ["Milk", "Cheese", "Leftover pizza", "Eggs", "Butter", "Ketchup", "Half a lemon"],
  },
  {
    id: 'bomb_19',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something in a school bag or on a desk!",
    exampleWords: ["Notebook", "Pencil case", "Ruler", "Charger", "Headphones", "Sticky notes", "Water bottle"],
  },
  {
    id: 'bomb_20',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you pack for the beach or a holiday!",
    exampleWords: ["Sunscreen", "Towel", "Sunglasses", "Flip-flops", "Passport", "Swimsuit", "Phone charger"],
  },
  {
    id: 'bomb_21',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name a topping you'd put on a pizza or a burger!",
    exampleWords: ["Cheese", "Pickles", "Mushrooms", "Bacon", "Onion rings", "Jalapeños", "Extra sauce"],
  },
  {
    id: 'bomb_22',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you crave when you're hungry at 2am!",
    exampleWords: ["Cold pizza", "Cereal", "Toast", "Ice cream", "Instant noodles", "Crisps", "Peanut butter"],
  },
  {
    id: 'bomb_23',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name a power or ability a superhero might have!",
    exampleWords: ["Flight", "Invisibility", "Super strength", "Mind reading", "Time travel", "Healing", "Shape-shifting"],
  },
  {
    id: 'bomb_24',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you always see at a wedding!",
    exampleWords: ["Cake", "Bouquet", "Speeches", "Bad dancing", "Confetti", "A crying aunt", "The first dance"],
  },
  {
    id: 'bomb_25',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something absolutely banned from hand luggage on a plane!",
    exampleWords: ["Scissors", "Lighter fluid", "A knife", "Large water bottle", "Fireworks", "Baseball bat", "Paint"],
  },
  {
    id: 'bomb_26',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you do in the first 10 minutes after waking up!",
    exampleWords: ["Check your phone", "Brush your teeth", "Make coffee", "Open the curtains", "Stretch", "Hit snooze", "Feed the cat"],
  },
  {
    id: 'bomb_27',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you'd find in a bathroom!",
    exampleWords: ["Toothbrush", "Shampoo", "Mirror", "Towel", "Soap", "Hairdryer", "Rubber duck"],
  },
  {
    id: 'bomb_28',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name something you only wear or use in winter!",
    exampleWords: ["Scarf", "Gloves", "Snow boots", "Thermos", "Ice scraper", "Woolly hat", "Hot water bottle"],
  },
  {
    id: 'bomb_29',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name a social or messaging app that's on everyone's phone!",
    exampleWords: ["WhatsApp", "Instagram", "TikTok", "Telegram", "Snapchat", "Discord", "Messenger"],
  },
  {
    id: 'bomb_30',
    category: "Quickfire Category",
    ruleType: 'category',
    prompt: "Name a machine you'd find in a gym, or an exercise you'd do there!",
    exampleWords: ["Treadmill", "Squats", "Rowing machine", "Dumbbells", "Burpees", "Exercise bike", "Plank"],
  },
];

/** Geriye uyum: dil belirtilmeyen eski cagrilar Turkce havuzu gorur. */
export const BOMB_PROMPTS = BOMB_PROMPTS_TR;

export function getBombPrompts(lang: ContentLang = 'tr'): BombPrompt[] {
  return lang === 'en' ? BOMB_PROMPTS_EN : BOMB_PROMPTS_TR;
}

export function getRandomBombPrompt(excludeIds: string[] = [], lang: ContentLang = 'tr'): BombPrompt {
  const available = getBombPrompts(lang).filter((p) => !excludeIds.includes(p.id));
  if (available.length === 0) {
    return getBombPrompts(lang)[Math.floor(Math.random() * getBombPrompts(lang).length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
