import { BluffQuestion } from '../types/partyGames';

export const BLUFF_QUESTIONS: BluffQuestion[] = [
  {
    id: 'bluff_1',
    category: 'Tuhaf Tarih',
    prompt: "18. yüzyılda İngiltere'de bazı aristokratlar, bahçelerine mistik ve bilge bir hava katması için canlı [...] kiralıyordu.",
    realAnswer: "Keşiş (İnzivacı)",
    defaultFakes: ["Panda", "Falcı papağan", "Cüce heykeltıraş", "Saray soytarısı", "Timsah"],
  },
  {
    id: 'bluff_2',
    category: 'Dünya Yasaları',
    prompt: "İsviçre'de hayvan hakları yasasına göre, yalnız kalıp depresyona girmemeleri için tek bir [...] beslemek yasa dışıdır.",
    realAnswer: "Ginepig (Kobay)",
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
    realAnswer: "Mikrofon ve Anten",
    defaultFakes: ["Uyku gazı kapsülü", "Zehirli iğne", "Minyatür kamera", "GPS vericisi", "Ses kayıt kaseti"],
  },
  {
    id: 'bluff_5',
    category: 'Tarih & Kültür',
    prompt: "Eski Roma'da gladyatörlerin teri ve vücut kirleri toplanıp zengin Romalı kadınlara [...] olarak satılıyordu.",
    realAnswer: "Cilt bakım kremi & Parfüm",
    defaultFakes: ["Aşk iksiri", "Kutsal şarap aroması", "Savaş muskası", "Diş beyazlatıcı", "Nazar boncuğu boyası"],
  },
  {
    id: 'bluff_6',
    category: 'Popüler Bilim',
    prompt: "Ketçap 1830'lu yıllarda Amerika'da ilk kez bir sos olarak değil, [...] olarak satılıyordu.",
    realAnswer: "Hazımsızlık ve İshal İlacı",
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
    realAnswer: "Kanadalı bir sanatçıya ait",
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
    realAnswer: "Büyük bir tekerlek peynir",
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
    realAnswer: "Çikolata sosu (Bosco)",
    defaultFakes: ["Vişne reçeli", "Kırmızı mürekkep", "Domates salçası", "Pancar suyu", "Kırmızı gıda boyalı jel"],
  },
  {
    id: 'bluff_14',
    category: 'Tarih & Savaş',
    prompt: "Liechtenstein ordusu 1866 Avusturya-Prusya savaşına 80 askerle katılmış ve savaştan [...] dönmüştür.",
    realAnswer: "81 kişi olarak (1 İtalyan dost edinerek)",
    defaultFakes: ["Yaralanmadan 0 kayıpla", "Sadece 1 kişi kalarak", "Karşı tarafın generalini esir alarak", "Hiç kurşun atmadan"],
  },
  {
    id: 'bluff_15',
    category: 'Yemek & Mutfak',
    prompt: "Pringles cipslerinin kutu tasarımını ve eğri silindir şeklini icat eden Fredric Baur, vasiyeti üzerine öldüğünde külleri [...] gömülmüştür.",
    realAnswer: "Bir Pringles kutusunun içine",
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
    realAnswer: "Teklifi çok pahalı bularak reddetmiştir",
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

export function getRandomBluffQuestion(excludeIds: string[] = []): BluffQuestion {
  const available = BLUFF_QUESTIONS.filter((q) => !excludeIds.includes(q.id));
  if (available.length === 0) {
    return BLUFF_QUESTIONS[Math.floor(Math.random() * BLUFF_QUESTIONS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
