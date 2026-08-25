import { ContentLang } from './contentLang';
import { BluffQuestion } from '../types/partyGames';

export const BLUFF_QUESTIONS_TR: BluffQuestion[] = [
  {
    id: 'bluff_1',
    category: 'Tuhaf Tarih',
    prompt: "18. yüzyılda İngiltere'de bazı aristokratlar, bahçelerine mistik ve bilge bir hava katması için canlı [...] kiralıyordu.",
    realAnswer: "Keşiş",
    defaultFakes: ["Panda", "Falcı papağan", "Cüce heykeltıraş", "Saray soytarısı", "Timsah"],
  },
  {
    id: 'bluff_2',
    category: 'Dünya Yasaları',
    prompt: "İsviçre'de hayvan hakları yasasına göre, yalnız kalıp depresyona girmemeleri için tek bir [...] beslemek yasa dışıdır.",
    realAnswer: "Kobay",
    defaultFakes: ["Japon balığı", "Bukalemun", "Muhabbet kuşu", "Kaplumbağa", "Hamster"],
  },
  {
    id: 'bluff_3',
    category: 'İlginç Hayvanlar',
    prompt: "Vombat (Wombat) adlı Avustralya keselisinin dışkısı, yuvarlanıp gitmesini önlemek için dünyada tek olarak [...] şeklindedir.",
    realAnswer: "Küp (Kare)",
    defaultFakes: ["Piramit", "Halka (Simit)", "Yıldız", "Silindir", "Kalp"],
  },
  {
    id: 'bluff_4',
    category: 'Garip İcatlar',
    prompt: "1960'larda CIA, Sovyet elçiliklerini gizlice dinlemek için 'Akustik Kedicik' projesiyle bir kedinin içine [...] yerleştirmiştir.",
    realAnswer: "Mikrofon",
    defaultFakes: ["Uyku gazı kapsülü", "Zehirli iğne", "Minyatür kamera", "GPS vericisi", "Ses kayıt kaseti"],
  },
  {
    id: 'bluff_5',
    category: 'Tarih & Kültür',
    prompt: "Eski Roma'da gladyatörlerin teri ve vücut kirleri toplanıp zengin Romalı kadınlara [...] olarak satılıyordu.",
    realAnswer: "Cilt kremi",
    defaultFakes: ["Aşk iksiri", "Kutsal şarap aroması", "Savaş muskası", "Diş beyazlatıcı", "Nazar boncuğu boyası"],
  },
  {
    id: 'bluff_6',
    category: 'Popüler Bilim',
    prompt: "Ketçap 1830'lu yıllarda Amerika'da ilk kez bir sos olarak değil, [...] olarak satılıyordu.",
    realAnswer: "İshal ilacı",
    defaultFakes: ["Diş macunu", "Saç jölesi", "Yara merhemi", "Böcek kovucu", "Göz damlası"],
  },
  {
    id: 'bluff_7',
    category: 'Tuhaf Gelenekler',
    prompt: "Danimarka'da 25 yaşına gelip hâlâ bekar olan kişilerin üzerine sokakta arkadaşları tarafından torbalarca [...] dökülür.",
    realAnswer: "Tarçın",
    defaultFakes: ["Un ve yumurta", "Hardal", "Domates sosu", "Pudra şekeri", "Kahve çekirdeği"],
  },
  {
    id: 'bluff_8',
    category: 'Uzay & Doğa',
    prompt: "Satürn ve Jüpiter gezegenlerinin atmosferindeki yüksek basınç nedeniyle gökyüzünden kelimenin tam anlamıyla [...] yağar.",
    realAnswer: "Elmas",
    defaultFakes: ["Sıvı altın", "Zümrüt tozu", "Buz heykeller", "Kükürt yağmuru", "Saf gümüş"],
  },
  {
    id: 'bluff_9',
    category: 'Tuhaf Yasalar',
    prompt: "Kanada'da yayınlanan radyo şarkılarının en az %35'i yasal olarak [...] olmak zorundadır.",
    realAnswer: "Kanadalı sanatçıya ait",
    defaultFakes: ["Fransızca sözlü", "Küfürsüz ve akustik", "Gitar solosu içeren", "Reklamsız", "Klasik müzik altyapılı"],
  },
  {
    id: 'bluff_10',
    category: 'İlginç Tarih',
    prompt: "1923'te jokey Frank Hayes, yarış sırasında kalp krizi geçirip hayatını kaybetmesine rağmen atı yarışı birinci bitirince tarihe [...] olarak geçti.",
    realAnswer: "Yarış kazanan ilk ölü jokey",
    defaultFakes: ["Madalyası elinden alınan ilk jokey", "Atı tarafından taşınan kahraman", "Tarihin en hızlı jokeyi", "Heykeli dikilen binici", "Kupasını atına devreden adam"],
  },
  {
    id: 'bluff_11',
    category: 'Tuhaf Sporlar',
    prompt: "İngiltere'de her yıl düzenlenen geleneksel yarışta yarışmacılar dik bir tepeden aşağı yuvarlanan [...] peşinden koşarak bayırdan yuvarlanırlar.",
    realAnswer: "Tekerlek peynir",
    defaultFakes: ["Dev karpuz", "Tahta bir fıçı", "Kraliyet tacı", "Bronz top arabası", "Altın çan"],
  },
  {
    id: 'bluff_12',
    category: 'Doğa & Hayvanlar',
    prompt: "Flamingolar sadece ayakta değil, uyurken ve dinlenirken de tek ayak üstünde dururlar çünkü bu sayede [...].",
    realAnswer: "Vücut ısılarını korurlar",
    defaultFakes: ["Timsahlardan saklanırlar", "Daha hızlı uyanırlar", "Kaslarını güçlendirirler", "Rüzgara karşı dengede kalırlar"],
  },
  {
    id: 'bluff_13',
    category: 'Sinema & Sanat',
    prompt: "Psycho (Sapık) filminin meşhur duş sahnesinde akan kan efekti için yönetmen Alfred Hitchcock [...] kullanmıştır.",
    realAnswer: "Çikolata sosu",
    defaultFakes: ["Vişne reçeli", "Kırmızı mürekkep", "Domates salçası", "Pancar suyu", "Kırmızı gıda boyalı jel"],
  },
  {
    id: 'bluff_14',
    category: 'Tarih & Savaş',
    prompt: "Liechtenstein ordusu 1866 Avusturya-Prusya savaşına 80 askerle katılmış ve savaştan [...] dönmüştür.",
    realAnswer: "81 kişi olarak",
    defaultFakes: ["Yaralanmadan 0 kayıpla", "Sadece 1 kişi kalarak", "Karşı tarafın generalini esir alarak", "Hiç kurşun atmadan"],
  },
  {
    id: 'bluff_15',
    category: 'Yemek & Mutfak',
    prompt: "Pringles cipslerinin kutu tasarımını ve eğri silindir şeklini icat eden Fredric Baur, vasiyeti üzerine öldüğünde külleri [...] gömülmüştür.",
    realAnswer: "Pringles kutusuna",
    defaultFakes: ["Patates tarlasına", "Patates kızartma yağına", "Cips fabrikasının temeline", "Dev bir tuzluğa"],
  },
  {
    id: 'bluff_16',
    category: 'Şaşırtıcı Bilim',
    prompt: "Ahtapotların 3 kalbi, 9 beyni vardır ve kanlarının rengi bakır bazlı hemosiyanin nedeniyle [...] renktedir.",
    realAnswer: "Mavi",
    defaultFakes: ["Yeşil", "Sarı", "Mor", "Şeffaf / Beyaz"],
  },
  {
    id: 'bluff_17',
    category: 'Teknoloji Tarihi',
    prompt: "1999 yılında Google'ın kurucuları Larry Page ve Sergey Brin, Google'ı Excite şirketine 750.000 dolara satmak istemiş ancak Excite CEO'su [...].",
    realAnswer: "Teklifi pahalı bulmuştur",
    defaultFakes: ["Şirketin adını beğenmemiştir", "Parayı kumarhanede kaybetmiştir", "Google'ı bir virüs sanmıştır", "Ortak olmayı talep etmiştir"],
  },
  {
    id: 'bluff_18',
    category: 'Tarih & Krallar',
    prompt: "Fransa Kralı XIV. Louis, hayatı boyunca doktorunun tavsiyesi üzerine sadece [...] kez banyo yapmıştır.",
    realAnswer: "3",
    defaultFakes: ["1", "12", "0 (Hiç yapmamıştır)", "35"],
  },
  {
    id: 'bluff_19',
    category: 'Dünya Kültürleri',
    prompt: "Etiyopya'da kullanılan geleneksel takvim nedeniyle ülkede bir yıl [...] aydan oluşmaktadır.",
    realAnswer: "13",
    defaultFakes: ["10", "14", "8", "16"],
  },
  {
    id: 'bluff_20',
    category: 'Uzay & Havacılık',
    prompt: "Ay yüzeyinde rüzgar veya yağmur gibi atmosferik olaylar olmadığı için Neil Armstrong'un ayak izi en az [...] boyunca bozulmadan kalacaktır.",
    realAnswer: "100 Milyon Yıl",
    defaultFakes: ["1.000 Yıl", "50.000 Yıl", "Sonsuza kadar", "1 Milyon Yıl"],
  },
];

/**
 * Ingilizce soru havuzu — Turkce havuzla AYNI id'ler ve AYNI sira.
 * Sorular kulture bagli olmadigi icin (Isvicre kobay yasasi, vombat diskisi,
 * CIA'in akustik kedisi) birebir aktarilabildi; id'lerin ayni olmasi
 * 'kullanilmis soru' takibinin iki dilde de calismasini sagliyor.
 */
export const BLUFF_QUESTIONS_EN: BluffQuestion[] = [
  {
    id: 'bluff_1',
    category: "Odd History",
    prompt: "In 18th-century England, some aristocrats hired a live [...] to sit in their gardens and lend the grounds a mystical, wise atmosphere.",
    realAnswer: "Hermit",
    defaultFakes: ["Panda", "Fortune-telling parrot", "Dwarf sculptor", "Court jester", "Crocodile"],
  },
  {
    id: 'bluff_2',
    category: "Laws of the World",
    prompt: "Under Swiss animal welfare law it is illegal to keep a single [...] on its own, in case it gets lonely and depressed.",
    realAnswer: "Guinea pig",
    defaultFakes: ["Goldfish", "Chameleon", "Budgie", "Tortoise", "Hamster"],
  },
  {
    id: 'bluff_3',
    category: "Curious Animals",
    prompt: "The droppings of the Australian wombat are the only ones in the world shaped like a [...], so they don't roll away.",
    realAnswer: "Cube (square)",
    defaultFakes: ["Pyramid", "Ring (doughnut)", "Star", "Cylinder", "Heart"],
  },
  {
    id: 'bluff_4',
    category: "Strange Inventions",
    prompt: "In the 1960s the CIA's 'Acoustic Kitty' project implanted a [...] inside a cat to eavesdrop on Soviet embassies.",
    realAnswer: "Microphone",
    defaultFakes: ["Sleeping-gas capsule", "Poison needle", "Miniature camera", "GPS transmitter", "Tape recorder"],
  },
  {
    id: 'bluff_5',
    category: "History & Culture",
    prompt: "In ancient Rome, the sweat and grime scraped off gladiators was collected and sold to wealthy Roman women as [...].",
    realAnswer: "Skin cream",
    defaultFakes: ["A love potion", "Holy wine flavouring", "A battle charm", "Tooth whitener", "Paint for evil-eye beads"],
  },
  {
    id: 'bluff_6',
    category: "Popular Science",
    prompt: "When ketchup first went on sale in 1830s America it wasn't sold as a sauce at all, but as [...].",
    realAnswer: "Medicine for diarrhoea",
    defaultFakes: ["Toothpaste", "Hair gel", "Wound ointment", "Insect repellent", "Eye drops"],
  },
  {
    id: 'bluff_7',
    category: "Strange Customs",
    prompt: "In Denmark, anyone still unmarried at 25 gets bags of [...] tipped over them in the street by their friends.",
    realAnswer: "Cinnamon",
    defaultFakes: ["Flour and eggs", "Mustard", "Tomato sauce", "Icing sugar", "Coffee beans"],
  },
  {
    id: 'bluff_8',
    category: "Space & Nature",
    prompt: "The crushing pressure in the atmospheres of Saturn and Jupiter means it quite literally rains [...] there.",
    realAnswer: "Diamonds",
    defaultFakes: ["Liquid gold", "Emerald dust", "Ice sculptures", "Sulphur", "Pure silver"],
  },
  {
    id: 'bluff_9',
    category: "Strange Laws",
    prompt: "By law, at least 35% of the songs played on Canadian radio must be [...].",
    realAnswer: "By Canadian artists",
    defaultFakes: ["Sung in French", "Clean and acoustic", "Featuring a guitar solo", "Advert-free", "Backed by classical music"],
  },
  {
    id: 'bluff_10',
    category: "Curious History",
    prompt: "In 1923 jockey Frank Hayes suffered a fatal heart attack mid-race, yet his horse crossed the line first — making him [...].",
    realAnswer: "The first dead jockey to win a race",
    defaultFakes: ["The first jockey stripped of his medal", "A hero carried by his horse", "The fastest jockey in history", "A rider who got his own statue", "The man who left his trophy to his horse"],
  },
  {
    id: 'bluff_11',
    category: "Strange Sports",
    prompt: "At a traditional annual race in England, competitors hurl themselves down a steep hill chasing a rolling [...].",
    realAnswer: "Wheel of cheese",
    defaultFakes: ["Giant watermelon", "Wooden barrel", "Royal crown", "Bronze cannonball", "Golden bell"],
  },
  {
    id: 'bluff_12',
    category: "Nature & Animals",
    prompt: "Flamingos stand on one leg even while sleeping and resting, because doing so [...].",
    realAnswer: "Keeps their body heat in",
    defaultFakes: ["Hides them from crocodiles", "Wakes them up faster", "Strengthens their muscles", "Balances them against the wind"],
  },
  {
    id: 'bluff_13',
    category: "Cinema & Art",
    prompt: "For the blood in the famous shower scene in Psycho, director Alfred Hitchcock used [...].",
    realAnswer: "Chocolate syrup",
    defaultFakes: ["Cherry jam", "Red ink", "Tomato paste", "Beetroot juice", "Red-dyed gel"],
  },
  {
    id: 'bluff_14',
    category: "History & War",
    prompt: "Liechtenstein's army marched off to the 1866 Austro-Prussian war with 80 soldiers and came home [...].",
    realAnswer: "With 81 men",
    defaultFakes: ["Without a single casualty", "With only one man left", "Having captured the enemy general", "Without firing a shot"],
  },
  {
    id: 'bluff_15',
    category: "Food & Kitchen",
    prompt: "Fredric Baur, who invented the Pringles tube and the crisp's curved shape, asked in his will that his ashes be buried in [...].",
    realAnswer: "A Pringles tube",
    defaultFakes: ["A potato field", "Frying oil", "The foundations of the crisp factory", "A giant salt shaker"],
  },
  {
    id: 'bluff_16',
    category: "Surprising Science",
    prompt: "Octopuses have 3 hearts and 9 brains, and because of copper-based haemocyanin their blood is [...].",
    realAnswer: "Blue",
    defaultFakes: ["Green", "Yellow", "Purple", "Clear / white"],
  },
  {
    id: 'bluff_17',
    category: "Tech History",
    prompt: "In 1999 Google's founders Larry Page and Sergey Brin tried to sell the company to Excite for $750,000, but Excite's CEO [...].",
    realAnswer: "Thought the price was too high",
    defaultFakes: ["Didn't like the name", "Lost the money at a casino", "Mistook Google for a virus", "Demanded a partnership instead"],
  },
  {
    id: 'bluff_18',
    category: "History & Kings",
    prompt: "On his doctor's advice, King Louis XIV of France took a bath just [...] times in his entire life.",
    realAnswer: "3",
    defaultFakes: ["1", "12", "0 (never)", "35"],
  },
  {
    id: 'bluff_19',
    category: "World Cultures",
    prompt: "Because of the traditional calendar used in Ethiopia, a year there is made up of [...] months.",
    realAnswer: "13",
    defaultFakes: ["10", "14", "8", "16"],
  },
  {
    id: 'bluff_20',
    category: "Space & Flight",
    prompt: "With no wind or rain on the Moon, Neil Armstrong's footprint will stay undisturbed for at least [...].",
    realAnswer: "100 million years",
    defaultFakes: ["1,000 years", "50,000 years", "Forever", "1 million years"],
  },
];

/** Geriye uyum: dil belirtilmeyen eski cagrilar Turkce havuzu gorur. */
export const BLUFF_QUESTIONS = BLUFF_QUESTIONS_TR;

export function getBluffQuestions(lang: ContentLang = 'tr'): BluffQuestion[] {
  return lang === 'en' ? BLUFF_QUESTIONS_EN : BLUFF_QUESTIONS_TR;
}

export function getRandomBluffQuestion(excludeIds: string[] = [], lang: ContentLang = 'tr'): BluffQuestion {
  const available = getBluffQuestions(lang).filter((q) => !excludeIds.includes(q.id));
  if (available.length === 0) {
    return getBluffQuestions(lang)[Math.floor(Math.random() * getBluffQuestions(lang).length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
